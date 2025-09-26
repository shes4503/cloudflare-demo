export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/login") {
      return new Response(renderLoginPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/register") {
      return new Response(renderRegisterPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/verify" && request.method === "POST") {
      return new Response(renderVerifyResult(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 預設首頁
    return new Response(renderHomePage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

function renderHomePage() {
  return `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>Cloudflare Demo 首頁</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f3f4f6;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        width: 400px;
        text-align: center;
      }
      h1 {
        color: #111827;
        margin-bottom: 1.5rem;
      }
      a {
        display: block;
        margin: 0.8rem 0;
        padding: 0.8rem;
        background: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        transition: 0.2s;
      }
      a:hover {
        background: #1d4ed8;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Cloudflare Demo</h1>
      <a href="/login">登入</a>
      <a href="/register">註冊</a>
    </div>
  </body>
  </html>`;
}

function renderLoginPage() {
  return `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>登入頁面</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; }
      .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 400px; }
      h2 { text-align: center; margin-bottom: 1.5rem; color: #111827; }
      label { display: block; margin-top: 1rem; color: #374151; }
      input { width: 100%; padding: 0.6rem; margin-top: 0.4rem; border: 1px solid #d1d5db; border-radius: 8px; }
      button { margin-top: 1.5rem; width: 100%; padding: 0.8rem; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; }
      button:hover { background: #1d4ed8; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>登入</h2>
      <form action="/verify" method="POST">
        <label>帳號: <input type="text" name="username"></label>
        <label>密碼: <input type="password" name="password"></label>
        <button type="submit">登入</button>
      </form>
    </div>
  </body>
  </html>`;
}

function renderRegisterPage() {
  return `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>註冊頁面</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; }
      .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 400px; }
      h2 { text-align: center; margin-bottom: 1.5rem; color: #111827; }
      label { display: block; margin-top: 1rem; color: #374151; }
      input { width: 100%; padding: 0.6rem; margin-top: 0.4rem; border: 1px solid #d1d5db; border-radius: 8px; }
      button { margin-top: 1.5rem; width: 100%; padding: 0.8rem; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer; }
      button:hover { background: #15803d; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>註冊</h2>
      <form action="/verify" method="POST">
        <label>帳號: <input type="text" name="username"></label>
        <label>密碼: <input type="password" name="password"></label>
        <button type="submit">註冊</button>
      </form>
    </div>
  </body>
  </html>`;
}

function renderVerifyResult() {
  return `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>驗證結果</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; }
      .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; width: 400px; }
      h2 { color: #16a34a; }
      a { display: inline-block; margin-top: 1rem; text-decoration: none; color: #2563eb; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>✅ 驗證成功！</h2>
      <p>模擬登入 / 註冊完成</p>
      <a href="/">回首頁</a>
    </div>
  </body>
  </html>`;
}
