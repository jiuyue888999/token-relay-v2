import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

function fmtNum(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K';
  return String(n);
}

export function rechargePage(opts: LayoutOpts, packages: any[]): string {
  return layout(`
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 class="text-3xl font-bold text-white mb-2">💰 充值中心</h1>
      <p class="text-slate-400 mb-8">选择套餐 → 扫码支付 → 自动到账</p>

      <!-- Packages -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        ${packages.map((p: any, i: number) => `
          <div class="glass-card p-5 text-center cursor-pointer package-card ${i===0?'glow-border':''}"
               data-id="${p.id}" data-amount="${p.quota_amount}" data-price="${(p.price_cents/100).toFixed(2)}"
               onclick="selectPackage(this)" style="${i===0?'border-color:rgba(6,182,212,0.5);':''}">
            <h3 class="font-bold text-lg text-white mb-1">${escapeHtml(p.name)}</h3>
            <p class="text-xs text-slate-500 mb-3">${escapeHtml(p.description || '')}</p>
            <div class="text-3xl font-extrabold text-white mb-1">${fmtNum(p.quota_amount)}</div>
            <div class="text-sm text-slate-500 mb-2">tokens</div>
            <div class="text-xl font-bold glow-text">¥${(p.price_cents/100).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Payment -->
      <div class="glass-card p-6">
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-lg font-bold text-white mb-4">📱 支付方式</h3>
            <div class="flex gap-3 mb-4">
              <button onclick="selectPay('wechat')" class="pay-btn flex-1 p-4 rounded-xl border-2 border-green-500/30 text-center transition-all" id="btnWechat" style="background:rgba(7,188,12,0.08);">
                <div class="flex items-center justify-center gap-2 mb-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#07C160"><path d="M8.69 3.46C5.29 4.72 2.86 8.04 3.1 11.81c.17 2.64 1.31 4.88 3.05 6.4.28.26.34.7.15 1.02l-1.06 1.8c-.13.23.07.43.29.31l2.16-1.05c.23-.11.5-.07.7.06 1.18.76 2.55 1.19 4.02 1.19 5.79 0 10.49-4.24 10.49-9.48 0-4.3-3.16-7.94-7.5-9.01-.23-.06-.48.06-.5.3-.05.55-.54.97-1.1.9-.45-.06-.74-.53-.61-.96.13-.44-.19-.89-.64-.87-1.05.05-2.09.34-3.02.84zM9.83 9.32c.59 0 1.08.44 1.08.99 0 .54-.48.98-1.08.98-.59 0-1.07-.44-1.07-.98.01-.55.48-.99 1.07-.99zm4.35 0c.59 0 1.07.44 1.07.99 0 .54-.48.98-1.07.98-.59 0-1.08-.44-1.08-.98 0-.55.49-.99 1.08-.99z"/></svg>
                  <span class="font-bold text-green-400 text-sm">微信支付</span>
                </div>
              </button>
              <button onclick="selectPay('alipay')" class="pay-btn flex-1 p-4 rounded-xl border-2 border-blue-500/30 text-center transition-all" id="btnAlipay" style="background:rgba(22,119,255,0.08);">
                <div class="flex items-center justify-center gap-2 mb-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1677FF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.5 6h-5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1.5v3h-1.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h3c.83 0 1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5h-1.5V8h2c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5z"/></svg>
                  <span class="font-bold text-blue-400 text-sm">支付宝</span>
                </div>
              </button>
            </div>

            <div class="p-4 rounded-xl" style="background:rgba(15,23,42,0.6);border:1px solid rgba(71,85,105,0.2);">
              <div class="text-xs text-slate-500 mb-1">已选套餐</div>
              <div class="font-bold text-lg text-white" id="selectedPackage">-</div>
              <div class="text-sm text-slate-400" id="selectedAmount">-</div>
              <div class="text-xl font-bold glow-text mt-1" id="selectedPrice">-</div>
            </div>
          </div>

          <div class="text-center">
            <h3 class="text-lg font-bold text-white mb-4">📷 扫码支付</h3>
            <div id="qrArea" class="rounded-xl p-6 mb-3 flex items-center justify-center" style="background:rgba(15,23,42,0.6);border:1px solid rgba(71,85,105,0.2);min-height:250px;">
              <p class="text-slate-500 text-sm">选择套餐和支付方式<br>联系管理员获取收款码</p>
            </div>
            <button onclick="submitPayment()" class="btn-cyber w-full !py-3 justify-center" id="paidBtn">
              ✅ 已完成支付，通知管理员
            </button>
          </div>
        </div>
      </div>

      <div class="glass-card p-6 mt-6">
        <h3 class="text-lg font-bold text-white mb-4">📋 充值记录</h3>
        <div id="orderHistory" class="text-center py-8 text-slate-500">加载中...</div>
      </div>
    </div>

    <script>
      var selectedPkg = null, payMethod = 'wechat';
      var first = document.querySelector('.package-card');
      if(first) selectPackage(first);
      selectPay('wechat');

      function selectPackage(el) {
        document.querySelectorAll('.package-card').forEach(function(c){ c.classList.remove('glow-border'); c.style.borderColor='rgba(71,85,105,0.25)'; });
        el.classList.add('glow-border'); el.style.borderColor='rgba(6,182,212,0.5)';
        selectedPkg = { id: el.dataset.id, amount: parseInt(el.dataset.amount), price: el.dataset.price };
        document.getElementById('selectedPackage').textContent = el.querySelector('h3').textContent;
        document.getElementById('selectedAmount').textContent = el.querySelector('.text-3xl').textContent + ' tokens';
        document.getElementById('selectedPrice').textContent = '¥' + el.dataset.price;
      }

      function selectPay(method) {
        payMethod = method;
        var w = document.getElementById('btnWechat'), a = document.getElementById('btnAlipay');
        w.style.borderColor = method==='wechat'?'rgba(7,188,12,0.6)':'rgba(74,222,128,0.2)';
        w.style.background = method==='wechat'?'rgba(7,188,12,0.15)':'rgba(7,188,12,0.05)';
        a.style.borderColor = method==='alipay'?'rgba(22,119,255,0.6)':'rgba(96,165,250,0.2)';
        a.style.background = method==='alipay'?'rgba(22,119,255,0.15)':'rgba(22,119,255,0.05)';
      }

      async function submitPayment() {
        if(!selectedPkg){ alert('请选择套餐'); return; }
        var btn = document.getElementById('paidBtn');
        btn.textContent = '提交中...'; btn.disabled = true;
        try {
          var r = await fetch('/api/recharge/notify', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ package_id: selectedPkg.id, payment_method: payMethod })
          });
          if(r.ok) { alert('已通知管理员，确认到账后额度自动充值（1-5分钟）'); btn.textContent = '⏳ 等待确认'; loadOrders(); }
          else { alert('提交失败'); btn.textContent = '✅ 已完成支付，通知管理员'; }
        } catch(e) { alert('网络错误'); btn.textContent = '✅ 已完成支付，通知管理员'; }
        btn.disabled = false;
      }

      async function loadOrders() {
        try {
          var r = await fetch('/api/recharge/orders'); var orders = await r.json();
          var el = document.getElementById('orderHistory');
          if(!orders||orders.length===0){ el.innerHTML='<div class="text-slate-500">暂无记录</div>'; return; }
          el.innerHTML = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-xs text-slate-500 uppercase" style="border-bottom:1px solid rgba(71,85,105,0.2)"><th class="px-3 py-2">时间</th><th class="px-3 py-2">套餐</th><th class="px-3 py-2">额度</th><th class="px-3 py-2">支付</th><th class="px-3 py-2">状态</th></tr></thead><tbody>' +
            orders.map(function(o){return '<tr style="border-bottom:1px solid rgba(71,85,105,0.1)"><td class="px-3 py-2 text-slate-400 text-xs">'+(o.created_at||'').slice(0,16)+'</td><td class="px-3 py-2 text-white text-sm">'+escapeHtml(o.package_name||'-')+'</td><td class="px-3 py-2 text-slate-300">'+fmtNum2(o.quota_amount||0)+'</td><td class="px-3 py-2">'+(o.payment_method==='wechat'?'<span class=\'text-green-400\'>微信</span>':o.payment_method==='alipay'?'<span class=\'text-blue-400\'>支付宝</span>':'-')+'</td><td class="px-3 py-2"><span class="px-2 py-0.5 rounded text-xs font-bold '+(o.status==='done'?'text-green-400':o.status==='pending'?'text-amber-400':'text-slate-600')+'">'+(o.status==='done'?'已到账':o.status==='pending'?'待确认':'已取消')+'</span></td></tr>';}).join('') + '</tbody></table></div>';
        } catch(e) {}
      }

      function fmtNum2(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(n);}
      function escapeHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
      loadOrders();
    </script>
  `, opts);
}
