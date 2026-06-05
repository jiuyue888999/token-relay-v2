import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export function keysPage(opts: LayoutOpts): string {
  return layout(`
    <div style="max-width:800px;margin:0 auto;padding:40px 24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;">
        <div><h1 style="font-size:32px;font-weight:800;color:#fff;">🔑 API 密钥</h1><p style="color:var(--muted);font-size:14px;margin-top:6px;">创建和管理密钥，密钥<strong style="color:var(--accent);">仅在创建时显示一次</strong></p></div>
        <button onclick="sf()" class="btn-p" style="padding:12px 24px;">+ 创建密钥</button>
      </div>

      <div id="cf" class="g-card" style="padding:24px;margin-bottom:20px;display:none;">
        <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:16px;">✨ 创建新密钥</h3>
        <div style="display:flex;gap:12px;align-items:flex-end;">
          <div style="flex:1;"><label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">密钥名称</label><input type="text" id="kn" class="inp" placeholder="例如：生产环境、我的App" maxlength="30"></div>
          <button onclick="ck()" class="btn-p" id="skb">确认创建</button>
          <button onclick="document.getElementById('cf').style.display='none'" class="btn-o">取消</button>
        </div>
      </div>

      <div id="nr" class="g-card" style="padding:24px;margin-bottom:20px;display:none;border-color:rgba(234,179,8,0.5);background:rgba(234,179,8,0.04);">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
          <span style="font-size:32px;">⚠️</span>
          <div><h3 style="font-size:18px;font-weight:700;color:#fbbf24;">请立即复制密钥！</h3><p style="color:rgba(251,191,36,0.7);font-size:13px;">此密钥仅显示一次，关闭后无法再次查看</p></div>
        </div>
        <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:16px;margin-bottom:16px;"><code style="color:#36E4DA;font-size:14px;word-break:break-all;font-family:monospace;" id="nkd"></code></div>
        <div style="display:flex;gap:12px;">
          <button onclick="cnk()" class="btn-p" id="cnb">📋 复制到剪贴板</button>
          <button onclick="dnk()" class="btn-o">我已保存，关闭</button>
        </div>
      </div>

      <div class="g-card" style="padding:24px;">
        <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:16px;">我的密钥</h3>
        <div id="kl" style="text-align:center;padding:40px;color:var(--muted);">加载中...</div>
      </div>
    </div>

    <script>
      var nkv='';
      function sf(){document.getElementById('cf').style.display='block';document.getElementById('kn').focus();}
      async function ck(){var n=document.getElementById('kn').value.trim()||'未命名';var b=document.getElementById('skb');b.textContent='创建中...';b.disabled=true;try{var r=await fetch('/api/keys/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})});var d=await r.json();if(r.ok&&d.key){nkv=d.key;document.getElementById('cf').style.display='none';document.getElementById('nkd').textContent=d.key;document.getElementById('nr').style.display='block';document.getElementById('nr').scrollIntoView({behavior:'smooth'});document.getElementById('kn').value='';lk();}else{alert(d.error||'创建失败');}}catch(e){alert('网络错误');}b.textContent='确认创建';b.disabled=false;}
      function cnk(){navigator.clipboard.writeText(nkv).then(function(){var b=document.getElementById('cnb');b.textContent='✅ 已复制！';setTimeout(function(){b.textContent='📋 复制到剪贴板';},2000);});}
      function dnk(){if(nkv&&!document.getElementById('cnb').textContent.includes('已复制')){if(!confirm('⚠️ 你还没有复制密钥！确定关闭吗？'))return;}document.getElementById('nr').style.display='none';nkv='';}
      async function lk(){try{var r=await fetch('/api/keys/list');var d=await r.json();var el=document.getElementById('kl');if(!d.keys||d.keys.length===0){el.innerHTML='<div style="text-align:center;padding:40px;"><div style="font-size:48px;margin-bottom:12px;opacity:0.3;">🔑</div><p style="color:var(--muted);">还没有密钥</p><p style="color:var(--muted);font-size:12px;margin-top:4px;">点击上方按钮创建</p></div>';return;}el.innerHTML=d.keys.map(function(k){return'<div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);margin-bottom:8px;"><div><div style="font-weight:700;color:#fff;font-size:14px;">'+escapeHtml(k.name||'未命名')+'</div><div style="font-family:monospace;font-size:13px;color:var(--muted);margin-top:4px;">'+(k.is_active?mk(k.key):'<span style="color:#fca5a5;text-decoration:line-through;">已停用</span>')+'</div><div style="font-size:11px;color:var(--muted);margin-top:2px;">'+(k.created_at||'').slice(0,10)+'</div></div>'+(k.is_active?'<button onclick="rk(\''+k.id+'\')" style="padding:6px 14px;border-radius:8px;font-size:12px;background:transparent;border:1px solid rgba(239,68,68,0.3);color:#fca5a5;cursor:pointer;">停用</button>':'')+'</div>';}).join('');}catch(e){}}
      function mk(k){if(!k||k.length<16)return k;return k.slice(0,10)+'•'.repeat(16)+k.slice(-4);}
      async function rk(id){if(!confirm('确定停用？'))return;try{var r=await fetch('/api/keys/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})});if(r.ok)lk();}catch(e){}}
      function escapeHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
      lk();
    </script>
  `, { ...opts, title: 'API 密钥管理' });
}
