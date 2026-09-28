# Feature: Voice Commands & Transcription

## 1. Feature name
Voice Commands & Transcription

## 2. Related frontend files
- `Trading_Frontend-main/src/hooks/useVoiceSearch.js`
- `Trading_Frontend-main/src/components/TopBar.jsx`
- `Trading_Frontend-main/src/components/AIAssistant.jsx`
- `Trading_Webview-main/src/pages/AiAssistant.jsx`
- `trading-updated-apk-main/src/screens/others/AiAssistantScreen.js`

## 3. Related backend files
- `sharemarket-aws-backend-master/src/controllers/aiController.js` (transcribe endpoint)
- `sharemarket-aws-backend-master/src/routes/aiRoutes.js`
- `sharemarket-aws-backend-master/src/routes/voiceRecordingController.js`

## 4. Database tables/models involved
- `voice_recordings`
- `ai_command_logs` (if present)

## 5. Third-party APIs/services involved
- Web Speech API (`SpeechRecognition`)
- MediaRecorder API (fallback)
- OpenAI Whisper (likely via `/api/ai/transcribe-voice`)
- expo-audio (mobile)

## 6. API endpoints
- `POST /api/ai/transcribe-voice`
- `POST /api/ai/voice-parse`
- `GET/POST /api/voice-recordings`
- `GET /api/voice-recordings/:id/play`
- `DELETE /api/voice-recordings/:id`

## 7. Authentication/authorization dependencies
- Valid JWT for recording storage and transcription.
- AI command execution requires role checks.

## 8. Important business logic
- Browser-native speech recognition is primary path.
- MediaRecorder fallback records audio and sends to backend for transcription.
- Mobile uses `expo-audio` for recording.
- Recordings stored with metadata and transcript.
- Parsed commands routed through AI command parser.

## 9. External dependencies
- Browser speech APIs.
- OpenAI Whisper/backend transcription.
- Mobile expo-audio.

## 10. Potential risks/dependencies between modules
- iOS Safari has limited Web Speech support.
- Voice transcription fallback depends on network and backend.
- Recording storage may contain sensitive user commands.

## 11. What should be handled by a dedicated coding agent
An **AI & Voice Agent** should own voice recording, transcription fallback, and voice-driven command execution.
