import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusThemePalette } from '../types/health';

interface Props {
  text: string;
  palette: StatusThemePalette;
  isWide?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ text, palette, isWide = false }) => {
  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: `${palette.primary}33`,
          borderColor: `${palette.primary}55`,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.accent }]} />
      <Text
        style={[
          styles.badgeText,
          {
            color: palette.accent,
            fontSize: isWide ? 14 : 12.5,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
