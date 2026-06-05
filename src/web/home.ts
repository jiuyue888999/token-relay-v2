import { layout, escapeHtml } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

const PKG = [
  { id:'pkg_trial', name:'体验包', tokens:'100,000', price:0, popular:false, desc:'新用户注册即送，无需付费' },
  { id:'pkg_basic', name:'基础包', tokens:'1,000,000', price:9.90, popular:false, desc:'日常轻度使用，性价比高' },
  { id:'pkg_pro', name:'专业包', tokens:'5,000,000', price:39.90, popular:true, desc:'高频使用推荐，开发首选' },
  { id:'pkg_ultra', name:'旗舰包', tokens:'20,000,000', price:129.90, popular:false, desc:'团队/重度用户，批量优惠' },
];

export function homePage(opts: LayoutOpts): string {
  return layout(`
    <!-- ═══ Hero ═══ -->
    <section style="max-width:1200px;margin:0 auto;padding:100px 24px 80px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:100px;background:rgba(0,136,255,0.08);border:1px solid rgba(0,136,255,0.15);margin-bottom:24px;font-size:13px;color:var(--accent);font-weight:500;">
        <span style="width:8px;height:8px;border-radius:50%;background:#36E4DA;box-shadow:0 0 8px rgba(54,228,218,0.6);"></span>
        36+ AI模型 · 对话+图片+视频 · 统一API接入
      </div>
      <h1 style="font-size:clamp(36px,6vw,64px);font-weight:900;line-height:1.15;margin-bottom:20px;color:#fff;letter-spacing:-0.02em;">
        一个 API，<br><span class="g-text">畅享全球顶尖 AI</span>
      </h1>
      <p style="font-size:18px;color:var(--muted);max-width:600px;margin:0 auto 40px;line-height:1.7;">
        GPT-5.5 · Claude Opus 4.7 · DeepSeek V4 · Seedance 2.0 · Seedream 5.0<br>通义千问 · 智谱GLM-5 · Kimi K2.6 · 可灵Kling 3.0
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="/register" class="btn-p" style="font-size:16px;padding:14px 32px;">立即注册 · 免费体验 ⚡</a>
        <a href="#pricing" class="btn-o" style="font-size:16px;padding:14px 32px;">查看套餐 →</a>
      </div>
    </section>

    <div class="g-div" style="max-width:1200px;margin:0 auto;"></div>

    <!-- ═══ Token Packages + Calculator ═══ -->
    <section id="pricing" style="max-width:1200px;margin:0 auto;padding:80px 24px;">
      <div style="text-align:center;margin-bottom:60px;">
        <h2 style="font-size:36px;font-weight:800;color:#fff;margin-bottom:12px;">Token 套餐选购</h2>
        <p style="color:var(--muted);font-size:16px;">选择预置套餐，或自定义数量实时核算价格</p>
      </div>

      <!-- Package cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:48px;" id="pkgGrid">
        ${PKG.map((p,i) => `
          <div class="g-card pkg-card" data-tokens="${p.tokens.replace(/,/g,'')}" data-price="${p.price}" data-name="${p.name}" style="padding:28px;cursor:pointer;text-align:center;${p.popular?'border-color:rgba(0,136,255,0.4);':''}${i===0?'border-color:var(--accent);box-shadow:0 0 24px rgba(0,136,255,0.2);':''}" onclick="selectPkg(this,'${p.id}')">
            ${p.popular ? '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#0088FF,#36E4DA);color:#fff;font-size:11px;font-weight:700;padding:4px 16px;border-radius:100px;">最受欢迎</div>' : ''}
            <h3 style="font-size:20px;font-weight:700;color:#fff;margin-bottom:4px;">${p.name}</h3>
            <p style="font-size:12px;color:var(--muted);margin-bottom:20px;">${p.desc}</p>
            <div style="font-size:36px;font-weight:900;color:#fff;margin-bottom:4px;">${p.tokens.replace(/,/g,'<span style="font-size:16px;color:var(--muted);">,</span>')}</div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">tokens</div>
            <div style="font-size:28px;font-weight:800;" class="g-text">${p.price===0?'免费':'¥'+p.price.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Custom calculator -->
      <div class="g-card" style="padding:32px;max-width:600px;margin:0 auto;">
        <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;">📐 自定义数量核算</h3>
        <p style="font-size:13px;color:var(--muted);margin-bottom:20px;">输入 Token 数量，实时计算应付金额</p>
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">Token 数量</label>
            <input type="number" class="inp" id="customTokens" placeholder="输入数量，如 500000" min="1000" step="1000" oninput="calcCustom()" style="font-size:18px;font-weight:600;">
          </div>
          <div style="flex:1;min-width:200px;">
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px;">应付金额</label>
            <div class="inp" style="font-size:24px;font-weight:800;display:flex;align-items:center;" id="customPrice">¥0.00</div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:12px;color:var(--muted);">
          参考单价：¥<span id="unitPrice">0.010</span> / 千 tokens
        </div>
      </div>
    </section>

    <div class="g-div" style="max-width:1200px;margin:0 auto;"></div>

    <!-- ═══ Payment Icons ═══ -->
    <section style="max-width:1200px;margin:0 auto;padding:60px 24px;text-align:center;">
      <h2 style="font-size:32px;font-weight:800;color:#fff;margin-bottom:40px;">支持支付方式</h2>
      <div style="display:flex;gap:32px;justify-content:center;flex-wrap:wrap;">
        <!-- WeChat -->
        <div class="g-card" style="padding:40px 48px;text-align:center;min-width:200px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#07C160" style="margin:0 auto 16px;">
            <path d="M8.69 3.46C5.29 4.72 2.86 8.04 3.1 11.81c.17 2.64 1.31 4.88 3.05 6.4.28.26.34.7.15 1.02l-1.06 1.8c-.13.23.07.43.29.31l2.16-1.05c.23-.11.5-.07.7.06 1.18.76 2.55 1.19 4.02 1.19 5.79 0 10.49-4.24 10.49-9.48 0-4.3-3.16-7.94-7.5-9.01-.23-.06-.48.06-.5.3-.05.55-.54.97-1.1.9-.45-.06-.74-.53-.61-.96.13-.44-.19-.89-.64-.87-1.05.05-2.09.34-3.02.84zM9.83 9.32c.59 0 1.08.44 1.08.99 0 .54-.48.98-1.08.98-.59 0-1.07-.44-1.07-.98.01-.55.48-.99 1.07-.99zm4.35 0c.59 0 1.07.44 1.07.99 0 .54-.48.98-1.07.98-.59 0-1.08-.44-1.08-.98 0-.55.49-.99 1.08-.99z"/>
          </svg>
          <div style="font-size:18px;font-weight:700;color:#07C160;">微信支付</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">WeChat Pay</div>
        </div>
        <!-- Alipay -->
        <div class="g-card" style="padding:40px 48px;text-align:center;min-width:200px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#1677FF" style="margin:0 auto 16px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.5 6h-5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1.5v3h-1.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h3c.83 0 1.5-.67 1.5-1.5v-4c0-.83-.67-1.5-1.5-1.5h-1.5V8h2c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5z"/>
          </svg>
          <div style="font-size:18px;font-weight:700;color:#1677FF;">支付宝</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">Alipay</div>
        </div>
      </div>
    </section>

    <div class="g-div" style="max-width:1200px;margin:0 auto;"></div>

    <!-- ═══ Docs ═══ -->
    <section id="docs" style="max-width:1200px;margin:0 auto;padding:80px 24px;">
      <h2 style="text-align:center;font-size:36px;font-weight:800;color:#fff;margin-bottom:40px;">快速接入</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        <div class="g-card" style="padding:24px;">
          <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:12px;">💬 对话 Chat</h3>
          <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;font-family:monospace;font-size:13px;line-height:1.8;">
            <div style="color:var(--muted);">POST /v1/chat/completions</div>
            <div style="color:#0088FF;">Authorization: Bearer YOUR_KEY</div>
            <div style="color:var(--muted);margin-top:8px;"># 36个模型任意切换</div>
            <div style="color:#36E4DA;">gpt-5.5 | deepseek-v4-pro | qwen/qwen3-max</div>
          </div>
        </div>
        <div class="g-card" style="padding:24px;">
          <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:12px;">🎨 图片 Image</h3>
          <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;font-family:monospace;font-size:13px;line-height:1.8;">
            <div style="color:var(--muted);">POST /v1/images/generations</div>
            <div style="color:#0088FF;">Authorization: Bearer YOUR_KEY</div>
            <div style="color:var(--muted);margin-top:8px;"># 6个图片模型</div>
            <div style="color:#36E4DA;">seedream-5.0 | dall-e-3 | midjourney-7.0</div>
          </div>
        </div>
        <div class="g-card" style="padding:24px;">
          <h3 style="font-size:18px;font-weight:700;color:#fff;margin-bottom:12px;">🎬 视频 Video</h3>
          <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;font-family:monospace;font-size:13px;line-height:1.8;">
            <div style="color:var(--muted);">POST /v1/video/generations</div>
            <div style="color:#0088FF;">Authorization: Bearer YOUR_KEY</div>
            <div style="color:var(--muted);margin-top:8px;"># 8个视频模型</div>
            <div style="color:#36E4DA;">seedance-2.0 | kling-3.0 | sora-2</div>
          </div>
        </div>
      </div>
    </section>

    <script>
      // Package selection
      function selectPkg(el, id) {
        document.querySelectorAll('.pkg-card').forEach(function(c){ c.classList.remove('selected'); });
        el.classList.add('selected');
        var tokens = parseInt(el.dataset.tokens);
        var price = parseFloat(el.dataset.price);
        document.getElementById('customTokens').value = tokens;
        document.getElementById('customPrice').textContent = '¥' + price.toFixed(2);
      }

      // Custom calculator
      function calcCustom() {
        var tokens = parseInt(document.getElementById('customTokens').value) || 0;
        var rate = 0.0099; // per 1K tokens
        var price = (tokens / 1000) * rate;
        document.getElementById('customPrice').textContent = '¥' + price.toFixed(2);
        document.getElementById('unitPrice').textContent = rate.toFixed(3);
        // Deselect preset packages
        document.querySelectorAll('.pkg-card').forEach(function(c){ c.classList.remove('selected'); });
      }
    </script>
  `, { ...opts, title: '新一代 AI 模型聚合中转' });
}
