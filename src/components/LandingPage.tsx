import { useEffect, useRef } from 'react';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'download' | 'auth' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function LandingPage({ onNavigate, isAuthenticated }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId: number;

    const syncSize = () => {
      const w = canvas.clientWidth || 640;
      const h = canvas.clientHeight || 480;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
          vec2 uv = v_texCoord;
          vec2 mouse = u_mouse / u_resolution;
          
          float lines = 0.0;
          for(float i=1.0; i<=5.0; i++) {
              float speed = i * 0.2;
              float amp = 0.1 / i;
              float y = uv.y + amp * sin(uv.x * 3.0 + u_time * speed + i);
              float lineDist = abs(y - 0.5);
              lines += 0.002 / (lineDist + 0.005);
          }
          
          vec2 grid = uv * 10.0;
          vec2 id = floor(grid);
          vec2 f = fract(grid);
          float m_dist = 1.0;
          for(float y=-1.0; y<=1.0; y++) {
              for(float x=-1.0; x<=1.0; x++) {
                  vec2 neighbor = vec2(x, y);
                  vec2 point = vec2(hash(id + neighbor), hash(id + neighbor + 123.4));
                  point = 0.5 + 0.4 * sin(u_time * 0.4 + point * 6.2831);
                  vec2 diff = neighbor + point - f;
                  m_dist = min(m_dist, length(diff));
              }
          }
          
          vec3 bgColor = vec3(0.043, 0.063, 0.125); // #0B1020
          vec3 accent1 = vec3(0.357, 0.486, 0.98); // #5B7CFA
          vec3 accent2 = vec3(0.545, 0.361, 0.965); // #8B5CF6
          
          float nodeGlow = 0.01 / (m_dist + 0.02);
          vec3 finalColor = bgColor + (accent1 * lines * 0.5) + (accent2 * nodeGlow * 0.3);
          
          float mouseDist = length(uv - mouse);
          finalColor += accent1 * (0.04 / (mouseDist + 0.15));
          
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const cs = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vsShader = cs(gl.VERTEX_SHADER, vs);
    const fsShader = cs(gl.FRAGMENT_SHADER, fs);
    if (!vsShader || !fsShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vsShader);
    gl.attachShader(prog, fsShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = (t: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <div className="font-body-md text-body-md bg-surface-dim text-on-surface min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-surface-dim/80 backdrop-blur-xl border-b border-white/5 shadow-sm h-20">
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop flex justify-between items-center h-full">
          <div className="font-headline-md text-headline-md tracking-tighter text-on-surface cursor-pointer" onClick={() => onNavigate('landing')}>
            The Invisible Algorithm
          </div>
          <div className="hidden md:flex items-center gap-stack-lg">
            <span className="text-primary font-semibold border-b-2 border-primary pb-1 font-label-md text-label-md cursor-pointer">
              Home
            </span>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md" href="#how-it-works">
              How It Works
            </a>
            <a className="text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md" href="#features">
              Features
            </a>
            {isAuthenticated ? (
              <span className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer" onClick={() => onNavigate('dashboard')}>
                Dashboard
              </span>
            ) : (
              <span className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer" onClick={() => onNavigate('auth')}>
                Sign In
              </span>
            )}
          </div>
          <button 
            onClick={() => onNavigate('download')}
            className="bg-primary text-on-primary-container px-6 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Download Extension
          </button>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center overflow-hidden hero-gradient px-container-padding-desktop">
          <div className="max-w-[1280px] mx-auto w-full grid md:grid-cols-2 gap-stack-lg items-center relative z-10">
            <div className="space-y-stack-md">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm border border-primary/20">
                Unveil the Digital Ghost
              </span>
              <h1 className="font-display-lg text-display-lg max-w-xl text-on-surface">
                See what shapes your digital world.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                Modern recommendation systems act as invisible curators. Our browser extension reveals the patterns behind your feed, giving you the power to break the echo chamber.
              </p>
              <div className="flex flex-wrap gap-stack-md pt-stack-sm">
                <button 
                  onClick={() => onNavigate('download')}
                  className="bg-primary text-on-primary-container px-8 py-3 rounded-lg font-label-md text-label-md font-bold shadow-lg hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                >
                  Download Extension
                </button>
                <a 
                  href="#how-it-works"
                  className="border border-outline-variant/30 px-8 py-3 rounded-lg font-label-md text-label-md hover:bg-white/5 transition-all active:scale-95 text-center flex items-center justify-center cursor-pointer"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="relative h-[500px] w-full rounded-xl overflow-hidden glass shadow-2xl">
              <div className="absolute inset-0 w-full h-full opacity-80" style={{ display: 'block' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/40 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Why This Matters Section */}
        <section className="py-section-gap px-container-padding-desktop bg-surface-container-lowest">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Why This Matters</h2>
              <p className="text-on-surface-variant mt-stack-sm max-w-2xl mx-auto">
                Understanding the &quot;Invisible Algorithm&quot; is the first step toward digital sovereignty in a world of algorithmic bias.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-stack-lg">
              {/* Card 1 */}
              <div className="glass p-stack-lg rounded-xl hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-lg bg-tertiary-container/20 flex items-center justify-center mb-stack-md">
                  <span className="material-symbols-outlined text-tertiary" data-icon="groups">groups</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-stack-sm text-white">Echo Chambers</h3>
                <p className="text-on-surface-variant font-body-md">
                  Discover how much of your feed is reinforcing your existing beliefs versus showing you new perspectives.
                </p>
              </div>
              {/* Card 2 */}
              <div className="glass p-stack-lg rounded-xl hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center mb-stack-md">
                  <span className="material-symbols-outlined text-primary" data-icon="settings_suggest">settings_suggest</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-stack-sm text-white">Personalization</h3>
                <p className="text-on-surface-variant font-body-md">
                  Visualize the &quot;shadow profile&quot; platforms build about you to predict and influence your next click.
                </p>
              </div>
              {/* Card 3 */}
              <div className="glass p-stack-lg rounded-xl hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-lg bg-secondary-container/20 flex items-center justify-center mb-stack-md">
                  <span className="material-symbols-outlined text-secondary" data-icon="visibility">visibility</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-stack-sm text-white">Digital Awareness</h3>
                <p className="text-on-surface-variant font-body-md">
                  Develop a technical intuition for how AI models sort, rank, and prioritize the information you consume.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-section-gap px-container-padding-desktop" id="how-it-works">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="font-headline-lg text-headline-lg text-center mb-16">How It Works</h2>
            <div className="relative flex flex-col md:flex-row justify-between items-start gap-stack-lg">
              {/* Progress Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-outline-variant/20 z-0">
                <div className="h-full bg-gradient-to-r from-primary via-tertiary to-secondary w-3/4"></div>
              </div>
              {/* Steps */}
              <div 
                onClick={() => onNavigate('download')}
                className="relative z-10 flex flex-col items-center text-center md:w-1/5 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-stack-md border-2 border-primary group-hover:shadow-[0_0_20px_rgba(183,196,255,0.4)] transition-all">
                  <span className="material-symbols-outlined text-primary" data-icon="download">download</span>
                </div>
                <h4 className="font-label-md text-label-md mb-2 text-white">Step 1</h4>
                <p className="font-body-md text-on-surface-variant">Download Extension</p>
              </div>
              <div 
                onClick={() => onNavigate('auth')}
                className="relative z-10 flex flex-col items-center text-center md:w-1/5 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-stack-md border-2 border-outline-variant group-hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant" data-icon="account_circle">account_circle</span>
                </div>
                <h4 className="font-label-md text-label-md mb-2 text-white">Step 2</h4>
                <p className="font-body-md text-on-surface-variant">Create Account</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center md:w-1/5 group">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-stack-md border-2 border-outline-variant group-hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant" data-icon="chrome_reader_mode">chrome_reader_mode</span>
                </div>
                <h4 className="font-label-md text-label-md mb-2 text-white">Step 3</h4>
                <p className="font-body-md text-on-surface-variant">Browse Naturally</p>
              </div>
              <div className="relative z-10 flex flex-col items-center text-center md:w-1/5 group">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-stack-md border-2 border-outline-variant group-hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant" data-icon="insights">insights</span>
                </div>
                <h4 className="font-label-md text-label-md mb-2 text-white">Step 4</h4>
                <p className="font-body-md text-on-surface-variant">Get Hidden Insights</p>
              </div>
              <div 
                onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'auth')}
                className="relative z-10 flex flex-col items-center text-center md:w-1/5 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-stack-md border-2 border-outline-variant group-hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-on-surface-variant" data-icon="trending_up">trending_up</span>
                </div>
                <h4 className="font-label-md text-label-md mb-2 text-white">Step 5</h4>
                <p className="font-body-md text-on-surface-variant">Track Progress</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-section-gap px-container-padding-desktop bg-surface-container-low" id="features">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-white">Powerful Tools for a Clearer Web</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-md">
              {/* Feature 1 */}
              <div className="bg-surface p-stack-lg rounded-xl border border-white/5 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-primary mb-stack-md" data-icon="analytics">analytics</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">Feed Diversity Score</h3>
                <p className="text-on-surface-variant">Real-time analysis of content variety in your social feeds.</p>
              </div>
              {/* Feature 2 */}
              <div 
                onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'auth')}
                className="bg-surface p-stack-lg rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary mb-stack-md" data-icon="dashboard_customize">dashboard_customize</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">Personal Dashboard</h3>
                <p className="text-on-surface-variant">A centralized hub to view long-term algorithmic trends.</p>
              </div>
              {/* Feature 3 */}
              <div className="bg-surface p-stack-lg rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-tertiary mb-stack-md" data-icon="psychology">psychology</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">Browsing Reflections</h3>
                <p className="text-on-surface-variant">Weekly AI-powered summaries of your information diet.</p>
              </div>
              {/* Feature 4 */}
              <div className="bg-surface p-stack-lg rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-error mb-stack-md" data-icon="monitoring">monitoring</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">Weekly Progress</h3>
                <p className="text-on-surface-variant">Watch your digital awareness grow with gamified metrics.</p>
              </div>
              {/* Feature 5 */}
              <div className="bg-surface p-stack-lg rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-primary mb-stack-md" data-icon="lock">lock</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">Privacy First</h3>
                <p className="text-on-surface-variant">Local-only data processing. We never see your history.</p>
              </div>
              {/* Feature 6 */}
              <div className="bg-surface p-stack-lg rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-on-surface mb-stack-md" data-icon="school">school</span>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">Educational Insights</h3>
                <p className="text-on-surface-variant">Learn the math behind the machine with mini-lessons.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="py-section-gap px-container-padding-desktop">
          <div className="max-w-[1280px] mx-auto glass rounded-2xl p-stack-lg flex flex-col md:flex-row items-center gap-stack-lg">
            <div className="md:w-1/2 space-y-stack-md">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Built with Transparency.</h2>
              <p className="font-body-lg text-on-surface-variant">
                Our code is open-source and our privacy policy is simple: your data stays on your machine. We believe the tools used to audit algorithms must be as transparent as the algorithms are opaque.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" data-icon="verified_user">verified_user</span>
                  <span className="font-label-md text-label-md text-white">Verified Privacy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" data-icon="code">code</span>
                  <span className="font-label-md text-label-md text-white">Open Source</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 w-full h-80 rounded-xl relative overflow-hidden bg-surface-container">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full max-w-sm p-stack-md bg-surface-dim border border-white/10 rounded shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs opacity-40 font-mono">privacy_manifest.json</span>
                  </div>
                  <pre className="text-xs text-primary font-mono leading-relaxed opacity-80">
                    {JSON.stringify({
                      "tracking": false,
                      "external_servers": [],
                      "encryption": "AES-256",
                      "local_storage": true,
                      "audit": "completed_2024"
                    }, null, 2)}
                  </pre>
                </div>
              </div>
              {/* Decorative blur */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px]"></div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-section-gap px-container-padding-desktop">
          <div className="max-w-[1280px] mx-auto text-center space-y-stack-md bg-gradient-to-b from-primary/5 to-transparent py-24 rounded-3xl border border-primary/10">
            <h2 className="font-display-lg text-display-lg text-white">Ready to understand your feed?</h2>
            <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto">
              Join 50,000+ users who have already started reclaiming their digital attention.
            </p>
            <div className="pt-stack-md">
              <button 
                onClick={() => onNavigate('download')}
                className="bg-primary text-on-primary-container px-12 py-4 rounded-xl font-headline-md text-headline-md font-bold shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                Download Extension
              </button>
              <p className="text-label-sm text-label-sm text-on-surface-variant mt-4 opacity-60">
                Available for Chrome, Firefox, and Safari.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-stack-lg border-t border-outline-variant/20">
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop flex flex-col md:flex-row justify-between items-center gap-stack-md">
          <div className="space-y-2 text-center md:text-left">
            <div className="font-headline-md text-headline-md text-on-surface">The Invisible Algorithm</div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">© 2024 The Invisible Algorithm. All rights reserved.</p>
            <p className="font-label-sm text-label-sm text-primary">UNESCO Youth Hackathon 2026 Winner</p>
          </div>
          <div className="flex flex-wrap justify-center gap-stack-md">
            <span className="font-label-sm text-label-sm text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">Privacy Policy</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">Terms of Service</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">Github</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">Twitter</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">Documentation</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
