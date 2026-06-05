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

/** Forgot password page */
export function forgotPasswordPage(opts: LayoutOpts, message?: string): string {
  return layout(`
    <section class="max-w-md mx-auto px-4 pt-16 pb-20">
      <div class="card p-8">
        <div class="text-center mb-8">
          <span class="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl mx-auto mb-4">🔑</span>
          <h1 class="text-2xl font-bold text-slate-900">找回密码</h1>
          <p class="text-sm text-slate-500 mt-2">输入手机号，联系管理员重置密码</p>
        </div>

        ${message ? `<div class="mb-6 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 text-sm">${escapeHtml(message)}</div>` : ''}

        <div class="bg-amber-50 rounded-xl p-5 mb-6 text-sm text-amber-800">
          <p class="font-bold mb-2">📱 两种方式找回密码：</p>
          <p class="mb-1"><strong>方式一：</strong>联系管理员微信/电话，直接帮你重置</p>
          <p><strong>方式二：</strong>重新注册一个账户（免费）</p>
        </div>

        <form action="/forgot-password" method="POST" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">你的手机号（用于核实身份）</label>
            <input type="tel" name="phone" class="input-field" placeholder="输入注册时填的手机号">
          </div>
          <button type="submit" class="btn-primary w-full !py-3 justify-center text-base">
            提交申请 →
          </button>
        </form>

        <p class="text-center text-sm text-slate-400 mt-6">
          <a href="/login" class="text-primary-500 hover:text-primary-600 font-medium no-underline">← 返回登录</a>
        </p>
      </div>
    </section>
  `, { ...opts, title: '找回密码' });
}
