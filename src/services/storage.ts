import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_TARGET_URL = '@tapo_health_last_target_url';
const KEY_AUTO_REFRESH_SECONDS = '@tapo_health_auto_refresh_seconds';
const KEY_FIRST_OPEN_SHOWN = '@tapo_health_first_open_shown';
const KEY_LAST_HEALTH_SNAPSHOT = '@tapo_health_last_snapshot';

export class StorageService {
  static async getLastTargetUrl(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEY_LAST_TARGET_URL);
    } catch {
      return null;
    }
  }

  static async saveLastTargetUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_LAST_TARGET_URL, url);
    } catch {}
  }

  static async getAutoRefreshSeconds(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(KEY_AUTO_REFRESH_SECONDS);
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 4;
  }

  static async saveAutoRefreshSeconds(seconds: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_AUTO_REFRESH_SECONDS, seconds.toString());
    } catch {}
  }

  static async isFirstOpenAlertShown(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEY_FIRST_OPEN_SHOWN);
      return val === 'true';
    } catch {
      return false;
    }
  }

  static async setFirstOpenAlertShown(shown: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_FIRST_OPEN_SHOWN, shown ? 'true' : 'false');
    } catch {}
  }

  static async saveLastHealthSnapshot(snapshot: {
    statusName: string;
    targetUrl: string;
    statusCode?: number | null;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(
        KEY_LAST_HEALTH_SNAPSHOT,
        JSON.stringify({
          ...snapshot,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {}
  }
}
