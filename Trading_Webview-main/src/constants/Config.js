// Configuration constants for VTRKM Web

// ===== Backend URL Toggle =====
// Uncomment ONE of the following lines:

// export const BACKEND_URL = 'https://api.shrishreenathjiglobaltraders.com'; // ✅ AWS (Production)
export const BACKEND_URL = 'http://localhost:5000'; // 🔧 Local Backend (Testing)

export const BASE_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL;

export default {
    BASE_URL,
    SOCKET_URL,
    TIMEOUT: 10000,
};
