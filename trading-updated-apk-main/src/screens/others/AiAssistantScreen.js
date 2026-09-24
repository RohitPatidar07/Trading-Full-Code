import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Animated,
    Easing,
    Alert,
    ActivityIndicator,
    Keyboard,
    useWindowDimensions,
    KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Send,
    User,
    Mic,
    Square,
    Zap,
    CheckCircle,
    XCircle,
    Terminal,
    MessageCircle,
    ChevronUp,
    GraduationCap,
    BookOpen,
    TrendingUp,
    BarChart3,
    Shield,
    Layers,
    Brain,
    Target,
    Gem,
    LineChart,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';
import CuteBot from '../../components/CuteBot';
import * as api from '../../services/api';
let ExpoAudio = null;
try {
    ExpoAudio = require('expo-audio');
} catch (e) {
    console.warn('expo-audio unavailable:', e);
}
import { parseCommand, parseNavigation, formatCommandPreview, COMMAND_EXAMPLES } from '../../services/commandParser';
import { CommonActions } from '@react-navigation/native';

// ─── Tutor Topic Config (icons + colors for UI) ─────────────────────────────
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

// ─── Example Questions per Topic ─────────────────────────────────────────────
const TUTOR_QUESTIONS = {
    basics: {
        hi: [
            'Trading kya hota hai?',
            'Share market kaise kaam karta hai?',
            'Demat account kya hai?',
            'Bull market aur bear market kya hota hai?',
            'Intraday aur delivery me kya farak hai?',
            'Sensex aur Nifty kya hai?',
            'IPO kya hota hai?',
            'Dividend kya hota hai?',
        ],
        en: [
            'What is trading?',
            'How does the stock market work?',
            'What is a Demat account?',
            'What is bull market and bear market?',
            'Difference between intraday and delivery?',
            'What are Sensex and Nifty?',
            'What is an IPO?',
            'What is a dividend?',
        ],
    },
    options: {
        hi: [
            'Options trading kya hota hai?',
            'Call aur Put me kya difference hai?',
            'Strike price kya hai?',
            'Premium kaise calculate hota hai?',
            'Options expiry kya hoti hai?',
            'In the money aur out of the money samjhao',
            'Option Greeks kya hote hain?',
            'Covered call strategy kya hai?',
        ],
        en: [
            'What is options trading?',
            'Difference between Call and Put?',
            'What is strike price?',
            'How is premium calculated?',
            'What is options expiry?',
            'Explain in the money and out of the money',
            'What are Option Greeks?',
            'What is covered call strategy?',
        ],
    },
    futures: {
        hi: [
            'Futures trading kya hai?',
            'Lot size kya hota hai explain karo',
            'Margin kya hota hai futures me?',
            'Expiry pe kya hota hai?',
            'Rollover kaise karte hain?',
            'Futures aur options me kya farak hai?',
            'Open interest kya hota hai?',
            'Futures me hedging kaise karein?',
        ],
        en: [
            'What is futures trading?',
            'What is lot size? Explain',
            'What is margin in futures?',
            'What happens on expiry?',
            'How to do rollover?',
            'Difference between futures and options?',
            'What is open interest?',
            'How to hedge using futures?',
        ],
    },
    technical: {
        hi: [
            'Candlestick chart kaise padhte hain?',
            'Support aur resistance kya hota hai?',
            'RSI indicator kya hai?',
            'Moving average kaise use karte hain?',
            'Head and shoulders pattern kya hai?',
            'MACD indicator samjhao',
            'Volume analysis kaise karein?',
            'Doji candle kya hoti hai?',
        ],
        en: [
            'How to read candlestick charts?',
            'What is support and resistance?',
            'What is RSI indicator?',
            'How to use moving averages?',
            'What is head and shoulders pattern?',
            'Explain MACD indicator',
            'How to do volume analysis?',
            'What is a Doji candle?',
        ],
    },
    risk: {
        hi: [
            'Stop loss kaise lagaye?',
            'Risk reward ratio kya hota hai?',
            'Position sizing kaise karein?',
            'Ek trade me kitna risk lena chahiye?',
            'Trailing stop loss kya hai?',
            'Capital preservation kya hai?',
            'Drawdown kya hota hai?',
            'Risk management rules btao',
        ],
        en: [
            'How to set a stop loss?',
            'What is risk reward ratio?',
            'How to do position sizing?',
            'How much risk per trade?',
            'What is trailing stop loss?',
            'What is capital preservation?',
            'What is drawdown?',
            'Explain risk management rules',
        ],
    },
    orders: {
        hi: [
            'Market order aur limit order me kya farak hai?',
            'Stop loss order kaise kaam karta hai?',
            'GTT order kya hota hai?',
            'Bracket order samjhao',
            'AMO order kya hai?',
            'Cover order kya hota hai?',
            'Limit order kab use karna chahiye?',
            'Trigger price kya hota hai?',
        ],
        en: [
            'Difference between market and limit order?',
            'How does stop loss order work?',
            'What is a GTT order?',
            'Explain bracket order',
            'What is an AMO order?',
            'What is a cover order?',
            'When to use limit order?',
            'What is trigger price?',
        ],
    },
    commodities: {
        hi: [
            'Gold me trading kaise karein?',
            'Crude oil ka lot size kitna hai?',
            'Silver me margin kitna lagta hai?',
            'Natural gas me trading kaise karein?',
            'MCX timing kya hai?',
            'Copper trading samjhao',
            'Commodity aur equity me farak kya hai?',
            'MCX me kaunse commodities trade hote hain?',
        ],
        en: [
            'How to trade in Gold?',
            'What is the lot size of Crude Oil?',
            'How much margin for Silver?',
            'How to trade Natural Gas?',
            'What are MCX trading hours?',
            'Explain Copper trading',
            'Difference between commodity and equity?',
            'Which commodities are traded on MCX?',
        ],
    },
    indices: {
        hi: [
            'Nifty 50 kya hai?',
            'Bank Nifty me trading kaise karein?',
            'Index options kaise kaam karte hain?',
            'Fin Nifty kya hai?',
            'Nifty aur Sensex me kya farak hai?',
            'Index futures kaise trade karein?',
            'Weekly expiry kya hoti hai?',
            'Midcap Nifty trading samjhao',
        ],
        en: [
            'What is Nifty 50?',
            'How to trade Bank Nifty?',
            'How do index options work?',
            'What is Fin Nifty?',
            'Difference between Nifty and Sensex?',
            'How to trade index futures?',
            'What is weekly expiry?',
            'Explain Midcap Nifty trading',
        ],
    },
    psychology: {
        hi: [
            'Loss hone pe kya karna chahiye?',
            'Fear aur greed ko kaise control karein?',
            'Overtrading kya hota hai?',
            'Trading me discipline kaise laye?',
            'Revenge trading kya hai?',
            'FOMO kya hota hai trading me?',
            'Trading journal kaise maintain karein?',
            'Patience kaise develop karein?',
        ],
        en: [
            'What to do after a loss?',
            'How to control fear and greed?',
            'What is overtrading?',
            'How to build discipline in trading?',
            'What is revenge trading?',
            'What is FOMO in trading?',
            'How to maintain a trading journal?',
            'How to develop patience?',
        ],
    },
    strategies: {
        hi: [
            'Scalping kya hota hai?',
            'Swing trading kaise karein?',
            'Intraday strategy btao',
            'Hedging kya hai?',
            'Positional trading kaise karte hain?',
            'Breakout trading strategy samjhao',
            'Gap up aur gap down trading kaise karein?',
            'Best strategy for beginners kya hai?',
        ],
        en: [
            'What is scalping?',
            'How to do swing trading?',
            'Explain intraday strategies',
            'What is hedging?',
            'How to do positional trading?',
            'Explain breakout trading strategy',
            'How to trade gap up and gap down?',
            'What is the best strategy for beginners?',
        ],
    },
};

