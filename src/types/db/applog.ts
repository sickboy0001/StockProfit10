export type AppLog = {
  id: number;
  timestamp: string; // ISO 8601 string
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: unknown;
  user_id?: string;
  source?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
  path?: string;
};
