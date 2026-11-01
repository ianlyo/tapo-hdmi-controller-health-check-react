import { Platform, PermissionsAndroid } from 'react-native';
import * as Network from 'expo-network';

export class PermissionHelper {
  /**
   * Check if current device is a TV (e.g. Android TV, Apple TV)
   */
  static isTvDevice(): boolean {
    return Platform.isTV;
  }

  /**
   * Check and request local network / internet connectivity permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Check internet & network state permissions
        const networkState = await Network.getNetworkStateAsync();
        return networkState.isConnected ?? true;
      } else if (Platform.OS === 'ios') {
        // Trigger a lightweight local fetch to trigger iOS local network dialog
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 800);
          await fetch('http://127.0.0.1:38472/api/ping', {
            signal: controller.signal,
          }).catch(() => {});
          clearTimeout(timer);
        } catch {}
        return true;
      }
      return true;
    } catch {
      return true;
    }
  }

  static async checkPermission(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.isConnected ?? true;
    } catch {
      return true;
    }
  }
}
