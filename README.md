# Mac Flask Server Monitor / 伺服器健康監控看板 (React Native)

[繁體中文](#繁體中文) | [English](#english)

---

## 繁體中文

這是一個基於 **React Native (Expo Prebuild)** 開發的跨平台原生應用程式（原生支援 **Android TV**、**Android 手機/平板**、**iOS/iPadOS**），專為**純觀看、零互動（Zero-Interaction）**設計，讓您打開畫面就能一眼確認 **Mac 上的 Python Flask 伺服器（`app.py` / `tapo_server.app`）是否正常運行**。

### ✨ 原生組件與核心設計

1. **深度原生整合（Native-First Components）**：
   - **原生對話框（Native Dialogs）**：首次啟動與權限提示呼叫底層真實原生對話框（iOS: `UIAlertController`、Android: `android.app.AlertDialog`）。
   - **原生回饋（Native Feedback & Haptics）**：Android 採用原生 Material Ripple 漣漪動畫與 `ToastAndroid`；iOS 採用系統觸覺回饋（`UIImpactFeedbackGenerator`）與原生通知。
   - **原生安全區（Native Safe Area）**：採用原生 WindowInsets 與 SafeArea，邊界沉浸式 Edge-to-Edge 渲染。
   - **原生標籤列（Native Bottom Tabs）**：使用原生 Native Stack & Bottom Tabs，適配 iOS/Android 風格。

2. **強制深色模式 + 狀態主題色動態渲染（Status-Driven Dark Theme）**：
   - 整個 UI 的背景漸層光暈、卡片邊框、呼吸燈與強調色皆隨伺服器狀態即時變換：
     - 🟢 **翡翠綠（正常運行 / Online）**：偵測到 HTTP `204` / `200`，顯示毫秒級延遲。
     - 🟡 **琥珀黃（IP 受限 / Restricted）**：偵測到 HTTP `403`，代表 Mac 服務有在跑，但目前裝置 IP 需加入 `ALLOWED_NETWORKS`。
     - 🔴 **緋紅（未運行或離線 / Offline）**：自動辨識 `502`（Tunnel 通但 Mac Flask 未啟動）、`530`（Cloudflare Tunnel 離線）或連線超時。
     - 🔵 **黑灰/電光（檢測中 / Checking）**：啟動瞬間的探測過渡狀態。

3. **純觀看、零互動（Zero-Interaction / Passive Monitor）**：
   - 開啟即自動並聯探測 **遠端通道（Cloudflare Tunnel）** 與 **本機/區網直連（Local / LAN）**，並每 **4 秒**自動背景刷新。
   - 支援 AppState 生命週期感知：切換至後台自動暫停輪詢，返回前台即時恢復，極致省電。

4. **相容 Android TV 大螢幕（Android TV & Leanback Ready）**：
   - `AndroidManifest.xml` 已透過 Config Plugin 配置 `LEANBACK_LAUNCHER`、`android.software.leanback` 與 `touchscreen="false"`。
   - 自動適配 **Android TV 16:9 大螢幕全螢幕儀表板** 與 **手機直向單欄卡片**，支援電視遙控器 D-Pad 焦點聚焦。

5. **JSON 自訂與同步功能（Tab 2）**：
   - 可即時與 Cloudflare Worker 配置同步，亦支援手動解析與套用自訂 JSON。

---

### 🚀 開發與執行

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run start

# 本地 Android 原生執行
npm run android

# 本地 iOS 原生執行 (僅限 macOS)
npm run ios
```

---

### 📦 打包指南

#### Android 打包（Google Play Console / AAB）

1. **進入 Android 目錄建置 Release AAB**：
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
2. **輸出檔案**：
   `android/app/build/outputs/bundle/release/app-release.aab`
3. 前往 [Google Play Console](https://play.google.com/console) 建立新版本並拖曳上傳即可。

---

#### iOS 打包（Unsigned IPA）

本專案提供一鍵打包無簽名（Unsigned）IPA 的腳本，適用於側載（Sideloading，如 AltStore、Sideloadly、TrollStore）：

```bash
# 預設打包 Release 模式
./scripts/build_unsigned_ipa.sh

# 或指定模式 (debug / profile / release)
./scripts/build_unsigned_ipa.sh release
```

- **輸出檔案**：`build/ios/ipa/tapo_server_health_check_unsigned_<mode>.ipa`

---

## English

A native-first, zero-interaction React Native application (supporting **Android TV**, **Android Phones & Tablets**, and **iOS/iPadOS**) built to answer one question at a glance: **Is your Python Flask server (`app.py` / `tapo_server.app`) on Mac running normally?**

### ✨ Native Features

1. **Native Components**:
   - **Dialogs**: Calls OS platform dialogs (`UIAlertController` on iOS, `AlertDialog` on Android).
   - **Feedback**: Native Material ripples & toasts on Android; UIImpactFeedback haptics on iOS.
   - **Safe Areas**: Hardware-level insets for edge-to-edge layout.
   - **Android TV Ready**: Leanback launcher, banner, and D-pad navigation support.

2. **Status-Driven Dark Theme**:
   - 🟢 **Emerald Green (`Online`)**: HTTP `204`/`200` with ms-latency.
   - 🟡 **Amber (`Restricted`)**: HTTP `403` forbidden IP.
   - 🔴 **Crimson (`Offline`)**: HTTP `502` / `530` or timeout.
   - 🔵 **Checking (`Probing`)**: Initial probe state.

3. **Packaging**:
   - Android AAB: `cd android && ./gradlew bundleRelease`
   - iOS Unsigned IPA: `./scripts/build_unsigned_ipa.sh release`
