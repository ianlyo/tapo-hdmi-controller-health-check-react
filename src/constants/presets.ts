import { ServerConfig, AppConfig } from '../types/config';

export const SERVER_PRESETS: ServerConfig[] = [
  {
    id: 'localhost',
    name: 'Localhost (Mac)',
    baseUrl: 'http://127.0.0.1:38472',
    timeoutMs: 1500,
  },
  {
    id: 'lan_default',
    name: 'LAN Server (192.168.50.x)',
    baseUrl: 'http://192.168.50.10:38472',
    timeoutMs: 2500,
  },
  {
    id: 'android_emulator',
    name: 'Android Emulator Host (10.0.2.2)',
    baseUrl: 'http://10.0.2.2:38472',
    timeoutMs: 2500,
  },
  {
    id: 'cloudflare_tunnel',
    name: 'Cloudflare Tunnel',
    baseUrl: 'https://hdmi-mac-flask.linnu.dpdns.org',
    timeoutMs: 4000,
  },
  {
    id: 'cloudflare_worker_config',
    name: 'Worker Config Service',
    baseUrl: 'https://hdmi-app-config.linnu.dpdns.org',
    timeoutMs: 3500,
  },
];

export const DEFAULT_APP_CONFIG: AppConfig = {
  flaskIp: '192.168.50.126',
  flaskPort: 38472,
  shortcutEndpoint: 'hdmi_px_2',
  apiKey: 'my_secure_tv_key_2026',
  alertDelaySeconds: 15,
  rawJson: {
    flask_ip: '192.168.50.126',
    flask_port: 38472,
    shortcut_endpoint: 'hdmi_px_2',
    api_key: 'my_secure_tv_key_2026',
    alert_delay_seconds: 15,
  },
};
