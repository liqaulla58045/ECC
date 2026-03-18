import { useState } from 'react';
import { Users, BookOpen, Award, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import '../styles/ProjectCard.css';

const STATUS_CONFIG = {
    active:      { label: 'Active',      color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
    'in progress':{ label: 'In Progress', color: '#6366F1', bg: '#EEF2FF', dot: '#6366F1' },
    planning:    { label: 'Planning',    color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
    beta:        { label: 'Beta',        color: '#8B5CF6', bg: '#F5F3FF', dot: '#8B5CF6' },
    error:       { label: 'Offline',     color: '#EF4444', bg: '#FEF2F2', dot: '#EF4444' },
};

const ACCENT_COLORS = [
    '#6366F1', '#8B5CF6', '#10B981', '#F59E0B',
    '#3B82F6', '#EC4899', '#14B8A6', '#F97316',
];

function getDomain(url) {
    if (!url) return null;
    try { return new URL(url.includes('://') ? url : `https://${url}`).hostname; } catch { return null; }
}

export default function ProjectCard({ project, style, onClick }) {
    const { kpis } = project;
    const sm = STATUS_CONFIG[project.status?.toLowerCase()] || STATUS_CONFIG['planning'];
    const domain = getDomain(project.liveUrl || project.mcpUrl);
    const [faviconErr, setFaviconErr] = useState(false);

    // Pick a stable accent color per project initial
    const accentColor = ACCENT_COLORS[project.name.charCodeAt(0) % ACCENT_COLORS.length];

    const kpiItems = [
        { icon: <Users size={13} />,     label: 'Learners',  value: (kpis?.totalLearners    ?? 0).toLocaleString() },
        { icon: <BookOpen size={13} />,  label: 'Teams',     value: (kpis?.totalTeams        ?? 0).toLocaleString() },
        { icon: <Award size={13} />,     label: 'Mentors',   value: (kpis?.totalMentors      ?? 0).toLocaleString() },
        { icon: <TrendingUp size={13} />,label: 'Apps',      value: (kpis?.totalApplications ?? 0).toLocaleString() },
    ];

    return (
        <div className="pc-card anim-fade-up" style={style} onClick={onClick}>
            {/* Colored top accent strip */}
            <div className="pc-accent-strip" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />

            {/* Header */}
            <div className="pc-header">
                <div className="pc-title-wrap">
                    <div className="pc-avatar-wrap">
                        {domain && !faviconErr ? (
                            <img
                                src={`https://www.google.com/s2/favicons?sz=48&domain=${domain}`}
                                className="pc-favicon"
                                onError={() => setFaviconErr(true)}
                                alt=""
                            />
                        ) : (
                            <div className="pc-project-avatar" style={{ background: `${accentColor}18`, color: accentColor }}>
                                {project.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="pc-title-info">
                        <div className="pc-category">{project.category}</div>
                        <h3 className="pc-name">{project.name}</h3>
                        {domain && <p className="pc-domain">{domain}</p>}
                    </div>
                </div>
                <div className="pc-status" style={{ color: sm.color, background: sm.bg }}>
                    <span className="pc-status-dot" style={{ background: sm.color }} />
                    {sm.label}
                </div>
            </div>

            {/* Description */}
            <p className="pc-description">{project.description}</p>

            {/* KPI grid */}
            <div className="pc-kpi-grid">
                {kpiItems.map(k => (
                    <div className="pc-kpi-item" key={k.label}>
                        <div className="pc-kpi-label" style={{ color: accentColor }}>
                            {k.icon}{k.label}
                        </div>
                        <div className="pc-kpi-val">{k.value}</div>
                    </div>
                ))}
            </div>

            {/* Progress */}
            <div className="pc-progress-section">
                <div className="pc-progress-meta">
                    <span className="pc-progress-label"><Activity size={12} /> Progress</span>
                    <span className="pc-progress-pct" style={{ color: accentColor }}>{project.progress || 0}%</span>
                </div>
                <div className="pc-progress-bar-bg">
                    <div
                        className="pc-progress-bar-fill"
                        style={{ width: `${project.progress || 0}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}bb)` }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="pc-footer">
                <div className="pc-meta-tag" style={{ color: accentColor, background: `${accentColor}12`, borderColor: `${accentColor}30` }}>
                    {project.startDate && project.startDate !== '—' ? `Since ${project.startDate}` : project.category}
                </div>
                <div className="pc-view-btn" style={{ color: accentColor }}>
                    View Insights <ArrowUpRight size={14} />
                </div>
            </div>
        </div>
    );
}
