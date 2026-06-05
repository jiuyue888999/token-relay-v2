import { layout } from "./layout.js";
import type { LayoutOpts } from "./layout.js";

export function homePage(opts: LayoutOpts): string {
  return layout(`
    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        2026年6月 · 模型库已全面更新 · 30+ 前沿 AI 模型一站接入
      </div>
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
        一个 API Key，<br>
        <span class="gradient-text">畅享全球最前沿 AI</span>
      </h1>
      <p class="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-4 leading-relaxed">
        对话 · 图片 · 视频 — 三大 AI 能力统一接入。<br class="hidden sm:block">
        <strong>GPT-5.5 + Claude Opus 4.7 + DeepSeek V4 + Seedance 2.0 + 国产大模型全覆盖</strong>
      </p>
      <div class="flex flex-wrap items-center justify-center gap-1.5 mb-8 text-xs font-mono">
        <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold">GPT-5.5</span>
        <span class="px-2 py-0.5 bg-amber-50 text-amber-600 rounded font-bold">Claude Opus 4.7</span>
        <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-bold">Gemini 3 Pro</span>
        <span class="px-2 py-0.5 bg-violet-50 text-violet-600 rounded font-bold">DeepSeek V4 Pro</span>
        <span class="px-2 py-0.5 bg-red-50 text-red-600 rounded font-bold">Qwen3-Max</span>
        <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold">GLM-5</span>
        <span class="px-2 py-0.5 bg-purple-50 text-purple-600 rounded font-bold">Kimi K2.6</span>
        <span class="px-2 py-0.5 bg-pink-50 text-pink-600 rounded font-bold">豆包 2.0</span>
        <span class="px-2 py-0.5 bg-rose-50 text-rose-600 rounded font-bold">🔥 Seedance 2.0</span>
        <span class="px-2 py-0.5 bg-teal-50 text-teal-600 rounded font-bold">🎨 Seedream 5.0</span>
        <span class="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded font-bold">🎬 可灵 3.0</span>
    </div>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/register" class="btn-primary text-lg !px-8 !py-3.5 no-underline">
          立即注册 · 免费体验 ⚡
        </a>
        <a href="/#models" class="btn-secondary text-lg !px-8 !py-3.5 no-underline">
          查看全部模型 →
        </a>
      </div>
      <div class="mt-8 text-sm text-slate-400">
        注册即送 <strong class="text-slate-600">10万 tokens</strong> 免费额度 · 无需信用卡
      </div>
    </section>

    <!-- Trust indicators -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        ${[
          { icon:'🏆', title:'2026 最新模型', desc:'GPT-5.5 · Claude 4.7 · DeepSeek V4 · GLM-5 · Kimi K2.6' },
          { icon:'🎬', title:'导演级视频', desc:'Seedance 2.0 · 可灵 3.0 · Sora 2 · Runway Gen-4' },
          { icon:'🎨', title:'照片级出图', desc:'Seedream 5.0 · Midjourney 7 · Flux Pro · Imagen 4' },
          { icon:'🇨🇳', title:'国产全覆盖', desc:'通义千问·GLM·Kimi·豆包·百川·MiniMax·阶跃' },
        ].map(i => `
          <div class="card p-5 text-center">
            <div class="text-3xl mb-2">${i.icon}</div>
            <h3 class="font-semibold text-slate-800 mb-1">${i.title}</h3>
            <p class="text-xs text-slate-400 leading-relaxed">${i.desc}</p>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- ═══ LLM Models ═══════════════════════════════════════ -->
    <section id="models" class="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-100">
      <h2 class="text-3xl font-bold text-center mb-2">🤖 大语言模型</h2>
      <p class="text-slate-500 text-center mb-10">覆盖全球 14 个 AI 厂商，全部兼容 OpenAI API 格式</p>

      <!-- 全球 -->
      <h3 class="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">🌍 全球前沿</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        ${[
          { name:'GPT-5.5', org:'OpenAI · 2026.4', tag:'最强旗舰', color:'bg-emerald-100 text-emerald-700' },
          { name:'GPT-5.4', org:'OpenAI · 2026.3', tag:'性价比之王', color:'bg-emerald-100 text-emerald-700' },
          { name:'Claude Opus 4.7', org:'Anthropic · 2026.4', tag:'87.6% SWE-bench', color:'bg-amber-100 text-amber-700' },
          { name:'Claude Sonnet 4.6', org:'Anthropic · 2026.2', tag:'1M上下文', color:'bg-amber-100 text-amber-700' },
          { name:'Gemini 3 Pro', org:'Google · 2026', tag:'2M超长上下文', color:'bg-blue-100 text-blue-700' },
          { name:'Gemini 2.5 Flash', org:'Google · 2025', tag:'极速高并发', color:'bg-blue-100 text-blue-700' },
          { name:'DeepSeek V4 Pro', org:'DeepSeek · 2026.4', tag:'1.6T MoE · 1M上下文', color:'bg-violet-100 text-violet-700' },
          { name:'DeepSeek V4 Flash', org:'DeepSeek · 2026.4', tag:'百万上下文普惠', color:'bg-violet-100 text-violet-700' },
        ].map(m => `
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-bold text-slate-800">${m.name}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${m.color}">${m.tag}</span>
            </div>
            <div class="text-xs text-slate-400">${m.org}</div>
          </div>
        `).join('')}
      </div>

      <!-- 国产 -->
      <h3 class="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">🇨🇳 国产大模型</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        ${[
          { name:'Qwen3-Max', org:'阿里通义千问 · 2025', tag:'超GPT-5', color:'bg-red-100 text-red-700' },
          { name:'GLM-5', org:'智谱AI · 2026.2', tag:'744B 开源SOTA', color:'bg-blue-100 text-blue-700' },
          { name:'Kimi K2.6', org:'月之暗面 · 2026.4', tag:'1T MoE 多模态', color:'bg-purple-100 text-purple-700' },
          { name:'豆包 Seed 2.0', org:'字节跳动 · 2026.2', tag:'Agent+慢思考', color:'bg-pink-100 text-pink-700' },
          { name:'MiniMax M2', org:'MiniMax · 2026', tag:'多模态旗舰', color:'bg-rose-100 text-rose-700' },
          { name:'百川 4 Turbo', org:'百川智能 · 2025', tag:'高性能推理', color:'bg-amber-100 text-amber-700' },
          { name:'Yi-Lightning V2', org:'零一万物 · 2025', tag:'极速推理', color:'bg-teal-100 text-teal-700' },
          { name:'Step-3', org:'阶跃星辰 · 2026', tag:'多模态旗舰', color:'bg-cyan-100 text-cyan-700' },
        ].map(m => `
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-bold text-slate-800">${m.name}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${m.color}">${m.tag}</span>
            </div>
            <div class="text-xs text-slate-400">${m.org}</div>
          </div>
        `).join('')}
      </div>

      <!-- ═══ Image Models ═══════════════════════════════ -->
      <h3 class="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">🎨 图片生成</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        ${[
          {
            name:'🔥 Seedream 5.0 Lite',
            org:'字节跳动 · 2026.2',
            desc:'统一多模态生成架构，首次引入实时RAG检索增强。世界知识覆盖科技+人文垂类，角色一致性和图文对齐显著提升。',
            tag:'国产最强',
            color:'bg-pink-100 text-pink-700',
            thumbs: ['🏙️ 赛博朋克城市夜景','👤 多角度角色定妆照','🎨 中国风水墨画','📱 电商产品渲染图']
          },
          {
            name:'DALL·E 3',
            org:'OpenAI · 2024',
            desc:'经典文生图标杆模型，精准理解复杂指令，支持文字渲染和多轮迭代优化。',
            tag:'经典标杆',
            color:'bg-emerald-100 text-emerald-700',
            thumbs: ['🖼️ 油画风格肖像','📖 儿童绘本插图','🏞️ 奇幻风景','🎯 精准指令遵循']
          },
          {
            name:'🔥 Midjourney 7.0',
            org:'Midjourney · 2026',
            desc:'艺术品质天花板，照片级真实感。在光影、材质、构图方面达到前所未有的高度。',
            tag:'艺术之王',
            color:'bg-indigo-100 text-indigo-700',
            thumbs: ['🎬 电影级概念图','🌌 超现实艺术','🏛️ 建筑可视化','👗 时尚设计稿']
          },
          {
            name:'Flux Pro',
            org:'Black Forest · 2025',
            desc:'开源最强出图模型，照片级真实感。支持精确的文字嵌入和复杂场景构图。',
            tag:'开源最强',
            color:'bg-slate-100 text-slate-700',
            thumbs: ['📷 摄影级人像','🎮 游戏原画','📐 UI设计稿','🌿 自然风光']
          },
          {
            name:'通义万相 Max',
            org:'阿里 · 2025',
            desc:'中文语义理解王者，对中文诗词、成语、典故有极佳的理解和视觉呈现能力。',
            tag:'中文最强',
            color:'bg-red-100 text-red-700',
            thumbs: ['🏮 国风插画','📜 诗词可视化','🎭 戏曲人物','⛰️ 山水画']
          },
          {
            name:'Imagen 4',
            org:'Google · 2026',
            desc:'超写实渲染引擎，在光影追踪、材质模拟方面达到物理级精度。',
            tag:'超写实',
            color:'bg-blue-100 text-blue-700',
            thumbs: ['💡 产品摄影','🏠 室内设计','🌅 HDR风景','🔬 科学可视化']
          },
        ].map(m => `
          <div class="card p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-slate-800">${m.name}</h4>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${m.color}">${m.tag}</span>
            </div>
            <div class="text-xs text-slate-500 mb-1">${m.org}</div>
            <p class="text-xs text-slate-400 mb-3 leading-relaxed">${m.desc}</p>
            <div class="flex flex-wrap gap-1">
              ${m.thumbs.map(t => `<span class="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">${t}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- ═══ Video Models ═══════════════════════════════ -->
      <h3 class="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">🎬 视频生成</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        ${[
          {
            name:'🔥 Seedance 2.0',
            org:'字节跳动 · 2026.2 · 导演级',
            desc:'视频生成领域的"DeepSeek时刻"。支持文本/图片/视频/音频4模态输入，最多9张图+3段视频+3段音频同时参考。角色跨镜头一致性、物理真实度行业领先，单次可用率90%+。',
            tag:'行业第一',
            color:'bg-pink-100 text-pink-700',
            cases: ['🎵 MV制作：多镜头角色一致','🎬 电商广告：产品360°展示','🎞️ 短片创作：分镜级导演控制']
          },
          {
            name:'可灵 Kling 3.0',
            org:'快手 · 2026 · 动作大师',
            desc:'全球唯一支持3分钟1080P长视频生成。复杂人体动作（功夫/跳舞/跑步）表现业界第一，B端覆盖率达40%+。',
            tag:'长视频王者',
            color:'bg-orange-100 text-orange-700',
            cases: ['🥋 武术动作：精准骨骼动力学','💃 舞蹈生成：复杂编舞还原','🏃 运动场景：物理真实跑步']
          },
          {
            name:'Sora 2',
            org:'OpenAI · 2026 · 物理模拟器',
            desc:'在物理规律理解方面领先——液体流动、碰撞效果、光影变化均达到模拟级精度。支持可变帧率，跨媒介灵活适配。',
            tag:'物理引擎',
            color:'bg-emerald-100 text-emerald-700',
            cases: ['🌊 流体模拟：海浪/瀑布/河流','💥 碰撞特效：破碎/爆炸/飞溅','🌅 光影追踪：日出日落/霓虹']
          },
          {
            name:'Runway Gen-4',
            org:'Runway · 2026 · 好莱坞级',
            desc:'好莱坞专业影视工作室首选。在色彩科学、动态范围、镜头语言方面达到专业电影级水准。',
            tag:'电影级',
            color:'bg-indigo-100 text-indigo-700',
            cases: ['🎥 电影预告片','📺 商业广告TVC','🎬 视觉特效VFX']
          },
          {
            name:'Google Veo 3.1',
            org:'Google · 2026 · 超高清',
            desc:'结合世界模型技术，在超高清分辨率下保持物理一致性。与Google生态深度整合。',
            tag:'超高清',
            color:'bg-blue-100 text-blue-700',
            cases: ['🎮 游戏过场动画','🏗️ 建筑漫游','🌐 虚拟场景生成']
          },
          {
            name:'海螺 AI 02',
            org:'MiniMax · 2026 · 国产性价比',
            desc:'国产视频生成性价比之选。生成速度快、成本低，适合批量内容生产和社媒短视频。',
            tag:'性价比',
            color:'bg-cyan-100 text-cyan-700',
            cases: ['📱 社媒短视频','🛒 电商种草视频','📝 内容批量生产']
          },
        ].map(m => `
          <div class="card p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-slate-800 text-sm">${m.name}</h4>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${m.color}">${m.tag}</span>
            </div>
            <div class="text-xs text-slate-500 mb-1">${m.org}</div>
            <p class="text-xs text-slate-400 mb-3 leading-relaxed">${m.desc}</p>
            <div class="space-y-1">
              ${m.cases.map(c => `<div class="text-xs text-slate-500 flex items-start gap-1"><span class="text-slate-300 mt-0.5">▸</span> ${c}</div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-100">
      <h2 class="text-3xl font-bold text-center mb-4">透明定价</h2>
      <p class="text-slate-500 text-center mb-12 max-w-xl mx-auto">按量消费，余额永不过期。对话、图片、视频统一用 quota 结算。</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${[
          { name:'体验包', quota:'10万 tokens', price:'免费', color:'bg-slate-50', popular:false, desc:'注册即送 · 含全部模型' },
          { name:'基础包', quota:'100万 tokens', price:'¥9.90', color:'bg-white', popular:false, desc:'轻度日常使用' },
          { name:'专业包', quota:'500万 tokens', price:'¥39.90', color:'bg-primary-50 border-primary-200', popular:true, desc:'高频使用推荐' },
          { name:'旗舰包', quota:'2000万 tokens', price:'¥129.90', color:'bg-white', popular:false, desc:'团队 / 重度用户' },
        ].map(p => `
          <div class="card p-6 ${p.color} relative ${p.popular ? 'ring-2 ring-primary-300' : ''}">
            ${p.popular ? '<span class="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-white text-xs font-bold px-4 py-1 rounded-full">最受欢迎</span>' : ''}
            <h3 class="font-bold text-lg">${p.name}</h3>
            <p class="text-sm text-slate-400 mt-1">${p.desc}</p>
            <div class="mt-6 mb-4">
              <span class="text-3xl font-extrabold text-slate-900">${p.quota}</span>
            </div>
            <div class="text-2xl font-bold gradient-text mb-3">${p.price}</div>
            <a href="/register" class="block text-center ${p.popular ? 'btn-primary' : 'btn-secondary'} !py-2.5 no-underline">
              ${p.price === '免费' ? '立即注册' : '选择此套餐'}
            </a>
          </div>
        `).join('')}
      </div>
      <p class="text-center text-sm text-slate-400 mt-6">💡 图片约 2,000-8,000 quota/张 · 视频约 8,000-50,000 quota/条</p>
    </section>

    <!-- Docs -->
    <section id="docs" class="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-100">
      <h2 class="text-3xl font-bold text-center mb-4">快速接入</h2>
      <p class="text-slate-500 text-center mb-10">对话 · 图片 · 视频 — 全部一套 API</p>
      <div class="grid sm:grid-cols-3 gap-4 mb-6">
        <div class="card p-5">
          <h3 class="font-bold text-lg mb-3">💬 对话</h3>
          <div class="bg-slate-900 text-slate-50 rounded-lg p-4 text-xs font-mono leading-relaxed">
            <div class="text-slate-400">POST /v1/chat/completions</div>
            <div class="mt-2">Authorization: Bearer YOUR_KEY</div>
            <div class="mt-2 text-slate-400"># 示例模型：</div>
            <div class="text-amber-400">gpt-5.5</div>
            <div class="text-amber-400">claude-opus-4-7</div>
            <div class="text-amber-400">deepseek-v4-pro</div>
            <div class="text-amber-400">qwen/qwen3-max</div>
            <div class="text-amber-400">glm/glm-5</div>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-lg mb-3">🎨 图片</h3>
          <div class="bg-slate-900 text-slate-50 rounded-lg p-4 text-xs font-mono leading-relaxed">
            <div class="text-slate-400">POST /v1/images/generations</div>
            <div class="mt-2 text-slate-400">{"model": "...", "prompt": "..."}</div>
            <div class="mt-2 text-slate-400"># 示例模型：</div>
            <div class="text-amber-400">seedream/seedream-5.0-lite</div>
            <div class="text-amber-400">midjourney/7.0</div>
            <div class="text-amber-400">dall-e-3</div>
            <div class="text-amber-400">flux/flux-pro</div>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-bold text-lg mb-3">🎬 视频</h3>
          <div class="bg-slate-900 text-slate-50 rounded-lg p-4 text-xs font-mono leading-relaxed">
            <div class="text-slate-400">POST /v1/video/generations</div>
            <div class="mt-2">→ 返回 task_id</div>
            <div class="mt-2 text-slate-400">GET /v1/video/generations/:id</div>
            <div class="mt-2">→ 查询进度+获取视频URL</div>
            <div class="mt-2 text-slate-400"># 示例模型：</div>
            <div class="text-amber-400">seedance/seedance-2.0</div>
            <div class="text-amber-400">kling/kling-3.0</div>
            <div class="text-amber-400">sora/sora-2</div>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-lg mb-3">💻 Python 示例</h3>
        <div class="bg-slate-900 text-slate-50 rounded-xl p-5 overflow-x-auto text-sm font-mono">
          <div><span class="text-fuchsia-400">from</span> openai <span class="text-fuchsia-400">import</span> OpenAI</div>
          <div class="mt-2"><span class="text-sky-400">client</span> = OpenAI(</div>
          <div>&nbsp;&nbsp;api_key=<span class="text-amber-400">"YOUR_KEY"</span>,</div>
          <div>&nbsp;&nbsp;base_url=<span class="text-amber-400">"https://你的域名/v1"</span></div>
          <div>)</div>
          <div class="mt-3 text-slate-400"># 对话 —— 用最新 GPT-5.5</div>
          <div>client.chat.completions.create(</div>
          <div>&nbsp;&nbsp;model=<span class="text-amber-400">"gpt-5.5"</span>, ...)</div>
          <div class="mt-2 text-slate-400"># 图片 —— 用国产最强 Seedream 5.0</div>
          <div>client.images.generate(</div>
          <div>&nbsp;&nbsp;model=<span class="text-amber-400">"seedream/seedream-5.0-lite"</span>, ...)</div>
          <div class="mt-2 text-slate-400"># 视频 —— 用导演级 Seedance 2.0</div>
          <div><span class="text-fuchsia-400">import</span> requests</div>
          <div>r = requests.post(<span class="text-amber-400">"/v1/video/generations"</span>,</div>
          <div>&nbsp;&nbsp;json={"model":<span class="text-amber-400">"seedance/seedance-2.0"</span>, "prompt":"..."})</div>
        </div>
      </div>
    </section>
  `, { ...opts, title: 'Token Relay · 2026 AI模型聚合中转 · GPT-5.5+Seedance 2.0' });
}
