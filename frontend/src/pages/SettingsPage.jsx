import { useState } from 'react';
import '../styles/SettingsPage.css';

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('Profile');
    const [theme, setTheme] = useState('Blossom');
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        slack: true
    });

    const themes = [
        { name: 'Blossom', color: '#EB5E28', bg: '#FFF8F6' },
        { name: 'Arctic', color: '#0077B6', bg: '#F0F8FF' },
        { name: 'Obsidian', color: '#2D2D2D', bg: '#F5F5F5' },
        { name: 'Sage', color: '#4A7C59', bg: '#F4F9F4' }
    ];

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="settings-root anim-fade-in">
            <header className="settings-header">
                <h1 className="settings-title">Settings</h1>
                <p className="settings-subtitle">Manage your account preferences and system configuration.</p>
            </header>

            <div className="settings-container">
                {/* Sidebar Navigation */}
                <aside className="settings-nav">
                    {['Profile', 'Appearance', 'Notifications', 'Security'].map(section => (
                        <button
                            key={section}
                            className={`settings-nav-item ${activeSection === section ? 'active' : ''}`}
                            onClick={() => setActiveSection(section)}
                        >
                            {section}
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="settings-content">
                    {activeSection === 'Profile' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Public Profile</h2>
                            <div className="profile-card">
                                <div className="profile-avatar-wrap">
                                    <div className="profile-avatar">JW</div>
                                    <button className="avatar-edit-btn">Change Avatar</button>
                                </div>
                                <div className="profile-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" defaultValue="John Wick" />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" defaultValue="john.wick@continental.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Bio</label>
                                        <textarea defaultValue="Professional UI/UX Designer focusing on premium enterprise experiences." />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Appearance' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Design & Feel</h2>
                            <p className="section-desc">Customize the visual identity of your workspace.</p>

                            <div className="theme-grid">
                                {themes.map(t => (
                                    <div
                                        key={t.name}
                                        className={`theme-card ${theme === t.name ? 'active' : ''}`}
                                        onClick={() => setTheme(t.name)}
                                        style={{ '--theme-color': t.color }}
                                    >
                                        <div className="theme-preview" style={{ background: t.bg }}>
                                            <div className="preview-accent" style={{ background: t.color }}></div>
                                        </div>
                                        <span className="theme-name">{t.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="layout-mode">
                                <h3 className="sub-section-title">Interface Density</h3>
                                <div className="density-toggle">
                                    <button className="density-btn active">Relaxed</button>
                                    <button className="density-btn">Compact</button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Notifications' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Notification Preferences</h2>
                            <div className="notifications-list">
                                {Object.entries(notifications).map(([key, val]) => (
                                    <div key={key} className="notif-item">
                                        <div className="notif-info">
                                            <span className="notif-label">{key.charAt(0).toUpperCase() + key.slice(1)} Notifications</span>
                                            <span className="notif-desc">Receive alerts and updates via {key}.</span>
                                        </div>
                                        <div
                                            className={`toggle-switch ${val ? 'on' : ''}`}
                                            onClick={() => toggleNotification(key)}
                                        >
                                            <div className="toggle-knob"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="settings-actions">
                        <button className="btn btn-solid settings-save">Save Changes</button>
                        <button className="btn btn-subtle">Reset to Default</button>
                    </div>
                </main>
            </div>
        </div>
    );
}
