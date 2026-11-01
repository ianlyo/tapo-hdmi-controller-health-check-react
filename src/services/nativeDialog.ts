import { Alert, Platform } from 'react-native';
import * as Application from 'expo-application';

export type NativeDialogResult = 'positive' | 'negative' | 'dismissed';

export interface NativeAlertOptions {
  title: string;
  message: string;
  positiveButtonText: string;
  negativeButtonText?: string;
  cancelable?: boolean;
}

export class NativeDialogService {
  /**
   * Retrieves the native application version from host OS
   */
  static async getAppVersion(): Promise<string> {
    try {
      const version = Application.nativeApplicationVersion;
      return version || '1.4.1';
    } catch {
      return '1.4.1';
    }
  }

  /**
   * Displays the true OEM host platform dialog
   * - iOS: UIAlertController
   * - Android: android.app.AlertDialog
   */
  static showNativeAlert(options: NativeAlertOptions): Promise<NativeDialogResult> {
    return new Promise((resolve) => {
      const buttons: any[] = [];

      if (options.negativeButtonText) {
        buttons.push({
          text: options.negativeButtonText,
          style: 'cancel',
          onPress: () => resolve('negative'),
        });
      }

      buttons.push({
        text: options.positiveButtonText,
        style: 'default',
        onPress: () => resolve('positive'),
      });

      Alert.alert(
        options.title,
        options.message,
        buttons,
        {
          cancelable: options.cancelable ?? false,
          onDismiss: () => resolve('dismissed'),
        }
      );
    });
  }
}
