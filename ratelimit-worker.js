const RATE_LIMIT = 3;          // 每個路徑允許次數
const TIME_WINDOW = 60;        // 計數窗口 (秒)
const BLOCK_TIME_IP = 60 * 1;  // 封鎖時間 (秒)
const SITE_KEY = ;   // 換成你的 sitekey
const SECRET_KEY = ; // 換成你的 secret

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const ua = request.headers.get("User-Agent") || "unknown";
    const country = request.cf?.country || "unknown";
    const now = new Date();

    // ------------------- Log 存到 R2（每天一個檔案） -------------------
    try {
      const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const logKey = `logs/${today}.json`;

      const counterKey = getIPPathKey(clientIP, path);
      const visits = await incrementRequestCount(env.RATELIMIT_KV, counterKey, TIME_WINDOW);

      const logEntry = {
        ip: clientIP,
        country,
        userAgent: ua,
        path,
        method: request.method,
        time: now.toISOString(),
        visits
      };

      let existingLogs = [];
      try {
        const obj = await env["calvin-test"].get(logKey);
        if (obj) {
          existingLogs = JSON.parse(await obj.text());
        }
      } catch (err) {
        console.error("讀取 R2 失敗:", err);
      }

      existingLogs.push(logEntry);

      await env["calvin-test"].put(logKey, JSON.stringify(existingLogs, null, 2), {
        httpMetadata: { contentType: "application/json" }
      });
    } catch (err) {
      console.error("R2 put error:", err);
    }

    // ------------------- Turnstile 驗證 -------------------
    if (url.pathname === "/verify" && request.method === "POST") {
      const formData = await request.formData();
      const token = formData.get("cf-turnstile-response");
      const originalPath = formData.get("originalPath") || "/";

      const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: new URLSearchParams({
          secret: SECRET_KEY,
          response: token
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const outcome = await verifyResponse.json();
      if (outcome.success) {
        // 清掉封鎖與計數
        await env.RATELIMIT_KV.delete(`block_ip_${clientIP}`);
        const targetPaths = ["/login", "/register"];
        for (const p of targetPaths) {
          const key = getIPPathKey(clientIP, p);
          await env.RATELIMIT_KV.delete(key);
        }

        return new Response(`
          <html><body>
            <h2>✅ 驗證成功！</h2>
            <script>
              alert("驗證成功，將返回原始頁面");
              window.location.href = "${originalPath}";
            </script>
          </body></html>
        `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      } else {
        return new Response("驗證失敗，請重新嘗試。", { status: 403 });
      }
    }

    // ------------------- 限流邏輯 (AND 條件) -------------------
    const targetPaths = ["/login", "/register"];
    const isTargetPath = targetPaths.includes(path);

    const blockKey = `block_ip_${clientIP}`;
    const isBlocked = await env.RATELIMIT_KV.get(blockKey);
    if (isBlocked) {
      return new Response(renderTurnstilePage(SITE_KEY, path), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (isTargetPath) {
      let allExceeded = true;
      for (const p of targetPaths) {
        const key = getIPPathKey(clientIP, p);
        const value = await env.RATELIMIT_KV.get(key);
        const count = value ? parseInt(value, 10) : 0;
        if (count <= RATE_LIMIT) {
          allExceeded = false;
        }
      }

      if (allExceeded) {
        await env.RATELIMIT_KV.put(blockKey, "blocked", { expirationTtl: BLOCK_TIME_IP });
        return new Response(renderTurnstilePage(SITE_KEY, path), {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
    }

    return fetch(request);
  }
};

// ------------------- 工具函數 -------------------
function getIPPathKey(ip, path) {
  const window = Math.floor(Date.now() / 1000 / TIME_WINDOW);
  return `rate_limit_ip_${ip}_${path}_${window}`;
}

async function incrementRequestCount(kv, key, ttl) {
  const value = await kv.get(key);
  let count = value ? parseInt(value, 10) : 0;
  count++;
  await kv.put(key, count.toString(), { expirationTtl: ttl });
  return count;
}

function renderTurnstilePage(siteKey, originalPath) {
  return `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>驗證</title>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  </head>
  <body>
    <h2>請完成驗證</h2>
    <form id="turnstile-form" action="/verify" method="POST">
      <input type="hidden" name="originalPath" value="${originalPath}">
      <div class="cf-turnstile" data-sitekey="${siteKey}" data-callback="onSuccess"></div>
    </form>
    <script>
      function onSuccess() {
        document.getElementById("turnstile-form").submit();
      }
    </script>
  </body>
  </html>`;
}
