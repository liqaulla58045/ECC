import { useState, useRef, useEffect } from 'react';
import {
    User,
    Palette,
    Bell,
    Lock,
    Camera,
    Check,
    Search,
    ChevronRight,
    ChevronDown,
    Shield,
    Eye,
    EyeOff,
    Globe,
    HelpCircle,
    UserCheck,
    Mail,
    Smartphone,
    Layout,
    X,
    LogOut,
    AlertTriangle,
    MessageSquare,
    BookOpen,
    ExternalLink
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import '../styles/SettingsPage.css';

const themes = [
    { name: 'Slate Grey', color: '#77838c', bg: '#FFF' },
    { name: 'Arctic', color: '#1C7ED6', bg: '#FFF' },
    { name: 'Obsidian', color: '#111111', bg: '#FFF' },
    { name: 'Sage', color: '#2B8A3E', bg: '#FFF' },
    { name: 'Royal Purple', color: '#6741D9', bg: '#FFF' }
];

const languages = [
    'English (US)', 'English (UK)', 'Spanish', 'French', 'German',
    'Italian', 'Portuguese', 'Japanese', 'Korean', 'Chinese (Simplified)'
];

const faqItems = [
    { q: 'How do I reset my password?', a: 'Go to Account → Change Password, enter your current password and set a new one. You can also use "Forgot Password" on the login screen.' },
    { q: 'How do I enable two-factor authentication?', a: 'Navigate to Account → Two Factor Authentication and follow the setup wizard to link your authenticator app or phone number.' },
    { q: 'Can I export my data?', a: 'Yes. Under Privacy → Data & Permissions, use the "Export My Data" option to download a copy of all your account data.' },
    { q: 'How do I delete my account?', a: 'Go to Account → Delete Account. This action is permanent and cannot be undone. All your data will be removed within 30 days.' },
    { q: 'Who can see my profile?', a: 'By default your profile is visible to team members. You can restrict this under Privacy → Profile Visibility.' }
];

function Toggle({ checked, onChange }) {
    return (
        <button
            className={`toggle-switch ${checked ? 'on' : ''}`}
            onClick={onChange}
            role="switch"
            aria-checked={checked}
        >
            <span className="toggle-thumb" />
        </button>
    );
}

export default function SettingsPage() {
    const { user, updateUser } = useUser();
    const [activeSection, setActiveSection] = useState('Profile');
    const [theme, setTheme] = useState('Blossom');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState({
        marketing: true,
        security: true,
        system: true,
        digest: false,
        email: true,
        sms: false,
        push: true
    });
    const [privacy, setPrivacy] = useState({
        profileVisible: true,
        activityStatus: true,
        dataCollection: false,
        personalization: true,
        thirdParty: false,
        twoFA: false
    });
    const [layoutDense, setLayoutDense] = useState(false);
    const [expandedAccountItem, setExpandedAccountItem] = useState(null);
    const [expandedSecurityItem, setExpandedSecurityItem] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
    const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });

    const [profileData, setProfileData] = useState(user);
    const [saveStatus, setSaveStatus] = useState(null);

    useEffect(() => { setProfileData(user); }, [user]);

    const fileInputRef = useRef(null);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfileData(prev => ({ ...prev, avatar: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setSaveStatus('saving');
        setTimeout(() => {
            updateUser(profileData);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        }, 800);
    };

    const handleDiscard = () => setProfileData(user);

    const applyTheme = (t) => {
        setTheme(t.name);
        document.documentElement.style.setProperty('--c-accent', t.color);
        document.documentElement.style.setProperty('--c-accent-2', `${t.color}EE`);
        document.documentElement.style.setProperty('--c-accent-bg', `${t.color}0D`);
        document.documentElement.style.setProperty('--c-accent-bd', `${t.color}26`);
    };

    const toggleNotification = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    const togglePrivacy = (key) => setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleAccountItem = (id) => setExpandedAccountItem(prev => prev === id ? null : id);
    const toggleSecurityItem = (id) => setExpandedSecurityItem(prev => prev === id ? null : id);

    const navItems = [
        { id: 'Profile', icon: <User size={18} /> },
        { id: 'Account', icon: <UserCheck size={18} /> },
        { id: 'Security', icon: <Lock size={18} /> },
        { id: 'Appearance', icon: <Palette size={18} /> },
        { id: 'Privacy', icon: <Shield size={18} /> },
        { id: 'Notifications', icon: <Bell size={18} /> },
        { id: 'Language', icon: <Globe size={18} /> },
        { id: 'Help', icon: <HelpCircle size={18} /> }
    ];

    const filteredNav = searchQuery
        ? navItems.filter(n => n.id.toLowerCase().includes(searchQuery.toLowerCase()))
        : navItems;

    return (
        <div className="settings-root anim-fade-in">
            <div className="settings-container">
                <aside className="settings-nav">
                    <h1 className="nav-title">Settings</h1>
                    <div className="nav-search">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search settings"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="nav-items-list">
                        {filteredNav.map(section => (
                            <button
                                key={section.id}
                                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <span className="nav-icon">{section.icon}</span>
                                {section.id}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="settings-main">

                    {/* ── PROFILE ── */}
                    {activeSection === 'Profile' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Profile</h2>
                            <div className="profile-hero-integrated">
                                <div className="avatar-section">
                                    <div className="avatar-card">
                                        {profileData.avatar ? (
                                            <img src={profileData.avatar} className="avatar-img" alt="Profile" />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {profileData.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                        )}
                                        <button className="avatar-edit-btn" onClick={handleAvatarClick}>
                                            <Camera size={16} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="identity-text">
                                        <h3 className="identity-name">{profileData.name}</h3>
                                        <p className="identity-role">Strategic Administrator</p>
                                    </div>
                                </div>
                                <div className="profile-form-compact">
                                    <div className="form-row">
                                        <div className="input-group">
                                            <label>Full Name</label>
                                            <input type="text" name="name" value={profileData.name} onChange={handleInputChange} />
                                        </div>
                                        <div className="input-group">
                                            <label>Email Address</label>
                                            <input type="email" name="email" value={profileData.email} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Biography</label>
                                        <textarea name="bio" value={profileData.bio || ''} onChange={handleInputChange} rows="3" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── ACCOUNT ── */}
                    {activeSection === 'Account' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Account Settings</h2>
                            <div className="settings-list">

                                {/* Account Information */}
                                <div className="settings-list-item" onClick={() => toggleAccountItem('info')}>
                                    <div className="item-icon-wrap"><UserCheck size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Account Information</h4>
                                        <p className="item-desc">Name, username, date of birth, country</p>
                                    </div>
                                    {expandedAccountItem === 'info' ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                </div>
                                {expandedAccountItem === 'info' && (
                                    <div className="item-panel">
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Full Name</label>
                                                <input type="text" name="name" value={profileData.name} onChange={handleInputChange} />
                                            </div>
                                            <div className="input-group">
                                                <label>Username</label>
                                                <input type="text" defaultValue={profileData.name?.toLowerCase().replace(' ', '_')} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Date of Birth</label>
                                                <input type="date" defaultValue="1990-01-01" />
                                            </div>
                                            <div className="input-group">
                                                <label>Country</label>
                                                <select className="settings-select">
                                                    <option>United States</option>
                                                    <option>United Kingdom</option>
                                                    <option>India</option>
                                                    <option>Germany</option>
                                                    <option>Canada</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button className="btn btn-solid btn-sm" onClick={handleSave}>Save</button>
                                    </div>
                                )}

                                {/* Change Password */}
                                <div className="settings-list-item" onClick={() => toggleAccountItem('pass')}>
                                    <div className="item-icon-wrap"><Lock size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Change Password</h4>
                                        <p className="item-desc">Update your account password</p>
                                    </div>
                                    {expandedAccountItem === 'pass' ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                </div>
                                {expandedAccountItem === 'pass' && (
                                    <div className="item-panel">
                                        {['current', 'next', 'confirm'].map((field) => (
                                            <div className="input-group" key={field}>
                                                <label>{field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}</label>
                                                <div className="input-password-wrap">
                                                    <input
                                                        type={showPasswords[field] ? 'text' : 'password'}
                                                        value={passwordForm[field]}
                                                        onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))}
                                                        placeholder="••••••••"
                                                    />
                                                    <button className="eye-btn" onClick={() => setShowPasswords(p => ({ ...p, [field]: !p[field] }))}>
                                                        {showPasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            className="btn btn-solid btn-sm"
                                            onClick={() => {
                                                if (passwordForm.next === passwordForm.confirm && passwordForm.next) {
                                                    alert('Password updated successfully!');
                                                    setPasswordForm({ current: '', next: '', confirm: '' });
                                                    setExpandedAccountItem(null);
                                                } else {
                                                    alert('Passwords do not match or are empty.');
                                                }
                                            }}
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                )}

                                {/* Change Email */}
                                <div className="settings-list-item" onClick={() => toggleAccountItem('mail')}>
                                    <div className="item-icon-wrap"><Mail size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Change Email</h4>
                                        <p className="item-desc">Current: {profileData.email}</p>
                                    </div>
                                    {expandedAccountItem === 'mail' ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                </div>
                                {expandedAccountItem === 'mail' && (
                                    <div className="item-panel">
                                        <div className="input-group">
                                            <label>New Email Address</label>
                                            <input type="email" value={emailForm.newEmail} onChange={e => setEmailForm(p => ({ ...p, newEmail: e.target.value }))} placeholder="new@email.com" />
                                        </div>
                                        <div className="input-group">
                                            <label>Confirm Password</label>
                                            <input type="password" value={emailForm.password} onChange={e => setEmailForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                                        </div>
                                        <button
                                            className="btn btn-solid btn-sm"
                                            onClick={() => {
                                                if (emailForm.newEmail && emailForm.password) {
                                                    updateUser({ ...profileData, email: emailForm.newEmail });
                                                    setEmailForm({ newEmail: '', password: '' });
                                                    setExpandedAccountItem(null);
                                                }
                                            }}
                                        >
                                            Update Email
                                        </button>
                                    </div>
                                )}

                                {/* 2FA */}
                                <div className="settings-list-item" onClick={() => toggleAccountItem('2fa')}>
                                    <div className="item-icon-wrap"><Smartphone size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Two-Factor Authentication</h4>
                                        <p className="item-desc">Secure your account with 2FA</p>
                                    </div>
                                    {expandedAccountItem === '2fa' ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                </div>
                                {expandedAccountItem === '2fa' && (
                                    <div className="item-panel">
                                        <div className="toggle-row">
                                            <div>
                                                <p className="toggle-label">Enable Two-Factor Authentication</p>
                                                <p className="toggle-sub">Require a verification code when signing in</p>
                                            </div>
                                            <Toggle checked={privacy.twoFA} onChange={() => togglePrivacy('twoFA')} />
                                        </div>
                                        {privacy.twoFA && (
                                            <div className="twofa-methods">
                                                <p className="toggle-label" style={{ marginBottom: 12 }}>Choose method:</p>
                                                <button className="btn btn-ghost btn-sm">SMS / Text Message</button>
                                                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}>Authenticator App</button>
                                                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}>Security Email</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Delete Account */}
                                <div className="settings-list-item danger-item" onClick={() => setShowDeleteConfirm(true)}>
                                    <div className="item-icon-wrap"><AlertTriangle size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Delete Account</h4>
                                        <p className="item-desc">Permanently delete your account and all data</p>
                                    </div>
                                    <ChevronRight size={20} className="item-arrow" />
                                </div>

                            </div>
                        </section>
                    )}

                    {/* ── SECURITY ── */}
                    {activeSection === 'Security' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Security</h2>
                            <div className="settings-list">

                                {/* Active Sessions */}
                                <div className="settings-list-item" onClick={() => toggleSecurityItem('sessions')}>
                                    <div className="item-icon-wrap"><Smartphone size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Active Sessions</h4>
                                        <p className="item-desc">Devices currently logged into your account</p>
                                    </div>
                                    {expandedSecurityItem === 'sessions' ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                </div>
                                {expandedSecurityItem === 'sessions' && (
                                    <div className="item-panel">
                                        {[
                                            { device: 'Chrome on Windows 11', location: 'New York, US', time: 'Active now', current: true },
                                            { device: 'Safari on iPhone 15', location: 'New York, US', time: '2 hours ago', current: false },
                                            { device: 'Firefox on macOS', location: 'Boston, US', time: '3 days ago', current: false }
                                        ].map((s, i) => (
                                            <div key={i} className="session-row">
                                                <div className="session-info">
                                                    <p className="session-device">{s.device} {s.current && <span className="badge-current">This device</span>}</p>
                                                    <p className="session-meta">{s.location} · {s.time}</p>
                                                </div>
                                                {!s.current && (
                                                    <button className="btn-revoke" onClick={e => { e.stopPropagation(); alert('Session revoked.'); }}>
                                                        <LogOut size={14} /> Revoke
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button className="btn btn-ghost btn-sm danger-text" style={{ marginTop: 8 }}>Sign out all other sessions</button>
                                    </div>
                                )}

                                {/* Trusted Devices */}
                                <div className="settings-list-item" onClick={() => toggleSecurityItem('devices')}>
                                    <div className="item-icon-wrap"><Check size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Trusted Devices</h4>
                                        <p className="item-desc">Devices that skip verification codes</p>
                                    </div>
                                    {expandedSecurityItem === 'devices' ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                </div>
                                {expandedSecurityItem === 'devices' && (
                                    <div className="item-panel">
                                        {[
                                            { device: 'Chrome on Windows 11', added: 'Added Jan 15, 2026' },
                                            { device: 'Safari on iPhone 15', added: 'Added Feb 3, 2026' }
                                        ].map((d, i) => (
                                            <div key={i} className="session-row">
                                                <div className="session-info">
                                                    <p className="session-device">{d.device}</p>
                                                    <p className="session-meta">{d.added}</p>
                                                </div>
                                                <button className="btn-revoke" onClick={e => { e.stopPropagation(); alert('Device removed.'); }}>
                                                    <X size={14} /> Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Security Logs */}
                                <div className="settings-list-item" onClick={() => toggleSecurityItem('logs')}>
                                    <div className="item-icon-wrap"><Eye size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Security Logs</h4>
                                        <p className="item-desc">Recent security activity on your account</p>
                                    </div>
                                    {expandedSecurityItem === 'logs' ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                </div>
                                {expandedSecurityItem === 'logs' && (
                                    <div className="item-panel">
                                        {[
                                            { action: 'Successful login', detail: 'Chrome · Windows 11', time: 'Today, 9:14 AM', type: 'success' },
                                            { action: 'Password changed', detail: 'Chrome · Windows 11', time: 'Mar 10, 2026', type: 'warning' },
                                            { action: 'New device added', detail: 'Safari · iPhone 15', time: 'Feb 3, 2026', type: 'info' },
                                            { action: 'Failed login attempt', detail: 'Unknown · Unknown', time: 'Jan 28, 2026', type: 'danger' }
                                        ].map((log, i) => (
                                            <div key={i} className="log-row">
                                                <span className={`log-dot log-dot-${log.type}`} />
                                                <div className="session-info">
                                                    <p className="session-device">{log.action}</p>
                                                    <p className="session-meta">{log.detail} · {log.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </section>
                    )}

                    {/* ── APPEARANCE ── */}
                    {activeSection === 'Appearance' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Design & Feel</h2>
                            <div className="theme-compact-grid">
                                {themes.map(t => (
                                    <div
                                        key={t.name}
                                        className={`theme-pill ${theme === t.name ? 'selected' : ''}`}
                                        onClick={() => applyTheme(t)}
                                    >
                                        <span className="theme-dot" style={{ background: t.color }}></span>
                                        {t.name}
                                        {theme === t.name && <Check size={14} style={{ marginLeft: 4 }} />}
                                    </div>
                                ))}
                            </div>
                            <div className="settings-list mt-32">
                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Layout size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Layout Density</h4>
                                        <p className="item-desc">Use a compact, denser interface layout</p>
                                    </div>
                                    <Toggle checked={layoutDense} onChange={() => setLayoutDense(p => !p)} />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── PRIVACY ── */}
                    {activeSection === 'Privacy' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Privacy</h2>

                            <div className="settings-list">
                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><User size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Profile Visibility</h4>
                                        <p className="item-desc">Allow team members to view your profile</p>
                                    </div>
                                    <Toggle checked={privacy.profileVisible} onChange={() => togglePrivacy('profileVisible')} />
                                </div>

                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Eye size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Activity Status</h4>
                                        <p className="item-desc">Show when you were last active</p>
                                    </div>
                                    <Toggle checked={privacy.activityStatus} onChange={() => togglePrivacy('activityStatus')} />
                                </div>

                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Shield size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Data Collection</h4>
                                        <p className="item-desc">Allow usage data collection to improve the product</p>
                                    </div>
                                    <Toggle checked={privacy.dataCollection} onChange={() => togglePrivacy('dataCollection')} />
                                </div>

                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Palette size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Personalization</h4>
                                        <p className="item-desc">Use your activity to personalize your experience</p>
                                    </div>
                                    <Toggle checked={privacy.personalization} onChange={() => togglePrivacy('personalization')} />
                                </div>

                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Globe size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Third-Party Integrations</h4>
                                        <p className="item-desc">Allow connected apps to access your account data</p>
                                    </div>
                                    <Toggle checked={privacy.thirdParty} onChange={() => togglePrivacy('thirdParty')} />
                                </div>
                            </div>

                            <div className="settings-list mt-32">
                                <div className="settings-list-item" onClick={() => alert('Your data export has been requested. You will receive an email within 24 hours.')}>
                                    <div className="item-icon-wrap"><ExternalLink size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Export My Data</h4>
                                        <p className="item-desc">Download a copy of all your account data</p>
                                    </div>
                                    <ChevronRight size={20} className="item-arrow" />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── NOTIFICATIONS ── */}
                    {activeSection === 'Notifications' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Notifications</h2>

                            <p className="section-subtitle">Channels</p>
                            <div className="settings-list">
                                {[
                                    { key: 'email', icon: <Mail size={20} />, label: 'Email Notifications', desc: 'Receive notifications via email' },
                                    { key: 'sms', icon: <Smartphone size={20} />, label: 'SMS Notifications', desc: 'Receive notifications via text message' },
                                    { key: 'push', icon: <Bell size={20} />, label: 'Push Notifications', desc: 'Receive in-app push notifications' }
                                ].map(item => (
                                    <div key={item.key} className="settings-list-item" style={{ cursor: 'default' }}>
                                        <div className="item-icon-wrap">{item.icon}</div>
                                        <div className="item-content">
                                            <h4 className="item-title">{item.label}</h4>
                                            <p className="item-desc">{item.desc}</p>
                                        </div>
                                        <Toggle checked={notifications[item.key]} onChange={() => toggleNotification(item.key)} />
                                    </div>
                                ))}
                            </div>

                            <p className="section-subtitle mt-32">Preferences</p>
                            <div className="settings-list">
                                {[
                                    { key: 'marketing', icon: <Mail size={20} />, label: 'Marketing & Promotions', desc: 'Product updates, tips, and special offers' },
                                    { key: 'security', icon: <Shield size={20} />, label: 'Security Alerts', desc: 'Suspicious activity and login notifications' },
                                    { key: 'system', icon: <Bell size={20} />, label: 'System Notifications', desc: 'Service updates and maintenance alerts' },
                                    { key: 'digest', icon: <BookOpen size={20} />, label: 'Weekly Digest', desc: 'A summary of your weekly activity' }
                                ].map(item => (
                                    <div key={item.key} className="settings-list-item" style={{ cursor: 'default' }}>
                                        <div className="item-icon-wrap">{item.icon}</div>
                                        <div className="item-content">
                                            <h4 className="item-title">{item.label}</h4>
                                            <p className="item-desc">{item.desc}</p>
                                        </div>
                                        <Toggle checked={notifications[item.key]} onChange={() => toggleNotification(item.key)} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── LANGUAGE ── */}
                    {activeSection === 'Language' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Language & Region</h2>
                            <div className="settings-list">
                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Globe size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Display Language</h4>
                                        <p className="item-desc">Choose the language for the interface</p>
                                    </div>
                                    <select
                                        className="settings-select"
                                        value={selectedLanguage}
                                        onChange={e => setSelectedLanguage(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {languages.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>

                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Globe size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Date Format</h4>
                                        <p className="item-desc">Choose how dates are displayed</p>
                                    </div>
                                    <select className="settings-select" onClick={e => e.stopPropagation()}>
                                        <option>MM/DD/YYYY</option>
                                        <option>DD/MM/YYYY</option>
                                        <option>YYYY-MM-DD</option>
                                    </select>
                                </div>

                                <div className="settings-list-item" style={{ cursor: 'default' }}>
                                    <div className="item-icon-wrap"><Globe size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Time Zone</h4>
                                        <p className="item-desc">Your local time zone for scheduling</p>
                                    </div>
                                    <select className="settings-select" onClick={e => e.stopPropagation()}>
                                        <option>UTC-5 (Eastern)</option>
                                        <option>UTC-6 (Central)</option>
                                        <option>UTC-7 (Mountain)</option>
                                        <option>UTC-8 (Pacific)</option>
                                        <option>UTC+0 (GMT)</option>
                                        <option>UTC+5:30 (IST)</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── HELP ── */}
                    {activeSection === 'Help' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Help & Support</h2>

                            <div className="settings-list">
                                <div className="settings-list-item" onClick={() => alert('Opening support chat...')}>
                                    <div className="item-icon-wrap"><MessageSquare size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Contact Support</h4>
                                        <p className="item-desc">Chat with our support team</p>
                                    </div>
                                    <ChevronRight size={20} className="item-arrow" />
                                </div>
                                <div className="settings-list-item" onClick={() => alert('Opening documentation...')}>
                                    <div className="item-icon-wrap"><BookOpen size={20} /></div>
                                    <div className="item-content">
                                        <h4 className="item-title">Documentation</h4>
                                        <p className="item-desc">Browse guides and tutorials</p>
                                    </div>
                                    <ChevronRight size={20} className="item-arrow" />
                                </div>
                            </div>

                            <p className="section-subtitle mt-32">Frequently Asked Questions</p>
                            <div className="settings-list">
                                {faqItems.map((item, i) => (
                                    <div key={i}>
                                        <div className="settings-list-item" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                                            <div className="item-icon-wrap"><HelpCircle size={20} /></div>
                                            <div className="item-content">
                                                <h4 className="item-title">{item.q}</h4>
                                            </div>
                                            {expandedFaq === i ? <ChevronDown size={20} className="item-arrow" /> : <ChevronRight size={20} className="item-arrow" />}
                                        </div>
                                        {expandedFaq === i && (
                                            <div className="item-panel faq-answer">
                                                <p>{item.a}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="settings-sticky-actions">
                        <button
                            className={`btn btn-solid ${saveStatus === 'success' ? 'btn-success' : ''}`}
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                        >
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved ✓' : 'Save changes'}
                        </button>
                        <button className="btn btn-ghost" onClick={handleDiscard}>Discard</button>
                    </div>
                </main>
            </div>

            {/* ── DELETE CONFIRM MODAL ── */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon danger"><AlertTriangle size={28} /></div>
                        <h3 className="modal-title">Delete Account</h3>
                        <p className="modal-desc">This action is permanent and cannot be undone. All your data, projects, and settings will be permanently removed within 30 days.</p>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => { alert('Account deletion requested.'); setShowDeleteConfirm(false); }}>
                                Yes, Delete My Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