const getResponsiveStyles = (screenWidth) => {
    const isSmallScreen = screenWidth < 375;
    const isMediumScreen = screenWidth < 412;

    return {
        headerPaddingH: isSmallScreen ? 12 : 15,
        headerTitleSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
        chatPaddingH: isSmallScreen ? 12 : 15,
        bubbleMaxWidth: isSmallScreen ? '80%' : '75%',
        messageTextSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 16,
        inputTextSize: isSmallScreen ? 14 : 16,
        exampleChipMinWidth: isSmallScreen ? 140 : 160,
        topicChipFontSize: isSmallScreen ? 10 : 11,
        exampleTextSize: isSmallScreen ? 12 : 13,
        confirmCardMargin: isSmallScreen ? 12 : 15,
        inputPaddingH: isSmallScreen ? 12 : 15,
    };
};

const AiAssistantScreen = ({ navigation }) => {
    const { width: screenWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isSmallScreen = screenWidth < 375;
    const isMediumScreen = screenWidth < 412;

    const [messages, setMessages] = useState([
        {
            id: '1',
            text: 'Hello! I am your AI Assistant !',
            sender: 'ai',
        },
    ]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [pendingCommand, setPendingCommand] = useState(null);
    const [showExamples, setShowExamples] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const recordingAnim = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const recordingRef = useRef(null);

    // ─── Learn Mode State ────────────────────────────────────────
    const [mode, setMode] = useState('chat'); // 'chat' | 'learn'
    const [activeTopic, setActiveTopic] = useState(null);
    const [tutorHistory, setTutorHistory] = useState([]);
    const [questionLang, setQuestionLang] = useState('hi'); // 'hi' | 'en'
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
        }).start();

        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardOpen(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardOpen(false)
        );

        return () => {
            showSub.remove();
            hideSub.remove();

            (async () => {
                if (recordingRef.current?.recorder) {
                    try {
                        await recordingRef.current.recorder.stop();
                    } catch (error) {
                        console.error('Error stopping recording on unmount:', error);
                    }
                }
            })();
        };
    }, []);

    // ─── Voice Recording ─────────────────────────────────────────
    const handleVoicePress = async () => {
        if (isRecording) {
            await stopRecordingAndTranscribe();
        } else {
            await startRecording();
        }
    };

    const startRecording = async () => {
        try {
            setIsRecording(true);

            if (!ExpoAudio) {
                Alert.alert(
                    'Voice Feature Unavailable',
                    'Voice recording requires a native build. Please type your query instead.'
                );
                setIsRecording(false);
                return;
            }

            // Request microphone permission
            const perm = await ExpoAudio.requestRecordingPermissionsAsync();

            if (!perm?.granted) {
                Alert.alert(
                    'Microphone Permission Denied',
                    'Microphone access is required for voice recording.\n\nPlease go to Settings > Permissions > Microphone and allow access.',
                    [
                        { text: 'Cancel', onPress: () => setIsRecording(false) },
                        { text: 'Try Again', onPress: startRecording },
                    ]
                );
                setIsRecording(false);
                return;
            }

            await ExpoAudio.setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            const AudioRecorderClass = ExpoAudio.AudioModule?.AudioRecorder;
            if (!AudioRecorderClass) {
                throw new Error('AudioRecorder native module not ready');
            }

            const recorder = new AudioRecorderClass(ExpoAudio.RecordingPresets.HIGH_QUALITY);
            await recorder.prepareToRecordAsync();
            recorder.record();
            recordingRef.current = { recorder, startTime: Date.now() };
            setTranscript('');
            animateRecording();
        } catch (error) {
            console.error('Recording error:', error);
            setIsRecording(false);

            Alert.alert('Recording Error', error.message || 'Failed to start recording', [
                { text: 'OK', onPress: () => {} },
                { text: 'Try Again', onPress: startRecording },
            ]);
        }
    };

    const stopRecordingAndTranscribe = async () => {
        try {
            setIsRecording(false);
            setIsTranscribing(true);

            const recItem = recordingRef.current;
            if (!recItem?.recorder) {
                setIsTranscribing(false);
                Alert.alert('No Recording', 'No audio was recorded. Please try again.');
                return;
            }
            const duration = Date.now() - recItem.startTime;
            if (duration < 500) {
                await recItem.recorder.stop();
                Alert.alert('Recording Too Short', 'Please record for at least 1 second and try again.');
                setIsTranscribing(false);
                recordingRef.current = null;
                return;
            }

            await recItem.recorder.stop();
            let rawUri = recItem.recorder.uri || (typeof recItem.recorder.getStatus === 'function' ? recItem.recorder.getStatus()?.url : null);
            recordingRef.current = null;

            if (!rawUri || typeof rawUri !== 'string') {
                throw new Error('Failed to obtain recording file URI');
            }

            // Ensure valid URI scheme (file://) for Android React Native FormData
            const fileUri = (Platform.OS === 'android' && !rawUri.startsWith('file://') && !rawUri.startsWith('content://'))
                ? `file://${rawUri}`
                : rawUri;

            const formData = new FormData();
            formData.append('audio', {
                uri: fileUri,
                type: 'audio/m4a',
                name: `recording_${Date.now()}.m4a`,
            });

            const data = await api.aiTranscribeVoice(formData);

            if (data.transcript) {
                setTranscript(data.transcript);
                // Auto-process the transcribed text
                processInput(data.transcript);
            } else {
                throw new Error(data.message || 'Failed to transcribe audio');
            }
        } catch (error) {
            console.error('Transcription error:', error);
            const errorMsg = error.message || 'Failed to transcribe audio';
            addMessage('ai', `❌ ${errorMsg}\n\nPlease try again or type your message.`);
        } finally {
            setIsTranscribing(false);
        }
    };

    const animateRecording = () => {
        recordingAnim.setValue(0);
        Animated.loop(
            Animated.timing(recordingAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.ease),
            })
        ).start();
    };

    // ─── Message Helpers ─────────────────────────────────────────
    const addMessage = (sender, text, extra = {}) => {
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString() + Math.random(), text, sender, ...extra },
        ]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    // ─── Core Processing ─────────────────────────────────────────
    const processInput = (text) => {
        if (!text || !text.trim()) return;

        const trimmed = text.trim();
        addMessage('user', trimmed);
        setInput('');
        setTranscript('');

        // If in Learn mode → route to tutor
        if (mode === 'learn') {
            sendToTutor(trimmed);
            return;
        }

        // 1. Check for navigation command
        const navTarget = parseNavigation(trimmed);
        if (navTarget) {
            handleNavigation(navTarget);
            return;
        }

        // 2. Try to parse as action command
        const parsed = parseCommand(trimmed);
        if (parsed) {
            setPendingCommand({ text: trimmed, parsed });
            return;
        }

        // 3. Not a command → send to AI chat
        sendToChat(trimmed);
    };

    // ─── Navigation Handler ──────────────────────────────────────
    const handleNavigation = (navTarget) => {
        addMessage('ai', `📍 Navigating to ${navTarget.label}...`, { type: 'success' });

        setTimeout(() => {
            if (navTarget.nested) {
                // Navigate to a tab first, then to nested screen
                navigation.dispatch(
                    CommonActions.navigate({
                        name: 'Main',
                        params: {
                            screen: navTarget.screen,
                            params: { screen: navTarget.nested },
                        },
                    })
                );
            } else {
                // Navigate to a tab screen
                navigation.dispatch(
                    CommonActions.navigate({
                        name: 'Main',
                        params: { screen: navTarget.screen },
                    })
                );
            }
        }, 500);
    };

    const handleSend = () => {
        Keyboard.dismiss();
        processInput(input);
    };

    // ─── AI Chat (general conversation) ──────────────────────────
    const sendToChat = async (message) => {
        setIsLoading(true);
        try {
            const data = await api.aiChat(message);
            if (data.success && data.message) {
                addMessage('ai', data.message);
            } else {
                addMessage('ai', data.message || 'Sorry, I could not understand. Please try again.');
            }
        } catch (err) {
            console.error('AI Chat Error:', err);
            addMessage('ai', 'Sorry, could not connect to AI service. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Tutor Chat (educational) ───────────────────────────────
    const sendToTutor = async (message, topic = null) => {
        setIsLoading(true);
        try {
            const data = await api.aiTutor(message, topic || activeTopic, tutorHistory);
            if (data.success && data.message) {
                addMessage('ai', data.message, { type: 'tutor' });

                // Track experience level
                if (data.experienceLevel) setExperienceLevel(data.experienceLevel);
                if (data.detectedTopic && !activeTopic) setActiveTopic(data.detectedTopic);

                // Update conversation history for multi-turn
                setTutorHistory(prev => [
                    ...prev,
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.message },
                ].slice(-10)); // keep last 5 exchanges
            } else {
                addMessage('ai', data.message || 'Sorry, could not get a response. Try again.');
            }
        } catch (err) {
            console.error('Tutor Error:', err);
            addMessage('ai', 'Sorry, could not connect to tutor. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Switch to Learn mode with a topic ──────────────────────
    const startTopic = (topicId) => {
        setActiveTopic(topicId);
        setTutorHistory([]);
    };

    const switchToLearn = () => {
        setMode('learn');
        setActiveTopic(null);
        setTutorHistory([]);
    };

    const switchToChat = () => {
        setMode('chat');
        setActiveTopic(null);
        setTutorHistory([]);
    };

    // ─── Command Execution ───────────────────────────────────────
    const executeCommand = async () => {
        if (!pendingCommand) return;

        const { text, parsed } = pendingCommand;
        setPendingCommand(null);
        setIsLoading(true);

        addMessage('ai', `⏳ Executing: ${formatCommandPreview(parsed)}`, { type: 'status' });

        try {
            const result = await api.aiSmartCommand(text);

            if (result.success) {
                const responseText = result.message || 'Command executed successfully!';
                addMessage('ai', `✅ ${responseText}`, { type: 'success' });

                // Show data if returned
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                    const preview = result.data.slice(0, 5).map((item) => {
                        const keys = Object.keys(item).slice(0, 4);
                        return keys.map(k => `${k}: ${item[k]}`).join(' | ');
                    }).join('\n');
                    addMessage('ai', `📊 Results:\n${preview}${result.data.length > 5 ? `\n... and ${result.data.length - 5} more` : ''}`, { type: 'data' });
                }
            } else {
                addMessage('ai', `❌ ${result.message || 'Command failed. Please try again.'}`, { type: 'error' });
            }
        } catch (err) {
            console.error('Command execution error:', err);
            addMessage('ai', `❌ Error: ${err.message || 'Failed to execute command.'}`, { type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const cancelCommand = () => {
        setPendingCommand(null);
        addMessage('ai', 'Command cancelled. You can try again or ask me something else.');
    };

    // ─── Use Example Command ─────────────────────────────────────
    const useExample = (text) => {
        setShowExamples(false);
        setInput(text);
    };

    // ─── Message Bubble ──────────────────────────────────────────
    const MessageBubble = ({ item, screenWidth }) => {
        const isAi = item.sender === 'ai';
        const msgResponsiveStyles = getResponsiveStyles(screenWidth);
        const isSmallScreen = screenWidth < 375;
        return (
            <View style={[styles.messageRow, isAi ? styles.aiRow : styles.userRow]}>
                {isAi && (
                    <View style={styles.avatarContainer}>
                        <CuteBot size={isSmallScreen ? 32 : 40} />
                    </View>
                )}
                <View style={[
                    styles.bubble,
                    isAi ? styles.aiBubble : styles.userBubble,
                    item.type === 'success' && styles.successBubble,
                    item.type === 'error' && styles.errorBubble,
                    item.type === 'data' && styles.dataBubble,
                    item.type === 'tutor' && styles.tutorBubble,
                    { maxWidth: msgResponsiveStyles.bubbleMaxWidth }
                ]}>
                    <Text style={[styles.messageText, isAi ? styles.aiText : styles.userText, { fontSize: msgResponsiveStyles.messageTextSize }]}>
                        {item.text}
                    </Text>
                </View>
                {!isAi && (
                    <View style={styles.avatarUser}>
                        <User size={isSmallScreen ? 14 : 16} color="white" />
                    </View>
                )}
            </View>
        );
    };

    // ─── Topic Grid (Learn Mode) ────────────────────────────────
    const TopicGrid = () => (
        <View style={styles.topicGrid}>
            <View style={styles.topicGridHeader}>
                <GraduationCap size={16} color="#FBBF24" />
                <Text style={styles.topicGridTitle}>Choose a Topic</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicScrollList}>
                {Object.entries(TUTOR_TOPIC_UI).map(([key, topic]) => {
                    const IconComp = topic.icon;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.topicChip, { borderColor: topic.color + '40' }]}
                            onPress={() => startTopic(key)}
                        >
                            <IconComp size={14} color={topic.color} />
                            <Text style={[styles.topicChipText, { color: topic.color }]}>{topic.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    // ─── Confirmation Card ───────────────────────────────────────
    const CommandConfirmation = () => {
        if (!pendingCommand) return null;
        const { parsed } = pendingCommand;
        return (
            <View style={[styles.confirmCard, { margin: responsiveStyles.confirmCardMargin }]}>
                <View style={styles.confirmHeader}>
                    <Zap size={16} color="#FFA500" />
                    <Text style={styles.confirmTitle}>Command Detected</Text>
                </View>

                <View style={styles.confirmTags}>
                    <View style={[styles.tag, styles.tagAction]}>
                        <Text style={styles.tagText}>{parsed.operation.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.tag, styles.tagModule]}>
                        <Text style={styles.tagText}>{parsed.module.toUpperCase()}</Text>
                    </View>
                    {parsed.data.userId && (
                        <View style={[styles.tag, styles.tagUser]}>
                            <Text style={styles.tagText}>User: {parsed.data.userId}</Text>
                        </View>
                    )}
                    {parsed.data.amount && (
                        <View style={[styles.tag, styles.tagAmount]}>
                            <Text style={styles.tagText}>₹{parsed.data.amount.toLocaleString()}</Text>
                        </View>
                    )}
                    {parsed.data.name && (
                        <View style={[styles.tag, styles.tagUser]}>
                            <Text style={styles.tagText}>{parsed.data.name}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.confirmActions}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={executeCommand}>
                        <CheckCircle size={18} color="#4ADE80" />
                        <Text style={styles.confirmBtnText}>Execute</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={cancelCommand}>
                        <XCircle size={18} color="#FF5252" />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const responsiveStyles = getResponsiveStyles(screenWidth);

    return (
        <ScreenWrapper>
            <ScreenHeader 
                title={mode === 'learn' ? 'AI Tutor' : 'AI Assistant'}
                showBackButton
                leftComponent={
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                        <CuteBot size={isSmallScreen ? 24 : 28} />
                    </View>
                }
                rightComponent={
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}>
                        <TouchableOpacity
                            onPress={mode === 'chat' ? switchToLearn : switchToChat}
                            style={[styles.modeToggleBtn, mode === 'learn' && styles.modeToggleBtnActive]}
                        >
                            {mode === 'chat' ? (
                                <GraduationCap size={18} color="#FBBF24" />
                            ) : (
                                <MessageCircle size={18} color="#4ADE80" />
                            )}
                            <Text 
                                style={[styles.modeToggleText, mode === 'learn' && { color: '#FBBF24' }]}
                                numberOfLines={1}
                            >
                                {mode === 'chat' ? 'Learn' : 'Chat'}
                            </Text>
                        </TouchableOpacity>
                        {mode === 'chat' && (
                            <TouchableOpacity onPress={() => setShowExamples(!showExamples)} style={[styles.examplesBtn, { marginLeft: 10 }]}>
                                <Terminal size={20} color="#4ADE80" />
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
                {/* Command Examples Panel */}
                {showExamples && (
                    <View style={styles.examplesPanel}>
                        <View style={styles.examplesPanelHeader}>
                            <Text style={styles.examplesPanelTitle}>Voice Command Examples</Text>
                            <TouchableOpacity onPress={() => setShowExamples(false)}>
                                <ChevronUp size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examplesScroll}>
                            {COMMAND_EXAMPLES.map((ex, i) => (
                                <TouchableOpacity key={i} style={styles.exampleChip} onPress={() => useExample(ex.text)}>
                                    <Text style={styles.exampleLabel}>{ex.label}</Text>
                                    <Text style={styles.exampleText}>{ex.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Topic Grid (Learn Mode - when no topic selected yet) */}
                {mode === 'learn' && !activeTopic && <TopicGrid />}

                {/* Active Topic: compact bar + lang toggle + questions */}
                {mode === 'learn' && activeTopic && (
                    <View style={styles.activeTopicSection}>
                        {/* Row 1: Topic name + lang toggle + change btn */}
                        <View style={styles.activeTopicRow}>
                            <View style={styles.activeTopicLeft}>
                                {(() => {
                                    const IconComp = TUTOR_TOPIC_UI[activeTopic]?.icon || BookOpen;
                                    const color = TUTOR_TOPIC_UI[activeTopic]?.color || '#FBBF24';
                                    return <IconComp size={14} color={color} />;
                                })()}
                                <Text style={styles.activeTopicText}>
                                    {TUTOR_TOPIC_UI[activeTopic]?.label || 'Learning'}
                                </Text>
                            </View>
                            <View style={styles.activeTopicRight}>
                                {/* Language Toggle inline */}
                                <View style={styles.langToggleContainer}>
                                    <TouchableOpacity
                                        style={[styles.langToggleBtn, questionLang === 'hi' && styles.langToggleBtnActive]}
                                        onPress={() => setQuestionLang('hi')}
                                    >
                                        <Text style={[styles.langToggleBtnText, questionLang === 'hi' && styles.langToggleBtnTextActive]}>हि</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.langToggleBtn, questionLang === 'en' && styles.langToggleBtnActive]}
                                        onPress={() => setQuestionLang('en')}
                                    >
                                        <Text style={[styles.langToggleBtnText, questionLang === 'en' && styles.langToggleBtnTextActive]}>En</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => { setActiveTopic(null); setTutorHistory([]); }}>
                                    <Text style={styles.changeTopicBtn}>Change</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* Row 2: Questions horizontal scroll */}
                        {TUTOR_QUESTIONS[activeTopic] && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.questionsScroll}
                            >
                                {(TUTOR_QUESTIONS[activeTopic][questionLang] || []).map((q, idx) => (
                                    <TouchableOpacity
                                        key={`${questionLang}-${idx}`}
                                        style={[styles.questionChip, { borderColor: (TUTOR_TOPIC_UI[activeTopic]?.color || '#FBBF24') + '40' }]}
                                        onPress={() => processInput(q)}
                                        disabled={isLoading}
                                    >
                                        <Text style={[styles.questionChipText, { color: TUTOR_TOPIC_UI[activeTopic]?.color || '#FBBF24' }]}>
                                            {q}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* Command Confirmation */}
                <CommandConfirmation />

                {/* Chat Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.chatContainer, { paddingBottom: 20, paddingHorizontal: responsiveStyles.chatPaddingH }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} item={msg} screenWidth={screenWidth} />
                    ))}
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4ADE80" />
                        </View>
                    )}
                </ScrollView>

                <View style={[
                    styles.inputSection,
                    {
                        paddingHorizontal: responsiveStyles.inputPaddingH,
                        paddingBottom: Math.max(insets.bottom, 10),
                    }
                ]}>
                    {/* Mode indicator */}
                    <View style={styles.modeIndicator}>
                        {mode === 'learn' ? (
                            <GraduationCap size={isSmallScreen ? 10 : 12} color="#FBBF24" />
                        ) : (
                            <MessageCircle size={isSmallScreen ? 10 : 12} color="#64748b" />
                        )}
                        <Text style={[styles.modeText, mode === 'learn' && { color: '#FBBF24' }, { fontSize: isSmallScreen ? 9 : 11 }]}>
                            {mode === 'learn'
                                ? `📚 Learn Mode${activeTopic ? ` — ${TUTOR_TOPIC_UI[activeTopic]?.label}` : ''} (Hindi / English / Hinglish)`
                                : 'Chat + Voice Commands (Hindi / English / Hinglish)'}
                        </Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.textInput, { fontSize: responsiveStyles.inputTextSize }]}
                            placeholder="Type a command or ask anything..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={input}
                            onChangeText={setInput}
                            multiline
                            onSubmitEditing={handleSend}
                        />

                        {/* Voice Button */}
                        <TouchableOpacity
                            style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
                            onPress={handleVoicePress}
                            disabled={isTranscribing || isLoading}
                        >
                            <Animated.View
                                style={{
                                    opacity: isRecording ? recordingAnim : 1,
                                    transform: [
                                        {
                                            scale: isRecording
                                                ? recordingAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [1, 1.2],
                                                    })
                                                : 1,
                                        },
                                    ],
                                }}
                            >
                                {isRecording ? (
                                    <Square size={16} color="white" />
                                ) : (
                                    <Mic size={16} color="rgba(255,255,255,0.6)" />
                                )}
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Send Button */}
                        <TouchableOpacity
                            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            <Send size={20} color={input.trim() && !isLoading ? 'black' : 'rgba(0,0,0,0.3)'} />
                        </TouchableOpacity>
                    </View>

                    {/* Transcript Display */}
                    {transcript ? (
                        <View style={styles.transcriptContainer}>
                            <Text style={styles.transcriptLabel}>Transcribed:</Text>
                            <Text style={styles.transcriptText}>{transcript}</Text>
                        </View>
                    ) : null}

                    {/* Recording indicator */}
                    {isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>Recording... Tap stop when done</Text>
                        </View>
                    )}

                    {/* Transcribing indicator */}
                    {isTranscribing && (
                        <View style={styles.recordingIndicator}>
                            <ActivityIndicator size="small" color="#4ADE80" />
                            <Text style={[styles.recordingText, { color: '#4ADE80' }]}>Transcribing...</Text>
                        </View>
                    )}
                </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    backBtn: { padding: 5 },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    examplesBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74,222,128,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74,222,128,0.2)',
    },
    mainContainer: { flex: 1, marginBottom: 0 },

    // ─── Examples Panel ──────────────────────────────────────
    examplesPanel: {
        backgroundColor: 'rgba(15,23,48,0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    examplesPanelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    examplesPanelTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    examplesScroll: { paddingRight: 15 },
    exampleChip: {
        backgroundColor: 'rgba(74,222,128,0.08)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(74,222,128,0.15)',
        minWidth: 140,
    },
    exampleLabel: { color: '#4ADE80', fontSize: 9, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
    exampleText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

    // ─── Confirmation Card ───────────────────────────────────
    confirmCard: {
        margin: 15,
        backgroundColor: 'rgba(255,165,0,0.08)',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,165,0,0.25)',
    },
    confirmHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    confirmTitle: { color: '#FFA500', fontSize: 14, fontWeight: '700', marginLeft: 8 },
    confirmTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    tagText: { color: 'white', fontSize: 12, fontWeight: '600' },
    tagAction: { backgroundColor: 'rgba(74,222,128,0.25)' },
    tagModule: { backgroundColor: 'rgba(59,130,246,0.25)' },
    tagUser: { backgroundColor: 'rgba(168,85,247,0.25)' },
    tagAmount: { backgroundColor: 'rgba(245,158,11,0.25)' },
    confirmActions: { flexDirection: 'row', gap: 12 },
    confirmBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(74,222,128,0.15)',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(74,222,128,0.3)',
    },
    confirmBtnText: { color: '#4ADE80', fontWeight: '700', fontSize: 15.5 },
    cancelBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,82,82,0.1)',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,82,82,0.2)',
    },
    cancelBtnText: { color: '#FF5252', fontWeight: '700', fontSize: 15.5 },

    // ─── Chat ────────────────────────────────────────────────
    chatContainer: { paddingHorizontal: 15, paddingVertical: 20 },
    messageRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },
    userRow: { justifyContent: 'flex-end' },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        overflow: 'hidden',
    },
    avatarUser: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#CFD1C4',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    bubble: { maxWidth: '75%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 20 },
    aiBubble: { backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4 },
    userBubble: { backgroundColor: '#CFD1C4', borderBottomRightRadius: 4 },
    successBubble: { backgroundColor: 'rgba(74,222,128,0.12)', borderLeftWidth: 3, borderLeftColor: '#4ADE80' },
    errorBubble: { backgroundColor: 'rgba(255,82,82,0.12)', borderLeftWidth: 3, borderLeftColor: '#FF5252' },
    dataBubble: { backgroundColor: 'rgba(59,130,246,0.1)', borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
    messageText: { fontSize: 17.5, lineHeight: 24 },
    aiText: { color: 'white' },
    userText: { color: 'black', fontWeight: '500' },

    // ─── Input Section ───────────────────────────────────────
    inputSection: {
        paddingHorizontal: 15,
        paddingTop: 8,
        paddingBottom: 4,
        backgroundColor: 'transparent',
    },
    modeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        gap: 6,
    },
    modeText: { color: '#64748b', fontSize: 12.5, textAlign: 'center' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    textInput: {
        flex: 1,
        color: 'white',
        fontSize: 17.5,
        maxHeight: 100,
        paddingTop: Platform.OS === 'ios' ? 10 : 5,
        paddingBottom: Platform.OS === 'ios' ? 10 : 5,
    },
    voiceBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    voiceBtnActive: { backgroundColor: '#FF5252', borderColor: '#FF6B6B' },
    sendBtn: {
        backgroundColor: '#CFD1C4',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    sendBtnDisabled: { opacity: 0.4 },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
        gap: 8,
    },
    recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5252' },
    recordingText: { color: '#FF5252', fontSize: 13.5, fontWeight: '600' },
    tutorBubble: { backgroundColor: 'rgba(251,191,36,0.10)', borderLeftWidth: 3, borderLeftColor: '#FBBF24' },
    loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
    transcriptContainer: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#4ADE80',
    },
    transcriptLabel: { color: '#4ADE80', fontSize: 12.5, fontWeight: '600', marginBottom: 4 },
    transcriptText: { color: 'rgba(255,255,255,0.8)', fontSize: 15.5 },

    // ─── Header Right / Mode Toggle ─────────────────────────
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modeToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251,191,36,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 5,
        borderWidth: 1,
        borderColor: 'rgba(251,191,36,0.2)',
    },
    modeToggleBtnActive: {
        backgroundColor: 'rgba(74,222,128,0.1)',
        borderColor: 'rgba(74,222,128,0.2)',
    },
    modeToggleText: { color: '#FBBF24', fontSize: 13.5, fontWeight: '700' },

    // ─── Topic Grid (compact horizontal) ────────────────────
    topicGrid: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    topicGridHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 15,
        marginBottom: 8,
    },
    topicGridTitle: { color: '#FBBF24', fontSize: 14.5, fontWeight: '700' },
    topicScrollList: { paddingHorizontal: 15 },
    topicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 6,
        gap: 5,
        borderWidth: 1,
    },
    topicChipText: { fontSize: 11.5, fontWeight: '600' },

    // ─── Active Topic Section (compact) ─────────────────────
    activeTopicSection: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        paddingBottom: 6,
    },
    activeTopicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 6,
    },
    activeTopicLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    activeTopicRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    activeTopicText: { color: '#FBBF24', fontSize: 14.5, fontWeight: '600' },
    changeTopicBtn: { color: 'rgba(255,255,255,0.4)', fontSize: 12.5, fontWeight: '600' },

    // ─── Language Toggle (inline compact) ────────────────────
    langToggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 2,
    },
    langToggleBtn: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    langToggleBtnActive: {
        backgroundColor: 'rgba(251,191,36,0.2)',
    },
    langToggleBtnText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12.5,
        fontWeight: '600',
    },
    langToggleBtnTextActive: {
        color: '#FBBF24',
    },

    // ─── Question Chips ─────────────────────────────────────
    questionsScroll: {
        paddingHorizontal: 12,
        paddingTop: 3,
        paddingBottom: 3,
    },
    questionChip: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        paddingHorizontal: 9,
        paddingVertical: 5,
        marginRight: 6,
        borderWidth: 1,
    },
    questionChipText: {
        fontSize: 11.5,
        fontWeight: '500',
    },
});

export default AiAssistantScreen;
