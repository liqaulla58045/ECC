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
    const res = await fetch(`${MCP_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, name, mcpUrl, email, password }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error || 'MCP server registration failed');
    }
}

/**
 * Fetch admin stats for a registered project via MCP proxy.
 */
export async function fetchMcpStats(projectId: string): Promise<Record<string, unknown>> {
    const res = await fetch(
        `${MCP_BASE}/api/projects/${projectId}/proxy/api/admin/stats`
    );
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err.error || 'Failed to fetch stats from platform');
    }
    return res.json() as Promise<Record<string, unknown>>;
}
