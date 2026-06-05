export interface LayoutOpts {
  title: string;
  user?: { display_name: string; email: string } | null;
  admin?: boolean;
  scripts?: string;
}

export function layout(content: string, opts: LayoutOpts): string {
  return `<!DOCTYPE html>
<html lang="zh-CN" class="dark">
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
            accent: { 400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490' },
            glow: { purple:'#a855f7', cyan:'#22d3ee', pink:'#ec4899' }
          }
        }
      }
    }
  </script>
  <style>
    * { font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif; }
    body { background: #0b1121; color: #e2e8f0; }
    .glass { background: rgba(15,23,42,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(71,85,105,0.3); border-radius: 1rem; }
    .glass-card { background: rgba(30,41,59,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(71,85,105,0.25); border-radius: 1rem; transition: all 0.2s; }
    .glass-card:hover { border-color: rgba(6,182,212,0.4); box-shadow: 0 0 30px rgba(6,182,212,0.08); }
    .btn-cyber { background: linear-gradient(135deg, #06b6d4, #6366f1); color: white; padding: 0.625rem 1.5rem; border-radius: 0.75rem; font-weight: 600; transition: all 0.25s; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; }
    .btn-cyber:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(6,182,212,0.3); }
    .btn-ghost { background: rgba(30,41,59,0.6); color: #cbd5e1; padding: 0.625rem 1.5rem; border-radius: 0.75rem; font-weight: 600; border: 1px solid rgba(71,85,105,0.3); transition: all 0.2s; cursor: pointer; text-decoration: none; }
    .btn-ghost:hover { background: rgba(51,65,85,0.6); border-color: rgba(6,182,212,0.4); }
    .input-cyber { width: 100%; padding: 0.75rem 1rem; background: rgba(15,23,42,0.8); border: 1px solid rgba(71,85,105,0.4); border-radius: 0.75rem; color: #e2e8f0; font-size: 0.9375rem; outline: none; transition: all 0.2s; }
    .input-cyber:focus { border-color: #06b6d4; box-shadow: 0 0 20px rgba(6,182,212,0.15); }
    .input-cyber::placeholder { color: #64748b; }
    .stat-box { background: rgba(15,23,42,0.6); border: 1px solid rgba(71,85,105,0.2); border-radius: 0.75rem; padding: 1.5rem; transition: all 0.2s; }
    .stat-box:hover { border-color: rgba(6,182,212,0.3); }
    .glow-text { background: linear-gradient(135deg, #22d3ee, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .glow-border { position: relative; }
    .glow-border::after { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, #06b6d4, #6366f1, #a855f7); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
    tr:hover td { background: rgba(6,182,212,0.05); }
    .logo-icon { width: 2rem; height: 2rem; background: linear-gradient(135deg, #06b6d4, #a855f7); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; }
    .tab-active { background: rgba(6,182,212,0.15) !important; color: #22d3ee !important; }
    select.input-cyber { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; padding-right: 2.5rem; }
  </style>
  ${opts.scripts || ''}
</head>
<body class="min-h-screen">

  <!-- Navigation -->
  <nav class="sticky top-0 z-50 glass border-b border-slate-700/30">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 font-bold text-xl text-white no-underline">
        <span class="logo-icon">⚡</span>
        <span class="glow-text">Token Relay</span>
      </a>
      <div class="flex items-center gap-3 text-sm">
        <a href="/#features" class="text-slate-400 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors no-underline">特性</a>
        <a href="/#pricing" class="text-slate-400 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors no-underline">套餐</a>
        <a href="/#docs" class="text-slate-400 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors no-underline">文档</a>
        ${opts.user ? `
          ${opts.admin ? '<a href="/admin" class="text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg transition-colors font-medium no-underline">管理面板</a>' : ''}
          <a href="/recharge" class="text-slate-400 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors no-underline">💰 充值</a>
          <a href="/keys" class="text-slate-400 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors no-underline">🔑 密钥</a>
          <a href="/dashboard" class="text-slate-400 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors no-underline">控制台</a>
          <span class="text-slate-600">|</span>
          <span class="text-slate-300 text-xs">${escapeHtml(opts.user.display_name)}</span>
          <a href="/logout" class="text-slate-500 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors text-xs no-underline">退出</a>
        ` : `
          <a href="/login" class="btn-ghost text-sm !py-2 !px-4 no-underline">登录</a>
          <a href="/register" class="btn-cyber text-sm !py-2 !px-4 no-underline">免费注册</a>
        `}
      </div>
    </div>
  </nav>

  <main>${content}</main>

  <footer class="border-t border-slate-700/30 mt-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-slate-500">
      Token Relay · 诚信为本 · 服务至上
    </div>
  </footer>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export const TOAST_SCRIPT = `<script>
function toast(m,t){var e=document.createElement('div');e.className='fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-50';e.style.background=t==='error'?'#ef4444':'#10b981';e.textContent=m;document.body.appendChild(e);setTimeout(function(){e.style.opacity='0';e.style.transition='opacity 0.3s';setTimeout(function(){e.remove()},300)},3000);}
</script>`;
