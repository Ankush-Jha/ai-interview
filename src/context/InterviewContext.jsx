import { createContext, useContext, useReducer } from "react";

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
    // Document
    document: null, // { text, metadata, chunks }
    analysis: null, // { topics, themes, difficulty, keyTerms, summary }
    jobDescription: '', // optional JD text for tailored questions

    // Mode detection flags
    modeFlags: null, // { hasCoding, codingTopics, languages, hasVoice }

    // Settings
    settings: {
        persona: "academic",
        difficulty: "medium",
        questionTypes: ["open-ended", "scenario"],
        questionCount: 5,
        codingEnabled: false,
    },

    // Interview session
    questions: [],
    currentIndex: 0,
    answers: [],
    evaluations: [],

    // Coding mode state
    codeSubmissions: [], // user's code per question
    testResults: [], // pass/fail results per question

    // Conversation state (adaptive interview)
    conversationHistory: [], // [{ role: 'ai'|'user', text, timestamp }]
    followUpCount: 0, // resets per base question, max 2
    currentPhase: 'intro', // 'intro' | 'technical' | 'behavioral' | 'coding' | 'wrapup'
    aiState: 'idle', // 'idle' | 'thinking' | 'speaking' | 'listening'

    // Report
    report: null,

    // Status
    status: "idle",
    error: null,
    loading: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function interviewReducer(state, action) {
    switch (action.type) {
        case "SET_DOCUMENT":
            return { ...state, document: action.payload, status: "idle", error: null };

        case "SET_ANALYSIS":
            return { ...state, analysis: action.payload };

        case "SET_SETTINGS":
            return { ...state, settings: { ...state.settings, ...action.payload } };

        case "SET_JOB_DESCRIPTION":
            return { ...state, jobDescription: action.payload };

        case "SET_QUESTIONS":
            return {
                ...state,
                questions: action.payload,
                currentIndex: 0,
                answers: new Array(action.payload.length).fill(null),
                evaluations: new Array(action.payload.length).fill(null),
                codeSubmissions: new Array(action.payload.length).fill(null),
                testResults: new Array(action.payload.length).fill(null),
                status: "interviewing",
            };

        case "SET_CODE": {
            const newCode = [...state.codeSubmissions];
            newCode[action.payload.index] = action.payload.code;
            return { ...state, codeSubmissions: newCode };
        }

        case "SET_TEST_RESULTS": {
            const newResults = [...state.testResults];
            newResults[action.payload.index] = action.payload.results;
            return { ...state, testResults: newResults };
        }

        case "SET_MODE_FLAGS":
            return { ...state, modeFlags: action.payload };

        case "SUBMIT_ANSWER":
            const newAnswers = [...state.answers];
            newAnswers[action.payload.index] = action.payload.answer;
            return { ...state, answers: newAnswers };

        case "SET_EVALUATION":
            const newEvals = [...state.evaluations];
            newEvals[action.payload.index] = action.payload.evaluation;
            return { ...state, evaluations: newEvals };

        case "NEXT_QUESTION":
            return {
                ...state,
                currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
            };

        case "RESTORE_SESSION":
            return {
                ...state,
                currentIndex: Math.min(action.payload.currentIndex, state.questions.length - 1),
                evaluations: action.payload.evaluations || state.evaluations,
            };

        case "PREV_QUESTION":
            return {
                ...state,
                currentIndex: Math.max(state.currentIndex - 1, 0),
            };

        case "SET_REPORT":
            return { ...state, report: action.payload, status: "complete" };

        case "SET_STATUS":
            return { ...state, status: action.payload };

        case "SET_LOADING":
            return { ...state, loading: action.payload };

        case "SET_ERROR":
            return { ...state, error: action.payload, status: "error", loading: false };

        case "ADD_MESSAGE":
            return {
                ...state,
                conversationHistory: [
                    ...state.conversationHistory,
                    { ...action.payload, timestamp: Date.now() },
                ],
            };

        case "SET_AI_STATE":
            return { ...state, aiState: action.payload };

        case "SET_PHASE":
            return { ...state, currentPhase: action.payload };

        case "INCREMENT_FOLLOWUP":
            return { ...state, followUpCount: state.followUpCount + 1 };

        case "RESET_FOLLOWUP":
            return { ...state, followUpCount: 0 };

        case "RESET":
            return { ...initialState };

        default:
            return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
    const [state, dispatch] = useReducer(interviewReducer, initialState);

    const actions = {
        setDocument: (doc) => dispatch({ type: "SET_DOCUMENT", payload: doc }),
        setAnalysis: (analysis) => dispatch({ type: "SET_ANALYSIS", payload: analysis }),
        setSettings: (settings) => dispatch({ type: "SET_SETTINGS", payload: settings }),
        setQuestions: (questions) => dispatch({ type: "SET_QUESTIONS", payload: questions }),
        submitAnswer: (index, answer) =>
            dispatch({ type: "SUBMIT_ANSWER", payload: { index, answer } }),
        setEvaluation: (index, evaluation) =>
            dispatch({ type: "SET_EVALUATION", payload: { index, evaluation } }),
        nextQuestion: () => dispatch({ type: "NEXT_QUESTION" }),
        restoreSession: (data) => dispatch({ type: "RESTORE_SESSION", payload: data }),
        prevQuestion: () => dispatch({ type: "PREV_QUESTION" }),
        setReport: (report) => dispatch({ type: "SET_REPORT", payload: report }),
        setStatus: (status) => dispatch({ type: "SET_STATUS", payload: status }),
        setLoading: (loading) => dispatch({ type: "SET_LOADING", payload: loading }),
        setError: (error) => dispatch({ type: "SET_ERROR", payload: error }),
        reset: () => dispatch({ type: "RESET" }),
        setCode: (index, code) =>
            dispatch({ type: "SET_CODE", payload: { index, code } }),
        setTestResults: (index, results) =>
            dispatch({ type: "SET_TEST_RESULTS", payload: { index, results } }),
        setModeFlags: (flags) =>
            dispatch({ type: "SET_MODE_FLAGS", payload: flags }),
        setJobDescription: (text) =>
            dispatch({ type: "SET_JOB_DESCRIPTION", payload: text }),
        addMessage: (role, text) =>
            dispatch({ type: "ADD_MESSAGE", payload: { role, text } }),
        setAIState: (state) =>
            dispatch({ type: "SET_AI_STATE", payload: state }),
        setPhase: (phase) =>
            dispatch({ type: "SET_PHASE", payload: phase }),
        incrementFollowUp: () => dispatch({ type: "INCREMENT_FOLLOWUP" }),
        resetFollowUp: () => dispatch({ type: "RESET_FOLLOWUP" }),
    };

    return (
        <InterviewContext.Provider value={{ state, dispatch, ...actions }}>
            {children}
        </InterviewContext.Provider>
    );
}

export function useInterview() {
    const context = useContext(InterviewContext);
    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }
    return context;
}
