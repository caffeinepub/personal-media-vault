import { FileCard } from "@/components/FileCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Lock,
  MoreVertical,
  Music,
  Pencil,
  Share2,
  Tag,
  Trash2,
  Video,
} from "lucide-react";

export type ViewMode = "grid" | "list";

interface FileGridProps {
  files: MediaFile[];
  viewMode: ViewMode;
  folders: MediaFolder[];
  onPreview: (file: MediaFile) => void;
  onRename: (file: MediaFile) => void;
  onMove: (file: MediaFile) => void;
  onDelete: (file: MediaFile) => void;
  onToggleShare: (file: MediaFile) => void;
  onUpdateTags: (file: MediaFile) => void;
}

function TypeIcon({ mimeType, name }: { mimeType: string; name: string }) {
  const cat = getEffectiveCategory(mimeType, name);
  const colorClass = getFileCategoryColor(cat);
  const cls = cn("h-4 w-4", colorClass);
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
    case "document":
      return <FileText className={cls} />;
    default:
      return <File className={cls} />;
  }
}

export function FileGrid({
  files,
  viewMode,
  folders,
  onPreview,
  onRename,
  onMove,
  onDelete,
  onToggleShare,
  onUpdateTags,
}: FileGridProps) {
  if (files.length === 0) {
    return (
      <div
        data-ocid="files.empty_state"
        className="flex flex-col items-center justify-center h-64 text-muted-foreground"
      >
        <File className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm">No files found</p>
        <p className="text-xs mt-1">Upload files to get started</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div
        data-ocid="files.list"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4"
      >
        {files.map((file, index) => (
          <div key={file.id} data-ocid={`files.item.${index + 1}`}>
            <FileCard
              file={file}
              folders={folders}
              onPreview={onPreview}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
              onToggleShare={onToggleShare}
              onUpdateTags={onUpdateTags}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-ocid="files.table" className="p-4">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-8" />
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Shared</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file, index) => (
            <TableRow
              key={file.id}
              data-ocid={`files.row.${index + 1}`}
              className="border-border cursor-pointer hover:bg-secondary/50"
              onClick={() => onPreview(file)}
            >
              <TableCell>
                <TypeIcon mimeType={file.mimeType} name={file.name} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate max-w-xs">
                    {file.name}
                  </span>
                  {file.tags.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {file.tags.length} tags
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {getEffectiveCategory(file.mimeType, file.name)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatFileSize(Number(file.size))}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(file.createdAt)}
              </TableCell>
              <TableCell>
                {file.isPublic ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      data-ocid="files.button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onRename(file)}>
                      <Pencil className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMove(file)}>
                      <FolderInput className="h-4 w-4 mr-2" /> Move to Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateTags(file)}>
                      <Tag className="h-4 w-4 mr-2" /> Edit Tags
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleShare(file)}>
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
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = file.blob.getDirectURL();
                        a.download = file.name;
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(file)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
