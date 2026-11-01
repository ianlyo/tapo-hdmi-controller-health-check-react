/*
https://hdmi-app-config.linnu.dpdns.org/

 */
export default {
  async fetch(request, env, ctx) {
    // 通用 403 拒絕回應函數 (隱藏具體錯誤原因)
    const createForbiddenResponse = () =>
      new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: {
          "content-type": "application/json;charset=UTF-8",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });

    // 僅允許 GET 請求
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "content-type": "application/json;charset=UTF-8" }
      });
    }

    // 1. 網路來源驗證：僅允許台灣 (TW) 且屬於中華電信 HiNet (AS3462) 的流量
    const country = request.cf?.country || "";
    const asn = request.cf?.asn;

    if (country !== "TW" || asn !== 3462) {
      return createForbiddenResponse();
    }

    // 2. 取得請求的 User-Agent 標頭（相容 TapoHDMISwitcher 系列）
    const userAgent = request.headers.get("User-Agent") || "";
    const isAllowed = userAgent.includes("TapoHDMISwitcher");

    // UA 驗證
    if (!isAllowed) {
      return createForbiddenResponse();
    }

    // 輔助函式：當環境變數未設置、為空字串或純空白時，自動回傳預設值
    const getVal = (val, defaultVal) => {
      if (val === undefined || val === null) return defaultVal;
      const str = String(val).trim();
      return str.length > 0 ? str : defaultVal;
    };

    const getInt = (val, defaultVal) => {
      if (val === undefined || val === null) return defaultVal;
      const parsed = parseInt(String(val).trim(), 10);
      return Number.isNaN(parsed) ? defaultVal : parsed;
    };

    // 3. 驗證通過，回傳標準 JSON 設定（留白自動套用預設值）
    const configData = {
      flask_ip: getVal(env?.FLASK_IP, "https://hdmi-mac-flask.linnu.dpdns.org"),
      flask_port: getInt(env?.FLASK_PORT, 443),
      shortcut_endpoint: getVal(env?.SHORTCUT_ENDPOINT, "hdmi_px_2"),
      api_key: getVal(env?.API_KEY, "my_secure_tv_key_2026"),
      // 切換成功時 Alert 自動關閉延遲秒數 
      alert_delay_seconds: getInt(env?.ALERT_DELAY_SECONDS, 7)
    };

    // 選填：Mac 的區網位址（例如 http://192.168.50.10:5001）。
    // App 會優先直連區網，約 300ms 內沒成功才同時改走 Cloudflare Tunnel（flask_ip）。
    const lanUrl = getVal(env?.FLASK_LAN_URL, "");
    if (lanUrl) {
      configData.flask_lan_url = lanUrl;
    }

    return new Response(JSON.stringify(configData, null, 2), {
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
    });
  },
};