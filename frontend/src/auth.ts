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
            <label class="block text-sm font-medium text-slate-700 mb-1.5">邮箱地址</label>
            <input type="email" name="email" class="input-field" placeholder="you@example.com" required autofocus>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <input type="password" name="password" class="input-field" placeholder="请输入密码" required>
          </div>
          <button type="submit" class="btn-primary w-full !py-3 justify-center text-base">
            登录
          </button>
        </form>

        <p class="text-center text-sm text-slate-400 mt-6">
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

        <form action="/register" method="POST" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">邮箱地址</label>
            <input type="email" name="email" class="input-field" placeholder="you@example.com" required autofocus>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">显示名称</label>
            <input type="text" name="display_name" class="input-field" placeholder="给自己起个名字" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <input type="password" name="password" class="input-field" placeholder="至少6位密码" required minlength="6">
          </div>
          <button type="submit" class="btn-primary w-full !py-3 justify-center text-base">
            创建账户并领取免费额度
          </button>
        </form>

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
