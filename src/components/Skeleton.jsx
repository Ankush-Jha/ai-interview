/**
 * Reusable skeleton loading component.
 * Provides three variants: text lines, card, and circular.
 */
export function SkeletonLine({ width = '100%', height = '0.875rem', className = '' }) {
    return (
        <div
            className={`bg-slate-200 rounded animate-pulse ${className}`}
            style={{ width, height }}
        />
    )
}

export function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 p-6 space-y-4 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                    <SkeletonLine width="60%" />
                    <SkeletonLine width="40%" height="0.75rem" />
                </div>
            </div>
            <SkeletonLine />
            <SkeletonLine width="80%" />
            <SkeletonLine width="50%" />
        </div>
    )
}

export function SkeletonCircle({ size = '3rem', className = '' }) {
    return (
        <div
            className={`bg-slate-200 rounded-full animate-pulse ${className}`}
            style={{ width: size, height: size }}
        />
    )
}

/**
 * Dashboard loading skeleton — mimics the document upload area + recent interviews.
 */
export function DashboardSkeleton() {
    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
            {/* Header skeleton */}
            <div className="space-y-2">
                <SkeletonLine width="280px" height="2rem" />
                <SkeletonLine width="200px" height="0.875rem" />
            </div>
            {/* Upload area skeleton */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center">
                <SkeletonCircle size="4rem" />
                <SkeletonLine width="200px" className="mt-4" />
                <SkeletonLine width="300px" height="0.75rem" className="mt-2" />
            </div>
            {/* Recent interviews skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
        </div>
    )
}

/**
 * Results loading skeleton — mimics the score circle + report sections.
 */
export function ResultsSkeleton() {
    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <SkeletonLine width="180px" height="0.75rem" />
                <SkeletonLine width="320px" height="2rem" />
                <SkeletonLine width="240px" height="0.875rem" />
            </div>
            {/* Score + metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                    <SkeletonCircle size="14rem" />
                    <SkeletonLine width="120px" className="mt-4" />
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                                <SkeletonLine width="60%" />
                                <SkeletonLine width="40%" height="1.5rem" />
                                <SkeletonLine width="100%" height="0.375rem" />
                            </div>
                        ))}
                    </div>
                    <SkeletonCard />
                </div>
            </div>
        </div>
    )
}
