import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export function loginPage(opts: LayoutOpts, error?: string): string {
  return layout(`
    <section class="max-w-md mx-auto px-4 pt-16 pb-20">
      <div class="card p-8">
        <div class="text-center mb-8">
          <span class="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl mx-auto mb-4">⚡</span>
          <h1 class="text-2xl font-bold text-slate-900">欢迎回来</h1>
          <p class="text-sm text-slate-500 mt-2">登录您的 Token Relay 账户</p>
        </div>

        ${error ? `<div class="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">${escapeHtml(error)}</div>` : ''}

        <form action="/login" method="POST" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">手机号 或 邮箱</label>
            <input type="text" name="email" class="input-field" placeholder="手机号或邮箱地址" required autofocus>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <input type="password" name="password" class="input-field" placeholder="请输入密码" required>
          </div>
          <button type="submit" class="btn-primary w-full !py-3 justify-center text-base">
            登录
          </button>
        </form>

        <p class="text-center text-sm text-slate-400 mt-4">
          <a href="/forgot-password" class="text-slate-400 hover:text-primary-500 no-underline">忘记密码？</a>
        </p>
        <p class="text-center text-sm text-slate-400 mt-2">
          还没有账户？
          <a href="/register" class="text-primary-500 hover:text-primary-600 font-medium no-underline">免费注册 →</a>
        </p>
      </div>

      <div class="text-center mt-8 space-y-2">
        <p class="text-xs text-slate-400">
          🔒 使用 HTTPS 安全传输 · 密码 bcrypt 加密存储
        </p>
        <p class="text-xs text-slate-400">
          无需注册即可使用 API？<a href="/#docs" class="text-primary-500 no-underline">查看文档</a>了解如何获取 API Key
        </p>
      </div>
    </section>
  `, { ...opts, title: '登录' });
}

export function registerPage(opts: LayoutOpts, error?: string): string {
  return layout(`
    <section class="max-w-md mx-auto px-4 pt-16 pb-20">
      <div class="card p-8">
        <div class="text-center mb-8">
          <span class="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl mx-auto mb-4">🎉</span>
          <h1 class="text-2xl font-bold text-slate-900">免费注册</h1>
          <p class="text-sm text-slate-500 mt-2">
            注册即送 <strong class="text-primary-600">10万 tokens</strong> 免费额度
          </p>
        </div>

        ${error ? `<div class="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">${escapeHtml(error)}</div>` : ''}

        <form action="/register" method="POST" onsubmit="return validateReg(event)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
            <div class="flex gap-2">
              <input type="tel" name="phone" id="regPhone" class="input-field flex-1" placeholder="11位手机号" required autofocus maxlength="11">
              <button type="button" onclick="sendCode()" class="btn-secondary text-sm !py-2 whitespace-nowrap" id="sendBtn">获取验证码</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">短信验证码</label>
            <input type="text" name="code" id="regCode" class="input-field" placeholder="6位数字验证码" required maxlength="6">
            <p id="codeHint" class="text-xs text-slate-400 mt-1 hidden"></p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">显示名称</label>
            <input type="text" name="display_name" class="input-field" placeholder="给自己起个名字" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <input type="password" name="password" id="regPwd" class="input-field" placeholder="至少8位，含字母+数字" required minlength="8">
            <p class="text-xs text-slate-400 mt-1">8位以上，必须包含字母和数字</p>
          </div>
          <button type="submit" class="btn-primary w-full !py-3 justify-center text-base" id="regBtn">
            创建账户并领取免费额度
          </button>
        </form>

        <script>
          var countdown = 0;
          var codeSent = false;
          async function sendCode() {
            var phone = document.getElementById('regPhone').value;
            if (!/^1[3-9][0-9]{9}$/.test(phone)) { alert('请输入正确的11位手机号'); return; }
            if (countdown > 0) return;
            var btn = document.getElementById('sendBtn');
            btn.disabled = true;
            try {
              var r = await fetch('/api/sms/send', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({phone: phone})
              });
              var d = await r.json();
              if (r.ok) {
                document.getElementById('codeHint').classList.remove('hidden');
                if (d.code) { document.getElementById('codeHint').textContent = '[测试模式] 验证码: ' + d.code; }
                else { document.getElementById('codeHint').textContent = '验证码已发送至 ' + phone; }
                codeSent = true;
                countdown = 60;
                btn.textContent = countdown + 's';
                var timer = setInterval(function() {
                  countdown--; btn.textContent = countdown + 's';
                  if (countdown <= 0) { clearInterval(timer); btn.textContent = '获取验证码'; btn.disabled = false; }
                }, 1000);
              } else {
                alert(d.error || '发送失败');
                btn.disabled = false;
              }
            } catch(e) { alert('网络错误'); btn.disabled = false; }
          }
          function validateReg(e) {
            var phone = document.getElementById('regPhone').value;
            var code = document.getElementById('regCode').value;
            var pwd = document.getElementById('regPwd').value;
            if (!/^1[3-9][0-9]{9}$/.test(phone)) { alert('请输入正确的11位手机号'); e.preventDefault(); return false; }
            if (code.length !== 6) { alert('请输入6位验证码'); e.preventDefault(); return false; }
            if (pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) { alert('密码至少8位，必须包含字母和数字'); e.preventDefault(); return false; }
            return true;
          }
        </script>

        <p class="text-center text-sm text-slate-400 mt-6">
          已有账户？
          <a href="/login" class="text-primary-500 hover:text-primary-600 font-medium no-underline">立即登录 →</a>
        </p>
      </div>

      <div class="text-center mt-8 space-y-2">
        <p class="text-xs text-slate-400">
          📋 <strong>服务条款：</strong>API Key 仅限本人使用，禁止滥用、共享或转售。
        </p>
        <p class="text-xs text-slate-400">
          💰 <strong>定价说明：</strong>以上价格仅供参考，实际费用以管理员设置为准。
        </p>
      </div>
    </section>
  `, { ...opts, title: '免费注册' });
}

