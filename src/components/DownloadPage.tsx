
import React from 'react';

interface DownloadPageProps {
  onNavigate: (
    page: 'landing' | 'download' | 'auth' | 'dashboard'
  ) => void;
  isAuthenticated: boolean;
}

export default function DownloadPage({
  onNavigate,
  isAuthenticated,
}: DownloadPageProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white overflow-hidden">

      {/* =====================================================
          ANIMATIONS + GLOBAL VISUALS
      ===================================================== */}

      <style>{`
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-14px);
          }
        }

        @keyframes floatReverse {
          0%, 100% {
            transform: translateY(-5px);
          }
          50% {
            transform: translateY(12px);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: .25;
            transform: scale(1);
          }
          50% {
            opacity: .55;
            transform: scale(1.08);
          }
        }

        @keyframes scanLine {
          0% {
            top: -10%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 110%;
            opacity: 0;
          }
        }

        @keyframes progressLoad {
          0% {
            width: 15%;
          }
          50% {
            width: 82%;
          }
          100% {
            width: 55%;
          }
        }

        @keyframes signalPulse {
          0%, 100% {
            opacity: .35;
            box-shadow: 0 0 0 rgba(174, 188, 255, 0);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 18px rgba(174, 188, 255, .35);
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(145px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(145px) rotate(-360deg);
          }
        }

        .float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }

        .float-reverse {
          animation: floatReverse 7s ease-in-out infinite;
        }

        .glow-pulse {
          animation: pulseGlow 6s ease-in-out infinite;
        }

        .scan-line {
          animation: scanLine 4s linear infinite;
        }

        .loading-bar {
          animation: progressLoad 4s ease-in-out infinite;
        }

        .signal-pulse {
          animation: signalPulse 2.5s ease-in-out infinite;
        }

        .orbit-dot {
          animation: orbit 8s linear infinite;
        }

        .hero-grid {
          background-image:
            linear-gradient(
              rgba(255,255,255,.028) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,.028) 1px,
              transparent 1px
            );
          background-size: 44px 44px;
        }

        .noise {
          background-image:
            radial-gradient(
              rgba(255,255,255,.08) 1px,
              transparent 1px
            );
          background-size: 22px 22px;
        }
      `}</style>


      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="fixed inset-0 pointer-events-none">

        <div className="absolute inset-0 hero-grid opacity-40" />

        <div className="glow-pulse absolute -top-[350px] left-[15%] w-[750px] h-[750px] rounded-full bg-[#8294ff]/[0.09] blur-[160px]" />

        <div className="glow-pulse absolute top-[35%] -right-[350px] w-[700px] h-[700px] rounded-full bg-[#596cff]/[0.06] blur-[150px]" />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070B14]/10 to-[#070B14]" />

      </div>


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="relative z-50 h-[78px] border-b border-white/[0.06] bg-[#070B14]/65 backdrop-blur-2xl">

        <div className="max-w-[1280px] mx-auto h-full px-5 md:px-8 flex items-center justify-between">

          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group"
          >

            <div className="relative w-9 h-9 rounded-xl bg-[#aebcff]/10 border border-[#aebcff]/15 flex items-center justify-center overflow-hidden">

              <div className="absolute inset-0 bg-[#aebcff]/10 blur-md" />

              <span className="relative text-[#aebcff] text-sm">
                ◈
              </span>

            </div>

            <div className="text-left">

              <div className="text-sm font-semibold tracking-tight">
                Invisible Algorithm
              </div>

              <div className="text-[8px] uppercase tracking-[0.24em] text-white/25">
                See beyond your feed
              </div>

            </div>

          </button>


          <div className="hidden md:flex items-center gap-8">

            <button
              onClick={() => onNavigate('landing')}
              className="text-[10px] uppercase tracking-[0.18em] text-white/35 hover:text-white transition-colors"
            >
              Home
            </button>

            <span className="text-[10px] uppercase tracking-[0.18em] text-[#aebcff]">
              Download
            </span>

            {isAuthenticated ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-[10px] uppercase tracking-[0.18em] text-white/35 hover:text-white transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="text-[10px] uppercase tracking-[0.18em] text-white/35 hover:text-white transition-colors"
              >
                Sign In
              </button>
            )}

          </div>


          <button
            onClick={() => scrollTo('download')}
            className="group h-10 px-5 rounded-xl bg-[#aebcff] text-[#080D18] text-[10px] font-bold flex items-center gap-2 hover:brightness-110 hover:shadow-[0_0_30px_rgba(174,188,255,.2)] active:scale-95 transition-all"
          >
            Install extension
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>

        </div>

      </nav>


      {/* =====================================================
          HERO
      ===================================================== */}

      <main className="relative z-10">

        <section className="relative max-w-[1280px] mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-24">

          <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-16 items-center">

            {/* LEFT */}

            <div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#aebcff]/15 bg-[#aebcff]/[0.05] mb-7">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]" />

                <span className="text-[8px] uppercase tracking-[0.22em] text-[#aebcff]/70">
                  Extension ready to explore
                </span>

              </div>


              <h1 className="text-[52px] md:text-[68px] xl:text-[82px] font-bold tracking-[-0.065em] leading-[.9]">

                See what your
                <br />

                <span className="relative inline-block">

                  <span className="relative z-10 text-[#aebcff]">
                    feed is hiding.
                  </span>

                  <span className="absolute left-0 right-0 bottom-[-5px] h-[2px] bg-[#aebcff]/40 blur-[1px]" />

                </span>

              </h1>


              <p className="mt-8 text-sm md:text-base leading-7 text-white/38 max-w-[520px]">

                Your feed isn't random. Install Invisible Algorithm
                and uncover the patterns, categories, and signals
                shaping what you see every day.

              </p>


              {/* CTA */}

              <div id="download" className="flex flex-wrap items-center gap-3 mt-9">

                <button
                  onClick={() => scrollTo('browsers')}
                  className="group relative h-13 px-7 rounded-2xl bg-[#aebcff] text-[#080D18] text-xs font-bold flex items-center gap-3 overflow-hidden hover:brightness-110 hover:shadow-[0_0_45px_rgba(174,188,255,.25)] active:scale-[.97] transition-all"
                >

                  <span className="relative z-10">
                    Add to Chrome — It's Free
                  </span>

                  <span className="relative z-10 text-sm group-hover:translate-x-1 transition-transform">
                    →
                  </span>

                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />

                </button>


                <button
                  onClick={() => scrollTo('discover')}
                  className="h-13 px-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] text-white/55 text-xs hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  See how it works
                </button>

              </div>


              <div className="flex items-center gap-6 mt-7">

                <MiniTrust text="Free" />
                <MiniTrust text="Privacy focused" />
                <MiniTrust text="No feed blocking" />

              </div>

            </div>


            {/* RIGHT — HERO VISUAL */}

            <div className="relative min-h-[540px] flex items-center justify-center">

              {/* Glow */}

              <div className="absolute w-[430px] h-[430px] rounded-full bg-[#8294ff]/[0.08] blur-[90px]" />


              {/* Orbiting signal */}

              <div className="absolute w-[290px] h-[290px] rounded-full border border-[#aebcff]/[0.07]" />

              <div className="absolute w-[390px] h-[390px] rounded-full border border-[#aebcff]/[0.045]" />


              {/* Floating labels */}

              <FloatingSignal
                className="absolute top-[7%] right-[5%]"
                label="RECOMMENDATION"
                value="87%"
              />

              <FloatingSignal
                className="absolute bottom-[10%] left-[0%]"
                label="BUBBLE SCORE"
                value="68"
              />

              <FloatingSignal
                className="absolute top-[35%] right-[-3%]"
                label="PATTERN FOUND"
                value="03"
              />


              {/* Main browser */}

              <div className="relative z-10 w-full max-w-[500px] float-slow">

                <div className="absolute -inset-5 bg-[#8b9aff]/[0.07] blur-[50px]" />

                <div className="relative rounded-[28px] border border-white/[0.1] bg-[#0B1423]/95 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,.6)] overflow-hidden">

                  {/* Browser header */}

                  <div className="h-11 px-5 border-b border-white/[0.06] flex items-center gap-2">

                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />

                    <div className="ml-4 flex-1 h-6 rounded-lg border border-white/[0.05] bg-white/[0.025] flex items-center px-3">

                      <span className="text-[7px] text-white/15 font-mono">
                        instagram.com/reels
                      </span>

                    </div>

                    <div className="w-6 h-6 rounded-md bg-[#aebcff]/10 flex items-center justify-center text-[#aebcff] text-[9px]">
                      ◈
                    </div>

                  </div>


                  {/* Feed */}

                  <div className="relative p-5">

                    {/* Scan */}

                    <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#aebcff] to-transparent blur-[1px] scan-line z-20" />


                    <div className="flex gap-4">

                      {/* Fake social feed */}

                      <div className="flex-1 space-y-3">

                        <div className="flex items-center gap-2 mb-4">

                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#aebcff]/50 to-purple-400/30" />

                          <div>
                            <div className="w-20 h-2 rounded bg-white/10" />
                            <div className="w-12 h-1.5 rounded bg-white/5 mt-1.5" />
                          </div>

                        </div>


                        <div className="h-[145px] rounded-xl bg-gradient-to-br from-purple-500/20 via-[#aebcff]/10 to-blue-500/10 border border-white/[0.06] relative overflow-hidden">

                          <div className="absolute inset-0 noise opacity-10" />

                          <div className="absolute bottom-4 left-4">

                            <div className="w-28 h-2 rounded bg-white/20" />

                            <div className="w-20 h-1.5 rounded bg-white/10 mt-2" />

                          </div>

                        </div>


                        <div className="flex gap-2">

                          <div className="w-6 h-6 rounded-full border border-white/10" />

                          <div className="w-6 h-6 rounded-full border border-white/10" />

                          <div className="w-6 h-6 rounded-full border border-white/10" />

                          <div className="ml-auto w-14 h-5 rounded bg-white/[0.04]" />

                        </div>


                        <div className="h-[80px] rounded-xl bg-gradient-to-br from-orange-400/10 to-pink-500/10 border border-white/[0.05]" />

                      </div>


                      {/* Analysis panel */}

                      <div className="w-[145px] rounded-2xl border border-[#aebcff]/10 bg-[#aebcff]/[0.035] p-3">

                        <div className="flex items-center gap-2 mb-4">

                          <div className="w-2 h-2 rounded-full bg-emerald-400 signal-pulse" />

                          <span className="text-[7px] uppercase tracking-[0.15em] text-white/30">
                            analyzing
                          </span>

                        </div>


                        <div className="text-[8px] uppercase tracking-[0.12em] text-white/20 mb-3">
                          Feed composition
                        </div>


                        <AnalysisBar
                          label="Technology"
                          value="62%"
                          width="62%"
                        />

                        <AnalysisBar
                          label="Entertainment"
                          value="24%"
                          width="24%"
                        />

                        <AnalysisBar
                          label="Lifestyle"
                          value="09%"
                          width="9%"
                        />

                        <AnalysisBar
                          label="Other"
                          value="05%"
                          width="5%"
                        />


                        <div className="mt-5 pt-4 border-t border-white/[0.06]">

                          <div className="text-[7px] uppercase tracking-[0.12em] text-white/20">
                            Algorithm signal
                          </div>

                          <div className="flex items-end gap-1 mt-2 h-8">

                            {[35, 55, 42, 72, 60, 88, 76, 94].map(
                              (height, index) => (
                                <div
                                  key={index}
                                  className="flex-1 rounded-t bg-[#aebcff]/40"
                                  style={{ height: `${height}%` }}
                                />
                              )
                            )}

                          </div>

                        </div>

                      </div>

                    </div>


                    {/* Bottom analysis strip */}

                    <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">

                      <div className="flex items-center justify-between mb-2">

                        <span className="text-[7px] uppercase tracking-[0.15em] text-white/20">
                          Mapping your recommendation pattern
                        </span>

                        <span className="text-[7px] font-mono text-[#aebcff]/60">
                          ACTIVE
                        </span>

                      </div>

                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">

                        <div className="loading-bar h-full rounded-full bg-[#aebcff]" />

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            DISCOVERY SECTION
        ===================================================== */}

        <section
          id="discover"
          className="max-w-[1180px] mx-auto px-5 md:px-8 py-24"
        >

          <div className="max-w-2xl mb-12">

            <div className="text-[9px] uppercase tracking-[0.22em] font-mono text-[#aebcff]/55 mb-4">
              What happens after you install
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.055em] leading-tight">
              Turn your feed into
              <span className="text-[#aebcff]"> something you can see.</span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/30">
              Invisible Algorithm doesn't tell you what to watch.
              It shows you why you keep seeing it.
            </p>

          </div>


          <div className="grid md:grid-cols-3 gap-4">

            <DiscoveryCard
              number="01"
              eyebrow="CONTENT MIX"
              title="See what fills your feed."
              description="Understand which topics and categories dominate the content being recommended to you."
              visual="bars"
            />

            <DiscoveryCard
              number="02"
              eyebrow="PATTERNS"
              title="Spot your bubble."
              description="Discover when your recommendations become increasingly concentrated around the same interests."
              visual="circle"
            />

            <DiscoveryCard
              number="03"
              eyebrow="AWARENESS"
              title="Take back the perspective."
              description="The goal isn't to block your feed. It's to make the invisible part visible."
              visual="signal"
            />

          </div>

        </section>


        {/* =====================================================
            BEFORE / AFTER
        ===================================================== */}

        <section className="max-w-[1180px] mx-auto px-5 md:px-8 py-24">

          <div className="rounded-[32px] border border-white/[0.07] bg-white/[0.018] overflow-hidden">

            <div className="grid lg:grid-cols-2">

              {/* LEFT */}

              <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-white/[0.06]">

                <div className="text-[8px] uppercase tracking-[0.2em] text-white/20 mb-5">
                  Before
                </div>

                <h3 className="text-3xl font-bold tracking-[-0.04em]">
                  “Why am I seeing
                  <br />
                  this again?”
                </h3>

                <p className="mt-5 text-sm text-white/25 leading-6 max-w-sm">
                  You scroll. The algorithm learns. The same
                  patterns quietly become your normal.
                </p>


                <div className="mt-9 flex flex-wrap gap-2">

                  {[
                    'Same topics',
                    'Same creators',
                    'Same opinions',
                    'Endless scroll',
                  ].map((item) => (
                    <span
                      key={item}
                      className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[9px] text-white/25"
                    >
                      {item}
                    </span>
                  ))}

                </div>

              </div>


              {/* RIGHT */}

              <div className="p-8 md:p-12 bg-[#aebcff]/[0.025]">

                <div className="text-[8px] uppercase tracking-[0.2em] text-[#aebcff]/50 mb-5">
                  After
                </div>

                <h3 className="text-3xl font-bold tracking-[-0.04em]">
                  “Oh.
                  <br />
                  <span className="text-[#aebcff]">
                    That's why.
                  </span>”
                </h3>

                <p className="mt-5 text-sm text-white/30 leading-6 max-w-sm">
                  Your feed becomes a map. You can finally see
                  the patterns that were invisible while you were
                  scrolling.
                </p>


                <div className="mt-9 flex items-center gap-3">

                  <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">

                    <div className="w-[68%] h-full bg-[#aebcff]/60 rounded-full" />

                  </div>

                  <span className="text-[9px] font-mono text-[#aebcff]">
                    68 / 100
                  </span>

                </div>

                <div className="text-[8px] text-white/20 mt-2">
                  information bubble score

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            BROWSER DOWNLOAD
        ===================================================== */}

        <section
          id="browsers"
          className="max-w-[1180px] mx-auto px-5 md:px-8 py-24"
        >

          <div className="text-center max-w-2xl mx-auto mb-12">

            <div className="text-[9px] uppercase tracking-[0.22em] font-mono text-[#aebcff]/55 mb-4">
              Choose your browser
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.055em]">
              Ready to see
              <br />
              <span className="text-[#aebcff]">
                what's behind the screen?
              </span>
            </h2>

            <p className="mt-5 text-sm text-white/30">
              Install the extension. Browse normally. Let the
              algorithm reveal itself.
            </p>

          </div>


          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <BrowserDownload
              name="Chrome"
              icon="◉"
              version="v1.0.4"
              primary
            />

            <BrowserDownload
              name="Firefox"
              icon="◈"
              version="v1.0.4"
            />

            <BrowserDownload
              name="Safari"
              icon="✦"
              version="v1.0.4"
            />

            <BrowserDownload
              name="Brave"
              icon="◇"
              version="v1.0.4"
            />

          </div>


          <div className="flex justify-center mt-7">

            <div className="flex items-center gap-2 text-[8px] text-white/20">

              <span className="text-emerald-400">✓</span>
              No account required to install
              <span className="text-white/10">•</span>
              Free forever

            </div>

          </div>

        </section>


        {/* =====================================================
            PRIVACY
        ===================================================== */}

        <section className="max-w-[900px] mx-auto px-5 md:px-8 py-20">

          <div className="relative rounded-[30px] border border-[#aebcff]/10 bg-[#aebcff]/[0.025] p-8 md:p-12 text-center overflow-hidden">

            <div className="absolute w-[300px] h-[300px] bg-[#aebcff]/[0.07] blur-[90px] rounded-full -top-[180px] left-1/2 -translate-x-1/2" />

            <div className="relative">

              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#aebcff]/10 border border-[#aebcff]/15 flex items-center justify-center text-[#aebcff] text-lg">
                ◇
              </div>

              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-[-0.045em]">
                Your awareness.
                <br />
                <span className="text-[#aebcff]">
                  Your data.
                </span>
              </h2>

              <p className="max-w-lg mx-auto mt-5 text-sm text-white/30 leading-7">
                Invisible Algorithm is designed for awareness,
                not control. We don't block your feed or tell you
                what to consume.
              </p>


              <div className="flex flex-wrap justify-center gap-3 mt-7">

                <PrivacyPill text="No feed blocking" />
                <PrivacyPill text="Transparent analysis" />
                <PrivacyPill text="Built for awareness" />

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            DEVELOPER INSTALL
        ===================================================== */}

        <section
          id="developer"
          className="max-w-[1180px] mx-auto px-5 md:px-8 py-24"
        >

          <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5">

            <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.018] p-8 md:p-10">

              <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#aebcff]/50 mb-4">
                For developers
              </div>

              <h2 className="text-3xl font-bold tracking-[-0.045em]">
                Want to look
                <br />
                under the hood?
              </h2>

              <p className="mt-5 text-sm text-white/25 leading-6">
                Load the extension locally using Chrome's
                Developer Mode.
              </p>


              <div className="mt-8 space-y-5">

                <DevStep
                  number="01"
                  title="Download the ZIP"
                  description="Get the extension bundle and extract it."
                />

                <DevStep
                  number="02"
                  title="Open Developer Mode"
                  description="Go to chrome://extensions and enable Developer Mode."
                />

                <DevStep
                  number="03"
                  title="Load unpacked"
                  description="Select the extracted Invisible Algorithm folder."
                />

              </div>


              <div className="flex gap-3 mt-8">

                <button className="h-10 px-5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[10px] text-white/55 hover:text-white hover:bg-white/[0.08] transition-all">
                  ↓ Download ZIP
                </button>

                <a
                  href="https://github.com/invisible-algorithm"
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 px-5 rounded-xl border border-white/[0.07] flex items-center text-[10px] text-white/35 hover:text-white transition-all"
                >
                  GitHub →
                </a>

              </div>

            </div>


            <div className="rounded-[28px] border border-white/[0.07] bg-[#050912] p-6 md:p-8 font-mono overflow-hidden">

              <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">

                <div className="flex gap-2">

                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />

                </div>

                <span className="text-[7px] uppercase tracking-[0.2em] text-white/15">
                  invisible-algorithm
                </span>

              </div>


              <div className="mt-7 text-[10px] leading-8">

                <div className="text-white/25">
                  <span className="text-[#aebcff]">$</span>{' '}
                  unzip invisible-algorithm.zip
                </div>

                <div className="text-white/25">
                  <span className="text-[#aebcff]">$</span>{' '}
                  cd invisible-algorithm
                </div>

                <div className="mt-4 text-emerald-300/60">
                  ✓ manifest.json detected
                </div>

                <div className="text-emerald-300/60">
                  ✓ content scripts detected
                </div>

                <div className="text-emerald-300/60">
                  ✓ extension bundle ready
                </div>

                <div className="mt-4 text-white/15">
                  waiting for browser...
                </div>

                <div className="text-[#aebcff]/50">
                  &gt; load unpacked extension
                </div>

              </div>


              <div className="mt-8 rounded-xl border border-[#aebcff]/10 bg-[#aebcff]/[0.025] p-4">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-lg bg-[#aebcff]/10 flex items-center justify-center text-[#aebcff]">
                    ◈
                  </div>

                  <div>

                    <div className="text-[9px] font-sans font-semibold text-white/70">
                      Invisible Algorithm
                    </div>

                    <div className="text-[7px] font-sans text-white/20 mt-1">
                      Unpacked extension
                    </div>

                  </div>

                  <div className="ml-auto flex items-center gap-2">

                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                    <span className="text-[7px] text-emerald-300/60">
                      READY
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="max-w-[1000px] mx-auto px-5 md:px-8 pt-16 pb-32">

          <div className="relative rounded-[34px] border border-[#aebcff]/15 bg-gradient-to-br from-[#aebcff]/[0.08] via-[#aebcff]/[0.025] to-transparent p-10 md:p-16 text-center overflow-hidden">

            <div className="absolute inset-0 hero-grid opacity-20" />

            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#aebcff]/[0.08] blur-[100px] -top-[250px] left-1/2 -translate-x-1/2" />

            <div className="relative">

              <div className="text-[9px] uppercase tracking-[0.25em] text-[#aebcff]/55 font-mono">
                Your feed is already learning
              </div>

              <h2 className="mt-5 text-4xl md:text-6xl font-bold tracking-[-0.06em] leading-[.95]">
                Maybe it's time
                <br />
                <span className="text-[#aebcff]">
                  you learned too.
                </span>
              </h2>

              <p className="max-w-md mx-auto mt-6 text-sm text-white/30 leading-6">
                Install Invisible Algorithm and start seeing
                the patterns behind your recommendations.
              </p>

              <button
                onClick={() => scrollTo('browsers')}
                className="group mt-8 h-13 px-8 rounded-2xl bg-[#aebcff] text-[#080D18] text-xs font-bold inline-flex items-center gap-3 hover:brightness-110 hover:shadow-[0_0_50px_rgba(174,188,255,.25)] active:scale-95 transition-all"
              >
                Install Invisible Algorithm
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="relative z-10 border-t border-white/[0.05]">

        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-5">

          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2"
          >

            <span className="text-[#aebcff]">
              ◈
            </span>

            <span className="text-xs font-semibold">
              Invisible Algorithm
            </span>

          </button>


          <div className="text-[8px] uppercase tracking-[0.18em] text-white/15">
            See beyond your feed
          </div>


          <div className="flex items-center gap-5 text-[9px] text-white/20">

            <button className="hover:text-white/50 transition-colors">
              Privacy
            </button>

            <button className="hover:text-white/50 transition-colors">
              Terms
            </button>

            <button className="hover:text-white/50 transition-colors">
              Contact
            </button>

          </div>

        </div>

      </footer>

    </div>
  );
}


