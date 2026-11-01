import React, { Component, ReactNode, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabBar, TabBarItemProps } from 'react-native-platform-components';
import { StatusThemePalette } from '../types/health';
import { getTranslations } from '../constants/locales';
import { AppleHIGTabBar } from './AppleHIGTabBar';

interface Props extends BottomTabBarProps {
  palette: StatusThemePalette;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
}

/**
 * Real platform-native bottom navigation component powered by `react-native-platform-components`:
 * - iOS: UIKit `UITabBar` with SF Symbols, blur effects, Liquid Glass (iOS 26+), and haptic feedback.
 * - Android: Material 3 Expressive `NavigationBarView` / `BottomNavigationView` with native indicator pill and ripple.
 */
const NativePlatformTabBarComponent: React.FC<Props> = ({
  state,
  descriptors,
  navigation,
  palette,
}) => {
  const t = getTranslations();

  const items = useMemo<TabBarItemProps[]>(() => {
    return state.routes.map((route) => {
      const { options } = descriptors[route.key];
      const isHealth = route.name === 'HealthTab';

      const label =
        options.tabBarLabel !== undefined
          ? (options.tabBarLabel as string)
          : options.title !== undefined
          ? options.title
          : route.name;

      if (isHealth) {
        return {
          label: label || t.tabHealth,
          value: route.name,
          icon: {
            ios: { type: 'sfSymbol', name: 'waveform.path.ecg' },
            android: { type: 'drawable', name: 'ic_tab_health' },
          },
          selectedIcon: {
            ios: { type: 'sfSymbol', name: 'waveform.path.ecg.rectangle.fill' },
            android: { type: 'drawable', name: 'ic_tab_health' },
          },
          accessibilityLabel: options.tabBarAccessibilityLabel || t.tabHealth,
          testID: options.tabBarButtonTestID || 'tab-health',
        };
      }

      return {
        label: label || t.tabAppConfig,
        value: route.name,
        icon: {
          ios: { type: 'sfSymbol', name: 'gearshape' },
          android: { type: 'drawable', name: 'ic_tab_config' },
        },
        selectedIcon: {
          ios: { type: 'sfSymbol', name: 'gearshape.fill' },
          android: { type: 'drawable', name: 'ic_tab_config' },
        },
        accessibilityLabel: options.tabBarAccessibilityLabel || t.tabAppConfig,
        testID: options.tabBarButtonTestID || 'tab-config',
      };
    });
  }, [state.routes, descriptors, t]);

  const activeRouteName = state.routes[state.index]?.name ?? state.routes[0].name;

  const handleSelect = useCallback(
    (value: string) => {
      const route = state.routes.find((r) => r.name === value);
      if (!route) return;

      const isFocused = activeRouteName === value;
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [state.routes, activeRouteName, navigation]
  );

  const handleReselect = useCallback(
    (value: string) => {
      const route = state.routes.find((r) => r.name === value);
      if (!route) return;

      navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
    },
    [state.routes, navigation]
  );

  return (
    <View style={styles.container}>
      <TabBar
        items={items}
        selectedValue={activeRouteName}
        onSelect={handleSelect}
        onReselect={handleReselect}
        activeTintColor={palette.accent}
        inactiveTintColor="rgba(255, 255, 255, 0.6)"
        barColor={palette.bgBottom}
        labelVisibility="labeled"
        haptics="light"
        android={{
          indicatorColor: palette.primary,
          rippleColor: 'rgba(255, 255, 255, 0.15)',
          indicatorShape: 'pill',
          itemLayout: 'vertical',
        }}
      />
    </View>
  );
};

/**
 * Resilient wrapper that safely falls back to AppleHIGTabBar
 * if native platform components cannot be mounted (e.g. running inside Expo Go
 * or prior to running `npx expo run:android` / `npx expo run:ios`).
 */
export class NativePlatformTabBar extends Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any) {
    console.warn(
      '[NativePlatformTabBar] Failed to render native TabBar (likely running in Expo Go or native code unlinked). Falling back to AppleHIGTabBar.',
      error
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <AppleHIGTabBar {...this.props} />;
    }
    return <NativePlatformTabBarComponent {...this.props} />;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});
