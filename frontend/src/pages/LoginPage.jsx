import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useUser } from '../context/UserContext';
import '../styles/LoginPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useUser();
    const logoUrl = `${import.meta.env.BASE_URL}rooman-logo.png`;
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError('Please fill in both fields.'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Invalid credentials.');
                return;
            }

            login(data.token, data.user);
            navigate('/dashboard');
        } catch {
            setError('Cannot connect to server. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lp-root">
            <div className="lp-bg-wrapper">
                <img
                    src={logoUrl}
                    className="lp-bg-image lp-bg-logo"
                    alt="Rooman Background"
                />
                <div className="lp-bg-overlay"></div>
            </div>

            <div className="lp-centered-content">
                <div className="lp-form-wrap anim-scale-in">
                    <div className="lp-brand anim-fade-up">
                        <img src={logoUrl} className="lp-brand-logo" alt="Rooman Logo" />
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
                                    placeholder="username"
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
