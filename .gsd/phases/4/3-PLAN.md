---
phase: 4
plan: 3
wave: 2
---

# Plan 4.3: Voice Engine — Speech-to-Text + Text-to-Speech

## Objective
Add voice interaction using Web Speech API — students speak answers hands-free, AI reads questions aloud. Includes voice controls, recording indicators, and graceful fallback to text mode.

## Context
- src/pages/Session.tsx (from Plan 4.2)
- src/hooks/useInterview.ts
- Web Speech API: SpeechRecognition (STT), SpeechSynthesis (TTS)

## Tasks

<task type="auto">
  <name>useSpeech hook — STT + TTS</name>
  <files>src/hooks/useSpeech.ts</files>
  <action>
    Create a unified speech hook:

    **Speech-to-Text (STT)**:
    - Use `webkitSpeechRecognition` / `SpeechRecognition`
    - `startListening()` → begins recording, continuous mode, interim results
    - `stopListening()` → stops recording, returns final transcript
    - `transcript` — live updated text as student speaks
    - `isListening` — boolean state
    - `isSupported` — feature detection

    **Text-to-Speech (TTS)**:
    - Use `SpeechSynthesis` API
    - `speak(text: string)` → reads text aloud
    - `stopSpeaking()` → cancels speech
    - `isSpeaking` — boolean state
    - Voice selection: prefer "Google UK English Female" or similar natural voice, fallback to default
    - Rate: 0.95 (slightly slower for clarity)

    **Error handling**:
    - Microphone permission denied → set error state
    - Browser doesn't support → isSupported = false
    - Expose `error` state for UI to display

    **Events**:
    - `onTranscriptComplete(text: string)` — called when STT finalizes
    - Clean up on unmount (stop recognition, cancel speech)
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>useSpeech hook handles STT + TTS with full lifecycle</done>
</task>

<task type="auto">
  <name>Voice integration in Session page</name>
  <files>src/pages/Session.tsx</files>
  <action>
    Wire voice into the interview flow:

    **Voice Controls UI** (below the answer textarea):
    - Mic button: large, circular, border-3, hard shadow
      - Idle: mic icon, "Hold to speak" label
      - Recording: pulsing red ring (pulse-ring keyframe), "Listening…"
      - Processing: spinner
    - Speaker toggle: mute/unmute TTS for question read-aloud
    - Fallback text: if !isSupported, show "Voice unavailable — type your answer"

    **Flow Integration**:
    1. When a new question appears and TTS is enabled:
       - AI orb → `speaking` state
       - speak(question.text)
       - When speech ends → orb → `idle`
    2. When student clicks mic:
       - AI orb → `listening` state
       - startListening()
       - Live transcript populates the textarea
       - On stop → stopListening(), transcript becomes answer text
    3. Student can edit transcript before submitting
    4. Submit works same as before (text or voice)
    5. When evaluation feedback comes in and TTS enabled:
       - speak(evaluation.feedback)
       - orb → `speaking`

    **Orb state sync**:
    - isSpeaking → 'speaking'
    - isListening → 'listening'
    - phase=evaluating → 'thinking'
    - Default → 'idle'
  </action>
  <verify>npx tsc -b --noEmit, test with mic in browser</verify>
  <done>Voice input/output works, orb reacts to speech states</done>
</task>

## Success Criteria
- [ ] STT captures student speech and populates answer textarea
- [ ] TTS reads questions and feedback aloud
- [ ] AI orb syncs state with speaking/listening
- [ ] Mic button has clear recording indicator
- [ ] Graceful fallback when voice is unavailable
