import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { MediaFile } from "@/hooks/useFiles";
import {
  formatDate,
  formatFileSize,
  getEffectiveCategory,
  isGLTFFile,
} from "@/lib/mediaUtils";
import {
  Box,
  Check,
  Copy,
  Download,
  Globe,
  Lock,
  Music,
  Trash2,
} from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { toast } from "sonner";

const ThreeDViewer = lazy(() =>
  import("@/components/ThreeDViewer").then((m) => ({
    default: m.ThreeDViewer,
  })),
);

interface MediaPreviewProps {
  file: MediaFile | null;
  onClose: () => void;
  onDelete: (file: MediaFile) => void;
  onToggleShare: (file: MediaFile) => void;
}

// Stable waveform bars (no random values during render)
const WAVEFORM_BARS = Array.from({ length: 40 }, (_, i) => ({
  id: `wave-bar-${i}`,
  height: Math.round(20 + Math.sin(i * 0.8) * 15 + (i % 7) * 1.5),
}));

export function MediaPreview({
  file,
  onClose,
  onDelete,
  onToggleShare,
}: MediaPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const cat = getEffectiveCategory(file.mimeType, file.name);
  const url = file.blob.getDirectURL();
  const shareUrl = `${window.location.origin}/share/${file.id}/${encodeURIComponent(file.name)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const handleDelete = () => {
    onDelete(file);
    onClose();
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-ocid="preview.dialog"
        className="max-w-4xl w-full bg-card border-border p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-base font-medium truncate pr-8">
            {file.name}
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Badge variant="secondary">{cat}</Badge>
            <span>{formatFileSize(Number(file.size))}</span>
            <span>·</span>
            <span>{formatDate(file.createdAt)}</span>
            {file.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 min-h-0 bg-black/20 flex items-center justify-center overflow-auto max-h-[60vh]">
          {cat === "image" && (
            <img
              src={url}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {cat === "video" && (
            // biome-ignore lint/a11y/useMediaCaption: media preview
            <video
              src={url}
              controls
              className="max-w-full max-h-full"
              style={{ maxHeight: "60vh" }}
            />
          )}

          {cat === "audio" && (
            <div className="flex flex-col items-center justify-center gap-6 p-8 w-full">
              <div className="w-24 h-24 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Music className="h-10 w-10 text-purple-400" />
              </div>
              <div className="w-full max-w-md space-y-2">
                <div className="flex gap-1 items-end justify-center h-12">
                  {WAVEFORM_BARS.map((bar) => (
                    <div
                      key={bar.id}
                      className="bg-purple-400/60 rounded-sm w-1"
                      style={{ height: `${bar.height}px` }}
                    />
                  ))}
                </div>
                {/* biome-ignore lint/a11y/useMediaCaption: audio player */}
                <audio src={url} controls className="w-full" />
              </div>
            </div>
          )}

          {cat === "pdf" && (
            <iframe
              src={url}
              title={file.name}
              className="w-full"
              style={{ height: "60vh" }}
            />
          )}

          {cat === "3d" && isGLTFFile(file.name) && (
            <Suspense
              fallback={
                <Skeleton className="w-full" style={{ height: "400px" }} />
              }
            >
              <ThreeDViewer url={url} />
            </Suspense>
          )}

          {cat === "3d" && !isGLTFFile(file.name) && (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
              <Box className="h-16 w-16 text-orange-400" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-center max-w-xs">
                3D model preview is available for GLB/GLTF formats. Download to
                view in a 3D application.
              </p>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Download Model
              </Button>
            </div>
          )}

          {(cat === "document" || cat === "other") && (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
              <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center">
                <Download className="h-8 w-8" />
              </div>
              <p className="text-sm">
                Preview not available for this file type
              </p>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Download File
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                data-ocid="preview.switch"
                id="share-toggle"
                checked={file.isPublic}
                onCheckedChange={() => onToggleShare(file)}
              />
              <Label
                htmlFor="share-toggle"
                className="flex items-center gap-1.5 cursor-pointer text-sm"
              >
                {file.isPublic ? (
                  <>
                    <Globe className="h-3.5 w-3.5 text-primary" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                    Private
                  </>
                )}
              </Label>
            </div>
            {file.isPublic && (
              <Button
                data-ocid="preview.button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-ocid="preview.secondary_button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button
              data-ocid="preview.delete_button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
