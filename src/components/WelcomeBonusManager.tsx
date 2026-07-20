import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/api';
import coinSvg from '@/assets/coin.svg';

const WELCOME_BONUS_AMOUNT = import.meta.env.VITE_COIN_WELCOME_BONUS ?? '0';

// ── Coin particle type ─────────────────────────────────────────────────────────
interface CoinParticle {
    id: number;
    x: number;
    delay: number;
    duration: number;
    size: number;
}

// ── Burst coin particle type ───────────────────────────────────────────────────
interface BurstCoin {
    id: number;
    angle: number;
    distance: number;
    size: number;
    delay: number;
    duration: number;
    rotations: number;
}

function generateCoins(count: number): CoinParticle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.4,
        duration: 1.8 + Math.random() * 1.6,
        size: 18 + Math.random() * 16,
    }));
}

function generateBurstCoins(count: number): BurstCoin[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (360 / count) * i + (Math.random() - 0.5) * 20,
        distance: 90 + Math.random() * 90,
        size: 14 + Math.random() * 18,
        delay: Math.random() * 0.18,
        duration: 0.7 + Math.random() * 0.5,
        rotations: 2 + Math.random() * 4,
    }));
}

// ── Explosion coin type (for the BOWIZZY box blast) ─────────────────────────────
interface ExplosionCoin {
    id: number;
    angle: number;
    distance: number;
    size: number;
    delay: number;
    duration: number;
    rotations: number;
    arcHeight: number;
}

function generateExplosionCoins(count: number): ExplosionCoin[] {
    return Array.from({ length: count }, (_, i) => {
        // Bias the spread toward an upward/outward fountain
        const angle = -90 + (Math.random() - 0.5) * 300;
        return {
            id: i,
            angle,
            distance: 120 + Math.random() * 160,
            size: 16 + Math.random() * 20,
            delay: Math.random() * 0.12,
            duration: 0.9 + Math.random() * 0.7,
            rotations: 2 + Math.random() * 5,
            arcHeight: 60 + Math.random() * 120,
        };
    });
}

// ── Bow + Arrow launch intro ────────────────────────────────────────────────────
type IntroPhase = 'draw' | 'fire' | 'hit' | 'reveal';

