import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileText, ImageIcon, Plus, X } from 'lucide-react';
import * as React from 'react';

export interface MultiFilePickerProps {
    files: File[];
    onChange: (files: File[]) => void;
    accept?: string;
    maxFiles?: number;
    maxSizeMB?: number;
    hint?: string;
    preview?: boolean;
    disabled?: boolean;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAcceptedTokens(accept?: string): string[] {
    return (accept ?? '')
        .split(',')
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean);
}

function matchesAcceptedType(file: File, acceptedTokens: string[]): boolean {
    if (acceptedTokens.length === 0) return true;

    const fileName = file.name.toLowerCase();
    const mime = file.type.toLowerCase();

    return acceptedTokens.some((token) => {
        if (token.startsWith('.')) {
            return fileName.endsWith(token);
        }

        if (token.endsWith('/*')) {
            const group = token.slice(0, -1);
            return mime.startsWith(group);
        }

        return mime === token;
    });
}

export function MultiFilePicker({
    files,
    onChange,
    accept,
    maxFiles = 20,
    maxSizeMB = 10,
    hint,
    preview = false,
    disabled = false,
}: MultiFilePickerProps) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = React.useState(false);
    const [errors, setErrors] = React.useState<string[]>([]);
    const [previews, setPreviews] = React.useState<Record<string, string>>({});

    const acceptedTokens = React.useMemo(() => getAcceptedTokens(accept), [accept]);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const canAdd = files.length < maxFiles && !disabled;

    // Generate preview URLs for image files
    React.useEffect(() => {
        if (!preview) return;
        const urls: Record<string, string> = {};
        files.forEach((f) => {
            const key = `${f.name}-${f.size}-${f.lastModified}`;
            if (f.type.startsWith('image/')) {
                urls[key] = URL.createObjectURL(f);
            }
        });
        setPreviews(urls);
        return () => {
            Object.values(urls).forEach(URL.revokeObjectURL);
        };
    }, [files, preview]);

    const addFiles = React.useCallback(
        (incoming: FileList | File[]) => {
            const newErrors: string[] = [];
            const toAdd: File[] = [];

            Array.from(incoming).forEach((file) => {
                if (!matchesAcceptedType(file, acceptedTokens)) {
                    newErrors.push(`"${file.name}" no tiene un formato permitido.`);
                    return;
                }
                if (file.size > maxSizeBytes) {
                    newErrors.push(`"${file.name}" excede ${maxSizeMB} MB (${formatSize(file.size)}).`);
                    return;
                }
                const isDuplicate = files.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified);
                if (isDuplicate) return;
                toAdd.push(file);
            });

            const total = files.length + toAdd.length;
            if (total > maxFiles) {
                const allowed = Math.max(0, maxFiles - files.length);
                newErrors.push(`Solo puede agregar ${allowed} archivo(s) más (máximo ${maxFiles}).`);
                toAdd.splice(allowed);
            }

            setErrors(newErrors);
            if (toAdd.length > 0) {
                onChange([...files, ...toAdd]);
            }
        },
        [acceptedTokens, files, onChange, maxFiles, maxSizeBytes, maxSizeMB],
    );

    const removeFile = (index: number) => {
        setErrors([]);
        onChange(files.filter((_, i) => i !== index));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            addFiles(e.target.files);
        }
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (!canAdd || !e.dataTransfer.files.length) return;
        addFiles(e.dataTransfer.files);
    };

    const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

    return (
        <div className="space-y-2">
            {/* Drop zone / add button */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (canAdd) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                    'flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors',
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                    !canAdd && 'cursor-not-allowed opacity-50',
                )}
                onClick={() => canAdd && inputRef.current?.click()}
            >
                <Plus className="text-muted-foreground h-5 w-5" />
                <span className="text-muted-foreground text-sm">
                    {files.length === 0 ? 'Haga clic o arrastre archivos aquí' : 'Agregar más archivos'}
                </span>
                {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
            </div>

            <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={handleInputChange} disabled={disabled} />

            {/* Errors */}
            {errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                    {errors.map((err, i) => (
                        <p key={i}>{err}</p>
                    ))}
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-1.5">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>
                            {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado{files.length !== 1 ? 's' : ''}
                        </span>
                        {files.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive h-auto px-1 py-0 text-xs"
                                onClick={() => {
                                    setErrors([]);
                                    onChange([]);
                                }}
                            >
                                Quitar todos
                            </Button>
                        )}
                    </div>

                    <div className={cn('grid gap-2', preview ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1')}>
                        {files.map((file, idx) => {
                            const key = fileKey(file);
                            const isImage = file.type.startsWith('image/');
                            const previewUrl = previews[key];

                            if (preview && isImage && previewUrl) {
                                return (
                                    <div key={key} className="group relative overflow-hidden rounded-lg border">
                                        <img src={previewUrl} alt={file.name} className="aspect-square w-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                                            <p className="truncate text-xs text-white">{file.name}</p>
                                            <p className="text-xs text-white/70">{formatSize(file.size)}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={() => removeFile(idx)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                );
                            }

                            return (
                                <div key={key} className="bg-muted/30 flex items-center gap-2.5 rounded-lg border px-3 py-2">
                                    {isImage ? (
                                        <ImageIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                                    ) : (
                                        <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm">{file.name}</p>
                                        <p className="text-muted-foreground text-xs">{formatSize(file.size)}</p>
                                    </div>
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                        {file.name.split('.').pop()?.toUpperCase()}
                                    </Badge>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0"
                                        onClick={() => removeFile(idx)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
