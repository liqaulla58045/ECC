import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    Search,
    Sidebar,
    Globe,
    X,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { apiJson } from '../utils/api';
import '../styles/DashboardPage.css';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useUser();
    const logoUrl = `${import.meta.env.BASE_URL}rooman-logo.png`;
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery]   = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDrop, setShowDrop]         = useState(false);
    const [allProjects, setAllProjects]   = useState([]);
    const searchRef = useRef(null);

    const getFormattedDate = () =>
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Fetch projects once for search index
    useEffect(() => {
        apiJson('/api/projects').then(d => setAllProjects(d.projects || [])).catch(() => {});
    }, []);

    // Filter on query change
    useEffect(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) { setSearchResults([]); setShowDrop(false); return; }
        const hits = allProjects.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.platform_url?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        ).slice(0, 6);
        setSearchResults(hits);
        setShowDrop(true);
    }, [searchQuery, allProjects]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleResultClick = (project) => {
        setSearchQuery('');
        setShowDrop(false);
        navigate(`/projects/${project.id}`);
    };

    const navItems = [
        { path: '/dashboard',    label: 'Dashboard',    icon: <LayoutDashboard className="db-sidebar-icon" /> },
        { path: '/projects',     label: 'Projects',     icon: <Briefcase       className="db-sidebar-icon" /> },
        { path: '/ai-assistant', label: 'AI Assistant', icon: <MessageSquare   className="db-sidebar-icon" /> },
        { path: '/reports',      label: 'Reports',      icon: <BarChart3       className="db-sidebar-icon" /> },
    ];

    const displayName = user?.name?.split(' ')[0] || user?.firstName || user?.username || 'Chairman';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className={`db-layout ${isCollapsed ? 'collapsed' : ''} anim-fade-in`}>
            {/* Sidebar */}
            <aside className="db-sidebar">
                <div className="db-sidebar-header">
                    <div className="db-sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                        <Sidebar size={20} />
                    </div>
                    <div className="db-sidebar-brand-group">
                        <img src={logoUrl} className="db-sidebar-brand-logo" alt="Rooman" />
                    </div>
                </div>

                <div className="db-sidebar-nav">
                    <div className="db-nav-section">
                        {navItems.map(item => (
                            <div
                                key={item.path}
                                className={`db-sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                                title={isCollapsed ? item.label : ''}
                            >
                                <span className="db-sidebar-icon-wrapper">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="db-sidebar-bottom">
                    <div
                        className={`db-sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}
                        onClick={() => navigate('/settings')}
                    >
                        <span className="db-sidebar-icon-wrapper"><Settings className="db-sidebar-icon" /></span>
                        <span>Settings</span>
                    </div>
                    <div className="db-sidebar-link" onClick={() => { logout(); navigate('/'); }}>
                        <span className="db-sidebar-icon-wrapper"><LogOut className="db-sidebar-icon" /></span>
                        <span>Log Out</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="db-main">
                <header className="db-topbar">
                    <div className="db-topbar-date">{getFormattedDate()}</div>

                    <div className="db-topbar-right">
                        {/* Search */}
                        <div className="db-search-box" ref={searchRef}>
                            <Search className="db-search-icon" size={16} />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery && setShowDrop(true)}
                            />
                            {searchQuery && (
                                <button className="db-search-clear" onClick={() => { setSearchQuery(''); setShowDrop(false); }}>
                                    <X size={14} />
                                </button>
                            )}
                            {showDrop && (
                                <div className="db-search-dropdown">
                                    {searchResults.length === 0 ? (
                                        <div className="db-search-empty">No projects found</div>
                                    ) : searchResults.map(p => (
                                        <div key={p.id} className="db-search-item" onClick={() => handleResultClick(p)}>
                                            <div className="db-search-item-icon">
                                                <Globe size={14} />
                                            </div>
                                            <div className="db-search-item-info">
                                                <span className="db-search-item-name">{p.name}</span>
                                                <span className="db-search-item-url">{p.platform_url}</span>
                                            </div>
                                            <span className={`db-search-item-badge db-search-badge--${(p.status || 'active').toLowerCase()}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Profile chip */}
                        <div className="db-profile-chip" onClick={() => navigate('/settings')} title="Profile Settings">
                            {user?.avatar ? (
                                <img src={user.avatar} className="db-profile-avatar-img" alt={displayName} />
                            ) : (
                                <div className="db-profile-avatar-initials">{initials}</div>
                            )}
                            <span className="db-profile-name">{displayName}</span>
                        </div>
                    </div>
                </header>

                <div className="db-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
