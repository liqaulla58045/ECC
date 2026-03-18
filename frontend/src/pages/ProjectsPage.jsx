import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, LayoutGrid, List, ArrowUpRight,
    Users, BookOpen, Award, TrendingUp, Clock, CheckCircle,
    XCircle, AlertCircle, RefreshCw, Filter, Trash2
} from 'lucide-react';
import { apiJson, api } from '../utils/api';
import AddProductModal from '../components/AddProductModal';
import '../styles/ProjectsPage.css';

const STATUS_META = {
    active:       { label: 'Active',      color: '#2B8A3E', bg: '#EBFBEE', icon: <CheckCircle size={12} /> },
    'in progress':{ label: 'In Progress', color: '#1C7ED6', bg: '#E7F5FF', icon: <Clock size={12} /> },
    planning:     { label: 'Planning',    color: '#E67700', bg: '#FFF3BF', icon: <AlertCircle size={12} /> },
    error:        { label: 'Offline',     color: '#E03131', bg: '#FFF5F5', icon: <XCircle size={12} /> },
    beta:         { label: 'Beta',        color: '#6741D9', bg: '#F3F0FF', icon: <TrendingUp size={12} /> },
};

function getStatusMeta(status = '') {
    return STATUS_META[status.toLowerCase()] || STATUS_META['planning'];
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="pp-stat-card">
            <div className="pp-stat-icon" style={{ background: `${color}15`, color }}>{icon}</div>
            <div>
                <p className="pp-stat-value">{value}</p>
                <p className="pp-stat-label">{label}</p>
            </div>
        </div>
    );
}

