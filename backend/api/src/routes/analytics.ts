import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
router.use(authenticate);

// GET /api/analytics/dashboard  — cross-platform executive overview
router.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
    const [projectsRes, teamsRes, applicationsRes, cohortsRes, latestSnapshotsRes] =
        await Promise.all([
            db.query(`SELECT COUNT(*) AS total, status FROM projects GROUP BY status`),
            db.query(`SELECT health_status, COUNT(*) AS count FROM teams GROUP BY health_status`),
            db.query(`SELECT type, COUNT(*) AS count FROM applications GROUP BY type`),
            db.query(`SELECT status, COUNT(*) AS count FROM cohorts GROUP BY status`),
            db.query(`
                SELECT DISTINCT ON (project_id)
                    project_id, total_learners, total_teams, total_mentors,
                    total_applications, active_cohorts, seed_deployed_lakhs, snapshotted_at
                FROM metrics_snapshots
                ORDER BY project_id, snapshotted_at DESC
            `),
        ]);

    const teamHealth: Record<string, number> = { Green: 0, Amber: 0, Red: 0 };
    teamsRes.rows.forEach((r: any) => { teamHealth[r.health_status] = Number(r.count); });

    const totals = latestSnapshotsRes.rows.reduce(
        (acc: any, row: any) => ({
            totalLearners:     acc.totalLearners     + (row.total_learners     || 0),
            totalTeams:        acc.totalTeams        + (row.total_teams        || 0),
            totalMentors:      acc.totalMentors      + (row.total_mentors      || 0),
            totalApplications: acc.totalApplications + (row.total_applications || 0),
            activeCohorts:     acc.activeCohorts     + (row.active_cohorts     || 0),
            seedDeployedLakhs: acc.seedDeployedLakhs + parseFloat(row.seed_deployed_lakhs || '0'),
        }),
        { totalLearners: 0, totalTeams: 0, totalMentors: 0, totalApplications: 0, activeCohorts: 0, seedDeployedLakhs: 0 }
    );

    res.json({
        projects:     projectsRes.rows,
        teamHealth,
        applications: applicationsRes.rows,
        cohorts:      cohortsRes.rows,
        totals,
        generatedAt:  new Date().toISOString(),
    });
});

// GET /api/analytics/health-report  — at-risk teams + notifications
router.get('/health-report', async (_req: AuthRequest, res: Response): Promise<void> => {
    const [atRiskRes, notifRes, cohortStatsRes] = await Promise.all([
        db.query(`
            SELECT t.*, p.name AS project_name, c.name AS cohort_name
            FROM teams t
            LEFT JOIN projects p ON p.id = t.project_id
            LEFT JOIN cohorts c  ON c.id = t.cohort_id
            WHERE t.health_status IN ('Red', 'Amber')
            ORDER BY t.health_status ASC, t.sprint_progress ASC
        `),
        db.query(`
            SELECT * FROM notifications
            WHERE is_read = FALSE
            ORDER BY created_at DESC
            LIMIT 50
        `),
        db.query(`
            SELECT c.id, c.name, c.status, c.current_sprint, c.total_sprints,
                   p.name AS project_name,
                   COUNT(t.id) AS team_count,
                   SUM(CASE WHEN t.health_status = 'Red'   THEN 1 ELSE 0 END) AS red_teams,
                   SUM(CASE WHEN t.health_status = 'Amber' THEN 1 ELSE 0 END) AS amber_teams
            FROM cohorts c
            JOIN projects p ON p.id = c.project_id
            LEFT JOIN teams t ON t.cohort_id = c.id
            WHERE c.status = 'Active'
            GROUP BY c.id, p.name
        `),
    ]);

    const healthSummary = { Green: 0, Amber: 0, Red: 0, total: 0 };
    const teamsByHealthRes = await db.query(
        'SELECT health_status, COUNT(*) AS count FROM teams GROUP BY health_status'
    );
    teamsByHealthRes.rows.forEach((r: any) => {
        const s = r.health_status as 'Green' | 'Amber' | 'Red';
        healthSummary[s] = Number(r.count);
        healthSummary.total += Number(r.count);
    });

    res.json({
        teamHealthSummary: healthSummary,
        atRiskTeams:       atRiskRes.rows,
        unreadNotifications: notifRes.rows,
        activeCohortStats: cohortStatsRes.rows,
        generatedAt:       new Date().toISOString(),
    });
});

// GET /api/analytics/monthly?projectId=xxx&year=2025
router.get('/monthly', async (req: AuthRequest, res: Response): Promise<void> => {
    const { projectId, year } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];

    if (projectId) { conditions.push(`project_id = $${params.length + 1}`); params.push(projectId); }
    if (year)      { conditions.push(`year = $${params.length + 1}`);        params.push(Number(year)); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
        `SELECT month, year,
                SUM(leads) AS leads,
                SUM(revenue_lakhs) AS revenue_lakhs,
                SUM(new_applications) AS new_applications,
                SUM(new_teams) AS new_teams
         FROM monthly_metrics
         ${where}
         GROUP BY month, year
         ORDER BY year ASC, to_date(month, 'Mon') ASC`,
        params
    );
    res.json(rows);
});

export default router;
