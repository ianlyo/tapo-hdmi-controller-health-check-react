import { AppConfig, ServerConfig } from '../types/config';
import {
  ServerHealthStatus,
  RouteProbeResult,
  HealthCheckResult,
} from '../types/health';
import { SERVER_PRESETS } from '../constants/presets';

export interface PingResult {
  isAlive: boolean;
  statusCode?: number | null;
  latencyMs: number;
  message: string;
}

export class HealthService {
  static readonly appUserAgent = 'TapoHDMISwitcher (HealthCheck-RN)';

  private discoveredFlaskIp: string | null = null;
  private discoveredFlaskPort: number | null = null;
  private discoveredLanUrl: string | null = null;
  private discoveredShortcutEndpoint: string = 'hdmi_px_2';
  private discoveredApiKey: string = 'my_secure_tv_key_2026';
  private workerConfigFetched: boolean = false;
  private customConfigLocked: boolean = false;

  get shortcutEndpoint(): string {
    return this.discoveredShortcutEndpoint;
  }

  get apiKey(): string {
    return this.discoveredApiKey;
  }

  applyAppConfig(config: AppConfig): void {
    this.customConfigLocked = true;
    if (config.flaskPort && config.flaskPort > 0) {
      this.discoveredFlaskPort = config.flaskPort;
    }
    if (config.flaskIp && config.flaskIp.trim().length > 0) {
      this.discoveredFlaskIp = this.cleanUrl(config.flaskIp, this.discoveredFlaskPort);
    }
    if (config.flaskLanUrl && config.flaskLanUrl.trim().length > 0) {
      this.discoveredLanUrl = this.cleanUrl(config.flaskLanUrl, this.discoveredFlaskPort);
    }
    if (config.shortcutEndpoint && config.shortcutEndpoint.trim().length > 0) {
      this.discoveredShortcutEndpoint = config.shortcutEndpoint.trim();
    }
    if (config.apiKey && config.apiKey.trim().length > 0) {
      this.discoveredApiKey = config.apiKey.trim();
    }
    this.workerConfigFetched = true;
  }

