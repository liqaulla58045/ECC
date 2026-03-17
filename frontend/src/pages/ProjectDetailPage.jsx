import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    ChevronLeft, Share2, Sliders, Calendar, ExternalLink, Github,
    Users, Layers, Target, Activity, AlertCircle, Milestone, UserPlus,
    RefreshCw, CheckCircle
} from 'lucide-react';
import { apiJson } from '../utils/api';
import '../styles/ProjectDetailPage.css';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [animKey, setAnimKey] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);
    const [stats, setStats] = useState(null);
    const [teams, setTeams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [monthlyMetrics, setMonthlyMetrics] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            setError(null);
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
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [id]);

    useEffect(() => { setAnimKey(k => k + 1); }, [activeTab]);

    const accent = 'var(--c-accent)';

    // Derive health from teams
    const healthSummary = teams.reduce(
        (acc, t) => {
            const s = (t.health_status || '').toLowerCase();
            if (s === 'green')  acc.green++;
            else if (s === 'amber') acc.amber++;
            else if (s === 'red')   acc.red++;
            acc.total++;
            return acc;
        },
        { green: 0, amber: 0, red: 0, total: 0 }
    );

    const healthScore = healthSummary.total > 0
        ? Math.round((healthSummary.green / healthSummary.total) * 100)
        : null;

    const riskLevel = healthSummary.total > 0
        ? healthSummary.red / healthSummary.total > 0.2
            ? 'High'
            : healthSummary.amber / healthSummary.total > 0.3
                ? 'Medium'
                : 'Low'
        : null;

    // Format monthly metrics for charts
    const leadsChartData = monthlyMetrics.map(m => ({
        month: m.month,
        leads: Number(m.leads) || 0,
    }));
    const revenueChartData = monthlyMetrics.map(m => ({
        month: m.month,
        revenue: Number(m.revenue_lakhs) || 0,
    }));

    if (loading) {
        return (
            <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <RefreshCw size={24} className="spinning" style={{ color: 'var(--c-accent)' }} />
                <p>Loading project data…</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="pdp-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--c-red)' }}>
                ⚠️ {error || 'Project not found'}
            </div>
        );
    }

    return (
        <div className="pdp-root">
            {/* Sticky Nav */}
            <nav className="pdp-nav">
                <button className="pdp-back" onClick={() => navigate('/dashboard')}>
                    <ChevronLeft size={16} />
                    Back
                </button>
                <div className="pdp-nav-meta">
                    <span className={`pdp-nav-dot pc-dot--${(project.status || '').toLowerCase()}`}></span>
                    <span className="pdp-nav-status">{project.status}</span>
                    <span className="pdp-nav-cat">{project.category}</span>
                </div>
                <div className="pdp-nav-actions">
                    <button className="btn btn-subtle icon-btn" title="Share"><Share2 size={16} /></button>
                    <button className="btn btn-subtle icon-btn" title="Settings"><Sliders size={16} /></button>
                </div>
            </nav>

            {/* Hero */}
            <header className="pd-hero-new" style={{ '--pd-accent': accent }}>
                <div className="pd-hero-info">
                    <h1 className="pd-title anim-slide-up delay-1">{project.name}</h1>
                    <p className="pd-subtitle anim-slide-up delay-2">{project.description}</p>
                    <div className="pd-hero-meta anim-slide-up delay-3">
                        <div className="pd-hero-dates">
                            <Calendar size={18} />
                            {project.start_date || '—'} &mdash; {project.end_date || 'Present'}
                        </div>
                        <div className="pd-hero-actions-row">
                            {project.live_url && (
                                <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn btn-solid pd-live-btn">
                                    <ExternalLink size={18} style={{ marginRight: '8px' }} />
                                    Live Site
                                </a>
                            )}
                            {project.git_repo && (
                                <a href={project.git_repo} target="_blank" rel="noopener noreferrer" className="btn btn-subtle pd-repo-btn">
                                    <Github size={18} style={{ marginRight: '8px' }} />
                                    Repository
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pd-hero-visuals anim-slide-up delay-4">
                    <div className="pd-hero-vitals-card">
                        <div className="pd-vitals-header">
                            <Target size={20} className="pd-icon-accent" />
                            <span className="pd-vitals-title">Project Goal</span>
                        </div>
                        <div className="pd-prog-display">
                            <span className="pd-prog-val">{project.progress}%</span>
                            <div className="pd-prog-ring-mini">
                                <div className="pd-prog-fill-mini" style={{ width: `${project.progress}%` }}></div>
                            </div>
                        </div>
                        {(healthScore !== null || riskLevel !== null) && (
                            <>
                                <div className="pd-hero-vitals-divider"></div>
                                <div className="pd-hero-vitals-metrics">
                                    {healthScore !== null && (
                                        <div className="pd-vitals-item">
                                            <div className="pd-vitals-icon-label">
                                                <Activity size={12} /><span>Health</span>
                                            </div>
                                            <span className="pd-vitals-val pd-text-green">{healthScore}%</span>
                                        </div>
                                    )}
                                    {riskLevel !== null && (
                                        <div className="pd-vitals-item">
                                            <div className="pd-vitals-icon-label">
                                                <AlertCircle size={12} /><span>Risk</span>
                                            </div>
                                            <span className={`pd-vitals-val pd-risk--${riskLevel.toLowerCase()}`}>{riskLevel}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="pd-hero-bottom-bar">
                    <div className="pd-prog-bar">
                        <div className="pd-prog-fill" style={{ width: `${project.progress}%`, background: accent }}></div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="pd-tabs">
                <div className="pd-tabs-inner">
                    {['Overview', 'Analytics', 'Team', 'Products'].map(tab => (
                        <button
                            key={tab}
                            className={`pd-tab ${activeTab === tab ? 'pd-tab--active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                            style={{ '--pd-accent': accent }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="pd-content" key={animKey}>

                {/* ── OVERVIEW ── */}
                {activeTab === 'Overview' && (
                    <div className="pd-overview-layout">
                        <div className="pd-kpi-column">
                            <div className="pd-kpi-grid">
                                <KpiCard label="Total Learners"     val={stats?.total_learners?.toLocaleString()     ?? '—'} delay="0s" />
                                <KpiCard label="Active Teams"       val={stats?.total_teams?.toLocaleString()        ?? '—'} delay="0.05s" />
                                <KpiCard label="Total Mentors"      val={stats?.total_mentors?.toLocaleString()      ?? '—'} delay="0.1s" />
                                <KpiCard label="Total Applications" val={stats?.total_applications?.toLocaleString() ?? '—'} delay="0.15s" />
                                <KpiCard label="Active Cohorts"     val={stats?.active_cohorts                       ?? '—'} delay="0.2s" />
                                <KpiCard label="Seed Deployed"      val={stats ? `₹${stats.seed_deployed_lakhs}L`   : '—'} delay="0.25s" />
                                <KpiCard label="Stipends"           val={stats ? `₹${stats.stipends_disbursed_lakhs}L` : '—'} delay="0.3s" />
                                <KpiCard label="Placement Rate"     val={stats?.placement_rate ? `${stats.placement_rate}%` : '—'} delay="0.35s" />
                            </div>
                        </div>

                        <div className="pd-timeline-column anim-fade-in delay-2">
                            <div className="pd-timeline-card">
                                <h3 className="pd-timeline-title">Recent Activity</h3>
                                {notifications.length === 0 ? (
                                    <p style={{ color: 'var(--c-text-3)', fontSize: '0.875rem', padding: '0.5rem 0' }}>No recent activity.</p>
                                ) : (
                                    <div className="pd-timeline">
                                        {notifications.slice(0, 5).map((notif) => (
                                            <div key={notif.id} className="pd-timeline-item">
                                                <div className={`pd-timeline-icon-wrap pd-icon--${notif.type || 'info'}`}>
                                                    {notif.type === 'warning' ? <AlertCircle size={14} /> :
                                                     notif.type === 'success' ? <CheckCircle size={14} /> :
                                                     <Milestone size={14} />}
                                                </div>
                                                <div className="pd-timeline-info">
                                                    <p className="pd-timeline-text">{notif.title}</p>
                                                    <span className="pd-timeline-time">
                                                        {new Date(notif.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {teams.length > 0 && (
                                <div className="pd-resource-card anim-fade-in delay-3">
                                    <h3 className="pd-timeline-title">Team Health</h3>
                                    <div className="pd-org-meta">
                                        <div className="pd-org-stat">
                                            <span className="pd-org-val">{teams.length}</span>
                                            <span className="pd-org-lbl">Active Teams</span>
                                        </div>
                                        <div className="pd-org-bar-wrap">
                                            <div className="pd-org-bar">
                                                <div className="pd-org-fill" style={{
                                                    width: `${healthSummary.total > 0 ? Math.round((healthSummary.green / healthSummary.total) * 100) : 0}%`,
                                                    background: accent
                                                }}></div>
                                            </div>
                                            <span className="pd-org-sub">
                                                {healthSummary.green} Green · {healthSummary.amber} Amber · {healthSummary.red} Red
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── ANALYTICS ── */}
                {activeTab === 'Analytics' && (
                    <div className="pd-charts">
                        {leadsChartData.length === 0 && revenueChartData.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-text-3)' }}>
                                No monthly metrics recorded yet for this project.
                            </div>
                        ) : (
                            <>
                                {leadsChartData.length > 0 && (
                                    <div className="pd-chart-card anim-slide-up delay-1">
                                        <h3 className="pd-chart-title">Monthly Leads Pipeline</h3>
                                        <div style={{ width: '100%', height: 260 }}>
                                            <ResponsiveContainer>
                                                <AreaChart data={leadsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={accent} stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor={accent} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} />
                                                    <Tooltip content={<CustomTooltip unit=" Leads" />} />
                                                    <Area type="monotone" dataKey="leads" stroke={accent} strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" animationDuration={1500} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                                {revenueChartData.length > 0 && (
                                    <div className="pd-chart-card anim-slide-up delay-2">
                                        <h3 className="pd-chart-title">Ecosystem Revenue (₹ Lakhs)</h3>
                                        <div style={{ width: '100%', height: 260 }}>
                                            <ResponsiveContainer>
                                                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} />
                                                    <Tooltip content={<CustomTooltip unit="L" prefix="₹" />} />
                                                    <Bar dataKey="revenue" fill="var(--c-green)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── TEAM ── */}
                {activeTab === 'Team' && (
                    <div className="pd-team">
                        {teams.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-text-3)' }}>
                                No teams found for this project.
                            </div>
                        ) : (
                            teams.map((team, i) => {
                                const hColor = team.health_status === 'Green'
                                    ? '#2B8A3E' : team.health_status === 'Amber'
                                    ? '#E67700' : '#E03131';
                                return (
                                    <div key={team.id} className="pd-team-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                        <div className="pd-team-avatar" style={{ background: `${hColor}20`, color: hColor }}>
                                            {team.name?.[0] || 'T'}
                                        </div>
                                        <div className="pd-team-info">
                                            <div className="pd-team-name">{team.name}</div>
                                            <div className="pd-team-role">
                                                {team.member_count} members · Sprint {team.sprint_progress}%
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
                                            borderRadius: '12px', background: `${hColor}15`, color: hColor
                                        }}>
                                            {team.health_status}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ── PRODUCTS ── */}
                {activeTab === 'Products' && (
                    <div className="pd-products">
                        <div className="pd-products-hd anim-fade-in">
                            <h3 className="pd-products-title">Platform Features & Modules</h3>
                        </div>
                        {products.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-text-3)' }}>
                                No published problem statements or products yet.
                            </div>
                        ) : (
                            <div className="pd-product-list">
                                {products.map((prod, i) => (
                                    <div key={prod.id} className="pd-product-row" style={{ animationDelay: `${i * 0.08}s` }}>
                                        <div className="pd-product-icon" style={{ background: 'var(--c-accent-bg)', color: accent }}>
                                            <Layers size={18} />
                                        </div>
                                        <div className="pd-product-info">
                                            <div className="pd-product-name">{prod.title}</div>
                                            <div className="pd-product-proj">{project.name} · {prod.status}</div>
                                        </div>
                                        <button className="pd-product-arrow">
                                            <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                                        </button>
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

function KpiCard({ label, val, delay }) {
    return (
        <div className="pd-kpi-card" style={{ animationDelay: delay }}>
            <div className="pd-kpi-val">{val}</div>
            <div className="pd-kpi-label">{label}</div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label, unit = '', prefix = '' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="pd-tooltip">
                <p className="pd-tooltip-label">{label}</p>
                <p className="pd-tooltip-val" style={{ color: payload[0].stroke || payload[0].fill }}>
                    {prefix}{payload[0].value}{unit}
                </p>
            </div>
        );
    }
    return null;
};
