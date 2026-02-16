---
phase: 4
plan: 4
wave: 2
---

# Plan 4.4: Interactive Interviewer Persona — AI That Acts Like a Real Interviewer

## Objective
Upgrade Groq prompts and session flow so the AI feels like a real, experienced interviewer — not a quiz bot. It should have personality, react to answers, give encouraging nudges, challenge strong students, probe weak areas with follow-ups, and maintain conversational continuity.

## Context
- src/lib/interview-engine.ts (generateQuestions, evaluateAnswer)
- src/hooks/useInterview.ts
- src/pages/Session.tsx

## Tasks

<task type="auto">
  <name>Enhanced interviewer prompts + conversational memory</name>
  <files>src/lib/interview-engine.ts</files>
  <action>
    **Upgrade generateQuestions prompt**:
    - Add interviewer persona context:
      ```
      You are Professor Viva — a warm but rigorous academic interviewer.
      You've been teaching for 20 years and genuinely care about student learning.
      Your style: start with an icebreaker, build rapport, then gradually increase pressure.
      You ask one question at a time, listen carefully, and follow the student's thread.
      ```
    - First question should always be a warm-up ("Tell me what you found most interesting about X")
    - Last question should be a synthesis/reflection ("How would you connect X to Y?")
    - Add `openingRemark` field to the response — a brief conversational opener

    **Upgrade evaluateAnswer prompt**:
    - Add conversation history context (pass last 2 Q&A pairs for continuity)
    - Make feedback sound human, not robotic:
      ```
      Respond as Professor Viva would — conversational, warm, specific.
      Instead of "Your answer demonstrates understanding", say "That's a solid point about X — I can tell you've thought about this."
      Instead of "You missed Y", say "One thing I'd push you on — what about Y? How does that fit in?"
      ```
    - Add `transitionPhrase` field — a natural bridge to the next question
      e.g. "Great, let's shift gears" or "Building on that..." or "Now let me challenge you on..."
    - Add `emotionalTone` field: 'encouraging' | 'neutral' | 'probing' | 'impressed'

    **New function: generateClosingRemarks(evaluations, overallScore)**:
    - Prompt: "Give a warm, honest 2-sentence closing as Professor Viva"
    - Personalized based on performance — celebration for high scores, encouragement for low
    - Returns: { closingMessage: string, topRecommendation: string }
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>AI interviewer has personality, conversational memory, and human-like feedback</done>
</task>

<task type="auto">
  <name>UI integration — transitions, persona, and closing</name>
  <files>src/pages/Session.tsx, src/hooks/useInterview.ts</files>
  <action>
    **useInterview.ts**:
    - Add `openingRemark` state (from first generateQuestions call)
    - Pass conversation history (last 2 Q&A pairs) to evaluateAnswer
    - On completion, call generateClosingRemarks → store in session
    - Expose `closingRemarks` to UI

    **Session.tsx**:
    - Before first question: show opening remark card with AI orb speaking
    - After each answer: show transitionPhrase before next question (orb speaking)
    - Feedback card: adapt visual tone based on emotionalTone
      - 'encouraged' → green accent border
      - 'probing' → violet accent border
      - 'impressed' → yellow accent + confetti-like shimmer
      - 'neutral' → default
    - Completed view: show Professor Viva's closing message + recommendation
    - All text transitions use brutalist-appear animation
  </action>
  <verify>Full e2e flow — AI feels conversational and interactive</verify>
  <done>Interview feels like a real, dynamic conversation with a professor</done>
</task>

## Success Criteria
- [ ] AI has "Professor Viva" personality throughout
- [ ] Opening remark warms up the session
- [ ] Feedback sounds human, not robotic
- [ ] Conversation history provides continuity between questions
- [ ] Closing remarks are personalized
- [ ] UI reflects emotional tone of feedback
