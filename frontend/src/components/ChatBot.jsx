import { useState, useRef, useEffect, useCallback } from 'react';
import {
    MessageSquare, Zap, BarChart2, TrendingUp, Users as UsersIcon,
    Target, FileText, History, Globe, Paperclip, ArrowUp,
    RefreshCcw, PieChart as PieChartIcon, X, Trash2, Clock, Pencil, Check
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer
} from 'recharts';
import { useUser } from '../context/UserContext';
import { apiJson } from '../utils/api';
import '../styles/ChatBot.css';

const HISTORY_KEY = 'cb_chat_history';
const CURRENT_KEY = 'cb_current_conv';

function now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }
function loadCurrentConv() {
    try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null'); } catch { return null; }
}
function saveCurrentConv(c) { localStorage.setItem(CURRENT_KEY, JSON.stringify(c)); }

function makeConvTitle(messages) {
    const first = messages.find(m => m.role === 'user');
    if (!first) return 'New conversation';
    const t = first.displayText || first.text || '';
    return t.length > 50 ? t.slice(0, 50) + '…' : t;
}

function formatDate(iso) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString())
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = e => resolve(e.target.result);
        r.onerror = () => reject(new Error('Failed to read file'));
        r.readAsText(file);
    });
}

const CHART_KEYWORDS = [
    'chart', 'graph', 'plot', 'visualize', 'visualization', 'bar chart',
    'pie chart', 'line chart', 'area chart', 'compare', 'comparison',
    'distribution', 'breakdown', 'statistics', 'generate chart', 'draw chart', 'create chart'
];
function isChartRequest(text) {
    const lower = text.toLowerCase();
    return CHART_KEYWORDS.some(k => lower.includes(k));
}

async function askClaude(messageHistory, userText, systemContext) {
    const messages = messageHistory
        .filter(m => m.type === 'text')
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
    messages.push({ role: 'user', content: userText });
    try {
        const res = await fetch('/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system: systemContext, messages, max_tokens: 1024 })
        });
        if (!res.ok) {
            const err = await res.json();
            return { type: 'text', text: `⚠️ ${err.error || 'Error from AI assistant'}` };
        }
        const data = await res.json();
        return { type: 'text', text: data.content[0].text };
    } catch (e) {
        console.error('askClaude error:', e);
        return { type: 'text', text: `⚠️ Could not reach the assistant: ${e.message}` };
    }
}

async function askOpenAI(userText, projectsData) {
    try {
        const token = localStorage.getItem('ecc_token') || localStorage.getItem('token') || '';
        // Fetch latest projects for chart context if not provided
        let liveProjects = projectsData || [];
        if (!liveProjects.length) {
            try {
                const pr = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
                if (pr.ok) liveProjects = (await pr.json()).projects || [];
            } catch {}
        }
        const res = await fetch('/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userText, projectsData: liveProjects })
        });
        if (!res.ok) {
            const err = await res.json();
            return { type: 'text', text: `⚠️ Chart error: ${err.error || 'AI unavailable'}` };
        }
        const data = await res.json();
        return { type: 'chart', chartData: data.chartData };
    } catch (e) {
        console.error('askOpenAI error:', e);
        return { type: 'text', text: `⚠️ Could not generate chart: ${e.message}` };
    }
}

