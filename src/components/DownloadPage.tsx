interface DownloadPageProps {
  onNavigate: (page: 'landing' | 'download' | 'auth' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function DownloadPage({ onNavigate, isAuthenticated }: DownloadPageProps) {
  return (
    <div className="font-body-md text-body-md bg-surface-dim text-on-surface min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface-dim/80 backdrop-blur-xl border-b border-white/5 shadow-sm h-20">
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop flex justify-between items-center h-full">
          <div className="font-headline-md text-headline-md tracking-tighter text-on-surface cursor-pointer" onClick={() => onNavigate('landing')}>
            The Invisible Algorithm
          </div>
          <div className="hidden md:flex items-center gap-stack-lg">
            <span className="text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md cursor-pointer" onClick={() => onNavigate('landing')}>
              Home
            </span>
            <span className="text-primary font-semibold border-b-2 border-primary pb-1 font-label-md text-label-md cursor-pointer">
              Download
            </span>
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

      <main className="pt-24 pb-16">
        {/* Header Hero Section */}
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop text-center py-16 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm border border-primary/20">
            Official Extensions
          </span>
          <h1 className="font-display-lg text-4xl md:text-5xl tracking-tight text-white font-bold">
            Get The Invisible Algorithm
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Start visualizing and auditing the patterns shaping your web experiences. Choose your browser store below to begin your audit.
          </p>
        </div>

        {/* Browser Grid */}
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg mb-20">
          {/* Chrome Card */}
          <div className="glass p-stack-lg rounded-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden group border border-white/5 hover:border-primary/30 transition-all">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/20 text-[10px] text-primary font-bold">
              Recommended
            </div>
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined text-4xl" data-icon="circle_notifications">language</span>
            </div>
            <h3 className="font-headline-md text-xl text-white">Google Chrome</h3>
            <p className="text-xs text-on-surface-variant">Version 1.0.4 • 2.4 MB</p>
            <p className="text-sm text-on-surface-variant flex-grow">
              Full background analysis, instant notification alerts, and full dashboard syncing.
            </p>
            <button className="w-full bg-primary text-on-primary-container py-3 rounded-xl font-semibold hover:brightness-110 active:scale-95 transition-all cursor-pointer">
              Add to Chrome
            </button>
          </div>

          {/* Firefox Card */}
          <div className="glass p-stack-lg rounded-2xl flex flex-col items-center text-center space-y-4 border border-white/5 hover:border-primary/30 transition-all group">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary mb-2">
              <span className="material-symbols-outlined text-4xl" data-icon="open_in_browser">explore</span>
            </div>
            <h3 className="font-headline-md text-xl text-white">Mozilla Firefox</h3>
            <p className="text-xs text-on-surface-variant">Version 1.0.4 • 2.1 MB</p>
            <p className="text-sm text-on-surface-variant flex-grow">
              Fully sandboxed execution with high-grade safety compliance and manual controls.
            </p>
            <button className="w-full bg-surface-container-highest text-white border border-white/10 py-3 rounded-xl font-semibold hover:bg-white/5 active:scale-95 transition-all cursor-pointer">
              Get Firefox Add-on
            </button>
          </div>

          {/* Safari Card */}
          <div className="glass p-stack-lg rounded-2xl flex flex-col items-center text-center space-y-4 border border-white/5 hover:border-primary/30 transition-all group">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary mb-2">
              <span className="material-symbols-outlined text-4xl" data-icon="devices">nest_eco_thermostat</span>
            </div>
            <h3 className="font-headline-md text-xl text-white">Apple Safari</h3>
            <p className="text-xs text-on-surface-variant">Version 1.0.4 • 3.0 MB</p>
            <p className="text-sm text-on-surface-variant flex-grow">
              Optimized performance for Mac, minimal battery impact, native system layout.
            </p>
            <button className="w-full bg-surface-container-highest text-white border border-white/10 py-3 rounded-xl font-semibold hover:bg-white/5 active:scale-95 transition-all cursor-pointer">
              Install Safari Ext.
            </button>
          </div>

          {/* Brave Card */}
          <div className="glass p-stack-lg rounded-2xl flex flex-col items-center text-center space-y-4 border border-white/5 hover:border-primary/30 transition-all group">
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-error mb-2">
              <span className="material-symbols-outlined text-4xl" data-icon="shield">security</span>
            </div>
            <h3 className="font-headline-md text-xl text-white">Brave Browser</h3>
            <p className="text-xs text-on-surface-variant">Version 1.0.4 • 2.4 MB</p>
            <p className="text-sm text-on-surface-variant flex-grow">
              Native ad-blocker compliance and integrated shield defense mechanisms.
            </p>
            <button className="w-full bg-surface-container-highest text-white border border-white/10 py-3 rounded-xl font-semibold hover:bg-white/5 active:scale-95 transition-all cursor-pointer">
              Add to Brave
            </button>
          </div>
        </div>

        {/* Developer / Manual Load Section */}
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop mb-20">
          <div className="glass rounded-3xl p-8 md:p-12 border border-white/10 grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm border border-secondary/20">
                Developers & Testers
              </span>
              <h2 className="font-headline-lg text-2xl md:text-3xl text-white">
                Load Unpacked (Developer Mode)
              </h2>
              <p className="text-on-surface-variant">
                If you are a developer, auditor, or hackathon tester, you can install the extension locally to monitor the API routing and security hooks instantly.
              </p>
              
              {/* Instructions Steps */}
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-white">Download the Extension Bundle</h4>
                    <p className="text-sm text-on-surface-variant">Download our zip archive and extract the directory contents locally on your computer.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-white">Enable Developer Mode</h4>
                    <p className="text-sm text-on-surface-variant">Open your browser to <code className="bg-surface p-1 rounded font-mono text-xs text-secondary">chrome://extensions</code> and toggle Developer Mode in the top right.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-white">Load Unpacked Folder</h4>
                    <p className="text-sm text-on-surface-variant">Click &quot;Load unpacked&quot; in the top-left and select the extracted folder of the extension bundle.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <button className="bg-secondary text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined" data-icon="folder_zip">folder_zip</span>
                  Download .ZIP Bundle
                </button>
                <a href="https://github.com/invisible-algorithm" target="_blank" rel="noreferrer" className="border border-white/10 px-6 py-3 rounded-xl hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined" data-icon="source">code</span>
                  View GitHub Repo
                </a>
              </div>
            </div>

            {/* Graphic Illustration box */}
            <div className="bg-surface-container rounded-2xl h-80 flex flex-col justify-center p-6 space-y-4 border border-white/5 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-primary" data-icon="extension">extension</span>
                  <span className="font-bold text-white text-sm">Chrome Extensions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-on-surface-variant">Developer Mode</span>
                  <div className="w-8 h-4 rounded-full bg-primary p-0.5 flex justify-end">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-surface border border-white/10 shadow-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined" data-icon="search_insights">insights</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">The Invisible Algorithm</h4>
                  <p className="text-[10px] text-on-surface-variant">ID: jfclgeigajfceidmdhbfklgep</p>
                  <p className="text-[10px] text-primary">Unpacked from local folder</p>
                </div>
              </div>
              {/* background flow decor */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/15 rounded-full blur-[40px] pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Post-Installation Guide */}
        <div className="max-w-[1280px] mx-auto px-container-padding-desktop">
          <div className="text-center mb-12">
            <h2 className="font-headline-lg text-2xl md:text-3xl text-white">Post-Installation Guide</h2>
            <p className="text-on-surface-variant text-sm max-w-lg mx-auto">Get configured and started with your transparency audit in less than three minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
            <div className="text-center space-y-2 p-6 glass rounded-2xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20">
                <span className="material-symbols-outlined" data-icon="push_pin">push_pin</span>
              </div>
              <h3 className="font-bold text-white">1. Pin the Icon</h3>
              <p className="text-sm text-on-surface-variant">Click the extension puzzle piece icon in Chrome and click the pin icon next to our logo.</p>
            </div>
            <div 
              onClick={() => onNavigate('auth')}
              className="text-center space-y-2 p-6 glass rounded-2xl cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20">
                <span className="material-symbols-outlined" data-icon="login">key</span>
              </div>
              <h3 className="font-bold text-white">2. Sign In to Sync</h3>
              <p className="text-sm text-on-surface-variant">Click our pinned icon, choose Sign In, and log in to connect your dashboard analytics seamlessly.</p>
            </div>
            <div className="text-center space-y-2 p-6 glass rounded-2xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20">
                <span className="material-symbols-outlined" data-icon="timeline">visibility</span>
              </div>
              <h3 className="font-bold text-white">3. Browse & Audit</h3>
              <p className="text-sm text-on-surface-variant">Go to your normal social media sites. Our extension will silently compile feed summaries and populate your dashboard.</p>
            </div>
          </div>
        </div>
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
            <span className="font-label-sm text-label-sm text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
