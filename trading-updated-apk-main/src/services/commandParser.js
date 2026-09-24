/**
 * Command Parser for Mobile App
 * Detects if user input is:
 *   1. Navigation command → navigate to screen
 *   2. Action command → parse + confirm + execute via backend
 *   3. General chat → send to AI chat
 */

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION MAPPINGS
// ═══════════════════════════════════════════════════════════════════

const NAVIGATION_MAP = {
    // Tab screens
    watchlist: { screen: 'Watchlist', label: 'Watchlist' },
    dashboard: { screen: 'Watchlist', label: 'Dashboard / Watchlist' },
    market: { screen: 'Watchlist', label: 'Market Watch' },
    marketwatch: { screen: 'Watchlist', label: 'Market Watch' },
    trades: { screen: 'Trades', label: 'Trades' },
    trade: { screen: 'Trades', label: 'Trades' },
    portfolio: { screen: 'Portfolio', label: 'Portfolio' },
    account: { screen: 'Account', label: 'Account' },
    profile: { screen: 'Account', nested: 'ProfileDetails', label: 'Profile Details' },

    // Account sub-screens
    funds: { screen: 'Account', nested: 'Funds', label: 'Funds' },
    deposit: { screen: 'Account', nested: 'DepositRequest', label: 'Deposit Request' },
    withdrawal: { screen: 'Account', nested: 'WithdrawalRequest', label: 'Withdrawal Request' },
    withdraw: { screen: 'Account', nested: 'WithdrawalRequest', label: 'Withdrawal Request' },
    password: { screen: 'Account', nested: 'ChangePassword', label: 'Change Password' },
    calendar: { screen: 'Account', nested: 'EconomicCalendar', label: 'Economic Calendar' },
    learning: { screen: 'Account', nested: 'Learning', label: 'Learning Module' },
    alerts: { screen: 'Account', nested: 'Alerts', label: 'Price Alerts' },
    alert: { screen: 'Account', nested: 'Alerts', label: 'Price Alerts' },
    support: { screen: 'Account', nested: 'Support', label: 'Support' },
    help: { screen: 'Account', nested: 'Support', label: 'Support' },

    // Watchlist sub-screens
    search: { screen: 'Watchlist', nested: 'Search', label: 'Search' },
    notifications: { screen: 'Watchlist', nested: 'Notifications', label: 'Notifications' },
    notification: { screen: 'Watchlist', nested: 'Notifications', label: 'Notifications' },
};

// Hindi/Hinglish aliases → map to English key
const HINDI_SCREEN_ALIASES = {
    // Hindi
    'बाजार': 'watchlist', 'वॉचलिस्ट': 'watchlist', 'डैशबोर्ड': 'dashboard',
    'ट्रेड': 'trades', 'सौदे': 'trades', 'पोर्टफोलियो': 'portfolio',
    'खाता': 'account', 'अकाउंट': 'account', 'प्रोफाइल': 'profile',
    'पैसे': 'funds', 'फंड': 'funds', 'बैलेंस': 'funds',
    'जमा': 'deposit', 'डिपॉजिट': 'deposit',
    'निकासी': 'withdrawal', 'विड्रॉल': 'withdrawal',
    'पासवर्ड': 'password', 'कैलेंडर': 'calendar',
    'सीखना': 'learning', 'लर्निंग': 'learning',
    'अलर्ट': 'alerts', 'सपोर्ट': 'support', 'मदद': 'help',
    'सर्च': 'search', 'खोज': 'search', 'नोटिफिकेशन': 'notifications',
    // Hinglish
    'bazaar': 'watchlist', 'paisa': 'funds', 'paise': 'funds',
    'saude': 'trades', 'khata': 'account', 'jama': 'deposit',
    'nikasi': 'withdrawal', 'seekhna': 'learning', 'madad': 'help',
    'khoj': 'search',
};

const NAV_TRIGGERS = [
    // English
    'open', 'go to', 'goto', 'navigate to', 'take me to', 'show', 'show me',
    'switch to', 'move to', 'load',
    // Hindi/Hinglish
    'kholo', 'khol do', 'khol de', 'dikhao', 'dikha do', 'le jao', 'le chalo',
    'chalo', 'jao', 'pe jao', 'par jao',
    // Hindi script
    'खोलो', 'खोल दो', 'दिखाओ', 'दिखा दो', 'ले जाओ', 'ले चलो', 'चलो', 'जाओ',
];

/**
 * Detect navigation intent from text
 * Returns { screen, nested, label } or null
 */
export const parseNavigation = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase().trim();

    // Check if text contains a navigation trigger
    let hasNavTrigger = NAV_TRIGGERS.some(t => lower.includes(t));

    // Also match direct screen names without trigger (e.g., just "trades", "portfolio")
    // but only for single-word or very short inputs
    const words = lower.split(/\s+/);

    // Try to find a screen match
    const findScreen = (input) => {
        // Direct English match
        for (const [key, val] of Object.entries(NAVIGATION_MAP)) {
            if (input.includes(key)) return val;
        }
        // Hindi alias match
        for (const [alias, key] of Object.entries(HINDI_SCREEN_ALIASES)) {
            if (input.includes(alias)) return NAVIGATION_MAP[key];
        }
        return null;
    };

    const match = findScreen(lower);

    if (match && (hasNavTrigger || words.length <= 3)) {
        return match;
    }

    return null;
};

// ═══════════════════════════════════════════════════════════════════
// ACTION COMMAND PARSING (funds, user management, etc.)
// ═══════════════════════════════════════════════════════════════════

