import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { MediaFolder } from "@/hooks/useFiles";
import { formatFileSize } from "@/lib/mediaUtils";
import { cn } from "@/lib/utils";
import {
  Box,
  ChevronRight,
  FileText,
  Files,
  Folder,
  FolderOpen,
  HardDrive,
  Image,
  Music,
  Plus,
  Video,
} from "lucide-react";
import { useState } from "react";

export type FilterCategory =
  | "all"
  | "image"
  | "video"
  | "audio"
  | "3d"
  | "document";

interface SidebarProps {
  folders: MediaFolder[];
  selectedFolderId: string | null;
  selectedCategory: FilterCategory;
  onSelectFolder: (id: string | null) => void;
  onSelectCategory: (cat: FilterCategory) => void;
  onNewFolder: () => void;
  storageStats: { totalFiles: number; totalSize: number };
  isMobile?: boolean;
}

const categoryFilters: {
  label: string;
  value: FilterCategory;
  icon: React.ReactNode;
}[] = [
  { label: "All Files", value: "all", icon: <Files className="h-4 w-4" /> },
  { label: "Images", value: "image", icon: <Image className="h-4 w-4" /> },
  { label: "Videos", value: "video", icon: <Video className="h-4 w-4" /> },
  { label: "Audio", value: "audio", icon: <Music className="h-4 w-4" /> },
  { label: "3D Models", value: "3d", icon: <Box className="h-4 w-4" /> },
  {
    label: "Documents",
    value: "document",
    icon: <FileText className="h-4 w-4" />,
  },
];

export function Sidebar({
  folders,
  selectedFolderId,
  selectedCategory,
  onSelectFolder,
  onSelectCategory,
  onNewFolder,
  storageStats,
  isMobile,
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const rootFolders = folders.filter((f) => !f.parentId);
  const getChildren = (parentId: string) =>
    folders.filter((f) => f.parentId === parentId);

  const toggleExpand = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function FolderItem({
    folder,
    depth = 0,
  }: { folder: MediaFolder; depth?: number }) {
    const children = getChildren(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    return (
      <div>
        <button
          type="button"
          data-ocid="sidebar.link"
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-left",
            isSelected
              ? "bg-accent/20 text-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            onSelectFolder(folder.id);
            onSelectCategory("all");
          }}
        >
          {children.length > 0 ? (
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform",
                isExpanded && "rotate-90",
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
            />
          ) : (
            <span className="w-3" />
          )}
          {isSelected ? (
            <FolderOpen className="h-4 w-4 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">{folder.name}</span>
        </button>
        {isExpanded &&
          children.map((child) => (
            <FolderItem key={child.id} folder={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  const maxStorage = 10 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(
    (storageStats.totalSize / maxStorage) * 100,
    100,
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-border",
        isMobile ? "w-full" : "w-60 shrink-0",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <HardDrive className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground tracking-tight">
          MediaVault
        </span>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {/* Category filters */}
        <div className="space-y-0.5">
          {categoryFilters.map((cat) => (
            <button
              key={cat.value}
              type="button"
              data-ocid="sidebar.tab"
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-left",
                selectedCategory === cat.value && !selectedFolderId
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
              onClick={() => {
                onSelectCategory(cat.value);
                onSelectFolder(null);
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Folders */}
        <Separator className="my-3" />
        <div className="flex items-center justify-between px-3 mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Folders
          </span>
          <Button
            data-ocid="sidebar.button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={onNewFolder}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {folders.length === 0 ? (
          <p className="px-3 text-xs text-muted-foreground">No folders yet</p>
        ) : (
          <div className="space-y-0.5">
            {rootFolders.map((folder) => (
              <FolderItem key={folder.id} folder={folder} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Storage stats */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{storageStats.totalFiles} files</span>
          <span>{formatFileSize(storageStats.totalSize)}</span>
        </div>
        <Progress value={storagePercent} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          {formatFileSize(storageStats.totalSize)} used
        </p>
      </div>
    </aside>
  );
}
