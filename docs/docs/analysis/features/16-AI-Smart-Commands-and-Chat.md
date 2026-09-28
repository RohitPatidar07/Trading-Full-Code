# Feature: AI Smart Commands & Chat

## 1. Feature name
AI Smart Commands, Chat & Tutor

## 2. Related frontend files
- `Trading_Frontend-main/src/components/AIAssistant.jsx`
- `Trading_Frontend-main/src/components/SearchResultsModal.jsx`
- `Trading_Frontend-main/src/components/TopBar.jsx`
- `Trading_Frontend-main/src/services/searchController.js`
- `Trading_Frontend-main/src/services/commandParser.js`
- `Trading_Frontend-main/src/services/queryParser.js`
- `Trading_Frontend-main/src/services/voiceCommandController.js`
- `Trading_Frontend-main/src/config/voiceCommandConfig.js`
- `Trading_Webview-main/src/pages/AiAssistant.jsx`
- `Trading_Webview-main/src/services/commandParser.js`
- `trading-updated-apk-main/src/screens/others/AiAssistantScreen.js`
- `trading-updated-apk-main/src/services/commandParser.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/aiController.js`
- `sharemarket-aws-backend-master/src/routes/aiRoutes.js`
- `sharemarket-aws-backend-master/src/services/aiService.js` (if present)
- `sharemarket-aws-backend-master/src/services/aiCommandParser.js` (if present)
- `sharemarket-aws-backend-master/src/services/aiMediator.js` (if present)
- `sharemarket-aws-backend-master/src/config/openai.js`

## 4. Database tables/models involved
- `voice_recordings`
- `ai_chat_history` (if present)
- `ai_command_logs` (if present)
- `users`

## 5. Third-party APIs/services involved
- OpenAI API
- Web Speech API (browser)
- MediaRecorder API (browser fallback)
- expo-audio (mobile)

## 6. API endpoints
- `POST /api/ai/smart-command`
- `POST /api/ai/master-command`
- `POST /api/ai/mediator`
- `POST /api/ai/chat`
- `POST /api/ai/tutor`
- `POST /api/ai/schema-introspection`
- `POST /api/ai/voice-parse`
- `POST /api/ai/transcribe-voice`
- Root-level aliases: `POST /ai-parse`, `POST /execute-command`, `POST /smart-command`, `POST /master-command`

## 7. Authentication/authorization dependencies
- Most `/api/ai/*` routes require JWT.
- Root-level aliases in `server.js` are currently **unauthenticated** — security risk.
- Master commands require admin role.

## 8. Important business logic
- Parses natural language (Hindi, English, Hinglish) into actions.
- Chat and tutor modes use OpenAI completions.
- Schema introspection allows AI to query database (dangerous if not restricted).
- Smart commands can navigate UI or trigger backend actions.
- Command logging for audit.

## 9. External dependencies
- OpenAI API key.
- Browser speech APIs or mobile `expo-audio`.

## 10. Potential risks/dependencies between modules
- `aiController.js` executes LLM-generated SQL with minimal validation.
- Unauthenticated root AI routes allow anonymous command execution.
- Mobile `commandParser.js` exposes admin commands (`block`, `create admin`, `assign funds`) — backend must reject unauthorized use.
- AI trade/fund commands must coordinate with Trading-Engine Agent.

## 11. What should be handled by a dedicated coding agent
A dedicated **AI & Voice Agent** should own OpenAI integration, command parsing, chat/tutor, voice transcription, and command safety.
