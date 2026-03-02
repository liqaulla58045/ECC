import { useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/AddProductModal.css';

const empty = { name: '', mcpUrl: '', status: 'Active', email: '', password: '', description: '' };

export default function AddProductModal({ onClose, onAddProject }) {
    const [form, setForm] = useState({ ...empty });
    const [errors, setErrors] = useState({});
    const [done, setDone] = useState(false);
    const [connecting, setConnecting] = useState(false);

    const set = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => { const n = { ...e }; delete n[k]; return n; });
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.mcpUrl.trim()) e.mcpUrl = 'Required';
        if (!form.email.trim()) e.email = 'Required';
        if (!form.password.trim()) e.password = 'Required';
        if (!form.description.trim()) e.description = 'Required';
        return e;
    };

    const submit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setConnecting(true);

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to connect');

            if (onAddProject) {
                // Return a structure matching what Dashboard expects for hydrated cards
                onAddProject({
                    id: data.project.id,
                    name: form.name,
                    category: 'CONNECTED PLATFORM',
                    status: form.status,
                    description: form.description,
                    progress: 100,
                    startDate: 'Active',
                    endDate: 'Present',
                    kpis: { totalLearners: 0, totalTeams: 0, totalMentors: 0, newAppsThisMonth: 0, seedDeployed: '₹0' }
                });
            }
            setDone(true);
        } catch (err) {
            setErrors({ mcpUrl: err.message });
        } finally {
            setConnecting(false);
        }
    };

    return createPortal(
        <div className="apm-overlay anim-fade-in" onClick={onClose}>

            {/* Slide-in panel */}
            <aside className="apm-panel anim-slide-r" onClick={e => e.stopPropagation()}>

                {/* Panel header */}
                <div className="apm-header">
                    <div>
                        <p className="apm-eyebrow">Integration Wizard</p>
                        <h2 className="apm-title">Connect New Project</h2>
                    </div>
                    <button className="apm-close" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Divider */}
                <div className="apm-divider" />

                {/* Success state */}
                {done ? (
                    <div className="apm-success anim-scale-in">
                        <div className="apm-success-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h3 className="apm-success-title">Connection Successful</h3>
                        <p className="apm-success-desc">
                            <strong>{form.name}</strong> has been integrated. Its data will now sync to the Chairman Dashboard.
                        </p>
                        <button className="btn btn-solid apm-success-btn" onClick={onClose}>Done</button>
                    </div>
                ) : (

                    /* Form */
                    <form className="apm-form" onSubmit={submit} noValidate>
                        <div className="apm-scroll">

                            {/* Row 1: name + status */}
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

                            {/* Row 2: MCP Server details */}
                            <Field label="MCP Server URL" required error={errors.mcpUrl}>
                                <input className={`apm-input ${errors.mcpUrl ? 'apm-input--err' : ''}`}
                                    placeholder="https://api.yourproject.com/mcp" value={form.mcpUrl}
                                    onChange={e => set('mcpUrl', e.target.value)} />
                            </Field>

                            <div className="apm-row">
                                <Field label="Admin Email" required error={errors.email}>
                                    <input type="email" className={`apm-input ${errors.email ? 'apm-input--err' : ''}`}
                                        placeholder="admin@project.com" value={form.email}
                                        onChange={e => set('email', e.target.value)} />
                                </Field>
                                <Field label="Admin Password" required error={errors.password}>
                                    <input type="password" className={`apm-input ${errors.password ? 'apm-input--err' : ''}`}
                                        placeholder="••••••••" value={form.password}
                                        onChange={e => set('password', e.target.value)} />
                                </Field>
                            </div>



                            {/* Description */}
                            <Field label="Short Description" required error={errors.description}>
                                <textarea
                                    className={`apm-input apm-textarea ${errors.description ? 'apm-input--err' : ''}`}
                                    placeholder="Brief description of the project…"
                                    rows={3} value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                />
                            </Field>

                        </div>

                        {/* Footer actions */}
                        <div className="apm-footer">
                            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={connecting}>Cancel</button>
                            <button type="submit" className="btn btn-solid" disabled={connecting}>
                                {connecting ? 'Connecting...' : 'Connect Server'}
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
