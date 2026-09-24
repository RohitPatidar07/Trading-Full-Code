
// const BACKEND_URL = 'https://trading-new-backend-production.up.railway.app'; // Production
// const BACKEND_URL = 'https://trading-backend-production-8cee.up.railway.app'; // client railway
// const BACKEND_URL = 'https://api.shrishreenathjiglobaltraders.com'; // aws serveer url
const SERVER_IP = '192.168.1.14';
const PORT = '5000';
const BACKEND_URL = `http://${SERVER_IP.trim()}:${PORT}`;

export const BASE_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL;


export default {
    BASE_URL,
    SOCKET_URL,
    TIMEOUT: 10000,
};