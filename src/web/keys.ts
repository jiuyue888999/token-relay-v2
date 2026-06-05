import { layout, escapeHtml, TOAST_SCRIPT } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export function keysPage(opts: LayoutOpts): string {
  return layout(`
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white">🔑 API 密钥</h1>
          <p class="text-sm text-slate-400 mt-2">创建和管理密钥，用于调用 AI 模型。密钥<strong class="text-cyan-400">仅在创建时显示一次</strong>。</p>
        </div>
        <button onclick="showCreateForm()" class="btn-cyber !py-3 !px-6 text-base" id="createBtn">
          + 创建密钥
        </button>
      </div>

      <!-- Create form -->
      <div id="createForm" class="glass-card p-6 mb-6 hidden">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">✨ 创建新密钥</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">密钥名称 <span class="text-slate-500">（方便区分用途）</span></label>
            <input type="text" id="keyName" class="input-cyber" placeholder="例如：生产环境、我的App、测试密钥" maxlength="30">
          </div>
          <div class="flex gap-3">
            <button onclick="createKey()" class="btn-cyber" id="submitKeyBtn">确认创建</button>
            <button onclick="document.getElementById('createForm').classList.add('hidden')" class="btn-ghost">取消</button>
          </div>
        </div>
      </div>

      <!-- New key reveal -->
      <div id="newKeyReveal" class="hidden mb-6 p-6 rounded-xl" style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.4);">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl">⚠️</span>
          <div>
            <h3 class="text-lg font-bold text-amber-300">请立即复制你的密钥！</h3>
            <p class="text-sm text-amber-400/80">此密钥仅显示一次，关闭后无法再次查看。</p>
          </div>
        </div>
        <div class="bg-slate-950 rounded-xl p-4 mb-4">
          <code class="text-cyan-300 text-sm break-all font-mono" id="newKeyDisplay"></code>
        </div>
        <div class="flex gap-3">
          <button onclick="copyNewKey()" class="btn-cyber" id="copyNewBtn">📋 复制到剪贴板</button>
          <button onclick="dismissNewKey()" class="btn-ghost">我已保存，关闭</button>
        </div>
      </div>

      <!-- Key list -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-bold text-white mb-4">我的密钥</h3>
        <div id="keyList" class="space-y-3">
          <div class="text-center py-12 text-slate-500">加载中...</div>
        </div>
      </div>

      <div class="glass-card p-6 mt-6">
        <h3 class="text-lg font-bold text-white mb-3">📡 使用你的密钥</h3>
        <div class="bg-slate-950 rounded-xl p-5 font-mono text-sm space-y-2">
          <div class="text-slate-500"># Base URL</div>
          <div class="text-cyan-400" id="hostDisplay"></div>
          <div class="mt-3 text-slate-500"># Authentication header</div>
          <div><span class="text-cyan-400">Authorization: Bearer</span> <span class="text-amber-400">你的密钥</span></div>
          <div class="mt-3 text-slate-500"># Chat completions</div>
          <div><span class="text-emerald-400">POST</span> <span class="text-slate-400">/v1/chat/completions</span></div>
          <div><span class="text-emerald-400">POST</span> <span class="text-slate-400">/v1/images/generations</span></div>
          <div><span class="text-emerald-400">POST</span> <span class="text-slate-400">/v1/video/generations</span></div>
        </div>
      </div>
    </div>

    <script>
      document.getElementById('hostDisplay').textContent = 'https://' + window.location.host + '/v1';
      var newKeyValue = '';

      function showCreateForm() { document.getElementById('createForm').classList.remove('hidden'); document.getElementById('keyName').focus(); }
      function hideCreateForm() { document.getElementById('createForm').classList.add('hidden'); }

      async function createKey() {
        var name = document.getElementById('keyName').value.trim() || '未命名';
        var btn = document.getElementById('submitKeyBtn');
        btn.textContent = '创建中...'; btn.disabled = true;
        try {
          var r = await fetch('/api/keys/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name: name}) });
          var d = await r.json();
          if (r.ok && d.key) {
            newKeyValue = d.key;
            document.getElementById('createForm').classList.add('hidden');
            document.getElementById('newKeyDisplay').textContent = d.key;
            document.getElementById('newKeyReveal').classList.remove('hidden');
            document.getElementById('newKeyReveal').scrollIntoView({behavior:'smooth'});
            document.getElementById('keyName').value = '';
            loadKeys();
          } else { alert(d.error || '创建失败'); }
        } catch(e) { alert('网络错误: ' + e.message); }
        btn.textContent = '确认创建'; btn.disabled = false;
      }

      function copyNewKey() {
        navigator.clipboard.writeText(newKeyValue).then(function(){
          var btn = document.getElementById('copyNewBtn');
          btn.textContent = '✅ 已复制！'; btn.classList.add('btn-ghost'); btn.classList.remove('btn-cyber');
          setTimeout(function(){ btn.textContent = '📋 复制到剪贴板'; btn.classList.remove('btn-ghost'); btn.classList.add('btn-cyber'); }, 2000);
        });
      }

      function dismissNewKey() {
        if (newKeyValue && !document.getElementById('copyNewBtn').textContent.includes('已复制')) {
          if (!confirm('⚠️ 你还没有复制密钥！关闭后将无法再次查看。确定关闭吗？')) return;
        }
        document.getElementById('newKeyReveal').classList.add('hidden'); newKeyValue = '';
      }

      async function loadKeys() {
        try {
          var r = await fetch('/api/keys/list'); var d = await r.json();
          var el = document.getElementById('keyList');
          if (!d.keys || d.keys.length === 0) {
            el.innerHTML = '<div class="text-center py-12"><div class="text-4xl mb-3 opacity-30">🔑</div><p class="text-slate-500">还没有密钥</p><p class="text-sm text-slate-600 mt-1">点击上方按钮创建</p></div>';
            return;
          }
          el.innerHTML = d.keys.map(function(k){
            return '<div class="flex items-center justify-between p-4 rounded-xl" style="background:rgba(15,23,42,0.6);border:1px solid rgba(71,85,105,0.2);">' +
              '<div>' +
                '<div class="font-bold text-white text-sm">' + escapeHtml(k.name||'未命名') + '</div>' +
                '<div class="font-mono text-sm text-slate-500 mt-1">' + (k.is_active ? maskKey(k.key) : '<span class="text-red-400 line-through">已停用</span>') + '</div>' +
                '<div class="text-xs text-slate-600 mt-1">' + (k.created_at||'').slice(0,10) + '</div>' +
              '</div>' +
              (k.is_active ? '<button onclick="revokeKey(\''+k.id+'\')" class="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors bg-transparent border border-red-500/20 cursor-pointer">停用</button>' : '') +
            '</div>';
          }).join('');
        } catch(e) { console.error(e); }
      }

      function maskKey(k) { if(!k||k.length<16)return k; return k.slice(0,10) + '•'.repeat(16) + k.slice(-4); }

      async function revokeKey(id) {
        if(!confirm('确定停用此密钥？所有使用此密钥的请求将立即失败。')) return;
        try {
          var r = await fetch('/api/keys/revoke', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id:id}) });
          if(r.ok) loadKeys(); else alert('操作失败');
        } catch(e) { alert('网络错误'); }
      }

      function escapeHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
      loadKeys();
    </script>
  `, { ...opts, title: 'API 密钥管理', scripts: TOAST_SCRIPT });
}
