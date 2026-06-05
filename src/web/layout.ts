/**
 * Shared layout wrapper for all web pages.
 * Provides consistent header, footer, and Tailwind CSS.
 */

export interface LayoutOpts {
  title: string;
  user?: { display_name: string; email: string } | null;
  admin?: boolean;
  scripts?: string;
}

export function layout(content: string, opts: LayoutOpts): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)} — Token Relay</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' }
          }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .gradient-text { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .gradient-bg { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); }
    .card { background: white; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.625rem 1.5rem; border-radius: 0.75rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
    .btn-secondary { background: #f8fafc; color: #334155; padding: 0.625rem 1.5rem; border-radius: 0.75rem; font-weight: 600; border: 1px solid #e2e8f0; transition: all 0.2s; }
    .btn-secondary:hover { background: #f1f5f9; }
    .input-field { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.9375rem; transition: all 0.2s; outline: none; }
    .input-field:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .stat-card { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 0.75rem; padding: 1.5rem; border: 1px solid #e2e8f0; }
    tr:hover { background: #f8fafc; }
  </style>
  ${opts.scripts || ''}
</head>
<body class="min-h-screen bg-slate-50 text-slate-800 antialiased">

  <!-- Navigation -->
  <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 font-bold text-xl text-slate-900 no-underline">
        <span class="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm">⚡</span>
        <span class="gradient-text">Token Relay</span>
      </a>
      <div class="flex items-center gap-3 text-sm">
        <a href="/#features" class="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors no-underline">特性</a>
        <a href="/#pricing" class="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors no-underline">套餐</a>
        <a href="/#docs" class="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors no-underline">文档</a>
        ${opts.user ? `
          ${opts.admin ? '<a href="/admin" class="text-primary-500 hover:text-primary-600 px-3 py-1.5 rounded-lg transition-colors font-medium no-underline">管理面板</a>' : ''}
          <a href="/recharge" class="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors no-underline">💰 充值</a>
          <a href="/keys" class="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors no-underline">🔑 密钥</a>
          <a href="/dashboard" class="text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors no-underline">控制台</a>
          <span class="text-slate-300">|</span>
          <span class="text-slate-600 font-medium">${escapeHtml(opts.user.display_name)}</span>
          <a href="/logout" class="text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg transition-colors text-xs no-underline">退出</a>
        ` : `
          <a href="/login" class="btn-secondary text-sm !py-2 !px-4 no-underline">登录</a>
          <a href="/register" class="btn-primary text-sm !py-2 !px-4 no-underline">免费注册</a>
        `}
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main>${content}</main>

  <!-- Footer -->
  <footer class="border-t border-slate-100 bg-white mt-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs">⚡</span>
          <span>Token Relay — 诚信为本，服务至上</span>
        </div>
        <div class="flex gap-6">
          <span>稳定运行 · 低延迟 · 透明计费</span>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Toast notification helper — embed as script block */
export const TOAST_SCRIPT = `<script>
function toast(msg, type) {
  var el = document.createElement('div');
  el.className = 'fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-50';
  el.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.style.opacity='0'; el.style.transition='opacity 0.3s'; setTimeout(function() { el.remove(); }, 300); }, 3000);
}
</script>`;
