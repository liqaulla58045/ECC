import '../styles/ProjectCard.css';

export default function ProjectCard({ project, style, onClick }) {
    const { kpis } = project;

    // Since we only have one project (StartupVarsity) we can hardcode an accent
    // or use a hash of the name for a dynamic colour
    const accent = 'var(--c-accent)';

    // Determine badge color and label based on status
    let badgeClass = 'pc-badge-gray';
    let displayStatus = project.status;
    let badgeMode = 'PLAN/Gray';

    if (displayStatus === 'Active') {
        badgeClass = 'pc-badge-green';
        badgeMode = 'ACTIVE/Green';
    } else if (displayStatus === 'Planning') {
        badgeClass = 'pc-badge-amber';
        badgeMode = 'INITIATED/Amber';
    } else if (displayStatus === 'In Progress') {
        badgeClass = 'pc-badge-blue';
        badgeMode = 'IN PROGRESS/Blue';
    } else if (displayStatus === 'Error') {
        badgeClass = 'pc-badge-gray';
        badgeMode = 'OFFLINE/Error';
    }

    const leadName = project.name === 'Startup Varsity' ? 'Dr. Aris' : (project.name === 'Smart City IoT' ? 'Prof. Sarah' : 'Admin');

    const totalStudents = kpis?.totalLearners || kpis?.totalTeams || 0;

    return (
        <div
            className="pc-root anim-fade-up"
            style={style}
            onClick={onClick}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
        >
            {/* Header */}
            <div className="pc-header">
                <h3 className="pc-name">{project.name}</h3>
                <button className="pc-more-btn" onClick={(e) => { e.stopPropagation(); }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <circle cx="12" cy="5" r="2"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                        <circle cx="12" cy="19" r="2"></circle>
                    </svg>
                </button>
            </div>

            {/* Body */}
            <div className="pc-body">
                <div className="pc-col">
                    <div className="pc-label">Project Lead</div>
                    <div className="pc-value">{leadName}</div>

                    <div className="pc-label pc-mt">Project Status</div>
                </div>
                <div className="pc-col">
                    <div className="pc-label">Total Students</div>
                    <div className="pc-value">{totalStudents}</div>

                    <div className={`pc-badge pc-mt ${badgeClass}`}>{badgeMode}</div>
                </div>
            </div>

            {/* Footer */}
            <div className="pc-footer">
                <div className="pc-progress-section">
                    <div className="pc-progress-label">Current Milestones 1</div>
                    <div className="pc-progress-track">
                        <div
                            className="pc-progress-fill"
                            style={{ width: `${project.progress || 25}%` }}
                        ></div>
                    </div>
                </div>
                <div className="pc-footer-icons">
                    <svg className="pc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <svg className="pc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                </div>
            </div>
        </div>
    );
}
