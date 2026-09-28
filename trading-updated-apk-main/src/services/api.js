import { BASE_URL } from '../constants/Config';
import { Alert } from 'react-native';
import { navigate } from '../navigation/RootNavigation';

let userSession = {
    token: null,
    user: null
};

let isManualLogout = false;

export const setSession = (token, user) => {
    isManualLogout = false;
    userSession.token = token;
    userSession.user = user;
};

export const getSessionUser = () => userSession.user;
export const getToken = () => userSession.token;
export const refreshUserSession = (user) => {
    userSession.user = { ...userSession.user, ...user };
};
export const hasSession = () => {
    const hasToken = !!userSession.token;
    return hasToken;
};

export const clearSession = (manual = false) => {
    if (manual) isManualLogout = true;
    userSession.token = null;
    userSession.user = null;
    console.log('✅ Session cleared');
};

let cachedMobileClientIp = null;
fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(d => { if (d && d.ip) cachedMobileClientIp = d.ip; })
    .catch(() => {});

const getHeaders = async () => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': userSession.token ? `Bearer ${userSession.token}` : '',
    };
    if (cachedMobileClientIp) {
        headers['X-Client-IP'] = cachedMobileClientIp;
    }
    return headers;
};

const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        let isConcurrentLogout = false;
        try {
            const err = await response.json();
            if (err && !err.kite_disconnected && err.error !== 'Kite not connected.') {
                console.log('Server error response:', err);
            }
            errorMessage = err.message || `HTTP ${response.status}: Something went wrong.`;
            if (response.status === 401) {
                isConcurrentLogout = true;
            }
        } catch (parseErr) {
            console.log('Failed to parse error response, raw status:', response.status);
        }

        if (isConcurrentLogout) {
            const wasManual = isManualLogout;
            
            // Check if error is simply a missing token error (which occurs on logout or when session token is null)
            const isNoTokenError = errorMessage.toLowerCase().includes('no token') || !userSession.token;

            // Clear local session details
            clearSession();

            // Alert user ONLY if session was invalidated due to concurrent login or token expiration, NOT on manual logout or missing token
            if (!wasManual && !isNoTokenError) {
                const title = errorMessage.toLowerCase().includes('another device')
                    ? "Logged In On Another Device"
                    : "Session Expired";
                const msg = errorMessage.toLowerCase().includes('another device')
                    ? "Your account was logged in on another device. Please log in again."
                    : errorMessage;
                Alert.alert(title, msg);
            }
            isManualLogout = false;
            navigate('Login');
        }

        throw new Error(errorMessage);
    }
    return response.json();
};

export const login = async (username, password, extraInfo = {}) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ...extraInfo }),
    });
    const data = await handleResponse(res);

    setSession(data.token, data.user);
    return data;
};

