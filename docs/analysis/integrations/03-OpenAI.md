# Third-Party Integration: OpenAI

## 1. API/service name
OpenAI API

## 2. Purpose
Natural-language smart commands, chat, tutor, schema introspection, and voice transcription backend.

## 3. Which feature uses it
- AI Smart Commands & Chat
- Voice Commands & Transcription
- AI Tutor
- Natural-language search

## 4. Frontend files using it
- `Trading_Frontend-main/src/components/AIAssistant.jsx`
- `Trading_Frontend-main/src/components/TopBar.jsx`
- `Trading_Frontend-main/src/hooks/useVoiceSearch.js`
- `Trading_Frontend-main/src/services/searchController.js`
- `Trading_Frontend-main/src/services/commandParser.js`
- `Trading_Webview-main/src/pages/AiAssistant.jsx`
- `Trading_Webview-main/src/services/commandParser.js`
- `trading-updated-apk-main/src/screens/others/AiAssistantScreen.js`
- `trading-updated-apk-main/src/services/commandParser.js`

## 5. Backend files using it
- `sharemarket-aws-backend-master/src/controllers/aiController.js`
- `sharemarket-aws-backend-master/src/routes/aiRoutes.js`
- `sharemarket-aws-backend-master/src/services/aiService.js` (if present)
- `sharemarket-aws-backend-master/src/services/aiCommandParser.js` (if present)
- `sharemarket-aws-backend-master/src/services/aiMediator.js` (if present)
- `sharemarket-aws-backend-master/src/config/openai.js`

## 6. SDK/package used
- `openai` (NPM SDK)

## 7. API endpoints/methods used
Backend routes:
- `POST /api/ai/smart-command`
- `POST /api/ai/master-command`
- `POST /api/ai/mediator`
- `POST /api/ai/chat`
- `POST /api/ai/tutor`
- `POST /api/ai/schema-introspection`
- `POST /api/ai/voice-parse`
- `POST /api/ai/transcribe-voice`
- Root aliases: `/ai-parse`, `/execute-command`, `/smart-command`, `/master-command`

## 8. Authentication method
- `OPENAI_API_KEY` server-side.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- `OPENAI_API_KEY`

## 12. Database dependencies
- `voice_recordings`
- `ai_chat_history` (if present)
- `ai_command_logs` (if present)

## 13. Other features depending on it
- AI & Voice Agent domain
- Search/TopBar
- Navigation commands

## 14. Complexity
Critical

## 15. Risk if this integration is changed
- All AI features stop working.
- LLM-generated SQL execution is a major security surface.
- Unauthenticated root AI routes allow anonymous access.

## 16. Whether it deserves a dedicated specialist agent
Yes. A dedicated **AI & Voice Agent** is justified due to complexity, security sensitivity, and isolation.
