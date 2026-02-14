import { Component } from 'react'
import { Link } from 'react-router-dom'

/**
 * ErrorBoundary — Catches render-time errors in wrapped children
 * and shows a user-friendly fallback instead of a blank page.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error)
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <span className="material-icons-round text-red-500 text-3xl">error_outline</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                        <p className="text-slate-500 text-sm mb-6">
                            An unexpected error occurred. Don't worry — your data is safe.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-left text-xs text-red-600 bg-red-50 p-3 rounded-lg mb-4 overflow-auto max-h-32 border border-red-100">
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-icons-round text-base">refresh</span>
                                    Try Again
                                </span>
                            </button>
                            <Link
                                to="/"
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
