import ipaddress
import logging
import os
import subprocess
import threading
import time

from flask import Flask, jsonify, request

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("tapo_server")

# 保護 API 的金鑰（可用環境變數 TAPO_API_KEY 覆寫）
API_KEY = os.environ.get("TAPO_API_KEY", "my_secure_tv_key_2026")

# 定義允許連線的網段與來源
ALLOWED_NETWORKS = [
    ipaddress.ip_network("192.168.50.0/24"),  # 允許 192.168.50.x
    ipaddress.ip_network("10.0.2.0/24"),      # 允許 Android Emulator
    ipaddress.ip_network("127.0.0.1/32"),     # 允許本機 IPv4
    ipaddress.ip_network("::1/128"),          # 允許本機 IPv6
]

# endpoint -> macOS 捷徑名稱
SHORTCUTS = {
    "hdmi_px_2": "Turns on hdmi px 2",
    "hdmi_px_3": "Turns on hdmi px 3",
}

# 防連點：同一個捷徑在此秒數內重複觸發只執行一次
# （App 會同時走區網與 Cloudflare 兩條路徑競速，伺服器端必須去重）
# 監聽埠（需與設定檔 flask_port、cloudflared ingress 一致）
PORT = int(os.environ.get("TAPO_PORT", "38472"))

DEDUP_WINDOW_SECONDS = float(os.environ.get("TAPO_DEDUP_SECONDS", "1.5"))
_last_run = {}
_lock = threading.Lock()


def _run_shortcut(name):
    start = time.monotonic()
    try:
        subprocess.run(["shortcuts", "run", name], check=True)
        log.info("捷徑完成：%s（%.0f ms）", name, (time.monotonic() - start) * 1000)
    except Exception as e:  # noqa: BLE001
        log.error("捷徑執行失敗：%s：%s", name, e)


@app.before_request
def limit_remote_addr():
    # 取得連線來源 IP
    client_ip = request.remote_addr
    try:
        ip = ipaddress.ip_address(client_ip)
        # 檢查來源 IP 是否在允許名單內
        if not any(ip in net for net in ALLOWED_NETWORKS):
            return (
                jsonify({"error": "禁止連線：僅限指定區網設備訪問"}),
                403,
            )
    except ValueError:
        return jsonify({"error": "無效的 IP 位址"}), 403


@app.route("/api/ping", methods=["GET", "HEAD"])
def ping():
    # 輕量端點：供 App 預熱連線 / 偵測區網可達性
    return ("", 204)


@app.route("/api/webhook/<endpoint>", methods=["POST"])
def webhook(endpoint):
    auth_header = request.headers.get("Authorization")
    if auth_header != f"Bearer {API_KEY}":
        return jsonify({"error": "未經授權的請求"}), 401

    name = SHORTCUTS.get(endpoint)
    if name is None:
        return jsonify({"error": f"未知的 endpoint: {endpoint}"}), 404

    now = time.monotonic()
    with _lock:
        last = _last_run.get(endpoint)
        duplicated = last is not None and now - last < DEDUP_WINDOW_SECONDS
        if not duplicated:
            _last_run[endpoint] = now

        # 清理超過 DEDUP_WINDOW_SECONDS 的舊記錄，避免 dict 無限增長
        keys_to_delete = [k for k, v in _last_run.items() if now - v > DEDUP_WINDOW_SECONDS]
        for k in keys_to_delete:
            del _last_run[k]

    if duplicated:
        log.info("重複請求已忽略：%s（來源 %s）", endpoint, request.remote_addr)
        return jsonify({"status": "accepted", "deduplicated": True, "message": f"已觸發捷徑：{name}"}), 202

    # 非同步執行捷徑，立即回應，不必等捷徑跑完
    threading.Thread(target=_run_shortcut, args=(name,), daemon=True).start()
    log.info("已觸發捷徑：%s（來源 %s）", name, request.remote_addr)
    return jsonify({"status": "accepted", "message": f"已觸發捷徑：{name}"}), 202


if __name__ == "__main__":
    # 監聽所有介面，以便接收來自 192.168.50.x 的請求
    # 預設使用 waitress（正式 WSGI，低延遲）；設定 TAPO_DEBUG=1 可改回 Flask debug + 自動重載
    if os.environ.get("TAPO_DEBUG") == "1":
        app.run(host="0.0.0.0", port=PORT, debug=True, use_reloader=True, threaded=True)
    else:
        try:
            from waitress import serve

            log.info("使用 waitress 於 0.0.0.0:%d 提供服務", PORT)
            serve(app, host="0.0.0.0", port=PORT, threads=8)
        except ImportError:
            log.warning("未安裝 waitress（pip install waitress），改用 Flask 內建伺服器")
            app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)