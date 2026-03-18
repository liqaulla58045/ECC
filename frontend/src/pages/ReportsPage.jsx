import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Users, Award, BookOpen, Target, Download,
    RefreshCw, Activity, Layers, AlertCircle, CheckCircle,
    Bell, LayoutGrid
} from 'lucide-react';
import { apiJson } from '../utils/api';
import '../styles/ReportsPage.css';

const PROJECT_COLORS = ['#1C7ED6', '#2B8A3E', '#6741D9', '#E67700', '#E03131', '#0CA678', '#74C0FC'];

function KpiCard({ icon, label, value, color }) {
    return (
        <div className="rp-kpi-card">
            <div className="rp-kpi-icon" style={{ background: `${color}15`, color }}>{icon}</div>
            <div className="rp-kpi-body">
                <p className="rp-kpi-value">{value ?? '—'}</p>
                <p className="rp-kpi-label">{label}</p>
            </div>
        </div>
    );
}

function SectionTitle({ children }) {
    return <div className="rp-section-header"><h3 className="rp-section-title">{children}</h3></div>;
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rp-tooltip">
            <p className="rp-tooltip-label">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value?.toLocaleString()}</strong></p>
            ))}
        </div>
    );
};

function EmptyState({ message }) {
    return (
        <div className="rp-empty-state">
            <AlertCircle size={28} />
            <p>{message}</p>
        </div>
    );
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboard, setDashboard] = useState(null);
    const [healthReport, setHealthReport] = useState(null);
    const [cohorts, setCohorts] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [monthlyMetrics, setMonthlyMetrics] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    async function loadAll() {
        try {
            const [dashRes, healthRes, cohortsRes, teamsRes, notifsRes, projsRes, monthlyRes] =
                await Promise.allSettled([
                    apiJson('/api/analytics/dashboard'),
                    apiJson('/api/analytics/health-report'),
                    apiJson('/api/cohorts'),
                    apiJson('/api/teams'),
                    apiJson('/api/notifications'),
                    apiJson('/api/projects'),
                    apiJson('/api/analytics/monthly'),
                ]);

            if (dashRes.status   === 'fulfilled') setDashboard(dashRes.value);
            if (healthRes.status === 'fulfilled') setHealthReport(healthRes.value);
            if (cohortsRes.status === 'fulfilled') setCohorts(cohortsRes.value || []);
            if (teamsRes.status  === 'fulfilled') setAllTeams(teamsRes.value || []);
            if (notifsRes.status === 'fulfilled') setNotifications((notifsRes.value || []).slice(0, 20));
            if (projsRes.status  === 'fulfilled') setProjects(projsRes.value || []);
            if (monthlyRes.status === 'fulfilled') setMonthlyMetrics(monthlyRes.value || []);

            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => { loadAll(); }, []);
    const handleRefresh = () => { setRefreshing(true); loadAll(); };

    // ── Derived data
    const totals = dashboard?.totals || {};
    const connectedCount = projects.length;

    const comparisonData = projects.map((p, i) => {
        const snap = (dashboard?.projects || []).find(x => x.project_id === p.id);
        return {
            name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
            Learners:     snap?.total_learners     || 0,
            Teams:        snap?.total_teams        || 0,
            Mentors:      snap?.total_mentors      || 0,
            Applications: snap?.total_applications || 0,
        };
    });

    const teamHealthPie = (() => {
        const h = healthReport?.teamHealthSummary || {};
        const d = [];
        if (h.Green) d.push({ name: 'Green', value: h.Green, color: '#2B8A3E' });
        if (h.Amber) d.push({ name: 'Amber', value: h.Amber, color: '#E67700' });
        if (h.Red)   d.push({ name: 'Red',   value: h.Red,   color: '#E03131' });
        return d;
    })();

    const monthlyChartData = monthlyMetrics.map(m => ({
        label: `${m.month} ${m.year}`,
        Leads: Number(m.leads) || 0,
        Revenue: Number(m.revenue_lakhs) || 0,
        Applications: Number(m.new_applications) || 0,
    }));

    const tabs = ['overview', 'projects', 'cohorts', 'teams', 'activity'];

    if (loading) return (
        <div className="rp-root rp-loading">
            <RefreshCw size={32} className="spinning" />
            <p>Fetching data from connected projects…</p>
        </div>
    );

    if (error) return (
        <div className="rp-root rp-loading">
            <AlertCircle size={32} color="#E03131" />
            <p style={{ color: '#E03131' }}>⚠ {error}</p>
        </div>
    );

    return (
        <div className="rp-root anim-fade-in">
            <div className="page-hero">
                <div className="page-hero-mesh" />
                <div className="page-hero-content">
                    <div className="page-hero-row">
                        <div className="page-hero-left">
                            <p className="page-hero-eyebrow">Intelligence Hub</p>
                            <h1 className="page-hero-title">Reports & Analytics</h1>
                            <p className="page-hero-subtitle">{connectedCount} connected project{connectedCount !== 1 ? 's' : ''} · live data aggregation</p>
                        </div>
                        <div className="page-hero-right">
                            <button className={`rp-icon-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="Refresh" style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)' }}>
                                <RefreshCw size={16} />
                            </button>
                            <button className="rp-export-btn" onClick={() => alert('Export coming soon.')}>
                                <Download size={14} /> Export
                            </button>
                        </div>
                    </div>
                    <div className="page-hero-chips">
                        <span className="page-hero-chip"><strong>{connectedCount}</strong>&nbsp;Projects</span>
                        <span className="page-hero-chip"><strong>{(totals.totalLearners || 0).toLocaleString()}</strong>&nbsp;Learners</span>
                        <span className="page-hero-chip"><strong>{totals.totalTeams || 0}</strong>&nbsp;Teams</span>
                        <span className="page-hero-chip"><strong>{totals.activeCohorts || 0}</strong>&nbsp;Cohorts</span>
                    </div>
                </div>
            </div>

            <div className="rp-tabs">
                {tabs.map(t => (
                    <button key={t} className={`rp-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
                <div className="rp-body">
                    <div className="rp-kpi-row">
                        <KpiCard icon={<LayoutGrid size={18} />} label="Connected Projects"  value={connectedCount}                              color="#6741D9" />
                        <KpiCard icon={<Users size={18} />}      label="Total Learners"       value={(totals.totalLearners || 0).toLocaleString()} color="#1C7ED6" />
                        <KpiCard icon={<BookOpen size={18} />}   label="Total Teams"          value={(totals.totalTeams || 0).toLocaleString()}    color="#2B8A3E" />
                        <KpiCard icon={<Award size={18} />}      label="Total Mentors"        value={(totals.totalMentors || 0).toLocaleString()}  color="#E67700" />
                        <KpiCard icon={<Target size={18} />}     label="Total Applications"   value={(totals.totalApplications || 0).toLocaleString()} color="#E03131" />
                        <KpiCard icon={<Layers size={18} />}     label="Active Cohorts"       value={(totals.activeCohorts || 0).toLocaleString()} color="#0CA678" />
                    </div>

                    {monthlyChartData.length > 0 ? (
                        <div className="rp-chart-card">
                            <SectionTitle>Monthly Leads Pipeline</SectionTitle>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={monthlyChartData} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Leads" fill="#1C7ED6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="rp-chart-card"><EmptyState message="No monthly metrics recorded yet." /></div>
                    )}

                    <div className="rp-chart-card">
                        <SectionTitle>Project Summary</SectionTitle>
                        {projects.length === 0 ? (
                            <EmptyState message="No projects connected." />
                        ) : (
                            <div className="rp-summary-table">
                                <div className="rp-summary-thead">
                                    <span>Project</span><span>Status</span>
                                    <span>Learners</span><span>Teams</span>
                                    <span>Mentors</span><span>Applications</span>
                                </div>
                                {projects.map((p, i) => {
                                    const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
                                    return (
                                        <div key={p.id} className="rp-summary-row">
                                            <span className="rp-summary-name">
                                                <span className="rp-summary-dot" style={{ background: color }} />{p.name}
                                            </span>
                                            <span>
                                                <span className="rp-status-pill ok">
                                                    <CheckCircle size={11} />{p.status || 'Active'}
                                                </span>
                                            </span>
                                            <span className="rp-num">{comparisonData[i]?.Learners?.toLocaleString() ?? '—'}</span>
                                            <span className="rp-num">{comparisonData[i]?.Teams?.toLocaleString() ?? '—'}</span>
                                            <span className="rp-num">{comparisonData[i]?.Mentors?.toLocaleString() ?? '—'}</span>
                                            <span className="rp-num">{comparisonData[i]?.Applications?.toLocaleString() ?? '—'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PROJECTS ── */}
            {activeTab === 'projects' && (
                <div className="rp-body">
                    {comparisonData.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No project data available." /></div>
                    ) : (
                        <>
                            <div className="rp-charts-row">
                                {[
                                    { key: 'Teams',        label: 'Teams by Project' },
                                    { key: 'Applications', label: 'Applications by Project' },
                                ].map(({ key, label }) => (
                                    <div className="rp-chart-card" key={key}>
                                        <SectionTitle>{label}</SectionTitle>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={comparisonData} barSize={28}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey={key} radius={[6, 6, 0, 0]}>
                                                    {comparisonData.map((_, i) => (
                                                        <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ))}
                            </div>
                            <div className="rp-chart-card">
                                <SectionTitle>Mentors by Project</SectionTitle>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={comparisonData} barSize={32}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="Mentors" radius={[6, 6, 0, 0]}>
                                            {comparisonData.map((_, i) => (
                                                <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── COHORTS ── */}
            {activeTab === 'cohorts' && (
                <div className="rp-body">
                    <div className="rp-kpi-row">
                        <KpiCard icon={<Layers size={18} />}    label="Total Cohorts"  value={cohorts.length}  color="#6741D9" />
                        <KpiCard icon={<Activity size={18} />}  label="Active"         value={cohorts.filter(c => (c.status || '').toLowerCase() === 'active').length}    color="#2B8A3E" />
                        <KpiCard icon={<CheckCircle size={18}/>}label="Completed"      value={cohorts.filter(c => (c.status || '').toLowerCase() === 'completed').length} color="#1C7ED6" />
                    </div>

                    {cohorts.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No cohorts found." /></div>
                    ) : (
                        <div className="rp-chart-card">
                            <SectionTitle>All Cohorts</SectionTitle>
                            <div className="rp-summary-table">
                                <div className="rp-cohort-thead rp-summary-thead">
                                    <span>Cohort Name</span><span>Project</span>
                                    <span>Status</span><span>Start Date</span><span>End Date</span>
                                </div>
                                {cohorts.map((c, i) => {
                                    const status = c.status || '—';
                                    const col = { active: '#1C7ED6', completed: '#2B8A3E', planning: '#E67700' }[status.toLowerCase()] ?? '#868E96';
                                    return (
                                        <div key={c.id} className="rp-summary-row">
                                            <span className="rp-summary-name">{c.name}</span>
                                            <span>
                                                <span className="rp-project-tag" style={{ color: PROJECT_COLORS[i % PROJECT_COLORS.length], background: `${PROJECT_COLORS[i % PROJECT_COLORS.length]}15` }}>
                                                    {c.project_name || '—'}
                                                </span>
                                            </span>
                                            <span>
                                                <span className="rp-status-pill ok" style={{ color: col, background: `${col}15` }}>{status}</span>
                                            </span>
                                            <span className="rp-meta">{c.start_date ? new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                            <span className="rp-meta">{c.end_date   ? new Date(c.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TEAMS ── */}
            {activeTab === 'teams' && (
                <div className="rp-body">
                    <div className="rp-kpi-row">
                        <KpiCard icon={<BookOpen size={18} />}   label="Total Teams" value={allTeams.length}                                                 color="#1C7ED6" />
                        <KpiCard icon={<CheckCircle size={18}/>} label="Green"       value={allTeams.filter(t => t.health_status === 'Green').length}         color="#2B8A3E" />
                        <KpiCard icon={<AlertCircle size={18}/>} label="Amber"       value={allTeams.filter(t => t.health_status === 'Amber').length}         color="#E67700" />
                        <KpiCard icon={<Activity size={18} />}   label="Red"         value={allTeams.filter(t => t.health_status === 'Red').length}           color="#E03131" />
                    </div>

                    {allTeams.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No teams found." /></div>
                    ) : (
                        <div className="rp-charts-row">
                            {teamHealthPie.length > 0 && (
                                <div className="rp-chart-card">
                                    <SectionTitle>Team Health Distribution</SectionTitle>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={teamHealthPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                                                dataKey="value" nameKey="name" paddingAngle={3}>
                                                {teamHealthPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip formatter={v => v} />
                                            <Legend iconType="circle" iconSize={10} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <div className="rp-chart-card">
                                <SectionTitle>Team List</SectionTitle>
                                <div className="rp-summary-table">
                                    <div className="rp-summary-thead" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                                        <span>Team Name</span><span>Project</span><span>Members</span><span>Health</span>
                                    </div>
                                    {allTeams.slice(0, 30).map((t, i) => {
                                        const hCol = { Green: '#2B8A3E', Amber: '#E67700', Red: '#E03131' }[t.health_status] ?? '#868E96';
                                        const pColor = PROJECT_COLORS[i % PROJECT_COLORS.length];
                                        return (
                                            <div key={t.id} className="rp-summary-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                                                <span className="rp-summary-name">{t.name}</span>
                                                <span>
                                                    <span className="rp-project-tag" style={{ color: pColor, background: `${pColor}15` }}>
                                                        {t.project_name || '—'}
                                                    </span>
                                                </span>
                                                <span className="rp-num">{t.member_count ?? '—'}</span>
                                                <span>
                                                    <span className="rp-status-pill ok" style={{ color: hCol, background: `${hCol}15` }}>
                                                        {t.health_status || '—'}
                                                    </span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {allTeams.length > 30 && (
                                        <div className="rp-summary-row rp-more-row">
                                            <span>+{allTeams.length - 30} more teams</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── ACTIVITY ── */}
            {activeTab === 'activity' && (
                <div className="rp-body">
                    <div className="rp-kpi-row">
                        <KpiCard icon={<Bell size={18} />}     label="Total Notifications" value={notifications.length} color="#1C7ED6" />
                        <KpiCard icon={<Activity size={18} />} label="Unread"              value={notifications.filter(n => !n.is_read).length} color="#E67700" />
                    </div>

                    {notifications.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No notifications found." /></div>
                    ) : (
                        <div className="rp-chart-card">
                            <SectionTitle>Recent Activity</SectionTitle>
                            <div className="rp-activity-list">
                                {notifications.map((n, i) => {
                                    const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
                                    return (
                                        <div key={n.id} className="rp-activity-row">
                                            <span className="rp-activity-dot" style={{ background: color }} />
                                            <div className="rp-activity-main">
                                                <p className="rp-activity-text">{n.message || n.title}</p>
                                                <span className="rp-project-tag" style={{ color, background: `${color}15` }}>
                                                    {n.project_id || 'System'}
                                                </span>
                                            </div>
                                            <span className="rp-activity-time">
                                                {n.created_at ? new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
