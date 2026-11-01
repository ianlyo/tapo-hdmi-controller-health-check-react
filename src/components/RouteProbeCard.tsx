import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProbeResult, StatusThemePalette } from '../types/health';
import { Ionicons } from '@expo/vector-icons';
import { NativeIOSBlur } from './NativeIOSBlur';

interface Props {
  routes: RouteProbeResult[];
  palette: StatusThemePalette;
  isZh: boolean;
}

export const RouteProbeCard: React.FC<Props> = ({ routes, palette, isZh }) => {
  if (!routes || routes.length === 0) return null;

  return (
    <NativeIOSBlur
      intensity={45}
      tint="systemMaterialDark"
      fallbackColor={palette.cardBg}
      style={[
        styles.card,
        {
          borderColor: `${palette.cardBorder}40`,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="git-network-outline" size={16} color={palette.accent} />
        <Text style={[styles.headerTitle, { color: palette.accent }]}>
          {isZh ? '連線路徑探測' : 'Route Probes'}
        </Text>
      </View>

      {routes.map((route) => {
        const isSuccess = route.statusCode === 200 || route.statusCode === 204;
        const isBlocked = route.statusCode === 403;
        const badgeColor = isSuccess
          ? '#10B981'
          : isBlocked
          ? '#F59E0B'
          : '#EF4444';

        return (
          <View key={route.id} style={styles.routeRow}>
            <View style={styles.leftCol}>
              <Text style={styles.routeLabel}>
                {isZh ? route.labelZh : route.labelEn}
              </Text>
              <Text style={styles.routeUrl} numberOfLines={1}>
                {route.url}
              </Text>
            </View>

            <View style={styles.rightCol}>
              <View style={[styles.statusPill, { backgroundColor: `${badgeColor}25` }]}>
                <Text style={[styles.statusText, { color: badgeColor }]}>
                  {route.statusCode ? `HTTP ${route.statusCode}` : (route.error ?? 'Error')}
                </Text>
              </View>
              <Text style={styles.latencyText}>{route.latencyMs}ms</Text>
            </View>
          </View>
        );
      })}
    </NativeIOSBlur>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  routeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeUrl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  latencyText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
