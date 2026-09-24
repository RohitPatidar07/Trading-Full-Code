/**
 * Command Parser for Web App
 * Detects if user input is:
 *   1. Navigation command → navigate to screen
 *   2. Action command → parse + confirm + execute via backend
 *   3. General chat → send to AI chat
 */

const NAVIGATION_MAP = {
    watchlist: { screen: 'Watchlist', label: 'Watchlist' },
    dashboard: { screen: 'Watchlist', label: 'Dashboard / Watchlist' },
    market: { screen: 'Watchlist', label: 'Market Watch' },
    marketwatch: { screen: 'Watchlist', label: 'Market Watch' },
    trades: { screen: 'Trades', label: 'Trades' },
    trade: { screen: 'Trades', label: 'Trades' },
    portfolio: { screen: 'Portfolio', label: 'Portfolio' },
    account: { screen: 'Account', label: 'Account' },
    profile: { screen: 'Account', nested: 'ProfileDetails', label: 'Profile Details' },
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
    search: { screen: 'Watchlist', nested: 'Search', label: 'Search' },
    notifications: { screen: 'Watchlist', nested: 'Notifications', label: 'Notifications' },
    notification: { screen: 'Watchlist', nested: 'Notifications', label: 'Notifications' },
};

const HINDI_SCREEN_ALIASES = {
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
    'bazaar': 'watchlist', 'paisa': 'funds', 'paise': 'funds',
    'saude': 'trades', 'khata': 'account', 'jama': 'deposit',
    'nikasi': 'withdrawal', 'seekhna': 'learning', 'madad': 'help',
    'khoj': 'search',
};

const NAV_TRIGGERS = [
    'open', 'go to', 'goto', 'navigate to', 'take me to', 'show', 'show me',
    'switch to', 'move to', 'load',
    'kholo', 'khol do', 'khol de', 'dikhao', 'dikha do', 'le jao', 'le chalo',
    'chalo', 'jao', 'pe jao', 'par jao',
    'खोलो', 'खोल दो', 'दिखाओ', 'दिखा दो', 'ले जाओ', 'ले चलो', 'चलो', 'जाओ',
];

export const parseNavigation = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase().trim();
    let hasNavTrigger = NAV_TRIGGERS.some(t => lower.includes(t));
    const words = lower.split(/\s+/);

    const findScreen = (input) => {
        for (const [key, val] of Object.entries(NAVIGATION_MAP)) {
            if (input.includes(key)) return val;
        }
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
    if (operation === 'add' || operation === 'withdraw') {
        return 'funds';
    }
    if (operation === 'block' || operation === 'unblock') {
        return 'user';
    }
    return null;
};

export const parseCommand = (text) => {
    if (!text) return null;

    const operation = identifyOperation(text);
    if (!operation) return null;

    const module = inferModule(operation, text);
    if (!module) return null;

    const numbers = extractNumbers(text);
    const userId = extractUserId(text);
    
    let targetUserId = userId;
    let amount = null;

    if (module === 'funds') {
        amount = numbers.find(n => n !== userId);
        if (amount === undefined && numbers.length > 0) {
            amount = numbers[0];
        }
    }

    const name = extractName(text);

    return {
        operation,
        module,
        amount,
        targetUserId,
        name,
        raw: text
    };
};

export const formatCommandPreview = (parsed) => {
    if (!parsed) return '';
    const { operation, module, amount, targetUserId, name } = parsed;
    
    let actionStr = '';
    if (operation === 'add') actionStr = 'Add';
    else if (operation === 'withdraw') actionStr = 'Withdraw';
    else if (operation === 'delete') actionStr = 'Delete';
    else if (operation === 'update') actionStr = 'Update';
    else if (operation === 'block') actionStr = 'Block';
    else if (operation === 'unblock') actionStr = 'Unblock';
    else if (operation === 'create') actionStr = 'Create';
    
    let moduleStr = '';
    if (module === 'funds') moduleStr = `₹${amount || 'X'} funds`;
    else if (module === 'user') moduleStr = `User ${name || targetUserId || ''}`;
    else moduleStr = module;

    return `${actionStr} ${moduleStr} command detected.`;
};

export const COMMAND_EXAMPLES = [
    { text: 'open portfolio', desc: 'Go to portfolio screen' },
    { text: 'add 5000 funds to user 12', desc: 'Admin command to deposit money' },
    { text: 'block user amit', desc: 'Block a trader account' }
];
