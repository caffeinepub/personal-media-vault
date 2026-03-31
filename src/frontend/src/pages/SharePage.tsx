import type { MediaFile } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import {
  formatDate,
  formatFileSize,
  getEffectiveCategory,
  isGLTFFile,
} from "@/lib/mediaUtils";
import { useParams } from "@tanstack/react-router";
import { AlertCircle, Box, Download, HardDrive, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { Suspense, lazy } from "react";

const ThreeDViewer = lazy(() =>
  import("@/components/ThreeDViewer").then((m) => ({
    default: m.ThreeDViewer,
  })),
);

function setMetaTags(file: MediaFile) {
  const url = file.blob.getDirectURL();
  const cat = getEffectiveCategory(file.mimeType, file.name);
  const shareUrl = window.location.href;

  document.title = `${file.name} — MediaVault`;

  const metas: Record<string, string> = {
    "og:title": file.name,
    "og:description":
      file.description ?? `${cat} file · ${formatFileSize(Number(file.size))}`,
    "og:url": shareUrl,
    "og:type": cat === "video" ? "video.other" : "website",
    "twitter:card": cat === "image" ? "summary_large_image" : "summary",
    "twitter:title": file.name,
    "twitter:description":
      file.description ?? `${cat} file · ${formatFileSize(Number(file.size))}`,
  };

  if (cat === "image") {
    metas["og:image"] = url;
    metas["twitter:image"] = url;
  } else if (cat === "video") {
    metas["og:video"] = url;
    metas["og:video:type"] = file.mimeType;
    metas["og:image"] = url;
  } else if (cat === "audio") {
    metas["og:audio"] = url;
    metas["og:audio:type"] = file.mimeType;
  }

  for (const [property, content] of Object.entries(metas)) {
    let el = document.querySelector<HTMLMetaElement>(
      `meta[property="${property}"]`,
    );
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }
}

export default function SharePage() {
  const { fileId } = useParams({ from: "/share/$fileId" });
  const { actor } = useActor();
  const [file, setFile] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .getFileById(fileId)
      .then((f) => {
        if (!f || !f.isPublic) {
          setNotFound(true);
        } else {
          setFile(f);
          setMetaTags(f);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [actor, fileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">File Not Available</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            This file does not exist or is not publicly shared.
          </p>
        </div>
      </div>
    );
  }

  const cat = getEffectiveCategory(file.mimeType, file.name);
  const url = file.blob.getDirectURL();

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">MediaVault</span>
          </div>
          <Button onClick={handleDownload} size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* File info */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{file.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{cat}</Badge>
            <span className="text-muted-foreground text-sm">
              {formatFileSize(Number(file.size))}
            </span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">
              {formatDate(file.createdAt)}
            </span>
            {file.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
          {file.description && (
            <p className="text-muted-foreground text-sm">{file.description}</p>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-xl overflow-hidden border border-border bg-black/20">
          {cat === "image" && (
            <img
              src={url}
              alt={file.name}
              className="w-full max-h-[70vh] object-contain"
            />
          )}

          {cat === "video" && (
            // biome-ignore lint/a11y/useMediaCaption: share page video
            <video src={url} controls className="w-full max-h-[70vh]" />
          )}

          {cat === "audio" && (
            <div className="flex flex-col items-center justify-center gap-6 p-12">
              <div className="w-24 h-24 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Music className="h-10 w-10 text-purple-400" />
              </div>
              {/* biome-ignore lint/a11y/useMediaCaption: audio player */}
              <audio src={url} controls className="w-full max-w-md" />
            </div>
          )}

          {cat === "pdf" && (
            <iframe
              src={url}
              title={file.name}
              className="w-full"
              style={{ height: "70vh" }}
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
            <div className="flex flex-col items-center justify-center gap-4 p-12 text-muted-foreground">
              <Box className="h-16 w-16 text-orange-400" />
              <p className="text-sm">3D model preview requires download</p>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Download Model
              </Button>
            </div>
          )}

          {(cat === "document" || cat === "other") && (
            <div className="flex flex-col items-center justify-center gap-4 p-12 text-muted-foreground">
              <Download className="h-12 w-12" />
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" /> Download {file.name}
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
