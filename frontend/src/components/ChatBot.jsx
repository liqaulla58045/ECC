import { useState, useRef, useEffect } from 'react';
import {
    MessageSquare, Zap, BarChart2, TrendingUp, Users as UsersIcon,
    DollarSign, Target, FileText, History, Globe, Paperclip,
    ArrowUp, RefreshCcw, Layout
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { apiJson } from '../utils/api';
import '../styles/ChatBot.css';

function now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

async function askClaude(messageHistory, userText, systemContext) {
    const apiKey = import.meta.env.VITE_CLAUDE_API;
    if (!apiKey) {
        return '⚠️ VITE_CLAUDE_API key is missing in the .env file. Please check your configuration.';
    }

    const messages = messageHistory
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
    messages.push({ role: 'user', content: userText });

    try {
        const res = await fetch('/claude-api/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 400,
                system: systemContext,
                messages,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            return `⚠️ Claude API error: ${err.error?.message || res.statusText}`;
        }

        const data = await res.json();
        return data.content[0].text;
    } catch {
        return '⚠️ Failed to connect to the assistant API. Check your network or proxy configuration.';
    }
}

function parseBold(text) {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p));
}

function BotMessage({ text }) {
    return (
        <span>
            {text.split('\n').map((line, i, arr) => (
                <span key={i}>{parseBold(line)}{i < arr.length - 1 && <br />}</span>
            ))}
        </span>
    );
}

const CHIPS = [
    { label: 'Metrics',  icon: <BarChart2 size={14} /> },
    { label: 'Trends',   icon: <TrendingUp size={14} /> },
    { label: 'Teams',    icon: <UsersIcon size={14} /> },
    { label: 'Revenue',  icon: <DollarSign size={14} /> },
    { label: 'Forecast', icon: <Target size={14} /> },
];

const QUICK_ACTIONS = [
    { title: 'Portfolio Summary',  desc: 'Consolidated overview of all active initiatives',       icon: <FileText size={18} />,  query: 'Give me a summary of the entire enterprise portfolio.' },
    { title: 'Platform Analysis',  desc: 'Strategic review of learner and engagement stats',      icon: <Layout size={18} />,    query: 'Analyze the status and performance of all connected platforms.' },
    { title: 'Strategic Forecast', desc: 'Quantitative predictions for the upcoming quarter',     icon: <TrendingUp size={18} />, query: 'What is the projected growth for the next quarter based on current trends?' },
];

