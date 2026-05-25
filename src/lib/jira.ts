export const DEFAULT_JQL =
  "project = MK AND resolution = Unresolved ORDER BY duedate ASC";

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

export function getJiraConfig() {
  const baseUrl = process.env.JIRA_BASE_URL?.trim();
  const email = process.env.JIRA_EMAIL?.trim();
  const apiToken = process.env.JIRA_API_TOKEN?.trim();

  const missing = [
    !baseUrl && "JIRA_BASE_URL",
    !email && "JIRA_EMAIL",
    !apiToken && "JIRA_API_TOKEN",
  ].filter(Boolean) as string[];

  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }

  return {
    baseUrl: baseUrl!.replace(/\/$/, ""),
    email: email!,
    apiToken: apiToken!,
    jql: process.env.JIRA_JQL?.trim() || DEFAULT_JQL,
  };
}

export async function fetchJiraIssues(
  jql?: string,
  maxResults = 500
): Promise<JiraIssueDto[]> {
  const { baseUrl, email, apiToken, jql: defaultJql } = getJiraConfig();
  const query = jql?.trim() || defaultJql;
  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

  const issues: JiraIssueDto[] = [];
  let nextPageToken: string | undefined;

  while (issues.length < maxResults) {
    const payload: Record<string, unknown> = {
      jql: query,
      maxResults: Math.min(100, maxResults - issues.length),
      fields: SEARCH_FIELDS,
    };
    if (nextPageToken) payload.nextPageToken = nextPageToken;

    const res = await fetch(`${baseUrl}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Jira API ${res.status}: ${body.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
      issues?: Array<{ key: string; fields: Record<string, unknown> }>;
      isLast?: boolean;
      nextPageToken?: string;
    };

    for (const raw of data.issues ?? []) {
      issues.push(parseIssue(raw, baseUrl));
    }

    if (data.isLast !== false && (!data.issues?.length || data.isLast)) break;
    nextPageToken = data.nextPageToken;
    if (!nextPageToken) break;
  }

  return issues;
}

function parseIssue(
  raw: { key: string; fields: Record<string, unknown> },
  baseUrl: string
): JiraIssueDto {
  const fields = raw.fields;
  const status = fields.status as { name?: string } | undefined;
  const assignee = fields.assignee as { displayName?: string } | undefined;
  const priority = fields.priority as { name?: string } | undefined;
  const dueRaw = fields.duedate as string | undefined;

  return {
    key: raw.key,
    summary: (fields.summary as string) || "",
    status: status?.name || "—",
    assignee: assignee?.displayName ?? null,
    priority: priority?.name ?? null,
    dueDate: dueRaw ?? null,
    jiraUpdated: (fields.updated as string) ?? null,
    url: `${baseUrl}/browse/${raw.key}`,
  };
}
