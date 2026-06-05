import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export function loginPage(opts: LayoutOpts, error?: string): string {
  return layout(`
    <section class="max-w-md mx-auto px-4 pt-20 pb-20">
      <div class="glass-card p-8">
        <div class="text-center mb-8">
          <div class="logo-icon w-16 h-16 text-2xl mx-auto mb-4">⚡</div>
          <h1 class="text-2xl font-bold text-white">欢迎回来</h1>
          <p class="text-sm text-slate-400 mt-2">登录 Token Relay</p>
        </div>
        ${error ? `<div class="mb-6 px-4 py-3 rounded-xl text-sm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;">${escapeHtml(error)}</div>` : ''}
        <form action="/login" method="POST" class="space-y-4">
          <div><label class="block text-sm font-medium text-slate-300 mb-1.5">手机号 或 邮箱</label><input type="text" name="email" class="input-cyber" placeholder="手机号或邮箱地址" required autofocus></div>
          <div><label class="block text-sm font-medium text-slate-300 mb-1.5">密码</label><input type="password" name="password" class="input-cyber" placeholder="请输入密码" required></div>
          <button type="submit" class="btn-cyber w-full !py-3 justify-center text-base">登录</button>
        </form>
        <p class="text-center text-sm text-slate-500 mt-4"><a href="/forgot-password" class="text-cyan-400 hover:text-cyan-300 no-underline">忘记密码？</a></p>
        <p class="text-center text-sm text-slate-500 mt-2">还没有账户？<a href="/register" class="text-cyan-400 hover:text-cyan-300 font-medium no-underline">免费注册 →</a></p>
      </div>
    </section>
  `, { ...opts, title: '登录' });
}

export function registerPage(opts: LayoutOpts, error?: string): string {
  return layout(`
    <section class="max-w-md mx-auto px-4 pt-16 pb-20">
      <div class="glass-card p-8">
        <div class="text-center mb-8">
          <div class="logo-icon w-16 h-16 text-2xl mx-auto mb-4">🎉</div>
          <h1 class="text-2xl font-bold text-white">免费注册</h1>
          <p class="text-sm text-slate-400 mt-2">注册即送 <strong class="text-cyan-400">10万 tokens</strong> 免费额度</p>
        </div>
        ${error ? `<div class="mb-6 px-4 py-3 rounded-xl text-sm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;">${escapeHtml(error)}</div>` : ''}
        <form action="/register" method="POST" onsubmit="return validateReg(event)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">手机号</label>
            <div class="flex gap-2">
              <input type="tel" name="phone" id="regPhone" class="input-cyber flex-1" placeholder="11位手机号" required maxlength="11">
              <button type="button" onclick="sendCode()" class="btn-cyber text-sm !py-2 whitespace-nowrap" id="sendBtn">获取验证码</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-1.5">短信验证码</label>
            <input type="text" name="code" id="regCode" class="input-cyber text-center text-2xl tracking-[0.5em] font-bold" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
            <p id="codeHint" class="text-xs text-cyan-400 mt-1 hidden"></p>
          </div>
          <div><label class="block text-sm font-medium text-slate-300 mb-1.5">显示名称</label><input type="text" name="display_name" class="input-cyber" placeholder="给自己起个名字" required></div>
          <div><label class="block text-sm font-medium text-slate-300 mb-1.5">密码</label><input type="password" name="password" id="regPwd" class="input-cyber" placeholder="至少8位，含字母+数字" required minlength="8"><p class="text-xs text-slate-500 mt-1">8位以上，必须包含字母和数字</p></div>
          <button type="submit" class="btn-cyber w-full !py-3 justify-center text-base">创建账户并领取免费额度</button>
        </form>
        <p class="text-center text-sm text-slate-500 mt-6">已有账户？<a href="/login" class="text-cyan-400 hover:text-cyan-300 font-medium no-underline">立即登录 →</a></p>
      </div>
    </section>
    <script>
      var cd=0;
      async function sendCode(){
        var p=document.getElementById('regPhone').value;
        if(!/^1[3-9][0-9]{9}$/.test(p)){alert('请输入正确的11位手机号');return;}
        if(cd>0)return;
        var b=document.getElementById('sendBtn');b.disabled=true;
        try{
          var r=await fetch('/api/sms/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:p})});
          var d=await r.json();
          if(r.ok){document.getElementById('codeHint').classList.remove('hidden');document.getElementById('codeHint').textContent=d.code?'[测试模式] 验证码: '+d.code:'验证码已发送至 '+p;cd=60;b.textContent=cd+'s';var t=setInterval(function(){cd--;b.textContent=cd+'s';if(cd<=0){clearInterval(t);b.textContent='获取验证码';b.disabled=false;}},1000);}
          else{alert(d.error||'发送失败');b.disabled=false;}
        }catch(e){alert('网络错误');b.disabled=false;}
      }
      function validateReg(e){
        var p=document.getElementById('regPhone').value,pwd=document.getElementById('regPwd').value,code=document.getElementById('regCode').value;
        if(!/^1[3-9][0-9]{9}$/.test(p)){alert('请输入正确的11位手机号');e.preventDefault();return false;}
        if(code.length!==6){alert('请输入6位验证码');e.preventDefault();return false;}
        if(pwd.length<8||!/[A-Za-z]/.test(pwd)||!/[0-9]/.test(pwd)){alert('密码至少8位，必须包含字母和数字');e.preventDefault();return false;}
        return true;
      }
    </script>
  `, { ...opts, title: '免费注册' });
}