function InlineChart({ chartData }) {
    if (!chartData) return <p style={{ color: '#E03131' }}>Invalid chart data.</p>;
    const { chartType, title, description, data, xKey, yKeys } = chartData;
    const commonProps = { data, margin: { top: 8, right: 8, left: 0, bottom: 8 } };
    const renderChart = () => {
        if (chartType === 'pie') return (
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}>
                    {data.map((_, i) => <Cell key={i} fill={['#1C7ED6','#2B8A3E','#E67700','#6741D9','#E03131'][i % 5]} />)}
                </Pie>
                <Tooltip /><Legend iconType="circle" iconSize={10} />
            </PieChart>
        );
        if (chartType === 'line') return (
            <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip /><Legend iconType="circle" iconSize={10} />
                {(yKeys || []).map(y => <Line key={y.key} type="monotone" dataKey={y.key} name={y.name} stroke={y.color} strokeWidth={2.5} dot={{ r: 4 }} />)}
            </LineChart>
        );
        if (chartType === 'area') return (
            <AreaChart {...commonProps}>
                <defs>{(yKeys || []).map(y => (
                    <linearGradient key={y.key} id={`grad-${y.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={y.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={y.color} stopOpacity={0} />
                    </linearGradient>
                ))}</defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip /><Legend iconType="circle" iconSize={10} />
                {(yKeys || []).map(y => <Area key={y.key} type="monotone" dataKey={y.key} name={y.name} stroke={y.color} strokeWidth={2} fill={`url(#grad-${y.key})`} />)}
            </AreaChart>
        );
        return (
            <BarChart {...commonProps} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip /><Legend iconType="circle" iconSize={10} />
                {(yKeys || []).map(y => <Bar key={y.key} dataKey={y.key} name={y.name} fill={y.color} radius={[6, 6, 0, 0]} />)}
            </BarChart>
        );
    };
    return (
        <div className="cb-chart-card">
            <div className="cb-chart-meta">
                <p className="cb-chart-title">{title}</p>
                {description && <p className="cb-chart-desc">{description}</p>}
                <span className="cb-chart-badge">
                    {chartType === 'pie' ? <PieChartIcon size={11} /> : <BarChart2 size={11} />} Generated by Claude AI
                </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>{renderChart()}</ResponsiveContainer>
        </div>
    );
}

function parseBold(text) {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p);
}

function BotMessage({ msg }) {
    if (msg.type === 'chart') return <InlineChart chartData={msg.chartData} />;
    return (
        <span>
            {(msg.text || '').split('\n').map((line, i, arr) => (
                <span key={i}>{parseBold(line)}{i < arr.length - 1 && <br />}</span>
            ))}
        </span>
    );
}

// ── Standalone HistoryDropdown (defined OUTSIDE ChatBot to avoid remount on every render)
function HistoryDropdown({ history, onLoad, onDelete, onRename, onClearAll, onClose }) {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const editRef = useRef(null);

    const startEdit = (e, conv) => {
        e.stopPropagation();
        setEditingId(conv.id);
        setEditValue(conv.title);
        setTimeout(() => editRef.current?.focus(), 50);
    };

    const commitEdit = (id) => {
        const trimmed = editValue.trim();
        if (trimmed) onRename(id, trimmed);
        setEditingId(null);
    };

    const handleEditKey = (e, id) => {
        if (e.key === 'Enter') { e.preventDefault(); commitEdit(id); }
        if (e.key === 'Escape') setEditingId(null);
    };

    return (
        <>
            {/* Backdrop — clicking outside closes the dropdown */}
            <div className="cb-hd-backdrop" onClick={onClose} />

            <div className="cb-history-dropdown">
                <div className="cb-history-dropdown-header">
                    <span><Clock size={13} /> Recent conversations</span>
                    <button className="cb-hd-close" onClick={onClose}><X size={14} /></button>
                </div>

                {history.length > 0 && (
                    <button className="cb-hd-clear-all" onClick={onClearAll}>
                        <Trash2 size={12} /> Clear All History
                    </button>
                )}

                {history.length === 0 ? (
                    <div className="cb-hd-empty">
                        <History size={24} />
                        <p>No past conversations yet</p>
                    </div>
                ) : (
                    <ul className="cb-hd-list">
                        {history.slice().reverse().map(conv => (
                            <li key={conv.id} className="cb-hd-item"
                                onClick={() => editingId !== conv.id && onLoad(conv)}>
                                <div className="cb-hd-item-body">
                                    {editingId === conv.id ? (
                                        <input
                                            ref={editRef}
                                            className="cb-hd-rename-input"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onKeyDown={e => handleEditKey(e, conv.id)}
                                            onBlur={() => commitEdit(conv.id)}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="cb-hd-title">{conv.title}</span>
                                    )}
                                    <span className="cb-hd-meta">
                                        {formatDate(conv.updatedAt)} · {conv.messages.length} msgs
                                    </span>
                                </div>
                                <div className="cb-hd-actions">
                                    {editingId === conv.id ? (
                                        <button className="cb-hd-btn cb-hd-confirm"
                                            onClick={e => { e.stopPropagation(); commitEdit(conv.id); }}>
                                            <Check size={12} />
                                        </button>
                                    ) : (
                                        <button className="cb-hd-btn cb-hd-edit"
                                            onClick={e => startEdit(e, conv)} title="Rename">
                                            <Pencil size={12} />
                                        </button>
                                    )}
                                    <button className="cb-hd-btn cb-hd-del"
                                        onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                                        title="Delete">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

export default function ChatBot() {
    const { user } = useUser();

    const [convId, setConvId] = useState(() => loadCurrentConv()?.id || null);
    const [messages, setMessages] = useState(() => loadCurrentConv()?.messages || []);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [typingLabel, setTypingLabel] = useState('Thinking');
    const [isNewChat, setIsNewChat] = useState(() => (loadCurrentConv()?.messages || []).length === 0);
    const [scope, setScope] = useState('portfolio');
    const [notif, setNotif] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState(loadHistory);
    const [attachedFile, setAttachedFile] = useState(null);
    const [liveContext, setLiveContext] = useState('');

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);

    // Stable callbacks to avoid re-renders
    const closeHistory = useCallback(() => setShowHistory(false), []);
    const toggleHistory = useCallback(() => setShowHistory(v => !v), []);

    useEffect(() => {
        async function fetchContext() {
            try {
                const [projects, dashboard] = await Promise.allSettled([
                    apiJson('/api/projects'),
                    apiJson('/api/analytics/dashboard'),
                ]);
                const projData = projects.status === 'fulfilled' ? projects.value : [];
                const dashData = dashboard.status === 'fulfilled' ? dashboard.value : null;
                setLiveContext(JSON.stringify({ projects: projData, dashboard: dashData }, null, 2));
            } catch {
                setLiveContext('No live data available.');
            }
        }
        fetchContext();
    }, []);

    // Persist conversation whenever messages change
    useEffect(() => {
        if (messages.length === 0) return;
        const id = convId || `conv_${Date.now()}`;
        const conv = {
            id,
            title: makeConvTitle(messages),
            messages,
            updatedAt: new Date().toISOString(),
        };
        saveCurrentConv(conv);
        if (!convId) setConvId(id);
        setHistory(prev => {
            const idx = prev.findIndex(c => c.id === id);
            const next = idx >= 0 ? prev.map((c, i) => i === idx ? conv : c) : [...prev, conv];
            saveHistory(next);
            return next;
        });
    }, [messages]);

    useEffect(() => {
        if (notif) { const t = setTimeout(() => setNotif(null), 3000); return () => clearTimeout(t); }
    }, [notif]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!isNewChat) inputRef.current?.focus();
    }, [messages, isNewChat]);

    const startNewChat = useCallback(() => {
        setMessages([]);
        setConvId(null);
        setIsNewChat(true);
        setShowHistory(false);
        setAttachedFile(null);
        localStorage.removeItem(CURRENT_KEY);
    }, []);

    const loadConversation = useCallback((conv) => {
        setMessages(conv.messages);
        setConvId(conv.id);
        setIsNewChat(false);
        setShowHistory(false);
        saveCurrentConv(conv);
    }, []);

    const deleteConversation = useCallback((id) => {
        setHistory(prev => {
            const next = prev.filter(c => c.id !== id);
            saveHistory(next);
            return next;
        });
        setConvId(prev => {
            if (prev === id) {
                setMessages([]);
                setIsNewChat(true);
                setAttachedFile(null);
                localStorage.removeItem(CURRENT_KEY);
                return null;
            }
            return prev;
        });
    }, []);

    const clearAllHistory = useCallback(() => {
        setHistory([]);
        saveHistory([]);
        setConvId(null);
        setMessages([]);
        setIsNewChat(true);
        setAttachedFile(null);
        setShowHistory(false);
        localStorage.removeItem(CURRENT_KEY);
    }, []);

    const renameConversation = useCallback((id, newTitle) => {
        setHistory(prev => {
            const next = prev.map(c => c.id === id ? { ...c, title: newTitle } : c);
            saveHistory(next);
            if (loadCurrentConv()?.id === id) {
                const updated = next.find(c => c.id === id);
                if (updated) saveCurrentConv(updated);
            }
            return next;
        });
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const MAX = 5 * 1024 * 1024; // 5 MB limit
        if (file.size > MAX) { setNotif('File too large (max 5 MB)'); return; }
        try {
            const content = await readFileAsText(file);
            setAttachedFile({ name: file.name, content });
            setNotif(`Attached: ${file.name}`);
        } catch {
            setNotif('Could not read file');
        }
        e.target.value = '';
    };

    const send = async (overrideText) => {
        const text = (overrideText || input).trim();
        if (!text && !attachedFile) return;
        if (isNewChat) setIsNewChat(false);

        let fullText = text;
        if (attachedFile) {
            fullText = `${text ? text + '\n\n' : ''}[Attached file: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\``;
        }

        const userMsg = {
            id: Date.now(), role: 'user', type: 'text',
            text: fullText,
            displayText: text || `📎 ${attachedFile?.name}`,
            time: now()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachedFile(null);

        const isChart = isChartRequest(fullText);
        setTypingLabel(isChart ? 'Generating chart with Claude AI' : 'Thinking with Claude');
        setTyping(true);

        let reply;
        if (isChart) {
            reply = await askOpenAI(fullText);
        } else {
            const userName = user?.firstName || user?.username || 'the admin';
            let systemContext = `You are the AI Assistant for the Enterprise Command Center dashboard.
You are speaking with ${userName}.
You help analyze project portfolios, team health, learner stats, cohorts, and mentors.
Be concise, professional, and data-focused. Use ** for bold key terms.`;
            if (liveContext) systemContext += `\n\nLive portfolio data:\n${liveContext}`;
            if (scope === 'global') systemContext += '\n\nGLOBAL SCOPE — provide cross-portfolio strategic insights.';
            reply = await askClaude(messages, fullText, systemContext);
        }

        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', time: now(), ...reply }]);
        setTyping(false);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const CHIPS = [
        { label: 'Metrics',   icon: <BarChart2 size={14} /> },
        { label: 'Trends',    icon: <TrendingUp size={14} /> },
        { label: 'Teams',     icon: <UsersIcon size={14} /> },
        { label: 'Bar chart of learners per project', icon: <BarChart2 size={14} /> },
        { label: 'Pie chart of team health',          icon: <PieChartIcon size={14} /> },
    ];

    const QUICK_ACTIONS = [
        { title: 'Portfolio Summary',  desc: 'Consolidated overview of all active initiatives', icon: <FileText size={18} />,    query: 'Give me a summary of the entire enterprise portfolio.' },
        { title: 'Team Health Chart',  desc: 'Visual breakdown of team health distribution',   icon: <PieChartIcon size={18} />, query: 'Generate a pie chart of team health distribution.' },
        { title: 'Learner Comparison', desc: 'Compare learner counts across all projects',      icon: <BarChart2 size={18} />,   query: 'Generate a bar chart comparing learners across all connected projects.' },
    ];

    // ── Reusable inline history button + dropdown (NOT a component — avoids remount)
    const historyToggle = (sm) => (
        <div style={{ position: 'relative' }}>
            <button
                className={`cb-icon-btn ${sm ? 'cb-icon-btn--sm' : ''} ${showHistory ? 'cb-icon-btn--active' : ''}`}
                onClick={toggleHistory}
                title="History"
            >
                <History size={14} />
                {!sm && ' History'}
                {history.length > 0 && <span className="cb-history-badge">{history.length}</span>}
            </button>
            {showHistory && (
                <HistoryDropdown
                    history={history}
                    onLoad={loadConversation}
                    onDelete={deleteConversation}
                    onRename={renameConversation}
                    onClearAll={clearAllHistory}
                    onClose={closeHistory}
                />
            )}
        </div>
    );

    return (
        <div className={`cb-root ${isNewChat ? 'cb-root--landing' : ''} anim-fade-in`}>
            {isNewChat ? (
                <div className="cb-landing">
                    <div className="cb-landing-hero">
                        <div className="cb-landing-hero-mesh" />
                        <div className="cb-landing-hero-inner">
                            <div className="cb-hero-icon-wrap">
                                <MessageSquare size={32} className="cb-hero-icon" />
                            </div>
                            <h1 className="cb-landing-title">AI Assistant</h1>
                            <p className="cb-landing-subtitle">
                                Ask text questions → answered by <strong>Claude</strong>.<br />
                                Ask for charts → generated by <strong>Claude AI</strong> with live data.
                            </p>
                        </div>
                    </div>

                    <div className="cb-landing-input-wrap">
                        {attachedFile && (
                            <div className="cb-attach-preview">
                                <Paperclip size={12} />
                                <span>{attachedFile.name}</span>
                                <button onClick={() => setAttachedFile(null)}><X size={12} /></button>
                            </div>
                        )}
                        <div className="cb-landing-input-box">
                            <textarea className="cb-landing-input"
                                placeholder="Ask anything, or say 'generate a chart of…'"
                                value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey} rows={1} />
                            <div className="cb-landing-input-actions">
                                <div className="cb-landing-input-left">
                                    {historyToggle(false)}
                                    <button
                                        className={`cb-icon-btn ${scope === 'global' ? 'cb-icon-btn--active' : ''}`}
                                        onClick={() => setScope(s => s === 'portfolio' ? 'global' : 'portfolio')}
                                    >
                                        <Globe size={14} />{scope === 'global' ? ' Global ✓' : ' Global'}
                                    </button>
                                    <button className="cb-icon-btn" onClick={() => fileRef.current?.click()}>
                                        <Paperclip size={14} /> Attach
                                    </button>
                                </div>
                                <button className={`cb-landing-send ${(input.trim() || attachedFile) ? 'cb-landing-send--active' : ''}`} onClick={() => send()}>
                                    <ArrowUp size={18} />
                                </button>
                            </div>
                        </div>
                        <input type="file" ref={fileRef} style={{ display: 'none' }}
                            onChange={handleFileChange} />
                        {notif && <div className="cb-notif cb-anim-fade-up">{notif}</div>}
                        <div className="cb-category-chips">
                            {CHIPS.map(c => (
                                <button key={c.label} className="cb-chip" onClick={() => send(c.label)}>
                                    <span className="cb-chip-icon">{c.icon}</span>{c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cb-quick-actions">
                        <div className="cb-section-header">
                            <Zap size={14} className="cb-section-icon" /> STRATEGIC ACTIONS
                        </div>
                        <div className="cb-action-grid">
                            {QUICK_ACTIONS.map(action => (
                                <div key={action.title} className="cb-action-card" onClick={() => send(action.query)}>
                                    <div className="cb-action-icon">{action.icon}</div>
                                    <div className="cb-action-info">
                                        <p className="cb-action-title">{action.title}</p>
                                        <p className="cb-action-desc">{action.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="cb-active-header">
                        <div className="cb-active-title-wrap">
                            <MessageSquare size={16} className="cb-bot-icon" />
                            <p className="cb-active-title">AI Assistant</p>
                            {scope === 'global' && (
                                <span className="cb-global-badge"><Globe size={10} /> Global</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {historyToggle(false)}
                            <button className="cb-header-btn" onClick={startNewChat}>
                                <RefreshCcw size={12} /> New Chat
                            </button>
                        </div>
                    </div>

                    <div className="cb-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`cb-msg cb-msg--${msg.role}`}>
                                {msg.role === 'bot' && (
                                    <div className="cb-bot-avatar">
                                        {msg.type === 'chart' ? <BarChart2 size={14} /> : <Target size={14} />}
                                    </div>
                                )}
                                <div className="cb-bubble-wrap">
                                    <div className={`cb-bubble ${msg.type === 'chart' ? 'cb-bubble--chart' : ''}`}>
                                        <BotMessage msg={{ ...msg, text: msg.displayText || msg.text }} />
                                    </div>
                                    <span className="cb-time">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                        {typing && (
                            <div className="cb-msg cb-msg--bot">
                                <div className="cb-bot-avatar">
                                    <RefreshCcw size={14} className="cb-spin" />
                                </div>
                                <div className="cb-typing-wrap">
                                    <div className="cb-typing"><span /><span /><span /></div>
                                    <span className="cb-typing-label">{typingLabel}…</span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="cb-active-footer">
                        {attachedFile && (
                            <div className="cb-attach-preview">
                                <Paperclip size={12} />
                                <span>{attachedFile.name}</span>
                                <button onClick={() => setAttachedFile(null)}><X size={12} /></button>
                            </div>
                        )}
                        <div className="cb-input-row">
                            <div className="cb-input-inner">
                                <textarea ref={inputRef} className="cb-input"
                                    placeholder="Ask anything or say 'generate a chart of…'"
                                    value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey} rows={1} />
                                <div className="cb-input-bottom-row">
                                    <div className="cb-input-actions-left">
                                        {historyToggle(true)}
                                        <button
                                            className={`cb-icon-btn cb-icon-btn--sm ${scope === 'global' ? 'cb-icon-btn--active' : ''}`}
                                            onClick={() => setScope(s => s === 'portfolio' ? 'global' : 'portfolio')}
                                        >
                                            <Globe size={14} />
                                        </button>
                                        <button className="cb-icon-btn cb-icon-btn--sm" onClick={() => fileRef.current?.click()}>
                                            <Paperclip size={14} />
                                        </button>
                                    </div>
                                    <button className={`cb-send ${(input.trim() || attachedFile) ? 'cb-send--active' : ''}`} onClick={() => send()}>
                                        <ArrowUp size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={fileRef} style={{ display: 'none' }}
                            onChange={handleFileChange} />
                        {notif && <div className="cb-notif cb-anim-fade-up">{notif}</div>}
                    </div>
                </>
            )}
        </div>
    );
}
