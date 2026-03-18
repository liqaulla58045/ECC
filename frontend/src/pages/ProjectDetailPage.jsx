import { useState, useEffect, useRef } from 'react';

// ── Count-up animation hook ─────────────────────────
function useCountUp(target, delay = 0) {
    const [val, setVal] = useState(0);
    const rafRef = useRef(null);
    useEffect(() => {
        const num = Number(target);
        if (!num || isNaN(num)) { setVal(0); return; }
        let startTs = null;
        const duration = Math.min(1600, 800 + num * 0.3);
        const step = (ts) => {
            if (!startTs) startTs = ts + delay;
            if (ts < startTs) { rafRef.current = requestAnimationFrame(step); return; }
            const p = Math.min((ts - startTs) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setVal(Math.round(eased * num));
            if (p < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, delay]);
    return val;
}
import { useParams, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    ChevronLeft, Calendar,
    Users, Layers, Target, Activity, AlertCircle,
    RefreshCw, CheckCircle, Trash2, Zap, TrendingUp, BookOpen,
    Award, DollarSign, BarChart2, Globe, ArrowUpRight, Clock, Github
} from 'lucide-react';
import { apiJson, api } from '../utils/api';
import '../styles/ProjectDetailPage.css';

// ── Static KPI map for known SV fields ─────────────────────────────
const KPI_META = [
    { key: 'total_learners',           label: 'Total Learners',    icon: Users,       color: '#1C7ED6', bg: '#E7F5FF' },
    { key: 'total_teams',              label: 'Active Teams',      icon: BookOpen,    color: '#2B8A3E', bg: '#EBFBEE' },
    { key: 'total_mentors',            label: 'Mentors',           icon: Award,       color: '#6741D9', bg: '#F3F0FF' },
    { key: 'total_applications',       label: 'Applications',      icon: TrendingUp,  color: '#E67700', bg: '#FFF3BF' },
    { key: 'active_cohorts',           label: 'Active Cohorts',    icon: Zap,         color: '#0CA678', bg: '#E6FCF5' },
    { key: 'seed_deployed_lakhs',      label: 'Seed Deployed',     icon: DollarSign,  color: '#E03131', bg: '#FFF5F5', prefix: '₹', suffix: 'L' },
    { key: 'stipends_disbursed_lakhs', label: 'Stipends',          icon: BarChart2,   color: '#1971C2', bg: '#E7F5FF', prefix: '₹', suffix: 'L' },
    { key: 'placement_rate',           label: 'Placement Rate',    icon: Target,      color: '#862E9C', bg: '#F8F0FC', suffix: '%' },
];

// ── Skip these keys when building dynamic cards ─────────────────────
const SKIP_KEYS = new Set([
    'id', 'project_id', 'snapshotted_at', 'created_at', 'updated_at',
    'raw_data', 'total_users',
]);

const CARD_COLORS = [
    '#1C7ED6','#2B8A3E','#6741D9','#E67700','#0CA678',
    '#E03131','#1971C2','#862E9C','#D9480F','#087F5B',
];
const CARD_BGS = [
    '#E7F5FF','#EBFBEE','#F3F0FF','#FFF3BF','#E6FCF5',
    '#FFF5F5','#E7F5FF','#F8F0FC','#FFF4E6','#E6FCF5',
];

function iconForKey(key) {
    const k = key.toLowerCase();
    if (k.match(/user|student|member|person/))         return Users;
    if (k.match(/learn|course|enroll|trainee/))        return BookOpen;
    if (k.match(/team|group|batch|squad/))             return Layers;
    if (k.match(/mentor|coach|trainer|instructor/))    return Award;
    if (k.match(/applic|request|submiss|registr/))     return TrendingUp;
    if (k.match(/cohort|program|sprint|session/))      return Zap;
    if (k.match(/seed|fund|invest|grant/))             return DollarSign;
    if (k.match(/stipend|salary|pay|disburs/))         return BarChart2;
    if (k.match(/placement|job|hire|employ/))          return Target;
    if (k.match(/lead|prospect|contact|pipeline/))     return TrendingUp;
    if (k.match(/revenue|sale|deal|income|earning/))   return DollarSign;
    if (k.match(/rate|percent|ratio|score/))           return Target;
    if (k.match(/active|current|live|running/))        return Activity;
    if (k.match(/complet|finish|grad|certif/))         return CheckCircle;
    if (k.match(/notif|alert|message/))                return AlertCircle;
    return BarChart2;
}

function labelForKey(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

function formatKpiValue(val, key) {
    if (val == null) return '—';
    const k = key.toLowerCase();
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (k.match(/lakh|lakhs/))                     return `₹${num.toLocaleString()}L`;
    if (k.match(/amount|revenue|salary|earning/))  return `₹${num.toLocaleString()}`;
    if (k.match(/rate|percent|ratio|score/))       return `${num.toFixed(1)}%`;
    return num.toLocaleString();
}

// Build KPI list: use raw_data if available, else fall back to fixed KPI_META
function buildKpiList(stats) {
    if (!stats) return [];
    const raw = stats.raw_data;
    if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
        // Dynamic: render cards from raw API response
        return Object.entries(raw)
            .filter(([k, v]) =>
                !SKIP_KEYS.has(k) &&
                v != null &&
                (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))
            )
            .map(([key, val], i) => ({
                key,
                label: labelForKey(key),
                value: formatKpiValue(val, key),
                icon: iconForKey(key),
                color: CARD_COLORS[i % CARD_COLORS.length],
                bg: CARD_BGS[i % CARD_BGS.length],
                raw: Number(val),
            }));
    }
    // Fallback: SV fixed fields
    return KPI_META
        .map(({ key, label, icon, color, bg, prefix = '', suffix = '' }) => {
            const raw = stats[key];
            if (raw == null) return null;
            return {
                key, label, icon, color, bg, raw: Number(raw),
                value: raw != null ? `${prefix}${Number(raw).toLocaleString()}${suffix}` : '—',
            };
        })
        .filter(Boolean);
}

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);
    const [stats, setStats] = useState(null);
    const [teams, setTeams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [monthlyMetrics, setMonthlyMetrics] = useState([]);
    const [products, setProducts] = useState([]);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');

    useEffect(() => {
        async function fetchAll() {
            setLoading(true); setError(null);
            try {
                const [projData, statsData, teamsData, notifsData, metricsData, productsData] =
                    await Promise.allSettled([
                        apiJson(`/api/projects/${id}`),
                        apiJson(`/api/projects/${id}/stats`),
                        apiJson(`/api/teams?projectId=${id}`),
                        apiJson(`/api/notifications?projectId=${id}`),
                        apiJson(`/api/analytics/monthly?projectId=${id}`),
                        apiJson(`/api/problem-statements?projectId=${id}&status=Published`),
                    ]);
                if (projData.status === 'rejected') throw new Error('Project not found.');
                setProject(projData.value);
                setStats(statsData.status === 'fulfilled' ? statsData.value : null);
                setTeams(teamsData.status === 'fulfilled' ? (teamsData.value || []) : []);
                setNotifications(notifsData.status === 'fulfilled' ? (notifsData.value || []) : []);
                setMonthlyMetrics(metricsData.status === 'fulfilled' ? (metricsData.value || []) : []);
                setProducts(productsData.status === 'fulfilled' ? (productsData.value || []) : []);
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        }
        fetchAll();
    }, [id]);

    const handleSync = async () => {
        const password = prompt(`Enter admin password for ${project?.name || 'this project'} to sync live data:`);
        if (!password) return;
        setSyncing(true); setSyncMsg('');
        try {
            const res = await apiJson(`/api/projects/${id}/sync`, {
                method: 'POST',
                body: JSON.stringify({ email: project?.email, password }),
            });
            if (res.success) {
                setStats(res.snapshot || stats);
                setSyncMsg('Synced!');
            } else if (res.loginFailed) {
                setSyncMsg('Login failed');
                alert(`Sync failed: ${res.warning}\n\nCheck:\n• Platform URL is correct\n• Admin email & password are correct\n• The platform has a /login page`);
            } else {
                setSyncMsg('No data');
                alert(`Sync warning: ${res.warning}\n\nThe Stats API Path may be wrong. Try editing the project and updating the Stats API Path.`);
            }
        } catch (err) { setSyncMsg('Error'); }
        finally { setSyncing(false); setTimeout(() => setSyncMsg(''), 5000); }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Remove "${project?.name}" from the dashboard?\n\nThis cannot be undone.`)) return;
        try {
            const res = await api(`/api/projects/${id}`, { method: 'DELETE' });
            if (res.ok) navigate('/projects');
            else { const d = await res.json(); alert(d.error || 'Delete failed'); }
        } catch { alert('Could not connect to server.'); }
    };

    const healthSummary = teams.reduce(
        (acc, t) => {
            const s = (t.health_status || '').toLowerCase();
            if (s === 'green') acc.green++;
            else if (s === 'amber') acc.amber++;
            else if (s === 'red') acc.red++;
            acc.total++;
            return acc;
        },
        { green: 0, amber: 0, red: 0, total: 0 }
    );
    const healthScore = healthSummary.total > 0
        ? Math.round((healthSummary.green / healthSummary.total) * 100) : null;

    const leadsData   = monthlyMetrics.map(m => ({ month: m.month, leads: Number(m.leads) || 0 }));
    const revenueData = monthlyMetrics.map(m => ({ month: m.month, revenue: Number(m.revenue_lakhs) || 0 }));

    if (loading) return (
        <div className="pdp-loader">
            <div className="pdp-loader-spinner" />
            <p>Loading project…</p>
        </div>
    );
    if (error || !project) return (
        <div className="pdp-loader" style={{ color: 'var(--c-red)' }}>⚠ {error || 'Project not found'}</div>
    );

    const statusColor = project.status?.toLowerCase() === 'active' ? '#2B8A3E'
        : project.status?.toLowerCase() === 'beta' ? '#6741D9' : '#E67700';

    return (
        <div className="pdp-root">

            {/* ── TOP NAV ── */}
            <nav className="pdp-nav">
                <button className="pdp-back" onClick={() => navigate('/projects')}>
                    <ChevronLeft size={16} /> Back
                </button>
                <div className="pdp-nav-center">
                    <span className="pdp-nav-dot" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                    <span className="pdp-nav-status" style={{ color: statusColor }}>{project.status}</span>
                    <span className="pdp-nav-sep">·</span>
                    <span className="pdp-nav-cat">{project.category}</span>
                </div>
                <div className="pdp-nav-actions">
                    {project.mcp_url && (
                        <button className={`pdp-action-btn ${syncing ? 'pdp-action-btn--loading' : ''}`}
                            onClick={handleSync} disabled={syncing} title="Sync live data">
                            <RefreshCw size={14} className={syncing ? 'pdp-spin' : ''} />
                            <span>{syncing ? 'Syncing…' : syncMsg || 'Sync'}</span>
                        </button>
                    )}
                    {project.live_url && (
                        <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                            className="pdp-action-btn pdp-action-btn--primary">
                            <Globe size={14} /> <span>Live Site</span>
                        </a>
                    )}
                    {project.git_repo && (
                        <a href={project.git_repo} target="_blank" rel="noopener noreferrer"
                            className="pdp-action-btn">
                            <Github size={14} /> <span>Repo</span>
                        </a>
                    )}
                    <button className="pdp-action-btn pdp-action-btn--danger" onClick={handleDelete} title="Remove">
                        <Trash2 size={14} />
                    </button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <header className="pdp-hero">
                {/* Animated background orbs */}
                <div className="pdp-orb pdp-orb-1" />
                <div className="pdp-orb pdp-orb-2" />
                <div className="pdp-orb pdp-orb-3" />

                <div className="pdp-hero-body">
                    <div className="pdp-hero-left">
                        <div className="pdp-hero-badge" style={{ borderColor: `${statusColor}30`, background: `${statusColor}10`, color: statusColor }}>
                            <span className="pdp-hero-pulse" style={{ background: statusColor }} />
                            Connected Platform
                        </div>
                        <h1 className="pdp-hero-title">{project.name}</h1>
                        <p className="pdp-hero-desc">{project.description}</p>
                        <div className="pdp-hero-meta-row">
                            <span className="pdp-meta-chip">
                                <Calendar size={13} />
                                {project.start_date || '—'} — {project.end_date || 'Present'}
                            </span>
                            {project.mcp_url && (
                                <span className="pdp-meta-chip">
                                    <Globe size={13} />
                                    {project.mcp_url.replace(/^https?:\/\//, '')}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="pdp-hero-right">
                        <div className="pdp-progress-card">
                            <div className="pdp-progress-header">
                                <Target size={16} />
                                <span>Project Goal</span>
                            </div>
                            <div className="pdp-progress-number">{project.progress}%</div>
                            <div className="pdp-progress-track">
                                <div className="pdp-progress-fill"
                                    style={{ width: `${project.progress}%`, background: statusColor }} />
                            </div>
                            {healthScore !== null && (
                                <div className="pdp-progress-foot">
                                    <span style={{ color: '#2B8A3E' }}>● {healthScore}% health</span>
                                    <span style={{ color: 'var(--c-text-3)' }}>{healthSummary.total} teams</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── HERO STATS STRIP ── */}
                {stats && buildKpiList(stats).length > 0 && (
                    <div className="pdp-hero-strip" style={{ gridTemplateColumns: `repeat(${Math.min(buildKpiList(stats).length, 6)}, 1fr)` }}>
                        {buildKpiList(stats).slice(0, 6).map(({ key, label, value, color }) => (
                            <div key={key} className="pdp-strip-item">
                                <span className="pdp-strip-val" style={{ color }}>{value}</span>
                                <span className="pdp-strip-lbl">{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </header>

            {/* ── TABS ── */}
            <div className="pdp-tabs">
                {['Overview', 'Analytics', 'Team', 'Products'].map(tab => (
                    <button key={tab}
                        className={`pdp-tab ${activeTab === tab ? 'pdp-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        style={activeTab === tab ? { '--tab-color': statusColor } : {}}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── CONTENT ── */}
            <main className="pdp-main" key={activeTab}>

                {/* OVERVIEW */}
                {activeTab === 'Overview' && (
                    <div className="pdp-overview">
                        <div className="pdp-kpi-grid">
                            {buildKpiList(stats).length === 0 ? (
                                <div className="pdp-empty-state" style={{ gridColumn: '1/-1' }}>
                                    <BarChart2 size={36} />
                                    <p>No metrics yet. Click <strong>Sync</strong> to pull live data from this platform.</p>
                                </div>
                            ) : buildKpiList(stats).map(({ key, label, value, icon, color, bg, raw }, i) => (
                                <KpiCard key={key} label={label} value={value} rawNum={raw}
                                    icon={icon} color={color} bg={bg} index={i} />
                            ))}
                        </div>

                        <div className="pdp-side-col">
                            {/* Activity */}
                            <div className="pdp-card">
                                <div className="pdp-card-header">
                                    <Activity size={16} />
                                    <h3>Recent Activity</h3>
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="pdp-empty-text">No recent activity.</p>
                                ) : (
                                    <div className="pdp-timeline">
                                        {notifications.slice(0, 6).map((n, i) => (
                                            <div key={n.id} className="pdp-tl-item"
                                                style={{ animationDelay: `${i * 0.06}s` }}>
                                                <div className={`pdp-tl-dot pdp-tl-dot--${n.type || 'info'}`} />
                                                <div className="pdp-tl-body">
                                                    <p className="pdp-tl-text">{n.title}</p>
                                                    <span className="pdp-tl-time">
                                                        <Clock size={11} />
                                                        {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Team Health */}
                            {healthSummary.total > 0 && (
                                <div className="pdp-card pdp-health-card">
                                    <div className="pdp-card-header">
                                        <Users size={16} />
                                        <h3>Team Health</h3>
                                    </div>
                                    <div className="pdp-health-score">
                                        <span className="pdp-health-num" style={{ color: '#2B8A3E' }}>{healthScore}%</span>
                                        <span className="pdp-health-lbl">Health Score</span>
                                    </div>
                                    <div className="pdp-health-bar-wrap">
                                        <div className="pdp-health-segment" title={`Green: ${healthSummary.green}`}
                                            style={{ flex: healthSummary.green || 0, background: '#2B8A3E' }} />
                                        <div className="pdp-health-segment" title={`Amber: ${healthSummary.amber}`}
                                            style={{ flex: healthSummary.amber || 0, background: '#E67700' }} />
                                        <div className="pdp-health-segment" title={`Red: ${healthSummary.red}`}
                                            style={{ flex: healthSummary.red || 0, background: '#E03131' }} />
                                    </div>
                                    <div className="pdp-health-legend">
                                        <span><span className="pdp-dot" style={{ background: '#2B8A3E' }} />{healthSummary.green} Green</span>
                                        <span><span className="pdp-dot" style={{ background: '#E67700' }} />{healthSummary.amber} Amber</span>
                                        <span><span className="pdp-dot" style={{ background: '#E03131' }} />{healthSummary.red} Red</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ANALYTICS */}
                {activeTab === 'Analytics' && (
                    <div className="pdp-charts">
                        {leadsData.length === 0 && revenueData.length === 0 ? (
                            <div className="pdp-empty-state">
                                <BarChart2 size={40} />
                                <p>No monthly metrics recorded yet.</p>
                            </div>
                        ) : (
                            <>
                                {leadsData.length > 0 && (
                                    <div className="pdp-chart-card">
                                        <div className="pdp-chart-hd">
                                            <div>
                                                <h3>Leads Pipeline</h3>
                                                <p>Monthly lead volume over time</p>
                                            </div>
                                            <span className="pdp-chart-badge" style={{ background: '#E7F5FF', color: '#1C7ED6' }}>Area</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <AreaChart data={leadsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#1C7ED6" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#1C7ED6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} />
                                                <Tooltip content={<ChartTooltip unit=" leads" />} />
                                                <Area type="monotone" dataKey="leads" stroke="#1C7ED6" strokeWidth={2.5} fill="url(#gLeads)" animationDuration={1200} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                {revenueData.length > 0 && (
                                    <div className="pdp-chart-card">
                                        <div className="pdp-chart-hd">
                                            <div>
                                                <h3>Ecosystem Revenue</h3>
                                                <p>Monthly revenue in ₹ Lakhs</p>
                                            </div>
                                            <span className="pdp-chart-badge" style={{ background: '#EBFBEE', color: '#2B8A3E' }}>Bar</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} />
                                                <Tooltip content={<ChartTooltip unit="L" prefix="₹" />} />
                                                <Bar dataKey="revenue" fill="#2B8A3E" radius={[6, 6, 0, 0]} animationDuration={1200} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* TEAM */}
                {activeTab === 'Team' && (
                    <div className="pdp-team-grid">
                        {teams.length === 0 ? (
                            <div className="pdp-empty-state">
                                <Users size={40} />
                                <p>No teams found for this project.</p>
                            </div>
                        ) : teams.map((team, i) => {
                            const hColor = team.health_status === 'Green' ? '#2B8A3E'
                                : team.health_status === 'Amber' ? '#E67700' : '#E03131';
                            return (
                                <div key={team.id} className="pdp-team-card"
                                    style={{ animationDelay: `${i * 0.07}s` }}>
                                    <div className="pdp-team-top">
                                        <div className="pdp-team-avatar"
                                            style={{ background: `${hColor}18`, color: hColor }}>
                                            {team.name?.[0] || 'T'}
                                        </div>
                                        <div className="pdp-team-info">
                                            <div className="pdp-team-name">{team.name}</div>
                                            <div className="pdp-team-members">{team.member_count} members</div>
                                        </div>
                                        <span className="pdp-health-badge" style={{ background: `${hColor}15`, color: hColor }}>
                                            {team.health_status}
                                        </span>
                                    </div>
                                    <div className="pdp-team-sprint">
                                        <div className="pdp-sprint-label">
                                            <span>Sprint Progress</span>
                                            <span style={{ color: hColor, fontWeight: 700 }}>{team.sprint_progress}%</span>
                                        </div>
                                        <div className="pdp-sprint-track">
                                            <div className="pdp-sprint-fill"
                                                style={{ width: `${team.sprint_progress}%`, background: hColor }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* PRODUCTS */}
                {activeTab === 'Products' && (
                    <div className="pdp-products">
                        <div className="pdp-products-hd">
                            <h3>Platform Features & Modules</h3>
                            <span>{products.length} published</span>
                        </div>
                        {products.length === 0 ? (
                            <div className="pdp-empty-state">
                                <Layers size={40} />
                                <p>No published problem statements yet.</p>
                            </div>
                        ) : (
                            <div className="pdp-product-list">
                                {products.map((prod, i) => (
                                    <div key={prod.id} className="pdp-product-card"
                                        style={{ animationDelay: `${i * 0.07}s` }}>
                                        <div className="pdp-product-icon">
                                            <Layers size={18} />
                                        </div>
                                        <div className="pdp-product-info">
                                            <div className="pdp-product-name">{prod.title}</div>
                                            <div className="pdp-product-meta">{project.name} · {prod.status}</div>
                                        </div>
                                        <span className="pdp-product-status">{prod.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}

// ── Premium KPI card with count-up ─────────────────
function KpiCard({ label, value, rawNum, icon: Icon, color, bg, index }) {
    const animated = useCountUp(rawNum, index * 70);
    // Re-apply formatting to animated number
    let display = value;
    if (rawNum > 0) {
        if (value.startsWith('₹') && value.endsWith('L')) display = `₹${animated.toLocaleString()}L`;
        else if (value.endsWith('%'))                      display = `${(animated / (rawNum / parseFloat(value))).toFixed(1)}%`;
        else if (value.startsWith('₹'))                   display = `₹${animated.toLocaleString()}`;
        else                                               display = animated.toLocaleString();
    }
    return (
        <div className="pdp-kpi-card" style={{ '--kpi-color': color, animationDelay: `${index * 0.07}s` }}>
            <div className="pdp-kpi-glow" />
            <div className="pdp-kpi-icon" style={{ background: bg, color }}>
                <Icon size={20} />
            </div>
            <div className="pdp-kpi-body">
                <div className="pdp-kpi-val">{display}</div>
                <div className="pdp-kpi-lbl">{label}</div>
            </div>
            {rawNum > 0 && (
                <div className="pdp-kpi-trend" style={{ color }}>
                    <ArrowUpRight size={16} />
                </div>
            )}
        </div>
    );
}

const ChartTooltip = ({ active, payload, label, unit = '', prefix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="pdp-tooltip">
            <p className="pdp-tooltip-label">{label}</p>
            <p className="pdp-tooltip-val">{prefix}{payload[0].value?.toLocaleString()}{unit}</p>
        </div>
    );
};
