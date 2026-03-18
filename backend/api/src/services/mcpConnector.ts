const MCP_BASE = process.env.MCP_SERVER_URL || 'http://localhost:3002';

/**
 * Register a project with the MCP server.
 * The MCP server will launch a Playwright browser session and log in to the platform.
 */
export async function registerProjectWithMcp(
    projectId: string,
    mcpUrl: string,
    email: string,
    password: string,
    name: string
): Promise<void> {
    let res: Response;
    try {
        res = await fetch(`${MCP_BASE}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: projectId, name, mcpUrl, email, password }),
        });
    } catch {
        throw new Error(`MCP server is not running. Start it with: cd backend/mcp-server && npx tsx server.ts`);
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error || 'MCP server registration failed');
    }
    const data = await res.json().catch(() => ({})) as any;
    if (data.loginWarning) {
        throw new Error(`Could not log in to platform: ${data.loginWarning}`);
    }
}

/**
 * Remove a project from the MCP server (cleans up browser session + projects.json).
 * Fails silently if MCP is not running.
 */
export async function removeProjectFromMcp(projectId: string): Promise<void> {
    try {
        await fetch(`${MCP_BASE}/api/projects/${projectId}`, { method: 'DELETE' });
    } catch {
        // MCP server may not be running — that's fine, project is still deleted from DB
    }
}

/**
 * Fetch admin stats for a registered project via MCP proxy.
 */
export async function fetchMcpStats(projectId: string, statsPath = '/api/admin/stats'): Promise<Record<string, unknown>> {
    // Strip leading slash from statsPath to build proxy URL correctly
    const cleanPath = statsPath.replace(/^\/+/, '');
    let res: Response;
    try {
        res = await fetch(`${MCP_BASE}/api/projects/${projectId}/proxy/${cleanPath}`);
    } catch {
        throw new Error('MCP server is not reachable. Make sure it is running on port 3002.');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error || 'Failed to fetch stats from platform');
    }
    return res.json() as Promise<Record<string, unknown>>;
}