export default function ChatBot() {
    const { user } = useUser();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [isNewChat, setIsNewChat] = useState(true);
    const [scope, setScope] = useState('portfolio');
    const [notif, setNotif] = useState(null);
    const [liveContext, setLiveContext] = useState('');
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);

    // Fetch live portfolio context from backend on mount
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

    useEffect(() => {
        if (notif) {
            const t = setTimeout(() => setNotif(null), 3000);
            return () => clearTimeout(t);
        }
    }, [notif]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!isNewChat) inputRef.current?.focus();
    }, [messages, isNewChat]);

    const send = async (overrideText) => {
        const text = (overrideText || input).trim();
        if (!text) return;

        if (isNewChat) setIsNewChat(false);

        const userMsg = { id: Date.now(), role: 'user', text, time: now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTyping(true);

        const systemContext = `You are the "AI Assistant" — an executive dashboard assistant for the Chairman of the Enterprise Command Center${user?.firstName ? ` (${user.firstName})` : ''}.
You have access to the following live portfolio data from the PostgreSQL database:
${liveContext}

Provide concise, strategic insights based on this real data. If data is empty, acknowledge it and suggest adding projects.`;

        const replyText = await askClaude(messages, text, systemContext);

        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: replyText, time: now() }]);
        setTyping(false);
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    const handleAttach = () => fileRef.current?.click();
    const handleHistory = () => setNotif('Contextual history analysis coming in next update.');
    const handleGlobal = () => {
        const next = scope === 'portfolio' ? 'global' : 'portfolio';
        setScope(next);
        setNotif(`Scope switched to: ${next.toUpperCase()}`);
    };

    return (
        <div className={`cb-root ${isNewChat ? 'cb-root--landing' : ''} anim-fade-in`}>
            {isNewChat ? (
                <div className="cb-landing">
                    <div className="cb-landing-hero">
                        <div className="cb-hero-icon-wrap">
                            <MessageSquare size={32} className="cb-hero-icon" />
                        </div>
                        <h1 className="cb-landing-title">AI Assistant</h1>
                        <p className="cb-landing-subtitle">Generate strategic insights, track portfolio health, and organize upcoming initiatives.</p>
                    </div>

                    <div className="cb-landing-input-wrap">
                        <div className="cb-landing-input-box">
                            <textarea
                                className="cb-landing-input"
                                placeholder="Query the portfolio or request a strategic update..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                rows={1}
                            />
                            <div className="cb-landing-input-actions">
                                <div className="cb-landing-input-left">
                                    <button className="cb-icon-btn" onClick={handleHistory} title="History">
                                        <History size={14} /> History
                                    </button>
                                    <button className={`cb-icon-btn ${scope === 'global' ? 'cb-icon-btn--active' : ''}`} onClick={handleGlobal} title="Switch Scope">
                                        <Globe size={14} /> Global
                                    </button>
                                    <button className="cb-icon-btn" onClick={handleAttach} title="Attach">
                                        <Paperclip size={14} /> Attach
                                    </button>
                                </div>
                                <button className={`cb-landing-send ${input.trim() ? 'cb-landing-send--active' : ''}`} onClick={() => send()}>
                                    <ArrowUp size={18} />
                                </button>
                            </div>
                        </div>

                        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={e => setNotif(`Attached: ${e.target.files[0]?.name}`)} />

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
                            <Zap size={14} className="cb-section-icon" />
                            STRATEGIC ACTIONS
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
                        </div>
                        <div className="cb-active-header-actions">
                            <button className="cb-header-btn" onClick={() => setIsNewChat(true)}>
                                <RefreshCcw size={12} /> New Insight
                            </button>
                        </div>
                    </div>

                    <div className="cb-messages">
                        {messages.length === 0 && (
                            <div className="cb-empty-state"><p>Starting a new insight session...</p></div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`cb-msg cb-msg--${msg.role}`}>
                                {msg.role === 'bot' && (
                                    <div className="cb-bot-avatar"><Target size={14} /></div>
                                )}
                                <div className="cb-bubble-wrap">
                                    <div className="cb-bubble"><BotMessage text={msg.text} /></div>
                                    <span className="cb-time">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                        {typing && (
                            <div className="cb-msg cb-msg--bot">
                                <div className="cb-bot-avatar"><RefreshCcw size={14} className="cb-spin" /></div>
                                <div className="cb-typing"><span /><span /><span /></div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="cb-active-footer">
                        <div className="cb-input-row">
                            <div className="cb-input-inner">
                                <textarea
                                    ref={inputRef}
                                    className="cb-input"
                                    placeholder="Ask about platform metrics..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    rows={1}
                                />
                                <div className="cb-input-bottom-row">
                                    <div className="cb-input-actions-left">
                                        <button className="cb-icon-btn cb-icon-btn--sm" onClick={handleHistory} title="History"><History size={14} /></button>
                                        <button className={`cb-icon-btn cb-icon-btn--sm ${scope === 'global' ? 'cb-icon-btn--active' : ''}`} onClick={handleGlobal} title="Switch Scope"><Globe size={14} /></button>
                                        <button className="cb-icon-btn cb-icon-btn--sm" onClick={handleAttach} title="Attach"><Paperclip size={14} /></button>
                                    </div>
                                    <button className={`cb-send ${input.trim() ? 'cb-send--active' : ''}`} onClick={() => send()}>
                                        <ArrowUp size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {notif && <div className="cb-notif cb-anim-fade-up">{notif}</div>}
                </>
            )}
        </div>
    );
}
