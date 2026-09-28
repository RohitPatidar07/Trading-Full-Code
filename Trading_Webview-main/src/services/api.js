import { BASE_URL } from '../constants/Config';

// Initialize session from localStorage if present
let userSession = {
    token: localStorage.getItem('vtrkm_token') || null,
    user: (() => {
        try {
            const saved = localStorage.getItem('vtrkm_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    })()
};

export const setSession = (token, user) => {
    userSession.token = token;
    userSession.user = user;
    if (token) {
        localStorage.setItem('vtrkm_token', token);
    } else {
        localStorage.removeItem('vtrkm_token');
    }
    if (user) {
        localStorage.setItem('vtrkm_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('vtrkm_user');
    }
};

export const getSessionUser = () => userSession.user;
export const getToken = () => userSession.token;

export const refreshUserSession = (user) => {
    userSession.user = { ...userSession.user, ...user };
    localStorage.setItem('vtrkm_user', JSON.stringify(userSession.user));
};

export const hasSession = () => {
    return !!userSession.token;
};

export const clearSession = () => {
    userSession.token = null;
    userSession.user = null;
    localStorage.removeItem('vtrkm_token');
    localStorage.removeItem('vtrkm_user');
    console.log('✅ Session cleared');
};

if (typeof window !== 'undefined' && !sessionStorage.getItem('client_public_ip')) {
    fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => { if (d && d.ip) sessionStorage.setItem('client_public_ip', d.ip); })
        .catch(() => {});
}

const getHeaders = async () => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': userSession.token ? `Bearer ${userSession.token}` : '',
    };
    if (typeof window !== 'undefined') {
        const clientIp = sessionStorage.getItem('client_public_ip');
        if (clientIp) headers['X-Client-IP'] = clientIp;
    }
    return headers;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            throw new Error(`Connection timeout (${timeoutMs / 1000}s). Please verify your local backend server is running.`);
        }
        if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
            throw new Error(`Unable to connect to backend server (${BASE_URL}). Check if local backend is running.`);
        }
        throw err;
    }
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        console.warn('⚠️ Session expired (status 401). Clearing session.');
        clearSession();
        window.location.hash = '#/login';
        throw new Error('Session expired. Please login again.');
    }
    if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
            const err = await response.json();
            errorMessage = err.message || `HTTP ${response.status}: Something went wrong.`;
        } catch (parseErr) {
            console.log('Failed to parse error response, raw status:', response.status);
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const login = async (username, password, extraInfo = {}) => {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ...extraInfo }),
    });
    const data = await handleResponse(res);
    setSession(data.token, data.user);
    return data;
};

export const getMe = async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/me`, {
        headers: await getHeaders(),
    });
    const data = await handleResponse(res);
    refreshUserSession(data);
    return data;
};

export const logout = async () => {
    try {
        if (userSession.token) {
            await fetchWithTimeout(`${BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: await getHeaders(),
            });
        }
    } catch (e) {
        console.warn('Backend logout failed:', e.message);
    } finally {
        clearSession();
    }
};

export const getTrades = async (status) => {
    const res = await fetchWithTimeout(`${BASE_URL}/trades?status=${status || ''}`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const placeOrder = async (orderData) => {
    const res = await fetchWithTimeout(`${BASE_URL}/trades`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(orderData),
    });
    return handleResponse(res);
};

export const closeTrade = async (tradeId, exitPrice, pnl) => {
    const body = { exitPrice };
    if (pnl !== null && pnl !== undefined) {
        body.pnl = pnl;
    }
    const res = await fetch(`${BASE_URL}/trades/${tradeId}/close`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
};

export const modifyPendingOrder = async (tradeId, qty, price) => {
    const res = await fetch(`${BASE_URL}/trades/${tradeId}/modify`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ qty, price }),
    });
    return handleResponse(res);
};