/**
 * Forgot password page — 3-step flow like major sites (WeChat/Alipay):
 *   Step 1: Enter phone → send SMS
 *   Step 2: Enter verification code
 *   Step 3: Set new password → done
 */
export function forgotPasswordPage(opts: LayoutOpts): string {
  return layout(`
    <section class="max-w-md mx-auto px-4 pt-16 pb-20">
      <div class="card p-8">
        <div class="text-center mb-8">
          <span class="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl mx-auto mb-4">🔑</span>
          <h1 class="text-2xl font-bold text-slate-900">重置密码</h1>
          <p class="text-sm text-slate-500 mt-2" id="stepTitle">验证手机号以重置密码</p>
        </div>

        <!-- Step indicators -->
        <div class="flex justify-center gap-2 mb-8" id="stepDots">
          <span class="step-dot w-8 h-1.5 rounded-full bg-primary-500"></span>
          <span class="step-dot w-8 h-1.5 rounded-full bg-slate-200"></span>
          <span class="step-dot w-8 h-1.5 rounded-full bg-slate-200"></span>
        </div>

        <!-- Step 1: Phone -->
        <div id="step1" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">注册时使用的手机号</label>
            <div class="flex gap-2">
              <input type="tel" id="resetPhone" class="input-field flex-1" placeholder="11位手机号" maxlength="11">
              <button type="button" onclick="sendResetCode()" class="btn-primary text-sm !py-2 whitespace-nowrap" id="resetSendBtn">获取验证码</button>
            </div>
          </div>
          <p id="resetPhoneError" class="text-xs text-red-500 hidden"></p>
        </div>

        <!-- Step 2: Verify Code -->
        <div id="step2" class="space-y-4 hidden">
          <div class="bg-primary-50 rounded-xl p-4 text-sm text-primary-700 mb-4">
            验证码已发送至 <strong id="maskedPhone">---</strong>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">短信验证码</label>
            <input type="text" id="resetCode" class="input-field text-center text-2xl tracking-[0.5em] font-bold" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
          </div>
          <p id="resetCodeError" class="text-xs text-red-500 hidden"></p>
          <button type="button" onclick="verifyResetCode()" class="btn-primary w-full !py-3 justify-center text-base" id="verifyBtn">验证</button>
          <p class="text-center">
            <button type="button" onclick="sendResetCode()" class="text-sm text-primary-500 hover:text-primary-600 underline bg-transparent border-none cursor-pointer" id="resendLink">重新发送验证码</button>
          </p>
        </div>

        <!-- Step 3: Set New Password -->
        <div id="step3" class="space-y-4 hidden">
          <div class="bg-green-50 rounded-xl p-4 text-sm text-green-700 mb-4">
            ✅ 身份验证通过，请设置新密码
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">新密码</label>
            <input type="password" id="newPassword" class="input-field" placeholder="8位以上，含字母+数字" minlength="8">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">确认新密码</label>
            <input type="password" id="confirmPassword" class="input-field" placeholder="再次输入新密码" minlength="8">
          </div>
          <p id="resetPwdError" class="text-xs text-red-500 hidden"></p>
          <button type="button" onclick="doResetPassword()" class="btn-primary w-full !py-3 justify-center text-base">重置密码并登录</button>
        </div>

        <!-- Success -->
        <div id="stepSuccess" class="text-center space-y-4 hidden">
          <div class="text-5xl mb-4">✅</div>
          <h2 class="text-xl font-bold text-slate-900">密码重置成功！</h2>
          <p class="text-sm text-slate-500">正在跳转至控制台...</p>
        </div>

        <!-- Back link -->
        <p class="text-center text-sm text-slate-400 mt-6">
          <a href="/login" class="text-primary-500 hover:text-primary-600 font-medium no-underline">← 返回登录</a>
        </p>
      </div>
    </section>

    <script>
      var resetPhone = '';
      var resetToken = '';
      var resetCountdown = 0;

      function showStep(n) {
        for (var i = 1; i <= 3; i++) {
          var el = document.getElementById('step' + i);
          if (el) el.classList.add('hidden');
        }
        var target = document.getElementById('step' + n);
        if (target) target.classList.remove('hidden');
        // Update dots
        var dots = document.querySelectorAll('.step-dot');
        for (var j = 0; j < dots.length; j++) {
          dots[j].classList.toggle('bg-primary-500', j < n);
          dots[j].classList.toggle('bg-slate-200', j >= n);
        }
        // Update title
        var titles = ['验证手机号以重置密码', '输入短信验证码', '设置新密码'];
        document.getElementById('stepTitle').textContent = titles[n-1] || '';
      }

      async function sendResetCode() {
        var phone = document.getElementById('resetPhone').value;
        if (!/^1[3-9][0-9]{9}$/.test(phone)) {
          document.getElementById('resetPhoneError').textContent = '请输入正确的11位手机号';
          document.getElementById('resetPhoneError').classList.remove('hidden');
          return;
        }
        document.getElementById('resetPhoneError').classList.add('hidden');
        if (resetCountdown > 0) return;

        var btn = document.getElementById('resetSendBtn');
        btn.disabled = true;
        try {
          var r = await fetch('/api/forgot-password/send-code', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({phone: phone})
          });
          var d = await r.json();
          if (r.ok) {
            resetPhone = phone;
            document.getElementById('maskedPhone').textContent = phone.slice(0,3) + '****' + phone.slice(7);
            if (d.code) {
              // Dev mode: auto-fill code
              document.getElementById('resetCode').value = d.code;
            }
            showStep(2);
            resetCountdown = 60;
            btn.textContent = resetCountdown + 's';
            var timer = setInterval(function() {
              resetCountdown--; btn.textContent = resetCountdown + 's';
              if (resetCountdown <= 0) { clearInterval(timer); btn.textContent = '获取验证码'; btn.disabled = false; }
            }, 1000);
          } else {
            document.getElementById('resetPhoneError').textContent = d.error || '发送失败';
            document.getElementById('resetPhoneError').classList.remove('hidden');
            btn.disabled = false;
          }
        } catch(e) { alert('网络错误'); btn.disabled = false; }
      }

      async function verifyResetCode() {
        var code = document.getElementById('resetCode').value;
        if (code.length !== 6) {
          document.getElementById('resetCodeError').textContent = '请输入6位验证码';
          document.getElementById('resetCodeError').classList.remove('hidden');
          return;
        }
        document.getElementById('resetCodeError').classList.add('hidden');
        var btn = document.getElementById('verifyBtn');
        btn.textContent = '验证中...'; btn.disabled = true;
        try {
          var r = await fetch('/api/forgot-password/verify-code', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({phone: resetPhone, code: code})
          });
          var d = await r.json();
          if (r.ok) {
            resetToken = d.token;
            showStep(3);
          } else {
            document.getElementById('resetCodeError').textContent = d.error || '验证码错误';
            document.getElementById('resetCodeError').classList.remove('hidden');
          }
        } catch(e) { alert('网络错误'); }
        btn.textContent = '验证'; btn.disabled = false;
      }

      async function doResetPassword() {
        var pwd = document.getElementById('newPassword').value;
        var confirmPwd = document.getElementById('confirmPassword').value;
        var errEl = document.getElementById('resetPwdError');
        if (pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
          errEl.textContent = '密码至少8位，必须包含字母和数字';
          errEl.classList.remove('hidden'); return;
        }
        if (pwd !== confirmPwd) {
          errEl.textContent = '两次输入的密码不一致';
          errEl.classList.remove('hidden'); return;
        }
        errEl.classList.add('hidden');
        try {
          var r = await fetch('/api/forgot-password/reset', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({phone: resetPhone, token: resetToken, password: pwd})
          });
          if (r.ok) {
            document.getElementById('step3').classList.add('hidden');
            document.getElementById('stepSuccess').classList.remove('hidden');
            document.getElementById('stepDots').classList.add('hidden');
            document.getElementById('stepTitle').textContent = '完成';
            // Auto-redirect to dashboard after 1.5s
            setTimeout(function() { window.location.href = '/dashboard'; }, 1500);
          } else {
            var d = await r.json();
            errEl.textContent = d.error || '重置失败，请重试';
            errEl.classList.remove('hidden');
          }
        } catch(e) { alert('网络错误'); }
      }
    </script>
  `, { ...opts, title: '重置密码' });
}
