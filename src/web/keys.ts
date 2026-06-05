import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export function keysPage(opts: LayoutOpts): string {
  return layout(`
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">🔑 API 密钥管理</h1>
          <p class="text-sm text-slate-500 mt-1">创建和管理你的 API 密钥，用于调用 AI 模型</p>
        </div>
        <button onclick="showCreateForm()" class="btn-primary !py-2.5" id="createBtn">
          + 创建新密钥
        </button>
      </div>

      <!-- Create form (hidden by default) -->
      <div id="createForm" class="card p-6 mb-6 hidden">
        <h3 class="font-bold text-lg mb-4">创建新 API 密钥</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">密钥名称</label>
            <input type="text" id="keyName" class="input-field" placeholder="例如：生产环境、我的App、测试用" maxlength="50">
            <p class="text-xs text-slate-400 mt-1">给密钥起个名字，方便区分用途</p>
          </div>
          <div class="flex gap-3">
            <button onclick="createKey()" class="btn-primary !py-2.5" id="submitKeyBtn">确认创建</button>
            <button onclick="document.getElementById('createForm').classList.add('hidden')" class="btn-secondary !py-2.5">取消</button>
          </div>
        </div>
      </div>

      <!-- New key reveal (shown once after creation) -->
      <div id="newKeyReveal" class="card p-6 mb-6 hidden" style="border:2px solid #f59e0b; background:#fffbeb;">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">⚠️</span>
          <h3 class="font-bold text-lg text-amber-800">请立即复制你的 API 密钥</h3>
        </div>
        <p class="text-sm text-amber-700 mb-4">这个密钥<strong>只显示一次</strong>，关闭后无法再次查看。请现在就复制并妥善保管！</p>
        <div class="bg-slate-900 text-emerald-300 rounded-xl p-5 font-mono text-sm break-all select-all mb-3" id="newKeyDisplay"></div>
        <div class="flex gap-3">
          <button onclick="copyNewKey()" class="btn-primary !py-2.5" id="copyNewBtn">📋 复制到剪贴板</button>
          <button onclick="dismissNewKey()" class="btn-secondary !py-2.5">我已安全保存，关闭</button>
        </div>
      </div>

      <!-- Key list -->
      <div class="card p-6">
        <h3 class="font-bold text-lg mb-4">我的密钥</h3>
        <div id="keyList" class="space-y-3">
          <div class="text-center py-8 text-slate-400">加载中...</div>
        </div>
      </div>

      <!-- Usage tips -->
      <div class="card p-6 mt-6 bg-primary-50 border-primary-100">
        <h3 class="font-bold text-lg mb-3">💡 使用方式</h3>
        <div class="bg-slate-900 text-slate-50 rounded-xl p-5 text-sm font-mono overflow-x-auto">
          <div class="text-slate-400"># Base URL</div>
          <div><span class="text-emerald-400">https://</span><span class="text-amber-400" id="hostDisplay"></span></div>
          <div class="mt-3 text-slate-400"># Authentication</div>
          <div><span class="text-sky-400">Authorization:</span> Bearer <span class="text-amber-400">你的密钥</span></div>
          <div class="mt-3 text-slate-400"># Endpoints</div>
          <div><span class="text-emerald-400">POST</span> /v1/chat/completions</div>
          <div><span class="text-emerald-400">POST</span> /v1/images/generations</div>
          <div><span class="text-emerald-400">POST</span> /v1/video/generations</div>
        </div>
      </div>
    </div>

    <script>
      document.getElementById('hostDisplay').textContent = window.location.host;
      var newKeyValue = '';

      function showCreateForm() {
        document.getElementById('createForm').classList.remove('hidden');
        document.getElementById('keyName').focus();
      }

      async function createKey() {
        var name = document.getElementById('keyName').value.trim() || '未命名密钥';
        var btn = document.getElementById('submitKeyBtn');
        btn.textContent = '创建中...'; btn.disabled = true;
        try {
          var r = await fetch('/api/keys/create', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({name: name})
          });
          var d = await r.json();
          if (r.ok && d.key) {
            newKeyValue = d.key;
            document.getElementById('createForm').classList.add('hidden');
            document.getElementById('newKeyDisplay').textContent = d.key;
            document.getElementById('newKeyReveal').classList.remove('hidden');
            document.getElementById('keyName').value = '';
            loadKeys();
          } else {
            alert(d.error || '创建失败');
          }
        } catch(e) { alert('网络错误'); }
        btn.textContent = '确认创建'; btn.disabled = false;
      }

      function copyNewKey() {
        navigator.clipboard.writeText(newKeyValue).then(function() {
          var btn = document.getElementById('copyNewBtn');
          btn.textContent = '✅ 已复制！';
          setTimeout(function() { btn.textContent = '📋 复制到剪贴板'; }, 2000);
        });
      }

      function dismissNewKey() {
        if (newKeyValue && !document.getElementById('copyNewBtn').textContent.includes('已复制')) {
          if (!confirm('你还没有复制密钥！确定要关闭吗？关闭后密钥将无法再次查看。')) return;
        }
        document.getElementById('newKeyReveal').classList.add('hidden');
        newKeyValue = '';
      }

      async function loadKeys() {
        try {
          var r = await fetch('/api/keys/list');
          var d = await r.json();
          var el = document.getElementById('keyList');
          if (!d.keys || d.keys.length === 0) {
            el.innerHTML = '<div class="text-center py-12 text-slate-400"><div class="text-4xl mb-3">🔑</div><p>还没有 API 密钥</p><p class="text-sm mt-1">点击上方按钮创建你的第一个密钥</p></div>';
            return;
          }
          el.innerHTML = d.keys.map(function(k) {
            return '<div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">' +
              '<div class="flex-1">' +
                '<div class="font-bold text-slate-800">' + escapeHtml(k.name || '未命名') + '</div>' +
                '<div class="font-mono text-sm text-slate-400 mt-1">' + maskKey(k.key) + '</div>' +
                '<div class="text-xs text-slate-400 mt-1">创建于 ' + (k.created_at||'').slice(0,10) + (k.last_used_at ? ' · 最近使用 ' + k.last_used_at.slice(0,10) : '') + '</div>' +
              '</div>' +
              '<button onclick="revokeKey(\'' + k.id + '\')" class="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">停用</button>' +
            '</div>';
          }).join('');
        } catch(e) {}
      }

      function maskKey(k) {
        if (!k || k.length < 16) return k;
        return k.slice(0, 8) + '•'.repeat(12) + k.slice(-4);
      }

      async function revokeKey(id) {
        if (!confirm('确定停用此密钥？停用后使用该密钥的请求将立即失败。')) return;
        try {
          var r = await fetch('/api/keys/revoke', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({id: id})
          });
          if (r.ok) loadKeys();
        } catch(e) {}
      }

      function escapeHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
      loadKeys();
    </script>
  `, opts);
}
