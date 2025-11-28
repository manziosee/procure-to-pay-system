import { useCallback, useState } from 'react';
import { CloudUpload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  readonly onFileSelect: (file: File | null) => void;
  readonly accept?: string;
  readonly maxSize?: number;
  readonly label?: string;
  readonly currentFile?: string;
  readonly disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10 * 1024 * 1024,
  label = 'Upload File',
  currentFile,
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExt)) {
        return `File type must be one of: ${accept}`;
      }
    }
    return null;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      try {
        const file = e.dataTransfer.files?.[0];
        if (file) {
          const validationError = validateFile(file);
          if (validationError) {
            setError(validationError);
            return;
          }
          setError('');
          setSelectedFile(file);
          onFileSelect(file);
        }
      } catch (err) {
        setError('Failed to process dropped file');
      }
    },
    [disabled, onFileSelect, maxSize, accept]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    try {
      const file = e.target.files?.[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        setError('');
        setSelectedFile(file);
        onFileSelect(file);
      }
    } catch (err) {
      setError('Failed to process selected file');
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError('');
    onFileSelect(null);
  };

  const displayFileName = selectedFile?.name || currentFile?.split('/').pop();

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">{label}</label>
      
      {!selectedFile && !currentFile ? (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
          )}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${label} - ${accept} files accepted, max ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('file-input')?.click();
            }
          }}
        >
          <input
            id="file-input"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept={accept}
            disabled={disabled}
            aria-label={label}
            title={`Upload ${label}`}
          />
          <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-1">
            Drag and drop file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supported: PDF, Images (JPG, PNG, BMP, TIFF, GIF), Text files (TXT, CSV) - Max {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 border rounded-lg">
          <File className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayFileName}</p>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}