export const getFunds = async () => {
    const res = await fetch(`${BASE_URL}/portfolio/balance`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getBalance = getFunds;

export const getIndices = async () => {
    const res = await fetch(`${BASE_URL}/dashboard/indices`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getWatchlist = async () => {
    const res = await fetch(`${BASE_URL}/dashboard/watchlist`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const createWithdrawal = async (data) => {
    const res = await fetch(`${BASE_URL}/requests`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({
            amount: data.amount,
            type: 'WITHDRAW',
            bankName: data.bankName,
            accountHolder: data.accountHolder,
            accountNumber: data.accountNumber,
            ifscCode: data.ifsc,
            upiId: data.upiId,
            paymentMethod: data.method
        }),
    });
    return handleResponse(res);
};

export const getWithdrawals = async () => {
    const res = await fetch(`${BASE_URL}/requests?type=WITHDRAW`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const changePassword = async (currentPassword, newPassword) => {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
};

// Web File upload version for Deposit Request
export const createDeposit = async (amount, fileBlob) => {
    try {
        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('type', 'DEPOSIT');

        if (fileBlob) {
            formData.append('screenshot', fileBlob);
        }

        const headers = await getHeaders();
        delete headers['Content-Type']; // Let browser set boundary

        const res = await fetch(`${BASE_URL}/requests`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(err.message || `Server error: ${res.status}`);
        }

        return res.json();
    } catch (error) {
        console.error('Deposit error:', error.message);
        throw error;
    }
};

export const getTickers = async () => {
    const res = await fetch(`${BASE_URL}/system/tickers`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getNotifications = async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const markNotificationRead = async (notificationId) => {
    const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const markAllNotificationsRead = async () => {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getAlerts = async () => {
    const res = await fetch(`${BASE_URL}/alerts`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const setTargetSL = async (tradeId, targetPrice, stopLoss) => {
    const res = await fetch(`${BASE_URL}/trades/${tradeId}/target-sl`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ targetPrice, stopLoss }),
    });
    return handleResponse(res);
};

export const createAlert = async (alertData) => {
    const res = await fetch(`${BASE_URL}/alerts`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({
            symbol: alertData.symbol,
            type: alertData.type,
            targetPrice: alertData.targetPrice,
            status: 'active'
        }),
    });
    return handleResponse(res);
};

export const deleteAlert = async (alertId) => {
    const res = await fetch(`${BASE_URL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const updateAlertStatus = async (alertId, status) => {
    const res = await fetch(`${BASE_URL}/alerts/${alertId}`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify({ status }),
    });
    return handleResponse(res);
};

export const getAlertSettings = async () => {
    const res = await fetch(`${BASE_URL}/alerts/settings`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const updateAlertSettings = async (settingsData) => {
    const res = await fetch(`${BASE_URL}/alerts/settings`, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(settingsData),
    });
    return handleResponse(res);
};

export const getSupportTickets = async () => {
    const res = await fetch(`${BASE_URL}/support`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const createSupportTicket = async (data) => {
    const res = await fetch(`${BASE_URL}/support`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
};

export const getTicketMessages = async (ticketId) => {
    const res = await fetch(`${BASE_URL}/support/${ticketId}/messages`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const sendTicketMessage = async (ticketId, message) => {
    const res = await fetch(`${BASE_URL}/support/${ticketId}/messages`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ message }),
    });
    return handleResponse(res);
};

export const deleteTicket = async (ticketId) => {
    const res = await fetch(`${BASE_URL}/support/${ticketId}`, {
        method: 'DELETE',
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getKiteWatchlist = async (symbols) => {
    const res = await fetch(`${BASE_URL}/kite/market/watchlist`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ symbols })
    });
    return handleResponse(res);
};

export const getUserWatchlist = async () => {
    const res = await fetch(`${BASE_URL}/users/me/watchlist`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const saveUserWatchlist = async (watchlist) => {
    const res = await fetch(`${BASE_URL}/users/me/watchlist`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ watchlist })
    });
    return handleResponse(res);
};

export const aiChat = async (message) => {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ message }),
    });
    return handleResponse(res);
};

export const aiSmartCommand = async (text) => {
    const res = await fetch(`${BASE_URL}/ai/smart-command`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ text }),
    });
    return handleResponse(res);
};

export const aiParseOnly = async (text) => {
    const res = await fetch(`${BASE_URL}/ai/parse-only`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ text }),
    });
    return handleResponse(res);
};

export const aiTranscribeVoice = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.wav');
    
    const headers = await getHeaders();
    delete headers['Content-Type'];
    
    const res = await fetch(`${BASE_URL}/ai/transcribe-voice`, {
        method: 'POST',
        headers,
        body: formData,
    });
    return handleResponse(res);
};

export const aiTutor = async (message, topic = null, conversationHistory = []) => {
    const res = await fetch(`${BASE_URL}/ai/tutor`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ message, topic, conversationHistory }),
    });
    return handleResponse(res);
};

export const aiTutorTopics = async () => {
    const res = await fetch(`${BASE_URL}/ai/tutor/topics`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getKiteDashboard = async () => {
    const res = await fetch(`${BASE_URL}/kite/market/dashboard`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getKiteUnifiedWatchlist = async () => {
    const res = await fetch(`${BASE_URL}/kite/market/watchlist`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const searchKiteInstruments = async (q, exchange = null) => {
    const params = new URLSearchParams({ q });
    if (exchange) {
        params.append('exchange', exchange);
    }
    const res = await fetch(`${BASE_URL}/kite/instruments/search?${params.toString()}`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getSelectedContracts = async () => {
    const res = await fetch(`${BASE_URL}/contracts/selected`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getInstrumentQuotes = async (instrumentTokens) => {
    const res = await fetch(`${BASE_URL}/kite/quotes`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ tokens: instrumentTokens }),
    });
    return handleResponse(res);
};

export const getCryptoData = async () => {
    const res = await fetch(`${BASE_URL}/market-data/crypto`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getForexData = async () => {
    const res = await fetch(`${BASE_URL}/market-data/forex`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getAllMarketData = async () => {
    const res = await fetch(`${BASE_URL}/market-data/all`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getBanks = async () => {
    const res = await fetch(`${BASE_URL}/bank`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const toggleBankStatus = async (id) => {
    const res = await fetch(`${BASE_URL}/bank/${id}/toggle-status`, {
        method: 'PATCH',
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getUserSegments = async (id) => {
    const res = await fetch(`${BASE_URL}/users/${id}/segments`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getUserProfile = async (id) => {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const getScrips = async () => {
    const res = await fetch(`${BASE_URL}/system/scrips`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const aiAskTutor = aiTutor;

export { getHeaders };