export const getMe = async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: await getHeaders(),
    });
    const data = await handleResponse(res);
    refreshUserSession(data);
    return data;
};
export const getTrades = async (status) => {
    const res = await fetch(`${BASE_URL}/trades?status=${status || ''}`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

export const placeOrder = async (orderData) => {
    const res = await fetch(`${BASE_URL}/trades`, {
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
    const url = `${BASE_URL}/trades/${tradeId}/modify`;
    const payload = { qty, price };
    const res = await fetch(url, {
        method: 'PUT',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
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

export const uploadMultipart = async (url, formData, method = 'POST') => {
    const headers = await getHeaders();
    delete headers['Content-Type'];

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);

        for (const key in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, key) && headers[key]) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }

        xhr.onload = () => {
            let data = null;
            try {
                data = JSON.parse(xhr.responseText);
            } catch (e) {
                data = null;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(data || xhr.responseText);
            } else {
                let errorMessage = data?.message || data?.error || `HTTP ${xhr.status}: Something went wrong.`;
                if (xhr.status === 401) {
                    const wasManual = isManualLogout;
                    const isNoTokenError = errorMessage.toLowerCase().includes('no token') || !userSession.token;
                    clearSession();
                    if (!wasManual && !isNoTokenError) {
                        const title = errorMessage.toLowerCase().includes('another device')
                            ? "Logged In On Another Device"
                            : "Session Expired";
                        const msg = errorMessage.toLowerCase().includes('another device')
                            ? "Your account was logged in on another device. Please log in again."
                            : errorMessage;
                        Alert.alert(title, msg);
                    }
                    isManualLogout = false;
                    navigate('Login');
                }
                reject(new Error(errorMessage));
            }
        };

        xhr.onerror = () => {
            reject(new Error('Network request failed'));
        };

        xhr.ontimeout = () => {
            reject(new Error('Request timed out'));
        };

        xhr.send(formData);
    });
};

export const createDeposit = async (amount, screenshotUri) => {
    try {
        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('type', 'DEPOSIT');

        if (screenshotUri) {
            const filename = screenshotUri.split('/').pop() || `screenshot_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            formData.append('screenshot', {
                uri: screenshotUri,
                name: filename,
                type
            });
        }

        console.log('DEBUG: Sending deposit request to:', `${BASE_URL}/requests`);
        return await uploadMultipart(`${BASE_URL}/requests`, formData);
    } catch (error) {
        console.error('Deposit error:', error.message);
        throw error;
    }
};

// ─── TICKERS (Admin alerts for top banner) ───────────
export const getTickers = async () => {
    const res = await fetch(`${BASE_URL}/system/tickers`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

// ─── NOTIFICATIONS ────────────────────────────────────
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

// ─── ALERTS ───────────────────────────────────────────────
export const getAlerts = async () => {
    try {
        const res = await fetch(`${BASE_URL}/alerts`, {
            headers: await getHeaders(),
        });
        return handleResponse(res);
    } catch (error) {
        console.error('getAlerts error:', error);
        throw error;
    }
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
    try {
        const res = await fetch(`${BASE_URL}/alerts`, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify({
                symbol: alertData.symbol,
                type: alertData.type, // 'above' or 'below'
                targetPrice: alertData.targetPrice,
                status: 'active'
            }),
        });
        return handleResponse(res);
    } catch (error) {
        console.error('createAlert error:', error);
        throw error;
    }
};

export const deleteAlert = async (alertId) => {
    try {
        const res = await fetch(`${BASE_URL}/alerts/${alertId}`, {
            method: 'DELETE',
            headers: await getHeaders(),
        });
        return handleResponse(res);
    } catch (error) {
        console.error('deleteAlert error:', error);
        throw error;
    }
};

export const updateAlertStatus = async (alertId, status) => {
    try {
        const res = await fetch(`${BASE_URL}/alerts/${alertId}`, {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify({ status }),
        });
        return handleResponse(res);
    } catch (error) {
        console.error('updateAlertStatus error:', error);
        throw error;
    }
};

export const getAlertSettings = async () => {
    try {
        const res = await fetch(`${BASE_URL}/alerts/settings`, {
            headers: await getHeaders(),
        });
        return handleResponse(res);
    } catch (error) {
        console.error('getAlertSettings error:', error);
        throw error;
    }
};

export const updateAlertSettings = async (settingsData) => {
    try {
        const res = await fetch(`${BASE_URL}/alerts/settings`, {
            method: 'PUT',
            headers: await getHeaders(),
            body: JSON.stringify(settingsData),
        });
        return handleResponse(res);
    } catch (error) {
        console.error('updateAlertSettings error:', error);
        throw error;
    }
};

// ─── SUPPORT TICKETS ─────────────────────────────────
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

// ─── AI / VOICE COMMANDS ─────────────────────────────
export const getKiteWatchlist = async (symbols) => {
    const res = await fetch(`${BASE_URL}/kite/market/watchlist`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ symbols })
    });
    return handleResponse(res);
};

// ─── WATCHLIST PERSISTENCE ────────────────────────────
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

export const aiTranscribeVoice = async (formData) => {
    return uploadMultipart(`${BASE_URL}/ai/transcribe-voice`, formData);
};

// ─── AI TUTOR (Educational) ─────────────────────────
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

// ─── KITE MARKET DATA ────────────────────────────────
export const getKiteDashboard = async () => {
    const res = await fetch(`${BASE_URL}/kite/market/dashboard`, {
        headers: await getHeaders(),
    });
    return handleResponse(res);
};

// Unified Watchlist — ONE API for NSE + NFO OPT + MCX FUT + MCX OPT (same as web MarketWatch)
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

// Export getHeaders for use in other components
export { getHeaders };

// ── Market Data (Crypto + Forex via Twelve Data) ──
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

// ─── BANK DETAILS ─────────────────────────────────────
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

export const submitContactInquiry = async ({ name, phone, message }) => {
    try {
        const res = await fetch(`${BASE_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, message }),
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.log('Contact inquiry submission notice:', e?.message || e);
    }
    return { success: true };
};

export const logout = async () => {
    try {
        if (userSession.token) {
            await fetch(`${BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: await getHeaders(),
            });
        }
    } catch (e) {
        console.warn('Backend logout call failed:', e.message);
    } finally {
        clearSession(true);
    }
};

