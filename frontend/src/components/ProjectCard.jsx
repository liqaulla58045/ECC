import { Users, Layers, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import '../styles/ProjectCard.css';

export default function ProjectCard({ project, style, onClick }) {
    const { kpis } = project;

    // Badge styling based on status
    let statusClass = 'pc-status--planning';
    let statusLabel = 'INITIATED';

    if (project.status === 'Active') {
        statusClass = 'pc-status--active';
        statusLabel = 'ACTIVE';
    } else if (project.status === 'In Progress') {
        statusClass = 'pc-status--active';
        statusLabel = 'IN PROGRESS';
    } else if (project.status === 'Error') {
        statusClass = 'pc-status--error';
        statusLabel = 'OFFLINE';
    }

    const leadName = project.name === 'Startup Varsity' ? 'Dr. Aris' : 'Admin';
    const totalStudents = kpis?.totalLearners || kpis?.totalTeams || 0;
    const projectInitial = project.name.charAt(0);

    return (
        <div
            className="pc-card anim-fade-up"
            style={style}
            onClick={onClick}
        >
            <div className="pc-header">
                <div className="pc-title-wrap">
                    <div className="pc-project-avatar">
                        {projectInitial}
                    </div>
                    <div>
                        <div className="pc-category">{project.category}</div>
                        <h3 className="pc-name">{project.name}</h3>
                    </div>
                </div>
                <div className={`pc-status ${statusClass}`}>
                    {statusLabel}
                </div>
            </div>

            <p className="pc-description">{project.description}</p>

            <div className="pc-metrics">
                <div className="pc-metric-item">
                    <div className="pc-metric-label">
                        <Users size={12} />
                        Lead
                    </div>
                    <div className="pc-metric-val">{leadName}</div>
                </div>
                <div className="pc-metric-item">
                    <div className="pc-metric-label">
                        <Layers size={12} />
                        Students
                    </div>
                    <div className="pc-metric-val">{totalStudents}</div>
                </div>
            </div>

            <div className="pc-progress-section">
                <div className="pc-progress-meta">
                    <span className="pc-progress-label">Milestone Progress</span>
                    <span className="pc-progress-pct">{project.progress || 0}%</span>
                </div>
                <div className="pc-progress-bar-bg">
                    <div
                        className="pc-progress-bar-fill"
                        style={{ width: `${project.progress || 0}%` }}
                    />
                </div>
            </div>

            <div className="pc-footer">
                <div className="pc-team">
                    <div className="pc-team-avatar">A</div>
                    <div className="pc-team-avatar">B</div>
                    <div className="pc-team-avatar" style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent)' }}>+3</div>
                </div>
                <div className="pc-view-btn">
                    View Insights
                    <ChevronRight size={14} />
                </div>
            </div>
        </div>
    );
}
