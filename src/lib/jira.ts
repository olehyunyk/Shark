import {
  getBoard,
  getDefaultBoard,
  JIRA_SITE_URL,
  type JiraBoardConfig,
} from "@/config/jira-boards";

const SEARCH_FIELDS = [
  "summary",
  "status",
  "assignee",
  "priority",
  "duedate",
  "updated",
];

export type JiraIssueDto = {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  priority: string | null;
  dueDate: string | null;
  jiraUpdated: string | null;
  url: string;
};

type JiraSearchResponse = {
  issues?: Array<{ id?: string; key?: string; fields?: Record<string, unknown> }>;
  isLast?: boolean;
  nextPageToken?: string;
};

export function getJiraConfig(boardId?: string) {
  const board = getBoard(boardId);
  const email = process.env.JIRA_EMAIL?.trim();
  const apiToken = process.env.JIRA_API_TOKEN?.trim();

  const missing = [
    !email && "JIRA_EMAIL",
    !apiToken && "JIRA_API_TOKEN",
  ].filter(Boolean) as string[];

  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }

  const jqlOverride = process.env.JIRA_JQL?.trim();

  return {
    baseUrl: JIRA_SITE_URL,
    email: email!,
    apiToken: apiToken!,
    board,
    jql: jqlOverride || board.jql,
  };
}

function authHeader(email: string, apiToken: string) {
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
}

async function searchPage(
  baseUrl: string,
  auth: string,
  query: string,
  maxResults: number,
  nextPageToken?: string,
  useFields = true
): Promise<JiraSearchResponse> {
  const body: Record<string, unknown> = {
    jql: query,
    maxResults,
    fieldsByKeys: false,
  };
  if (useFields) body.fields = SEARCH_FIELDS;
  if (nextPageToken) body.nextPageToken = nextPageToken;

  const res = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as JiraSearchResponse;
}

async function searchPageGet(
  baseUrl: string,
  auth: string,
  query: string,
  maxResults: number,
  nextPageToken?: string
): Promise<JiraSearchResponse> {
  const url = new URL(`${baseUrl}/rest/api/3/search/jql`);
  url.searchParams.set("jql", query);
  url.searchParams.set("maxResults", String(maxResults));
  for (const f of SEARCH_FIELDS) url.searchParams.append("fields", f);
  if (nextPageToken) url.searchParams.set("nextPageToken", nextPageToken);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", Authorization: auth },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API GET ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as JiraSearchResponse;
}

async function fetchAllPages(
  baseUrl: string,
  auth: string,
  query: string,
  maxResults: number,
  searchFn: typeof searchPage
): Promise<JiraIssueDto[]> {
  const issues: JiraIssueDto[] = [];
  let nextPageToken: string | undefined;
  let pages = 0;

  while (issues.length < maxResults && pages < 20) {
    pages++;
    const pageSize = Math.min(100, maxResults - issues.length);
    const data = await searchFn(
      baseUrl,
      auth,
      query,
      pageSize,
      nextPageToken
    );

    const batch = data.issues ?? [];
    for (const raw of batch) {
      const parsed = parseIssue(raw, baseUrl);
      if (parsed.key) issues.push(parsed);
    }

    if (data.isLast === true) break;
    nextPageToken = data.nextPageToken;
    if (!nextPageToken) break;
    if (batch.length === 0) break;
  }

  return issues;
}

export async function fetchJiraIssues(
  jql?: string,
  maxResults = 500,
  boardId?: string
): Promise<JiraIssueDto[]> {
  const { baseUrl, email, apiToken, jql: defaultJql } = getJiraConfig(boardId);
  const query = jql?.trim() || defaultJql;
  const auth = authHeader(email, apiToken);

  let issues = await fetchAllPages(
    baseUrl,
    auth,
    query,
    maxResults,
    searchPage
  );

  if (issues.length === 0) {
    issues = await fetchAllPages(
      baseUrl,
      auth,
      query,
      maxResults,
      (b, a, q, m, t) => searchPage(b, a, q, m, t, false)
    );
  }

  if (issues.length === 0) {
    issues = await fetchAllPages(
      baseUrl,
      auth,
      query,
      maxResults,
      searchPageGet
    );
  }

  return issues;
}

export async function probeJiraSearch(boardId?: string) {
  const { baseUrl, jql: activeJql, board } = getJiraConfig(boardId);
  const issues = await fetchJiraIssues(activeJql, 50, boardId);
  return {
    baseUrl,
    board: board.id,
    activeJql,
    count: issues.length,
    sampleKeys: issues.slice(0, 10).map((i) => i.key),
  };
}

export { getDefaultBoard, type JiraBoardConfig };

function parseIssue(
  raw: { id?: string; key?: string; fields?: Record<string, unknown> },
  baseUrl: string
): JiraIssueDto {
  const fields = raw.fields ?? {};
  const status = fields.status as { name?: string } | undefined;
  const assignee = fields.assignee as { displayName?: string } | undefined;
  const priority = fields.priority as { name?: string } | undefined;
  const dueRaw = fields.duedate as string | undefined;

  let key = raw.key ?? "";
  if (!key && raw.id) {
    const m = String(raw.id).match(/^(MK-\d+)$/i);
    if (m) key = m[1].toUpperCase();
  }

  return {
    key,
    summary: (fields.summary as string) || "",
    status: status?.name || "—",
    assignee: assignee?.displayName ?? null,
    priority: priority?.name ?? null,
    dueDate: dueRaw ?? null,
    jiraUpdated: (fields.updated as string) ?? null,
    url: key ? `${baseUrl}/browse/${key}` : baseUrl,
  };
}
