export interface LayoutOpts {
  title: string;
  user?: { display_name: string; email: string } | null;
  admin?: boolean;
  scripts?: string;
}

export function layout(content: string, opts: LayoutOpts): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)} — Token Relay</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { 400:'#0088FF',500:'#0077EE',600:'#0066DD' },
            cyan: { 400:'#36E4DA',500:'#2DD4C8' }
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050712;
      --accent: #0088FF;
      --cyan: #36E4DA;
      --text: #E8EDF2;
      --muted: #8A92A0;
      --card: rgba(255,255,255,0.03);
      --border: rgba(255,255,255,0.06);
      --glow: 0 0 20px rgba(0,136,255,0.15);
    }
    * { font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif; margin:0; padding:0; box-sizing:border-box; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }

    /* Starfield canvas */
    #starfield { position: fixed; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; opacity:0.6; }

    /* Glass card */
    .g-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 16px; transition: all 0.3s ease; position: relative; z-index:1; }
    .g-card:hover { border-color: rgba(0,136,255,0.2); box-shadow: var(--glow); transform: translateY(-1px); }

    /* Buttons */
    .btn-p { background: linear-gradient(135deg, #0088FF, #0066DD); color: #fff; padding: 10px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; position: relative; z-index:1; }
    .btn-p:hover { box-shadow: 0 0 30px rgba(0,136,255,0.4); transform: translateY(-2px); }
    .btn-o { background: transparent; color: var(--text); padding: 10px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; border: 1px solid rgba(255,255,255,0.12); cursor: pointer; transition: all 0.3s ease; text-decoration: none; position: relative; z-index:1; }
    .btn-o:hover { border-color: rgba(0,136,255,0.4); background: rgba(0,136,255,0.06); }

    /* Input */
    .inp { width:100%; padding:12px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:var(--text); font-size:15px; outline:none; transition:all 0.3s; position:relative; z-index:1; }
    .inp:focus { border-color: rgba(0,136,255,0.4); box-shadow:0 0 0 3px rgba(0,136,255,0.08); }
    .inp::placeholder { color: var(--muted); }

    /* Gradient divider */
    .g-div { height:1px; background:linear-gradient(90deg, transparent, rgba(0,136,255,0.3), rgba(54,228,218,0.3), transparent); margin:0; }

    /* Stat box */
    .s-box { background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:12px; padding:20px; transition:all 0.3s; }
    .s-box:hover { border-color:rgba(0,136,255,0.2); }

    /* Glow text */
    .g-text { background:linear-gradient(135deg, #0088FF, #36E4DA); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

    /* Selected state */
    .selected { border-color: #0088FF !important; box-shadow: 0 0 20px rgba(0,136,255,0.2) !important; background: rgba(0,136,255,0.06) !important; }

    /* Table */
    .tbl { width:100%; border-collapse:collapse; }
    .tbl th { text-align:left; padding:12px 16px; font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); }
    .tbl td { padding:12px 16px; font-size:14px; border-bottom:1px solid rgba(255,255,255,0.03); }
    .tbl tr:hover td { background:rgba(0,136,255,0.03); }

    /* Toast */
    .toast { position:fixed; bottom:24px; right:24px; padding:12px 20px; border-radius:12px; color:#fff; font-size:14px; font-weight:500; z-index:9999; opacity:0; transform:translateY(20px); transition:all 0.3s ease; }
    .toast.show { opacity:1; transform:translateY(0); }
  </style>
  ${opts.scripts || ''}
</head>
<body>
  <!-- Starfield -->
  <canvas id="starfield"></canvas>

  <!-- Navigation -->
  <nav style="position:sticky;top:0;z-index:100;background:rgba(5,7,18,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;">
      <a href="/" style="display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;color:#fff;text-decoration:none;">
        <span style="width:32px;height:32px;background:linear-gradient(135deg,#0088FF,#36E4DA);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;">⚡</span>
        <span class="g-text">Token Relay</span>
      </a>
      <div style="display:flex;align-items:center;gap:8px;font-size:14px;">
        <a href="/#features" style="color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:8px;transition:color 0.2s;">特性</a>
        <a href="/#pricing" style="color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:8px;transition:color 0.2s;">套餐</a>
        <a href="/#docs" style="color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:8px;transition:color 0.2s;">文档</a>
        ${opts.user ? `
          ${opts.admin ? '<a href="/admin" style="color:var(--accent);text-decoration:none;padding:6px 12px;border-radius:8px;font-weight:500;">管理</a>' : ''}
          <a href="/recharge" style="color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:8px;transition:color 0.2s;">💰 充值</a>
          <a href="/keys" style="color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:8px;transition:color 0.2s;">🔑 密钥</a>
          <a href="/dashboard" style="color:var(--muted);text-decoration:none;padding:6px 12px;border-radius:8px;transition:color 0.2s;">控制台</a>
          <span style="color:var(--border);margin:0 4px;">|</span>
          <span style="color:var(--muted);font-size:13px;">${escapeHtml(opts.user.display_name)}</span>
          <a href="/logout" style="color:var(--muted);text-decoration:none;padding:4px 8px;border-radius:8px;font-size:12px;transition:color 0.2s;">退出</a>
        ` : `
          <a href="/login" class="btn-o" style="font-size:13px;padding:8px 16px;">登录</a>
          <a href="/register" class="btn-p" style="font-size:13px;padding:8px 16px;">免费注册</a>
        `}
      </div>
    </div>
  </nav>

  <main style="position:relative;z-index:1;">${content}</main>

  <footer style="border-top:1px solid var(--border);padding:32px 24px;text-align:center;color:var(--muted);font-size:13px;position:relative;z-index:1;">
    Token Relay · 诚信为本 服务至上 · 2026
  </footer>

  <!-- Starfield animation -->
  <script>
    (function(){
      var c=document.getElementById('starfield'),ctx=c.getContext('2d'),stars=[],w,h;
      function resize(){w=c.width=window.innerWidth;h=c.height=window.innerHeight;}
      resize();window.addEventListener('resize',resize);
      for(var i=0;i<120;i++){stars.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+0.3,a:Math.random(),s:Math.random()*0.005+0.002});}
      function draw(){
        ctx.clearRect(0,0,w,h);
        for(var i=0;i<stars.length;i++){
          var s=stars[i];
          s.a+=s.s;if(s.a>1||s.a<0.2)s.s*=-1;
          ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
          ctx.fillStyle='rgba(255,255,255,'+s.a.toFixed(2)+')';ctx.fill();
        }
        requestAnimationFrame(draw);
      }
      draw();
    })();
  </script>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export const TOAST_SCRIPT = '';
