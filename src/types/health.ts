export enum ServerHealthStatus {
  checking = 'checking',
  healthy = 'healthy', // 204 / 200 Ping OK -> Mac Python Flask is running normally
  degraded = 'degraded', // 403 Forbidden -> Mac Python Flask is running, but IP is blocked
  unreachable = 'unreachable', // 502 / 530 / Timeout / Refused -> Flask is not running or offline
}

export interface RouteProbeResult {
  id: string; // 'cloudflare', 'lan', 'local'
  labelZh: string;
  labelEn: string;
  url: string;
  isAlive: boolean;
  statusCode?: number | null;
  latencyMs: number;
  error?: string | null;
}

export interface HealthCheckResult {
  status: ServerHealthStatus;
  timestamp: Date;
  targetUrl: string;
  pingLatencyMs?: number | null;
  pingStatusCode?: number | null;
  routes: RouteProbeResult[];
}

export interface StatusThemePalette {
  primary: string;
  accent: string;
  bgTop: string;
  bgBottom: string;
  cardBg: string;
  cardBorder: string;
  iconName: string;
}
