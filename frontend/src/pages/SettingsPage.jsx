import { useState, useRef, useEffect } from 'react';
import {
    User, Palette, Bell, Lock, Camera, Check, Search,
    ChevronRight, ChevronDown, Shield, Eye, EyeOff, Globe,
    HelpCircle, UserCheck, Mail, Smartphone, Layout, X,
    LogOut, MessageSquare, BookOpen, ExternalLink, Phone,
    Briefcase, MapPin, Link, Building2, QrCode, Trash2, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { apiJson } from '../utils/api';
import '../styles/SettingsPage.css';

const themes = [
    { name: 'Slate Grey',   color: '#77838c' },
    { name: 'Arctic',       color: '#1C7ED6' },
    { name: 'Obsidian',     color: '#111111' },
    { name: 'Sage',         color: '#2B8A3E' },
    { name: 'Royal Purple', color: '#6741D9' }
];

const faqItems = [
    { q: 'How do I reset my password?',         a: 'Go to Account → Change Password, enter your current password and set a new one.' },
    { q: 'How do I enable two-factor auth?',     a: 'Navigate to Account → Two-Factor Authentication and choose a verification method.' },
    { q: 'Can I export my data?',                a: 'Under Privacy → Export My Data, you can request a full download of your account data.' },
    { q: 'Who can see my profile?',              a: 'By default your profile is visible to team members. You can restrict this under Privacy.' }
];

function Toggle({ checked, onChange }) {
    return (
        <div
            className={`toggle-switch ${checked ? 'on' : ''}`}
            onClick={(e) => { e.stopPropagation(); onChange(); }}
            role="switch"
            aria-checked={checked}
        >
            <span className="toggle-thumb" />
        </div>
    );
}

export default function SettingsPage() {
    const { user, updateUser } = useUser();

    const [activeSection, setActiveSection]         = useState('Profile');
    const [subPage, setSubPage]                     = useState(null); 
    const [theme, setTheme]                         = useState('Slate Grey');
    const [searchQuery, setSearchQuery]             = useState('');
    const [notifications, setNotifications]         = useState({ security: true, system: true, marketing: false });
    const [privacy, setPrivacy]                     = useState({ profileVisible: true, activityStatus: true });
    const [layoutDense, setLayoutDense]             = useState(() => {
        const saved = localStorage.getItem('ecc_layout_dense') === 'true';
        if (saved) document.body.classList.add('dense');
        return saved;
    });

    const toggleDense = () => {
        setLayoutDense(prev => {
            const next = !prev;
            document.body.classList.toggle('dense', next);
            localStorage.setItem('ecc_layout_dense', String(next));
            return next;
        });
    };
    const [expandedFaq, setExpandedFaq]             = useState(null);
    const [twoFAEnabled, setTwoFAEnabled]           = useState(false);
    const [twoFAMethod, setTwoFAMethod]             = useState('sms');

    const [showDeleteModal, setShowDeleteModal]     = useState(false);
    
    // Form and UI state
    const [profileData, setProfileData]             = useState({
        ...user,
        name: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '',
    });
    const [accountData, setAccountData]             = useState({
        username:    user.username    || '',
        dateOfBirth: user.dateOfBirth || '',
        country:     user.country     || 'India',
        organization:user.organization|| ''
    });
    const [saveStatus, setSaveStatus]               = useState(null);

    // Sync context changes
    useEffect(() => { setProfileData(prev => ({ ...prev, ...user })); }, [user]);
    useEffect(() => { setSubPage(null); }, [activeSection]);

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setProfileData(prev => ({ ...prev, avatar: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        const nameParts = (profileData.name || '').trim().split(' ');
        const firstName = nameParts[0] || profileData.firstName || '';
        const lastName = nameParts.slice(1).join(' ') || profileData.lastName || '';
        try {
            const updated = await apiJson(`/api/users/${user.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    firstName,
                    lastName,
                    avatar: profileData.avatar || null,
                }),
            });
            updateUser({
                ...profileData,
                ...accountData,
                firstName: updated.first_name || firstName,
                lastName:  updated.last_name  || lastName,
                avatar:    updated.avatar     ?? profileData.avatar,
                name: [updated.first_name || firstName, updated.last_name || lastName].filter(Boolean).join(' '),
            });
        } catch {
            // Fallback: update locally if API fails
            updateUser({
                ...profileData,
                ...accountData,
                firstName,
                lastName,
                name: [firstName, lastName].filter(Boolean).join(' '),
            });
        }
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const handleDiscard = () => {
        setProfileData({ ...user });
        setAccountData({
            username: user.username || '', 
            dateOfBirth: user.dateOfBirth || '',
            country: user.country || 'India', 
            organization: user.organization || ''
        });
        setSubPage(null);
    };

    const applyTheme = (t) => {
        setTheme(t.name);
        document.documentElement.style.setProperty('--c-accent', t.color);
        document.documentElement.style.setProperty('--c-accent-bg', `${t.color}15`);
    };

    const navItems = [
        { id: 'Profile',       icon: <User size={18} /> },
        { id: 'Account',       icon: <UserCheck size={18} /> },
        { id: 'Security',      icon: <Lock size={18} /> },
        { id: 'Appearance',    icon: <Palette size={18} /> },
        { id: 'Privacy',       icon: <Shield size={18} /> },
        { id: 'Notifications', icon: <Bell size={18} /> },
        { id: 'Help',          icon: <HelpCircle size={18} /> }
    ];

    const filteredNav = searchQuery
        ? navItems.filter(n => n.id.toLowerCase().includes(searchQuery.toLowerCase()))
        : navItems;

    const initials = profileData.name
        ? profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    const renderSubPageHeader = (title) => (
        <div className="sub-page-header">
            <button className="back-btn" onClick={() => setSubPage(null)}><ArrowLeft size={20} /></button>
            <h3 className="sub-page-title">{title}</h3>
        </div>
    );

    return (
        <div className="settings-root anim-fade-in">
            <div className="page-hero">
                <div className="page-hero-mesh" />
                <div className="page-hero-content">
                    <p className="page-hero-eyebrow">Preferences & Configuration</p>
                    <h1 className="page-hero-title">Settings</h1>
                    <p className="page-hero-subtitle">Manage your profile, security, appearance, and notifications</p>
                </div>
            </div>
            <div className="settings-container">

                <aside className="settings-nav">
                    <h1 className="nav-title">Settings</h1>
                    <div className="nav-search">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search settings" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoComplete="off" />
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
                    
                    {activeSection === 'Profile' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Profile</h2>
                            <div className="profile-hero-integrated">
                                <div className="avatar-section">
                                    <div className="avatar-card">
                                        {profileData.avatar ? <img src={profileData.avatar} className="avatar-img" /> : <div className="avatar-placeholder">{initials}</div>}
                                        <button className="avatar-edit-btn" onClick={() => fileInputRef.current?.click()}><Camera size={16} /></button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                                    </div>
                                    <div className="identity-text">
                                        <h3 className="identity-name">{profileData.name || 'Your Name'}</h3>
                                        <p className="identity-role">{profileData.role || 'Strategic Administrator'}</p>
                                    </div>
                                </div>
                                <div className="profile-form-compact">
                                    <div className="form-row">
                                        <div className="input-group"><label>Full Name</label><input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /></div>
                                        <div className="input-group"><label>Job Title</label><input type="text" value={profileData.role || ''} onChange={e => setProfileData({...profileData, role: e.target.value})} /></div>
                                    </div>
                                    <div className="input-group"><label>Email Address</label><input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} /></div>
                                    <div className="input-group"><label>Bio</label><textarea value={profileData.bio || ''} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows="3" /></div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Account' && (
                        <section className="settings-section anim-slide-up">
                            {!subPage ? (
                                <>
                                    <h2 className="section-title">Account Settings</h2>
                                    <div className="settings-list">
                                        <div className="settings-list-item" onClick={() => setSubPage('info')}>
                                            <div className="item-icon-wrap"><UserCheck size={20} /></div>
                                            <div className="item-content"><h4 className="item-title">Account Information</h4><p className="item-desc">User details and location</p></div>
                                            <ChevronRight size={20} className="item-arrow" />
                                        </div>
                                        <div className="settings-list-item" onClick={() => setSubPage('pass')}>
                                            <div className="item-icon-wrap"><Lock size={20} /></div>
                                            <div className="item-content"><h4 className="item-title">Password</h4><p className="item-desc">Update your login password</p></div>
                                            <ChevronRight size={20} className="item-arrow" />
                                        </div>
                                        <div className="settings-list-item" onClick={() => setSubPage('2fa')}>
                                            <div className="item-icon-wrap"><Smartphone size={20} /></div>
                                            <div className="item-content"><h4 className="item-title">Two-Factor Authentication</h4><p className="item-desc">{twoFAEnabled ? 'Enabled' : 'Secure your account'}</p></div>
                                            {twoFAEnabled && <span className="badge-enabled">ENABLED</span>}
                                            <ChevronRight size={20} className="item-arrow" />
                                        </div>
                                        <div className="settings-list-item danger-item" onClick={() => setShowDeleteModal(true)}>
                                            <div className="item-icon-wrap"><Trash2 size={20} /></div>
                                            <div className="item-content"><h4 className="item-title">Delete Account</h4><p className="item-desc">Permanently remove user data</p></div>
                                            <ChevronRight size={20} className="item-arrow" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="sub-page-view anim-fade-in">
                                    {subPage === 'info' && (
                                        <>
                                            {renderSubPageHeader('Account Information')}
                                            <div className="profile-form-compact">
                                                <div className="input-group"><label>Username</label><input type="text" value={accountData.username} onChange={e => setAccountData({...accountData, username: e.target.value})} /></div>
                                                <div className="form-row">
                                                    <div className="input-group"><label>Birth Date</label><input type="date" value={accountData.dateOfBirth} onChange={e => setAccountData({...accountData, dateOfBirth: e.target.value})} /></div>
                                                    <div className="input-group"><label>Country</label><input type="text" value={accountData.country} onChange={e => setAccountData({...accountData, country: e.target.value})} /></div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {subPage === 'pass' && (
                                        <>
                                            {renderSubPageHeader('Change Password')}
                                            {/* Hidden username field absorbs browser credential autofill so it doesn't spill into the sidebar search */}
                                            <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} readOnly />
                                            <div className="profile-form-compact">
                                                <div className="input-group"><label>Current Password</label><input type="password" autoComplete="current-password" placeholder="••••••••" /></div>
                                                <div className="input-group"><label>New Password</label><input type="password" autoComplete="new-password" placeholder="••••••••" /></div>
                                                <div className="input-group"><label>Confirm New Password</label><input type="password" autoComplete="new-password" placeholder="••••••••" /></div>
                                                <button className="btn btn-solid btn-sm" onClick={() => { setSaveStatus('success'); setTimeout(() => setSaveStatus(null), 2000); }}>Update Password</button>
                                            </div>
                                        </>
                                    )}
                                    {subPage === '2fa' && (
                                        <>
                                            {renderSubPageHeader('Two-Factor Authentication')}
                                            <div className="settings-list">
                                                <div className="settings-list-item" onClick={() => setTwoFAEnabled(!twoFAEnabled)}>
                                                    <div className="item-content"><h4 className="item-title">Enable 2FA</h4><p className="item-desc">SMS / Auth App verification</p></div>
                                                    <Toggle checked={twoFAEnabled} onChange={() => setTwoFAEnabled(!twoFAEnabled)} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {activeSection === 'Security' && (
                        <section className="settings-section anim-slide-up">
                            {!subPage ? (
                                <>
                                    <h2 className="section-title">Security</h2>
                                    <div className="settings-list">
                                        <div className="settings-list-item" onClick={() => setSubPage('sessions')}><div className="item-icon-wrap"><Smartphone size={20} /></div><div className="item-content"><h4 className="item-title">Active Sessions</h4><p className="item-desc">Manage signed in devices</p></div><ChevronRight size={20} className="item-arrow" /></div>
                                        <div className="settings-list-item" onClick={() => setSubPage('logs')}><div className="item-icon-wrap"><Eye size={20} /></div><div className="item-content"><h4 className="item-title">Security Logs</h4><p className="item-desc">Audit account changes</p></div><ChevronRight size={20} className="item-arrow" /></div>
                                    </div>
                                </>
                            ) : (
                                <div className="sub-page-view anim-fade-in">
                                    {subPage === 'sessions' && (
                                        <>
                                            {renderSubPageHeader('Sessions')}
                                            <div className="settings-list"><div className="settings-list-item" style={{ cursor: 'default' }}><div className="item-content"><h4 className="item-title">Current Session <span className="badge-enabled">ACTIVE</span></h4><p className="item-desc">Windows Desktop · Chrome</p></div><button className="btn-revoke" onClick={() => alert('Current session.')}>Log Out</button></div></div>
                                        </>
                                    )}
                                    {subPage === 'logs' && (<>{renderSubPageHeader('Activity Logs')}<div className="settings-list"><div className="settings-list-item" style={{ cursor: 'default' }}><div className="item-content"><h4 className="item-title">Password Changed</h4><p className="item-desc">2 days ago · Success</p></div><Check size={16} color="#2B8A3E" /></div></div></>)}
                                </div>
                            )}
                        </section>
                    )}

                    {activeSection === 'Appearance' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Design & Feel</h2>
                            <div className="theme-compact-grid">
                                {themes.map(t => (<div key={t.name} className={`theme-pill ${theme === t.name ? 'selected' : ''}`} onClick={() => applyTheme(t)}><span className="theme-dot" style={{ background: t.color }}></span>{t.name}</div>))}
                            </div>
                            <div className="settings-list mt-32">
                                <div className="settings-list-item" style={{ cursor: 'default' }}><div className="item-icon-wrap"><Layout size={20} /></div><div className="item-content"><h4 className="item-title">Compact Layout</h4><p className="item-desc">{layoutDense ? 'On — reduced spacing across the app' : 'Off — standard spacing'}</p></div><Toggle checked={layoutDense} onChange={toggleDense} /></div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'Privacy' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Privacy</h2>
                            <div className="settings-list">
                                {[{ key: 'profileVisible', label: 'Public Profile' }, { key: 'activityStatus', label: 'Online Status' }].map(item => (
                                    <div key={item.key} className="settings-list-item" onClick={() => setPrivacy({...privacy, [item.key]: !privacy[item.key]})}><div className="item-content"><h4 className="item-title">{item.label}</h4><p className="item-desc">Choose who sees your info</p></div><Toggle checked={privacy[item.key]} onChange={() => setPrivacy({...privacy, [item.key]: !privacy[item.key]})} /></div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeSection === 'Notifications' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Notifications</h2>
                            <div className="settings-list">
                                {[{ key: 'security', label: 'Security' }, { key: 'marketing', label: 'Marketing' }].map(item => (
                                    <div key={item.key} className="settings-list-item" onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})}><div className="item-content"><h4 className="item-title">{item.label}</h4><p className="item-desc">Manage alerts</p></div><Toggle checked={notifications[item.key]} onChange={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})} /></div>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeSection === 'Help' && (
                        <section className="settings-section anim-slide-up">
                            <h2 className="section-title">Help</h2>
                            <div className="settings-list">
                                <div className="settings-list-item" onClick={() => alert('Support triggered')}><div className="item-icon-wrap"><MessageSquare size={20} /></div><div className="item-content"><h4 className="item-title">Contact Support</h4><p className="item-desc">Speak to our team</p></div><ChevronRight size={20} className="item-arrow" /></div>
                            </div>
                            <h4 className="section-subtitle mt-32">FAQ</h4>
                            <div className="settings-list">{faqItems.map((f, i) => (
                                <div key={i}><div className="settings-list-item" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}><div className="item-content"><h4 className="item-title">{f.q}</h4></div>{expandedFaq === i ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>{expandedFaq === i && <div className="faq-answer">{f.a}</div>}</div>
                            ))}</div>
                        </section>
                    )}

                    {!subPage && (
                        <div className="settings-sticky-actions">
                            <button className={`btn btn-solid ${saveStatus === 'success' ? 'btn-success' : ''}`} onClick={handleSave} disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save changes'}</button>
                            <button className="btn btn-ghost" onClick={handleDiscard}>Discard</button>
                        </div>
                    )}
                </main>
            </div>

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon danger"><Trash2 size={32} /></div>
                        <h3 className="modal-title">Delete Account?</h3>
                        <p className="modal-desc">This is non-reversible. All data will be wiped.</p>
                        <div className="modal-actions"><button className="btn btn-danger" onClick={() => alert('Deleted')}>Delete</button><button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
