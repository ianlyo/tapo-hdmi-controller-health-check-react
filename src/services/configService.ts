import { AppConfig, ConfigFetchResult, ConfigErrorCode } from '../types/config';

export class ConfigService {
  static readonly defaultEndpoint = 'https://hdmi-app-config.linnu.dpdns.org';
  static readonly appUserAgent = 'TapoHDMISwitcher (HealthCheck-RN)';

  /**
   * Fetches App Config JSON from remote Cloudflare Worker
   */
  static async fetchConfig(endpointUrl?: string): Promise<ConfigFetchResult> {
    const target = (endpointUrl && endpointUrl.trim().length > 0)
      ? endpointUrl.trim()
      : ConfigService.defaultEndpoint;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      return {
        isSuccess: false,
        errorCode: ConfigErrorCode.invalidUrl,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(target, {
        method: 'GET',
        headers: {
          'User-Agent': ConfigService.appUserAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const statusCode = response.status;
      const rawText = await response.text();

      if (statusCode === 403) {
        return {
          isSuccess: false,
          errorCode: ConfigErrorCode.forbidden403,
          statusCode,
          rawJson: rawText,
        };
      }

      if (statusCode < 200 || statusCode >= 300) {
        return {
          isSuccess: false,
          errorCode: ConfigErrorCode.serverError,
          statusCode,
          rawJson: rawText,
        };
      }

      try {
        const decoded = JSON.parse(rawText);
        if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
          return {
            isSuccess: false,
            errorCode: ConfigErrorCode.jsonSyntaxError,
            rawErrorMessage: 'Expected JSON object',
            rawJson: rawText,
          };
        }

        const config: AppConfig = {
          flaskIp: decoded.flask_ip ?? null,
          flaskPort: typeof decoded.flask_port === 'number' ? decoded.flask_port : (decoded.flask_port ? parseInt(decoded.flask_port, 10) : null),
          shortcutEndpoint: decoded.shortcut_endpoint ?? null,
          apiKey: decoded.api_key ?? null,
          alertDelaySeconds: typeof decoded.alert_delay_seconds === 'number' ? decoded.alert_delay_seconds : (decoded.alert_delay_seconds ? parseInt(decoded.alert_delay_seconds, 10) : null),
          flaskLanUrl: decoded.flask_lan_url ?? null,
          rawJson: decoded,
        };

        return {
          isSuccess: true,
          config,
          rawJson: JSON.stringify(decoded, null, 2),
          statusCode,
        };
      } catch (err: any) {
        return {
          isSuccess: false,
          errorCode: ConfigErrorCode.jsonSyntaxError,
          rawErrorMessage: err?.message || 'JSON parse error',
          rawJson: rawText,
        };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          isSuccess: false,
          errorCode: ConfigErrorCode.timeout,
        };
      }
      return {
        isSuccess: false,
        errorCode: ConfigErrorCode.networkError,
        rawErrorMessage: err?.message || 'Connection failed',
      };
    }
  }

  /**
   * Helper to parse and validate custom JSON text
   */
  static parseCustomJson(text: string): { config: AppConfig; formatted: string } {
    const trimmed = text.trim();
    const decoded = JSON.parse(trimmed);
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
      throw new Error('Expected JSON object');
    }

    const config: AppConfig = {
      flaskIp: decoded.flask_ip ?? null,
      flaskPort: typeof decoded.flask_port === 'number' ? decoded.flask_port : (decoded.flask_port ? parseInt(decoded.flask_port, 10) : null),
      shortcutEndpoint: decoded.shortcut_endpoint ?? null,
      apiKey: decoded.api_key ?? null,
      alertDelaySeconds: typeof decoded.alert_delay_seconds === 'number' ? decoded.alert_delay_seconds : (decoded.alert_delay_seconds ? parseInt(decoded.alert_delay_seconds, 10) : null),
      flaskLanUrl: decoded.flask_lan_url ?? null,
      rawJson: decoded,
    };

    return {
      config,
      formatted: JSON.stringify(decoded, null, 2),
    };
  }
}
