import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Check, Loader, Globe, Database, Zap, Link2 } from 'lucide-react';
import { api } from '../utils/api';
import '../styles/AddProductModal.css';

const STEPS = [
    { icon: Database, label: 'Saving project to dashboard' },
    { icon: Globe,    label: 'Registering MCP connection' },
    { icon: Zap,      label: 'Logging into platform' },
    { icon: Link2,    label: 'Fetching live data' },
];

const empty = {
    name: '', mcpUrl: '', status: 'Active',
    email: '', password: '', description: '', liveUrl: '', gitRepo: '',
};

export default function AddProductModal({ onClose, onAddProject }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ ...empty });
    const [errors, setErrors] = useState({});
    const [phase, setPhase] = useState('form');   // 'form' | 'connecting' | 'done' | 'error'
    const [syncStep, setSyncStep] = useState(-1);  // -1=idle, 0-3=steps, 4=done
    const [syncError, setSyncError] = useState('');
    const [projectId, setProjectId] = useState(null);
    const timerRef = useRef([]);

    // Clean up timers on unmount
    useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => { const n = { ...e }; delete n[k]; return n; });
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim())        e.name = 'Required';
        if (!form.mcpUrl.trim())      e.mcpUrl = 'Required';
        if (!form.email.trim())       e.email = 'Required';
        if (!form.password.trim())    e.password = 'Required';
        if (!form.description.trim()) e.description = 'Required';
        return e;
    };

    const scheduleStep = (step, delay) => {
        const t = setTimeout(() => setSyncStep(step), delay);
        timerRef.current.push(t);
    };

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setPhase('connecting');
        setSyncStep(0);

        try {
            // ── Step 0: Save project to DB ──────────────────────────
            const res = await api('/api/projects', {
                method: 'POST',
                body: JSON.stringify({
                    id: `proj-${Date.now()}`,
                    name: form.name,
                    category: 'Connected Platform',
                    mcpUrl: form.mcpUrl,
                    status: form.status,
                    email: form.email,
                    description: form.description,
                    liveUrl: form.liveUrl || null,
                    gitRepo: form.gitRepo || null,
                    progress: 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save project');

            const pid = data.id;
            setProjectId(pid);

            // ── Steps 1–2: Animate while MCP login runs ──────────────
            scheduleStep(1, 300);
            scheduleStep(2, 1200);

            // ── Step 3: Sync (Playwright login + data fetch) ──────────
            // This can take 15-20s, advance UI to step 3 after 4s regardless
            scheduleStep(3, 4000);

            const syncRes = await api(`/api/projects/${pid}/sync`, {
                method: 'POST',
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            const syncData = await syncRes.json();

            if (!syncRes.ok) {
                // Sync failed but project was saved — still show partial success
                setSyncError(syncData.error || 'Could not fetch live data. You can re-sync later from the project page.');
            }

            // ── Done ──────────────────────────────────────────────────
            setSyncStep(4);
            timerRef.current.push(setTimeout(() => setPhase('done'), 800));

            if (onAddProject) {
                onAddProject({
                    id: pid,
                    name: form.name,
                    category: 'Connected Platform',
                    status: form.status,
                    description: form.description,
                    liveUrl: form.liveUrl,
                    gitRepo: form.gitRepo,
                    progress: 100,
                    kpis: {
                        totalLearners: syncData?.snapshot?.total_learners ?? 0,
                        totalTeams: syncData?.snapshot?.total_teams ?? 0,
                        totalMentors: syncData?.snapshot?.total_mentors ?? 0,
                        newAppsThisMonth: 0,
                        seedDeployed: `₹${syncData?.snapshot?.seed_deployed_lakhs ?? 0}L`,
                    },
                });
            }
        } catch (err) {
            setSyncError(err.message || 'Connection failed');
            setSyncStep(4);
            timerRef.current.push(setTimeout(() => setPhase('error'), 800));
        }
    };

    return createPortal(
        <div className="apm-overlay anim-fade-in" onClick={onClose}>
            <aside className="apm-panel anim-slide-r" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="apm-header">
                    <div>
                        <p className="apm-eyebrow">Integration Wizard</p>
                        <h2 className="apm-title">
                            {phase === 'connecting' ? 'Connecting...' :
                             phase === 'done'       ? 'Connected!' :
                             phase === 'error'      ? 'Connection Failed' :
                                                      'Connect New Project'}
                        </h2>
                    </div>
                    <button className="apm-close" onClick={onClose} aria-label="Close"
                        disabled={phase === 'connecting'}>
                        <X size={16} />
                    </button>
                </div>

                <div className="apm-divider" />

                {/* ── Form ── */}
                {phase === 'form' && (
                    <form className="apm-form" onSubmit={submit} noValidate>
                        <div className="apm-scroll">
                            <div className="apm-row">
                                <Field label="Project Name" required error={errors.name}>
                                    <input className={`apm-input ${errors.name ? 'apm-input--err' : ''}`}
                                        placeholder="e.g. EduTech Ventures" value={form.name}
                                        onChange={e => set('name', e.target.value)} />
                                </Field>
                                <Field label="Status">
                                    <select className="apm-input apm-select"
                                        value={form.status} onChange={e => set('status', e.target.value)}>
                                        <option value="Active">Active</option>
                                        <option value="Planning">Planning</option>
                                        <option value="Beta">Beta</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="Platform URL" required error={errors.mcpUrl}>
                                <input className={`apm-input ${errors.mcpUrl ? 'apm-input--err' : ''}`}
                                    placeholder="https://yourplatform.com" value={form.mcpUrl}
                                    onChange={e => set('mcpUrl', e.target.value)} />
                                <p className="apm-hint">The base URL of the platform to connect (e.g. startupvarsity.com)</p>
                            </Field>

                            <div className="apm-row">
                                <Field label="Admin Email" required error={errors.email}>
                                    <input type="email" className={`apm-input ${errors.email ? 'apm-input--err' : ''}`}
                                        placeholder="admin@platform.com" value={form.email}
                                        onChange={e => set('email', e.target.value)} />
                                </Field>
                                <Field label="Admin Password" required error={errors.password}>
                                    <input type="password" className={`apm-input ${errors.password ? 'apm-input--err' : ''}`}
                                        placeholder="••••••••" value={form.password}
                                        onChange={e => set('password', e.target.value)} />
                                </Field>
                            </div>

                            <Field label="Short Description" required error={errors.description}>
                                <textarea
                                    className={`apm-input apm-textarea ${errors.description ? 'apm-input--err' : ''}`}
                                    placeholder="Brief description of the project…"
                                    rows={3} value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                />
                            </Field>

                            <div className="apm-row">
                                <Field label="Live URL (Optional)">
                                    <input className="apm-input"
                                        placeholder="https://yourapp.com" value={form.liveUrl}
                                        onChange={e => set('liveUrl', e.target.value)} />
                                </Field>
                                <Field label="Git Repository (Optional)">
                                    <input className="apm-input"
                                        placeholder="https://github.com/..." value={form.gitRepo}
                                        onChange={e => set('gitRepo', e.target.value)} />
                                </Field>
                            </div>
                        </div>

                        <div className="apm-footer">
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-solid">Connect Platform</button>
                        </div>
                    </form>
                )}

                {/* ── Live Progress ── */}
                {phase === 'connecting' && (
                    <div className="apm-progress">
                        <p className="apm-progress-title">Establishing connection to <strong>{form.name}</strong></p>
                        <p className="apm-progress-sub">This may take up to 30 seconds while we log in and pull data…</p>

                        <div className="apm-steps">
                            {STEPS.map((step, i) => {
                                const Icon = step.icon;
                                const state = syncStep < i ? 'pending'
                                            : syncStep === i ? 'active'
                                            : 'done';
                                return (
                                    <div key={i} className={`apm-step apm-step--${state}`}>
                                        <div className="apm-step-icon">
                                            {state === 'done'   ? <Check size={16} /> :
                                             state === 'active' ? <Loader size={16} className="apm-spin" /> :
                                                                  <Icon size={16} />}
                                        </div>
                                        <span className="apm-step-label">{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="apm-progress-bar-wrap">
                            <div className="apm-progress-bar"
                                style={{ width: `${Math.min(syncStep / STEPS.length * 100, 95)}%` }} />
                        </div>
                    </div>
                )}

                {/* ── Success ── */}
                {phase === 'done' && (
                    <div className="apm-success anim-scale-in">
                        <div className="apm-success-icon">
                            <Check size={28} />
                        </div>
                        <h3 className="apm-success-title">Connection Successful</h3>
                        <p className="apm-success-desc">
                            <strong>{form.name}</strong> is now connected to the Chairman Dashboard.
                            Live data is syncing automatically.
                        </p>
                        {syncError && (
                            <p className="apm-sync-warn">⚠ {syncError}</p>
                        )}
                        <button className="btn btn-solid apm-success-btn" onClick={() => {
                            onClose();
                            navigate(`/project/${projectId}`);
                        }}>View Project</button>
                    </div>
                )}

                {/* ── Error ── */}
                {phase === 'error' && (
                    <div className="apm-success anim-scale-in">
                        <div className="apm-success-icon" style={{ background: 'var(--c-red-bg)', color: 'var(--c-red)', borderColor: 'rgba(224,49,49,0.2)' }}>
                            <X size={28} />
                        </div>
                        <h3 className="apm-success-title">Connection Failed</h3>
                        <p className="apm-success-desc">{syncError}</p>
                        <button className="btn btn-ghost apm-success-btn" onClick={() => setPhase('form')}>
                            Try Again
                        </button>
                    </div>
                )}

            </aside>
        </div>,
        document.body
    );
}

function Field({ label, required, error, children }) {
    return (
        <div className="apm-field">
            <label className="apm-label">
                {label}
                {required && <span className="apm-req" aria-hidden>*</span>}
            </label>
            {children}
            {error && <p className="apm-err">{error}</p>}
        </div>
    );
}
