import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#020617] font-sans selection:bg-cyan-500/30">
      
      {/* Background Layer: Deep Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.2] scale-105 transition-transform duration-1000"
          style={{ 
            backgroundImage: `url('/stadium_bg.png')`,
            transform: `translateY(${scrollY * 0.1}px) scale(1.05)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/95 via-transparent to-[#020617]" />
        
        {/* Animated Glow Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-600/20 blur-[100px] md:blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-cyan-400/10 blur-[80px] md:blur-[100px] rounded-full animate-bounce [animation-duration:10s]" />
      </div>

      {/* Glassmorphism Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 py-4 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-md bg-white/5 border-b border-white/10 mt-2 md:mt-4 mx-2 md:mx-4 rounded-xl md:rounded-2xl shadow-xl shadow-black/20">
        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-3 group cursor-pointer">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
             <svg className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg md:text-2xl font-black text-white tracking-tighter italic">STADIUM<span className="text-cyan-400">IQ</span></span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10 justify-center flex-1 pr-12">
          {['Features', 'How It Works', 'Roles', 'News'].map((item) => (
            <a key={item} href="#" className="text-sm font-bold text-gray-400 hover:text-white transition-all tracking-wide relative group overflow-hidden">
              {item}
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            </a>
          ))}
        </div>

        {/* Auth Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-white hover:text-cyan-400 transition-colors uppercase tracking-widest px-4">
            Login
          </Link>
          <Link to="/login" className="relative group overflow-hidden bg-white text-black text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all">
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute inset-0 z-0 bg-white group-hover:opacity-0" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white p-2 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-[#020617]/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-8 md:hidden animate-fade-in">
          {['Features', 'How It Works', 'Roles', 'News'].map((item) => (
            <a key={item} href="#" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black text-white uppercase tracking-widest hover:text-cyan-400 transition-colors">
              {item}
            </a>
          ))}
          <div className="flex flex-col gap-4 w-full px-12 mt-8">
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-4 text-white font-bold border border-white/20 rounded-xl">
              LOGIN
            </Link>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-4 bg-cyan-500 text-black font-black rounded-xl shadow-lg shadow-cyan-500/20">
              GET STARTED
            </Link>
          </div>
        </div>
      )}

      {/* Hero Content Part */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center max-w-6xl mx-auto pt-40 pb-20">
        
        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 px-4 md:px-6 py-2 rounded-full mb-8 md:mb-10 shadow-2xl animate-fade-in-down hover:border-cyan-500/30 transition-colors cursor-default group">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Next-Gen Venue Analytics</span>
        </div>

        {/* Main Title with Responsive Scaling */}
        <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[9rem] font-black text-white mb-6 md:mb-8 tracking-[-0.05em] leading-[1] md:leading-[0.9] drop-shadow-2xl animate-slide-up">
          UNLEASH THE<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] italic pr-2 md:pr-4">
            STADIUM
          </span> POWER
        </h1>

        <p className="text-base md:text-xl lg:text-2xl text-blue-100/60 max-w-3xl mb-10 md:mb-14 leading-relaxed font-light animate-fade-in tracking-tight">
          Transform spectator management with the world’s most advanced AI-driven coordination engine. Real-time crowd dynamics, predictive mapping, and seamless resource sync.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full justify-center items-center mb-24 md:mb-32">
          <Link 
            to="/login"
            className="w-full sm:w-auto bg-cyan-500 text-black font-black text-[14px] md:text-[15px] px-10 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl shadow-[0_20px_40px_rgba(6,182,212,0.3)] hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-3 group uppercase tracking-widest"
          >
            Go Live Now
            <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <Link 
            to="/login"
            className="w-full sm:w-auto bg-white/5 backdrop-blur-xl border border-white/20 text-white font-black text-[14px] md:text-[15px] px-10 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-white/10 hover:border-white/40 hover:-translate-y-2 transition-all flex items-center justify-center uppercase tracking-widest"
          >
            The Platform
          </Link>
        </div>

        {/* Metrics/Stats Card Component */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl mx-auto">
          {[
            { label: 'Real-time', value: '100%', sub: 'GPS Precision', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
            { label: 'Latency', value: '<2ms', sub: 'Instant Sync', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { label: 'Capacity', value: '100k+', sub: 'Safe Scaling', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
          ].map((stat, i) => (
            <div key={i} className="group bg-white/5 backdrop-blur-3xl border border-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] hover:bg-white/10 transition-all border-b-4 border-b-cyan-500/50 hover:border-b-cyan-400">
               <svg className="w-6 h-6 md:w-8 md:h-8 text-cyan-400 mb-3 md:mb-4 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
              <h4 className="text-white/40 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-1">{stat.label}</h4>
              <div className="text-2xl md:text-3xl font-black text-white mb-1">{stat.value}</div>
              <p className="text-cyan-400/80 text-[10px] md:text-xs font-bold">{stat.sub}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Decorative Blobs */}
      <div className="fixed top-1/2 left-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-blue-600/5 blur-[100px] md:blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed top-1/2 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-cyan-600/5 blur-[100px] md:blur-[150px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Tailwind Custom Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-fade-in-down { animation: fade-in-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-fade-in { animation: opacity 1.5s ease-out both; }
        @keyframes opacity { from { opacity: 0; } to { opacity: 1; } }
      `}} />
    </div>
  );
}
