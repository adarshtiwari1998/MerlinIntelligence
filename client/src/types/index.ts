export type SidebarNavItem = {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
};

export type SidebarSection = {
  title: string;
  items: SidebarNavItem[];
};

export type ModelStatus = {
  name: string;
  provider: string;
  avgLatency: string;
  status: "online" | "offline" | "degraded";
};

export type GatewayConfig = {
  caching: boolean;
  autoRouting: boolean;
  fallbackToPrimary: boolean;
};

export enum EditorLanguage {
  PYTHON = "python",
  JAVASCRIPT = "javascript",
  TYPESCRIPT = "typescript",
  HTML = "html",
  CSS = "css",
  JSON = "json",
  MARKDOWN = "markdown",
  PLAIN_TEXT = "plaintext"
}

export type EditorFile = {
  name: string;
  language: EditorLanguage;
  content: string;
  active?: boolean;
};
