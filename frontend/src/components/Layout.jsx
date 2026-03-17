import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    Search,
    Bell,
    MessageCircle,
    ChevronDown,
    Activity,
    Sidebar
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import '../styles/DashboardPage.css';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const getFormattedDate = () => {
        return new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const navItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="db-sidebar-icon" />
        },
        {
            path: '/projects',
            label: 'Projects',
            icon: <Briefcase className="db-sidebar-icon" />
        },
        {
            path: '/ai-assistant',
            label: 'AI Assistant',
            icon: <MessageSquare className="db-sidebar-icon" />
        },
        {
            path: '/reports',
            label: 'Reports',
            icon: <BarChart3 className="db-sidebar-icon" />
        }
    ];

    return (
        <div className={`db-layout ${isCollapsed ? 'collapsed' : ''} anim-fade-in`}>
            {/* Sidebar */}
            <aside className="db-sidebar">
                <div className="db-sidebar-header">
                    <div className="db-sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
                        <Sidebar size={20} />
                    </div>
                    <div className="db-sidebar-brand-group">
                        <Activity className="db-sidebar-logo-icon" size={20} />
                        <span className="db-sidebar-brand">ECC Dashboard</span>
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
                        <span className="db-sidebar-icon-wrapper">
                            <Settings className="db-sidebar-icon" />
                        </span>
                        <span>Settings</span>
                    </div>
                    <div className="db-sidebar-link" onClick={() => navigate('/')}>
                        <span className="db-sidebar-icon-wrapper">
                            <LogOut className="db-sidebar-icon" />
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
                            <Search className="db-search-icon" size={16} />
                            <input
                                type="text"
                                placeholder="Search portfolio..."
                            />
                        </div>

                        <div className="db-welcome">
                            Welcome, {user.name.split(' ')[0]}
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