function BowAndArrow({ phase }: { phase: IntroPhase }) {
    const fired = phase === 'fire' || phase === 'hit';
    return (
        <div
            style={{
                position: 'absolute',
                left: '6%',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: fired ? 0 : 1,
                transition: 'opacity 0.45s ease 0.15s',
                zIndex: 4,
            }}
        >
            <svg width="130" height="200" viewBox="-40 -100 130 200" style={{ overflow: 'visible' }}>
                {/* Bow limb */}
                <path
                    d="M 0 -85 Q 62 0 0 85"
                    fill="none"
                    stroke="url(#bowGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(255,150,0,0.5))' }}
                />
                {/* Bow string — drawn back to the nock while aiming, snaps straight on fire */}
                <polyline
                    points={fired ? '0,-85 0,0 0,85' : '0,-85 -26,0 0,85'}
                    fill="none"
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth="2"
                    style={{ transition: 'all 0.08s ease-out' }}
                />
                <defs>
                    <linearGradient id="bowGrad" x1="0" y1="-85" x2="0" y2="85" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#8a5a2b" />
                        <stop offset="50%" stopColor="#d98a3d" />
                        <stop offset="100%" stopColor="#8a5a2b" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

function ArrowInFlight({ phase }: { phase: IntroPhase }) {
    // The arrow sits nocked while aiming, then flies across on 'fire' and embeds into the box centre on 'hit'
    const fired = phase === 'fire' || phase === 'hit';
    return (
        <div
            style={{
                position: 'absolute',
                left: 'calc(6% + 40px)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 5,
                // arrowhead ends at the box centre (box is right:7%, 160px wide → centre = 93% − 80px; tip sits 128px into the shaft)
                animation: fired ? 'arrowFly 0.55s cubic-bezier(0.4, 0, 0.5, 1) forwards' : undefined,
                // Only fade out once the box has burst, not while the arrow is still visible in the box
                opacity: phase === 'hit' ? 0 : 1,
                transition: 'opacity 0.2s ease 0.45s',
            }}
        >
            <div style={{ animation: phase === 'draw' ? 'arrowNock 0.5s ease-in-out infinite alternate' : undefined }}>
                <svg width="150" height="24" viewBox="0 0 150 24" style={{ overflow: 'visible', display: 'block' }}>
                    {/* Shaft */}
                    <line x1="6" y1="12" x2="128" y2="12" stroke="#c9a24b" strokeWidth="3" strokeLinecap="round" />
                    {/* Arrowhead */}
                    <path d="M 128 12 L 112 5 L 116 12 L 112 19 Z" fill="#f0f0f0" stroke="#bbb" strokeWidth="0.5" />
                    {/* Fletching */}
                    <path d="M 6 12 L 20 4 L 26 8 L 14 12 Z" fill="#ff8a3d" />
                    <path d="M 6 12 L 20 20 L 26 16 L 14 12 Z" fill="#4ab8ff" />
                    <path d="M 14 12 L 26 6 L 30 9 L 20 12 Z" fill="#ffb020" />
                    <path d="M 14 12 L 26 18 L 30 15 L 20 12 Z" fill="#7fd0ff" />
                </svg>
            </div>
        </div>
    );
}

// ── Welcome Bonus Modal ────────────────────────────────────────────────────────
function WelcomeBonusModal({
    name,
    onClaim,
    onDismiss,
}: {
    name: string;
    onClaim: () => Promise<void>;
    onDismiss: () => void;
}) {
    const [coins] = useState(() => generateCoins(40));
    const [burstCoins] = useState(() => generateBurstCoins(22));
    const [explosionCoins] = useState(() => generateExplosionCoins(34));
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [phase, setPhase] = useState<IntroPhase>('draw');

    // Drive the cinematic intro: aim → fire → impact → reveal
    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase('fire'), 1100),
            setTimeout(() => setPhase('hit'), 1650),
            setTimeout(() => setPhase('reveal'), 3100),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    const handleClaim = async () => {
        setClaiming(true);
        try {
            await onClaim();
            setClaimed(true);
        } catch {
            setClaimed(true);
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 50% 40%, rgba(20,10,60,0.85) 0%, rgba(0,0,0,0.92) 100%)',
                    backdropFilter: 'blur(8px)',
                    animation: 'backdropIn 0.4s ease forwards',
                }}
                onClick={phase === 'reveal' ? onDismiss : undefined}
            />

            {/* ══════════════ CINEMATIC BOW-AND-ARROW INTRO ══════════════ */}
            {phase !== 'reveal' && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                    style={{ zIndex: 20, animation: phase === 'hit' ? 'introFadeOut 0.5s ease 0.95s forwards' : undefined }}
                >
                    <div
                        style={{
                            position: 'relative',
                            width: 'min(94vw, 620px)',
                            height: '340px',
                        }}
                    >
                        {/* Bow (fades once the arrow is loosed) */}
                        <BowAndArrow phase={phase} />

                        {/* Arrow in flight */}
                        <ArrowInFlight phase={phase} />

                        {/* ── Gift box target ── */}
                        <div
                            style={{
                                position: 'absolute',
                                right: '7%',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '160px',
                                height: '160px',
                                zIndex: 3,
                            }}
                        >
                            {/* Lid — pops off on impact */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '0',
                                    transform: 'translateX(-50%)',
                                    zIndex: 2,
                                    animation: phase === 'hit' ? 'lidPop 0.7s cubic-bezier(0.25, 0.8, 0.4, 1) forwards' : undefined,
                                }}
                            >
                                <svg width="170" height="96" viewBox="0 0 170 96" style={{ overflow: 'visible', display: 'block', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.4))' }}>
                                    {/* Bow loops */}
                                    <ellipse cx="70" cy="26" rx="20" ry="14" fill="url(#giftRibbonLid)" transform="rotate(-22 70 26)" />
                                    <ellipse cx="100" cy="26" rx="20" ry="14" fill="url(#giftRibbonLid)" transform="rotate(22 100 26)" />
                                    <circle cx="85" cy="28" r="9" fill="#FFD24d" stroke="#e0a000" strokeWidth="1" />
                                    {/* Lid body */}
                                    <rect x="16" y="40" width="138" height="42" rx="7" fill="url(#giftLidGrad)" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                                    {/* Ribbon across lid */}
                                    <rect x="72" y="40" width="26" height="42" fill="url(#giftRibbonLid)" />
                                    <defs>
                                        <linearGradient id="giftLidGrad" x1="0" y1="40" x2="0" y2="82" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#ff6b85" />
                                            <stop offset="100%" stopColor="#e0395f" />
                                        </linearGradient>
                                        <linearGradient id="giftRibbonLid" x1="0" y1="0" x2="0" y2="82" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#FFE566" />
                                            <stop offset="100%" stopColor="#FFB020" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            {/* Box body — shakes then bursts on impact */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: '0',
                                    transform: 'translateX(-50%)',
                                    zIndex: 1,
                                    animation:
                                        phase === 'hit'
                                            ? 'giftBurst 0.55s cubic-bezier(0.36, 0, 0.66, -0.4) 0.05s forwards'
                                            : 'giftIdle 2.4s ease-in-out infinite',
                                }}
                            >
                                <svg width="150" height="112" viewBox="0 0 150 112" style={{ display: 'block', filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.5))' }}>
                                    {/* Box body */}
                                    <rect x="15" y="6" width="120" height="102" rx="7" fill="url(#giftBodyGrad)" />
                                    {/* Inner shadow lip */}
                                    <rect x="15" y="6" width="120" height="10" rx="5" fill="rgba(0,0,0,0.18)" />
                                    {/* Vertical ribbon */}
                                    <rect x="62" y="6" width="26" height="102" fill="url(#giftRibbonBody)" />
                                    <defs>
                                        <linearGradient id="giftBodyGrad" x1="0" y1="6" x2="0" y2="108" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#ff4d6d" />
                                            <stop offset="100%" stopColor="#c9184a" />
                                        </linearGradient>
                                        <linearGradient id="giftRibbonBody" x1="0" y1="6" x2="0" y2="108" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#FFD24d" />
                                            <stop offset="100%" stopColor="#FF9e00" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            {/* Impact flash */}
                            {phase === 'hit' && (
                                <>
                                    <div style={{
                                        position: 'absolute', left: '50%', top: '50%',
                                        width: '30px', height: '30px', marginLeft: '-15px', marginTop: '-15px',
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,200,0,0.6) 40%, transparent 70%)',
                                        animation: 'impactFlash 0.5s ease-out forwards',
                                    }} />
                                    <div style={{
                                        position: 'absolute', left: '50%', top: '50%',
                                        width: '60px', height: '60px', marginLeft: '-30px', marginTop: '-30px',
                                        borderRadius: '50%',
                                        border: '3px solid rgba(255,215,0,0.8)',
                                        animation: 'impactRing 0.6s ease-out forwards',
                                    }} />
                                </>
                            )}

                            {/* ── Coin explosion from the box ── */}
                            {phase === 'hit' && (
                                <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, zIndex: 2 }}>
                                    {explosionCoins.map((c) => {
                                        const rad = (c.angle * Math.PI) / 180;
                                        const tx = Math.cos(rad) * c.distance;
                                        const ty = Math.sin(rad) * c.distance;
                                        return (
                                            <div
                                                key={c.id}
                                                style={{
                                                    position: 'absolute',
                                                    width: `${c.size}px`,
                                                    height: `${c.size}px`,
                                                    left: `-${c.size / 2}px`,
                                                    top: `-${c.size / 2}px`,
                                                    animation: `explodeCoin ${c.duration}s ${c.delay}s cubic-bezier(0.2, 0.7, 0.4, 1) both`,
                                                    '--tx': `${tx}px`,
                                                    '--ty': `${ty}px`,
                                                    '--arc': `-${c.arcHeight}px`,
                                                    '--rot': `${c.rotations * 360}deg`,
                                                    filter: 'drop-shadow(0 2px 6px rgba(255,200,0,0.7))',
                                                } as React.CSSProperties}
                                            >
                                                <img src={coinSvg} alt="" style={{ width: '100%', height: '100%' }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── BOWIZZY text flies out of the box to screen center ── */}
                        {phase === 'hit' && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    zIndex: 6,
                                    whiteSpace: 'nowrap',
                                    fontFamily: '"Syne", "Clash Display", sans-serif',
                                    fontWeight: 900,
                                    fontSize: 'clamp(34px, 9vw, 66px)',
                                    letterSpacing: '-1px',
                                    lineHeight: 1,
                                    filter: 'drop-shadow(0 6px 22px rgba(0,0,0,0.6))',
                                    animation: 'textToCenter 0.9s cubic-bezier(0.18, 0.9, 0.3, 1.15) 0.15s both',
                                }}
                            >
                                <span style={{ color: '#FF8C00' }}>BO</span>
                                <span style={{ color: '#5CC8FF' }}>WIZZY</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ambient light beams */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: phase === 'reveal' ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        top: '30%',
                        left: '50%',
                        width: '2px',
                        height: '55vh',
                        background: `linear-gradient(to bottom, rgba(255,200,0,${0.12 + i * 0.03}), transparent)`,
                        transformOrigin: 'top center',
                        transform: `translateX(-50%) rotate(${-60 + i * 24}deg)`,
                        animation: `beamPulse ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
                    }} />
                ))}
            </div>

            {/* Falling coin rain */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: phase === 'reveal' ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                {coins.map((coin) => (
                    <div
                        key={coin.id}
                        style={{
                            position: 'absolute',
                            left: `${coin.x}%`,
                            top: '-60px',
                            width: `${coin.size}px`,
                            height: `${coin.size}px`,
                            animation: `coinFall ${coin.duration}s ${coin.delay}s ease-in infinite`,
                            filter: 'drop-shadow(0 2px 8px rgba(255,180,0,0.6))',
                        }}
                    >
                        <img src={coinSvg} alt="coin" style={{ width: '100%', height: '100%' }} />
                    </div>
                ))}
            </div>

            {/* Modal card */}
            {phase === 'reveal' && (
            <div
                className="relative z-10 w-full max-w-sm overflow-visible"
                style={{ animation: 'modalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
            >
                {/* ── COIN BURST SPLASH ── */}
                <div
                    className="absolute pointer-events-none"
                    style={{ top: '-10px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0 }}
                >
                    {burstCoins.map((c) => {
                        const rad = (c.angle * Math.PI) / 180;
                        const tx = Math.cos(rad) * c.distance;
                        const ty = Math.sin(rad) * c.distance;
                        return (
                            <div
                                key={c.id}
                                style={{
                                    position: 'absolute',
                                    width: `${c.size}px`,
                                    height: `${c.size}px`,
                                    left: `-${c.size / 2}px`,
                                    top: `-${c.size / 2}px`,
                                    animation: `burstCoin ${c.duration}s ${c.delay}s cubic-bezier(0.2, 0.8, 0.4, 1) both`,
                                    '--tx': `${tx}px`,
                                    '--ty': `${ty}px`,
                                    '--rot': `${c.rotations * 360}deg`,
                                    filter: 'drop-shadow(0 2px 6px rgba(255,200,0,0.7))',
                                } as React.CSSProperties}
                            >
                                <img src={coinSvg} alt="" style={{ width: '100%', height: '100%' }} />
                            </div>
                        );
                    })}

                    {/* Central flash ring */}
                    <div style={{
                        position: 'absolute',
                        width: '80px', height: '80px',
                        left: '-40px', top: '-40px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255,215,0,0.9)',
                        animation: 'burstRing 0.6s 0.05s ease-out both',
                    }} />
                    <div style={{
                        position: 'absolute',
                        width: '140px', height: '140px',
                        left: '-70px', top: '-70px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,215,0,0.45)',
                        animation: 'burstRing 0.7s 0.12s ease-out both',
                    }} />
                </div>

                {/* Card body */}
                <div
                    style={{
                        borderRadius: '28px',
                        overflow: 'hidden',
                        background: 'linear-gradient(160deg, #0d0d1a 0%, #111128 50%, #0a0a1f 100%)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,180,0,0.12)',
                        position: 'relative',
                    }}
                >
                    {/* Top shimmer strip */}
                    <div style={{
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #FFD700 30%, #FF8C00 60%, transparent)',
                        animation: 'stripSlide 2s linear infinite',
                        backgroundSize: '200% 100%',
                    }} />

                    {/* Radial glow top */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '200px',
                        background: 'radial-gradient(ellipse at 50% -10%, rgba(255,200,0,0.14) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Hero section */}
                    <div style={{ padding: '36px 28px 24px', textAlign: 'center', position: 'relative' }}>
                        {/* Big coin pulse */}
                        <div style={{
                            width: '88px', height: '88px',
                            margin: '0 auto 20px',
                            position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {/* Halo rings */}
                            <div style={{
                                position: 'absolute', inset: '-16px',
                                borderRadius: '50%',
                                border: '2px solid rgba(255,215,0,0.15)',
                                animation: 'haloExpand 2s ease-out infinite',
                            }} />
                            <div style={{
                                position: 'absolute', inset: '-8px',
                                borderRadius: '50%',
                                border: '2px solid rgba(255,215,0,0.25)',
                                animation: 'haloExpand 2s 0.5s ease-out infinite',
                            }} />
                            {/* Glow bg */}
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,200,0,0.3) 0%, transparent 70%)',
                                animation: 'glowPulse 2s ease-in-out infinite alternate',
                            }} />
                            <img
                                src={coinSvg}
                                alt="coin"
                                style={{
                                    width: '72px', height: '72px',
                                    animation: 'coinFloat 3s ease-in-out infinite, coinSpin3d 4s linear infinite',
                                    filter: 'drop-shadow(0 4px 20px rgba(255,180,0,0.7))',
                                    position: 'relative', zIndex: 1,
                                }}
                            />
                        </div>

                        {/* Headline */}
                        <div style={{
                            fontSize: '11px',
                            fontFamily: '"Space Mono", monospace',
                            letterSpacing: '4px',
                            textTransform: 'uppercase',
                            color: 'rgba(255,215,0,0.6)',
                            marginBottom: '8px',
                        }}>
                            🎉 Special Reward
                        </div>
                        <h2 style={{
                            fontSize: '32px',
                            fontWeight: 900,
                            fontFamily: '"Clash Display", "Syne", sans-serif',
                            background: 'linear-gradient(135deg, #FFE566 0%, #FFB020 40%, #FF6B00 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.1,
                            marginBottom: '10px',
                            letterSpacing: '-1px',
                        }}>
                            Welcome Bonus!
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '14px',
                            fontFamily: '"DM Sans", sans-serif',
                            lineHeight: 1.6,
                        }}>
                            Hey <span style={{ color: '#FFD700', fontWeight: 700 }}>{name}</span> 👋<br />
                            You've unlocked a special reward for joining.
                        </p>
                    </div>

                    {/* Divider */}
                    <div style={{
                        margin: '0 28px',
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)',
                    }} />

                    {/* Reward badge */}
                    <div style={{ padding: '20px 28px' }}>
                        <div style={{
                            borderRadius: '20px',
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.07) 0%, rgba(255,120,0,0.05) 100%)',
                            border: '1px solid rgba(255,215,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Scan line */}
                            <div style={{
                                position: 'absolute', top: 0, left: '-100%', right: 0, bottom: 0,
                                background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.06), transparent)',
                                animation: 'scanLine 2.5s ease-in-out infinite',
                            }} />
                            <div style={{ flexShrink: 0 }}>
                                <img src={coinSvg} alt="coin" style={{
                                    width: '40px', height: '40px',
                                    animation: 'coinSpin3d 3s linear infinite',
                                    filter: 'drop-shadow(0 0 10px rgba(255,180,0,0.5))',
                                }} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '26px',
                                    fontWeight: 900,
                                    fontFamily: '"Syne", sans-serif',
                                    background: 'linear-gradient(90deg, #FFE566, #FF8C00)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    lineHeight: 1,
                                }}>
                                    {WELCOME_BONUS_AMOUNT} Credits
                                </div>
                                <div style={{
                                    color: 'rgba(255,255,255,0.35)',
                                    fontSize: '11px',
                                    marginTop: '4px',
                                    fontFamily: '"DM Sans", sans-serif',
                                    letterSpacing: '0.3px',
                                }}>
                                    Instantly credited • No expiry
                                </div>
                            </div>
                            {/* Corner accent */}
                            <div style={{
                                position: 'absolute', top: '8px', right: '12px',
                                fontSize: '20px', opacity: 0.3,
                                animation: 'sparkle 2s ease-in-out infinite alternate',
                            }}>✦</div>
                        </div>
                    </div>

                    {/* Action area */}
                    <div style={{ padding: '0 28px 28px' }}>
                        {/* Claim button */}
                        <button
                            onClick={handleClaim}
                            disabled={claiming || claimed}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '18px',
                                fontWeight: 800,
                                fontSize: '15px',
                                fontFamily: '"Syne", sans-serif',
                                letterSpacing: '0.5px',
                                border: 'none',
                                cursor: claiming || claimed ? 'default' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                background: claimed
                                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                    : claiming
                                        ? 'linear-gradient(135deg, #b8900a, #c05a00)'
                                        : 'linear-gradient(135deg, #FFE566 0%, #FFB020 50%, #FF6B00 100%)',
                                color: claimed ? '#fff' : '#0a0a0a',
                                boxShadow: claimed
                                    ? '0 4px 24px rgba(34,197,94,0.4)'
                                    : '0 4px 30px rgba(255,160,0,0.45), 0 0 0 1px rgba(255,220,0,0.2)',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                                transform: claiming ? 'scale(0.97)' : 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                                if (!claiming && !claimed) {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 8px 40px rgba(255,160,0,0.6), 0 0 0 1px rgba(255,220,0,0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!claiming && !claimed) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(255,160,0,0.45), 0 0 0 1px rgba(255,220,0,0.2)';
                                }
                            }}
                        >
                            {/* Button shimmer sweep */}
                            {!claimed && !claiming && (
                                <div style={{
                                    position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                                    animation: 'btnShimmer 2.5s ease-in-out infinite',
                                    pointerEvents: 'none',
                                }} />
                            )}
                            {claiming ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)' }}>
                                    <svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                                        <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Claiming…
                                </span>
                            ) : claimed ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    ✅ Claimed! Enjoy your credits 🎊
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <img src={coinSvg} alt="" style={{ width: 18, height: 18, animation: 'coinSpin3d 2s linear infinite' }} />
                                    Claim Your Bonus
                                </span>
                            )}
                        </button>

                        {/* Dismiss */}
                        {!claimed && (
                            <button
                                onClick={onDismiss}
                                style={{
                                    marginTop: '14px',
                                    width: '100%',
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.22)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: '"DM Sans", sans-serif',
                                    transition: 'color 0.15s',
                                    letterSpacing: '0.3px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
                            >
                                Remind me later
                            </button>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* Global keyframes */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@700&display=swap');

                @keyframes backdropIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes arrowNock {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-4px); }
                }
                @keyframes arrowFly {
                    0%   { left: calc(6% + 40px); }
                    100% { left: calc(93% - 208px); }
                }
                @keyframes giftIdle {
                    0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
                    50%      { transform: translateX(-50%) translateY(-5px) scale(1.02); }
                }
                @keyframes giftBurst {
                    0%   { transform: translateX(-50%) scale(1) rotate(0deg); }
                    18%  { transform: translateX(-50%) scale(1.16) rotate(-3deg); filter: brightness(1.8); }
                    38%  { transform: translateX(-50%) scale(0.9) rotate(3deg); }
                    100% { transform: translateX(-50%) scale(1.35) rotate(0deg); opacity: 0; filter: brightness(2.6); }
                }
                @keyframes lidPop {
                    0%   { transform: translateX(-50%) translateY(0) rotate(0deg); }
                    30%  { transform: translateX(-40%) translateY(-46px) rotate(-10deg); }
                    100% { transform: translateX(-30%) translateY(-170px) rotate(-34deg); opacity: 0; }
                }
                @keyframes impactFlash {
                    0%   { transform: scale(0.4); opacity: 1; }
                    100% { transform: scale(6);  opacity: 0; }
                }
                @keyframes impactRing {
                    0%   { transform: scale(0.3); opacity: 0.9; }
                    100% { transform: scale(4);   opacity: 0; }
                }
                @keyframes explodeCoin {
                    0%   { transform: translate(0, 0) rotate(0deg) scale(0.4); opacity: 1; }
                    15%  { opacity: 1; transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2 + var(--arc) * 0.4)) rotate(calc(var(--rot) * 0.2)) scale(1); }
                    70%  { opacity: 1; }
                    100% { transform: translate(var(--tx), calc(var(--ty) + 140px)) rotate(var(--rot)) scale(0.7); opacity: 0; }
                }
                @keyframes textToCenter {
                    0%   { transform: translate(-50%, -50%) translate(min(34vw, 210px), 20px) scale(0.15) rotate(-8deg); opacity: 0; }
                    30%  { opacity: 1; }
                    70%  { transform: translate(-50%, -50%) translate(0, -6px) scale(1.12) rotate(2deg); opacity: 1; }
                    100% { transform: translate(-50%, -50%) translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes introFadeOut {
                    from { opacity: 1; }
                    to   { opacity: 0; }
                }
                @keyframes coinFall {
                    0%   { transform: translateY(-60px) rotate(0deg); opacity: 0.9; }
                    85%  { opacity: 0.8; }
                    100% { transform: translateY(105vh) rotate(540deg); opacity: 0; }
                }
                @keyframes burstCoin {
                    0%   { transform: translate(0, 0) rotate(0deg) scale(0.3); opacity: 1; }
                    60%  { opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.6); opacity: 0; }
                }
                @keyframes burstRing {
                    0%   { transform: scale(0.2); opacity: 0.9; }
                    100% { transform: scale(4);   opacity: 0; }
                }
                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.7) translateY(30px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes coinSpin3d {
                    0%   { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
                @keyframes coinFloat {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-8px); }
                }
                @keyframes haloExpand {
                    0%   { opacity: 0.8; transform: scale(0.8); }
                    100% { opacity: 0;   transform: scale(1.6); }
                }
                @keyframes glowPulse {
                    from { opacity: 0.5; transform: scale(0.9); }
                    to   { opacity: 1;   transform: scale(1.1); }
                }
                @keyframes beamPulse {
                    from { opacity: 0.3; }
                    to   { opacity: 1; }
                }
                @keyframes scanLine {
                    0%   { left: -100%; }
                    100% { left: 200%; }
                }
                @keyframes stripSlide {
                    0%   { background-position: 0% 0%; }
                    100% { background-position: 200% 0%; }
                }
                @keyframes btnShimmer {
                    0%   { left: -100%; }
                    60%, 100% { left: 200%; }
                }
                @keyframes sparkle {
                    from { opacity: 0.2; transform: scale(0.8) rotate(-15deg); }
                    to   { opacity: 0.6; transform: scale(1.3) rotate(15deg); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// ── Snooze helpers ─────────────────────────────────────────────────────────────
const WELCOME_BONUS_SNOOZE_KEY = 'welcome_bonus_snoozed_until';
const SNOOZE_MS = 5 * 60 * 1000; // 5 minutes

export default function WelcomeBonusManager() {
    const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
    const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profileData, setProfileData] = useState<any>(null);

    const isSnoozed = () => {
        const val = localStorage.getItem(WELCOME_BONUS_SNOOZE_KEY);
        return !!val && Date.now() < parseInt(val, 10);
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('user') || 'null');
                const token = userData?.token;
                if (!token) return;

                const resp = await api.get('/personal-details/profile-data', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = resp?.data ?? resp;
                if (data) setProfileData(data);
            } catch (err) {
                console.warn('Failed to load profile data for welcome bonus', err);
            }
        };
        loadProfile();
    }, []);

    useEffect(() => {
        if (!profileData) return;
        if (!profileData.isWelcomeBonusRedeemed && !isSnoozed()) {
            setShowWelcomeBonus(true);
        }
    }, [profileData]);

    const handleDismissBonus = useCallback(() => {
        setShowWelcomeBonus(false);
        localStorage.setItem(WELCOME_BONUS_SNOOZE_KEY, String(Date.now() + SNOOZE_MS));

        if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
        snoozeTimerRef.current = setTimeout(() => {
            setProfileData((prev: any) => {
                if (prev && !prev.isWelcomeBonusRedeemed) {
                    setShowWelcomeBonus(true);
                }
                return prev;
            });
        }, SNOOZE_MS);
    }, []);

    const handleClaimBonus = useCallback(async () => {
        setShowWelcomeBonus(false);
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = userData?.user_id;
        const token = userData?.token;
        try {
            await api.post(`/users/${userId}/claim-welcome-bonus`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            window.location.reload();
        } catch (err) {
            console.error('Failed to claim bonus', err);
        }
        localStorage.removeItem(WELCOME_BONUS_SNOOZE_KEY);
        if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
        window.dispatchEvent(new CustomEvent('credits:refresh'));
    }, []);

    useEffect(() => () => { if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current); }, []);

    if (!showWelcomeBonus || !profileData) return null;

    return (
        <WelcomeBonusModal
            name={profileData.name?.first_name || 'User'}
            onClaim={handleClaimBonus}
            onDismiss={handleDismissBonus}
        />
    );
}