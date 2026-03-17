import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, LayoutGrid, List, ShieldAlert, ArrowUpRight,
    Users, BookOpen, Award, TrendingUp, Clock, CheckCircle,
    XCircle, AlertCircle, RefreshCw, Filter
} from 'lucide-react';
import AddProductModal from '../components/AddProductModal';
import '../styles/ProjectsPage.css';

const STATUS_META = {
    active:      { label: 'Active',      color: '#2B8A3E', bg: '#EBFBEE', icon: <CheckCircle size={12} /> },
    'in progress':{ label: 'In Progress', color: '#1C7ED6', bg: '#E7F5FF', icon: <Clock size={12} /> },
    planning:    { label: 'Planning',    color: '#E67700', bg: '#FFF3BF', icon: <AlertCircle size={12} /> },
    error:       { label: 'Offline',     color: '#E03131', bg: '#FFF5F5', icon: <XCircle size={12} /> },
    beta:        { label: 'Beta',        color: '#6741D9', bg: '#F3F0FF', icon: <TrendingUp size={12} /> },
};

function getStatusMeta(status = '') {
    return STATUS_META[status.toLowerCase()] || STATUS_META['planning'];
}

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className="pp-stat-card">
            <div className="pp-stat-icon" style={{ background: `${color}15`, color }}>{icon}</div>
            <div>
                <p className="pp-stat-value">{value}</p>
                <p className="pp-stat-label">{label}</p>
                {sub && <p className="pp-stat-sub">{sub}</p>}
            </div>
        </div>
    );
}

function ProjectListItem({ project, onClick }) {
    const sm = getStatusMeta(project.status);
    return (
        <div className="pp-list-item" onClick={onClick}>
            <div className="pp-list-avatar">{project.name[0]}</div>
            <div className="pp-list-main">
                <div className="pp-list-top">
                    <h3 className="pp-list-name">{project.name}</h3>
                    <span className="pp-status-badge" style={{ color: sm.color, background: sm.bg }}>
                        {sm.icon}{sm.label}
                    </span>
                </div>
                <p className="pp-list-desc">{project.description}</p>
                <div className="pp-list-meta">
                    <span><Users size={13} /> {project.kpis?.totalLearners ?? 0} learners</span>
                    <span><BookOpen size={13} /> {project.kpis?.totalTeams ?? 0} teams</span>
                    <span><Award size={13} /> {project.kpis?.totalMentors ?? 0} mentors</span>
                    <span className="pp-category-tag">{project.category}</span>
                </div>
            </div>
            <div className="pp-list-progress">
                <div className="pp-prog-wrap">
                    <div className="pp-prog-bar">
                        <div className="pp-prog-fill" style={{ width: `${project.progress}%`, background: sm.color }} />
                    </div>
                    <span className="pp-prog-label">{project.progress}%</span>
                </div>
                <button className="pp-view-btn">
                    View <ArrowUpRight size={14} />
                </button>
            </div>
        </div>
    );
}

