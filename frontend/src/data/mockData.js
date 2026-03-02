// ─────────────────────────────────────────────
// StartupVarsity — Chairman Dashboard Data
// Replace with live MCP server responses later
// ─────────────────────────────────────────────

export const chairman = {
    name: 'Rajesh Kumar',
    role: 'Chairman',
    avatar: 'RK',
};

// ─── SINGLE PROJECT: StartupVarsity ──────────
export const projects = [
    {
        id: 'sv-001',
        name: 'StartupVarsity',
        category: 'Startup Incubation',
        status: 'Active',
        description:
            'A full-stack startup incubation platform connecting early-stage founders with mentors, learners, cohort programmes, and seed funding opportunities.',
        progress: 68,
        startDate: 'Jan 2024',
        endDate: 'Dec 2026',

        kpis: {
            totalLearners: 2840,
            totalTeams: 124,
            totalMentors: 58,
            totalApplications: 3670,
            activeCohorts: 4,
            seedDeployed: '₹18.4L',
            stipendsDisbursed: '₹6.2L',
            placementRate: '74%',
            newAppsThisMonth: 128,
            completionRate: '81%',
        },

        monthlyLeads: [
            { month: 'Aug', leads: 210 },
            { month: 'Sep', leads: 265 },
            { month: 'Oct', leads: 318 },
            { month: 'Nov', leads: 290 },
            { month: 'Dec', leads: 345 },
            { month: 'Jan', leads: 420 },
            { month: 'Feb', leads: 385 },
        ],

        revenueData: [
            { month: 'Aug', revenue: 1.8 },
            { month: 'Sep', revenue: 2.2 },
            { month: 'Oct', revenue: 2.6 },
            { month: 'Nov', revenue: 2.4 },
            { month: 'Dec', revenue: 3.1 },
            { month: 'Jan', revenue: 3.8 },
            { month: 'Feb', revenue: 2.9 },
        ],

        team: [
            { name: 'Priya Sharma', role: 'Platform Lead', avatar: 'PS' },
            { name: 'Arjun Mehta', role: 'Tech Lead', avatar: 'AM' },
            { name: 'Ritu Nair', role: 'Community Manager', avatar: 'RN' },
            { name: 'Siddharth Rao', role: 'Mentor Relations', avatar: 'SR' },
            { name: 'Kavya Reddy', role: 'Cohort Coordinator', avatar: 'KR' },
            { name: 'Nikhil Gupta', role: 'Growth & Marketing', avatar: 'NG' },
        ],

        products: [
            'Cohort Management System',
            'Mentor Connect Portal',
            'Learner Dashboard',
            'Seed Fund Tracker',
            'Application Pipeline',
            'Sprint Progress Monitor',
        ],
    },
];

// ─── Product form helpers ─────────────────────
export const productCategories = [
    'Platform Feature',
    'Mobile App',
    'Analytics Tool',
    'Admin Panel',
    'API / Integration',
    'Content Module',
    'Other',
];

export const productStatuses = ['Active', 'Beta', 'Planning', 'Deprecated'];
