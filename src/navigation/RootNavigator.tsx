import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';

import { HealthMonitorScreen } from '../screens/HealthMonitorScreen';
import { AppConfigScreen } from '../screens/AppConfigScreen';
import { HealthService } from '../services/healthService';
import { PermissionHelper } from '../services/permissionHelper';
import { getTranslations } from '../constants/locales';
import { ServerHealthStatus, StatusThemePalette } from '../types/health';
import { AppConfig } from '../types/config';

interface Props {
  healthService: HealthService;
  currentStatus: ServerHealthStatus;
  palette: StatusThemePalette;
  onConfigApplied?: (config: AppConfig) => void;
  onStatusChanged?: (status: ServerHealthStatus) => void;
}

/**
 * 官方標準 React Navigation Native Bottom Tabs Navigator
 * 依據官方文件: https://reactnavigation.org/docs/native-bottom-tab-navigator/
 *
 * - iOS: 100% 蘋果原生 UITabBarController (SF Symbols: waveform.path.ecg / gearshape, 支援 Liquid Glass)
 * - Android: 100% 原生 Material 3 BottomNavigationView (@drawable/ic_tab_health, @drawable/ic_tab_config)
 * - 0% 自訂 CSS 樣式包裹，100% 系統原生行為與轉場動畫，完全相容於 Expo Go 與 Native Build
 */
const Tab = createNativeBottomTabNavigator();

export const RootNavigator: React.FC<Props> = ({
  healthService,
  currentStatus,
  palette,
  onConfigApplied,
  onStatusChanged,
}) => {
  const isTv = PermissionHelper.isTvDevice();
  const t = getTranslations();

  // Android TV 裝置使用單一全螢幕模式
  if (isTv) {
    return (
      <View style={[styles.container, { backgroundColor: palette.bgBottom }]}>
        <HealthMonitorScreen
          healthService={healthService}
          onConfigApplied={onConfigApplied}
          onStatusChanged={onStatusChanged}
        />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
      }}
    >
      <Tab.Screen
        name="HealthTab"
        options={{
          tabBarLabel: t.tabHealth,
          tabBarIcon: ({ focused }) =>
            Platform.OS === 'ios'
              ? {
                  type: 'sfSymbol',
                  name: focused ? 'waveform.path.ecg.rectangle.fill' : 'waveform.path.ecg',
                }
              : {
                  type: 'image',
                  source: { uri: 'ic_tab_health' },
                },
        }}
      >
        {() => (
          <HealthMonitorScreen
            healthService={healthService}
            onConfigApplied={onConfigApplied}
            onStatusChanged={onStatusChanged}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="ConfigTab"
        options={{
          tabBarLabel: t.tabAppConfig,
          tabBarIcon: ({ focused }) =>
            Platform.OS === 'ios'
              ? {
                  type: 'sfSymbol',
                  name: focused ? 'gearshape.fill' : 'gearshape',
                }
              : {
                  type: 'image',
                  source: { uri: 'ic_tab_config' },
                },
        }}
      >
        {() => (
          <AppConfigScreen
            status={currentStatus}
            onConfigApplied={onConfigApplied}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
