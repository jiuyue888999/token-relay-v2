import { layout, escapeHtml, TOAST_SCRIPT } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export interface DashboardData {
  user: Record<string, any>;
  apiKeyCount: number;
  recentLogs?: Array<Record<string, any>>;
}

function fmtNum(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K';
  return String(n);
}

export function dashboardPage(opts: LayoutOpts & { data?: DashboardData }): string {
  const d = opts.data;
  const u = d?.user || {};

  return layout(`
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">👋 欢迎，${escapeHtml(u.display_name || u.phone || '用户')}</h1>
        <p class="text-sm text-slate-500 mt-1">注册于 ${(u.created_at || '').slice(0, 10)}</p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat-box"><div class="text-xs text-slate-500 uppercase tracking-wide mb-1">剩余额度</div><div class="text-2xl font-extrabold text-white">${fmtNum(u.quota_remaining || 0)}</div><div class="text-xs text-slate-500 mt-1">tokens</div></div>
        <div class="stat-box"><div class="text-xs text-slate-500 uppercase tracking-wide mb-1">已使用</div><div class="text-2xl font-extrabold text-white">${fmtNum(u.total_quota_used || 0)}</div></div>
        <div class="stat-box" style="border-color:rgba(6,182,212,0.4);background:rgba(6,182,212,0.05);"><div class="text-xs text-cyan-400 uppercase tracking-wide mb-1">API 密钥</div><div class="text-2xl font-extrabold text-cyan-400">${d?.apiKeyCount || 0}</div><a href="/keys" class="text-xs text-cyan-500 hover:text-cyan-300 mt-1 inline-block no-underline">管理 →</a></div>
        <div class="stat-box"><div class="text-xs text-slate-500 uppercase tracking-wide mb-1">状态</div><div class="flex items-center gap-2 mt-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span class="font-bold text-emerald-400">正常</span></div></div>
      </div>

      <div class="grid sm:grid-cols-3 gap-4 mb-8">
        <a href="/keys" class="glass-card p-5 block no-underline group"><h3 class="font-bold text-white group-hover:text-cyan-400 transition-colors">🔑 API 密钥</h3><p class="text-xs text-slate-500 mt-1">创建和管理密钥</p></a>
        <a href="/recharge" class="glass-card p-5 block no-underline group"><h3 class="font-bold text-white group-hover:text-cyan-400 transition-colors">💰 充值中心</h3><p class="text-xs text-slate-500 mt-1">购买额度套餐</p></a>
        <a href="/#docs" class="glass-card p-5 block no-underline group"><h3 class="font-bold text-white group-hover:text-cyan-400 transition-colors">📖 API 文档</h3><p class="text-xs text-slate-500 mt-1">接入指南和示例</p></a>
      </div>

      <div class="glass-card p-6">
        <h2 class="text-lg font-bold text-white mb-4">💻 快速开始</h2>
        <div class="bg-slate-950 rounded-xl p-5 font-mono text-sm space-y-2">
          <div><span class="text-fuchsia-400">from</span> openai <span class="text-fuchsia-400">import</span> OpenAI</div>
          <div class="mt-2"><span class="text-cyan-400">client</span> = OpenAI(</div>
          <div>&nbsp;&nbsp;api_key=<span class="text-amber-400">"你的密钥"</span>,</div>
          <div>&nbsp;&nbsp;base_url=<span class="text-amber-400" id="baseUrlDisplay">"https://你的域名/v1"</span></div>
          <div>)</div>
          <div class="mt-2 text-slate-500"># 先到 <a href="/keys" class="text-cyan-400 underline">密钥管理</a> 创建密钥，再替换上面的值</div>
          <div class="mt-2">client.chat.completions.create(model=<span class="text-amber-400">"gpt-5.5"</span>, messages=[...])</div>
        </div>
      </div>
    </div>
    <script>document.getElementById('baseUrlDisplay').textContent = '"https://' + window.location.host + '/v1"';</script>
  `, { ...opts, title: '控制台', scripts: TOAST_SCRIPT });
}
