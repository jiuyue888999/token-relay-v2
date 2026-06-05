import { layout, escapeHtml, TOAST_SCRIPT } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

interface AdminData {
  keys: Array<Record<string, any>>;
  users: Array<Record<string, any>>;
  packages: Array<Record<string, any>>;
  stats: Record<string, any>;
}

export function adminPage(opts: LayoutOpts & { data?: AdminData }): string {
  const d = opts.data;
  if (!d) return layout(`<div class="max-w-6xl mx-auto px-4 py-20 text-center"><p>加载失败</p></div>`, { ...opts, title: '管理面板', admin: true });

  return layout(`
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">⚙️ 管理面板</h1>
          <p class="text-sm text-slate-500 mt-1">管理上游 Key、用户、套餐和查看统计</p>
        </div>
        <div class="flex gap-2 text-sm">
          <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
            ${d.stats?.user_count ?? 0} 用户
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium">
            ${d.stats?.active_keys ?? 0} 活跃Key
          </span>
        </div>
      </div>

      <!-- Stats cards -->
      <div class="grid sm:grid-cols-3 gap-4 mb-8">
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide">总 Token 消耗</div>
          <div class="text-2xl font-extrabold">${fmtNum(d.stats?.total?.total_tokens ?? 0)}</div>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide">总费用</div>
          <div class="text-2xl font-extrabold">${fmtNum(d.stats?.total?.total_cost ?? 0)}</div>
        </div>
        <div class="stat-card">
          <div class="text-xs text-slate-400 uppercase tracking-wide">活跃用户</div>
          <div class="text-2xl font-extrabold">${d.stats?.user_count ?? 0}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit" id="tabs">
        ${['上游 Key','用户','套餐','统计'].map((t,i) => `
          <button onclick="switchTab(${i})" class="tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all ${i===0?'bg-white shadow text-slate-800':'text-slate-500'}" data-tab="${i}">${t}</button>
        `).join('')}
      </div>

      <!-- Tab 0: Upstream Keys -->
      <div class="tab-content card p-6" data-tab="0">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">上游 API Key 管理</h3>
          <button onclick="showAddKeyForm()" class="btn-primary text-sm !py-2">+ 添加 Key</button>
        </div>

        <!-- Add Key Form (hidden by default) -->
        <div id="addKeyForm" class="hidden mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
          <h4 class="font-semibold mb-3">添加新的上游 Key</h4>
          <form onsubmit="addKey(event)" class="grid sm:grid-cols-2 gap-3">
            <select name="provider" class="input-field" required>
              <option value="">选择厂商</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google Gemini</option>
              <option value="deepseek">DeepSeek</option>
            </select>
            <input name="api_key" class="input-field" placeholder="API Key" required>
            <input name="base_url" class="input-field" placeholder="自定义 Base URL (可选)">
            <input name="display_name" class="input-field" placeholder="备注名称 (可选)">
            <input name="priority" type="number" class="input-field" placeholder="优先级 (越大越优先)" value="0">
            <button type="submit" class="btn-primary !py-2.5 sm:col-span-2">确认添加</button>
          </form>
        </div>

        <!-- Key list -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
                <th class="px-3 py-3">名称</th><th class="px-3 py-3">厂商</th><th class="px-3 py-3">Key</th><th class="px-3 py-3">优先级</th><th class="px-3 py-3 text-center">状态</th><th class="px-3 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              ${d.keys.map((k: any) => `
                <tr class="border-b border-slate-50">
                  <td class="px-3 py-3 font-medium">${escapeHtml(k.display_name||'-')}</td>
                  <td class="px-3 py-3"><span class="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100">${escapeHtml(k.provider)}</span></td>
                  <td class="px-3 py-3 font-mono text-xs text-slate-400">${maskKey(k.api_key)}</td>
                  <td class="px-3 py-3">${k.priority}</td>
                  <td class="px-3 py-3 text-center">
                    <form onsubmit="toggleKey(event, '${k.id}', ${k.is_active?0:1})" class="inline">
                      <button type="submit" class="text-xs font-bold px-2 py-1 rounded ${k.is_active?'text-emerald-600 bg-emerald-50':'text-red-500 bg-red-50'}">
                        ${k.is_active?'活跃':'停用'}
                      </button>
                    </form>
                  </td>
                  <td class="px-3 py-3 text-right">
                    <form onsubmit="deleteKey(event, '${k.id}')" class="inline">
                      <button type="submit" class="text-xs text-red-400 hover:text-red-600 px-2 py-1">删除</button>
                    </form>
                  </td>
                </tr>
              `).join('')}
              ${d.keys.length===0 ? '<tr><td colspan="6" class="px-3 py-8 text-center text-slate-400">暂无上游 Key，请先添加</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 1: Users -->
      <div class="tab-content card p-6 hidden" data-tab="1">
        <h3 class="font-bold text-lg mb-4">用户管理</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
                <th class="px-3 py-3">名称</th><th class="px-3 py-3">邮箱</th><th class="px-3 py-3">API Key</th><th class="px-3 py-3 text-right">剩余额度</th><th class="px-3 py-3 text-right">已使用</th><th class="px-3 py-3 text-center">状态</th><th class="px-3 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              ${d.users.map((u: any) => `
                <tr class="border-b border-slate-50">
                  <td class="px-3 py-3 font-medium">${escapeHtml(u.display_name||u.email||'-')}</td>
                  <td class="px-3 py-3 text-slate-500">${escapeHtml(u.email||'-')}</td>
                  <td class="px-3 py-3 font-mono text-xs text-slate-400">${maskKey(u.api_key)}</td>
                  <td class="px-3 py-3 text-right font-medium">${fmtNum(u.quota_remaining)}</td>
                  <td class="px-3 py-3 text-right">${fmtNum(u.total_quota_used)}</td>
                  <td class="px-3 py-3 text-center">
                    <span class="text-xs font-bold px-2 py-1 rounded ${u.is_active?'text-emerald-600 bg-emerald-50':'text-red-500 bg-red-50'}">
                      ${u.is_active?'正常':'停用'}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-right">
                    <form onsubmit="rechargeUser(event, '${u.id}')" class="inline-flex gap-2 items-center">
                      <select name="package_id" class="text-xs rounded-lg border border-slate-200 px-2 py-1">
                        ${d.packages.map((p: any) => `<option value="${p.id}">${escapeHtml(p.name)} (${fmtNum(p.quota_amount)})</option>`).join('')}
                      </select>
                      <button type="submit" class="text-xs btn-primary !py-1 !px-3">充值</button>
                    </form>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: Packages -->
      <div class="tab-content card p-6 hidden" data-tab="2">
        <h3 class="font-bold text-lg mb-4">套餐管理</h3>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${d.packages.map((p: any) => `
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h4 class="font-bold text-lg">${escapeHtml(p.name)}</h4>
              <p class="text-xs text-slate-400 mt-1">${escapeHtml(p.description||'')}</p>
              <div class="mt-3 text-2xl font-extrabold">${fmtNum(p.quota_amount)}</div>
              <div class="text-sm text-slate-500">tokens</div>
              <div class="mt-2 text-lg font-bold gradient-text">¥${(p.price_cents/100).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tab 3: Stats -->
      <div class="tab-content card p-6 hidden" data-tab="3">
        <h3 class="font-bold text-lg mb-4">按厂商统计</h3>
        ${(d.stats?.by_provider||[]).length ? `
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-left text-slate-400 text-xs uppercase tracking-wide">
                <th class="px-3 py-3">厂商</th><th class="px-3 py-3 text-right">Tokens</th><th class="px-3 py-3 text-right">请求数</th>
              </tr>
            </thead>
            <tbody>
              ${(d.stats?.by_provider||[]).map((r:any) => `
                <tr class="border-b border-slate-50">
                  <td class="px-3 py-3 font-medium">${escapeHtml(r.provider)}</td>
                  <td class="px-3 py-3 text-right">${fmtNum(r.tokens)}</td>
                  <td class="px-3 py-3 text-right">${r.requests}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="text-slate-400 text-center py-12">暂无使用数据</p>'}
      </div>

    </div>

    <script>
      function switchTab(i) {
        document.querySelectorAll('.tab-btn').forEach((b,idx) => {
          b.className = idx===i ? 'tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white shadow text-slate-800' : 'tab-btn px-4 py-2 rounded-lg text-sm font-medium transition-all text-slate-500';
        });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        const target = document.querySelector('.tab-content[data-tab="'+i+'"]');
        if(target) target.classList.remove('hidden');
      }
      function showAddKeyForm() { document.getElementById('addKeyForm').classList.toggle('hidden'); }
      async function addKey(e) {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form));
        const resp = await fetch('/admin/keys', {
          method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+getAdminKey()},
          body:JSON.stringify(data)
        });
        if(resp.ok) { toast('添加成功','success'); setTimeout(()=>location.reload(),1000); }
        else { const r=await resp.json(); toast(r.error||'添加失败','error'); }
      }
      async function toggleKey(e, id, active) {
        e.preventDefault();
        const resp = await fetch('/admin/keys/'+id, {
          method:'PATCH', headers:{'Content-Type':'application/json','Authorization':'Bearer '+getAdminKey()},
          body:JSON.stringify({is_active:active})
        });
        if(resp.ok) location.reload();
      }
      async function deleteKey(e, id) {
        e.preventDefault();
        if(!confirm('确定删除此 Key？')) return;
        const resp = await fetch('/admin/keys/'+id, {
          method:'DELETE', headers:{'Authorization':'Bearer '+getAdminKey()}
        });
        if(resp.ok) location.reload();
      }
      async function rechargeUser(e, userId) {
        e.preventDefault();
        const form = e.target;
        const packageId = form.package_id.value;
        const resp = await fetch('/admin/users/'+userId+'/recharge', {
          method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+getAdminKey()},
          body:JSON.stringify({package_id:packageId})
        });
        if(resp.ok) { toast('充值成功','success'); setTimeout(()=>location.reload(),1000); }
        else toast('充值失败','error');
      }
      function getAdminKey() { return prompt('请输入管理员 API Key:'); }
      function toast(m,t){const e=document.createElement('div');e.className='fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-50 transition-all';e.style.background=t==='error'?'#ef4444':'#10b981';e.textContent=m;document.body.appendChild(e);setTimeout(()=>{e.style.opacity='0';e.style.transition='opacity 0.3s';setTimeout(()=>e.remove(),300)},3000);}
    </script>
  `, { ...opts, title: '管理面板', admin: true, scripts: TOAST_SCRIPT });
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K';
  return String(n ?? 0);
}

function maskKey(k: string): string {
  if (!k || k.length < 12) return k;
  return k.slice(0, 6) + '••••••' + k.slice(-4);
}

export type { AdminData };