const OPERATION_KEYWORDS = {
    add: ['add', 'karo', 'kr de', 'kr dena', 'dalo', 'lagao', 'deposit', 'jama'],
    withdraw: ['hatao', 'nikalo', 'withdraw', 'nikal le', 'nikal de', 'remove'],
    delete: ['delete', 'hata de', 'mitao', 'remove', 'uda do'],
    update: ['update', 'badlo', 'change', 'modify', 'sudharo'],
    block: ['block', 'band karo', 'disable', 'band kr de', 'lock', 'suspend'],
    unblock: ['unblock', 'enable', 'activate', 'khol de'],
    assign: ['assign', 'dedo', 'allocate', 'dena'],
    create: ['create', 'banao', 'naya', 'new', 'banadena'],
};

const MODULE_KEYWORDS = {
    funds: ['fund', 'paise', 'money', 'amount', 'balance', 'wallet', 'paisa'],
    user: ['user', 'client', 'trader', 'person', 'member'],
    admin: ['admin', 'administrator'],
    broker: ['broker', 'dalal'],
    trade: ['trade', 'deal', 'order', 'position'],
    request: ['request', 'application'],
    settings: ['settings', 'configuration', 'config'],
};

const extractNumbers = (text) => {
    const numbers = [];
    const directMatches = text.match(/\b\d+(?:,\d{3})*\b/g);
    if (directMatches) {
        directMatches.forEach(num => numbers.push(parseInt(num.replace(/,/g, ''))));
    }
    const wordNumbers = {
        'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
        'cha': 6, 'sat': 7, 'aath': 8, 'nau': 9, 'das': 10,
        'bees': 20, 'tees': 30, 'chalees': 40, 'pachas': 50,
        'hazaar': 1000, 'lakh': 100000, 'crore': 10000000,
    };
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
        if (wordNumbers[words[i]] && wordNumbers[words[i + 1]]) {
            numbers.push(wordNumbers[words[i]] * wordNumbers[words[i + 1]]);
        }
    }
    return numbers;
};

const extractUserId = (text) => {
    const patterns = [
        /ID\s*#?(\d+)/i, /user\s+(\d+)/i, /id\s+(\d+)/i,
        /(\d+)\s+(?:ko|ke|me)/i, /userid\s*[:=]?\s*(\d+)/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return parseInt(match[1]);
    }
    return null;
};

const extractName = (text) => {
    const cleaned = text
        .replace(/\b(new|naya|admin|user|broker|trader|banao|create)\b/gi, '')
        .replace(/\b(ko|ke|me|se|ne|ka|ki)\b/gi, '')
        .trim();
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    return words.length > 0 ? words[0] : null;
};

const identifyOperation = (text) => {
    const lowerText = text.toLowerCase();
    for (const [operation, keywords] of Object.entries(OPERATION_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) return operation;
        }
    }
    return null;
};

const identifyModule = (text) => {
    const lowerText = text.toLowerCase();
    for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) return module;
        }
    }
    return null;
};

const inferModule = (operation, text) => {
    const explicit = identifyModule(text);
    if (explicit) return explicit;
    const lowerText = text.toLowerCase();
    if (['add', 'withdraw'].includes(operation)) return 'funds';
    if (['block', 'unblock', 'delete', 'create'].includes(operation) && !lowerText.includes('admin')) return 'user';
    if (['block', 'unblock', 'delete', 'create'].includes(operation) && lowerText.includes('admin')) return 'admin';
    if (lowerText.includes('broker')) return 'broker';
    return null;
};

export const parseCommand = (command) => {
    if (!command || typeof command !== 'string') return null;
    const text = command.trim();
    const operation = identifyOperation(text);
    if (!operation) return null;
    let module = inferModule(operation, text);
    if (!module) return null;

    const data = {};
    const userId = extractUserId(text);
    const numbers = extractNumbers(text);
    const name = extractName(text);

    switch (module) {
        case 'funds':
            if (userId !== null) data.userId = userId;
            if (numbers.length > 0) data.amount = numbers[0];
            break;
        case 'user': case 'admin': case 'broker':
            if (userId !== null) data.userId = userId;
            if (name) data.name = name;
            break;
        case 'trade':
            if (userId !== null) data.userId = userId;
            if (numbers.length > 0) data.tradeId = numbers[0];
            break;
        default:
            if (userId !== null) data.userId = userId;
            if (name) data.name = name;
            if (numbers.length > 0) data.amount = numbers[0];
    }
    return { module, operation, data };
};

export const formatCommandPreview = (parsed) => {
    if (!parsed) return null;
    const { module, operation, data } = parsed;
    const parts = [`${operation.toUpperCase()}`];
    if (data.amount) parts.push(`₹${data.amount.toLocaleString()}`);
    if (data.userId) parts.push(`User ID: ${data.userId}`);
    if (data.name) parts.push(`Name: ${data.name}`);
    parts.push(`[${module.toUpperCase()}]`);
    return parts.join(' • ');
};

export const COMMAND_EXAMPLES = [
    { label: '📍 Navigate', text: 'open trades' },
    { label: '📍 Navigate Hindi', text: 'portfolio dikhao' },
    { label: '💰 Add Fund', text: 'ID 16 me 5000 add karo' },
    { label: '💸 Withdraw', text: 'ID 16 se 3000 nikalo' },
    { label: '🚫 Block User', text: 'user 20 ko block karo' },
    { label: '✅ Unblock', text: 'user 20 unblock karo' },
    { label: '👤 Create Admin', text: 'new admin banao Rahul' },
    { label: '💬 Ask AI', text: 'what is stock market?' },
];
