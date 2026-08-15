
import { useEffect, useRef, useState } from 'react';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'download' | 'auth' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function LandingPage({
  onNavigate,
  isAuthenticated,
}: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [glitch, setGlitch] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [echoScore, setEchoScore] = useState(67);
  const [analyzing, setAnalyzing] = useState(true);

  /* =========================================================
     CYBER NETWORK WEBGL BACKGROUND
  ========================================================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) return;

    let animationId: number;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const vertexShaderSource = `
      attribute vec2 a_position;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;

      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float hash(vec2 p) {
        return fract(
          sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123
        );
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        f = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)),
              hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      float grid(vec2 uv) {
        vec2 g = abs(fract(uv - 0.5) - 0.5);
        float line = min(g.x, g.y);

        return 0.025 / max(line, 0.002);
      }

      void main() {

        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 aspect = vec2(
          u_resolution.x / u_resolution.y,
          1.0
        );

        vec2 p = (uv - 0.5) * aspect;

        /* Deep cyber background */
        vec3 color = vec3(0.015, 0.025, 0.055);

        /* Moving grid */
        vec2 gridUV = p * 8.0;
        gridUV.y += u_time * 0.08;

        float g = grid(gridUV);

        color += vec3(0.03, 0.10, 0.25) * g;

        /* Network nodes */
        vec2 cell = floor(gridUV);
        vec2 local = fract(gridUV) - 0.5;

        float closest = 100.0;

        for(float y = -1.0; y <= 1.0; y++) {
          for(float x = -1.0; x <= 1.0; x++) {

            vec2 neighbor = vec2(x, y);
            vec2 id = cell + neighbor;

            vec2 point = vec2(
              hash(id),
              hash(id + 23.7)
            );

            point -= 0.5;

            point += 0.12 * vec2(
              sin(u_time * 0.7 + hash(id) * 10.0),
              cos(u_time * 0.5 + hash(id) * 10.0)
            );

            float d = length(neighbor + point - local);

            closest = min(closest, d);
          }
        }

        float nodeGlow =
          0.015 / (closest + 0.02);

        color += vec3(
          0.15,
          0.25,
          0.9
        ) * nodeGlow;

        /* Mouse energy field */
        vec2 mouse = u_mouse / u_resolution.xy;
        vec2 mouseP = (mouse - 0.5) * aspect;

        float mouseDistance =
          length(p - mouseP);

        float mouseGlow =
          0.08 / (mouseDistance + 0.12);

        color += vec3(
          0.20,
          0.35,
          1.0
        ) * mouseGlow;

        /* Moving scan waves */
        float scan =
          sin((p.y + u_time * 0.15) * 25.0);

        color += vec3(
          0.02,
          0.10,
          0.30
        ) * smoothstep(0.95, 1.0, scan);

        /* Vignette */
        float vignette =
          1.0 - length(uv - 0.5) * 0.8;

        color *= vignette;

        gl_FragColor =
          vec4(color, 1.0);
      }
    `;

    const createShader = (
      type: number,
      source: string
    ) => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      return shader;
    };

    const vertexShader = createShader(
      gl.VERTEX_SHADER,
      vertexShaderSource
    );

    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();

    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    const buffer = gl.createBuffer();

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      buffer
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const position =
      gl.getAttribLocation(
        program,
        'a_position'
      );

    gl.enableVertexAttribArray(position);

    gl.vertexAttribPointer(
      position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    const timeLocation =
      gl.getUniformLocation(
        program,
        'u_time'
      );

    const resolutionLocation =
      gl.getUniformLocation(
        program,
        'u_resolution'
      );

    const mouseLocation =
      gl.getUniformLocation(
        program,
        'u_mouse'
      );

    let mouseX =
      canvas.width / 2;

    let mouseY =
      canvas.height / 2;

    const handleMouseMove = (
      event: MouseEvent
    ) => {
      const rect =
        canvas.getBoundingClientRect();

      mouseX =
        ((event.clientX - rect.left) /
          rect.width) *
        canvas.width;

      mouseY =
        (1 -
          (event.clientY - rect.top) /
            rect.height) *
        canvas.height;
    };

    window.addEventListener(
      'mousemove',
      handleMouseMove
    );

    const render = (
      time: number
    ) => {
      gl.viewport(
        0,
        0,
        canvas.width,
        canvas.height
      );

      if (timeLocation) {
        gl.uniform1f(
          timeLocation,
          time * 0.001
        );
      }

      if (resolutionLocation) {
        gl.uniform2f(
          resolutionLocation,
          canvas.width,
          canvas.height
        );
      }

      if (mouseLocation) {
        gl.uniform2f(
          mouseLocation,
          mouseX,
          mouseY
        );
      }

      gl.drawArrays(
        gl.TRIANGLE_STRIP,
        0,
        4
      );

      animationId =
        requestAnimationFrame(render);
    };

    animationId =
      requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);

      window.removeEventListener(
        'resize',
        resize
      );

      window.removeEventListener(
        'mousemove',
        handleMouseMove
      );
    };
  }, []);

  /* =========================================================
     GLITCH EFFECT
  ========================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);

      setTimeout(() => {
        setGlitch(false);
      }, 180);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     SCANNER ANIMATION
  ========================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((previous) => {
        if (previous >= 100) {
          setAnalyzing(false);

          setTimeout(() => {
            setAnalyzing(true);
          }, 700);

          return 0;
        }

        return previous + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     ECHO CHAMBER SCORE
  ========================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setEchoScore((previous) => {
        const variation =
          Math.floor(
            Math.random() * 7
          ) - 3;

        return Math.min(
          92,
          Math.max(
            45,
            previous + variation
          )
        );
      });
    }, 1800);

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">

      {/* =====================================================
          GLOBAL CYBER ANIMATION STYLES
      ===================================================== */}

      <style>{`

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: .45;
            box-shadow: 0 0 10px rgba(91,124,250,.2);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 25px rgba(91,124,250,.6);
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(1000%);
            opacity: 0;
          }
        }

        @keyframes dataFlow {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(250%);
            opacity: 0;
          }
        }

        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          25% {
            transform: translate(-2px, 1px);
          }
          50% {
            transform: translate(2px, -1px);
          }
          75% {
            transform: translate(-1px, -1px);
          }
          100% {
            transform: translate(0);
          }
        }

        @keyframes blink {
          0%, 45% {
            opacity: 1;
          }
          50%, 100% {
            opacity: .25;
          }
        }

        @keyframes borderPulse {
          0%, 100% {
            border-color: rgba(91,124,250,.2);
          }
          50% {
            border-color: rgba(91,124,250,.65);
          }
        }

        @keyframes gridMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 60px;
          }
        }

        .cyber-glitch {
          animation: glitch .18s linear;
        }

        .cyber-float {
          animation: float 5s ease-in-out infinite;
        }

        .cyber-pulse {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .cyber-border {
          animation: borderPulse 3s ease-in-out infinite;
        }

        .cyber-grid {
          background-image:
            linear-gradient(
              rgba(91,124,250,.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(91,124,250,.08) 1px,
              transparent 1px
            );
          background-size: 30px 30px;
          animation: gridMove 8s linear infinite;
        }

        .cyber-data-line {
          animation: dataFlow 2.5s linear infinite;
        }

        .cyber-scan {
          animation: scan 3.5s linear infinite;
        }

        .cyber-blink {
          animation: blink 1.2s infinite;
        }

        .cyber-card {
          transition:
            transform .3s ease,
            border-color .3s ease,
            box-shadow .3s ease;
        }

        .cyber-card:hover {
          transform:
            translateY(-6px)
            scale(1.01);

          border-color:
            rgba(91,124,250,.55);

          box-shadow:
            0 0 35px
            rgba(91,124,250,.12);
        }

      `}</style>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050816]/80 backdrop-blur-xl border-b border-white/5">

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">

          <button
            onClick={() =>
              onNavigate('landing')
            }
            className="font-bold tracking-tight text-lg flex items-center gap-3"
          >

            <div className="w-8 h-8 rounded-lg border border-blue-400/40 bg-blue-500/10 flex items-center justify-center cyber-pulse">

              <span className="text-blue-300 text-sm">
                ◇
              </span>

            </div>

            <span>
              THE INVISIBLE
              <span className="text-blue-400">
                {" "}ALGORITHM
              </span>
            </span>

          </button>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">

            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              How It Works
            </a>

            <a
              href="#features"
              className="hover:text-white transition-colors"
            >
              Features
            </a>

            <a
              href="#privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </a>

            {isAuthenticated ? (
              <button
                onClick={() =>
                  onNavigate('dashboard')
                }
                className="hover:text-blue-300 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() =>
                  onNavigate('auth')
                }
                className="hover:text-blue-300 transition-colors"
              >
                Sign In
              </button>
            )}

          </div>

          <button
            onClick={() =>
              onNavigate('download')
            }
            className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            Download Extension
          </button>

        </div>

      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <main className="pt-20">

        <section className="relative min-h-[900px] flex items-center overflow-hidden">

          {/* WebGL background */}

          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-[#050816]/20 via-[#050816]/20 to-[#050816]" />

          <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 w-full grid lg:grid-cols-2 gap-16 items-center py-24">

            {/* HERO TEXT */}

            <div className="space-y-7">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-xs font-mono">

                <span className="w-2 h-2 rounded-full bg-blue-400 cyber-blink" />

                ALGORITHMIC TRANSPARENCY SYSTEM

              </div>

              <div className={glitch ? 'cyber-glitch' : ''}>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[.95]">

                  See what
                  <br />

                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-500">
                    shapes
                  </span>

                  <br />

                  your digital world.

                </h1>

              </div>

              <p className="text-lg text-slate-400 max-w-xl leading-relaxed">

                Recommendation systems silently decide what
                you see next. The Invisible Algorithm exposes
                those patterns and helps you understand your
                information bubble.

              </p>

              <div className="flex flex-wrap gap-4">

                <button
                  onClick={() =>
                    onNavigate('download')
                  }
                  className="px-7 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  Deploy Extension →
                </button>

                <a
                  href="#how-it-works"
                  className="px-7 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                  Explore the System
                </a>

              </div>

              <div className="flex items-center gap-6 text-xs font-mono text-slate-500">

                <span>
                  ● LOCAL PROCESSING
                </span>

                <span>
                  ● OPEN SOURCE
                </span>

                <span>
                  ● PRIVACY FIRST
                </span>

              </div>

            </div>

            {/* HERO VISUAL */}

            <div className="relative">

              {/* floating card */}

              <div className="absolute -top-8 -left-8 z-20 cyber-float hidden sm:block">

                <div className="bg-[#07101f]/90 backdrop-blur-xl border border-blue-400/20 rounded-xl p-4 w-48 shadow-2xl">

                  <div className="text-[10px] text-slate-500 font-mono mb-2">
                    SIGNAL DETECTED
                  </div>

                  <div className="text-sm font-bold text-blue-300">
                    PERSONALIZATION
                  </div>

                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-blue-400"
                      style={{
                        width: '78%',
                      }}
                    />

                  </div>

                  <div className="text-[10px] text-slate-500 mt-2">
                    confidence: 78.4%
                  </div>

                </div>

              </div>

              {/* main HUD */}

              <div className="relative bg-[#060d1c]/90 backdrop-blur-xl border border-blue-400/20 rounded-2xl overflow-hidden shadow-2xl cyber-border">

                {/* top bar */}

                <div className="h-12 px-4 border-b border-white/5 flex items-center justify-between bg-white/[.02]">

                  <div className="flex items-center gap-2">

                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="w-2 h-2 rounded-full bg-green-400" />

                  </div>

                  <div className="text-[10px] font-mono text-slate-500">
                    ALGORITHM_MONITOR.exe
                  </div>

                  <div className="text-[10px] font-mono text-green-400">
                    ONLINE
                  </div>

                </div>

                {/* fake feed */}

                <div className="p-5 space-y-4 relative">

                  {/* scanning beam */}

                  <div className="absolute left-0 right-0 top-0 h-20 bg-gradient-to-b from-blue-400/0 via-blue-400/10 to-blue-400/0 pointer-events-none cyber-scan" />

                  <div className="text-[10px] font-mono text-slate-500">
                    LIVE FEED ANALYSIS
                  </div>

                  <div className="bg-[#0a1426] border border-white/5 rounded-xl p-4">

                    <div className="flex justify-between mb-3">

                      <span className="text-xs text-blue-300 font-mono">
                        CONTENT NODE #A17
                      </span>

                      <span className="text-[10px] text-green-400">
                        ANALYZED
                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">

                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
                        style={{
                          width: `${scanProgress}%`,
                        }}
                      />

                    </div>

                    <div className="flex justify-between mt-3 text-[10px] font-mono text-slate-500">

                      <span>
                        {analyzing
                          ? 'SCANNING CONTENT...'
                          : 'ANALYSIS COMPLETE'}
                      </span>

                      <span>
                        {scanProgress}%
                      </span>

                    </div>

                  </div>

                  {/* analysis results */}

                  <div className="grid grid-cols-2 gap-3">

                    <div className="bg-[#0a1426] border border-white/5 rounded-xl p-4">

                      <div className="text-[10px] text-slate-500 font-mono">
                        CATEGORY
                      </div>

                      <div className="mt-2 text-lg font-bold">
                        Technology
                      </div>

                      <div className="text-[10px] text-blue-300 mt-1">
                        confidence 94%
                      </div>

                    </div>

                    <div className="bg-[#0a1426] border border-white/5 rounded-xl p-4">

                      <div className="text-[10px] text-slate-500 font-mono">
                        BIAS SIGNAL
                      </div>

                      <div className="mt-2 text-lg font-bold text-yellow-300">
                        Moderate
                      </div>

                      <div className="text-[10px] text-slate-500 mt-1">
                        perspective diversity ↓
                      </div>

                    </div>

                  </div>

                  {/* echo meter */}

                  <div className="bg-[#0a1426] border border-white/5 rounded-xl p-4">

                    <div className="flex justify-between">

                      <span className="text-[10px] font-mono text-slate-500">
                        ECHO CHAMBER INDEX
                      </span>

                      <span className="text-sm font-bold text-blue-300">
                        {echoScore}%
                      </span>

                    </div>

                    <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">

                      <div
                        className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-700"
                        style={{
                          width: `${echoScore}%`,
                        }}
                      />

                    </div>

                    <div className="flex justify-between mt-2 text-[9px] text-slate-600 font-mono">

                      <span>DIVERSE</span>
                      <span>FILTER BUBBLE</span>

                    </div>

                  </div>

                  {/* data stream */}

                  <div className="h-5 overflow-hidden relative border-t border-white/5">

                    <div className="absolute whitespace-nowrap text-[9px] font-mono text-blue-400/40 cyber-data-line">

                      01010110 → NODE_07 → TOPIC_CLUSTER → RANKING_ENGINE → USER_PROFILE → 01011010

                    </div>

                  </div>

                </div>

              </div>

              {/* bottom floating card */}

              <div className="absolute -bottom-7 -right-7 z-20 cyber-float hidden sm:block">

                <div className="bg-[#07101f]/95 backdrop-blur-xl border border-purple-400/20 rounded-xl p-4 shadow-2xl">

                  <div className="text-[9px] font-mono text-slate-500">
                    NEW PERSPECTIVE
                  </div>

                  <div className="text-sm font-bold text-purple-300 mt-1">
                    DETECTED ↓
                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            WHY THIS MATTERS
        =================================================== */}

        <section className="py-28 px-6 lg:px-10 bg-[#060b18]">

          <div className="max-w-[1280px] mx-auto">

            <div className="max-w-2xl mb-16">

              <div className="text-blue-400 font-mono text-xs mb-4">
                // SYSTEM PURPOSE
              </div>

              <h2 className="text-4xl md:text-5xl font-black">
                The algorithm
                <span className="text-blue-400">
                  {" "}is invisible.
                </span>
                <br />
                Its impact isn't.
              </h2>

              <p className="text-slate-400 mt-5 leading-relaxed">
                Modern feeds continuously learn what keeps you
                engaged. We turn that invisible process into
                something you can actually see.
              </p>

            </div>

            <div className="grid md:grid-cols-3 gap-5">

              {[
                {
                  number: '01',
                  title: 'Echo Chambers',
                  text: 'See whether your feed keeps reinforcing the same ideas or introduces genuinely different perspectives.',
                  icon: '◉',
                },
                {
                  number: '02',
                  title: 'Personalization',
                  text: 'Understand how recommendation systems construct a digital profile around your interests and behaviour.',
                  icon: '◇',
                },
                {
                  number: '03',
                  title: 'Digital Awareness',
                  text: 'Develop intuition about how algorithms rank, filter and prioritize the information you consume.',
                  icon: '△',
                },
              ].map((item) => (

                <div
                  key={item.number}
                  className="cyber-card bg-[#081020] border border-white/5 rounded-2xl p-7"
                >

                  <div className="flex justify-between items-start">

                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-300 text-xl">
                      {item.icon}
                    </div>

                    <span className="font-mono text-xs text-slate-700">
                      {item.number}
                    </span>

                  </div>

                  <h3 className="text-xl font-bold mt-7">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                    {item.text}
                  </p>

                  <div className="mt-6 h-px bg-gradient-to-r from-blue-500/40 to-transparent" />

                  <div className="mt-4 text-[10px] font-mono text-blue-400/60">
                    SYSTEM MODULE ACTIVE
                  </div>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section
          id="how-it-works"
          className="py-28 px-6 lg:px-10 relative overflow-hidden"
        >

          <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

          <div className="relative max-w-[1280px] mx-auto">

            <div className="text-center mb-20">

              <div className="text-blue-400 font-mono text-xs mb-4">
                // OPERATION SEQUENCE
              </div>

              <h2 className="text-4xl md:text-5xl font-black">
                From browsing
                <span className="text-blue-400">
                  {" "}to awareness.
                </span>
              </h2>

            </div>

            <div className="relative grid md:grid-cols-5 gap-8">

              <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-500/20 via-blue-400 to-purple-500/20" />

              {[
                ['01', 'DOWNLOAD', 'Install the browser extension.'],
                ['02', 'CONNECT', 'Create your personal account.'],
                ['03', 'BROWSE', 'Continue using the web normally.'],
                ['04', 'ANALYZE', 'Your recommendation patterns are revealed.'],
                ['05', 'DISCOVER', 'Use insights to break your bubble.'],
              ].map(([number, title, description], index) => (

                <div
                  key={number}
                  className="relative z-10 text-center"
                >

                  <div className={`mx-auto w-16 h-16 rounded-full bg-[#081020] border ${
                    index === 0
                      ? 'border-blue-400'
                      : 'border-white/10'
                  } flex items-center justify-center font-mono text-blue-300 shadow-xl`}
                  >
                    {number}
                  </div>

                  <h3 className="mt-5 font-bold text-sm tracking-wider">
                    {title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    {description}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* ===================================================
            FEATURES
        =================================================== */}

        <section
          id="features"
          className="py-28 px-6 lg:px-10 bg-[#060b18]"
        >

          <div className="max-w-[1280px] mx-auto">

            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-14">

              <div>

                <div className="text-blue-400 font-mono text-xs mb-4">
                  // SYSTEM CAPABILITIES
                </div>

                <h2 className="text-4xl md:text-5xl font-black">
                  Tools for a
                  <span className="text-purple-400">
                    {" "}clearer web.
                  </span>
                </h2>

              </div>

              <div className="font-mono text-xs text-slate-600">
                BUILD: 2026.08
              </div>

            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

              {[
                ['01', 'Feed Diversity Score', 'Measure how varied the content entering your information environment actually is.'],
                ['02', 'Personal Dashboard', 'Track algorithmic patterns across multiple sessions and observe changes over time.'],
                ['03', 'Browsing Reflections', 'Turn raw recommendation patterns into understandable reflections about your digital diet.'],
                ['04', 'Weekly Progress', 'Monitor your journey toward a more diverse and intentional information environment.'],
                ['05', 'Privacy First', 'Keep sensitive browsing analysis under your control with privacy-focused architecture.'],
                ['06', 'Educational Insights', 'Learn what recommendation systems are doing instead of treating them like magic.'],
              ].map(([number, title, description]) => (

                <div
                  key={number}
                  className="cyber-card group bg-[#081020] border border-white/5 rounded-xl p-6"
                >

                  <div className="flex justify-between">

                    <div className="text-2xl text-blue-400">
                      ⟡
                    </div>

                    <span className="font-mono text-[10px] text-slate-700">
                      MODULE_{number}
                    </span>

                  </div>

                  <h3 className="font-bold text-lg mt-6">
                    {title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                    {description}
                  </p>

                  <div className="mt-6 text-[10px] font-mono text-blue-400/50 group-hover:text-blue-300 transition-colors">
                    ACCESS MODULE →
                  </div>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* ===================================================
            PRIVACY
        =================================================== */}

        <section
          id="privacy"
          className="py-28 px-6 lg:px-10"
        >

          <div className="max-w-[1280px] mx-auto">

            <div className="rounded-3xl border border-blue-400/10 bg-[#07101f] overflow-hidden">

              <div className="grid md:grid-cols-2">

                <div className="p-8 md:p-14">

                  <div className="text-blue-400 font-mono text-xs mb-5">
                    // TRUST ARCHITECTURE
                  </div>

                  <h2 className="text-4xl font-black">
                    Transparency
                    <br />
                    <span className="text-blue-400">
                      by design.
                    </span>
                  </h2>

                  <p className="text-slate-400 mt-6 leading-relaxed">
                    The tools used to audit opaque algorithms
                    should not become another opaque system.
                    That's why our architecture is built around
                    transparency and privacy.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-10">

                    <div className="border border-white/5 rounded-xl p-4">

                      <div className="text-green-400 text-lg">
                        ✓
                      </div>

                      <div className="text-sm font-bold mt-2">
                        Privacy First
                      </div>

                      <div className="text-[10px] text-slate-600 mt-1">
                        DATA CONTROL
                      </div>

                    </div>

                    <div className="border border-white/5 rounded-xl p-4">

                      <div className="text-blue-400 text-lg">
                        ◇
                      </div>

                      <div className="text-sm font-bold mt-2">
                        Open Source
                      </div>

                      <div className="text-[10px] text-slate-600 mt-1">
                        VERIFIABLE
                      </div>

                    </div>

                  </div>

                </div>

                {/* privacy visualization */}

                <div className="relative min-h-[420px] bg-[#040914] flex items-center justify-center overflow-hidden">

                  <div className="absolute inset-0 cyber-grid opacity-20" />

                  <div className="relative w-72 h-72 rounded-full border border-blue-400/20 flex items-center justify-center">

                    <div className="absolute inset-6 rounded-full border border-blue-400/10" />

                    <div className="absolute inset-14 rounded-full border border-blue-400/20 cyber-pulse" />

                    <div className="text-center z-10">

                      <div className="text-4xl">
                        🔒
                      </div>

                      <div className="text-sm font-bold mt-3">
                        YOUR DEVICE
                      </div>

                      <div className="text-[9px] font-mono text-green-400 mt-2">
                        LOCAL PROCESSING
                      </div>

                    </div>

                    {/* incoming data */}

                    <div className="absolute -left-16 top-24 text-[9px] font-mono text-blue-400">
                      FEED DATA
                    </div>

                    <div className="absolute left-0 top-28 w-20 h-px bg-blue-400/30 overflow-hidden">

                      <div className="w-10 h-full bg-blue-400 cyber-data-line" />

                    </div>

                    {/* blocked external server */}

                    <div className="absolute -right-20 top-24 text-[9px] font-mono text-red-400/60">
                      EXTERNAL
                    </div>

                    <div className="absolute right-0 top-28 w-20 h-px bg-red-400/20">

                      <div className="absolute right-0 -top-2 text-red-400">
                        ✕
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            CTA
        =================================================== */}

        <section className="relative py-32 px-6 overflow-hidden">

          <div className="absolute inset-0 cyber-grid opacity-20" />

          <div className="relative max-w-[1000px] mx-auto text-center">

            <div className="inline-flex items-center gap-2 text-[10px] font-mono text-blue-400 border border-blue-400/20 bg-blue-500/5 px-3 py-1.5 rounded-full mb-8">

              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 cyber-blink" />

              SYSTEM READY

            </div>

            <h2 className="text-5xl md:text-6xl font-black tracking-tight">

              Your feed is
              <br />

              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-500">
                already watching.
              </span>

            </h2>

            <p className="text-slate-400 max-w-xl mx-auto mt-6 leading-relaxed">
              The question is whether you can see what it's
              doing. Start auditing your digital environment.
            </p>

            <button
              onClick={() =>
                onNavigate('download')
              }
              className="mt-9 px-10 py-4 rounded-xl bg-blue-500 hover:bg-blue-400 font-bold shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
            >
              Deploy the Extension →
            </button>

            <div className="mt-6 text-[10px] font-mono text-slate-600">
              CHROME • FIREFOX • SAFARI
            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-white/5 bg-[#030611] py-10 px-6">

        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between gap-8">

          <div>

            <div className="font-bold tracking-tight">
              THE INVISIBLE
              <span className="text-blue-400">
                {" "}ALGORITHM
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Making invisible recommendation systems visible.
            </p>

            <p className="text-[10px] text-blue-400/70 font-mono mt-4">
              UNESCO YOUTH HACKATHON 2026
            </p>

          </div>

          <div className="flex flex-wrap gap-6 text-xs text-slate-600">

            <a
              href="#privacy"
              className="hover:text-blue-300 transition-colors"
            >
              Privacy
            </a>

            <a
              href="#features"
              className="hover:text-blue-300 transition-colors"
            >
              Features
            </a>

            <button
              onClick={() =>
                onNavigate('download')
              }
              className="hover:text-blue-300 transition-colors"
            >
              Download
            </button>

            <button
              onClick={() =>
                onNavigate(
                  isAuthenticated
                    ? 'dashboard'
                    : 'auth'
                )
              }
              className="hover:text-blue-300 transition-colors"
            >
              {isAuthenticated
                ? 'Dashboard'
                : 'Sign In'}
            </button>

          </div>

        </div>

      </footer>

    </div>
  );
}

