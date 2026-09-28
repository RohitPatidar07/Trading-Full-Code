# Third-Party Integration: Redis

## 1. API/service name
Redis

## 2. Purpose
Optional caching layer for market data and general cache.

## 3. Which feature uses it
- Market Data caching
- General application caching

## 4. Frontend files using it
- None.

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/config/cacheManager.js`
- `sharemarket-aws-backend-master/src/services/MarketDataService.js`

## 6. SDK/package used
- `redis` (NPM)

## 7. API endpoints/methods used
- Redis `GET`, `SET`, `EXPIRE`, etc.

## 8. Authentication method
- Redis password (if configured).

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`

## 12. Database dependencies
- None directly.

## 13. Other features depending on it
- Market Data Agent domain

## 14. Complexity
Low-Medium

## 15. Risk if this integration is changed
- Cache falls back to in-memory or disabled mode.
- Performance degradation if cache removed.
- Stale cache can cause incorrect prices.

## 16. Whether it deserves a dedicated specialist agent
No separate agent needed; include under **Market Data Agent** / **Backend-Platform Agent**.
