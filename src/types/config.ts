export interface ServerConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  shortcutEndpoint?: string;
  timeoutMs?: number;
}

export interface AppConfig {
  flaskIp?: string | null;
  flaskPort?: number | null;
  shortcutEndpoint?: string | null;
  apiKey?: string | null;
  alertDelaySeconds?: number | null;
  flaskLanUrl?: string | null;
  rawJson?: Record<string, any>;
}

export enum ConfigErrorCode {
  invalidUrl = 'invalidUrl',
  jsonSyntaxError = 'jsonSyntaxError',
  forbidden403 = 'forbidden403',
  serverError = 'serverError',
  timeout = 'timeout',
  networkError = 'networkError',
}

export interface ConfigFetchResult {
  isSuccess: boolean;
  config?: AppConfig | null;
  rawJson?: string | null;
  errorCode?: ConfigErrorCode | null;
  rawErrorMessage?: string | null;
  statusCode?: number | null;
}
