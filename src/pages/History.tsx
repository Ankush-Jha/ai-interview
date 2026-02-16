export default function History() {
    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl">HISTORY</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    Your past interview sessions
                </p>
            </div>

            <div className="neo-card p-12 text-center">
                <div className="w-14 h-14 mx-auto bg-muted border-[3px] border-foreground shadow-hard-sm flex items-center justify-center mb-4">
                    <span className="font-display text-2xl">↻</span>
                </div>
                <p className="font-bold text-sm">NO INTERVIEWS YET</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                    Start your first interview to see your history here
                </p>
            </div>
        </div>
    )
}
