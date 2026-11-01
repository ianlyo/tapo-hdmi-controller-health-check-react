#!/usr/bin/env bash
set -euo pipefail

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

MODE="${1:-release}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}==> [1/4] 開始建置 React Native / Expo iOS 專案 (無簽名, 模式: ${MODE})...${NC}"

# 若尚未生成 ios 原生專案，先執行 expo prebuild
if [ ! -d "ios" ]; then
  echo -e "${BLUE}==> 正在執行 expo prebuild --platform ios...${NC}"
  npx expo prebuild --platform ios
fi

case "$MODE" in
  debug)
    CONFIG="Debug"
    ;;
  profile|release)
    CONFIG="Release"
    ;;
  *)
    echo -e "${RED}錯誤: 不支援的模式 '$MODE'，請使用 debug, profile 或 release${NC}"
    exit 1
    ;;
esac

# 尋找 xcworkspace
WORKSPACE_FILE=$(find ios -maxdepth 1 -name "*.xcworkspace" | head -n 1)
if [ -z "$WORKSPACE_FILE" ]; then
  echo -e "${RED}錯誤: 在 ios 目錄下找不到 .xcworkspace 檔案${NC}"
  exit 1
fi

SCHEME_NAME=$(basename "$WORKSPACE_FILE" .xcworkspace)
echo -e "${GREEN}使用 Scheme: $SCHEME_NAME (設定: $CONFIG)${NC}"

# 執行 xcodebuild 進行無簽名建置
DERIVED_DATA_PATH="$PROJECT_ROOT/build/ios/DerivedData"
mkdir -p "$DERIVED_DATA_PATH"

xcodebuild -workspace "$WORKSPACE_FILE" \
  -scheme "$SCHEME_NAME" \
  -configuration "$CONFIG" \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  build

# 尋找產生的 .app
APP_DIR=""
POSSIBLE_PATHS=(
  "$DERIVED_DATA_PATH/Build/Products/${CONFIG}-iphoneos/${SCHEME_NAME}.app"
  $(find "$DERIVED_DATA_PATH/Build/Products/${CONFIG}-iphoneos" -maxdepth 1 -name "*.app" 2>/dev/null | head -n 1)
)

for path in "${POSSIBLE_PATHS[@]}"; do
  if [ -n "$path" ] && [ -d "$path" ]; then
    APP_DIR="$path"
    break
  fi
done

if [ -z "$APP_DIR" ]; then
  echo -e "${RED}錯誤: 找不到輸出的 .app 檔案${NC}"
  exit 1
fi

echo -e "${GREEN}找到 App: $APP_DIR${NC}"

echo -e "${BLUE}==> [2/4] 準備 Payload 目錄結構...${NC}"
DIST_DIR="$PROJECT_ROOT/build/ios/ipa"
PAYLOAD_DIR="$DIST_DIR/Payload"

rm -rf "$DIST_DIR"
mkdir -p "$PAYLOAD_DIR"

# 複製 .app 至 Payload/
cp -R "$APP_DIR" "$PAYLOAD_DIR/"

IPA_NAME="tapo_server_health_check_unsigned_${MODE}.ipa"
OUTPUT_IPA="$DIST_DIR/$IPA_NAME"

echo -e "${BLUE}==> [3/4] 打包為 .ipa 檔案...${NC}"
cd "$DIST_DIR"
zip -qr -9 "$IPA_NAME" Payload

# 清理 Payload 暫存資料夾
rm -rf Payload

cd "$PROJECT_ROOT"

echo -e "${GREEN}==> [4/4] 打包完成！${NC}"
echo -e "檔案位置: ${YELLOW}$OUTPUT_IPA${NC}"
ls -lh "$OUTPUT_IPA"
