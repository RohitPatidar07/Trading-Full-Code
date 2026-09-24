import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Send, Mic, Square, Zap, CheckCircle, XCircle, Terminal, MessageCircle, ChevronUp, GraduationCap, BookOpen, TrendingUp, BarChart3, Shield, Layers, Brain, Target, Gem, LineChart, User
} from 'lucide-react';
import * as api from '../services/api';
import { parseCommand, parseNavigation, formatCommandPreview, COMMAND_EXAMPLES } from '../services/commandParser';
import CuteBot from '../components/CuteBot';
import useResponsive from '../hooks/useResponsive';

const TUTOR_TOPIC_UI = {
    basics:      { icon: BookOpen,    color: '#4ADE80', label: 'Trading Basics' },
    options:     { icon: Layers,      color: '#F472B6', label: 'Options Trading' },
    futures:     { icon: TrendingUp,  color: '#60A5FA', label: 'Futures Trading' },
    technical:   { icon: BarChart3,   color: '#FBBF24', label: 'Technical Analysis' },
    risk:        { icon: Shield,      color: '#F87171', label: 'Risk Management' },
    orders:      { icon: Target,      color: '#A78BFA', label: 'Order Types' },
    commodities: { icon: Gem,         color: '#FB923C', label: 'Commodities (MCX)' },
    indices:     { icon: LineChart,   color: '#2DD4BF', label: 'Index Trading' },
    psychology:  { icon: Brain,       color: '#E879F9', label: 'Trading Psychology' },
    strategies:  { icon: GraduationCap, color: '#38BDF8', label: 'Trading Strategies' },
};

