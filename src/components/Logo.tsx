import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = false }) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  };

  return (
    <div className="flex items-center gap-3 select-none group">
      {/* 3D Embossed Ruby Red Icon with High-Relief Effect */}
      <div
        className={`relative ${iconSizes[size]} rounded-2xl p-[1.5px] transition-transform duration-300 group-hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #FF3344 0%, #DC2626 40%, #7F1D1D 80%, #000000 100%)',
          boxShadow: '0 4px 16px 0 rgba(220, 38, 38, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        <div
          className="w-full h-full rounded-[14px] flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #1A0B0E 0%, #0A0507 50%, #020102 100%)',
            boxShadow: 'inset 0 2px 4px rgba(255, 51, 68, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.9)',
          }}
        >
          {/* 3D High-Relief Dynamic Symbol SVG */}
          <svg
            className="w-3/5 h-3/5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoEmbossGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4D5E" />
                <stop offset="45%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
              <filter id="logoShadowRed" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#FF3344" floodOpacity="0.55" />
              </filter>
            </defs>

            {/* Dynamic arcs symbol (NFC + Dynamic Motion) */}
            <path
              d="M4 12C4 7.58172 7.58172 4 12 4C14.2091 4 16.2091 4.89543 17.6569 6.34315"
              stroke="url(#logoEmbossGradRed)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#logoShadowRed)"
            />
            <path
              d="M7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C13.2426 7.5 14.3676 8.00368 15.182 8.81802"
              stroke="#FF4D5E"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="2.2" fill="#FF3344" filter="url(#logoShadowRed)" />
            <path
              d="M20 12C20 16.4183 16.4183 20 12 20C9.79086 20 7.79086 19.1046 6.34315 17.6569"
              stroke="url(#logoEmbossGradRed)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Ruby red sheen reflection line */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-500/10 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Typography: DINÂMICO PRO */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`${textSizes[size]} font-semibold tracking-wide text-white transition-colors group-hover:text-red-400`}
            style={{
              textShadow: '0 2px 10px rgba(239, 68, 68, 0.3)',
              letterSpacing: '0.04em',
            }}
          >
            DINÂMICO
          </span>
          <span
            className={`${badgeSizes[size]} font-bold rounded-md uppercase tracking-wider text-red-300 border border-red-500/50`}
            style={{
              background: 'linear-gradient(180deg, rgba(220, 38, 38, 0.35) 0%, rgba(127, 29, 29, 0.25) 100%)',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.35)',
            }}
          >
            PRO
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-normal text-gray-400 tracking-normal mt-0.5">
            Gerador de Plaquinhas &amp; QR Codes Dinâmicos
          </span>
        )}
      </div>
    </div>
  );
};
