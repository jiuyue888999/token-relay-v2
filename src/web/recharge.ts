import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

function fmtNum(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K';
  return String(n);
}

export function rechargePage(opts: LayoutOpts, packages: any[], paymentQr?: { wechat?: string; alipay?: string }): string {
  return layout(`
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 class="text-2xl font-bold text-slate-900 mb-2">💰 充值中心</h1>
      <p class="text-sm text-slate-500 mb-8">选择套餐 → 扫码支付 → 管理员确认到账 → 自动充值</p>

      <!-- Packages -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="packageList">
        ${packages.map((p: any, i: number) => `
          <div class="card p-5 text-center cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all package-card ${i===0?'ring-2 ring-primary-300':''}" data-id="${p.id}" data-amount="${p.quota_amount}" data-price="${(p.price_cents/100).toFixed(2)}" onclick="selectPackage(this)">
            <h3 class="font-bold text-lg mb-1">${escapeHtml(p.name)}</h3>
            <p class="text-xs text-slate-400 mb-3">${escapeHtml(p.description || '')}</p>
            <div class="text-2xl font-extrabold text-slate-900 mb-1">${fmtNum(p.quota_amount)}</div>
            <div class="text-sm text-slate-500 mb-2">tokens</div>
            <div class="text-lg font-bold gradient-text">¥${(p.price_cents/100).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Payment Section -->
      <div class="card p-6" id="paymentSection">
        <div class="grid sm:grid-cols-2 gap-6">
          <!-- Left: Payment method -->
          <div>
            <h3 class="font-bold text-lg mb-4">📱 选择支付方式</h3>
            <div class="flex gap-3 mb-4">
              <button onclick="selectPay('wechat')" class="pay-btn flex-1 p-3 rounded-xl border-2 border-slate-200 hover:border-green-400 transition-all text-center" id="btnWechat">
                <div class="text-2xl mb-1">💚</div>
                <div class="text-sm font-bold">微信支付</div>
              </button>
              <button onclick="selectPay('alipay')" class="pay-btn flex-1 p-3 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all text-center" id="btnAlipay">
                <div class="text-2xl mb-1">💙</div>
                <div class="text-sm font-bold">支付宝</div>
              </button>
            </div>

            <!-- Selected package info -->
            <div class="bg-slate-50 rounded-xl p-4 mb-4">
              <div class="text-xs text-slate-400 mb-1">已选套餐</div>
              <div class="font-bold text-lg" id="selectedPackage">体验包</div>
              <div class="text-sm text-slate-500" id="selectedAmount">100,000 tokens</div>
              <div class="text-lg font-bold gradient-text mt-1" id="selectedPrice">¥0.00</div>
            </div>

            <button onclick="submitOrder()" class="btn-primary w-full !py-3 justify-center" id="submitBtn">
              确认下单 →
            </button>
          </div>

          <!-- Right: QR Code -->
          <div class="text-center">
            <h3 class="font-bold text-lg mb-4">📷 扫码支付</h3>
            <div id="qrArea" class="bg-slate-100 rounded-xl p-6 mb-3 min-h-[280px] flex items-center justify-center">
              <p class="text-slate-400 text-sm">选择套餐和支付方式后<br>此处显示收款码</p>
            </div>
            <p class="text-xs text-slate-400">支付完成后点击下方按钮提交</p>
            <button onclick="submitPayment()" class="btn-secondary w-full !py-2.5 mt-2 text-sm hidden" id="paidBtn">
              ✅ 我已支付，通知管理员
            </button>
          </div>
        </div>
      </div>

      <!-- Order History -->
      <div class="card p-6 mt-6">
        <h3 class="font-bold text-lg mb-4">📋 充值记录</h3>
        <div id="orderHistory" class="text-center py-8 text-slate-400 text-sm">
          加载中...
        </div>
      </div>
    </div>

    <script>
      let selectedPkg = null;
      let payMethod = 'wechat';

      // Init: select first package
      const firstCard = document.querySelector('.package-card');
      if(firstCard) selectPackage(firstCard);

      function selectPackage(el) {
        document.querySelectorAll('.package-card').forEach(c => c.classList.remove('ring-2','ring-primary-300'));
        el.classList.add('ring-2','ring-primary-300');
        selectedPkg = { id: el.dataset.id, amount: parseInt(el.dataset.amount), price: el.dataset.price };
        document.getElementById('selectedPackage').textContent = el.querySelector('h3').textContent;
        document.getElementById('selectedAmount').textContent = el.querySelector('.text-2xl').textContent + ' tokens';
        document.getElementById('selectedPrice').textContent = '¥' + el.dataset.price;
      }

      function selectPay(method) {
        payMethod = method;
        document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('border-green-400','border-blue-400','bg-green-50','bg-blue-50'));
        const btn = method === 'wechat' ? document.getElementById('btnWechat') : document.getElementById('btnAlipay');
        btn.classList.add(method==='wechat'?'border-green-400':'border-blue-400', method==='wechat'?'bg-green-50':'bg-blue-50');
        // Check if payment QR is configured
        checkQR();
      }

      let qrCodes = {};
      async function checkQR() {
        try {
          const r = await fetch('/api/admin/payment-qr');
          if(r.ok) { const d = await r.json(); qrCodes = d; }
        } catch(e) {}
        updateQR();
      }

      function updateQR() {
        const qrEl = document.getElementById('qrArea');
        const url = qrCodes[payMethod];
        if(url) {
          qrEl.innerHTML = '<div><img src="'+url+'" alt="收款码" class="max-w-[220px] mx-auto rounded-lg shadow-md" onerror="this.parentElement.innerHTML=\'<p class=text-slate-400>收款码加载失败</p>\'"><p class="text-xs text-slate-400 mt-2">请扫描上方二维码支付</p></div>';
          document.getElementById('paidBtn').classList.remove('hidden');
        } else {
          qrEl.innerHTML = '<p class="text-slate-400 text-sm">管理员暂未配置收款码<br>请联系客服获取</p>';
          document.getElementById('paidBtn').classList.remove('hidden');
        }
      }

      async function submitOrder() {
        if(!selectedPkg) { alert('请选择套餐'); return; }
        const btn = document.getElementById('submitBtn');
        btn.textContent = '提交中...'; btn.disabled = true;
        try {
          const r = await fetch('/api/recharge/create', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ package_id: selectedPkg.id, payment_method: payMethod })
          });
          if(r.ok) {
            updateQR();
            document.getElementById('paidBtn').classList.remove('hidden');
            loadOrders();
          } else {
            const d = await r.json();
            alert(d.error || '下单失败');
          }
        } catch(e) { alert('网络错误'); }
        btn.textContent = '确认下单 →'; btn.disabled = false;
      }

      async function submitPayment() {
        if(!selectedPkg) return;
        const btn = document.getElementById('paidBtn');
        btn.textContent = '提交中...'; btn.disabled = true;
        try {
          const r = await fetch('/api/recharge/notify', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ package_id: selectedPkg.id, payment_method: payMethod })
          });
          if(r.ok) {
            alert('已通知管理员，请等待确认到账（通常1-5分钟内完成）');
            btn.textContent = '⏳ 等待确认中...';
            loadOrders();
          } else {
            alert('提交失败，请重试');
            btn.textContent = '✅ 我已支付，通知管理员';
          }
        } catch(e) { alert('网络错误'); btn.textContent = '✅ 我已支付，通知管理员'; }
        btn.disabled = false;
      }

      async function loadOrders() {
        try {
          const r = await fetch('/api/recharge/orders');
          if(!r.ok) return;
          const orders = await r.json();
          const el = document.getElementById('orderHistory');
          if(!orders || orders.length === 0) {
            el.innerHTML = '<div class="text-slate-400">暂无充值记录</div>';
            return;
          }
          el.innerHTML = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b text-left text-xs text-slate-400 uppercase"><th class="px-3 py-2">时间</th><th class="px-3 py-2">套餐</th><th class="px-3 py-2">额度</th><th class="px-3 py-2">金额</th><th class="px-3 py-2">方式</th><th class="px-3 py-2">状态</th></tr></thead><tbody>' +
            orders.map(o => '<tr class="border-b border-slate-50"><td class="px-3 py-2 text-slate-500">'+o.created_at?.slice(0,16)+'</td><td class="px-3 py-2 font-medium">'+escapeHtml(o.package_name||'-')+'</td><td class="px-3 py-2">'+fmtNum(o.quota_amount||0)+'</td><td class="px-3 py-2">¥'+(o.price_cents? (o.price_cents/100).toFixed(2):'-')+'</td><td class="px-3 py-2">'+ (o.payment_method==='wechat'?'微信': o.payment_method==='alipay'?'支付宝':o.payment_method||'-')+'</td><td class="px-3 py-2"><span class="px-2 py-0.5 rounded text-xs font-bold '+ (o.status==='done'?'bg-green-50 text-green-600':o.status==='pending'?'bg-amber-50 text-amber-600':'bg-slate-100 text-slate-500') +'">'+ (o.status==='done'?'已到账':o.status==='pending'?'待确认':'已取消')+'</span></td></tr>').join('') + '</tbody></table></div>';
        } catch(e) {}
      }

      function fmtNum(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(n);}
      function escapeHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

      selectPay('wechat');
      loadOrders();
    </script>
  `, opts);
}