const TUTOR_QUESTIONS = {
    basics: {
        hi: ['Trading kya hota hai?', 'Share market kaise kaam karta hai?', 'Demat account kya hai?', 'Bull market aur bear market kya hota hai?', 'Intraday aur delivery me kya farak hai?', 'Sensex aur Nifty kya hai?', 'IPO kya hota hai?', 'Dividend kya hota hai?'],
        en: ['What is trading?', 'How does the stock market work?', 'What is a Demat account?', 'What is bull market and bear market?', 'Difference between intraday and delivery?', 'What are Sensex and Nifty?', 'What is an IPO?', 'What is a dividend?'],
    },
    options: {
        hi: ['Options trading kya hota hai?', 'Call aur Put me kya difference hai?', 'Strike price kya hai?', 'Premium kaise calculate hota hai?', 'Options expiry kya hoti hai?', 'In the money aur out of the money samjhao', 'Option Greeks kya hote hain?', 'Covered call strategy kya hai?'],
        en: ['What is options trading?', 'Difference between Call and Put?', 'What is strike price?', 'How is premium calculated?', 'What is options expiry?', 'Explain In The Money (ITM) and Out Of The Money (OTM)', 'What are option Greeks?', 'What is a covered call strategy?'],
    },
    futures: {
        hi: ['Futures trading kya hota hai?', 'Futures me leverage kaise kaam karta hai?', 'Margin in futures kya hai?', 'Futures contract expiry kya hoti hai?', 'Hedging ke liye futures kaise use karein?', 'Mark to market (M2M) kya hota hai?'],
        en: ['What is futures trading?', 'How does futures leverage work?', 'What is margin in futures?', 'What is futures contract expiry?', 'How to use futures for hedging?', 'What is Mark to Market (M2M)?'],
    },
    technical: {
        hi: ['Support aur resistance kya hote hain?', 'Candlestick charts kaise read karein?', 'Moving Average (MA) samjhao', 'RSI indicator kya hai?', 'Trend line kaise draw karein?', 'Volume ka trading me kya role hai?', 'Breakout trading kya hoti hai?', 'MACD indicator kaise use karein?'],
        en: ['What are support and resistance?', 'How to read candlestick charts?', 'Explain Moving Average (MA)', 'What is RSI indicator?', 'How to draw trend lines?', 'Role of volume in trading', 'What is breakout trading?', 'How to use MACD indicator?'],
    },
    risk: {
        hi: ['Risk-to-reward ratio kya hota hai?', 'Stop loss kahan set karein?', 'Position size kaise calculate karein?', 'Risk management ke golden rules kya hain?', 'Drawdown kya hota hai?', 'Capital preserve kaise karein?'],
        en: ['What is risk-to-reward ratio?', 'Where to set stop loss?', 'How to calculate position size?', 'Golden rules of risk management', 'What is drawdown?', 'How to preserve capital?'],
    },
    orders: {
        hi: ['Market aur limit order me kya difference hai?', 'Stop Loss (SL) order kya hota hai?', 'Trigger price kya hai?', 'GTT order kya hota hai?', 'Bracket order (BO) kya hai?', 'Cover order (CO) kaise lagayein?', 'Iceberg order kya hota hai?'],
        en: ['Difference between market and limit order?', 'What is a Stop Loss (SL) order?', 'What is trigger price?', 'What is GTT order?', 'What is a Bracket Order (BO)?', 'How to place Cover Order (CO)?', 'What is an Iceberg order?'],
    },
    commodities: {
        hi: ['MCX Crude Oil kaise trade karein?', 'MCX me lot size kya hota hai?', 'Gold aur Silver futures trading samjhao', 'MCX market hours kya hain?', 'Commodity trading me margin kitna lagta hai?'],
        en: ['How to trade MCX Crude Oil?', 'What is lot size in MCX?', 'Explain Gold and Silver futures trading', 'What are MCX market hours?', 'How much margin is required in commodity trading?'],
    },
    indices: {
        hi: ['Nifty 50 kya hai?', 'Bank Nifty kaise trade karein?', 'Index option selling kya hoti hai?', 'Nifty index price kaise decide hoti hai?', 'FinNifty expiry kab hoti hai?', 'India VIX kya hai?'],
        en: ['What is Nifty 50?', 'How to trade Bank Nifty?', 'What is index option selling?', 'How is Nifty index price decided?', 'When is FinNifty expiry?', 'What is India VIX?'],
    },
    psychology: {
        hi: ['Trading me fear ko kaise overcome karein?', 'Overtrading se kaise bachein?', 'Trading discipline kaise build karein?', 'Loss hone par mindset kaisa hona chahiye?', 'Revenge trading kya hai aur isse kaise bachein?', 'FOMO se kaise deal karein?'],
        en: ['How to overcome fear in trading?', 'How to avoid overtrading?', 'How to build trading discipline?', 'Mindset after a loss', 'What is revenge trading and how to avoid it?', 'How to deal with FOMO in trading?'],
    },
    strategies: {
        hi: ['Intraday trading ke liye best strategy kaun si hai?', 'Swing trading strategies kya hain?', 'Scalping kya hoti hai?', 'Gap up/down trading kaise karein?', 'Option selling strategies (Strangle/Straddle) kya hain?'],
        en: ['Best strategy for intraday trading?', 'What are swing trading strategies?', 'What is scalping?', 'How to trade gap up/down?', 'Option selling strategies (Strangle/Straddle)'],
    },
};

