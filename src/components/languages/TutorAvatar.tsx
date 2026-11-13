import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguageLearning';

interface TutorAvatarProps {
  /** El tutor está leyendo en voz alta: la boca se mueve. */
  speaking?: boolean;
  /** El micrófono está escuchando: aro verde y cejas atentas. */
  listening?: boolean;
  /** El tutor está pensando: mirada arriba y puntos animados. */
  thinking?: boolean;
  language?: Language;
  /** Diámetro en px. Si se omite, ocupa el ancho del contenedor. */
  size?: number;
  /** 0-1 para el aro de progreso de la sesión. */
  progress?: number;
  className?: string;
  label?: string;
}

/**
 * Cara animada del tutor. La boca se mueve con un pequeño motor de
 * animación (sin librerías) mientras el TTS habla; los ojos parpadean y la
 * cabeza respira. También reacciona cuando escucha o piensa.
 */
export function TutorAvatar({
  speaking = false,
  listening = false,
  thinking = false,
  language = 'english',
  size,
  progress,
  className,
  label,
}: TutorAvatarProps) {
  const uid = useId().replace(/:/g, '');
  const mouthRef = useRef<SVGEllipseElement>(null);
  const smileRef = useRef<SVGPathElement>(null);
  const tongueRef = useRef<SVGEllipseElement>(null);

  const accent = language === 'italian' ? '#10b981' : '#3b82f6';
  const accentSoft = language === 'italian' ? '#34d399' : '#60a5fa';
  const ringColor = listening ? '#22c55e' : accent;
  const pct = progress === undefined ? null : Math.max(0, Math.min(1, progress));

  // Motor de la boca: ondas combinadas + suavizado. Escribe atributos SVG
  // directamente para no re-renderizar React a 60 fps.
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Boca estática: cerrada en reposo, abierta si hay que mostrar habla sin animación.
    const applyStatic = (openAmount: number) => {
      const rx = 9 + openAmount * 9;
      const ry = 1.2 + openAmount * 11;
      const visible = Math.min(1, openAmount * 4);
      mouthRef.current?.setAttribute('rx', rx.toFixed(2));
      mouthRef.current?.setAttribute('ry', ry.toFixed(2));
      mouthRef.current?.setAttribute('opacity', visible.toFixed(2));
      smileRef.current?.setAttribute('opacity', Math.max(0, 1 - visible).toFixed(2));
      tongueRef.current?.setAttribute('cy', (131 + ry * 0.62).toFixed(2));
      tongueRef.current?.setAttribute('opacity', visible.toFixed(2));
    };

    if (reduce) {
      applyStatic(speaking ? 0.75 : 0);
      return;
    }

    // En reposo no hace falta animar: evita un rAF permanente por cada avatar.
    if (!speaking) {
      applyStatic(0);
      return;
    }

    let raf = 0;
    let open = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const t = now / 1000;

      // Varias frecuencias para que no parezca un metrónomo.
      const wave =
        0.5 +
        0.28 * Math.sin(t * 11.7) +
        0.17 * Math.sin(t * 18.3 + 1.4) +
        0.13 * Math.sin(t * 6.1 + 0.6);
      const gate = Math.sin(t * 2.3) > -0.35 ? 1 : 0.18;
      const target = Math.max(0, Math.min(1, (0.18 + wave * 0.82) * gate));

      open += (target - open) * Math.min(1, dt * 20);
      const rx = 9 + open * 9;
      const ry = 1.2 + open * 11;
      const visible = Math.min(1, open * 4);

      mouthRef.current?.setAttribute('rx', rx.toFixed(2));
      mouthRef.current?.setAttribute('ry', ry.toFixed(2));
      mouthRef.current?.setAttribute('opacity', visible.toFixed(2));
      smileRef.current?.setAttribute('opacity', Math.max(0, 1 - visible).toFixed(2));
      tongueRef.current?.setAttribute('cy', (131 + ry * 0.62).toFixed(2));
      tongueRef.current?.setAttribute('opacity', visible.toFixed(2));

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speaking]);

  const aria = label ?? (speaking ? 'Tutor hablando' : listening ? 'Tutor escuchando' : thinking ? 'Tutor pensando' : 'Tutor IA');

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={aria}
      className={cn('block select-none', !size && 'h-auto w-full', className)}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor={accentSoft} stopOpacity="0.34" />
          <stop offset="62%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </radialGradient>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8dcc6" />
          <stop offset="100%" stopColor="#edc2a4" />
        </linearGradient>
        <linearGradient id={`${uid}-skin-shadow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8b896" />
          <stop offset="100%" stopColor="#dcaa88" />
        </linearGradient>
        <linearGradient id={`${uid}-shirt`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id={`${uid}-hair`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b2a22" />
          <stop offset="100%" stopColor="#241811" />
        </linearGradient>
        <linearGradient id={`${uid}-headset`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Halo y aro de progreso */}
      <circle cx="100" cy="100" r="98" fill={`url(#${uid}-halo)`} />
      <circle cx="100" cy="100" r="94" fill="none" stroke={ringColor} strokeOpacity="0.12" strokeWidth="4" />
      {pct !== null && (
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke={ringColor}
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - pct * 100}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 600ms linear' }}
        />
      )}
      {(speaking || listening) && (
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke={ringColor}
          strokeWidth="2"
          strokeOpacity="0.45"
          className="tutor-avatar-pulse"
        />
      )}

      <g className={cn('tutor-avatar-head', speaking && 'tutor-avatar-head--talking')}>
        {/* Hombros y cuello */}
        <path d="M48 200 Q52 163 82 153 L118 153 Q148 163 152 200 Z" fill={`url(#${uid}-shirt)`} />
        <path d="M88 142 L112 142 L112 158 Q100 166 88 158 Z" fill={`url(#${uid}-skin-shadow)`} />
        <path d="M88 154 Q100 164 112 154 L118 160 Q100 172 82 160 Z" fill="#e2e8f0" opacity="0.55" />

        {/* Orejas */}
        <ellipse cx="55" cy="106" rx="7.5" ry="10.5" fill={`url(#${uid}-skin)`} />
        <ellipse cx="145" cy="106" rx="7.5" ry="10.5" fill={`url(#${uid}-skin)`} />

        {/* Cara */}
        <ellipse cx="100" cy="100" rx="44" ry="50" fill={`url(#${uid}-skin)`} />
        <ellipse cx="100" cy="100" rx="44" ry="50" fill="none" stroke="#b07b5c" strokeOpacity="0.18" strokeWidth="1.2" />

        {/* Pelo */}
        <path
          d="M55 98 Q50 48 100 45 Q150 48 145 98 Q139 74 119 66 Q101 60 82 67 Q62 74 55 98 Z"
          fill={`url(#${uid}-hair)`}
        />
        <path d="M57 94 Q68 73 92 74 Q76 80 70 98 Q62 99 57 94 Z" fill="#4a352a" opacity="0.65" />

        {/* Cejas */}
        <path
          d="M72 88 Q81 83 90 87"
          fill="none"
          stroke="#3b2a22"
          strokeWidth="3.2"
          strokeLinecap="round"
          style={{ transition: 'transform 200ms ease', transform: listening || thinking ? 'translateY(-2px)' : undefined }}
        />
        <path
          d="M110 87 Q119 83 128 88"
          fill="none"
          stroke="#3b2a22"
          strokeWidth="3.2"
          strokeLinecap="round"
          style={{ transition: 'transform 200ms ease', transform: listening || thinking ? 'translateY(-2px)' : undefined }}
        />

        {/* Ojos (parpadeo CSS) */}
        <g className="tutor-avatar-blink">
          <ellipse cx="82" cy="100" rx="8.4" ry="9.4" fill="#ffffff" />
          <ellipse cx="118" cy="100" rx="8.4" ry="9.4" fill="#ffffff" />
          <g style={{ transition: 'transform 250ms ease', transform: thinking ? 'translateY(-2.5px)' : undefined }}>
            <circle cx="83.5" cy="100.5" r="4.2" fill="#2c211c" />
            <circle cx="117.5" cy="100.5" r="4.2" fill="#2c211c" />
            <circle cx="85" cy="98.8" r="1.5" fill="#ffffff" />
            <circle cx="119" cy="98.8" r="1.5" fill="#ffffff" />
          </g>
        </g>

        {/* Nariz y mejillas */}
        <path d="M100 104 Q96.5 113 100 115.5 Q103.5 115.5 102 112.5" fill="none" stroke="#c08a68" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="71" cy="119" rx="9" ry="5" fill="#f08a8a" opacity="0.22" />
        <ellipse cx="129" cy="119" rx="9" ry="5" fill="#f08a8a" opacity="0.22" />

        {/* Boca: sonrisa cerrada + óvalo que se abre al hablar */}
        <path
          ref={smileRef}
          d="M85 131 Q100 140 115 131"
          fill="none"
          stroke="#7a3b3b"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <ellipse ref={mouthRef} cx="100" cy="134" rx="9" ry="1.2" fill="#5f2a30" opacity="0" />
        <ellipse ref={tongueRef} cx="100" cy="139" rx="6.5" ry="2.6" fill="#e58a8a" opacity="0" />

        {/* Auricular con micrófono */}
        <path
          d="M58 86 Q58 40 100 38 Q142 40 142 86"
          fill="none"
          stroke={`url(#${uid}-headset)`}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <rect x="49" y="92" width="14" height="27" rx="7" fill={`url(#${uid}-headset)`} />
        <rect x="52" y="97" width="8" height="17" rx="4" fill={ringColor} opacity="0.55" />
        <path d="M57 117 Q63 139 82 142" fill="none" stroke={`url(#${uid}-headset)`} strokeWidth="3" strokeLinecap="round" />
        <circle cx="84" cy="142" r="4.2" fill={`url(#${uid}-headset)`} />
        <circle cx="84" cy="142" r="1.7" fill={listening ? '#22c55e' : accentSoft} />

        {/* Ondas de voz */}
        {speaking && (
          <g fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round">
            <path d="M126 126 Q134 134 126 142" className="tutor-avatar-sound" style={{ animationDelay: '0ms' }} />
            <path d="M134 120 Q146 134 134 148" className="tutor-avatar-sound" style={{ animationDelay: '140ms' }} />
            <path d="M142 114 Q158 134 142 154" className="tutor-avatar-sound" style={{ animationDelay: '280ms' }} />
          </g>
        )}

        {/* Puntos de pensamiento */}
        {thinking && (
          <g fill={accent}>
            <circle cx="84" cy="28" r="4" className="tutor-avatar-think" style={{ animationDelay: '0ms' }} />
            <circle cx="100" cy="22" r="4.5" className="tutor-avatar-think" style={{ animationDelay: '140ms' }} />
            <circle cx="116" cy="28" r="4" className="tutor-avatar-think" style={{ animationDelay: '280ms' }} />
          </g>
        )}
      </g>
    </svg>
  );
}
