import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusThemePalette, ServerHealthStatus } from '../types/health';

interface Props {
  status: ServerHealthStatus;
  palette: StatusThemePalette;
  isWide?: boolean;
}

export const StatusIcon: React.FC<Props> = ({ status, palette, isWide = false }) => {
  const iconSize = isWide ? 96 : 76;
  const containerSize = isWide ? 160 : 124;

  const renderIcon = () => {
    if (status === ServerHealthStatus.checking) {
      return <ActivityIndicator size="large" color={palette.accent} />;
    }
    switch (status) {
      case ServerHealthStatus.healthy:
        return <Ionicons name="checkmark-circle" size={iconSize} color={palette.accent} />;
      case ServerHealthStatus.degraded:
        return <Ionicons name="warning" size={iconSize} color={palette.accent} />;
      case ServerHealthStatus.unreachable:
        return <Ionicons name="close-circle" size={iconSize} color={palette.accent} />;
      default:
        return <Ionicons name="sync-circle" size={iconSize} color={palette.accent} />;
    }
  };

  return (
    <View
      style={[
        styles.circle,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: `${palette.primary}1F`,
        },
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
