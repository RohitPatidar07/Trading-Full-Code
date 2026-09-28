# Third-Party Integration: Web Speech API & MediaRecorder

## 1. API/service name
Web Speech API (`SpeechRecognition`) + MediaRecorder API

## 2. Purpose
Browser-native voice input for AI search and commands.

## 3. Which feature uses it
- AI Smart Commands & Chat
- Voice Commands & Transcription

## 4. Frontend files using it
- `Trading_Frontend-main/src/hooks/useVoiceSearch.js`
- `Trading_Frontend-main/src/components/AIAssistant.jsx`
- `Trading_Frontend-main/src/components/TopBar.jsx`
- `Trading_Webview-main/src/pages/AiAssistant.jsx`

## 5. Backend files using it
- Backend receives audio from MediaRecorder fallback via `/api/ai/transcribe-voice`.

## 6. SDK/package used
- Browser native APIs only.

## 7. API endpoints/methods used
- `SpeechRecognition` events
- `MediaRecorder` + `FormData` upload to `/api/ai/transcribe-voice`

## 8. Authentication method
- N/A (browser API).
- Backend transcription requires JWT.

## 9. Webhooks
- No.

## 10. WebSocket/realtime connection
- No.

## 11. Environment variables required
- None.

## 12. Database dependencies
- `voice_recordings`

## 13. Other features depending on it
- AI & Voice Agent domain

## 14. Complexity
Medium

## 15. Risk if this integration is changed
- Voice input breaks on unsupported browsers (especially iOS Safari).
- Fallback recording degrades UX.

## 16. Whether it deserves a dedicated specialist agent
No. Include under **AI & Voice Agent**.
