import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Check, Loader, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '../utils/api';
import '../styles/AddProductModal.css';

const empty = {
    name: '', mcpUrl: '', statsPath: '/api/admin/stats', status: 'Active',
    email: '', password: '', description: '', liveUrl: '', gitRepo: '',
};

export default function AddProductModal({ onClose, onAddProject }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ ...empty });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [projectId, setProjectId] = useState(null);
    const [saveError, setSaveError] = useState('');
    const [generatingDesc, setGeneratingDesc] = useState(false);

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => { const n = { ...e }; delete n[k]; return n; });
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim())   e.name   = 'Required';
        if (!form.mcpUrl.trim()) e.mcpUrl = 'Required';
        return e;
    };

    const generateDescription = async (url) => {
        const trimmed = url?.trim().replace(/\/+$/, '');
        if (!trimmed) return;
        setGeneratingDesc(true);
        try {
            const res = await api('/api/projects/describe', {
                method: 'POST',
                body: JSON.stringify({ url: trimmed }),
            });
            const data = await res.json();
            if (data.description) set('description', data.description);
        } catch {
            // silently fail — user can type manually
        } finally {
            setGeneratingDesc(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        setSaveError('');

        try {
            const pid = `proj-${Date.now()}`;
            const res = await api('/api/projects', {
                method: 'POST',
                body: JSON.stringify({
                    id: pid,
                    name: form.name,
                    category: 'Connected Platform',
                    mcpUrl: form.mcpUrl.trim().replace(/\/+$/, ''),
                    statsPath: form.statsPath.trim() || '/api/admin/stats',
                    status: form.status,
                    email: form.email || null,
                    description: form.description,
                    liveUrl: form.liveUrl || null,
                    gitRepo: form.gitRepo || null,
                    progress: 0,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save project');

            setProjectId(data.id);

            if (onAddProject) {
                onAddProject({
                    id: data.id,
                    name: form.name,
                    category: 'Connected Platform',
                    status: form.status,
                    description: form.description,
                    liveUrl: form.liveUrl,
                    gitRepo: form.gitRepo,
                    progress: 0,
                    kpis: { totalLearners: 0, totalTeams: 0, totalMentors: 0, totalApplications: 0 },
                });
            }

            setDone(true);
        } catch (err) {
            setSaveError(err.message || 'Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="apm-overlay anim-fade-in" onClick={onClose}>
            <aside className="apm-panel anim-slide-r" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="apm-header">
                    <div>
                        <p className="apm-eyebrow">Add Project</p>
                        <h2 className="apm-title">
                            {done ? 'Project Added!' : 'Connect New Project'}
                        </h2>
                    </div>
                    <button className="apm-close" onClick={onClose} aria-label="Close"
                        disabled={saving}>
                        <X size={16} />
                    </button>
                </div>

                <div className="apm-divider" />

                {/* ── Success ── */}
                {done && (
                    <div className="apm-success anim-scale-in">
                        <div className="apm-success-icon">
                            <Check size={28} />
                        </div>
                        <h3 className="apm-success-title">Project Added</h3>
                        <p className="apm-success-desc">
                            <strong>{form.name}</strong> is now on your dashboard.
                            Use <strong>Sync Now</strong> on the project page to pull live data when your platform supports it.
                        </p>
                        <button className="btn btn-solid apm-success-btn" onClick={() => {
                            onClose();
                            navigate(`/project/${projectId}`);
                        }}>View Project</button>
                    </div>
                )}

                {/* ── Form ── */}
                {!done && (
                    <form className="apm-form" onSubmit={submit} noValidate>
                        <div className="apm-scroll">

                            <div className="apm-row">
                                <Field label="Project Name" required error={errors.name}>
                                    <input className={`apm-input ${errors.name ? 'apm-input--err' : ''}`}
                                        placeholder="e.g. Rooman CRM" value={form.name}
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
                                    onChange={e => set('mcpUrl', e.target.value)}
                                    onBlur={e => generateDescription(e.target.value)} />
                            </Field>

                            <Field label="Stats API Path">
                                <input className="apm-input"
                                    placeholder="/api/admin/stats" value={form.statsPath}
                                    onChange={e => set('statsPath', e.target.value)} />
                                <p className="apm-hint">API endpoint that returns platform stats (e.g. /api/dashboard/stats, /api/admin/stats)</p>
                            </Field>

                            <div className="apm-row">
                                <Field label="Admin Email (Optional)">
                                    <input type="email" className="apm-input"
                                        placeholder="admin@platform.com" value={form.email}
                                        onChange={e => set('email', e.target.value)} />
                                </Field>
                                <Field label="Admin Password (Optional)">
                                    <input type="password" className="apm-input"
                                        placeholder="••••••••" value={form.password}
                                        onChange={e => set('password', e.target.value)} />
                                </Field>
                            </div>

                            <Field label="Short Description">
                                <div style={{ position: 'relative' }}>
                                    <textarea
                                        className="apm-input apm-textarea"
                                        placeholder={generatingDesc ? 'Generating from URL…' : 'Enter a URL above to auto-generate…'}
                                        rows={3} value={form.description}
                                        onChange={e => set('description', e.target.value)}
                                        disabled={generatingDesc}
                                    />
                                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                                        {generatingDesc
                                            ? <Loader size={13} className="apm-spin" style={{ color: 'var(--c-accent)' }} />
                                            : form.description
                                                ? <><Sparkles size={12} style={{ color: 'var(--c-accent)', opacity: 0.7 }} />
                                                    <button type="button" title="Regenerate"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--c-accent)', opacity: 0.7 }}
                                                        onClick={() => generateDescription(form.mcpUrl)}>
                                                        <RefreshCw size={12} />
                                                    </button></>
                                                : null
                                        }
                                    </div>
                                </div>
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

                            {saveError && <p className="apm-err" style={{ marginTop: 4 }}>⚠ {saveError}</p>}

                        </div>

                        <div className="apm-footer">
                            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-solid" disabled={saving}>
                                {saving
                                    ? <><Loader size={14} className="apm-spin" /> Saving…</>
                                    : 'Add Project'}
                            </button>
                        </div>
                    </form>
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
