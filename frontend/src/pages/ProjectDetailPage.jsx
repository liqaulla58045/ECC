import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    ChevronLeft,
    Share2,
    Sliders,
    Calendar,
    ExternalLink,
    Github,
    Users,
    Layers,
    GraduationCap,
    Target,
    FileText,
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    Activity,
    Milestone,
    UserPlus,
    Presentation
} from 'lucide-react';
import '../styles/ProjectDetailPage.css';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [animKey, setAnimKey] = useState(0);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);

    useEffect(() => {
        async function fetchProjectData() {
            try {
                // Fetch projects list as well
                const [cohortsRes, productsRes, projectsRes] = await Promise.all([
                    fetch('/api/cohorts'),
                    fetch('/api/problem-statements?status=PUBLISHED'),
                    fetch('/api/projects')
                ]);

                if (cohortsRes.status === 401 || productsRes.status === 401) {
                    throw new Error('401_UNAUTHORIZED');
                }

                if (!cohortsRes.ok) throw new Error('Failed to fetch project details from proxy');

                const cohorts = await cohortsRes.json();
                const productsData = await productsRes.json();
                const projectsConfig = await projectsRes.json();

                // Find matching project in our local database
                const extraData = Array.isArray(projectsConfig) ? projectsConfig.find(p => p.id === id) : null;

                // Find matching cohort or default to the first one available
                const cohortData = (Array.isArray(cohorts) ? cohorts.find(c => c.cohortId === id || c.id === id) : null)
                    || cohorts[0] || {};

                const productsList = Array.isArray(productsData) ? productsData.slice(0, 4).map(p => p.title || p.name) : ["No products found"];

                if (id === 'lean-agile-01') {
                    setProject({
                        id: 'lean-agile-01',
                        name: 'LeanAgile Institute',
                        category: 'CORPORATE TRAINING',
                        description: 'Enterprise agile transformation and coaching certification program.',
                        status: 'Active',
                        startDate: 'Mar 2026',
                        endDate: 'Aug 2026',
                        progress: 45,
                        liveUrl: '#',
                        gitRepo: '#',
                        kpis: {
                            totalLearners: 1250,
                            totalTeams: 45,
                            totalMentors: 18,
                            totalApplications: 1400,
                            activeCohorts: 2,
                            seedDeployed: '₹0',
                            stipendsDisbursed: '₹0',
                            placementRate: '92%'
                        },
                        products: ['Coaching Dashboard', 'Certification Portal'],
                        team: [
                            { name: 'Dr. Rajesh Kumar', role: 'Chairman', avatar: 'RK' },
                            { name: 'Anita Desai', role: 'Agile Lead', avatar: 'AD' }
                        ],
                        monthlyLeads: [
                            { month: 'Jan', leads: 120 }, { month: 'Feb', leads: 150 }, { month: 'Mar', leads: 200 },
                            { month: 'Apr', leads: 250 }, { month: 'May', leads: 300 }, { month: 'Jun', leads: 400 }
                        ],
                        revenueData: [
                            { month: 'Jan', revenue: 5 }, { month: 'Feb', revenue: 8 }, { month: 'Mar', revenue: 12 },
                            { month: 'Apr', revenue: 15 }, { month: 'May', revenue: 20 }, { month: 'Jun', revenue: 25 }
                        ]
                    });
                    setLoading(false);
                    return;
                }

                if (id === 'cloud-scale-01') {
                    setProject({
                        id: 'cloud-scale-01',
                        name: 'CloudScale Academy',
                        category: 'TECH BOOTCAMP',
                        description: 'Cloud architecture and DevOps engineering bootcamp for senior developers.',
                        status: 'Planning',
                        startDate: 'Oct 2026',
                        endDate: 'Mar 2027',
                        progress: 10,
                        liveUrl: '#',
                        gitRepo: '#',
                        kpis: {
                            totalLearners: 0,
                            totalTeams: 0,
                            totalMentors: 8,
                            totalApplications: 85,
                            activeCohorts: 0,
                            seedDeployed: '₹0',
                            stipendsDisbursed: '₹0',
                            placementRate: 'N/A'
                        },
                        products: ['Lab Environment', 'Curriculum Hub'],
                        team: [
                            { name: 'Dr. Rajesh Kumar', role: 'Chairman', avatar: 'RK' },
                            { name: 'Vikram Singh', role: 'DevOps Lead', avatar: 'VS' }
                        ],
                        monthlyLeads: [
                            { month: 'Jan', leads: 10 }, { month: 'Feb', leads: 25 }, { month: 'Mar', leads: 45 },
                            { month: 'Apr', leads: 60 }, { month: 'May', leads: 85 }, { month: 'Jun', leads: 110 }
                        ],
                        revenueData: [
                            { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 }, { month: 'Mar', revenue: 0 },
                            { month: 'Apr', revenue: 0 }, { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 }
                        ]
                    });
                    setLoading(false);
                    return;
                }

                setProject({
                    id: cohortData.cohortId || id,
                    name: cohortData.name || 'StartupVarsity Default',
                    category: 'STARTUP INCUBATION',
                    description: extraData?.description || `An active cohort focusing on ${cohortData.durationInWeeks || 12}-week structured incubation.`,
                    status: cohortData.status || 'Active',
                    startDate: cohortData.startDate ? new Date(cohortData.startDate).toLocaleDateString() : 'Jan 2026',
                    endDate: cohortData.endDate ? new Date(cohortData.endDate).toLocaleDateString() : 'Present',
                    progress: cohortData.sprintProgress || 0,
                    kpis: {
                        totalLearners: cohortData.totalPreReadsCompleted || 0,
                        totalTeams: cohortData.enrolledTeams || 0,
                        totalMentors: cohortData.associatedMentors || 12,
                        totalApplications: 156, // Placeholder
                        activeCohorts: 1,
                        seedDeployed: '₹12.5L', // Placeholder
                        stipendsDisbursed: '₹4.2L', // Placeholder
                        placementRate: '94%' // Placeholder
                    },
                    healthScore: 94,
                    riskLevel: 'Low',
                    recentActivities: [
                        { id: 1, type: 'milestone', text: 'Incubation Phase 1 Completed', time: '2 days ago' },
                        { id: 2, type: 'team', text: '3 New Teams Onboarded', time: '4 days ago' },
                        { id: 3, type: 'mentor', text: 'Global Mentorship Session held', time: '1 week ago' }
                    ],
                    liveUrl: extraData?.liveUrl || 'https://example.com/demo',
                    gitRepo: extraData?.gitRepo || '#',
                    products: productsList,
                    team: [
                        { name: 'Dr. Rajesh Kumar', role: 'Chairman', avatar: 'RK' },
                        { name: 'Sarah Jenkins', role: 'Program Director', avatar: 'SJ' },
                        { name: 'Michael Chen', role: 'Lead Mentor', avatar: 'MC' },
                    ],
                    monthlyLeads: [
                        { month: 'Jan', leads: 400 },
                        { month: 'Feb', leads: 600 },
                        { month: 'Mar', leads: 900 },
                        { month: 'Apr', leads: 1400 },
                        { month: 'May', leads: 2100 },
                        { month: 'Jun', leads: 2840 },
                    ],
                    revenueData: [
                        { month: 'Jan', revenue: 12 },
                        { month: 'Feb', revenue: 19 },
                        { month: 'Mar', revenue: 25 },
                        { month: 'Apr', revenue: 38 },
                        { month: 'May', revenue: 47 },
                        { month: 'Jun', revenue: 64 },
                    ]
                });
            } catch (err) {
                console.error("Project fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProjectData();
    }, [id]);

    const accent = 'var(--c-accent)';

    // Triggers re-animation on tab change
    useEffect(() => { setAnimKey(k => k + 1); }, [activeTab]);

    if (loading) {
        return <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading cohort data...</div>;
    }

    if (error === '401_UNAUTHORIZED') {
        return (
            <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem' }}>
                <div style={{ background: 'var(--c-surface)', padding: '2rem', borderRadius: '16px', maxWidth: '500px', textAlign: 'center', border: '1px solid var(--c-border)', boxShadow: '0 8px 32px var(--c-shadow)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" strokeWidth="2" width="48" height="48" style={{ marginBottom: '1rem' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                    <h3 style={{ margin: '0 0 1rem', color: 'var(--c-text-1)' }}>Backend Setup Required</h3>
                    <p style={{ margin: '0 0 1rem', color: 'var(--c-text-2)', lineHeight: 1.5 }}>To view live data for this cohort, please add your credentials to the <code>.env</code> file. (This is NOT a login screen!):</p>
                    <pre style={{ background: 'var(--c-bg)', padding: '1rem', borderRadius: '8px', textAlign: 'left', border: '1px solid var(--c-border)', width: '100%', fontSize: '0.9rem', color: 'var(--c-text-1)', marginBottom: '1rem', overflowX: 'auto' }}>
                        SV_EMAIL=your-actual-email@example.com<br />
                        SV_PASSWORD=your-actual-password
                    </pre>
                    <p style={{ fontSize: '0.9rem', color: 'var(--c-text-3)', margin: 0 }}>After saving, restart the backend server.</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return <div className="pdp-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--c-red)' }}>⚠️ {error || 'Project not found'}</div>;
    }

    const { kpis } = project;

    return (
        <div className="pdp-root">
            {/* Sticky Nav */}
            <nav className="pdp-nav">
                <button className="pdp-back" onClick={() => navigate('/dashboard')}>
                    <ChevronLeft size={16} />
                    Back
                </button>
                <div className="pdp-nav-meta">
                    <span className={`pdp-nav-dot pc-dot--${project.status.toLowerCase()}`}></span>
                    <span className="pdp-nav-status">{project.status}</span>
                    <span className="pdp-nav-cat">{project.category}</span>
                </div>
                <div className="pdp-nav-actions">
                    <button className="btn btn-subtle icon-btn" title="Share">
                        <Share2 size={16} />
                    </button>
                    <button className="btn btn-subtle icon-btn" title="Settings">
                        <Sliders size={16} />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pd-hero-new" style={{ '--pd-accent': accent }}>
                <div className="pd-hero-info">
                    <h1 className="pd-title anim-slide-up delay-1">{project.name}</h1>
                    <p className="pd-subtitle anim-slide-up delay-2">{project.description}</p>
                    <div className="pd-hero-meta anim-slide-up delay-3">
                        <div className="pd-hero-dates">
                            <Calendar size={18} />
                            {project.startDate} &mdash; {project.endDate}
                        </div>
                        <div className="pd-hero-actions-row">
                            <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-solid pd-live-btn"
                            >
                                <ExternalLink size={18} style={{ marginRight: '8px' }} />
                                Live Demo
                            </a>
                            <a
                                href={project.gitRepo === '#' ? undefined : project.gitRepo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-subtle pd-repo-btn"
                                style={project.gitRepo === '#' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                                <Github size={18} style={{ marginRight: '8px' }} />
                                Repository
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pd-hero-visuals anim-slide-up delay-4">
                    <div className="pd-hero-vitals-card">
                        <div className="pd-vitals-header">
                            <Target size={20} className="pd-icon-accent" />
                            <span className="pd-vitals-title">Project Goal</span>
                        </div>
                        <div className="pd-prog-display">
                            <span className="pd-prog-val">{project.progress}%</span>
                            <div className="pd-prog-ring-mini">
                                <div className="pd-prog-fill-mini" style={{ width: `${project.progress}%` }}></div>
                            </div>
                        </div>
                        <div className="pd-hero-vitals-divider"></div>
                        <div className="pd-hero-vitals-metrics">
                            <div className="pd-vitals-item">
                                <div className="pd-vitals-icon-label">
                                    <Activity size={12} />
                                    <span>Health</span>
                                </div>
                                <span className="pd-vitals-val pd-text-green">{project.healthScore}%</span>
                            </div>
                            <div className="pd-vitals-item">
                                <div className="pd-vitals-icon-label">
                                    <AlertCircle size={12} />
                                    <span>Risk</span>
                                </div>
                                <span className={`pd-vitals-val pd-risk--${project.riskLevel.toLowerCase()}`}>{project.riskLevel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pd-hero-bottom-bar">
                    <div className="pd-prog-bar">
                        <div className="pd-prog-fill" style={{ width: `${project.progress}%`, background: accent }}></div>
                    </div>
                </div>
            </header>

            <div className="pd-tabs">
                <div className="pd-tabs-inner">
                    {['Overview', 'Analytics', 'Team', 'Products'].map(tab => (
                        <button
                            key={tab}
                            className={`pd-tab ${activeTab === tab ? 'pd-tab--active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                            style={{ '--pd-accent': accent }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="pd-content" key={animKey}>
                {activeTab === 'Overview' && (
                    <div className="pd-overview-layout">
                        <div className="pd-kpi-column">
                            <div className="pd-kpi-grid">
                                <KpiCard label="Total Learners" val={kpis.totalLearners.toLocaleString()} delay="0s" />
                                <KpiCard label="Active Teams" val={kpis.totalTeams} delay="0.05s" />
                                <KpiCard label="Total Mentors" val={kpis.totalMentors} delay="0.1s" />
                                <KpiCard label="Total Applications" val={kpis.totalApplications.toLocaleString()} delay="0.15s" />
                                <KpiCard label="Active Cohorts" val={kpis.activeCohorts} delay="0.2s" />
                                <KpiCard label="Seed Deployed" val={kpis.seedDeployed} delay="0.25s" />
                                <KpiCard label="Stipends" val={kpis.stipendsDisbursed} delay="0.3s" />
                                <KpiCard label="Placement Rate" val={kpis.placementRate} delay="0.35s" />
                            </div>
                        </div>

                        <div className="pd-timeline-column anim-fade-in delay-2">
                            <div className="pd-timeline-card">
                                <h3 className="pd-timeline-title">Recent Activity</h3>
                                <div className="pd-timeline">
                                    {project.recentActivities.map((act) => (
                                        <div key={act.id} className="pd-timeline-item">
                                            <div className={`pd-timeline-icon-wrap pd-icon--${act.type}`}>
                                                {act.type === 'milestone' && <Milestone size={14} />}
                                                {act.type === 'team' && <Users size={14} />}
                                                {act.type === 'mentor' && <UserPlus size={14} />}
                                            </div>
                                            <div className="pd-timeline-info">
                                                <p className="pd-timeline-text">{act.text}</p>
                                                <span className="pd-timeline-time">{act.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="pd-timeline-more">View All Activity →</button>
                            </div>

                            <div className="pd-resource-card anim-fade-in delay-3">
                                <h3 className="pd-timeline-title">Organization</h3>
                                <div className="pd-org-meta">
                                    <div className="pd-org-stat">
                                        <span className="pd-org-val">1:4</span>
                                        <span className="pd-org-lbl">Mentor-Team Ratio</span>
                                    </div>
                                    <div className="pd-org-bar-wrap">
                                        <div className="pd-org-bar">
                                            <div className="pd-org-fill" style={{ width: '75%', background: accent }}></div>
                                        </div>
                                        <span className="pd-org-sub">Capacity utilized: 75%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Analytics' && (
                    <div className="pd-charts">
                        <div className="pd-chart-card anim-slide-up delay-1">
                            <h3 className="pd-chart-title">Monthly Leads Pipeline</h3>
                            <div style={{ width: '100%', height: 260 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={project.monthlyLeads} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={accent} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={accent} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} />
                                        <Tooltip content={<CustomTooltip unit="Leads" />} cursor={{ stroke: 'var(--c-border-md)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area type="monotone" dataKey="leads" stroke={accent} strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="pd-chart-card anim-slide-up delay-2">
                            <h3 className="pd-chart-title">Ecosystem Revenue (₹ Lakhs)</h3>
                            <div style={{ width: '100%', height: 260 }}>
                                <ResponsiveContainer>
                                    <BarChart data={project.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--c-border)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} />
                                        <Tooltip content={<CustomTooltip unit="L" prefix="₹" />} cursor={{ fill: 'var(--c-raised)' }} />
                                        <Bar dataKey="revenue" fill="var(--c-green)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Team' && (
                    <div className="pd-team">
                        {project.team.map((member, i) => (
                            <div key={member.name} className="pd-team-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="pd-team-avatar" style={{ background: 'var(--c-raised)', color: 'var(--c-text-2)' }}>
                                    {member.avatar}
                                </div>
                                <div className="pd-team-info">
                                    <div className="pd-team-name">{member.name}</div>
                                    <div className="pd-team-role">{member.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Products' && (
                    <div className="pd-products">
                        <div className="pd-products-hd anim-fade-in">
                            <h3 className="pd-products-title">Platform Features & Modules</h3>
                            <button className="btn btn-subtle">+ Add specific</button>
                        </div>
                        <div className="pd-product-list">
                            {project.products.map((prod, i) => (
                                <div key={prod} className="pd-product-row" style={{ animationDelay: `${i * 0.08}s` }}>
                                    <div className="pd-product-icon" style={{ background: 'var(--c-accent-bg)', color: accent }}>
                                        <Layers size={18} />
                                    </div>
                                    <div className="pd-product-info">
                                        <div className="pd-product-name">{prod}</div>
                                        <div className="pd-product-proj">{project.name} • Active</div>
                                    </div>
                                    <button className="pd-product-arrow">
                                        <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal removed as per request */}
        </div>
    );
}

// Sub-components
function KpiCard({ label, val, delay }) {
    return (
        <div className="pd-kpi-card" style={{ animationDelay: delay }}>
            <div className="pd-kpi-val">{val}</div>
            <div className="pd-kpi-label">{label}</div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label, unit, prefix = '' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="pd-tooltip">
                <p className="pd-tooltip-label">{label}</p>
                <p className="pd-tooltip-val" style={{ color: payload[0].stroke || payload[0].fill }}>
                    {prefix}{payload[0].value}{unit}
                </p>
            </div>
        );
    }
    return null;
};
