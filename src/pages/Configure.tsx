import { useState } from 'react'
import { FileDropzone } from '@/components/FileDropzone'
import { parsePDF, type ParsedPDF } from '@/lib/pdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FileText, Loader2, AlertCircle } from 'lucide-react'

export default function Configure() {
    const [parsing, setParsing] = useState(false)
    const [parsed, setParsed] = useState<ParsedPDF | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleFileSelect(file: File) {
        setParsing(true)
        setError(null)
        setParsed(null)

        try {
            const result = await parsePDF(file)
            setParsed(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse PDF')
        } finally {
            setParsing(false)
        }
    }

    function handleReset() {
        setParsed(null)
        setError(null)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">New Interview</h1>
                <p className="text-sm text-muted-foreground">
                    Upload your study material to get started
                </p>
            </div>

            {/* Upload */}
            <FileDropzone onFileSelect={handleFileSelect} disabled={parsing} />

            {/* Parsing state */}
            {parsing && (
                <Card>
                    <CardContent className="flex items-center justify-center gap-3 py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Extracting text from your PDF…</p>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && (
                <Card className="border-destructive/50">
                    <CardContent className="flex items-start gap-3 py-4">
                        <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-destructive">Failed to parse PDF</p>
                            <p className="text-xs text-muted-foreground mt-1">{error}</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={handleReset}>
                                Try again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Parsed result */}
            {parsed && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {parsed.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{parsed.pageCount} {parsed.pageCount === 1 ? 'page' : 'pages'}</span>
                                <Separator orientation="vertical" className="h-3" />
                                <span>{parsed.text.split(/\s+/).length.toLocaleString()} words</span>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                                <p className="text-sm leading-relaxed text-foreground/80">
                                    {parsed.text.slice(0, 500).trim()}
                                    {parsed.text.length > 500 && '…'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleReset}>
                            Upload different file
                        </Button>
                        <Button disabled>
                            Continue
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