  cleanUrl(baseUrl: string, defaultPort?: number | null): string {
    let url = baseUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const isIpOrLocal =
        /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}/.test(url) ||
        url.startsWith('localhost') ||
        url.startsWith('127.0.0.1');
      url = isIpOrLocal ? `http://${url}` : `https://${url}`;
    }
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (defaultPort && defaultPort !== 80 && defaultPort !== 443) {
      try {
        const parsed = new URL(url);
        if (!parsed.port) {
          url = `${url}:${defaultPort}`;
        }
      } catch {}
    }
    return url;
  }

  async checkPing(config: ServerConfig): Promise<PingResult> {
    const baseUrl = this.cleanUrl(config.baseUrl);
    const targetUrl = `${baseUrl}/api/ping`;
    const start = performance.now();
    const timeoutMs = config.timeoutMs ?? 3000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': HealthService.appUserAgent,
          'Accept': '*/*',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - start);
      const code = res.status;

      if (code === 204 || code === 200) {
        return {
          isAlive: true,
          statusCode: code,
          latencyMs,
          message: `OK (${code})`,
        };
      } else if (code === 403) {
        return {
          isAlive: true,
          statusCode: 403,
          latencyMs,
          message: '403 Forbidden (IP Restricted)',
        };
      } else {
        return {
          isAlive: false,
          statusCode: code,
          latencyMs,
          message: `HTTP ${code}`,
        };
      }
    } catch (err: any) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - start);
      if (err.name === 'AbortError') {
        return {
          isAlive: false,
          latencyMs,
          message: 'Timeout',
        };
      }
      return {
        isAlive: false,
        latencyMs,
        message: 'Unreachable',
      };
    }
  }

  async fetchWorkerConfig(): Promise<void> {
    if (this.customConfigLocked) return;
    try {
      const workerUrl = this.cleanUrl(
        SERVER_PRESETS.find((p) => p.id === 'cloudflare_worker_config')!.baseUrl
      );
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(workerUrl, {
        method: 'GET',
        headers: {
          'User-Agent': HealthService.appUserAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 200) {
        const decoded = await res.json();
        if (typeof decoded === 'object' && decoded !== null) {
          if (decoded.flask_port) {
            this.discoveredFlaskPort = parseInt(decoded.flask_port, 10);
          }
          if (decoded.flask_ip) {
            this.discoveredFlaskIp = this.cleanUrl(
              decoded.flask_ip,
              this.discoveredFlaskPort
            );
          }
          if (decoded.flask_lan_url) {
            this.discoveredLanUrl = this.cleanUrl(
              decoded.flask_lan_url,
              this.discoveredFlaskPort
            );
          }
          if (decoded.shortcut_endpoint) {
            this.discoveredShortcutEndpoint = decoded.shortcut_endpoint.trim();
          }
          if (decoded.api_key) {
            this.discoveredApiKey = decoded.api_key.trim();
          }
        }
      }
    } catch {
      // Ignore worker discovery error, fallbacks will be used
    } finally {
      this.workerConfigFetched = true;
    }
  }

  async triggerSwitch(): Promise<boolean> {
    if (!this.workerConfigFetched) {
      await this.fetchWorkerConfig();
    }

    const endpoint = this.discoveredShortcutEndpoint;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const path = cleanEndpoint.startsWith('api/webhook/')
      ? cleanEndpoint
      : `api/webhook/${cleanEndpoint}`;

    const apiKey = this.discoveredApiKey;
    const primaryUrl =
      this.discoveredFlaskIp ?? 'https://hdmi-mac-flask.linnu.dpdns.org';
    const isPrimaryLanIp =
      primaryUrl.includes('192.168.') ||
      primaryUrl.includes('10.0.') ||
      primaryUrl.includes('127.0.0.1');

    const candidates: string[] = [];
    if (this.discoveredLanUrl && this.discoveredLanUrl.length > 0) {
      candidates.push(this.discoveredLanUrl);
    }
    if (!isPrimaryLanIp) {
      candidates.push('http://127.0.0.1:38472');
    }
    candidates.push(primaryUrl);
    candidates.push('https://hdmi-mac-flask.linnu.dpdns.org');

    const uniqueBases = Array.from(new Set(candidates.map((b) => this.cleanUrl(b))));
    const candidateUrls = uniqueBases.map((b) => `${b}/${path}`);

    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'User-Agent': HealthService.appUserAgent,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
          signal: controller.signal,
        });

        clearTimeout(timer);
        if (res.status >= 200 && res.status < 300) {
          return true;
        }
      } catch {
        // Continue to try next candidate base URL
      }
    }

    return false;
  }

  async checkMacFlaskStatus(): Promise<HealthCheckResult> {
    if (!this.workerConfigFetched) {
      await this.fetchWorkerConfig();
    } else {
      this.fetchWorkerConfig().catch(() => {});
    }

    const primaryUrl =
      this.discoveredFlaskIp ?? 'https://hdmi-mac-flask.linnu.dpdns.org';
    const isPrimaryLanIp =
      primaryUrl.includes('192.168.') ||
      primaryUrl.includes('10.0.') ||
      primaryUrl.includes('127.0.0.1');

    const candidates: {
      id: string;
      zh: string;
      en: string;
      config: ServerConfig;
    }[] = [
      {
        id: isPrimaryLanIp ? 'lan_primary' : 'cloudflare',
        zh: isPrimaryLanIp ? '區網伺服器' : '遠端通道',
        en: isPrimaryLanIp ? 'LAN Server' : 'Cloudflare Tunnel',
        config: {
          id: isPrimaryLanIp ? 'lan_primary' : 'cloudflare_tunnel',
          name: isPrimaryLanIp ? 'LAN Server' : 'Cloudflare Tunnel',
          baseUrl: primaryUrl,
          timeoutMs: 3500,
        },
      },
    ];

    if (
      this.discoveredLanUrl &&
      this.discoveredLanUrl.length > 0 &&
      this.discoveredLanUrl !== primaryUrl
    ) {
      candidates.push({
        id: 'lan',
        zh: '區網直連',
        en: 'LAN Direct',
        config: {
          id: 'lan_discovered',
          name: 'LAN Direct',
          baseUrl: this.discoveredLanUrl,
          timeoutMs: 2000,
        },
      });
    } else if (!isPrimaryLanIp) {
      candidates.push({
        id: 'local',
        zh: '本機直連',
        en: 'Local Mac',
        config: {
          id: 'localhost',
          name: 'Local Mac',
          baseUrl: 'http://127.0.0.1:38472',
          timeoutMs: 1500,
        },
      });
    }

    const probes: RouteProbeResult[] = await Promise.all(
      candidates.map(async (c) => {
        const res = await this.checkPing(c.config);
        return {
          id: c.id,
          labelZh: c.zh,
          labelEn: c.en,
          url: c.config.baseUrl,
          isAlive: res.isAlive,
          statusCode: res.statusCode,
          latencyMs: res.latencyMs,
          error: res.isAlive ? null : res.message,
        };
      })
    );

    // 1. Healthy route found (HTTP 204 / 200)
    const healthyRoutes = probes
      .filter((p) => p.statusCode === 204 || p.statusCode === 200)
      .sort((a, b) => a.latencyMs - b.latencyMs);

    if (healthyRoutes.length > 0) {
      const winner = healthyRoutes[0];
      return {
        status: ServerHealthStatus.healthy,
        timestamp: new Date(),
        targetUrl: winner.url,
        pingLatencyMs: winner.latencyMs,
        pingStatusCode: winner.statusCode,
        routes: probes,
      };
    }

    // 2. Restricted route found (HTTP 403 Forbidden)
    const restrictedRoutes = probes.filter((p) => p.statusCode === 403);
    if (restrictedRoutes.length > 0) {
      const winner = restrictedRoutes[0];
      return {
        status: ServerHealthStatus.degraded,
        timestamp: new Date(),
        targetUrl: winner.url,
        pingLatencyMs: winner.latencyMs,
        pingStatusCode: winner.statusCode,
        routes: probes,
      };
    }

    // 3. Otherwise unreachable
    const primary = probes[0];
    return {
      status: ServerHealthStatus.unreachable,
      timestamp: new Date(),
      targetUrl: primary.url,
      pingLatencyMs: primary.latencyMs,
      pingStatusCode: primary.statusCode,
      routes: probes,
    };
  }
}
