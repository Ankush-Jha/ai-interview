"use client";

import React, {
    createContext,
    useContext,
    useReducer,
    ReactNode,
    useCallback,
} from "react";
import type {
    Question,
    QuestionConfig,
    EvaluationResult,
    AnalysisResult,
    ReportResult,
} from "@/lib/gemini";
import type { PDFMetadata } from "@/lib/pdf-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InterviewStatus =
    | "idle"
    | "uploading"
    | "analyzing"
    | "configuring"
    | "generating"
    | "in-progress"
    | "evaluating"
    | "completed";

export interface InterviewSettings {
    config: QuestionConfig;
    persona: string;
}

export interface InterviewState {
    // Document data
    documentText: string;
    documentMetadata: PDFMetadata | null;
    analysis: AnalysisResult | null;

    // Interview session
    status: InterviewStatus;
    questions: Question[];
    currentIndex: number;
    answers: string[];
    scores: number[];
    evaluations: EvaluationResult[];
    settings: InterviewSettings;

    // Results
    report: ReportResult | null;

    // Error handling
    error: string | null;
}

export type InterviewAction =
    | { type: "SET_DOCUMENT"; payload: { text: string; metadata: PDFMetadata } }
    | { type: "SET_ANALYSIS"; payload: AnalysisResult }
    | { type: "SET_STATUS"; payload: InterviewStatus }
    | { type: "SET_SETTINGS"; payload: Partial<InterviewSettings> }
    | { type: "SET_QUESTIONS"; payload: Question[] }
    | { type: "NEXT_QUESTION" }
    | { type: "PREV_QUESTION" }
    | { type: "SUBMIT_ANSWER"; payload: { answer: string; index: number } }
    | {
        type: "SET_EVALUATION";
        payload: { index: number; evaluation: EvaluationResult; score: number };
    }
    | { type: "SET_REPORT"; payload: ReportResult }
    | { type: "SET_ERROR"; payload: string }
    | { type: "CLEAR_ERROR" }
    | { type: "END_SESSION" }
    | { type: "RESET" };

// ─── Initial State ────────────────────────────────────────────────────────────

const defaultSettings: InterviewSettings = {
    config: {
        difficulty: "mixed",
        count: 5,
        types: ["mcq", "open-ended"],
        persona: "quiz-master",
    },
    persona: "Quiz Master",
};

const initialState: InterviewState = {
    documentText: "",
    documentMetadata: null,
    analysis: null,
    status: "idle",
    questions: [],
    currentIndex: 0,
    answers: [],
    scores: [],
    evaluations: [],
    settings: defaultSettings,
    report: null,
    error: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function interviewReducer(
    state: InterviewState,
    action: InterviewAction
): InterviewState {
    switch (action.type) {
        case "SET_DOCUMENT":
            return {
                ...state,
                documentText: action.payload.text,
                documentMetadata: action.payload.metadata,
                status: "analyzing",
                error: null,
            };

        case "SET_ANALYSIS":
            return {
                ...state,
                analysis: action.payload,
                status: "configuring",
            };

        case "SET_STATUS":
            return { ...state, status: action.payload };

        case "SET_SETTINGS":
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
            };

        case "SET_QUESTIONS":
            return {
                ...state,
                questions: action.payload,
                currentIndex: 0,
                answers: new Array(action.payload.length).fill(""),
                scores: new Array(action.payload.length).fill(-1),
                evaluations: new Array(action.payload.length).fill(null),
                status: "in-progress",
            };

        case "NEXT_QUESTION":
            return {
                ...state,
                currentIndex: Math.min(
                    state.currentIndex + 1,
                    state.questions.length - 1
                ),
            };

        case "PREV_QUESTION":
            return {
                ...state,
                currentIndex: Math.max(state.currentIndex - 1, 0),
            };

        case "SUBMIT_ANSWER": {
            const newAnswers = [...state.answers];
            newAnswers[action.payload.index] = action.payload.answer;
            return {
                ...state,
                answers: newAnswers,
                status: "evaluating",
            };
        }

        case "SET_EVALUATION": {
            const newScores = [...state.scores];
            const newEvals = [...state.evaluations];
            newScores[action.payload.index] = action.payload.score;
            newEvals[action.payload.index] = action.payload.evaluation;
            return {
                ...state,
                scores: newScores,
                evaluations: newEvals,
                status: "in-progress",
            };
        }

        case "SET_REPORT":
            return {
                ...state,
                report: action.payload,
                status: "completed",
            };

        case "SET_ERROR":
            return { ...state, error: action.payload };

        case "CLEAR_ERROR":
            return { ...state, error: null };

        case "END_SESSION":
            return { ...state, status: "completed" };

        case "RESET":
            return { ...initialState };

        default:
            return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface InterviewContextValue {
    state: InterviewState;
    dispatch: React.Dispatch<InterviewAction>;

    // Convenience action creators
    setDocument: (text: string, metadata: PDFMetadata) => void;
    setAnalysis: (analysis: AnalysisResult) => void;
    setQuestions: (questions: Question[]) => void;
    submitAnswer: (answer: string, index: number) => void;
    setEvaluation: (
        index: number,
        evaluation: EvaluationResult,
        score: number
    ) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    setReport: (report: ReportResult) => void;
    setError: (error: string) => void;
    clearError: () => void;
    endSession: () => void;
    reset: () => void;
}

const InterviewContext = createContext<InterviewContextValue | undefined>(
    undefined
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InterviewProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(interviewReducer, initialState);

    const setDocument = useCallback(
        (text: string, metadata: PDFMetadata) =>
            dispatch({ type: "SET_DOCUMENT", payload: { text, metadata } }),
        []
    );

    const setAnalysis = useCallback(
        (analysis: AnalysisResult) =>
            dispatch({ type: "SET_ANALYSIS", payload: analysis }),
        []
    );

    const setQuestions = useCallback(
        (questions: Question[]) =>
            dispatch({ type: "SET_QUESTIONS", payload: questions }),
        []
    );

    const submitAnswer = useCallback(
        (answer: string, index: number) =>
            dispatch({ type: "SUBMIT_ANSWER", payload: { answer, index } }),
        []
    );

    const setEvaluation = useCallback(
        (index: number, evaluation: EvaluationResult, score: number) =>
            dispatch({
                type: "SET_EVALUATION",
                payload: { index, evaluation, score },
            }),
        []
    );

    const nextQuestion = useCallback(
        () => dispatch({ type: "NEXT_QUESTION" }),
        []
    );
    const prevQuestion = useCallback(
        () => dispatch({ type: "PREV_QUESTION" }),
        []
    );
    const setReport = useCallback(
        (report: ReportResult) =>
            dispatch({ type: "SET_REPORT", payload: report }),
        []
    );
    const setError = useCallback(
        (error: string) => dispatch({ type: "SET_ERROR", payload: error }),
        []
    );
    const clearError = useCallback(
        () => dispatch({ type: "CLEAR_ERROR" }),
        []
    );
    const endSession = useCallback(
        () => dispatch({ type: "END_SESSION" }),
        []
    );
    const reset = useCallback(() => dispatch({ type: "RESET" }), []);

    return (
        <InterviewContext.Provider
            value={{
                state,
                dispatch,
                setDocument,
                setAnalysis,
                setQuestions,
                submitAnswer,
                setEvaluation,
                nextQuestion,
                prevQuestion,
                setReport,
                setError,
                clearError,
                endSession,
                reset,
            }}
        >
            {children}
        </InterviewContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInterview(): InterviewContextValue {
    const context = useContext(InterviewContext);
    if (context === undefined) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }
    return context;
}