function ProjectGridItem({ project, onClick }) {
    const sm = getStatusMeta(project.status);
    return (
        <div className="pp-grid-card" onClick={onClick}>
            <div className="pp-grid-header">
                <div className="pp-grid-avatar">{project.name[0]}</div>
                <span className="pp-status-badge" style={{ color: sm.color, background: sm.bg }}>
                    {sm.icon}{sm.label}
                </span>
            </div>
            <h3 className="pp-grid-name">{project.name}</h3>
            <p className="pp-grid-desc">{project.description}</p>
            <div className="pp-grid-kpis">
                <div className="pp-kpi-chip"><Users size={13} />{project.kpis?.totalLearners ?? 0}<span>Learners</span></div>
                <div className="pp-kpi-chip"><BookOpen size={13} />{project.kpis?.totalTeams ?? 0}<span>Teams</span></div>
                <div className="pp-kpi-chip"><Award size={13} />{project.kpis?.totalMentors ?? 0}<span>Mentors</span></div>
            </div>
            <div className="pp-grid-footer">
                <div style={{ flex: 1 }}>
                    <div className="pp-prog-bar">
                        <div className="pp-prog-fill" style={{ width: `${project.progress}%`, background: sm.color }} />
                    </div>
                    <span className="pp-prog-label">{project.progress}%</span>
                </div>
                <button className="pp-view-btn">View <ArrowUpRight size={14} /></button>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const navigate = useNavigate();
    const [view, setView] = useState('grid');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    async function fetchProjects() {
        try {
            const res = await fetch('/api/projects');
            if (res.status === 401) throw new Error('401');
            if (!res.ok) throw new Error('Failed to reach backend');
            const configs = await res.json();

            const hydrated = await Promise.all(configs.map(async (proj) => {
                try {
                    const stats = await fetch(`/api/projects/${proj.id}/proxy/api/admin/stats`);
                    if (!stats.ok) throw new Error();
                    const s = await stats.json();
                    return {
                        id: proj.id, name: proj.name, category: proj.category || 'Platform',
                        status: proj.status || 'Active', description: proj.description || '',
                        progress: Math.min(100, Math.round(((s.totalLearners || 0) / 3000) * 100)) || 72,
                        kpis: {
                            totalLearners: s.totalLearners || 0, totalTeams: s.totalTeams || 0,
                            totalMentors: s.totalMentors || 0, totalApplications: s.totalApplications || 0,
                        }
                    };
                } catch {
                    return {
                        id: proj.id, name: proj.name, category: 'Offline',
                        status: 'Error', description: 'Could not sync with MCP server.',
                        progress: 0, kpis: { totalLearners: 0, totalTeams: 0, totalMentors: 0, totalApplications: 0 }
                    };
                }
            }));
            setProjects(hydrated);
            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => { fetchProjects(); }, []);

    const handleRefresh = () => { setRefreshing(true); fetchProjects(); };

    const statuses = ['All', ...new Set(projects.map(p => p.status))];

    const filtered = projects
        .filter(p => {
            const q = search.toLowerCase();
            const matchSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
            const matchStatus = statusFilter === 'All' || p.status.toLowerCase() === statusFilter.toLowerCase();
            return matchSearch && matchStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'learners') return (b.kpis?.totalLearners ?? 0) - (a.kpis?.totalLearners ?? 0);
            if (sortBy === 'progress') return b.progress - a.progress;
            return a.name.localeCompare(b.name);
        });

    const totalLearners = projects.reduce((s, p) => s + (p.kpis?.totalLearners ?? 0), 0);
    const totalTeams    = projects.reduce((s, p) => s + (p.kpis?.totalTeams ?? 0), 0);
    const totalMentors  = projects.reduce((s, p) => s + (p.kpis?.totalMentors ?? 0), 0);
    const activeCount   = projects.filter(p => p.status?.toLowerCase() === 'active').length;

    return (
        <div className="pp-root anim-fade-in">
            <div className="pp-header">
                <div>
                    <h1 className="pp-title">Projects</h1>
                    <p className="pp-subtitle">{projects.length} connected platform{projects.length !== 1 ? 's' : ''} across your portfolio</p>
                </div>
                <div className="pp-header-actions">
                    <button className={`pp-icon-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button className="pp-add-btn" onClick={() => setIsAddOpen(true)}>
                        <Plus size={16} /> Add Project
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="pp-stats-row">
                <StatCard icon={<LayoutGrid size={18} />} label="Total Projects" value={projects.length} color="#6741D9" />
                <StatCard icon={<CheckCircle size={18} />} label="Active" value={activeCount} color="#2B8A3E" />
                <StatCard icon={<Users size={18} />} label="Total Learners" value={totalLearners.toLocaleString()} color="#1C7ED6" />
                <StatCard icon={<BookOpen size={18} />} label="Total Teams" value={totalTeams} color="#E67700" />
                <StatCard icon={<Award size={18} />} label="Total Mentors" value={totalMentors} color="#E03131" />
            </div>

            {/* Toolbar */}
            <div className="pp-toolbar">
                <div className="pp-search">
                    <Search size={15} className="pp-search-icon" />
                    <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="pp-toolbar-right">
                    <div className="pp-filter-group">
                        <Filter size={14} />
                        {statuses.map(s => (
                            <button key={s} className={`pp-filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
                        ))}
                    </div>
                    <select className="pp-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="name">Sort: Name</option>
                        <option value="learners">Sort: Learners</option>
                        <option value="progress">Sort: Progress</option>
                    </select>
                    <div className="pp-view-toggle">
                        <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><LayoutGrid size={16} /></button>
                        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pp-content">
                {loading ? (
                    <div className="pp-empty">
                        <RefreshCw size={32} className="spinning" style={{ color: 'var(--c-accent)' }} />
                        <p>Loading project data...</p>
                    </div>
                ) : error === '401' ? (
                    <div className="pp-empty pp-auth-error">
                        <ShieldAlert size={40} color="var(--c-accent)" />
                        <h3>Backend credentials required</h3>
                        <p>Add your credentials to <code>.env</code> and restart the backend server.</p>
                        <pre>SV_EMAIL=your@email.com{'\n'}SV_PASSWORD=yourpassword</pre>
                    </div>
                ) : error ? (
                    <div className="pp-empty"><p style={{ color: '#E03131' }}>⚠ {error}</p></div>
                ) : filtered.length === 0 ? (
                    <div className="pp-empty"><p>No projects match your filters.</p></div>
                ) : view === 'grid' ? (
                    <div className="pp-grid">
                        {filtered.map((p, i) => (
                            <ProjectGridItem key={p.id} project={p} onClick={() => navigate(`/project/${p.id}`)} />
                        ))}
                    </div>
                ) : (
                    <div className="pp-list">
                        {filtered.map((p) => (
                            <ProjectListItem key={p.id} project={p} onClick={() => navigate(`/project/${p.id}`)} />
                        ))}
                    </div>
                )}
            </div>

            {isAddOpen && (
                <AddProductModal
                    onClose={() => setIsAddOpen(false)}
                    onAddProject={(np) => { setProjects(prev => [np, ...prev]); setIsAddOpen(false); }}
                />
            )}
        </div>
    );
}