export default function AiAssistant() {
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const { isMobile } = useResponsive();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [pendingCommand, setPendingCommand] = useState(null);
    const [showExamples, setShowExamples] = useState(false);
    const [mode, setMode] = useState("chat");
    const [activeTopic, setActiveTopic] = useState(null);
    const [tutorHistory, setTutorHistory] = useState([]);
    const [experienceLevel, setExperienceLevel] = useState(null);
    const [questionLang, setQuestionLang] = useState("hi");
    
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        setMessages([{
            id: "welcome-1",
            text: "Hello! I am your AI Trading Assistant. You can ask me questions, execute commands, or learn about trading.\n\nTry:\n\"Buy 10 shares of Reliance\"\n\"Go to my portfolio\"\n\"What is options trading?\"",
            sender: "ai"
        }]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const addMessage = (sender, text, extra = {}) => {
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString() + Math.random(), text, sender, ...extra }
        ]);
    };

    const processInput = (text) => {
        if (!text || !text.trim()) return;
        const trimmed = text.trim();
        addMessage("user", trimmed);
        setInput("");
        setTranscript("");

        if (mode === "learn") {
            sendToTutor(trimmed);
            return;
        }

        const navTarget = parseNavigation(trimmed);
        if (navTarget) {
            handleNavigation(navTarget);
            return;
        }

        const parsed = parseCommand(trimmed);
        if (parsed) {
            setPendingCommand({ text: trimmed, parsed });
            return;
        }

        sendToChat(trimmed);
    };

    const handleNavigation = (navTarget) => {
        addMessage("ai", `📍 Navigating to ${navTarget.label}...`, { type: "success" });
        setTimeout(() => {
            if (navTarget.nested) {
                navigate(`/account/${navTarget.nested.toLowerCase()}`);
            } else {
                navigate(navTarget.screen === "Watchlist" ? "/" : `/${navTarget.screen.toLowerCase()}`);
            }
        }, 800);
    };

    const handleSend = () => {
        processInput(input);
    };

    const sendToChat = async (message) => {
        setIsLoading(true);
        try {
            const data = await api.aiChat(message);
            if (data.success && data.message) {
                addMessage("ai", data.message);
            } else {
                addMessage("ai", data.message || "Sorry, I could not understand. Please try again.");
            }
        } catch (err) {
            console.error("AI Chat Error:", err);
            addMessage("ai", "Sorry, could not connect to AI service.");
        } finally {
            setIsLoading(false);
        }
    };

    const sendToTutor = async (message, topic = null) => {
        setIsLoading(true);
        try {
            const data = await api.aiTutor(message, topic || activeTopic, tutorHistory);
            if (data.success && data.message) {
                addMessage("ai", data.message, { type: "tutor" });
                if (data.experienceLevel) setExperienceLevel(data.experienceLevel);
                if (data.detectedTopic && !activeTopic) setActiveTopic(data.detectedTopic);
                setTutorHistory(prev => [
                    ...prev,
                    { role: "user", content: message },
                    { role: "assistant", content: data.message }
                ].slice(-10));
            } else {
                addMessage("ai", data.message || "Sorry, could not get a response.");
            }
        } catch (err) {
            console.error("Tutor Error:", err);
            addMessage("ai", "Sorry, could not connect to Tutor AI.");
        } finally {
            setIsLoading(false);
        }
    };

    const executeCommand = async () => {
        if (!pendingCommand) return;
        const { text, parsed } = pendingCommand;
        setPendingCommand(null);
        setIsLoading(true);

        addMessage("ai", `⏳ Executing: ${formatCommandPreview(parsed)}`, { type: "status" });

        try {
            const result = await api.aiSmartCommand(text);
            if (result.success || result.status === "success") {
                const responseText = result.message || "Command executed successfully!";
                addMessage("ai", `✅ ${responseText}`, { type: "success" });
                
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                    const preview = result.data.slice(0, 5).map(item => {
                        const keys = Object.keys(item).slice(0, 4);
                        return keys.map(k => `${k}: ${item[k]}`).join(" | ");
                    }).join("\n");
                    addMessage("ai", `📊 Results:\n${preview}${result.data.length > 5 ? `\n... and ${result.data.length - 5} more` : ""}`, { type: "data" });
                }
            } else {
                addMessage("ai", `❌ ${result.message || "Command failed."}`, { type: "error" });
            }
        } catch (err) {
            console.error("Command error:", err);
            addMessage("ai", `❌ Error: ${err.message || "Failed to execute."}`, { type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const cancelCommand = () => {
        setPendingCommand(null);
        addMessage("ai", "Command cancelled. You can try again or ask me something else.");
    };

    const startTopic = (topicKey) => {
        setActiveTopic(topicKey);
        setTutorHistory([]);
        addMessage("ai", `You selected ${TUTOR_TOPIC_UI[topicKey].label}. What would you like to know?`, { type: "tutor" });
    };

    const switchToLearn = () => {
        setMode("learn");
        setShowExamples(false);
        addMessage("ai", "Switched to Learn Mode 📚. I'm ready to teach you about trading! Choose a topic below or ask any question.", { type: "tutor" });
    };

    const switchToChat = () => {
        setMode("chat");
        addMessage("ai", "Switched to Chat Mode 💬. You can execute commands or ask general questions.");
    };

    const useExample = (text) => {
        setShowExamples(false);
        setInput(text);
    };

    const handleVoicePress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            try {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = "en-IN";
                recognition.onstart = () => setIsRecording(true);
                recognition.onerror = () => runMediaRecorderFallback();
                recognition.onend = () => {
                    setIsRecording(false);
                    setTimeout(() => {
                        setInput(current => {
                            const trimmed = current.trim();
                            if (trimmed) processInput(trimmed);
                            return "";
                        });
                    }, 500);
                };
                recognition.onresult = (event) => {
                    let finalTranscript = "";
                    let interimTranscript = "";
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                        else interimTranscript += event.results[i][0].transcript;
                    }
                    setInput(finalTranscript || interimTranscript);
                };
                recognitionRef.current = recognition;
                recognition.start();
                return;
            } catch (err) {
                runMediaRecorderFallback();
            }
        } else {
            runMediaRecorderFallback();
        }
    };

    const runMediaRecorderFallback = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                stream.getTracks().forEach(track => track.stop());
                setIsTranscribing(true);
                try {
                    const res = await api.aiTranscribeVoice(audioBlob);
                    if (res && res.text) {
                        setTranscript(res.text);
                        processInput(res.text);
                    } else if (res && res.transcript) {
                        setTranscript(res.transcript);
                        processInput(res.transcript);
                    }
                } catch (err) {
                    console.error("Transcription error:", err);
                } finally {
                    setIsTranscribing(false);
                }
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.contentWrapper}>
                {/* Header */}
                <header style={styles.header}>
                    <div style={styles.headerTitleContainer}>
                        <button onClick={() => navigate(-1)} style={styles.backBtn}>
                            <ChevronLeft size={24} color="white" />
                        </button>
                        <CuteBot size={28} />
                        <span style={styles.headerTitle}>{mode === "learn" ? "AI Tutor" : "AI Assistant"}</span>
                    </div>
                    <div style={styles.headerRight}>
                        <div 
                            style={{
                                ...styles.modeToggleBtn,
                                borderColor: mode === "chat" ? "rgba(251, 191, 36, 0.4)" : "rgba(74, 222, 128, 0.4)",
                                backgroundColor: mode === "chat" ? "rgba(251, 191, 36, 0.08)" : "rgba(74, 222, 128, 0.08)"
                            }}
                            onClick={mode === "chat" ? switchToLearn : switchToChat}
                        >
                            {mode === "chat" ? <GraduationCap size={16} color="#FBBF24" /> : <MessageCircle size={16} color="#4ADE80" />}
                            <span style={{...styles.modeToggleText, color: mode === "chat" ? "#FBBF24" : "#4ADE80"}}>
                                {mode === "chat" ? "Learn" : "Chat"}
                            </span>
                        </div>
                        {mode === "chat" && (
                            <button onClick={() => setShowExamples(!showExamples)} style={styles.examplesBtn}>
                                <Terminal size={20} color="#4ADE80" />
                            </button>
                        )}
                    </div>
                </header>

                <div style={styles.mainContainer}>
                    {/* Examples Panel */}
                    {showExamples && (
                        <div style={styles.examplesPanel}>
                            <div style={styles.contentCentered}>
                                <div style={styles.examplesPanelHeader}>
                                    <span style={styles.examplesPanelTitle}>Voice Command Examples</span>
                                    <button onClick={() => setShowExamples(false)} style={styles.closeBtn}>
                                        <ChevronUp size={20} color="#94a3b8" />
                                    </button>
                                </div>
                                <div style={styles.examplesScroll}>
                                    {COMMAND_EXAMPLES.map((ex, i) => (
                                        <div key={i} style={styles.exampleChip} onClick={() => useExample(ex.text)}>
                                            <span style={styles.exampleLabel}>{ex.label}</span>
                                            <span style={styles.exampleText}>{ex.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Topic Grid for Learn Mode */}
                    {mode === "learn" && !activeTopic && (
                        <div style={styles.topicGrid}>
                            <div style={styles.topicGridHeader}>
                                <GraduationCap size={16} color="#FBBF24" />
                                <span style={styles.topicGridTitle}>Choose a Topic</span>
                            </div>
                            <div style={styles.topicScrollList}>
                                {Object.entries(TUTOR_TOPIC_UI).map(([key, topic]) => {
                                    const IconComp = topic.icon;
                                    return (
                                        <div key={key} style={{...styles.topicChip, borderColor: topic.color + "40"}} onClick={() => startTopic(key)}>
                                            <IconComp size={14} color={topic.color} />
                                            <span style={{...styles.topicChipText, color: topic.color}}>{topic.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Active Topic Options */}
                    {mode === "learn" && activeTopic && (
                        <div style={styles.activeTopicSection}>
                            <div style={styles.activeTopicRow}>
                                <div style={styles.activeTopicLeft}>
                                    {(() => {
                                        const IconComp = TUTOR_TOPIC_UI[activeTopic]?.icon || BookOpen;
                                        const color = TUTOR_TOPIC_UI[activeTopic]?.color || "#FBBF24";
                                        return <IconComp size={14} color={color} />;
                                    })()}
                                    <span style={styles.activeTopicText}>{TUTOR_TOPIC_UI[activeTopic]?.label || "Learning"}</span>
                                </div>
                                <div style={styles.activeTopicRight}>
                                    <div style={styles.langToggleContainer}>
                                        <div style={{...styles.langToggleBtn, ...(questionLang === "hi" ? styles.langToggleBtnActive : {})}} onClick={() => setQuestionLang("hi")}>
                                            <span style={{...styles.langToggleBtnText, ...(questionLang === "hi" ? styles.langToggleBtnTextActive : {})}}>हि</span>
                                        </div>
                                        <div style={{...styles.langToggleBtn, ...(questionLang === "en" ? styles.langToggleBtnActive : {})}} onClick={() => setQuestionLang("en")}>
                                            <span style={{...styles.langToggleBtnText, ...(questionLang === "en" ? styles.langToggleBtnTextActive : {})}}>En</span>
                                        </div>
                                    </div>
                                    <button style={styles.changeTopicBtn} onClick={() => { setActiveTopic(null); setTutorHistory([]); }}>Change</button>
                                </div>
                            </div>
                            {TUTOR_QUESTIONS[activeTopic] && (
                                <div style={styles.questionsScroll}>
                                    {(TUTOR_QUESTIONS[activeTopic][questionLang] || []).map((q, idx) => (
                                        <div key={`${questionLang}-${idx}`} style={{...styles.questionChip, borderColor: (TUTOR_TOPIC_UI[activeTopic]?.color || "#FBBF24") + "40"}} onClick={() => processInput(q)}>
                                            <span style={{...styles.questionChipText, color: TUTOR_TOPIC_UI[activeTopic]?.color || "#FBBF24"}}>{q}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Command Confirmation Card */}
                    {pendingCommand && (
                        <div style={styles.confirmCard}>
                            <div style={styles.confirmHeader}>
                                <Zap size={16} color="#FFA500" />
                                <span style={styles.confirmTitle}>Command Detected</span>
                            </div>
                            <div style={styles.confirmTags}>
                                <div style={{...styles.tag, ...styles.tagAction}}><span style={styles.tagText}>{pendingCommand.parsed.operation.toUpperCase()}</span></div>
                                <div style={{...styles.tag, ...styles.tagModule}}><span style={styles.tagText}>{pendingCommand.parsed.module.toUpperCase()}</span></div>
                                {pendingCommand.parsed.data.userId && <div style={{...styles.tag, ...styles.tagUser}}><span style={styles.tagText}>User: {pendingCommand.parsed.data.userId}</span></div>}
                                {pendingCommand.parsed.data.amount && <div style={{...styles.tag, ...styles.tagAmount}}><span style={styles.tagText}>₹{pendingCommand.parsed.data.amount.toLocaleString()}</span></div>}
                            </div>
                            <div style={styles.confirmActions}>
                                <button style={styles.confirmBtn} onClick={executeCommand}>
                                    <CheckCircle size={18} color="#4ADE80" /> <span style={styles.confirmBtnText}>Execute</span>
                                </button>
                                <button style={styles.cancelBtn} onClick={cancelCommand}>
                                    <XCircle size={18} color="#FF5252" /> <span style={styles.cancelBtnText}>Cancel</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Chat Messages */}
                    <div style={styles.chatContainer}>
                        {messages.map(msg => {
                            const isAi = msg.sender === "ai";
                            return (
                                <div key={msg.id} style={styles.messageRowWrapper}>
                                    <div style={{...styles.messageRow, ...(isAi ? styles.aiRow : styles.userRow)}}>

                                    {isAi && <div style={styles.avatarContainer}><CuteBot size={32} /></div>}
                                    <div style={{
                                        ...styles.bubble,
                                        ...(isAi ? styles.aiBubble : styles.userBubble),
                                        ...(msg.type === "success" ? styles.successBubble : {}),
                                        ...(msg.type === "error" ? styles.errorBubble : {}),
                                        ...(msg.type === "data" ? styles.dataBubble : {}),
                                        ...(msg.type === "tutor" ? styles.tutorBubble : {})
                                    }}>
                                        <span style={{...styles.messageText, ...(isAi ? styles.aiText : styles.userText)}}>{msg.text}</span>
                                    </div>
                                    {!isAi && <div style={styles.avatarUser}><User size={14} color="white" /></div>}
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div style={styles.loadingContainer}>
                                <div className="spinner" style={styles.spinner}></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Section */}
                    <div style={styles.inputSection}>
                        <div style={styles.inputSectionInner}>
                            <div style={styles.modeIndicator}>
                                {mode === "learn" ? <GraduationCap size={12} color="#FBBF24" /> : <MessageCircle size={12} color="#64748b" />}
                                <span style={{...styles.modeText, color: mode === "learn" ? "#FBBF24" : "#94a3b8"}}>
                                    {mode === "learn" ? `📚 Learn Mode${activeTopic ? ` — ${TUTOR_TOPIC_UI[activeTopic]?.label}` : ""}` : "Chat + Voice Commands (Hindi / English / Hinglish)"}
                                </span>
                            </div>
                            <div style={styles.inputWrapper}>
                                <input
                                    type="text"
                                    style={styles.textInput}
                                    placeholder="Type a command or ask anything..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') handleSend(); }}
                                />
                                <button style={{...styles.voiceBtn, ...(isRecording ? styles.voiceBtnActive : {})}} onClick={handleVoicePress} disabled={isTranscribing || isLoading}>
                                    {isRecording ? <Square size={16} color="white" /> : <Mic size={16} color="rgba(255,255,255,0.6)" />}
                                </button>
                                <button style={{...styles.sendBtn, ...(!input.trim() || isLoading ? styles.sendBtnDisabled : {})}} onClick={handleSend} disabled={!input.trim() || isLoading}>
                                    <Send size={20} color={input.trim() && !isLoading ? "black" : "rgba(0,0,0,0.3)"} />
                                </button>
                            </div>
                            {transcript && (
                                <div style={styles.transcriptContainer}>
                                    <span style={styles.transcriptLabel}>Transcribed:</span>
                                    <span style={styles.transcriptText}>{transcript}</span>
                                </div>
                            )}
                            {isTranscribing && (
                                <div style={styles.recordingIndicator}>
                                    <span style={{...styles.recordingText, color: "#4ADE80"}}>Transcribing...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(74, 222, 128, 0.3);
                    border-radius: 50%;
                    border-top-color: #4ADE80;
                    animation: spin 1s ease-in-out infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: "transparent",
        position: "absolute",
        top: 0, bottom: 0, left: 0, right: 0,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
    },
    contentWrapper: {
        width: "100%", margin: "0 auto",
        flex: 1, display: "flex", flexDirection: "column",
        height: "100%", overflow: "hidden", position: "relative",
    },
    contentCentered: {
        width: "100%", maxWidth: "800px", margin: "0 auto",
        boxSizing: "border-box"
    },
    header: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: "calc(15px + env(safe-area-inset-top, 0px))",
        paddingBottom: "15px",
        paddingLeft: "20px",
        paddingRight: "20px",
        backgroundColor: "transparent",
        zIndex: 10,
    },
    headerTitleContainer: { display: "flex", alignItems: "center", gap: "10px" },
    backBtn: { background: "none", border: "none", padding: "5px", cursor: "pointer", display: "flex" },
    headerTitle: { color: "white", fontSize: "18px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "1px", marginLeft: "5px" },
    headerRight: { display: "flex", alignItems: "center", gap: "10px" },
    modeToggleBtn: {
        flexDirection: "row", alignItems: "center",
        padding: "6px 14px", borderRadius: "20px", display: "flex", gap: "6px", cursor: "pointer", border: "1px solid"
    },
    modeToggleText: { fontSize: "14px", fontWeight: "600" },
    examplesBtn: {
        width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(74,222,128,0.1)",
        display: "flex", justifyContent: "center", alignItems: "center",
        border: "1px solid rgba(74,222,128,0.2)", cursor: "pointer"
    },
    mainContainer: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    examplesPanel: { backgroundColor: "rgba(15,23,48,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px", zIndex: 5 },
    examplesPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
    examplesPanelTitle: { color: "#94a3b8", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
    closeBtn: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" },
    examplesScroll: { display: "flex", overflowX: "auto", gap: "8px", paddingBottom: "8px" },
    exampleChip: {
        backgroundColor: "rgba(74,222,128,0.08)", borderRadius: "10px", padding: "8px 12px",
        border: "1px solid rgba(74,222,128,0.15)", minWidth: "140px", cursor: "pointer", flexShrink: 0
    },
    exampleLabel: { display: "block", color: "#4ADE80", fontSize: "10px", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase" },
    exampleText: { display: "block", color: "rgba(255,255,255,0.7)", fontSize: "13px" },
    topicGrid: { padding: "15px", borderBottom: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" },
    topicGridHeader: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" },
    topicGridTitle: { color: "#FBBF24", fontSize: "14px", fontWeight: "600" },
    topicScrollList: { display: "flex", overflowX: "auto", gap: "10px", paddingBottom: "10px" },
    topicChip: {
        flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", gap: "8px",
        padding: "8px 16px", borderRadius: "12px", borderWidth: "1px", borderStyle: "solid", cursor: "pointer", whiteSpace: "nowrap"
    },
    topicChipText: { fontSize: "14px", fontWeight: "600" },
    activeTopicSection: { padding: "12px 15px", backgroundColor: "rgba(15,23,48,0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)" },
    activeTopicRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
    activeTopicLeft: { display: "flex", alignItems: "center", gap: "8px" },
    activeTopicText: { color: "white", fontSize: "15px", fontWeight: "bold" },
    activeTopicRight: { display: "flex", alignItems: "center", gap: "15px" },
    langToggleContainer: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "8px", display: "flex", overflow: "hidden" },
    langToggleBtn: { padding: "4px 10px", cursor: "pointer" },
    langToggleBtnActive: { backgroundColor: "#FBBF24" },
    langToggleBtnText: { color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "bold" },
    langToggleBtnTextActive: { color: "black" },
    changeTopicBtn: { color: "#94a3b8", fontSize: "12px", fontWeight: "600", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" },
    questionsScroll: { display: "flex", overflowX: "auto", gap: "8px", paddingBottom: "8px" },
    questionChip: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "8px 14px", border: "1px solid", cursor: "pointer", whiteSpace: "nowrap" },
    questionChipText: { fontSize: "13px", fontWeight: "500" },
    confirmCard: { margin: "15px", backgroundColor: "rgba(255,165,0,0.08)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,165,0,0.25)" },
    confirmHeader: { display: "flex", alignItems: "center", marginBottom: "12px", gap: "8px" },
    confirmTitle: { color: "#FFA500", fontSize: "14px", fontWeight: "700" },
    confirmTags: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" },
    tag: { padding: "5px 10px", borderRadius: "6px" },
    tagText: { color: "white", fontSize: "12px", fontWeight: "600" },
    tagAction: { backgroundColor: "rgba(74,222,128,0.25)" },
    tagModule: { backgroundColor: "rgba(59,130,246,0.25)" },
    tagUser: { backgroundColor: "rgba(168,85,247,0.25)" },
    tagAmount: { backgroundColor: "rgba(245,158,11,0.25)" },
    confirmActions: { display: "flex", gap: "12px" },
    confirmBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "rgba(74,222,128,0.15)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(74,222,128,0.3)", cursor: "pointer" },
    confirmBtnText: { color: "#4ADE80", fontSize: "15px", fontWeight: "700" },
    cancelBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "rgba(255,82,82,0.15)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,82,82,0.3)", cursor: "pointer" },
    cancelBtnText: { color: "#FF5252", fontSize: "15px", fontWeight: "700" },
    chatContainer: { flex: 1, overflowY: "auto", padding: "20px 0", display: "flex", flexDirection: "column" },
    messageRowWrapper: { width: "100%", display: "flex", justifyContent: "center", padding: "0 20px", boxSizing: "border-box" },
    messageRow: { display: "flex", alignItems: "flex-end", marginBottom: "20px", gap: "12px", width: "100%", maxWidth: "800px" },
    aiRow: { justifyContent: "flex-start" },
    userRow: { justifyContent: "flex-end" },
    avatarContainer: { width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "flex-end" },
    avatarUser: { width: "24px", height: "24px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", justifyContent: "center", alignItems: "center" },
    bubble: { padding: "12px 16px", borderRadius: "18px", maxWidth: "80%" },
    aiBubble: { backgroundColor: "rgba(255,255,255,0.08)", borderBottomLeftRadius: "4px" },
    userBubble: { backgroundColor: "#ffffff", borderBottomRightRadius: "4px" },
    successBubble: { backgroundColor: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" },
    errorBubble: { backgroundColor: "rgba(255,82,82,0.15)", border: "1px solid rgba(255,82,82,0.3)" },
    dataBubble: { backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" },
    tutorBubble: { backgroundColor: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" },
    messageText: { fontSize: "15px", lineHeight: "1.4", whiteSpace: "pre-wrap" },
    aiText: { color: "#ffffff" },
    userText: { color: "#000000", fontWeight: "500" },
    loadingContainer: { padding: "15px", display: "flex", justifyContent: "flex-start", marginLeft: "40px" },
    inputSection: { padding: "10px 16px 16px 16px", backgroundColor: "transparent", display: "flex", justifyContent: "center" },
    inputSectionInner: { width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column" },
    modeIndicator: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" },
    modeText: { fontSize: "11px", fontWeight: "600" },
    inputWrapper: { display: "flex", alignItems: "center", backgroundColor: "rgba(15, 20, 35, 0.85)", borderRadius: "28px", padding: "6px", border: "1px solid rgba(255,255,255,0.05)" },
    textInput: { flex: 1, backgroundColor: "transparent", border: "none", color: "white", padding: "10px 15px", fontSize: "15px", outline: "none" },
    voiceBtn: { width: "36px", height: "36px", borderRadius: "18px", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", justifyContent: "center", alignItems: "center", border: "none", cursor: "pointer", transition: "all 0.2s" },
    voiceBtnActive: { backgroundColor: "#FF5252", transform: "scale(1.1)" },
    sendBtn: { width: "36px", height: "36px", borderRadius: "18px", backgroundColor: "#4ADE80", display: "flex", justifyContent: "center", alignItems: "center", border: "none", marginLeft: "8px", cursor: "pointer" },
    sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.1)", cursor: "not-allowed" },
    transcriptContainer: { marginTop: "10px", padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px" },
    transcriptLabel: { color: "#94a3b8", fontSize: "10px", textTransform: "uppercase", fontWeight: "600", display: "block" },
    transcriptText: { color: "white", fontSize: "13px", marginTop: "4px", display: "block" },
    recordingIndicator: { display: "flex", alignItems: "center", justifyContent: "center", marginTop: "10px", gap: "8px" },
    recordingText: { color: "#FF5252", fontSize: "12px", fontWeight: "600" }
};
