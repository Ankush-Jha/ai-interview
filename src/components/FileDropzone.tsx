import { useCallback, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileDropzoneProps {
    onFileSelect: (file: File) => void
    accept?: string
    disabled?: boolean
}

export function FileDropzone({ onFileSelect, accept = '.pdf', disabled = false }: FileDropzoneProps) {
    const [dragOver, setDragOver] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            if (disabled) return

            const file = e.dataTransfer.files[0]
            if (file && file.type === 'application/pdf') {
                setSelectedFile(file)
                onFileSelect(file)
            }
        },
        [onFileSelect, disabled]
    )

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) {
                setSelectedFile(file)
                onFileSelect(file)
            }
        },
        [onFileSelect]
    )

    const clearFile = useCallback(() => {
        setSelectedFile(null)
        if (inputRef.current) inputRef.current.value = ''
    }, [])

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (selectedFile) {
        return (
            <Card>
                <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                    </div>
                    {!disabled && (
                        <Button variant="ghost" size="icon" onClick={clearFile} className="shrink-0">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card
            className={cn(
                'cursor-pointer transition-colors',
                dragOver && 'border-foreground/30 bg-accent/50',
                disabled && 'pointer-events-none opacity-50'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">
                    Drop your PDF here, or <span className="text-foreground underline underline-offset-4">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    PDF files up to 20 MB
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </CardContent>
        </Card>
    )
}
