import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
            {/* Full Screen Background Wrapper */}
            <div className="lp-bg-wrapper">
                <img
                    src="/executive_office_login_bg_1773033747510.png"
                    className="lp-bg-image"
                    alt="Executive Workspace"
                />
                <div className="lp-bg-overlay"></div>
            </div>

            {/* Centered Login Card */}
            <div className="lp-centered-content">
                <div className="lp-form-wrap anim-scale-in">
                    <div className="lp-brand anim-fade-up">
                        <div className="lp-brand-mark">ECC</div>
                        <span className="lp-brand-name">Enterprise Command Center</span>
                    </div>

                    <div className="lp-card">
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
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="lp-error" role="alert">{error}</p>}

                            <button type="submit" className={`lp-submit btn btn-solid ${loading ? 'lp-submit--loading' : ''}`} disabled={loading}>
                                {loading ? <span className="lp-loader" /> : 'Sign in'}
                            </button>
                        </form>
                    </div>

                    <p className="lp-tagline anim-fade-up delay-4">
                        "Clarity in oversight, precision in execution."
                    </p>
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