/* =============================================================
   COMPONENTS
============================================================= */

function MiniTrust({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">

      <span className="w-4 h-4 rounded-full bg-[#aebcff]/10 border border-[#aebcff]/10 flex items-center justify-center text-[7px] text-[#aebcff]">
        ✓
      </span>

      <span className="text-[8px] text-white/25">
        {text}
      </span>

    </div>
  );
}


function FloatingSignal({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`${className ?? ''} float-reverse z-20 px-4 py-3 rounded-xl border border-white/[0.08] bg-[#0b1423]/90 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,.3)]`}
    >

      <div className="text-[6px] uppercase tracking-[0.18em] text-white/20">
        {label}
      </div>

      <div className="text-sm font-mono text-[#aebcff] mt-1">
        {value}
      </div>

    </div>
  );
}


function AnalysisBar({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div className="mb-3">

      <div className="flex justify-between mb-1">

        <span className="text-[7px] text-white/25">
          {label}
        </span>

        <span className="text-[7px] font-mono text-white/20">
          {value}
        </span>

      </div>

      <div className="h-1 rounded-full bg-white/[0.05]">

        <div
          className="h-full rounded-full bg-[#aebcff]/50"
          style={{ width }}
        />

      </div>

    </div>
  );
}


function DiscoveryCard({
  number,
  eyebrow,
  title,
  description,
  visual,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  visual: 'bars' | 'circle' | 'signal';
}) {
  return (
    <div className="group relative min-h-[390px] rounded-[28px] border border-white/[0.07] bg-white/[0.018] p-7 overflow-hidden hover:border-[#aebcff]/15 hover:bg-white/[0.025] transition-all duration-500">

      {/* Visual */}

      <div className="h-[170px] flex items-center justify-center mb-7">

        {visual === 'bars' && (
          <div className="flex items-end gap-2 h-32">

            {[35, 60, 48, 82, 67, 94, 74, 55].map(
              (height, index) => (
                <div
                  key={index}
                  className="w-5 rounded-t-md bg-gradient-to-t from-[#aebcff]/15 to-[#aebcff]/60 group-hover:to-[#aebcff] transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
              )
            )}

          </div>
        )}


        {visual === 'circle' && (
          <div className="relative w-32 h-32">

            <div className="absolute inset-0 rounded-full border border-[#aebcff]/10" />

            <div className="absolute inset-3 rounded-full border border-[#aebcff]/20 border-t-[#aebcff]/80 rotate-45" />

            <div className="absolute inset-7 rounded-full bg-[#aebcff]/10 border border-[#aebcff]/20 flex items-center justify-center">

              <span className="text-lg font-bold text-[#aebcff]">
                68
              </span>

            </div>

          </div>
        )}


        {visual === 'signal' && (
          <div className="relative w-40 h-32">

            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="absolute left-0 right-0 h-px bg-[#aebcff]/10"
                style={{ top: `${20 + row * 20}%` }}
              />
            ))}

            <svg
              viewBox="0 0 160 100"
              className="absolute inset-0 w-full h-full"
              fill="none"
            >
              <path
                d="M0 75 C20 70, 22 40, 40 55 S65 82, 80 45 S110 15, 125 35 S145 60, 160 12"
                stroke="rgba(174,188,255,.7)"
                strokeWidth="2"
              />
            </svg>

            <div className="absolute w-2 h-2 rounded-full bg-[#aebcff] shadow-[0_0_15px_rgba(174,188,255,.8)] right-0 top-7" />

          </div>
        )}

      </div>


      <div className="flex items-center justify-between">

        <span className="text-[7px] uppercase tracking-[0.2em] text-[#aebcff]/50">
          {eyebrow}
        </span>

        <span className="text-[8px] font-mono text-white/10">
          {number}
        </span>

      </div>


      <h3 className="text-xl font-semibold tracking-[-0.03em] mt-3">
        {title}
      </h3>

      <p className="text-[10px] leading-5 text-white/25 mt-3">
        {description}
      </p>

    </div>
  );
}


