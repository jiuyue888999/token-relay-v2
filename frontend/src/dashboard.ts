import { layout, escapeHtml, TOAST_SCRIPT } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

/**
 * User dashboard — fetches data from New API backend.
 * The page loads, then JS calls /api/user/self and /api/user/token
 * to populate the dashboard with live data.
 */
export function dashboardPage(opts: LayoutOpts): string {
  return layout(`
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">👋 欢迎回来，<span id="userName">...</span></h1>
        <p class="text-sm text-slate-500 mt-1" id="userInfo"></p>
      </div>

      <!-- Stats -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">剩余额度</div>
          <div class="text-2xl font-extrabold text-slate-900" id="quotaRemain">-</div>
          <div class="text-xs text-slate-400 mt-1">tokens</div>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">已使用</div>
          <div class="text-2xl font-extrabold text-slate-900" id="quotaUsed">-</div>
          <div class="text-xs text-slate-400 mt-1">tokens</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #eef2ff, #e0e7ff); border-color: #c7d2fe;">
          <div class="text-xs text-primary-500 uppercase tracking-wide mb-1">API 令牌数</div>
          <div class="text-2xl font-extrabold text-primary-700" id="tokenCount">-</div>
          <div class="text-xs text-primary-400 mt-1">个</div>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide mb-1">账户状态</div>
          <div class="flex items-center gap-2 mt-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400" id="statusDot"></span>
            <span class="font-bold text-emerald-600" id="statusText">-</span>
          </div>
        </div>
      </div>

      <!-- API Token Card -->
      <div class="card p-6 mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 class="font-bold text-lg">🔑 我的 API 令牌</h2>
            <p class="text-sm text-slate-400 mt-1">用于调用 API，请妥善保管</p>
          </div>
          <button onclick="copyActiveKey()" class="btn-secondary text-sm !py-2" id="copyBtn">
            📋 复制到剪贴板
          </button>
        </div>
        <div id="tokenList" class="space-y-3">
          <div class="text-center py-8 text-slate-400">加载中...</div>
        </div>
        <div class="mt-4 text-xs text-slate-400">
          <strong>API 端点：</strong>
          <code class="px-2 py-0.5 bg-slate-100 rounded text-slate-600">POST /v1/chat/completions</code>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>图片：</strong>
          <code class="px-2 py-0.5 bg-slate-100 rounded text-slate-600">POST /v1/images/generations</code>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>视频：</strong>
          <code class="px-2 py-0.5 bg-slate-100 rounded text-slate-600">POST /v1/video/generations</code>
        </div>
      </div>

      <!-- Recent Usage -->
      <div class="card p-6">
        <h2 class="font-bold text-lg mb-4">📊 快速开始</h2>
        <div class="bg-slate-900 text-slate-50 rounded-xl p-5 text-sm font-mono overflow-x-auto">
          <div class="text-slate-400 mb-2"># Python 示例</div>
          <div><span class="text-fuchsia-400">from</span> openai <span class="text-fuchsia-400">import</span> OpenAI</div>
          <div class="mt-2"><span class="text-sky-400">client</span> = OpenAI(</div>
          <div>&nbsp;&nbsp;api_key=<span class="text-amber-400" id="sampleKey">"你的令牌"</span>,</div>
          <div>&nbsp;&nbsp;base_url=<span class="text-amber-400">"<script>document.write(window.location.origin)</script>/v1"</span></div>
          <div>)</div>
          <div class="mt-2"><span class="text-slate-400"># 支持 36+ 模型：</span></div>
          <div class="text-emerald-400"># gpt-5.5 | claude-opus-4-7 | deepseek-v4-pro | qwen/qwen3-max | gemini-3-pro</div>
        </div>
      </div>
    </div>

    <script>
      // Fetch user data from New API on page load
      async function loadDashboard() {
        try {
          const resp = await fetch('/api/user/self');
          if (!resp.ok) { window.location.href = '/login'; return; }
          const user = await resp.json();
          const data = user.data || user;

          document.getElementById('userName').textContent = data.display_name || data.email || data.username || '用户';
          document.getElementById('userInfo').textContent = '邮箱：' + (data.email || '-');
          document.getElementById('quotaRemain').textContent = formatNum(data.quota || data.remain_quota || 0);
          document.getElementById('quotaUsed').textContent = formatNum(data.used_quota || 0);
          document.getElementById('statusText').textContent = data.status === 1 || data.is_active ? '正常' : '已停用';
        } catch(e) {
          console.error('Failed to load user data:', e);
        }

        // Load tokens
        try {
          const resp = await fetch('/api/user/token');
          if (resp.ok) {
            const tokens = await resp.json();
            const list = tokens.data || tokens;
            document.getElementById('tokenCount').textContent = Array.isArray(list) ? list.length : (list ? 1 : 0);
            if (Array.isArray(list) && list.length > 0) {
              const html = list.map(t => '<div class="bg-slate-100 rounded-xl p-4 font-mono text-sm break-all select-all">' +
                escapeHtml(t.key || t.sk || '') +
                '<div class="text-xs text-slate-400 mt-1">状态：' + (t.status === 1 ? '✅ 正常' : '⛔ 已停用') +
                ' | 剩余：' + formatNum(t.remain_quota || 0) + ' tokens</div></div>').join('');
              document.getElementById('tokenList').innerHTML = html;
              document.getElementById('sampleKey').textContent = list[0].key || list[0].sk || '你的令牌';
            } else {
              document.getElementById('tokenList').innerHTML = '<div class="text-center py-8 text-slate-400">暂无令牌，请在管理面板创建</div>';
            }
          }
        } catch(e) {
          document.getElementById('tokenList').innerHTML = '<div class="text-center py-8 text-slate-400">加载失败</div>';
        }
      }

      function formatNum(n) {
        if (!n) return '0';
        if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n/1000).toFixed(1) + 'K';
        return String(n);
      }

      function escapeHtml(s) {
        return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      async function copyActiveKey() {
        const el = document.querySelector('#tokenList .bg-slate-100');
        if (!el) return;
        const key = el.textContent.split('\n')[0].trim();
        await navigator.clipboard.writeText(key);
        const btn = document.getElementById('copyBtn');
        btn.textContent = '✅ 已复制!';
        setTimeout(() => { btn.textContent = '📋 复制到剪贴板'; }, 2000);
      }

      loadDashboard();
    </script>
  `, { ...opts, title: '控制台', scripts: TOAST_SCRIPT });
}
