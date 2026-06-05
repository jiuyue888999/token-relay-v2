import { layout, escapeHtml, TOAST_SCRIPT } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

interface DashboardData {
  user: Record<string, any>;
  apiKeyCount: number;
}

export function dashboardPage(opts: LayoutOpts & { data?: DashboardData }): string {
  const d = opts.data;
  const u = d?.user || {};

  return layout(`
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">👋 欢迎回来，${escapeHtml(u.display_name || u.phone || '用户')}</h1>
        <p class="text-sm text-slate-500 mt-1">注册于 ${(u.created_at || '').slice(0, 10)}</p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">剩余额度</div>
          <div class="text-2xl font-extrabold">${fmtNum(u.quota_remaining || 0)}</div>
          <div class="text-xs text-slate-400 mt-1">tokens</div>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">已使用</div>
          <div class="text-2xl font-extrabold">${fmtNum(u.total_quota_used || 0)}</div>
        </div>
        <div class="stat-card" style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-color:#c7d2fe;">
          <div class="text-xs text-primary-500 uppercase tracking-wide mb-1">API 密钥</div>
          <div class="text-2xl font-extrabold text-primary-700">${d?.apiKeyCount || 0}</div>
          <a href="/keys" class="text-xs text-primary-400 mt-1 block no-underline hover:underline">管理密钥 →</a>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">账户状态</div>
          <div class="flex items-center gap-2 mt-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span class="font-bold text-emerald-600">正常</span>
          </div>
        </div>
      </div>

      <!-- API Keys card -->
      <a href="/keys" class="card p-6 mb-8 block no-underline hover:shadow-md transition-shadow group">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-bold text-lg text-slate-900">🔑 API 密钥管理</h2>
            <p class="text-sm text-slate-400 mt-1">创建、命名、管理你的 API 密钥。密钥创建后仅显示一次，请及时复制保存。</p>
          </div>
          <span class="text-slate-300 group-hover:text-primary-400 text-xl">→</span>
        </div>
      </a>

      <!-- API Endpoints -->
      <div class="card p-6 mb-8">
        <h2 class="font-bold text-lg mb-3">📡 API 端点</h2>
        <div class="grid sm:grid-cols-3 gap-3 text-sm">
          <div class="p-3 rounded-lg bg-slate-50"><div class="font-mono text-xs text-primary-600 font-bold mb-1">POST /v1/chat/completions</div><div class="text-xs text-slate-400">对话补全 · 36个模型</div></div>
          <div class="p-3 rounded-lg bg-slate-50"><div class="font-mono text-xs text-primary-600 font-bold mb-1">POST /v1/images/generations</div><div class="text-xs text-slate-400">图片生成 · 6个模型</div></div>
          <div class="p-3 rounded-lg bg-slate-50"><div class="font-mono text-xs text-primary-600 font-bold mb-1">POST /v1/video/generations</div><div class="text-xs text-slate-400">视频生成 · 8个模型</div></div>
        </div>
      </div>

      <!-- Quick code example -->
      <div class="card p-6">
        <h2 class="font-bold text-lg mb-3">💻 快速开始</h2>
        <div class="bg-slate-900 text-slate-50 rounded-xl p-5 text-sm font-mono overflow-x-auto">
          <div><span class="text-fuchsia-400">from</span> openai <span class="text-fuchsia-400">import</span> OpenAI</div>
          <div class="mt-2"><span class="text-sky-400">client</span> = OpenAI(</div>
          <div>&nbsp;&nbsp;api_key=<span class="text-amber-400">"你的API密钥"</span>,</div>
          <div>&nbsp;&nbsp;base_url=<span class="text-amber-400">"https://${escapeHtml(opts.user?.display_name||'')}.replace(/.*/,'')}${escapeHtml(typeof window !== 'undefined' ? '' : '')}"</span></div>
          <div class="text-slate-500"># 在 /keys 页面创建密钥后替换上面的 api_key</div>
          <div>)</div>
          <div class="mt-2 text-slate-400"># 对话</div>
          <div>client.chat.completions.create(model=<span class="text-amber-400">"gpt-5.5"</span>, messages=[...])</div>
        </div>
      </div>
    </div>
    <script>document.querySelector('.bg-slate-900').innerHTML = document.querySelector('.bg-slate-900').innerHTML.replace('replace-me', window.location.host);</script>
  `, { ...opts, title: '控制台', scripts: TOAST_SCRIPT });
}

function fmtNum(n: number): string {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return String(n);
}
