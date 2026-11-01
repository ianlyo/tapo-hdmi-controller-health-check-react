import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  ToastAndroid,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import { AppConfig, ConfigErrorCode } from '../types/config';
import { ServerHealthStatus } from '../types/health';
import { getStatusPalette } from '../constants/theme';
import { getTranslations } from '../constants/locales';
import { DEFAULT_APP_CONFIG } from '../constants/presets';
import { ConfigService } from '../services/configService';
import { NativeIOSBlur } from '../components/NativeIOSBlur';

interface Props {
  status: ServerHealthStatus;
  onConfigApplied?: (config: AppConfig) => void;
}

export const AppConfigScreen: React.FC<Props> = ({
  status,
  onConfigApplied,
}) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [rawJson, setRawJson] = useState<string>(
    JSON.stringify(DEFAULT_APP_CONFIG.rawJson, null, 2)
  );
  const [customInput, setCustomInput] = useState<string>(rawJson);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hideApiKey, setHideApiKey] = useState<boolean>(true);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const t = getTranslations();
  const palette = getStatusPalette(status);

  // Sync Remote Config on mount
  const fetchRemoteConfig = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const res = await ConfigService.fetchConfig();
    setIsLoading(false);

    if (res.isSuccess && res.config) {
      setConfig(res.config);
      setRawJson(res.rawJson || JSON.stringify(res.config.rawJson, null, 2));
      setCustomInput(res.rawJson || JSON.stringify(res.config.rawJson, null, 2));
      onConfigApplied?.(res.config);

      if (Platform.OS === 'android') {
        ToastAndroid.show(t.fetchRemote + ' OK', ToastAndroid.SHORT);
      }
    } else {
      const msg = t.configErrorMessage(res.errorCode, res.rawErrorMessage, res.statusCode);
      setErrorMessage(msg);
      if (res.rawJson) {
        setRawJson(res.rawJson);
        setCustomInput(res.rawJson);
      }
    }
  };

  useEffect(() => {
    fetchRemoteConfig();
  }, []);

  const handleApplyCustomJson = () => {
    try {
      const { config: parsed, formatted } = ConfigService.parseCustomJson(customInput);
      setConfig(parsed);
      setRawJson(formatted);
      setErrorMessage(null);
      setShowCustomInput(false);
      onConfigApplied?.(parsed);

      if (Platform.OS === 'android') {
        ToastAndroid.show(t.jsonParseSuccess, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', t.jsonParseSuccess);
      }
    } catch (err: any) {
      setErrorMessage(`${t.jsonParseFailed}: ${err?.message || ''}`);
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.jsonParseFailed, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', t.jsonParseFailed);
      }
    }
  };

  const handleCopyJson = async () => {
    await Clipboard.setStringAsync(rawJson);
    if (Platform.OS === 'android') {
      ToastAndroid.show(t.copied, ToastAndroid.SHORT);
    } else {
      Alert.alert(t.copied, t.copyJson);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bgBottom }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>{t.configTitle}</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={fetchRemoteConfig}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: `${palette.primary}25`,
                  borderColor: `${palette.primary}60`,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={palette.accent} />
              ) : (
                <>
                  <Ionicons name="cloud-download-outline" size={16} color={palette.accent} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: palette.accent }]}>{t.fetchRemote}</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleCopyJson}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  marginLeft: 8,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="copy-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>{t.copyJson}</Text>
            </Pressable>
          </View>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Field Cards */}
        <NativeIOSBlur
          intensity={40}
          tint="systemMaterialDark"
          fallbackColor={palette.cardBg}
          style={[styles.card, { borderColor: `${palette.cardBorder}40` }]}
        >
          <Text style={[styles.cardTitle, { color: palette.accent }]}>{t.parsedFields}</Text>

          <FieldRow label={t.flaskIpLabel} value={config.flaskIp || t.none} mono />
          <FieldRow label={t.flaskPortLabel} value={config.flaskPort?.toString() || t.none} mono />
          <FieldRow label={t.shortcutEndpointLabel} value={config.shortcutEndpoint || t.none} mono />
          
          {/* API Key Row with Mask/Unmask */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t.apiKeyLabel}</Text>
            <View style={styles.fieldRight}>
              <Text style={[styles.fieldValue, styles.monoText]}>
                {hideApiKey && config.apiKey ? '••••••••••••••••' : (config.apiKey || t.none)}
              </Text>
              {config.apiKey && (
                <Pressable
                  onPress={() => setHideApiKey(!hideApiKey)}
                  hitSlop={8}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons
                    name={hideApiKey ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </Pressable>
              )}
            </View>
          </View>

          <FieldRow
            label={t.alertDelayLabel}
            value={config.alertDelaySeconds ? `${config.alertDelaySeconds} ${t.secondsUnit}` : t.none}
          />

          {config.flaskLanUrl && (
            <FieldRow label="LAN URL" value={config.flaskLanUrl} mono isLast />
          )}
        </NativeIOSBlur>

        {/* Toggle Custom JSON Editor */}
        <Pressable
          onPress={() => setShowCustomInput(!showCustomInput)}
          style={[styles.toggleCustomBtn, { borderColor: `${palette.primary}50` }]}
        >
          <Text style={[styles.toggleCustomText, { color: palette.accent }]}>
            {showCustomInput ? t.collapseInput : t.customJsonInput}
          </Text>
          <Ionicons
            name={showCustomInput ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={palette.accent}
          />
        </Pressable>

        {/* Custom Input Editor */}
        {showCustomInput && (
          <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: `${palette.cardBorder}40` }]}>
            <TextInput
              style={styles.jsonInput}
              multiline
              value={customInput}
              onChangeText={setCustomInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="{ ... }"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />

            <Pressable
              onPress={handleApplyCustomJson}
              style={({ pressed }) => [
                styles.applyBtn,
                {
                  backgroundColor: palette.primary,
                  opacity: pressed ? 0.8 : 1.0,
                },
              ]}
            >
              <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>{t.parseJson}</Text>
            </Pressable>
          </View>
        )}

        {/* Raw JSON Payload */}
        <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: `${palette.cardBorder}40` }]}>
          <Text style={[styles.cardTitle, { color: palette.accent }]}>{t.rawJsonPayload}</Text>
          <Text style={styles.rawJsonText}>{rawJson}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const FieldRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  isLast?: boolean;
}> = ({ label, value, mono = false, isLast = false }) => {
  return (
    <View style={[styles.fieldRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, mono && styles.monoText]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 110 : 32,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F1D1D40',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  fieldLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  fieldRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  monoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  toggleCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  toggleCustomText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  jsonInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rawJsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    lineHeight: 18,
  },
});
