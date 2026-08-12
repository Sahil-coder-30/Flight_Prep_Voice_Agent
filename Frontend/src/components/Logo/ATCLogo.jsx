import React, { useId } from 'react';

/**
 * ATCLogo - Precision Silver & Titanium Logo for Air Traffic Control Voice Simulator
 * Features an ascending supersonic aircraft vector inside a precision radar horizon & compass ring.
 */
export default function ATCLogo({
  size = 'md', // 'sm' (28px), 'md' (42px), 'lg' (64px), 'xl' (84px), 'hero' (108px)
  variant = 'horizontal', // 'mark-only', 'horizontal', 'stacked'
  className = '',
  onClick,
}) {
  const rawId = useId().replace(/:/g, '');
  const gradId = `atcGrad_${rawId}`;
  const shieldId = `atcShield_${rawId}`;
  const glowId = `atcGlow_${rawId}`;
  const ringGradId = `atcRingGrad_${rawId}`;

  const pixelSizes = {
    sm: 28,
    md: 42,
    lg: 64,
    xl: 84,
    hero: 108,
  };

  const iconSize = pixelSizes[size] || pixelSizes.md;

  return (
    <div
      className={`atc-brand-logo atc-brand-logo--${variant} atc-brand-logo--${size} ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: variant === 'stacked' ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: variant === 'stacked' ? '16px' : variant === 'horizontal' ? '14px' : '0px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* ── Logo Vector Symbol ── */}
      <div
        className="atc-brand-logo__mark"
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Executive Silver-Titanium Metallic Gradient */}
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#E4E4E7" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Inner Shield Backdrop */}
            <linearGradient id={shieldId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.10)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.03)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.40)" />
            </linearGradient>

            {/* Radar Ring Gradient */}
            <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
            </linearGradient>

            {/* Subtle Metallic Soft Glow */}
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Rounded Titanium Frame */}
          <rect
            x="4"
            y="4"
            width="72"
            height="72"
            rx="20"
            fill={`url(#${shieldId})`}
            stroke={`url(#${gradId})`}
            strokeWidth="1.75"
            strokeOpacity="0.5"
          />

          {/* Micro Corner Tech Notches */}
          <path d="M12 4 L4 12" stroke="#FFFFFF" strokeWidth="1.25" strokeOpacity="0.6" />
          <path d="M68 4 L76 12" stroke="#FFFFFF" strokeWidth="1.25" strokeOpacity="0.6" />
          <path d="M12 76 L4 68" stroke="#FFFFFF" strokeWidth="1.25" strokeOpacity="0.6" />
          <path d="M68 76 L76 68" stroke="#FFFFFF" strokeWidth="1.25" strokeOpacity="0.6" />

          {/* Outer Precision Radar Horizon Circle */}
          <circle cx="40" cy="40" r="28" stroke={`url(#${ringGradId})`} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="40" cy="40" r="18" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.25" />

          {/* Compass Ticks (4 Cardinal Points) */}
          <line x1="40" y1="8" x2="40" y2="15" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.9" />
          <line x1="40" y1="65" x2="40" y2="72" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.9" />
          <line x1="8" y1="40" x2="15" y2="40" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.9" />
          <line x1="65" y1="40" x2="72" y2="40" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.9" />

          {/* Intersecting Horizon Line */}
          <line x1="16" y1="40" x2="64" y2="40" stroke="#FFFFFF" strokeWidth="0.75" strokeOpacity="0.2" />

          {/* Ascending Tactical Supersonic Aircraft Silhouette */}
          <path
            d="M40 16 L45 32 L62 37 L62 42 L46 39 L44 55 L51 59 L51 63 L40 60 L29 63 L29 59 L36 55 L34 39 L18 42 L18 37 L35 32 Z"
            fill={`url(#${gradId})`}
            filter={`url(#${glowId})`}
          />

          {/* Precision Flight Vector Streamlines */}
          <path d="M26 54 L18 62" stroke="#E4E4E7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
          <path d="M54 54 L62 62" stroke="#E4E4E7" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />

          {/* Beacon Core Dot */}
          <circle cx="40" cy="40" r="3" fill="#FFFFFF" />
        </svg>
      </div>

      {/* ── Brand Typography Text ── */}
      {variant !== 'mark-only' && (
        <div
          className="atc-brand-logo__text"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: variant === 'stacked' ? 'center' : 'flex-start',
            justifyContent: 'center',
            textAlign: variant === 'stacked' ? 'center' : 'left',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: size === 'hero' ? '32px' : size === 'xl' ? '26px' : size === 'lg' ? '22px' : '18px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
              color: 'var(--readout)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>ATC</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '800',
              }}
            >
              SIMULATOR
            </span>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: size === 'hero' ? '12px' : size === 'xl' ? '11px' : '9.5px',
              fontWeight: '600',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--readout-muted)',
              marginTop: '4px',
            }}
          >
            Aviation Phraseology Voice AI
          </span>
        </div>
      )}
    </div>
  );
}