export function forgotPasswordPage(opts: LayoutOpts): string {
  return layout(`
    <section class="max-w-md mx-auto px-4 pt-20 pb-20">
      <div class="glass-card p-8">
        <div class="text-center mb-8"><div class="logo-icon w-16 h-16 text-2xl mx-auto mb-4">🔑</div><h1 class="text-2xl font-bold text-white">重置密码</h1><p class="text-sm text-slate-400 mt-2" id="stepTitle">验证手机号以重置密码</p></div>
        <div class="flex justify-center gap-2 mb-8" id="stepDots"><span class="step-dot block w-8 h-1.5 rounded-full bg-cyan-400"></span><span class="step-dot block w-8 h-1.5 rounded-full bg-slate-700"></span><span class="step-dot block w-8 h-1.5 rounded-full bg-slate-700"></span></div>
        <div id="step1" class="space-y-4">
          <div><label class="block text-sm font-medium text-slate-300 mb-1.5">注册时使用的手机号</label><div class="flex gap-2"><input type="tel" id="resetPhone" class="input-cyber flex-1" placeholder="11位手机号" maxlength="11"><button type="button" onclick="sendResetCode()" class="btn-cyber text-sm !py-2 whitespace-nowrap" id="resetSendBtn">获取验证码</button></div></div>
          <p id="resetPhoneError" class="text-xs text-red-400 hidden"></p>
        </div>
        <div id="step2" class="space-y-4 hidden">
          <div class="p-4 rounded-xl text-sm text-cyan-300" style="background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2);">验证码已发送至 <strong id="maskedPhone">---</strong></div>
          <div><input type="text" id="resetCode" class="input-cyber text-center text-2xl tracking-[0.5em] font-bold" placeholder="000000" maxlength="6" inputmode="numeric"></div>
          <p id="resetCodeError" class="text-xs text-red-400 hidden"></p>
          <button type="button" onclick="verifyResetCode()" class="btn-cyber w-full !py-3 justify-center text-base" id="verifyBtn">验证</button>
          <p class="text-center"><button type="button" onclick="sendResetCode()" class="text-sm text-cyan-400 hover:text-cyan-300 no-underline bg-transparent border-none cursor-pointer" id="resendLink">重新发送验证码</button></p>
        </div>
        <div id="step3" class="space-y-4 hidden">
          <div class="p-4 rounded-xl text-sm text-emerald-300" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);">✅ 身份验证通过，请设置新密码</div>
          <div><label class="block text-sm font-medium text-slate-300 mb-1.5">新密码</label><input type="password" id="newPassword" class="input-cyber" placeholder="8位以上，含字母+数字" minlength="8"></div>
          <div><label class="block text-sm font-medium text-slate-300 mb-1.5">确认新密码</label><input type="password" id="confirmPassword" class="input-cyber" placeholder="再次输入新密码" minlength="8"></div>
          <p id="resetPwdError" class="text-xs text-red-400 hidden"></p>
          <button type="button" onclick="doResetPassword()" class="btn-cyber w-full !py-3 justify-center text-base">重置密码并登录</button>
        </div>
        <div id="stepSuccess" class="text-center space-y-4 hidden"><div class="text-5xl mb-4">✅</div><h2 class="text-xl font-bold text-white">密码重置成功！</h2><p class="text-sm text-slate-400">正在跳转...</p></div>
        <p class="text-center text-sm text-slate-500 mt-6"><a href="/login" class="text-cyan-400 hover:text-cyan-300 font-medium no-underline">← 返回登录</a></p>
      </div>
    </section>
    <script>
      var rp='',rt='',rcd=0;
      function ss(n){for(var i=1;i<=3;i++){var e=document.getElementById('step'+i);if(e)e.classList.add('hidden');}var t=document.getElementById('step'+n);if(t)t.classList.remove('hidden');var ds=document.querySelectorAll('.step-dot');for(var j=0;j<ds.length;j++){ds[j].classList.toggle('bg-cyan-400',j<n);ds[j].classList.toggle('bg-slate-700',j>=n);}}
      async function sendResetCode(){
        var p=document.getElementById('resetPhone').value;if(!/^1[3-9][0-9]{9}$/.test(p)){document.getElementById('resetPhoneError').textContent='请输入正确的手机号';document.getElementById('resetPhoneError').classList.remove('hidden');return;}
        document.getElementById('resetPhoneError').classList.add('hidden');if(rcd>0)return;
        var b=document.getElementById('resetSendBtn');b.disabled=true;
        try{var r=await fetch('/api/forgot-password/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:p})});var d=await r.json();
          if(r.ok){rp=p;document.getElementById('maskedPhone').textContent=p.slice(0,3)+'****'+p.slice(7);if(d.code)document.getElementById('resetCode').value=d.code;ss(2);rcd=60;b.textContent=rcd+'s';var t=setInterval(function(){rcd--;b.textContent=rcd+'s';if(rcd<=0){clearInterval(t);b.textContent='获取验证码';b.disabled=false;}},1000);}
          else{document.getElementById('resetPhoneError').textContent=d.error||'发送失败';document.getElementById('resetPhoneError').classList.remove('hidden');b.disabled=false;}
        }catch(e){alert('网络错误');b.disabled=false;}
      }
      async function verifyResetCode(){
        var c=document.getElementById('resetCode').value;if(c.length!==6){document.getElementById('resetCodeError').textContent='请输入6位验证码';document.getElementById('resetCodeError').classList.remove('hidden');return;}
        document.getElementById('resetCodeError').classList.add('hidden');var b=document.getElementById('verifyBtn');b.textContent='验证中...';b.disabled=true;
        try{var r=await fetch('/api/forgot-password/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:rp,code:c})});var d=await r.json();
          if(r.ok){rt=d.token;ss(3);}else{document.getElementById('resetCodeError').textContent=d.error||'验证码错误';document.getElementById('resetCodeError').classList.remove('hidden');}
        }catch(e){alert('网络错误');}b.textContent='验证';b.disabled=false;
      }
      async function doResetPassword(){
        var p=document.getElementById('newPassword').value,c=document.getElementById('confirmPassword').value,err=document.getElementById('resetPwdError');
        if(p.length<8||!/[A-Za-z]/.test(p)||!/[0-9]/.test(p)){err.textContent='密码至少8位，必须包含字母和数字';err.classList.remove('hidden');return;}
        if(p!==c){err.textContent='两次输入的密码不一致';err.classList.remove('hidden');return;}err.classList.add('hidden');
        try{var r=await fetch('/api/forgot-password/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:rp,token:rt,password:p})});
          if(r.ok){document.getElementById('step3').classList.add('hidden');document.getElementById('stepSuccess').classList.remove('hidden');document.getElementById('stepDots').classList.add('hidden');document.getElementById('stepTitle').textContent='完成';setTimeout(function(){window.location.href='/dashboard';},1500);}
          else{var d=await r.json();err.textContent=d.error||'重置失败';err.classList.remove('hidden');}
        }catch(e){alert('网络错误');}
      }
    </script>
  `, { ...opts, title: '重置密码' });
}
