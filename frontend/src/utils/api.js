// Authenticated fetch wrapper — automatically attaches JWT from localStorage

export function getToken() {
    return localStorage.getItem('ecc_token');
}

export function saveToken(token) {
    localStorage.setItem('ecc_token', token);
}

export function clearToken() {
    localStorage.removeItem('ecc_token');
    localStorage.removeItem('ecc_user');
}

export async function api(path, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const res = await fetch(path, { ...options, headers });

    // Session expired — clear storage and redirect to login
    if (res.status === 401) {
        clearToken();
        window.location.href = '/';
        throw new Error('Session expired. Please log in again.');
    }

    return res;
}

export async function apiJson(path, options = {}) {
    const res = await api(path, options);
    if (!res.ok) {
        let msg = res.statusText;
        try { const body = await res.json(); msg = body.error || msg; } catch {}
        throw new Error(msg);
    }
    return res.json();
}
