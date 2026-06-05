import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export function loginPage(opts: LayoutOpts, error?: string): string {
  return layout(`
    <section style="max-width:440px;margin:0 auto;padding:80px 24px;">
      <div class="g-card" style="padding:40px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#0088FF,#36E4DA);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;">⚡</div>
          <h1 style="font-size:28px;font-weight:800;color:#fff;">欢迎回来</h1>
          <p style="color:var(--muted);font-size:14px;margin-top:6px;">登录 Token Relay</p>
        </div>
        ${error?`<div style="margin-bottom:20px;padding:12px 16px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#fca5a5;font-size:13px;">${escapeHtml(error)}</div>`:''}
        <form action="/login" method="POST" style="display:flex;flex-direction:column;gap:16px;">
          <div><label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">手机号 或 邮箱</label><input type="text" name="email" class="inp" placeholder="手机号或邮箱地址" required autofocus></div>
          <div><label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">密码</label><input type="password" name="password" class="inp" placeholder="请输入密码" required></div>
          <button type="submit" class="btn-p" style="width:100%;justify-content:center;padding:14px;font-size:15px;">登录</button>
        </form>
        <div style="text-align:center;margin-top:20px;font-size:13px;">
          <a href="/forgot-password" style="color:var(--muted);text-decoration:none;">忘记密码？</a>
        </div>
        <div style="text-align:center;margin-top:12px;font-size:13px;color:var(--muted);">
          还没有账户？<a href="/register" style="color:var(--accent);text-decoration:none;font-weight:600;">免费注册 →</a>
        </div>
      </div>
    </section>
  `, { ...opts, title: '登录' });
}

export function registerPage(opts: LayoutOpts, error?: string): string {
  return layout(`
    <section style="max-width:440px;margin:0 auto;padding:60px 24px;">
      <div class="g-card" style="padding:40px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#0088FF,#36E4DA);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;">🎉</div>
          <h1 style="font-size:28px;font-weight:800;color:#fff;">免费注册</h1>
          <p style="color:var(--muted);font-size:14px;margin-top:6px;">注册即送 <strong style="color:var(--accent);">10万 tokens</strong> 免费额度</p>
        </div>
        ${error?`<div style="margin-bottom:20px;padding:12px 16px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#fca5a5;font-size:13px;">${escapeHtml(error)}</div>`:''}
        <form action="/register" method="POST" onsubmit="return v()" style="display:flex;flex-direction:column;gap:16px;">
          <div><label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">手机号</label><div style="display:flex;gap:8px;"><input type="tel" name="phone" id="rp" class="inp" placeholder="11位手机号" required maxlength="11" style="flex:1;"><button type="button" onclick="sc()" class="btn-p" style="font-size:12px;padding:8px 14px;white-space:nowrap;" id="sb">获取验证码</button></div></div>
          <div><label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">短信验证码</label><input type="text" name="code" id="rc" class="inp" placeholder="000000" maxlength="6" inputmode="numeric" style="text-align:center;font-size:24px;font-weight:700;letter-spacing:0.3em;"><p id="ch" style="font-size:12px;color:var(--cyan);margin-top:4px;display:none;"></p></div>
          <div><label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">显示名称</label><input type="text" name="display_name" class="inp" placeholder="给自己起个名字" required></div>
          <div><label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">密码</label><input type="password" name="password" id="rpd" class="inp" placeholder="至少8位，含字母+数字" required minlength="8"><p style="font-size:11px;color:var(--muted);margin-top:4px;">8位以上，必须包含字母和数字</p></div>
          <button type="submit" class="btn-p" style="width:100%;justify-content:center;padding:14px;font-size:15px;">创建账户并领取免费额度</button>
        </form>
        <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--muted);">已有账户？<a href="/login" style="color:var(--accent);text-decoration:none;font-weight:600;">立即登录 →</a></div>
      </div>
    </section>
    <script>
      var cd=0;
      async function sc(){var p=document.getElementById('rp').value;if(!/^1[3-9][0-9]{9}$/.test(p)){alert('请输入正确的11位手机号');return;}if(cd>0)return;var b=document.getElementById('sb');b.disabled=true;try{var r=await fetch('/api/sms/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:p})});var d=await r.json();if(r.ok){document.getElementById('ch').style.display='block';document.getElementById('ch').textContent=d.code?'[测试模式] 验证码: '+d.code:'验证码已发送至 '+p;cd=60;b.textContent=cd+'s';var t=setInterval(function(){cd--;b.textContent=cd+'s';if(cd<=0){clearInterval(t);b.textContent='获取验证码';b.disabled=false;}},1000);}else{alert(d.error||'发送失败');b.disabled=false;}}catch(e){alert('网络错误');b.disabled=false;}}
      function v(){var p=document.getElementById('rp').value,pd=document.getElementById('rpd').value,c=document.getElementById('rc').value;if(!/^1[3-9][0-9]{9}$/.test(p)){alert('请输入正确的11位手机号');return false;}if(c.length!==6){alert('请输入6位验证码');return false;}if(pd.length<8||!/[A-Za-z]/.test(pd)||!/[0-9]/.test(pd)){alert('密码至少8位，必须包含字母和数字');return false;}return true;}
    </script>
  `, { ...opts, title: '免费注册' });
}

