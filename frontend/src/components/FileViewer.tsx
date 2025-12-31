import { FileText, Image as ImageIcon, File } from 'lucide-react';

interface FileViewerProps {
  fileUrl: string;
  className?: string;
}

export function FileViewer({ fileUrl, className }: FileViewerProps) {
  const extension = fileUrl.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '');
  const isPdf = extension === 'pdf';

  return (
    <div className={className}>
      {isImage ? (
        <img 
          src={fileUrl} 
          alt="Document" 
          className="w-full h-auto rounded border" 
        />
      ) : isPdf ? (
        <iframe 
          src={fileUrl} 
          className="w-full h-[600px] border rounded" 
          title="PDF Viewer"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border rounded bg-muted/50">
          {isPdf ? (
            <FileText className="h-12 w-12 text-muted-foreground mb-2" />
          ) : isImage ? (
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
          ) : (
            <File className="h-12 w-12 text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-muted-foreground">Preview not available</p>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 text-sm text-primary hover:underline"
          >
            Download File
          </a>
        </div>
      )}
    </div>
  );
}