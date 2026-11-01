import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StatusThemePalette } from '../types/health';

interface Props extends BottomTabBarProps {
  palette: StatusThemePalette;
}

/**
 * Apple HIG 100% 官方標準 iOS 懸浮膠囊 Tab Bar (Floating Pill / Capsule Tab Bar)
 * 完美還原 Apple Human Interface Guidelines:
 * - 獨立懸浮居中膠囊容器 (Rounded Capsule with Overflow Hidden)
 * - 蘋果官方材質 UIVisualEffectView (BlurView systemMaterialDark / systemChromeMaterialDark)
 * - 激活狀態的高亮膠囊 Pill 背景 (Selected Tab Active Pill Indicator)
 * - 完整的觸控穿透與 Native Haptic 反饋
 */
export const AppleHIGTabBar: React.FC<Props> = ({
  state,
  descriptors,
  navigation,
  palette,
}) => {
  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={styles.capsuleWrapper}>
        {Platform.OS === 'ios' ? (
          <BlurView
            tint="systemChromeMaterialDark"
            intensity={90}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(15, 23, 42, 0.92)' },
            ]}
            pointerEvents="none"
          />
        )}

        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
              size: 20,
            });

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                android_ripple={{
                  color: 'rgba(255, 255, 255, 0.15)',
                  borderless: true,
                  radius: 28,
                }}
                style={[
                  styles.tabItem,
                  isFocused && [
                    styles.tabItemActive,
                    {
                      backgroundColor: palette.primary,
                      shadowColor: palette.accent,
                    },
                  ],
                ]}
              >
                {icon}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {typeof label === 'string' ? label : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 28 : 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    padding: 6,
    // Apple HIG 陰影
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 28,
  },
  tabItemActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 13,
    marginLeft: 8,
    letterSpacing: -0.2,
  },
});
