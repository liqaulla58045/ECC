import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { apiJson } from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import AddProductModal from '../components/AddProductModal';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectData, setProjectData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const projects = await apiJson('/api/projects');
                const hydrated = [];

                for (const proj of projects) {
                    try {
                        const stats = await apiJson(`/api/projects/${proj.id}/stats`);
                        hydrated.push({
                            id: proj.id,
                            name: proj.name,
                            category: proj.category || 'CONNECTED PLATFORM',
                            status: proj.status,
                            description: proj.description || 'Enterprise Platform Integration',
                            progress: proj.progress || 0,
                            startDate: proj.start_date || 'Active',
                            endDate: proj.end_date || 'Present',
                            kpis: {
                                totalLearners:    stats?.total_learners    || 0,
                                totalTeams:       stats?.total_teams       || 0,
                                totalMentors:     stats?.total_mentors     || 0,
                                newAppsThisMonth: stats?.total_applications || 0,
                                seedDeployed:     stats ? `₹${stats.seed_deployed_lakhs}L` : '₹0',
                            },
                        });
                    } catch {
                        hydrated.push({
                            id: proj.id,
                            name: proj.name,
                            category: 'OFFLINE PLATFORM',
                            status: 'Error',
                            description: 'No metrics snapshot available yet.',
                            progress: 0,
                            startDate: '—',
                            endDate: '—',
                            kpis: { totalLearners: 0, totalTeams: 0, totalMentors: 0, newAppsThisMonth: 0, seedDeployed: '₹0' },
                        });
                    }
                }

                setProjectData(hydrated);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredProjects = projectData.filter(p => {
        const matchesFilter = filter === 'All' || p.status.toLowerCase() === filter.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getDay = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    const getFormattedDate = () => {
        return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const handleAddProject = (newProject) => {
        setProjectData(prev => [newProject, ...prev]);
        setIsAddProductOpen(false);
    };

    const activeCount = projectData.filter(p => p.status?.toLowerCase() === 'active').length;

    return (
        <>
            <div className="page-hero">
                <div className="page-hero-mesh" />
                <div className="page-hero-content">
                    <div className="page-hero-row">
                        <div className="page-hero-left">
                            <p className="page-hero-eyebrow">Enterprise Command Center</p>
                            <h1 className="page-hero-title">
                                {user ? `Welcome back, ${user.name?.split(' ')[0] || user.firstName || user.username}` : 'Chairman Executive Overview'}
                            </h1>
                            <p className="page-hero-subtitle">Live portfolio across {projectData.length} connected platform{projectData.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="page-hero-right">
                            <button className="db-add-btn" onClick={() => setIsAddProductOpen(true)}>
                                <Plus size={16} strokeWidth={2.5} />
                                ADD PROJECT
                            </button>
                        </div>
                    </div>
                    <div className="page-hero-chips">
                        <span className="page-hero-chip"><strong>{projectData.length}</strong>&nbsp;Projects</span>
                        <span className="page-hero-chip"><strong>{activeCount}</strong>&nbsp;Active</span>
                        <span className="page-hero-chip"><strong>{filteredProjects.length}</strong>&nbsp;Displayed</span>
                    </div>
                </div>
            </div>

            <div className="db-cards-grid">
                {loading ? (
                    <div className="db-empty">
                        <p>Loading live platform data...</p>
                    </div>
                ) : error ? (
                    <div className="db-empty" style={{ color: '#E53E3E' }}>
                        <p>⚠️ {error}</p>
                    </div>
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((proj, i) => (
                        <ProjectCard
                            key={proj.id}
                            project={proj}
                            style={{ animationDelay: `${0.1 + (i * 0.05)}s` }}
                            onClick={() => navigate(`/project/${proj.id}`)}
                        />
                    ))
                ) : (
                    <div className="db-empty">
                        <ShieldAlert size={40} color="var(--c-accent)" />
                        <p>No projects found. Add your first project to get started.</p>
                    </div>
                )}
            </div>

            {isAddProductOpen && (
                <AddProductModal
                    onClose={() => setIsAddProductOpen(false)}
                    onAddProject={handleAddProject}
                />
            )}
        </>
    );
}
