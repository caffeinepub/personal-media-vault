import type { MediaFile } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import {
  formatDate,
  formatFileSize,
  getBlobUrlWithFilename,
  getEffectiveCategory,
  isGLTFFile,
} from "@/lib/mediaUtils";
import { useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  Box,
  Copy,
  Download,
  HardDrive,
  Link,
  Music,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Suspense, lazy } from "react";
import { toast } from "sonner";

const ThreeDViewer = lazy(() =>
  import("@/components/ThreeDViewer").then((m) => ({
    default: m.ThreeDViewer,
  })),
);

function setMetaTags(file: MediaFile) {
  const rawUrl = file.blob.getDirectURL();
  const url = getBlobUrlWithFilename(rawUrl, file.name);
  const cat = getEffectiveCategory(file.mimeType, file.name);
  const shareUrl = window.location.href;
  const description =
    file.description ?? `${cat} file · ${formatFileSize(Number(file.size))}`;

  document.title = `${file.name} — MediaVault`;

  function setMeta(attrName: string, attrValue: string, content: string) {
    let el = document.querySelector<HTMLMetaElement>(
      `meta[${attrName}="${attrValue}"]`,
    );
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  // Base OG
  setMeta("property", "og:title", file.name);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", shareUrl);
  setMeta("property", "og:site_name", "MediaVault");
  setMeta("property", "og:locale", "en_US");

  // Twitter base
  setMeta("name", "twitter:title", file.name);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:site", "@mediavault");

  if (cat === "image") {
    setMeta("property", "og:type", "website");
    setMeta("property", "og:image", url);
    setMeta("property", "og:image:secure_url", url);
    setMeta("property", "og:image:type", file.mimeType || "image/jpeg");
    setMeta("property", "og:image:alt", file.name);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:image", url);
    setMeta("name", "twitter:image:alt", file.name);
  } else if (cat === "video") {
    setMeta("property", "og:type", "video.other");
    setMeta("property", "og:video", url);
    setMeta("property", "og:video:secure_url", url);
    setMeta("property", "og:video:type", file.mimeType || "video/mp4");
    setMeta("property", "og:video:width", "1280");
    setMeta("property", "og:video:height", "720");
    setMeta("property", "og:image", url);
    setMeta("property", "og:image:secure_url", url);
    setMeta("property", "og:image:type", file.mimeType || "video/mp4");
    setMeta("name", "twitter:card", "player");
    setMeta("name", "twitter:player", shareUrl);
    setMeta("name", "twitter:player:width", "1280");
    setMeta("name", "twitter:player:height", "720");
    setMeta("name", "twitter:player:stream", url);
    setMeta(
      "name",
      "twitter:player:stream:content_type",
      file.mimeType || "video/mp4",
    );
    setMeta("name", "twitter:image", url);
  } else if (cat === "audio") {
    setMeta("property", "og:type", "music.song");
    setMeta("property", "og:audio", url);
    setMeta("property", "og:audio:secure_url", url);
    setMeta("property", "og:audio:type", file.mimeType || "audio/mpeg");
    setMeta("name", "twitter:card", "player");
    setMeta("name", "twitter:player", shareUrl);
    setMeta("name", "twitter:player:width", "480");
    setMeta("name", "twitter:player:height", "150");
    setMeta("name", "twitter:player:stream", url);
    setMeta(
      "name",
      "twitter:player:stream:content_type",
      file.mimeType || "audio/mpeg",
    );
  } else if (cat === "pdf") {
    setMeta("property", "og:type", "article");
    setMeta("property", "og:image", url);
    setMeta("name", "twitter:card", "summary");
  } else {
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", "summary");
  }
}

export default function SharePage() {
  const { fileId } = useParams({ strict: false }) as { fileId: string };
  const { actor } = useActor();
  const [file, setFile] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .getFileById(fileId)
      .then((f) => {
        if (!f) {
          setNotFound(true);
        } else {
          setFile(f);
          setMetaTags(f);
        }
      })
      .catch((err) => {
        console.error("Share page: getFileById failed", err);
        setNotFound(true);
      })
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
  const rawUrl = file.blob.getDirectURL();
  const url = getBlobUrlWithFilename(rawUrl, file.name);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const handleCopyMediaLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Media link copied!", {
        description:
          "Paste this URL directly in Discord, Slack, or any platform for inline embeds.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
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
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyMediaLink}
              size="sm"
              variant="outline"
              className="gap-2"
              data-ocid="share.copy_link_button"
            >
              {copied ? (
                <Copy className="h-4 w-4 text-green-500" />
              ) : (
                <Link className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy media link"}
            </Button>
            <Button
              onClick={handleDownload}
              size="sm"
              className="gap-2"
              data-ocid="share.primary_button"
            >
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
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
          {/* Direct media URL hint */}
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-sm">
              {url}
            </code>
          </div>
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
