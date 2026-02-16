export default function Results() {
    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl">SESSION_RESULTS</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    Your interview performance breakdown
                </p>
            </div>

            <div className="neo-card p-12 text-center">
                <div className="w-14 h-14 mx-auto bg-muted border-[3px] border-foreground shadow-hard-sm flex items-center justify-center mb-4">
                    <span className="font-display text-2xl">📊</span>
                </div>
                <p className="font-bold text-sm">NO RESULTS TO DISPLAY</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                    Complete an interview to see your results
                </p>
            </div>
        </div>
    )
}
