"use client";

import Image from "next/image";

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-between px-6 pb-12 pt-20"
      style={{ 
        background: "radial-gradient(circle at top center, #0f2e22 0%, var(--background) 60%)",
        color: "var(--foreground)" 
      }}
    >
      <style>{`
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 20px rgba(0,212,170,0.3)); }
          50% { transform: translateY(-15px) scale(1.02); filter: drop-shadow(0 0 40px rgba(0,212,170,0.6)); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float-icon 4s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .delay-100 { animation-delay: 100ms; opacity: 0; }
        .delay-200 { animation-delay: 200ms; opacity: 0; }
        .delay-300 { animation-delay: 300ms; opacity: 0; }
      `}</style>

      {/* Top section: Icon and Title */}
      <div className="flex flex-col items-center mt-10">
        <div 
          className="relative w-40 h-40 mb-10 flex items-center justify-center animate-float rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)" }}
        >
          <div className="absolute w-24 h-24 rounded-full border border-[rgba(0,212,170,0.3)] animate-[spin_10s_linear_infinite]" />
          <div className="absolute w-32 h-32 rounded-full border border-[rgba(0,212,170,0.1)] border-dashed animate-[spin_15s_linear_infinite_reverse]" />
          <i className="fa-solid fa-gem text-6xl" style={{ color: "var(--dm-green)" }} />
        </div>

        <h1 className="text-4xl font-extrabold text-center tracking-tight animate-fade-in delay-100" style={{ color: "#fff" }}>
          Dream Miner
        </h1>
        <p className="text-center mt-4 text-[15px] leading-relaxed max-w-[280px] animate-fade-in delay-200" style={{ color: "#9ca3af" }}>
          Mine TON seamlessly on Telegram. Build your mining empire, upgrade power, and invite friends.
        </p>
      </div>

      {/* Bottom section: Button */}
      <div className="w-full max-w-[400px] animate-fade-in delay-300">
        <button
          onClick={onStart}
          className="relative w-full overflow-hidden rounded-2xl py-4 font-bold text-[15px] transition-transform active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #00d4aa 0%, #00a383 100%)",
            color: "#050505",
            boxShadow: "0 10px 25px -5px rgba(0,212,170,0.4), 0 0 10px rgba(0,212,170,0.3) inset"
          }}
        >
          <div 
            className="absolute inset-0 bg-white opacity-20" 
            style={{ 
              transform: "translateX(-100%) skewX(-15deg)",
              animation: "shimmer 3s infinite"
            }} 
          />
          <style>{`
            @keyframes shimmer {
              100% { transform: translateX(200%) skewX(-15deg); }
            }
          `}</style>
          
          <span className="relative z-10 flex items-center justify-center gap-2">
            Start Mining <i className="fa-solid fa-arrow-right text-xs" />
          </span>
        </button>
        <p className="text-center text-[11px] mt-4 font-medium" style={{ color: "#555" }}>
          Secured by TON Blockchain
        </p>
      </div>
    </div>
  );
}
