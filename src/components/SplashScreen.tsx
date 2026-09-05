import { Brain } from "lucide-react";
import { useState, useEffect } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase("exit"), 1200);
    const hideTimer = setTimeout(() => onComplete(), 1800);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-500 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="splash-brain-icon flex flex-col items-center gap-4">
        <div className="splash-icon-ring">
          <Brain className="h-16 w-16 text-violet-400" strokeWidth={1.5} />
        </div>
        <h1 className="splash-title text-2xl font-light tracking-widest text-white/90 uppercase">
          Segundo Cerebro
        </h1>
        <div className="splash-loader mt-2 h-0.5 w-16 overflow-hidden rounded-full bg-white/10">
          <div className="splash-loader-bar h-full w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        </div>
      </div>
    </div>
  );
}
