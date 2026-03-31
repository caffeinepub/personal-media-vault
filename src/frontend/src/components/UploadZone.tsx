import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  uploadProgress: Map<string, number>;
  isUploading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function UploadZone({
  onFiles,
  uploadProgress,
  isUploading,
  children,
  className,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) onFiles(dropped);
    },
    [onFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      if (selected.length > 0) onFiles(selected);
      e.target.value = "";
    },
    [onFiles],
  );

  const progressEntries = Array.from(uploadProgress.entries());

  return (
    <div
      className={cn("relative", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* Hidden file input */}
      <input
        data-ocid="upload.upload_button"
        ref={inputRef}
        type="file"
        multiple
        accept="*"
        className="hidden"
        onChange={handleInputChange}
        id="file-upload-input"
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-primary">
            <Upload className="h-12 w-12" />
            <p className="text-lg font-semibold">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">
              All file types supported
            </p>
          </div>
        </div>
      )}

      {/* Upload progress panel */}
      {isUploading && progressEntries.length > 0 && (
        <div
          data-ocid="upload.loading_state"
          className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-xl shadow-2xl p-4 w-80 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {progressEntries.length} file
              {progressEntries.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {progressEntries.map(([key, pct]) => {
              const name = key.split("-").slice(1).join("-") || key;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span
                      className="truncate text-muted-foreground"
                      title={name}
                    >
                      {name.length > 30 ? `${name.slice(0, 27)}...` : name}
                    </span>
                    <span className="text-primary ml-2">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <Progress value={pct} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function triggerUpload() {
  const input = document.getElementById(
    "file-upload-input",
  ) as HTMLInputElement;
  input?.click();
}
