export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "3d"
  | "pdf"
  | "document"
  | "other";

export function getFileCategory(mimeType: string): FileCategory {
  if (!mimeType) return "other";
  const m = mimeType.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (
    m === "model/gltf+json" ||
    m === "model/gltf-binary" ||
    m === "model/obj" ||
    m === "model/fbx" ||
    m.includes("gltf") ||
    m.includes("glb")
  ) {
    return "3d";
  }
  if (
    m.includes("text/") ||
    m.includes("document") ||
    m.includes("spreadsheet") ||
    m.includes("presentation")
  ) {
    return "document";
  }
  return "other";
}

export function getFileCategoryByName(name: string): FileCategory {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "bmp",
    "ico",
    "avif",
  ];
  const videoExts = ["mp4", "mov", "webm", "avi", "mkv", "m4v", "ogv"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus", "wma"];
  const threeDExts = ["glb", "gltf", "obj", "fbx", "stl", "3ds", "dae", "ply"];
  const docExts = [
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "md",
    "csv",
  ];
  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (threeDExts.includes(ext)) return "3d";
  if (docExts.includes(ext)) return "document";
  return "other";
}

export function getEffectiveCategory(
  mimeType: string,
  name: string,
): FileCategory {
  const byMime = getFileCategory(mimeType);
  if (byMime !== "other" && byMime !== "3d") return byMime;
  const byName = getFileCategoryByName(name);
  if (byName !== "other") return byName;
  return byMime;
}

export function getFileCategoryColor(cat: FileCategory): string {
  switch (cat) {
    case "image":
      return "text-emerald-400";
    case "video":
      return "text-blue-400";
    case "audio":
      return "text-purple-400";
    case "3d":
      return "text-orange-400";
    case "pdf":
      return "text-red-400";
    case "document":
      return "text-yellow-400";
    default:
      return "text-muted-foreground";
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function is3DFile(name: string, mimeType: string): boolean {
  return getEffectiveCategory(mimeType, name) === "3d";
}

export function isGLTFFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ext === "glb" || ext === "gltf";
}

export function getBlobUrlWithFilename(
  blobUrl: string,
  filename: string,
): string {
  try {
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const blobIndex = pathParts.lastIndexOf("blob");
    if (blobIndex !== -1) {
      pathParts.splice(blobIndex + 1, 0, encodeURIComponent(filename));
    }
    url.pathname = `/${pathParts.join("/")}`;
    return url.toString();
  } catch {
    return blobUrl;
  }
}

/**
 * Maps file extensions to their canonical MIME types.
 * Falls back to application/octet-stream for unknown extensions.
 */
export function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    avif: "image/avif",
    tiff: "image/tiff",
    tif: "image/tiff",
    // Video
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    m4v: "video/mp4",
    ogv: "video/ogg",
    flv: "video/x-flv",
    wmv: "video/x-ms-wmv",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
    opus: "audio/opus",
    wma: "audio/x-ms-wma",
    // Docs / 3D / Other
    pdf: "application/pdf",
    glb: "model/gltf-binary",
    gltf: "model/gltf+json",
    obj: "model/obj",
    stl: "model/stl",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    htm: "text/html",
  };
  return map[ext] ?? "application/octet-stream";
}
