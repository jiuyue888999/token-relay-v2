import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

function fm(n: number): string { if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(n); }

export function rechargePage(opts: LayoutOpts, packages: any[]): string {
  return layout(`
    <div style="max-width:1000px;margin:0 auto;padding:40px 24px;">
      <h1 style="font-size:32px;font-weight:800;color:#fff;margin-bottom:8px;">💰 充值中心</h1>
      <p style="color:var(--muted);margin-bottom:40px;">选择套餐 → 扫码支付 → 自动到账</p>

      <!-- Packages -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:40px;">
        ${packages.map((p:any,i:number)=>`
          <div class="g-card pkgc" data-id="${p.id}" data-amount="${p.quota_amount}" data-price="${(p.price_cents/100).toFixed(2)}" style="padding:24px;text-align:center;cursor:pointer;${i===0?'border-color:var(--accent);box-shadow:0 0 20px rgba(0,136,255,0.2);':''}" onclick="sp(this)">
            <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:4px;">${escapeHtml(p.name)}</h3>
            <p style="font-size:11px;color:var(--muted);margin-bottom:16px;">${escapeHtml(p.description||'')}</p>
            <div style="font-size:32px;font-weight:900;color:#fff;">${fm(p.quota_amount)}</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">tokens</div>
            <div class="g-text" style="font-size:24px;font-weight:800;">¥${(p.price_cents/100).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Payment -->
      <div class="g-card" style="padding:32px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;">
          <div>
            <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:20px;">📱 支付方式</h3>
            <div style="display:flex;gap:12px;margin-bottom:20px;">
              <div class="pay-btn" onclick="spay('wechat')" id="pw" style="flex:1;padding:20px;border-radius:12px;border:2px solid rgba(7,188,12,0.5);text-align:center;cursor:pointer;transition:all 0.3s;background:rgba(7,188,12,0.06);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="#07C160" style="margin:0 auto 8px;display:block;"><path d="M8.69 3.46C5.29 4.72 2.86 8.04 3.1 11.81c.17 2.64 1.31 4.88 3.05 6.4.28.26.34.7.15 1.02l-1.06 1.8c-.13.23.07.43.29.31l2.16-1.05c.23-.11.5-.07.7.06 1.18.76 2.55 1.19 4.02 1.19 5.79 0 10.49-4.24 10.49-9.48 0-4.3-3.16-7.94-7.5-9.01-.23-.06-.48.06-.5.3-.05.55-.54.97-1.1.9-.45-.06-.74-.53-.61-.96.13-.44-.19-.89-.64-.87-1.05.05-2.09.34-3.02.84zM9.83 9.32c.59 0 1.08.44 1.08.99 0 .54-.48.98-1.08.98-.59 0-1.07-.44-1.07-.98.01-.55.48-.99 1.07-.99zm4.35 0c.59 0 1.07.44 1.07.99 0 .54-.48.98-1.07.98-.59 0-1.08-.44-1.08-.98 0-.55.49-.99 1.08-.99z"/></svg>
                <div style="font-size:14px;font-weight:700;color:#07C160;">微信支付</div>
              </div>
              <div class="pay-btn" onclick="spay('alipay')" id="pa" style="flex:1;padding:20px;border-radius:12px;border:2px solid rgba(22,119,255,0.3);text-align:center;cursor:pointer;transition:all 0.3s;background:rgba(22,119,255,0.04);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="#1677FF" style="margin:0 auto 8px;display:block;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.5 6h-5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1.5v3h-1.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h3c.83 0 1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5h-1.5V8h2c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5z"/></svg>
                <div style="font-size:14px;font-weight:700;color:#1677FF;">支付宝</div>
              </div>
            </div>
            <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">已选套餐</div>
              <div style="font-size:18px;font-weight:700;color:#fff;" id="spn">-</div>
              <div style="font-size:13px;color:var(--muted);" id="spt">-</div>
              <div class="g-text" style="font-size:22px;font-weight:800;margin-top:4px;" id="spp">-</div>
            </div>
          </div>
          <div style="text-align:center;">
            <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:20px;">📷 扫码支付</h3>
            <div style="padding:40px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);min-height:200px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <p style="color:var(--muted);font-size:13px;">选择套餐和支付方式<br>联系管理员获取收款码</p>
            </div>
            <button onclick="smt()" class="btn-p" style="width:100%;justify-content:center;padding:14px;" id="pb">✅ 已完成支付，通知管理员</button>
          </div>
        </div>
      </div>

      <!-- Orders -->
      <div class="g-card" style="padding:24px;margin-top:24px;">
        <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:16px;">📋 充值记录</h3>
        <div id="ol" style="text-align:center;padding:40px;color:var(--muted);">加载中...</div>
      </div>
    </div>

    <script>
      var spkg=null,pm='wechat';
      var f=document.querySelector('.pkgc');if(f)sp(f);
      function sp(el){document.querySelectorAll('.pkgc').forEach(function(c){c.classList.remove('selected');});el.classList.add('selected');spkg={id:el.dataset.id,amount:parseInt(el.dataset.amount),price:el.dataset.price};document.getElementById('spn').textContent=el.querySelector('h3').textContent;document.getElementById('spt').textContent=el.querySelector('.g-text').previousElementSibling.previousElementSibling.textContent+' tokens';document.getElementById('spp').textContent='¥'+el.dataset.price;}
      function spay(m){pm=m;var w=document.getElementById('pw'),a=document.getElementById('pa');w.style.borderColor=m==='wechat'?'rgba(7,188,12,0.6)':'rgba(7,188,12,0.2)';w.style.background=m==='wechat'?'rgba(7,188,12,0.12)':'rgba(7,188,12,0.03)';a.style.borderColor=m==='alipay'?'rgba(22,119,255,0.6)':'rgba(22,119,255,0.2)';a.style.background=m==='alipay'?'rgba(22,119,255,0.12)':'rgba(22,119,255,0.03)';}
      async function smt(){if(!spkg){alert('请选择套餐');return;}var b=document.getElementById('pb');b.textContent='提交中...';b.disabled=true;try{var r=await fetch('/api/recharge/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({package_id:spkg.id,payment_method:pm})});if(r.ok){alert('已通知管理员，确认到账后自动充值（1-5分钟）');b.textContent='⏳ 等待确认';lo();}else{alert('提交失败');b.textContent='✅ 已完成支付，通知管理员';}}catch(e){alert('网络错误');b.textContent='✅ 已完成支付，通知管理员';}b.disabled=false;}
      async function lo(){try{var r=await fetch('/api/recharge/orders');var o=await r.json();var el=document.getElementById('ol');if(!o||o.length===0){el.innerHTML='<div style="color:var(--muted);">暂无记录</div>';return;}el.innerHTML='<table class="tbl"><thead><tr><th>时间</th><th>套餐</th><th>额度</th><th>支付</th><th>状态</th></tr></thead><tbody>'+o.map(function(o){return'<tr><td style="font-size:12px;color:var(--muted);">'+(o.created_at||'').slice(0,16)+'</td><td style="color:#fff;">'+escapeHtml(o.package_name||'-')+'</td><td>'+fm(o.quota_amount||0)+'</td><td>'+(o.payment_method==='wechat'?'<span style="color:#07C160;">微信</span>':o.payment_method==='alipay'?'<span style="color:#1677FF;">支付宝</span>':'-')+'</td><td><span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;'+(o.status==='done'?'color:#6ee7b7;background:rgba(16,185,129,0.1);':o.status==='pending'?'color:#fbbf24;background:rgba(251,191,36,0.1);':'color:var(--muted);')+'">'+(o.status==='done'?'已到账':o.status==='pending'?'待确认':'已取消')+'</span></td></tr>';}).join('')+'</tbody></table>';}catch(e){}}
      function escapeHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
      function fm2(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(n);}
      lo();
    </script>
  `, opts);
}
