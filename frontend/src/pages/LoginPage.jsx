import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [time, setTime] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError('Please fill in both fields.'); return; }
        if (username === 'chairman' && password === 'chairman@123') {
            setLoading(true);
            setTimeout(() => navigate('/dashboard'), 1400);
        } else {
            setError('Incorrect credentials. Hint: chairman / chairman@123');
        }
    };

    return (
        <div className="lp-root">
            {/* Left panel — visual */}
            <div className="lp-left">
                <AnimatedCanvas />
                <div className="lp-left-content">
                    <div className="lp-brand anim-fade-up">
                        <div className="lp-brand-mark">ECC</div>
                        <span className="lp-brand-name">Enterprise Command Center</span>
                    </div>
                    <div className="lp-stat-panel anim-fade-up delay-2">
                        <StatTile label="Active Projects" value="4" delta="+1 this quarter" />
                        <StatTile label="Total Leads" value="4,646" delta="+504 this month" />
                        <StatTile label="Revenue" value="₹92.1L" delta="+18% YoY" />
                    </div>
                    <p className="lp-tagline anim-fade-up delay-4">
                        "Decision clarity at the speed of business."
                    </p>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="lp-right">
                <div className="lp-form-wrap anim-scale-in">
                    <div className="lp-time">{time}</div>
                    <h1 className="lp-title">Chairman Access</h1>
                    <p className="lp-sub">Sign in to your executive portal</p>

                    <form className="lp-form" onSubmit={handleLogin} noValidate>
                        <div className="lp-field">
                            <label className="lp-label" htmlFor="uname">Username</label>
                            <input
                                id="uname"
                                className={`lp-input ${error ? 'lp-input--err' : ''}`}
                                type="text"
                                placeholder="e.g. chairman"
                                value={username}
                                onChange={e => { setUsername(e.target.value); setError(''); }}
                                autoComplete="username"
                                autoFocus
                            />
                        </div>

                        <div className="lp-field">
                            <label className="lp-label" htmlFor="pw">Password</label>
                            <div className="lp-pw-wrap">
                                <input
                                    id="pw"
                                    className={`lp-input ${error ? 'lp-input--err' : ''}`}
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    autoComplete="current-password"
                                />
                                <button type="button" className="lp-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                                    {showPw ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <p className="lp-error" role="alert">{error}</p>}

                        <button type="submit" className={`lp-submit btn btn-solid ${loading ? 'lp-submit--loading' : ''}`} disabled={loading}>
                            {loading ? <span className="lp-loader" /> : 'Sign in'}
                        </button>
                    </form>

                    <p className="lp-hint">Demo: <code>chairman</code> / <code>chairman@123</code></p>
                </div>
            </div>
        </div>
    );
}

function StatTile({ label, value, delta }) {
    return (
        <div className="lp-stat-tile">
            <p className="lp-stat-val">{value}</p>
            <p className="lp-stat-label">{label}</p>
            <p className="lp-stat-delta">{delta}</p>
        </div>
    );
}

function AnimatedCanvas() {
    return (
        <div className="lp-canvas" aria-hidden>
            <svg className="lp-canvas-svg" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <radialGradient id="glow1" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#7B70E8" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0B0B0F" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow2" cx="70%" cy="70%" r="50%">
                        <stop offset="0%" stopColor="#34C97A" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect width="600" height="700" fill="#0B0B0F" />
                <rect width="600" height="700" fill="url(#glow1)" />
                <rect width="600" height="700" fill="url(#glow2)" />

                {/* Grid lines */}
                {[...Array(12)].map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 60} x2="600" y2={i * 60}
                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                {[...Array(10)].map((_, i) => (
                    <line key={`v${i}`} x1={i * 66} y1="0" x2={i * 66} y2="700"
                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}

                {/* Animated accent lines */}
                <line className="lp-draw-line" x1="80" y1="200" x2="520" y2="200"
                    stroke="#7B70E8" strokeWidth="1" strokeOpacity="0.4"
                    strokeDasharray="1000" strokeDashoffset="1000" />
                <line className="lp-draw-line lp-draw-delay" x1="80" y1="350" x2="520" y2="350"
                    stroke="#34C97A" strokeWidth="1" strokeOpacity="0.3"
                    strokeDasharray="1000" strokeDashoffset="1000" />

                {/* Dot grid */}
                {[...Array(8)].map((_, row) =>
                    [...Array(10)].map((_, col) => (
                        <circle key={`d${row}-${col}`}
                            cx={30 + col * 60} cy={80 + row * 80}
                            r="1.5"
                            fill="rgba(255,255,255,0.15)"
                            className="lp-dot"
                            style={{ animationDelay: `${(row * 10 + col) * 0.04}s` }}
                        />
                    ))
                )}

                {/* Main ring */}
                <circle cx="300" cy="310" r="140" fill="none"
                    stroke="rgba(123,112,232,0.12)" strokeWidth="1" />
                <circle cx="300" cy="310" r="140" fill="none"
                    stroke="rgba(123,112,232,0.45)" strokeWidth="1"
                    strokeDasharray="880" strokeDashoffset="880"
                    className="lp-ring" />

                {/* Inner ring */}
                <circle cx="300" cy="310" r="90" fill="none"
                    stroke="rgba(52,201,122,0.18)" strokeWidth="1" />

                {/* Centre node */}
                <circle cx="300" cy="310" r="8" fill="#7B70E8" fillOpacity="0.7" className="lp-pulse-node" />
                <circle cx="300" cy="310" r="18" fill="rgba(123,112,232,0.15)" className="lp-pulse-ring" />

                {/* Orbit nodes */}
                {[0, 72, 144, 216, 288].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 300 + 140 * Math.cos(rad);
                    const y = 310 + 140 * Math.sin(rad);
                    return (
                        <g key={i}>
                            <line x1="300" y1="310" x2={x} y2={y}
                                stroke="rgba(123,112,232,0.15)" strokeWidth="1"
                                strokeDasharray="4 4" />
                            <circle cx={x} cy={y} r="5" fill="rgba(123,112,232,0.6)"
                                className="lp-orbit-node"
                                style={{ animationDelay: `${i * 0.3}s` }} />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