function ProjectListItem({ project, onClick, onDelete }) {
    const sm = getStatusMeta(project.status);
    const domain = getDomain(project.mcpUrl || project.liveUrl);
    const [faviconErr, setFaviconErr] = useState(false);
    return (
        <div className="pp-list-item" onClick={onClick}>
            <div className="pp-list-avatar" style={{ background: `${sm.color}15`, color: sm.color }}>
                {domain && !faviconErr ? (
                    <img src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`}
                        style={{ width: 24, height: 24 }} onError={() => setFaviconErr(true)} alt="" />
                ) : project.name[0]}
            </div>
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
                <button className="pp-view-btn">View <ArrowUpRight size={14} /></button>
                <button className="pp-delete-btn" title="Remove project"
                    onClick={e => { e.stopPropagation(); onDelete(project); }}>
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

function getDomain(url) {
    if (!url) return null;
    try {
        return new URL(url.includes('://') ? url : `https://${url}`).hostname;
    } catch { return null; }
}

function ProjectGridItem({ project, onClick, onDelete }) {
    const sm = getStatusMeta(project.status);
    const domain = getDomain(project.mcpUrl || project.liveUrl);
    const [faviconErr, setFaviconErr] = useState(false);

    return (
        <div className="pp-grid-card" onClick={onClick}>
            {/* Color accent top strip */}
            <div className="pp-grid-strip" style={{ background: `linear-gradient(90deg, ${sm.color}, ${sm.color}88)` }} />

            {/* Header row */}
            <div className="pp-grid-header">
                <div className="pp-grid-icon-wrap">
                    {domain && !faviconErr ? (
                        <img
                            src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`}
                            className="pp-grid-favicon"
                            onError={() => setFaviconErr(true)}
                            alt=""
                        />
                    ) : (
                        <div className="pp-grid-avatar" style={{ background: `${sm.color}18`, color: sm.color }}>
                            {project.name[0]}
                        </div>
                    )}
                </div>
                <div className="pp-grid-title-block">
                    <h3 className="pp-grid-name">{project.name}</h3>
                    {domain && <p className="pp-grid-domain">{domain}</p>}
                </div>
                <div className="pp-grid-badges">
                    <span className="pp-status-badge" style={{ color: sm.color, background: sm.bg }}>
                        <span className="pp-status-dot" style={{ background: sm.color }} />{sm.label}
                    </span>
                    <button className="pp-delete-btn" title="Remove project"
                        onClick={e => { e.stopPropagation(); onDelete(project); }}>
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            <p className="pp-grid-desc">{project.description}</p>

            {/* KPI row */}
            <div className="pp-grid-kpis">
                <div className="pp-kpi-chip">
                    <Users size={12} style={{ color: '#1C7ED6' }} />
                    <strong>{(project.kpis?.totalLearners ?? 0).toLocaleString()}</strong>
                    <span>Learners</span>
                </div>
                <div className="pp-kpi-chip">
                    <BookOpen size={12} style={{ color: '#2B8A3E' }} />
                    <strong>{project.kpis?.totalTeams ?? 0}</strong>
                    <span>Teams</span>
                </div>
                <div className="pp-kpi-chip">
                    <Award size={12} style={{ color: '#6741D9' }} />
                    <strong>{project.kpis?.totalMentors ?? 0}</strong>
                    <span>Mentors</span>
                </div>
                <div className="pp-kpi-chip">
                    <TrendingUp size={12} style={{ color: '#E67700' }} />
                    <strong>{project.kpis?.totalApplications ?? 0}</strong>
                    <span>Apps</span>
                </div>
            </div>

            {/* Footer */}
            <div className="pp-grid-footer">
                <div className="pp-footer-progress">
                    <div className="pp-footer-prog-labels">
                        <span className="pp-prog-label">Progress</span>
                        <span className="pp-prog-label" style={{ color: sm.color, fontWeight: 800 }}>{project.progress}%</span>
                    </div>
                    <div className="pp-prog-bar">
                        <div className="pp-prog-fill" style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${sm.color}, ${sm.color}bb)` }} />
                    </div>
                </div>
                <button className="pp-view-btn" style={{ borderColor: sm.color, color: sm.color }}>
                    View <ArrowUpRight size={13} />
                </button>
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
            const configs = await apiJson('/api/projects');

            const hydrated = await Promise.all(configs.map(async (proj) => {
                try {
                    const stats = await apiJson(`/api/projects/${proj.id}/stats`);
                    return {
                        id: proj.id,
                        name: proj.name,
                        category: proj.category || 'Platform',
                        status: proj.status || 'Active',
                        description: proj.description || '',
                        progress: proj.progress || 0,
                        kpis: {
                            totalLearners:    stats?.total_learners     || 0,
                            totalTeams:       stats?.total_teams        || 0,
                            totalMentors:     stats?.total_mentors      || 0,
                            totalApplications: stats?.total_applications || 0,
                        },
                    };
                } catch {
                    return {
                        id: proj.id,
                        name: proj.name,
                        category: proj.category || 'Platform',
                        status: proj.status || 'Active',
                        description: proj.description || '',
                        progress: proj.progress || 0,
                        kpis: { totalLearners: 0, totalTeams: 0, totalMentors: 0, totalApplications: 0 },
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

    const handleDelete = async (project) => {
        if (!window.confirm(`Remove "${project.name}" from the dashboard?\n\nThis cannot be undone.`)) return;
        try {
            const res = await api(`/api/projects/${project.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const d = await res.json();
                alert(d.error || 'Failed to delete project');
                return;
            }
            setProjects(prev => prev.filter(p => p.id !== project.id));
        } catch {
            alert('Could not connect to server.');
        }
    };

    const statuses = ['All', ...new Set(projects.map(p => p.status))];

    const filtered = projects
        .filter(p => {
            const q = search.toLowerCase();
            const matchSearch = p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q);
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
            <div className="page-hero">
                <div className="page-hero-mesh" />
                <div className="page-hero-content">
                    <div className="page-hero-row">
                        <div className="page-hero-left">
                            <p className="page-hero-eyebrow">Portfolio Management</p>
                            <h1 className="page-hero-title">Connected Projects</h1>
                            <p className="page-hero-subtitle">{projects.length} platform{projects.length !== 1 ? 's' : ''} integrated across your enterprise</p>
                        </div>
                        <div className="page-hero-right">
                            <button className={`pp-icon-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="Refresh" style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)' }}>
                                <RefreshCw size={16} />
                            </button>
                            <button className="db-add-btn" onClick={() => setIsAddOpen(true)}>
                                <Plus size={16} /> Add Project
                            </button>
                        </div>
                    </div>
                    <div className="page-hero-chips">
                        <span className="page-hero-chip"><strong>{projects.length}</strong>&nbsp;Total</span>
                        <span className="page-hero-chip"><strong>{activeCount}</strong>&nbsp;Active</span>
                        <span className="page-hero-chip"><strong>{totalLearners.toLocaleString()}</strong>&nbsp;Learners</span>
                        <span className="page-hero-chip"><strong>{totalTeams}</strong>&nbsp;Teams</span>
                        <span className="page-hero-chip"><strong>{totalMentors}</strong>&nbsp;Mentors</span>
                    </div>
                </div>
            </div>

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

            <div className="pp-content">
                {loading ? (
                    <div className="pp-empty">
                        <RefreshCw size={32} className="spinning" style={{ color: 'var(--c-accent)' }} />
                        <p>Loading project data...</p>
                    </div>
                ) : error ? (
                    <div className="pp-empty"><p style={{ color: '#E03131' }}>⚠ {error}</p></div>
                ) : filtered.length === 0 ? (
                    <div className="pp-empty">
                        <p>{projects.length === 0 ? 'No projects yet. Add your first project.' : 'No projects match your filters.'}</p>
                    </div>
                ) : view === 'grid' ? (
                    <div className="pp-grid">
                        {filtered.map(p => (
                            <ProjectGridItem key={p.id} project={p} onClick={() => navigate(`/project/${p.id}`)} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="pp-list">
                        {filtered.map(p => (
                            <ProjectListItem key={p.id} project={p} onClick={() => navigate(`/project/${p.id}`)} onDelete={handleDelete} />
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
