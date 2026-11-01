import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  ToastAndroid,
  Platform,
  AppState,
  AppStateStatus,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import {
  ServerHealthStatus,
  HealthCheckResult,
} from '../types/health';
import { AppConfig } from '../types/config';
import { getStatusPalette } from '../constants/theme';
import { getTranslations } from '../constants/locales';
import { HealthService } from '../services/healthService';
import { StorageService } from '../services/storage';
import { NativeDialogService } from '../services/nativeDialog';
import { PermissionHelper } from '../services/permissionHelper';
import { showNativeIOSActionSheet } from '../services/nativeIOSActionSheet';

import { AmbientGlowBackground } from '../components/AmbientGlowBackground';
import { StatusIcon } from '../components/StatusIcon';
import { StatusBadge } from '../components/StatusBadge';
import { SwitchButton } from '../components/SwitchButton';
import { RouteProbeCard } from '../components/RouteProbeCard';

interface Props {
  healthService: HealthService;
  onConfigApplied?: (config: AppConfig) => void;
  onStatusChanged?: (status: ServerHealthStatus) => void;
}

export const HealthMonitorScreen: React.FC<Props> = ({
  healthService,
  onConfigApplied,
  onStatusChanged,
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const isTv = PermissionHelper.isTvDevice();

  const [healthResult, setHealthResult] = useState<HealthCheckResult>({
    status: ServerHealthStatus.checking,
    timestamp: new Date(),
    targetUrl: 'https://hdmi-mac-flask.linnu.dpdns.org',
    routes: [],
  });
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [pollInterval, setPollInterval] = useState<number>(4);
  const isPollingRef = useRef<boolean>(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = getTranslations();
  const isZh = true;
  const palette = getStatusPalette(healthResult.status);

  // Health poll function
  const executePoll = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const res = await healthService.checkMacFlaskStatus();
      setHealthResult(res);
      onStatusChanged?.(res.status);
      StorageService.saveLastHealthSnapshot({
        statusName: res.status,
        targetUrl: res.targetUrl,
        statusCode: res.pingStatusCode,
      });
    } catch {
      // Keep previous or fallback
    } finally {
      isPollingRef.current = false;
    }
  }, [healthService]);

  const startPolling = useCallback((intervalSec: number) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    executePoll();
    pollTimerRef.current = setInterval(executePoll, intervalSec * 1000);
  }, [executePoll]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Startup lifecycle & permission flow
  useEffect(() => {
    let mounted = true;

    async function initFlow() {
      // 1. Load saved config & intervals
      const savedUrl = await StorageService.getLastTargetUrl();
      if (savedUrl && mounted) {
        setHealthResult((prev) => ({ ...prev, targetUrl: savedUrl }));
      }
      const savedInterval = await StorageService.getAutoRefreshSeconds();
      if (mounted) {
        setPollInterval(savedInterval);
      }

      // 2. First open welcome dialog
      const shown = await StorageService.isFirstOpenAlertShown();
      if (!shown) {
        await StorageService.setFirstOpenAlertShown(true);
        const version = await NativeDialogService.getAppVersion();
        await NativeDialogService.showNativeAlert({
          title: t.welcomeDialogTitle(version),
          message: t.welcomeDialogMessage(version),
          positiveButtonText: t.welcomeConfirm,
        });
      }

      // 3. Permission check
      const granted = await PermissionHelper.requestPermission();
      if (!granted && mounted) {
        const dialogRes = await NativeDialogService.showNativeAlert({
          title: t.permissionDialogTitle,
          message: t.permissionDialogMessage,
          positiveButtonText: t.permissionRetry,
          negativeButtonText: t.permissionSkip,
        });
        if (dialogRes === 'positive') {
          await PermissionHelper.requestPermission();
        }
      }

      if (mounted) {
        startPolling(savedInterval);
      }
    }

    initFlow();

    // App state listener to pause polling when backgrounded
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        startPolling(pollInterval);
      } else {
        stopPolling();
      }
    });

    return () => {
      mounted = false;
      stopPolling();
      subscription.remove();
    };
  }, [startPolling, stopPolling, pollInterval, t]);

  // Handle Switch Trigger
  const handleTrigger = async () => {
    if (isTriggering) return;
    setIsTriggering(true);

    try {
      const ok = await healthService.triggerSwitch();
      if (!ok) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(t.switchFailed, ToastAndroid.SHORT);
        } else {
          Alert.alert('Error', t.switchFailed);
        }
      }
    } catch {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.switchFailed, ToastAndroid.SHORT);
      }
    } finally {
      // 2s cool down
      setTimeout(() => {
        setIsTriggering(false);
      }, 2000);
    }
  };

  // Copy status text to clipboard
  const handleCopyStatus = async () => {
    const title = t.title(healthResult.status);
    const code = healthResult.pingStatusCode;
    const msg = t.message(healthResult.status, code);
    const target = healthResult.targetUrl;
    const codeStr = code ? ` (HTTP ${code})` : '';

    const textToCopy = `[${title}]${codeStr}\n${msg}\n${t.targetLocation}${target}/api/ping`;

    if (Platform.OS === 'ios') {
      showNativeIOSActionSheet({
        title: title,
        message: `${msg}\n${target}/api/ping`,
        options: [
          {
            text: '複製健康診斷資訊',
            onPress: async () => {
              await Clipboard.setStringAsync(textToCopy);
            },
          },
          {
            text: '立即觸發 HDMI 切換',
            onPress: () => {
              handleTrigger();
            },
          },
          {
            text: '取消',
            style: 'cancel',
          },
        ],
      });
      return;
    }

    await Clipboard.setStringAsync(textToCopy);

    if (Platform.OS === 'android') {
      ToastAndroid.show(t.statusCopied, ToastAndroid.SHORT);
    } else {
      Alert.alert(t.statusCopied, textToCopy);
    }
  };

  const titleText = t.title(healthResult.status);
  const descText = t.message(healthResult.status, healthResult.pingStatusCode);
  const badgeText = t.badgeText(healthResult.status);

  return (
    <View style={styles.container}>
      {/* Dynamic Ambient Glow Canvas */}
      <AmbientGlowBackground palette={palette} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top-Right trigger button in wide mode */}
        {isWide && !isTv && (
          <View style={styles.wideTopAction}>
            <SwitchButton
              palette={palette}
              isTriggering={isTriggering}
              onPress={handleTrigger}
              label={t.switchHdmi}
              processingLabel={t.processing}
              isTv={false}
            />
          </View>
        )}

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isWide ? 48 : 24,
              paddingTop: isWide ? 36 : 24,
              paddingBottom: Platform.OS === 'ios' ? 110 : (isWide ? 36 : 24),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={handleCopyStatus}
            style={({ pressed }) => [
              styles.centerWrapper,
              { opacity: pressed ? 0.95 : 1.0 },
            ]}
          >
            {/* 1. Giant Static Status Icon */}
            <StatusIcon
              status={healthResult.status}
              palette={palette}
              isWide={isWide}
            />

            <View style={{ height: isWide ? 28 : 20 }} />

            {/* 2. Status Badge Pill */}
            <StatusBadge
              text={badgeText}
              palette={palette}
              isWide={isWide}
            />

            <View style={{ height: isWide ? 20 : 16 }} />

            {/* 3. Primary Headline */}
            <Text
              style={[
                styles.headline,
                { fontSize: isWide ? 36 : 28 },
              ]}
            >
              {titleText}
            </Text>

            <View style={{ height: isWide ? 16 : 12 }} />

            {/* 4. Description */}
            <Text
              style={[
                styles.description,
                { fontSize: isWide ? 18 : 15 },
              ]}
            >
              {descText}
            </Text>

            <View style={{ height: isWide ? 24 : 18 }} />

            {/* 5. Mobile Switch Button */}
            {!isTv && !isWide && (
              <>
                <SwitchButton
                  palette={palette}
                  isTriggering={isTriggering}
                  onPress={handleTrigger}
                  label={t.switchHdmi}
                  processingLabel={t.processing}
                  isTv={false}
                />
                <View style={{ height: 20 }} />
              </>
            )}

            {/* 6. Target URL & Copy Hint */}
            <Text
              style={[
                styles.targetUrl,
                { fontSize: isWide ? 14 : 12 },
              ]}
            >
              {`${healthResult.targetUrl}/api/ping`}
            </Text>

            <View style={{ height: 8 }} />

            <View style={styles.copyHintRow}>
              <Ionicons
                name="copy-outline"
                size={13}
                color="rgba(255, 255, 255, 0.4)"
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.copyHintText,
                  { fontSize: isWide ? 13 : 11 },
                ]}
              >
                {t.tapToCopy}
              </Text>
            </View>

            {/* 7. Parallel Routes Probed Breakdown Card */}
            <RouteProbeCard
              routes={healthResult.routes}
              palette={palette}
              isZh={isZh}
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060D0B',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrapper: {
    maxWidth: 800,
    width: '100%',
    alignItems: 'center',
  },
  headline: {
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  targetUrl: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  copyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyHintText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  wideTopAction: {
    position: 'absolute',
    top: 24,
    right: 32,
    zIndex: 10,
  },
});
