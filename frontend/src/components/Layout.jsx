import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import '../styles/DashboardPage.css';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const getFormattedDate = () => {
        return new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const navItems = [
        {
            path: '/dashboard', label: 'Dashboard', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            )
        },
        {
            path: '/projects', label: 'Projects', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
            )
        },
        {
            path: '/ai-assistant', label: 'AI Assistant', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                </svg>
            )
        },
        {
            path: '/reports', label: 'Reports', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            )
        }
    ];

    return (
        <div className={`db-layout ${isCollapsed ? 'collapsed' : ''} anim-fade-in`}>
            {/* Sidebar */}
            <aside className="db-sidebar">
                <div className="db-sidebar-header">
                    <div className="db-sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </div>
                    <div className="db-sidebar-brand-group">
                        <span className="db-sidebar-logo-icon">🌸</span>
                        <span className="db-sidebar-brand">Blossom</span>
                    </div>
                </div>

                <div className="db-sidebar-profile">
                    <div className="db-sidebar-avatar">
                        <img src="https://ui-avatars.com/api/?name=John+Wick&background=D14931&color=fff" alt="Avatar" />
                    </div>
                    <div className="db-sidebar-meta">
                        <div className="db-sidebar-role-badge">UIUX Designer</div>
                        <div className="db-sidebar-name">
                            John Wick
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-chev">
                                <polyline points="7 10 12 15 17 10"></polyline>
                            </svg>
                        </div>
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

                    <div className="db-nav-section">
                        <div className="db-nav-label">Item</div>
                        <div className="db-sidebar-link">
                            <span className="db-sidebar-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </span>
                            <span>Website Creation</span>
                        </div>
                        <div className="db-sidebar-link">
                            <span className="db-sidebar-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </span>
                            <span>UX Research</span>
                        </div>
                        <div className="db-sidebar-link">
                            <span className="db-sidebar-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </span>
                            <span>Usability Testing</span>
                            <span className="db-badge">2</span>
                        </div>
                    </div>
                </div>

                <div className="db-sidebar-bottom">
                    <div className="db-sidebar-link">
                        <span className="db-sidebar-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </span>
                        <span>Settings</span>
                    </div>
                    <div className="db-sidebar-link" onClick={() => navigate('/')}>
                        <span className="db-sidebar-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-sidebar-icon">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </span>
                        <span>Log Out</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area populated by nested routes */}
            <main className="db-main">
                {/* Topbar Shared */}
                <header className="db-topbar">
                    <div className="db-topbar-date">
                        {getFormattedDate()}
                    </div>
                    <div className="db-topbar-right">
                        <div className="db-search-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="db-search-icon">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search"
                            />
                        </div>
                        <div className="db-icons-group">
                            <div className="db-icon-btn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div className="db-icon-btn">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                <div className="db-bell-dot"></div>
                            </div>
                        </div>
                        <div className="db-welcome">
                            Welcome, Chairman!
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
