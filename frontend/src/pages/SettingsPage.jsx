import { useState, useRef, useEffect } from 'react';
import {
    User,
    Palette,
    Bell,
    Lock,
    Camera,
    Check,
    Trash2,
    ShieldAlert,
    Smartphone,
    Mail,
    Globe
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import '../styles/SettingsPage.css';

const themes = [
    { name: 'Slate Grey', color: '#77838c', bg: '#FFF' }, // Flagship brand color
    { name: 'Arctic', color: '#1C7ED6', bg: '#FFF' },
    { name: 'Obsidian', color: '#111111', bg: '#FFF' },
    { name: 'Sage', color: '#2B8A3E', bg: '#FFF' },
    { name: 'Royal Purple', color: '#6741D9', bg: '#FFF' }
];

export default function SettingsPage() {
    const { user, updateUser } = useUser();
    const [activeSection, setActiveSection] = useState('Profile');
    const [theme, setTheme] = useState('Blossom');
    const [notifications, setNotifications] = useState({
        marketing: true,
        security: true,
        system: true,
        digest: false
    });

    // Local form state
    const [profileData, setProfileData] = useState(user);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', null

    // Sync local state if global user changes (e.g. from elsewhere, though unlikely here)
    useEffect(() => {
        setProfileData(user);
    }, [user]);

    const fileInputRef = useRef(null);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setSaveStatus('saving');
        // Simulate API call and update global state
        setTimeout(() => {
            updateUser(profileData);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        }, 800);
    };

    const handleDiscard = () => {
        setProfileData(user);
    };

    // Updates CSS variables for live preview
    const applyTheme = (t) => {
        setTheme(t.name);
        document.documentElement.style.setProperty('--c-accent', t.color);
        document.documentElement.style.setProperty('--c-accent-2', `${t.color}EE`);
        document.documentElement.style.setProperty('--c-accent-bg', `${t.color}0D`);
        document.documentElement.style.setProperty('--c-accent-bd', `${t.color}26`);
    };

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="settings-root anim-fade-in">
            <header className="settings-header">
                <h1 className="settings-title">System Settings</h1>
                <p className="settings-subtitle">Manage your profile, application theme, and notification preferences.</p>
            </header>

            <div className="settings-container">
                <aside className="settings-nav">
                    {[
                        { id: 'Profile', icon: <User size={18} /> },
                        { id: 'Appearance', icon: <Palette size={18} /> },
                        { id: 'Notifications', icon: <Bell size={18} /> },
                        { id: 'Security', icon: <Lock size={18} /> }
                    ].map(section => (
                        <button
                            key={section.id}
                            className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <span className="nav-icon">{section.icon}</span>
                            {section.id}
                        </button>
                    ))}
                </aside>

                <main className="settings-content">
                    {activeSection === 'Profile' && (
                        <section className="settings-section anim-slide-up">
                            <div className="section-header">
                                <h2 className="section-title">Public Profile</h2>
                                <p className="section-desc">Manage your public presence and professional bio.</p>
                            </div>

                            <div className="profile-hero-card">
                                <div className="profile-sidebar">
                                    <div className="profile-avatar-container">
                                        <div className="avatar-ring"></div>
                                        {profileData.avatar ? (
                                            <img src={profileData.avatar} className="profile-avatar-img" alt="Profile" />
                                        ) : (
                                            <div className="profile-avatar-main">
                                                {profileData.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                        )}
                                        <button className="avatar-upload-trigger" onClick={handleAvatarClick} title="Upload photo">
                                            <Camera size={18} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="profile-meta">
                                        <h3 className="profile-name">{profileData.name}</h3>
                                        <span className="profile-badge">Chairman</span>
                                    </div>
                                </div>

                                <div className="profile-form-main">
                                    <div className="form-section">
                                        <h4 className="form-section-title">Personal Information</h4>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Display Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={profileData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="Your name"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Email Address</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profileData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="email@address.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h4 className="form-section-title">Professional Bio</h4>
                                        <div className="form-group">
                                            <label>Biography</label>
                                            <textarea
                                                name="bio"
                                                value={profileData.bio}
                                                onChange={handleInputChange}
                                                placeholder="Tell us about yourself..."
                                                rows="4"
                                            />
                                            <span className="field-hint">Brief description for your profile. Maximum 200 characters.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Appearance' && (
                        <section className="settings-section anim-slide-up">
                            <div className="section-header">
                                <h2 className="section-title">Design & Feel</h2>
                                <p className="section-desc">Customize the color palette and interface density of your dashboard.</p>
                            </div>

                            <div className="theme-grid">
                                {themes.map(t => (
                                    <div
                                        key={t.name}
                                        className={`theme-card ${theme === t.name ? 'active' : ''}`}
                                        onClick={() => applyTheme(t)}
                                        style={{ '--theme-preview-color': t.color }}
                                    >
                                        <div className="theme-preview" style={{ background: '#F8F8F8' }}>
                                            <div className="preview-accent" style={{ background: t.color }}></div>
                                            <div className="preview-block" style={{ background: t.color, opacity: 0.1 }}></div>
                                        </div>
                                        <span className="theme-name">{t.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="setting-box">
                                <h3 className="sub-section-title">Interface Density</h3>
                                <div className="density-toggle">
                                    <button className="density-btn active">Standard</button>
                                    <button className="density-btn">Compact</button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Notifications' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Notifications</h2>
                            <p className="section-desc">Choose which updates you'd like to receive in real-time.</p>

                            <div className="notifications-list">
                                {[
                                    { id: 'security', label: 'Security Alerts', desc: 'Critical alerts about your account safety.' },
                                    { id: 'system', label: 'System Updates', desc: 'New feature releases and maintenance news.' },
                                    { id: 'marketing', label: 'Marketing Info', desc: 'Updates about tools and mentorship sessions.' },
                                    { id: 'digest', label: 'Weekly Digest', desc: 'A summary of cohort progress every Monday.' }
                                ].map(notif => (
                                    <div key={notif.id} className="notif-item">
                                        <div className="notif-info">
                                            <span className="notif-label">{notif.label}</span>
                                            <span className="notif-desc">{notif.desc}</span>
                                        </div>
                                        <div
                                            className={`toggle-switch ${notifications[notif.id] ? 'on' : ''}`}
                                            onClick={() => toggleNotification(notif.id)}
                                        >
                                            <div className="toggle-knob"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeSection === 'Security' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Security & Privacy</h2>
                            <div className="security-form">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" placeholder="••••••••" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input type="password" placeholder="New password" />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input type="password" placeholder="Confirm new password" />
                                    </div>
                                </div>
                                <div className="setting-box danger-zone">
                                    <div className="danger-info">
                                        <span className="danger-label">Account Sessions</span>
                                        <span className="danger-desc">Log out from all other devices currenty active.</span>
                                    </div>
                                    <button className="btn btn-ghost danger-btn">Log Out All</button>
                                </div>
                            </div>
                        </section>
                    )}

                    <div className="settings-actions">
                        <button
                            className={`btn btn-solid settings-save ${saveStatus === 'success' ? 'btn-success' : ''}`}
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {saveStatus === 'saving' ? (
                                'Saving...'
                            ) : saveStatus === 'success' ? (
                                <>
                                    <Check size={18} />
                                    Saved
                                </>
                            ) : (
                                'Save changes'
                            )}
                        </button>
                        <button className="btn btn-subtle" onClick={handleDiscard}>Discard</button>
                    </div>
                </main>
            </div>
        </div>
    );
}
