import { ServerHealthStatus } from '../types/health';
import { ConfigErrorCode } from '../types/config';

export interface Translations {
  appName: string;
  badgeText: (status: ServerHealthStatus) => string;
  title: (status: ServerHealthStatus) => string;
  message: (status: ServerHealthStatus, code?: number | null) => string;
  switchHdmi: string;
  processing: string;
  tapToCopy: string;
  statusCopied: string;
  switchFailed: string;
  targetLocation: string;
  permissionDialogTitle: string;
  permissionDialogMessage: string;
  permissionRetry: string;
  permissionSkip: string;
  welcomeDialogTitle: (version?: string) => string;
  welcomeDialogMessage: (version?: string) => string;
  welcomeConfirm: string;
  tabHealth: string;
  tabAppConfig: string;
  configTitle: string;
  fetchRemote: string;
  parseJson: string;
  pasteJson: string;
  customJsonInput: string;
  collapseInput: string;
  parsedFields: string;
  rawJsonPayload: string;
  flaskIpLabel: string;
  flaskPortLabel: string;
  shortcutEndpointLabel: string;
  apiKeyLabel: string;
  alertDelayLabel: string;
  secondsUnit: string;
  copied: string;
  copyJson: string;
  none: string;
  notSet: string;
  jsonParseSuccess: string;
  jsonParseFailed: string;
  cannotConnectRemote: string;
  invalidUrl: string;
  cfBlocked403: string;
  serverError: string;
  requestTimeout: string;
  connectionFailed: string;
  configErrorMessage: (code?: ConfigErrorCode | null, raw?: string | null, status?: number | null) => string;
}

export const zhTW: Translations = {
  appName: 'Tapo IR HDMI Switcher',
  badgeText: (status) => {
    switch (status) {
      case ServerHealthStatus.healthy:
        return '正常';
      case ServerHealthStatus.degraded:
        return '受限 (403)';
      case ServerHealthStatus.unreachable:
        return '離線';
      case ServerHealthStatus.checking:
        return '檢查中';
    }
  },
  title: (status) => {
    switch (status) {
      case ServerHealthStatus.healthy:
        return '伺服器正常運行';
      case ServerHealthStatus.degraded:
        return '連線 IP 受限';
      case ServerHealthStatus.unreachable:
        return '伺服器未運行';
      case ServerHealthStatus.checking:
        return '正在檢查狀態...';
    }
  },
  message: (status, code) => {
    switch (status) {
      case ServerHealthStatus.healthy:
        return `主機 Flask 服務回應正常 (HTTP ${code ?? 204})`;
      case ServerHealthStatus.degraded:
        return '服務正常運行，但連線 IP 未在允許白名單中 (HTTP 403)';
      case ServerHealthStatus.unreachable:
        if (code === 502) {
          return '通道已連線，但主機 Flask 服務未啟動 (HTTP 502)';
        } else if (code === 530) {
          return '通道未連線，主機服務未執行或休眠中 (HTTP 530)';
        }
        return '無法連線至主機 Flask 服務，請確認主機是否已啟動服務';
      case ServerHealthStatus.checking:
        return '正在探測主機 Flask 伺服器狀態...';
    }
  },
  switchHdmi: '切換 HDMI',
  processing: '處理中...',
  tapToCopy: '點擊複製狀態',
  statusCopied: '已複製狀態',
  switchFailed: '切換 HDMI 失敗，請確認伺服器連線狀態',
  targetLocation: '目標位置: ',
  permissionDialogTitle: '需要區域網路權限',
  permissionDialogMessage: '未取得權限可能無法連線伺服器。若已開啟請點選「略過」。',
  permissionRetry: '重試',
  permissionSkip: '略過',
  welcomeDialogTitle: (version) => `歡迎使用 TapoPulse${version ? ` (v${version})` : ''}`,
  welcomeDialogMessage: (version) =>
    `歡迎使用本應用程式${version ? `（版本 v${version}）` : ''}！本工具提供 Mac Flask 伺服器健康狀態即時監控與 HDMI 控制功能。`,
  welcomeConfirm: '開始使用',
  tabHealth: '狀態',
  tabAppConfig: 'JSON',
  configTitle: 'JSON 解析',
  fetchRemote: '同步 JSON',
  parseJson: '套用',
  pasteJson: '貼上',
  customJsonInput: '自訂 JSON',
  collapseInput: '收起',
  parsedFields: 'JSON 欄位',
  rawJsonPayload: '原始 JSON',
  flaskIpLabel: '主機 IP',
  flaskPortLabel: '連接埠',
  shortcutEndpointLabel: '觸發端點',
  apiKeyLabel: 'API 金鑰',
  alertDelayLabel: '延遲時間',
  secondsUnit: '秒',
  copied: '已複製',
  copyJson: '複製 JSON',
  none: '無',
  notSet: '無',
  jsonParseSuccess: 'JSON 已套用',
  jsonParseFailed: 'JSON 格式錯誤',
  cannotConnectRemote: '無法取得 JSON',
  invalidUrl: '網址格式錯誤',
  cfBlocked403: 'HTTP 403: 存取受限',
  serverError: '伺服器錯誤',
  requestTimeout: '連線逾時',
  connectionFailed: '連線失敗',
  configErrorMessage: (code, raw, status) => {
    switch (code) {
      case ConfigErrorCode.invalidUrl:
        return '網址格式錯誤';
      case ConfigErrorCode.jsonSyntaxError:
        return `JSON 格式錯誤${raw ? ` (${raw})` : ''}`;
      case ConfigErrorCode.forbidden403:
        return 'HTTP 403: 存取受限';
      case ConfigErrorCode.serverError:
        return `伺服器錯誤 (HTTP ${status ?? 500})`;
      case ConfigErrorCode.timeout:
        return '連線逾時';
      case ConfigErrorCode.networkError:
        return `連線失敗${raw ? ` (${raw})` : ''}`;
      default:
        return '無法取得 JSON';
    }
  },
};

