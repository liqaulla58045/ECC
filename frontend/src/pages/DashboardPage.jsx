import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldAlert } from 'lucide-react';
import { chairman } from '../data/mockData';
import ProjectCard from '../components/ProjectCard';
import AddProductModal from '../components/AddProductModal';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectData, setProjectData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const projRes = await fetch('/api/projects');
                if (projRes.status === 401) throw new Error('401_UNAUTHORIZED');
                if (!projRes.ok) throw new Error('Failed to fetch projects from backend');

                const projectsConfig = await projRes.json();
                const hydratedProjects = [];

                for (const proj of projectsConfig) {
                    try {
                        const statsRes = await fetch(`/api/projects/${proj.id}/proxy/api/admin/stats`);
                        if (!statsRes.ok) throw new Error('Proxy sync failed');
                        const stats = await statsRes.json();

                        hydratedProjects.push({
                            id: proj.id,
                            name: proj.name,
                            category: 'CONNECTED PLATFORM',
                            status: proj.status,
                            description: proj.description || 'Enterprise MCP Integration',
                            progress: 100,
                            startDate: 'Active',
                            endDate: 'Present',
                            kpis: {
                                totalLearners: stats.totalLearners || 0,
                                totalTeams: stats.totalTeams || 0,
                                totalMentors: stats.totalMentors || 0,
                                newAppsThisMonth: stats.totalApplications || 0,
                                seedDeployed: '₹0'
                            }
                        });
                    } catch (e) {
                        hydratedProjects.push({
                            id: proj.id,
                            name: proj.name,
                            category: 'OFFLINE PLATFORM',
                            status: 'Error',
                            description: 'Failed to sync with MCP Server. Check credentials or connection.',
                            progress: 0,
                            startDate: 'Unknown',
                            endDate: 'Unknown',
                            kpis: { totalLearners: 0, totalTeams: 0, totalMentors: 0, newAppsThisMonth: 0, seedDeployed: '₹0' }
                        });
                    }
                }

                setProjectData(hydratedProjects);
            } catch (err) {
                console.error('Fetch Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Filter projects 
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
        return new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const handleAddProject = (newProject) => {
        setProjectData(prev => [newProject, ...prev]);
        setIsAddProductOpen(false);
    };

    return (
        <>
            <h1 className="db-page-title">Chairman Executive Overview</h1>

            <div className="db-projects-bar">
                <h2>Running Projects ({filteredProjects.length} Active)</h2>
                <button className="db-add-btn" onClick={() => setIsAddProductOpen(true)}>
                    <Plus size={16} strokeWidth={2.5} />
                    ADD PRODUCT
                </button>
            </div>

            <div className="db-cards-grid">
                {loading ? (
                    <div className="db-empty">
                        <p>Loading live platform data...</p>
                    </div>
                ) : error === '401_UNAUTHORIZED' ? (
                    <div className="db-empty" style={{ flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
                        <ShieldAlert size={48} color="var(--c-accent)" />
                        <h3 style={{ margin: 0, color: 'var(--c-text-1)' }}>Backend Setup Required</h3>
                        <p style={{ margin: 0, color: 'var(--c-text-2)' }}>To view your live connected project data, please add your login credentials to the <code>.env</code> file. (This is NOT a login screen):</p>
                        <pre style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', textAlign: 'left', border: '1px solid #E2E8F0', width: '100%', fontSize: '0.9rem', color: '#1A202C' }}>
                            SV_EMAIL=your-actual-email@example.com<br />
                            SV_PASSWORD=your-actual-password
                        </pre>
                        <p style={{ fontSize: '0.9rem', color: 'var(--c-text-3)', margin: 0 }}>After saving the file, restart the backend server.</p>
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
                        <p>No projects found matching your criteria.</p>
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
