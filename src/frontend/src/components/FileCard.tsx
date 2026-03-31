import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MediaFile, MediaFolder } from "@/hooks/useFiles";
import {
  formatDate,
  formatFileSize,
  getEffectiveCategory,
  getFileCategoryColor,
} from "@/lib/mediaUtils";
import { cn } from "@/lib/utils";
import {
  Box,
  Download,
  EyeOff,
  File,
  FileText,
  FolderInput,
  Globe,
  Image,
  MoreVertical,
  Music,
  Pencil,
  Play,
  Share2,
  Tag,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";

interface FileCardProps {
  file: MediaFile;
  onPreview: (file: MediaFile) => void;
  onRename: (file: MediaFile) => void;
  onMove: (file: MediaFile) => void;
  onDelete: (file: MediaFile) => void;
  onToggleShare: (file: MediaFile) => void;
  onUpdateTags: (file: MediaFile) => void;
  folders: MediaFolder[];
}

function CategoryIcon({
  mimeType,
  name,
  className,
}: { mimeType: string; name: string; className?: string }) {
  const cat = getEffectiveCategory(mimeType, name);
  const colorClass = getFileCategoryColor(cat);
  const cls = cn("h-10 w-10", colorClass, className);
  switch (cat) {
    case "image":
      return <Image className={cls} />;
    case "video":
      return <Video className={cls} />;
    case "audio":
      return <Music className={cls} />;
    case "3d":
      return <Box className={cls} />;
    case "pdf":
      return <FileText className={cn(cls, "text-red-400")} />;
    case "document":
      return <FileText className={cls} />;
    default:
      return <File className={cls} />;
  }
}

export function FileCard({
  file,
  onPreview,
  onRename,
  onMove,
  onDelete,
  onToggleShare,
  onUpdateTags,
}: FileCardProps) {
  const [imgError, setImgError] = useState(false);
  const cat = getEffectiveCategory(file.mimeType, file.name);
  const isImage = cat === "image";
  const isVideo = cat === "video";
  const url = file.blob.getDirectURL();

  return (
    <article
      data-ocid="files.item.1"
      className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
      onClick={() => onPreview(file)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPreview(file)}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-secondary flex items-center justify-center relative overflow-hidden">
        {isImage && !imgError ? (
          <img
            src={url}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <Video className="h-10 w-10 text-blue-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 rounded-full p-2">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
          </div>
        ) : (
          <CategoryIcon mimeType={file.mimeType} name={file.name} />
        )}

        {/* Share badge */}
        {file.isPublic && (
          <div className="absolute top-2 left-2">
            <div className="bg-primary/20 border border-primary/30 rounded-full p-1">
              <Globe className="h-3 w-3 text-primary" />
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <p
            className="text-sm font-medium text-foreground truncate flex-1"
            title={file.name}
          >
            {file.name}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                data-ocid="files.button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                data-ocid="files.edit_button"
                onClick={() => onRename(file)}
              >
                <Pencil className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                data-ocid="files.button"
                onClick={() => onMove(file)}
              >
                <FolderInput className="h-4 w-4 mr-2" /> Move to Folder
              </DropdownMenuItem>
              <DropdownMenuItem
                data-ocid="files.button"
                onClick={() => onUpdateTags(file)}
              >
                <Tag className="h-4 w-4 mr-2" /> Edit Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-ocid="files.toggle"
                onClick={() => onToggleShare(file)}
              >
                {file.isPublic ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" /> Make Private
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" /> Share Publicly
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                data-ocid="files.button"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = file.name;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-ocid="files.delete_button"
                className="text-destructive"
                onClick={() => onDelete(file)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(Number(file.size))}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(file.createdAt)}
          </span>
        </div>

        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
            {file.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{file.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