export const enUS: Translations = {
  appName: 'Tapo IR HDMI Switcher',
  badgeText: (status) => {
    switch (status) {
      case ServerHealthStatus.healthy:
        return 'Online';
      case ServerHealthStatus.degraded:
        return 'Blocked (403)';
      case ServerHealthStatus.unreachable:
        return 'Offline';
      case ServerHealthStatus.checking:
        return 'Checking';
    }
  },
  title: (status) => {
    switch (status) {
      case ServerHealthStatus.healthy:
        return 'Server Running Normally';
      case ServerHealthStatus.degraded:
        return 'Connection IP Restricted';
      case ServerHealthStatus.unreachable:
        return 'Server Offline';
      case ServerHealthStatus.checking:
        return 'Checking Status...';
    }
  },
  message: (status, code) => {
    switch (status) {
      case ServerHealthStatus.healthy:
        return `Host Flask service responding normally (HTTP ${code ?? 204})`;
      case ServerHealthStatus.degraded:
        return 'Service is running, but client IP is not in whitelist (HTTP 403)';
      case ServerHealthStatus.unreachable:
        if (code === 502) {
          return 'Tunnel connected, but host Flask service is not running (HTTP 502)';
        } else if (code === 530) {
          return 'Tunnel offline, host service inactive or sleeping (HTTP 530)';
        }
        return 'Cannot connect to host Flask service. Please ensure host is running';
      case ServerHealthStatus.checking:
        return 'Probing host Flask server status...';
    }
  },
  switchHdmi: 'Switch HDMI',
  processing: 'Processing...',
  tapToCopy: 'Tap to copy status',
  statusCopied: 'Server status copied to clipboard',
  switchFailed: 'Failed to switch HDMI. Please check server status',
  targetLocation: 'Target: ',
  permissionDialogTitle: 'Local Network Permission Required',
  permissionDialogMessage: 'Connecting to local server may fail without permission. Tap "Skip" if already allowed.',
  permissionRetry: 'Retry',
  permissionSkip: 'Skip',
  welcomeDialogTitle: (version) => `Welcome to TapoPulse${version ? ` (v${version})` : ''}`,
  welcomeDialogMessage: (version) =>
    `Welcome to this application${version ? ` (v${version})` : ''}! This tool provides real-time health monitoring and HDMI controls for your Mac Flask server.`,
  welcomeConfirm: 'Get Started',
  tabHealth: 'Status',
  tabAppConfig: 'JSON',
  configTitle: 'JSON Parser',
  fetchRemote: 'Sync JSON',
  parseJson: 'Apply',
  pasteJson: 'Paste',
  customJsonInput: 'Custom JSON',
  collapseInput: 'Collapse',
  parsedFields: 'JSON Fields',
  rawJsonPayload: 'Raw JSON',
  flaskIpLabel: 'Host IP',
  flaskPortLabel: 'Port',
  shortcutEndpointLabel: 'Endpoint',
  apiKeyLabel: 'API Key',
  alertDelayLabel: 'Delay',
  secondsUnit: 's',
  copied: 'Copied',
  copyJson: 'Copy JSON',
  none: 'None',
  notSet: 'None',
  jsonParseSuccess: 'JSON applied',
  jsonParseFailed: 'Invalid JSON format',
  cannotConnectRemote: 'Failed to fetch JSON',
  invalidUrl: 'Invalid URL',
  cfBlocked403: 'HTTP 403: Forbidden',
  serverError: 'Server error',
  requestTimeout: 'Timeout',
  connectionFailed: 'Connection failed',
  configErrorMessage: (code, raw, status) => {
    switch (code) {
      case ConfigErrorCode.invalidUrl:
        return 'Invalid URL';
      case ConfigErrorCode.jsonSyntaxError:
        return `Invalid JSON format${raw ? ` (${raw})` : ''}`;
      case ConfigErrorCode.forbidden403:
        return 'HTTP 403: Forbidden';
      case ConfigErrorCode.serverError:
        return `Server error (HTTP ${status ?? 500})`;
      case ConfigErrorCode.timeout:
        return 'Timeout';
      case ConfigErrorCode.networkError:
        return `Connection failed${raw ? ` (${raw})` : ''}`;
      default:
        return 'Failed to fetch JSON';
    }
  },
};

/**
 * Returns locale translation dictionary based on system or explicit language
 */
export function getTranslations(lang?: string): Translations {
  if (lang && lang.toLowerCase().startsWith('en')) {
    return enUS;
  }
  return zhTW;
}
