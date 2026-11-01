import React from 'react';
import { ActionSheetIOS, Platform } from 'react-native';

export interface NativeActionSheetOption {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface NativeActionSheetProps {
  title?: string;
  message?: string;
  options: NativeActionSheetOption[];
}

/**
 * 叫出 100% 蘋果原生 iOS Action Sheet (UIAlertController .actionSheet)
 */
export const showNativeIOSActionSheet = ({
  title,
  message,
  options,
}: NativeActionSheetProps) => {
  if (Platform.OS === 'ios') {
    const optionTitles = options.map((o) => o.text);
    const cancelButtonIndex = options.findIndex((o) => o.style === 'cancel');
    const destructiveButtonIndex = options.findIndex((o) => o.style === 'destructive');

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: optionTitles,
        cancelButtonIndex: cancelButtonIndex >= 0 ? cancelButtonIndex : undefined,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
        userInterfaceStyle: 'dark',
      },
      (buttonIndex) => {
        if (buttonIndex >= 0 && buttonIndex < options.length) {
          const selected = options[buttonIndex];
          if (selected?.onPress) {
            selected.onPress();
          }
        }
      }
    );
  }
};
