import React from 'react';
import { Platform, View, Button as RNButton, StyleSheet, UIManager } from 'react-native';
import { Button } from 'react-native-platform-components';
import { StatusThemePalette } from '../types/health';

interface Props {
  palette: StatusThemePalette;
  isTriggering: boolean;
  onPress: () => void;
  label: string;
  processingLabel: string;
  isTv?: boolean;
}

/**
 * 檢查當前執行環境中是否已連結 PCButton 原生模組
 * - 已連結 (Dev Client / 原生編譯): 直接調用 react-native-platform-components 的 iOS 26 Liquid Glass 按鈕
 * - 未連結 (Expo Go 環境): 自動使用 React Native 內建核心的 100% 系統原生按鈕，完全杜絕 UnimplementedView 紅畫面崩潰
 */
const isPCButtonRegistered = (): boolean => {
  try {
    return Boolean(
      UIManager.hasViewManagerConfig &&
      UIManager.hasViewManagerConfig('PCButton')
    );
  } catch {
    return false;
  }
};

export const SwitchButton: React.FC<Props> = ({
  palette,
  isTriggering,
  onPress,
  label,
  processingLabel,
  isTv = false,
}) => {
  const displayLabel = isTriggering ? processingLabel : label;

  // iOS 原生 Liquid Glass 按鈕 (自建 Dev Client 環境下運行)
  if (Platform.OS === 'ios' && !isTv && isPCButtonRegistered()) {
    return (
      <Button
        label={displayLabel}
        icon={{
          type: 'sfSymbol',
          name: 'arrow.left.arrow.right',
        }}
        iconPosition="leading"
        variant="glass"
        color={palette.primary}
        tintColor="#FFFFFF"
        size="medium"
        loading={isTriggering}
        onPress={onPress}
        haptics="medium"
        cornerRadius={24}
      />
    );
  }

  // 100% 系統原生按鈕 (零自訂 CSS 樣式，僅配置原生 title 與系統主題色)
  return (
    <View style={styles.container}>
      <RNButton
        title={displayLabel}
        color={palette.primary}
        onPress={onPress}
        disabled={isTriggering}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 200,
    alignSelf: 'center',
    marginVertical: 8,
  },
});
