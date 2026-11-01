import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface Props {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'systemThinMaterialDark' | 'systemMaterialDark' | 'systemThickMaterialDark' | 'systemChromeMaterialDark';
  children?: React.ReactNode;
  fallbackColor?: string;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

/**
 * NativeIOSBlur
 * 在 iOS 上採用 100% 蘋果原生 UIBlurEffect / UIVisualEffectView (透過 expo-blur 原生綁定)
 * 支援 iOS 系統標準毛玻璃質感 (systemMaterialDark / systemThinMaterialDark)，在 Android 上降級為深色半透明畫布
 * 支援 pointerEvents passthrough（讓底層或子元素原生精確接收觸控與手勢）
 */
export const NativeIOSBlur: React.FC<Props> = ({
  style,
  intensity = 55,
  tint = 'systemThinMaterialDark',
  children,
  fallbackColor = 'rgba(15, 23, 42, 0.75)',
  pointerEvents,
}) => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.overflowHidden, style]}
        pointerEvents={pointerEvents}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[{ backgroundColor: fallbackColor }, styles.overflowHidden, style]}
      pointerEvents={pointerEvents}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  overflowHidden: {
    overflow: 'hidden',
  },
});
