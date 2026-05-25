/** SharksCode Jira — захардкожено; нові борди додавайте в BOARDS. */
export const JIRA_SITE_URL = "https://sharkscode.atlassian.net";

export type JiraBoardConfig = {
  id: string;
  projectKey: string;
  name: string;
  /** Посилання на борду в UI Jira */
  boardUrl: string;
  jql: string;
  default?: boolean;
};

export const JIRA_BOARDS: JiraBoardConfig[] = [
  {
    id: "mk",
    projectKey: "MK",
    name: "MK",
    boardUrl: `${JIRA_SITE_URL}/browse/MK`,
    jql: "project = MK AND statusCategory != Done ORDER BY duedate ASC",
    default: true,
  },
];

export function getDefaultBoard(): JiraBoardConfig {
  const board = JIRA_BOARDS.find((b) => b.default) ?? JIRA_BOARDS[0];
  if (!board) throw new Error("No Jira boards configured");
  return board;
}

export function getBoard(id?: string): JiraBoardConfig {
  if (!id) return getDefaultBoard();
  const board = JIRA_BOARDS.find((b) => b.id === id);
  if (!board) throw new Error(`Unknown board: ${id}`);
  return board;
}
