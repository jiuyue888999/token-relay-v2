import { layout, escapeHtml, TOAST_SCRIPT } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

interface DashboardData {
  user: {
    id: string;
    email: string;
    display_name: string;
    api_key: string;
    quota_remaining: number;
    total_quota_used: number;
    created_at: string;
  };
  recentLogs: Array<{
    id: string;
    provider: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    quota_cost: number;
    success: number;
    error_msg: string | null;
    created_at: string;
  }>;
}

interface UserRow {
  [key: string]: any;
}

function castUser(u: UserRow): DashboardData['user'] {
  return {
    id: String(u.id),
    email: String(u.email ?? ''),
    display_name: String(u.display_name ?? ''),
    api_key: String(u.api_key ?? ''),
    quota_remaining: Number(u.quota_remaining ?? 0),
    total_quota_used: Number(u.total_quota_used ?? 0),
    created_at: String(u.created_at ?? ''),
  };
}

function castLogs(rows: UserRow[]): DashboardData['recentLogs'] {
  return rows.map(r => ({
    id: String(r.id),
    provider: String(r.provider ?? ''),
    model: String(r.model ?? ''),
    prompt_tokens: Number(r.prompt_tokens ?? 0),
    completion_tokens: Number(r.completion_tokens ?? 0),
    total_tokens: Number(r.total_tokens ?? 0),
    quota_cost: Number(r.quota_cost ?? 0),
    success: Number(r.success ?? 0),
    error_msg: r.error_msg ? String(r.error_msg) : null,
    created_at: String(r.created_at ?? ''),
  }));
}

export function dashboardPage(opts: LayoutOpts & { data?: DashboardData }): string {
  if (!opts.data) {
    return layout(`<div class="max-w-6xl mx-auto px-4 py-20 text-center"><p class="text-slate-500">数据加载失败</p></div>`, { ...opts, title: '控制台' });
  }

  const d = opts.data;
  const u = d.user;

  return layout(`
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Welcome -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">👋 欢迎回来，${escapeHtml(u.display_name)}</h1>
        <p class="text-sm text-slate-500 mt-1">账户创建于 ${u.created_at.slice(0, 10)}</p>
      </div>

      <!-- Stats -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">剩余额度</div>
          <div class="text-2xl font-extrabold text-slate-900">${fmtNum(u.quota_remaining)}</div>
          <div class="text-xs text-slate-400 mt-1">tokens</div>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">已使用</div>
          <div class="text-2xl font-extrabold text-slate-900">${fmtNum(u.total_quota_used)}</div>
          <div class="text-xs text-slate-400 mt-1">tokens</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #eef2ff, #e0e7ff); border-color: #c7d2fe;">
          <div class="text-xs text-primary-500 uppercase tracking-wide mb-1">今日请求</div>
          <div class="text-2xl font-extrabold text-primary-700">${d.recentLogs.filter(l => l.created_at.slice(0,10) === new Date().toISOString().slice(0,10)).length}</div>
          <div class="text-xs text-primary-400 mt-1">次</div>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">账户状态</div>
          <div class="flex items-center gap-2 mt-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span class="font-bold text-emerald-600">正常</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">可正常使用</div>
        </div>
      </div>

      <!-- API Key -->
      <div class="card p-6 mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 class="font-bold text-lg">🔑 您的 API Key</h2>
            <p class="text-sm text-slate-400 mt-1">请妥善保管，不要泄露给他人</p>
          </div>
          <button onclick="copyKey()" class="btn-secondary text-sm !py-2" id="copyBtn">
            📋 复制到剪贴板
          </button>
        </div>
        <div class="bg-slate-900 text-emerald-300 rounded-xl p-5 font-mono text-sm break-all select-all" id="apiKeyDisplay">
          ${escapeHtml(u.api_key)}
        </div>
        <div class="mt-4 text-xs text-slate-400">
          <strong>API 端点：</strong>
          <code class="px-2 py-0.5 bg-slate-100 rounded text-slate-600">POST /v1/chat/completions</code>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>认证方式：</strong>
          <code class="px-2 py-0.5 bg-slate-100 rounded text-slate-600">Authorization: Bearer {你的Key}</code>
        </div>
      </div>

      <!-- Recent Usage -->
      <div class="card p-6">
        <h2 class="font-bold text-lg mb-4">📊 最近使用记录</h2>
        ${d.recentLogs.length === 0 ? `
          <div class="text-center py-12 text-slate-400">
            <div class="text-4xl mb-3">📭</div>
            <p>暂无使用记录</p>
            <p class="text-sm mt-1">开始使用 API 后，记录将显示在这里</p>
          </div>
        ` : `
          <div class="overflow-x-auto -mx-2">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
                  <th class="px-3 py-3">时间</th>
                  <th class="px-3 py-3">模型</th>
                  <th class="px-3 py-3">厂商</th>
                  <th class="px-3 py-3 text-right">输入</th>
                  <th class="px-3 py-3 text-right">输出</th>
                  <th class="px-3 py-3 text-right">总额</th>
                  <th class="px-3 py-3 text-right">扣费</th>
                  <th class="px-3 py-3 text-center">状态</th>
                </tr>
              </thead>
              <tbody>
                ${d.recentLogs.map(l => `
                  <tr class="border-b border-slate-50">
                    <td class="px-3 py-3 text-slate-500 whitespace-nowrap">${l.created_at.slice(5,19).replace('T',' ')}</td>
                    <td class="px-3 py-3 font-medium text-slate-700">${escapeHtml(l.model)}</td>
                    <td class="px-3 py-3">
                      <span class="px-2 py-0.5 rounded-md text-xs font-medium ${providerColor(l.provider)}">${escapeHtml(l.provider)}</span>
                    </td>
                    <td class="px-3 py-3 text-right">${fmtNum(l.prompt_tokens)}</td>
                    <td class="px-3 py-3 text-right">${fmtNum(l.completion_tokens)}</td>
                    <td class="px-3 py-3 text-right font-medium">${fmtNum(l.total_tokens)}</td>
                    <td class="px-3 py-3 text-right font-medium text-slate-700">${l.quota_cost}</td>
                    <td class="px-3 py-3 text-center">
                      ${l.success ? '<span class="text-emerald-500">✓</span>' : `<span class="text-red-400" title="${escapeHtml(l.error_msg||'')}">✗</span>`}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>

    <script>
      function copyKey() {
        const el = document.getElementById('apiKeyDisplay');
        navigator.clipboard.writeText(el.textContent.trim()).then(() => {
          const btn = document.getElementById('copyBtn');
          btn.textContent = '✅ 已复制!';
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-primary');
          setTimeout(() => {
            btn.textContent = '📋 复制到剪贴板';
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
          }, 2000);
        });
      }
    </script>
  `, { ...opts, title: '控制台', scripts: TOAST_SCRIPT });
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K';
  return String(n);
}

function providerColor(p: string): string {
  const map: Record<string,string> = {
    openai: 'bg-emerald-50 text-emerald-600',
    anthropic: 'bg-amber-50 text-amber-600',
    gemini: 'bg-blue-50 text-blue-600',
    deepseek: 'bg-violet-50 text-violet-600',
  };
  return map[p] ?? 'bg-slate-100 text-slate-600';
}

export { type DashboardData, castUser, castLogs };