export function forgotPasswordPage(opts: LayoutOpts): string {
  return layout(`
    <section style="max-width:440px;margin:0 auto;padding:80px 24px;">
      <div class="g-card" style="padding:40px;">
        <div style="text-align:center;margin-bottom:32px;"><div style="width:56px;height:56px;background:linear-gradient(135deg,#0088FF,#36E4DA);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;">🔑</div><h1 style="font-size:28px;font-weight:800;color:#fff;">重置密码</h1><p style="color:var(--muted);font-size:14px;margin-top:6px;" id="st">验证手机号</p></div>
        <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px;" id="sd"><span class="sdot" style="display:block;width:32px;height:3px;border-radius:2px;background:var(--accent);"></span><span class="sdot" style="display:block;width:32px;height:3px;border-radius:2px;background:rgba(255,255,255,0.08);"></span><span class="sdot" style="display:block;width:32px;height:3px;border-radius:2px;background:rgba(255,255,255,0.08);"></span></div>
        <div id="s1"><div style="display:flex;gap:8px;"><input type="tel" id="rph" class="inp" placeholder="11位手机号" maxlength="11" style="flex:1;"><button type="button" onclick="src()" class="btn-p" style="font-size:12px;padding:8px 14px;white-space:nowrap;" id="rsb">获取验证码</button></div><p id="rpe" style="font-size:12px;color:#fca5a5;margin-top:8px;display:none;"></p></div>
        <div id="s2" style="display:none;"><div style="padding:12px;border-radius:12px;background:rgba(0,136,255,0.06);border:1px solid rgba(0,136,255,0.15);color:var(--cyan);font-size:13px;margin-bottom:16px;">验证码已发送至 <strong id="mp">---</strong></div><input type="text" id="rcd" class="inp" placeholder="000000" maxlength="6" inputmode="numeric" style="text-align:center;font-size:24px;font-weight:700;letter-spacing:0.3em;margin-bottom:12px;"><p id="rce" style="font-size:12px;color:#fca5a5;margin-bottom:12px;display:none;"></p><button type="button" onclick="vrc()" class="btn-p" style="width:100%;justify-content:center;padding:12px;" id="vb">验证</button><div style="text-align:center;margin-top:12px;"><button type="button" onclick="src()" style="background:none;border:none;color:var(--cyan);font-size:12px;cursor:pointer;">重新发送</button></div></div>
        <div id="s3" style="display:none;"><div style="padding:12px;border-radius:12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);color:#6ee7b7;font-size:13px;margin-bottom:16px;">✅ 身份验证通过</div><input type="password" id="np" class="inp" placeholder="新密码（8位+字母+数字）" minlength="8" style="margin-bottom:12px;"><input type="password" id="cp" class="inp" placeholder="确认新密码" minlength="8" style="margin-bottom:12px;"><p id="rpe2" style="font-size:12px;color:#fca5a5;margin-bottom:12px;display:none;"></p><button type="button" onclick="drp()" class="btn-p" style="width:100%;justify-content:center;padding:12px;">重置密码并登录</button></div>
        <div id="ss" style="text-align:center;display:none;"><div style="font-size:48px;margin-bottom:16px;">✅</div><h2 style="color:#fff;font-size:20px;">密码重置成功！</h2><p style="color:var(--muted);font-size:13px;margin-top:8px;">正在跳转...</p></div>
        <div style="text-align:center;margin-top:20px;font-size:13px;"><a href="/login" style="color:var(--muted);text-decoration:none;">← 返回登录</a></div>
      </div>
    </section>
    <script>
      var rp='',rt='',rcd=0;
      function ss(n){for(var i=1;i<=3;i++){var e=document.getElementById('s'+i);if(e)e.style.display=i===n?'block':'none';}var d=document.querySelectorAll('.sdot');for(var j=0;j<d.length;j++){d[j].style.background=j<n?'var(--accent)':'rgba(255,255,255,0.08)';}}
      async function src(){var p=document.getElementById('rph').value;if(!/^1[3-9][0-9]{9}$/.test(p)){document.getElementById('rpe').textContent='请输入正确的11位手机号';document.getElementById('rpe').style.display='block';return;}document.getElementById('rpe').style.display='none';if(rcd>0)return;var b=document.getElementById('rsb');b.disabled=true;try{var r=await fetch('/api/forgot-password/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:p})});var d=await r.json();if(r.ok){rp=p;document.getElementById('mp').textContent=p.slice(0,3)+'****'+p.slice(7);if(d.code)document.getElementById('rcd').value=d.code;ss(2);rcd=60;b.textContent=rcd+'s';var t=setInterval(function(){rcd--;b.textContent=rcd+'s';if(rcd<=0){clearInterval(t);b.textContent='获取验证码';b.disabled=false;}},1000);}else{document.getElementById('rpe').textContent=d.error||'发送失败';document.getElementById('rpe').style.display='block';b.disabled=false;}}catch(e){alert('网络错误');b.disabled=false;}}
      async function vrc(){var c=document.getElementById('rcd').value;if(c.length!==6){document.getElementById('rce').textContent='请输入6位验证码';document.getElementById('rce').style.display='block';return;}document.getElementById('rce').style.display='none';var b=document.getElementById('vb');b.textContent='验证中...';b.disabled=true;try{var r=await fetch('/api/forgot-password/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:rp,code:c})});var d=await r.json();if(r.ok){rt=d.token;ss(3);}else{document.getElementById('rce').textContent=d.error||'验证码错误';document.getElementById('rce').style.display='block';}}catch(e){alert('网络错误');}b.textContent='验证';b.disabled=false;}
      async function drp(){var p=document.getElementById('np').value,c=document.getElementById('cp').value,err=document.getElementById('rpe2');if(p.length<8||!/[A-Za-z]/.test(p)||!/[0-9]/.test(p)){err.textContent='密码至少8位，必须包含字母和数字';err.style.display='block';return;}if(p!==c){err.textContent='两次输入的密码不一致';err.style.display='block';return;}err.style.display='none';try{var r=await fetch('/api/forgot-password/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:rp,token:rt,password:p})});if(r.ok){for(var i=1;i<=3;i++)document.getElementById('s'+i).style.display='none';document.getElementById('sd').style.display='none';document.getElementById('st').textContent='完成';document.getElementById('ss').style.display='block';setTimeout(function(){window.location.href='/dashboard';},1500);}else{var d=await r.json();err.textContent=d.error||'重置失败';err.style.display='block';}}catch(e){alert('网络错误');}}
    </script>
  `, { ...opts, title: '重置密码' });
}
