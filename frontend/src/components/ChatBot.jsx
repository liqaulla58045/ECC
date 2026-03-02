import { useState, useRef, useEffect } from 'react';
import { projects, chairman } from '../data/mockData';
import '../styles/ChatBot.css';

const INITIAL_MESSAGES = [
    {
        id: 1,
        role: 'bot',
        text: "Good day. I'm your ECC Assistant — connected to Claude. How can I help you with the enterprise portfolio today?",
        time: now(),
    },
];

function now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Format the mock data into a string context for Claude
const SV_CONTEXT = `
You are the "ECC Assistant" - an AI dashboard assistant for the Chairman of the Enterprise Command Center (${chairman.name}).
You have access to the following live platform data:
${JSON.stringify(projects, null, 2)}

Instructions:
1. Answer the Chairman's questions accurately based ONLY on the data above.
2. Keep your answers concise, professional, and slightly formal yet helpful.
3. Use markdown bolding (e.g. **text**) for key metrics, numbers, or names to make them stand out.
4. If asked something unrelated to the data, politely steer them back to portfolio metrics.
5. Limit your responses to 2-3 short paragraphs at most.
`;

// Call Claude API via Vite Proxy
async function askClaude(messageHistory, userText) {
    const apiKey = import.meta.env.VITE_CLAUDE_API;

    // Fallback if no API key is provided
    if (!apiKey) {
        return "⚠️ Error: VITE_CLAUDE_API key is missing in the .env file. Please check your configuration.";
    }

    // Convert chat history map to Claude's format
    const messages = messageHistory
        .filter(m => m.id !== 1) // Skip initial welcome message
        .map(m => ({
            role: m.role === 'bot' ? 'assistant' : 'user',
            content: m.text
        }));

    // Add current user message
    messages.push({ role: 'user', content: userText });

    try {
        const res = await fetch('/claude-api/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 400,
                system: SV_CONTEXT,
                messages: messages
            })
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Claude API Error:", err);
            return `⚠️ Error from Claude API: ${err.error?.message || res.statusText}`;
        }

        const data = await res.json();
        return data.content[0].text;
    } catch (err) {
        console.error("Fetch Error:", err);
        return "⚠️ Failed to connect to the assistant API. Check your network or proxy configuration.";
    }
}

// Parse bold markdown **text**
function parseBold(text) {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i}>{p}</strong> : p
    );
}

function BotMessage({ text }) {
    return (
        <span>
            {text.split('\n').map((line, i) => (
                <span key={i}>
                    {parseBold(line)}
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            ))}
        </span>
    );
}

export default function ChatBot() {
    const [messages, setMessages] = useState([]); // Start empty for Blossom style
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [isNewChat, setIsNewChat] = useState(true); // Track if we are in "Landing" state
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!isNewChat) inputRef.current?.focus();
    }, [messages, isNewChat]);

    const send = async (overrideText) => {
        const text = (overrideText || input).trim();
        if (!text) return;

        if (isNewChat) setIsNewChat(false); // Transition to chat view

        const userMsg = { id: Date.now(), role: 'user', text, time: now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTyping(true);

        // Fetch response from Claude
        const replyText = await askClaude(messages, text);

        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: replyText, time: now() }]);
        setTyping(false);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const CHIPS = [
        { label: 'Metrics', icon: '📊' },
        { label: 'Leads', icon: '📈' },
        { label: 'Teams', icon: '👥' },
        { label: 'Revenue', icon: '💰' },
        { label: 'Forecast', icon: '🎯' }
    ];

    const QUICK_ACTIONS = [
        {
            title: 'Summarize Portfolio',
            desc: 'High-level overview of all running projects',
            icon: '📋',
            query: 'Give me a summary of the entire enterprise portfolio.'
        },
        {
            title: 'Analyze StartupVarsity',
            desc: 'Deep dive into learner and lead trends',
            icon: '🏫',
            query: 'Analyze the status and lead trends for StartupVarsity.'
        },
        {
            title: 'Revenue Forecast',
            desc: 'Predictions based on current quarterly data',
            icon: '🚀',
            query: 'What is the projected revenue for the next quarter?'
        }
    ];

    return (
        <div className={`cb-root ${isNewChat ? 'cb-root--landing' : ''} anim-fade-in`}>

            {isNewChat ? (
                <div className="cb-landing">
                    <div className="cb-landing-hero">
                        <span className="cb-landing-emoji">👋</span>
                        <h1 className="cb-landing-title">Welcome, Chairman</h1>
                        <p className="cb-landing-subtitle">I'm here to help you plan, organize, and reflect on your portfolio.</p>
                    </div>

                    <div className="cb-landing-input-wrap">
                        <div className="cb-landing-input-box">
                            <textarea
                                className="cb-landing-input"
                                placeholder="What would you like to plan or organize today?"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                rows={3}
                            />
                            <div className="cb-landing-input-actions">
                                <div className="cb-landing-input-left">
                                    <button className="cb-icon-btn"><span className="icon-history" /> History</button>
                                    <button className="cb-icon-btn"><span className="icon-global" /> Global</button>
                                    <button className="cb-icon-btn"><span className="icon-attach" /> Attach</button>
                                </div>
                                <button
                                    className={`cb-landing-send ${input.trim() ? 'cb-landing-send--active' : ''}`}
                                    onClick={() => send()}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                                        <path d="M7 11l5-5 5 5M12 6v12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="cb-category-chips">
                            {CHIPS.map(c => (
                                <button key={c.label} className="cb-chip" onClick={() => send(c.label)}>
                                    <span className="cb-chip-icon">{c.icon}</span>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cb-quick-actions">
                        <div className="cb-section-header">
                            <span className="cb-section-icon">⚡</span>
                            Quick Action
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
                    {/* Header for Active Chat */}
                    <div className="cb-active-header">
                        <div className="cb-active-title-wrap">
                            <span className="cb-bot-emoji">🤖</span>
                            <p className="cb-active-title">AI Assistant</p>
                        </div>
                        <div className="cb-active-header-actions">
                            <button className="cb-header-btn" onClick={() => setIsNewChat(true)}>New Chat</button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="cb-messages">
                        {messages.length === 0 && (
                            <div className="cb-empty-state">
                                <p>Starting a new insight session...</p>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`cb-msg cb-msg--${msg.role}`}>
                                {msg.role === 'bot' && (
                                    <div className="cb-bot-avatar">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                                            <circle cx="12" cy="8" r="4" />
                                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                        </svg>
                                    </div>
                                )}
                                <div className="cb-bubble-wrap">
                                    <div className="cb-bubble">
                                        <BotMessage text={msg.text} />
                                    </div>
                                    <span className="cb-time">{msg.time}</span>
                                </div>
                            </div>
                        ))}

                        {typing && (
                            <div className="cb-msg cb-msg--bot">
                                <div className="cb-bot-avatar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                </div>
                                <div className="cb-typing">
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Footer Input for Active Chat */}
                    <div className="cb-active-footer">
                        <div className="cb-input-row">
                            <textarea
                                ref={inputRef}
                                className="cb-input"
                                placeholder="Message Assistant..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                rows={1}
                            />
                            <button
                                className={`cb-send ${input.trim() ? 'cb-send--active' : ''}`}
                                onClick={() => send()}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                                    <path d="M7 11l5-5 5 5M12 6v12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
