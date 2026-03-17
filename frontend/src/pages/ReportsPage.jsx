import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, Award, BookOpen, Target, Download,
    RefreshCw, ArrowUpRight, Activity, Layers,
    AlertCircle, CheckCircle, Bell, LayoutGrid
} from 'lucide-react';
import '../styles/ReportsPage.css';

// ── colours assigned per-project index
const PROJECT_COLORS = ['#1C7ED6', '#2B8A3E', '#6741D9', '#E67700', '#E03131', '#0CA678', '#74C0FC'];

function KpiCard({ icon, label, value, sub, color }) {
    return (
        <div className="rp-kpi-card">
            <div className="rp-kpi-icon" style={{ background: `${color}15`, color }}>{icon}</div>
            <div className="rp-kpi-body">
                <p className="rp-kpi-value">{value ?? '—'}</p>
                <p className="rp-kpi-label">{label}</p>
                {sub && <p className="rp-kpi-sub">{sub}</p>}
            </div>
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div className="rp-section-header">
            <h3 className="rp-section-title">{children}</h3>
        </div>
    );
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
    const [projects, setProjects] = useState([]);          // raw project configs
    const [statsMap, setStatsMap] = useState({});          // { projectId: stats }
    const [cohortsMap, setCohortsMap] = useState({});      // { projectId: cohort[] }
    const [teamsMap, setTeamsMap] = useState({});          // { projectId: team[] }
    const [notifsMap, setNotifsMap] = useState({});        // { projectId: notif[] }
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    async function loadAll() {
        try {
            const res = await fetch('/api/projects');
            if (!res.ok) throw new Error('Cannot reach backend');
            const configs = await res.json();
            setProjects(configs);

            // fetch stats + cohorts + teams + notifications for every project in parallel
            const results = await Promise.allSettled(
                configs.map(async (p) => {
                    const base = `/api/projects/${p.id}/proxy`;
                    const [statsR, cohortsR, teamsR, notifsR] = await Promise.allSettled([
                        fetch(`${base}/api/admin/stats`).then(r => r.ok ? r.json() : null),
                        fetch(`${base}/api/cohorts`).then(r => r.ok ? r.json() : null),
                        fetch(`${base}/api/teams`).then(r => r.ok ? r.json() : null),
                        fetch(`${base}/api/notifications`).then(r => r.ok ? r.json() : null),
                    ]);
                    return {
                        id: p.id,
                        name: p.name,
                        stats:   statsR.status   === 'fulfilled' ? statsR.value   : null,
                        cohorts: cohortsR.status === 'fulfilled' ? cohortsR.value : null,
                        teams:   teamsR.status   === 'fulfilled' ? teamsR.value   : null,
                        notifs:  notifsR.status  === 'fulfilled' ? notifsR.value  : null,
                    };
                })
            );

            const sMap = {}, cMap = {}, tMap = {}, nMap = {};
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    const { id, stats, cohorts, teams, notifs } = r.value;
                    if (stats)   sMap[id] = stats;
                    if (cohorts) cMap[id] = Array.isArray(cohorts) ? cohorts : cohorts?.data ?? [];
                    if (teams)   tMap[id] = Array.isArray(teams)   ? teams   : teams?.data   ?? [];
                    if (notifs)  nMap[id] = Array.isArray(notifs)  ? notifs  : notifs?.data  ?? [];
                }
            });

            setStatsMap(sMap);
            setCohortsMap(cMap);
            setTeamsMap(tMap);
            setNotifsMap(nMap);
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

    // ── Aggregated KPIs across ALL projects
    const totalLearners     = Object.values(statsMap).reduce((s, x) => s + (x?.totalLearners     ?? 0), 0);
    const totalTeams        = Object.values(statsMap).reduce((s, x) => s + (x?.totalTeams        ?? 0), 0);
    const totalMentors      = Object.values(statsMap).reduce((s, x) => s + (x?.totalMentors      ?? 0), 0);
    const totalApplications = Object.values(statsMap).reduce((s, x) => s + (x?.totalApplications ?? 0), 0);
    const totalCohorts      = Object.values(statsMap).reduce((s, x) => s + (x?.activeCohorts     ?? 0), 0);
    const connectedCount    = projects.length;

    // ── Per-project comparison data for bar chart
    const comparisonData = projects.map((p, i) => ({
        name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
        Learners:  statsMap[p.id]?.totalLearners     ?? 0,
        Teams:     statsMap[p.id]?.totalTeams        ?? 0,
        Mentors:   statsMap[p.id]?.totalMentors      ?? 0,
        Applications: statsMap[p.id]?.totalApplications ?? 0,
    }));

    // ── All cohorts flattened
    const allCohorts = projects.flatMap((p, i) =>
        (cohortsMap[p.id] ?? []).map(c => ({ ...c, _projectName: p.name, _color: PROJECT_COLORS[i % PROJECT_COLORS.length] }))
    );

    // ── All teams flattened, compute health distribution
    const allTeams = projects.flatMap(p => (teamsMap[p.id] ?? []));
    const teamHealthData = (() => {
        const healthy  = allTeams.filter(t => (t.healthStatus ?? t.health ?? '').toLowerCase() === 'healthy').length;
        const atRisk   = allTeams.filter(t => ['at risk', 'atrisk', 'warning'].includes((t.healthStatus ?? t.health ?? '').toLowerCase())).length;
        const critical = allTeams.filter(t => (t.healthStatus ?? t.health ?? '').toLowerCase() === 'critical').length;
        const other    = allTeams.length - healthy - atRisk - critical;
        const d = [];
        if (healthy)  d.push({ name: 'Healthy',  value: healthy,  color: '#2B8A3E' });
        if (atRisk)   d.push({ name: 'At Risk',   value: atRisk,   color: '#E67700' });
        if (critical) d.push({ name: 'Critical',  value: critical, color: '#E03131' });
        if (other > 0)d.push({ name: 'Unknown',   value: other,    color: '#ADB5BD' });
        return d;
    })();

    // ── All notifications flattened
    const allNotifs = projects.flatMap((p, i) =>
        (notifsMap[p.id] ?? []).slice(0, 10).map(n => ({
            ...n,
            _projectName: p.name,
            _color: PROJECT_COLORS[i % PROJECT_COLORS.length]
        }))
    ).slice(0, 20);

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
            {/* Header */}
            <div className="rp-header">
                <div>
                    <h1 className="rp-title">Reports & Analytics</h1>
                    <p className="rp-subtitle">{connectedCount} connected project{connectedCount !== 1 ? 's' : ''} · live data</p>
                </div>
                <div className="rp-header-actions">
                    <button className={`rp-icon-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button className="rp-export-btn" onClick={() => alert('Export coming soon.')}>
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Tabs */}
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
                        <KpiCard icon={<LayoutGrid size={18} />} label="Connected Projects" value={connectedCount}                        color="#6741D9" />
                        <KpiCard icon={<Users size={18} />}      label="Total Learners"      value={totalLearners.toLocaleString()}       color="#1C7ED6" />
                        <KpiCard icon={<BookOpen size={18} />}   label="Total Teams"         value={totalTeams.toLocaleString()}          color="#2B8A3E" />
                        <KpiCard icon={<Award size={18} />}      label="Total Mentors"       value={totalMentors.toLocaleString()}        color="#E67700" />
                        <KpiCard icon={<Target size={18} />}     label="Total Applications"  value={totalApplications.toLocaleString()}   color="#E03131" />
                        <KpiCard icon={<Layers size={18} />}     label="Active Cohorts"      value={totalCohorts.toLocaleString()}        color="#0CA678" />
                    </div>

                    {/* Comparison chart */}
                    {comparisonData.length > 0 ? (
                        <div className="rp-chart-card">
                            <SectionTitle>Learners by Project</SectionTitle>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={comparisonData} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Learners" radius={[6, 6, 0, 0]}>
                                        {comparisonData.map((_, i) => (
                                            <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="rp-chart-card"><EmptyState message="No project data available yet." /></div>
                    )}

                    {/* Summary table */}
                    <div className="rp-chart-card">
                        <SectionTitle>Project Summary</SectionTitle>
                        {projects.length === 0 ? (
                            <EmptyState message="No projects connected." />
                        ) : (
                            <div className="rp-summary-table">
                                <div className="rp-summary-thead">
                                    <span>Project</span>
                                    <span>Status</span>
                                    <span>Learners</span>
                                    <span>Teams</span>
                                    <span>Mentors</span>
                                    <span>Applications</span>
                                </div>
                                {projects.map((p, i) => {
                                    const s = statsMap[p.id];
                                    const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
                                    const statusOk = s !== null && s !== undefined;
                                    return (
                                        <div key={p.id} className="rp-summary-row">
                                            <span className="rp-summary-name">
                                                <span className="rp-summary-dot" style={{ background: color }} />
                                                {p.name}
                                            </span>
                                            <span>
                                                <span className={`rp-status-pill ${statusOk ? 'ok' : 'err'}`}>
                                                    {statusOk ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                                                    {statusOk ? (p.status || 'Active') : 'Offline'}
                                                </span>
                                            </span>
                                            <span className="rp-num">{s?.totalLearners?.toLocaleString()     ?? '—'}</span>
                                            <span className="rp-num">{s?.totalTeams?.toLocaleString()        ?? '—'}</span>
                                            <span className="rp-num">{s?.totalMentors?.toLocaleString()      ?? '—'}</span>
                                            <span className="rp-num">{s?.totalApplications?.toLocaleString() ?? '—'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PROJECTS (side-by-side comparison) ── */}
            {activeTab === 'projects' && (
                <div className="rp-body">
                    {comparisonData.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No project data available." /></div>
                    ) : (
                        <>
                            <div className="rp-charts-row">
                                {[
                                    { key: 'Teams',        label: 'Teams by Project',        color: '#2B8A3E' },
                                    { key: 'Applications', label: 'Applications by Project',  color: '#E67700' },
                                ].map(({ key, label, color }) => (
                                    <div className="rp-chart-card" key={key}>
                                        <SectionTitle>{label}</SectionTitle>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={comparisonData} barSize={28}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey={key} fill={color} radius={[6, 6, 0, 0]}>
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
                        <KpiCard icon={<Layers size={18} />}   label="Total Cohorts"    value={allCohorts.length}  color="#6741D9" />
                        <KpiCard icon={<Activity size={18} />} label="Active Cohorts"   value={allCohorts.filter(c => (c.status ?? '').toLowerCase() === 'active').length} color="#2B8A3E" />
                        <KpiCard icon={<CheckCircle size={18}/>}label="Completed"       value={allCohorts.filter(c => (c.status ?? '').toLowerCase() === 'completed').length} color="#1C7ED6" />
                    </div>

                    {allCohorts.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No cohort data returned from connected projects." /></div>
                    ) : (
                        <div className="rp-chart-card">
                            <SectionTitle>All Cohorts</SectionTitle>
                            <div className="rp-summary-table">
                                <div className="rp-cohort-thead rp-summary-thead">
                                    <span>Cohort Name</span>
                                    <span>Project</span>
                                    <span>Status</span>
                                    <span>Start Date</span>
                                    <span>End Date</span>
                                </div>
                                {allCohorts.map((c, i) => {
                                    const status = c.status ?? c.cohortStatus ?? '—';
                                    const statusColors = { active: '#1C7ED6', completed: '#2B8A3E', draft: '#868E96', upcoming: '#E67700' };
                                    const col = statusColors[(status ?? '').toLowerCase()] ?? '#868E96';
                                    return (
                                        <div key={i} className="rp-summary-row">
                                            <span className="rp-summary-name">{c.name ?? c.cohortName ?? `Cohort ${i + 1}`}</span>
                                            <span>
                                                <span className="rp-project-tag" style={{ color: c._color, background: `${c._color}15` }}>
                                                    {c._projectName}
                                                </span>
                                            </span>
                                            <span>
                                                <span className="rp-status-pill ok" style={{ color: col, background: `${col}15` }}>
                                                    {status}
                                                </span>
                                            </span>
                                            <span className="rp-meta">{c.startDate ?? c.start ?? '—'}</span>
                                            <span className="rp-meta">{c.endDate ?? c.end ?? '—'}</span>
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
                        <KpiCard icon={<BookOpen size={18} />}  label="Total Teams"   value={allTeams.length}     color="#1C7ED6" />
                        <KpiCard icon={<CheckCircle size={18}/>}label="Healthy"       value={teamHealthData.find(x => x.name === 'Healthy')?.value ?? 0}   color="#2B8A3E" />
                        <KpiCard icon={<AlertCircle size={18}/>}label="At Risk"       value={teamHealthData.find(x => x.name === 'At Risk')?.value ?? 0}   color="#E67700" />
                        <KpiCard icon={<Activity size={18} />}  label="Critical"      value={teamHealthData.find(x => x.name === 'Critical')?.value ?? 0}  color="#E03131" />
                    </div>

                    {allTeams.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No team data returned from connected projects." /></div>
                    ) : (
                        <div className="rp-charts-row">
                            {teamHealthData.length > 0 && (
                                <div className="rp-chart-card">
                                    <SectionTitle>Team Health Distribution</SectionTitle>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={teamHealthData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                                                dataKey="value" nameKey="name" paddingAngle={3}>
                                                {teamHealthData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip formatter={(v) => v} />
                                            <Legend iconType="circle" iconSize={10} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <div className="rp-chart-card">
                                <SectionTitle>Teams by Project</SectionTitle>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={comparisonData} barSize={32}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="Teams" radius={[6, 6, 0, 0]}>
                                            {comparisonData.map((_, i) => (
                                                <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Team list */}
                    {allTeams.length > 0 && (
                        <div className="rp-chart-card">
                            <SectionTitle>Team List</SectionTitle>
                            <div className="rp-summary-table">
                                <div className="rp-summary-thead" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                                    <span>Team Name</span>
                                    <span>Project</span>
                                    <span>Members</span>
                                    <span>Health</span>
                                </div>
                                {allTeams.slice(0, 30).map((t, i) => {
                                    const health = t.healthStatus ?? t.health ?? '—';
                                    const hCol = { healthy: '#2B8A3E', 'at risk': '#E67700', critical: '#E03131' }[health.toLowerCase()] ?? '#868E96';
                                    const proj = projects.find(p => (teamsMap[p.id] ?? []).includes(t));
                                    const pIdx = proj ? projects.indexOf(proj) : i;
                                    return (
                                        <div key={i} className="rp-summary-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                                            <span className="rp-summary-name">{t.name ?? t.teamName ?? `Team ${i + 1}`}</span>
                                            <span>
                                                <span className="rp-project-tag" style={{ color: PROJECT_COLORS[pIdx % PROJECT_COLORS.length], background: `${PROJECT_COLORS[pIdx % PROJECT_COLORS.length]}15` }}>
                                                    {proj?.name ?? '—'}
                                                </span>
                                            </span>
                                            <span className="rp-num">{t.memberCount ?? t.members?.length ?? '—'}</span>
                                            <span>
                                                <span className="rp-status-pill ok" style={{ color: hCol, background: `${hCol}15` }}>{health}</span>
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
                    )}
                </div>
            )}

            {/* ── ACTIVITY ── */}
            {activeTab === 'activity' && (
                <div className="rp-body">
                    <div className="rp-kpi-row">
                        <KpiCard icon={<Bell size={18} />} label="Total Notifications" value={allNotifs.length} color="#1C7ED6" />
                        <KpiCard icon={<Activity size={18} />} label="Projects Reporting" value={Object.keys(notifsMap).length} color="#2B8A3E" />
                    </div>

                    {allNotifs.length === 0 ? (
                        <div className="rp-chart-card"><EmptyState message="No activity data returned from connected projects." /></div>
                    ) : (
                        <div className="rp-chart-card">
                            <SectionTitle>Recent Activity</SectionTitle>
                            <div className="rp-activity-list">
                                {allNotifs.map((n, i) => (
                                    <div key={i} className="rp-activity-row">
                                        <span className="rp-activity-dot" style={{ background: n._color }} />
                                        <div className="rp-activity-main">
                                            <p className="rp-activity-text">{n.message ?? n.title ?? n.body ?? JSON.stringify(n).slice(0, 80)}</p>
                                            <span className="rp-project-tag" style={{ color: n._color, background: `${n._color}15` }}>
                                                {n._projectName}
                                            </span>
                                        </div>
                                        <span className="rp-activity-time">
                                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