function BrowserDownload({
  name,
  icon,
  version,
  primary,
}: {
  name: string;
  icon: string;
  version: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-[24px] p-6 border transition-all duration-300 ${
        primary
          ? 'border-[#aebcff]/20 bg-[#aebcff]/[0.055] shadow-[0_15px_50px_rgba(174,188,255,.06)]'
          : 'border-white/[0.07] bg-white/[0.018] hover:border-[#aebcff]/15 hover:bg-white/[0.03]'
      }`}
    >

      {primary && (
        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-[#aebcff]/10 border border-[#aebcff]/10 text-[6px] uppercase tracking-[0.15em] text-[#aebcff]">
          Recommended
        </div>
      )}


      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl text-[#aebcff] group-hover:scale-105 transition-transform">
        {icon}
      </div>


      <h3 className="text-sm font-semibold mt-5">
        {name}
      </h3>

      <div className="text-[8px] font-mono text-white/20 mt-2">
        Extension {version}
      </div>


      <button
        className={`w-full h-10 rounded-xl mt-6 text-[9px] font-bold transition-all ${
          primary
            ? 'bg-[#aebcff] text-[#080D18] hover:brightness-110 hover:shadow-[0_0_25px_rgba(174,188,255,.18)]'
            : 'bg-white/[0.035] border border-white/[0.07] text-white/45 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        {primary ? 'Add to Chrome →' : `Get for ${name} →`}
      </button>

    </div>
  );
}


function PrivacyPill({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">

      <span className="text-emerald-400 text-[8px]">
        ✓
      </span>

      <span className="text-[8px] text-white/30">
        {text}
      </span>

    </div>
  );
}


function DevStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">

      <div className="w-7 h-7 shrink-0 rounded-lg bg-[#aebcff]/[0.06] border border-[#aebcff]/10 flex items-center justify-center text-[8px] text-[#aebcff]">
        {number}
      </div>

      <div>

        <div className="text-[10px] font-semibold text-white/70">
          {title}
        </div>

        <div className="text-[9px] text-white/25 mt-1 leading-5">
          {description}
        </div>

      </div>

    </div>
  );
}

