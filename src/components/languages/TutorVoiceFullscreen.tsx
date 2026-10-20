import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Button } from '@/components/ui/button';
import { GraduationCap, Loader2, Mic, Minimize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const md: Components = {
  h2: ({ children }) => <h2 className="mt-4 mb-1.5 text-lg font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1 text-base font-semibold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-3 text-lg leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-6 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-6 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-lg leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-primary/40 pl-4 text-lg italic text-muted-foreground">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-base">{children}</code>,
  a: ({ children, ...props }) => (
    <a className="text-primary underline underline-offset-2" {...props}>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-base">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b bg-muted/50 px-2 py-1 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b px-2 py-1">{children}</td>,
};

/** Ondas de voz en azul: se mueven con fuerza cuando la IA habla o el usuario graba. */
function VoiceWave({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const BARS = 36;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      const radius = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const on = activeRef.current;
      t += on ? 0.14 : 0.035;
      const bw = w / BARS;

      for (let i = 0; i < BARS; i++) {
        const n =
          Math.sin(i * 0.55 + t * 2.1) *
          Math.sin(i * 0.17 + t * 0.9) *
          Math.sin(t * 0.8 + i * 0.23);
        const amp = on ? 0.18 + 0.82 * Math.abs(n) : 0.05 + 0.03 * Math.abs(Math.sin(t + i * 0.6));
        const bh = Math.max(6, amp * h * 0.92);
        const x = i * bw + bw * 0.22;
        const y = (h - bh) / 2;
        ctx.fillStyle = on ? 'rgba(59, 130, 246, 0.9)' : 'rgba(59, 130, 246, 0.3)';
        roundRect(x, y, bw * 0.56, bh, bw * 0.28);
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-36 sm:h-44" aria-hidden />;
}

interface Props {
  open: boolean;
  onClose: () => void;
  flag: string;
  name: string;
  level: string;
  modeLabel: string;
  aiText: string;
  aiSpeaking: boolean;
  loading: boolean;
  stopSpeak: () => void;
  sttSupported: boolean;
  sttListening: boolean;
  sttInterim: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onHoldCancel: () => void;
}

const CANCEL_THRESHOLD = 70;

export function TutorVoiceFullscreen({
  open,
  onClose,
  flag,
  name,
  level,
  modeLabel,
  aiText,
  aiSpeaking,
  loading,
  stopSpeak,
  sttSupported,
  sttListening,
  sttInterim,
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
}: Props) {
  const [showCancel, setShowCancel] = useState(false);
  const holdingRef = useRef(false);
  const startYRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      holdingRef.current = false;
      setShowCancel(false);
    }
  }, [open]);

  if (!open) return null;

  const waveActive = aiSpeaking || sttListening;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!sttSupported || loading || holdingRef.current) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    holdingRef.current = true;
    startYRef.current = e.clientY;
    setShowCancel(false);
    stopSpeak();
    onHoldStart();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!holdingRef.current) return;
    setShowCancel(startYRef.current - e.clientY > CANCEL_THRESHOLD);
  };

  const finishHold = (clientY: number | null, forceCancel: boolean) => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    const dragged = clientY !== null && startYRef.current - clientY > CANCEL_THRESHOLD;
    setShowCancel(false);
    if (forceCancel || dragged) onHoldCancel();
    else onHoldEnd();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="p-1.5 rounded-md bg-foreground text-background">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">
            {flag} {name} · Tutor IA
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Nivel {level} · {modeLabel}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label="Salir de pantalla completa">
          <Minimize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Onda de voz + respuesta de la IA */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 px-5 sm:px-10">
        <div className="w-full max-w-2xl">
          <VoiceWave active={waveActive} />
        </div>

        <div className="w-full max-h-[45vh] overflow-y-auto overscroll-contain">
          {sttListening ? (
            <p className="text-center text-lg text-muted-foreground italic whitespace-pre-wrap">
              {sttInterim || 'Escuchando...'}
            </p>
          ) : loading ? (
            <p className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Pensando...
            </p>
          ) : aiText ? (
            <div className="text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                {aiText}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-center text-lg text-muted-foreground">
              Mantén pulsado el botón y habla. Al soltarlo se envía al Tutor.
            </p>
          )}
        </div>
      </div>

      {/* Zona de cancelar (aparece al deslizar hacia arriba) */}
      <div className="h-20 flex-shrink-0 flex items-end justify-center pb-1">
        {showCancel && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/10 px-4 py-2 text-destructive text-sm font-medium',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
          >
            <X className="w-4 h-4" />
            Suelta para descartar
          </div>
        )}
      </div>

      {/* Botón hablar: mantener pulsado → suelta para enviar / desliza arriba para borrar */}
      <div className="flex flex-col items-center gap-3 pb-8 pt-2 px-4 flex-shrink-0 border-t border-border">
        <button
          type="button"
          disabled={!sttSupported || loading}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={e => finishHold(e.clientY, false)}
          onPointerCancel={() => finishHold(null, true)}
          onContextMenu={e => e.preventDefault()}
          className={cn(
            'touch-none select-none rounded-full flex items-center justify-center transition-all duration-150',
            'w-20 h-20',
            showCancel
              ? 'bg-destructive text-white scale-95 shadow-lg shadow-destructive/30'
              : sttListening
                ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/40 animate-pulse'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 active:scale-95',
            (!sttSupported || loading) && 'opacity-40 pointer-events-none'
          )}
          aria-label="Mantén pulsado para hablar"
        >
          {showCancel ? <X className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
        </button>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {!sttSupported
            ? 'Reconocimiento de voz no disponible: usa Chrome o Edge'
            : 'Mantén pulsado para hablar · suelta para enviar · desliza hacia arriba para descartar'}
        </p>
      </div>
    </div>
  );
}
