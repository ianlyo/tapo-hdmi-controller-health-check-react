import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';

import { HealthService } from './src/services/healthService';
import { ServerHealthStatus } from './src/types/health';
import { AppConfig } from './src/types/config';
import { getStatusPalette } from './src/constants/theme';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const healthService = useMemo(() => new HealthService(), []);
  const [currentStatus, setCurrentStatus] = useState<ServerHealthStatus>(
    ServerHealthStatus.checking
  );

  const palette = useMemo(() => getStatusPalette(currentStatus), [currentStatus]);

  const handleConfigApplied = useCallback((config: AppConfig) => {
    healthService.applyAppConfig(config);
  }, [healthService]);

  const navTheme = useMemo(() => ({
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: palette.bgBottom,
      card: palette.bgBottom,
      border: 'rgba(255, 255, 255, 0.08)',
      primary: palette.accent,
      text: '#FFFFFF',
    },
  }), [palette]);

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: palette.bgBottom }]}>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <RootNavigator
            healthService={healthService}
            currentStatus={currentStatus}
            palette={palette}
            onConfigApplied={handleConfigApplied}
            onStatusChanged={setCurrentStatus}
          />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
