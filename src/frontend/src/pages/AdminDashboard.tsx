import type { MediaFile } from "@/backend";
import { FileGrid } from "@/components/FileGrid";
import type { ViewMode } from "@/components/FileGrid";
import { MediaPreview } from "@/components/MediaPreview";
import { Sidebar } from "@/components/Sidebar";
import type { FilterCategory } from "@/components/Sidebar";
import { UploadZone, triggerUpload } from "@/components/UploadZone";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { useFiles } from "@/hooks/useFiles";
import { getEffectiveCategory } from "@/lib/mediaUtils";
import {
  FolderPlus,
  HardDrive,
  KeyRound,
  LayoutGrid,
  List,
  Loader2,
  LogOut,
  Search,
  SortAsc,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type SortOption = "name" | "date" | "size" | "type";

export default function AdminDashboard() {
  const { isAuthenticated, isInitializing, login, logout, isLoggingIn } =
    useAuth();
  const { actor } = useActor();
  const fileOps = useFiles();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [claimingAdmin, setClaimingAdmin] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("all");

  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<MediaFile | null>(null);
  const [renameName, setRenameName] = useState("");

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<MediaFile | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>("none");

  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagsTarget, setTagsTarget] = useState<MediaFile | null>(null);
  const [tagsInput, setTagsInput] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);

  // Check admin status
  useEffect(() => {
    if (!actor || !isAuthenticated) return;
    setCheckingAdmin(true);
    actor
      .isCallerAdmin()
      .then((admin) => setIsAdmin(admin))
      .catch(() => setIsAdmin(false))
      .finally(() => setCheckingAdmin(false));
  }, [actor, isAuthenticated]);

  // Load files when admin
  const loadFiles = fileOps.loadFiles;
  useEffect(() => {
    if (isAdmin && actor) {
      loadFiles();
    }
  }, [isAdmin, actor, loadFiles]);

  const handleClaimAdmin = async () => {
    if (!actor || !tokenInput.trim()) return;
    setClaimingAdmin(true);
    try {
      const success = (await (actor as any).forceClaimAdmin(
        tokenInput.trim(),
      )) as boolean;
      if (success) {
        setIsAdmin(true);
        toast.success("Admin access granted!");
      } else {
        toast.error(
          "Invalid token. Check your admin token in the Caffeine dashboard.",
        );
      }
    } catch (err) {
      toast.error(`Failed to claim admin: ${String(err)}`);
    } finally {
      setClaimingAdmin(false);
    }
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          await fileOps.uploadFile(
            file,
            selectedFolderId ?? undefined,
            [],
            undefined,
          );
          toast.success(`Uploaded ${file.name}`);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${String(err)}`);
        }
      }
    },
    [fileOps, selectedFolderId],
  );

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fileOps.createFolder(newFolderName.trim());
      toast.success(`Folder "${newFolderName}" created`);
      setNewFolderName("");
      setNewFolderOpen(false);
    } catch (err) {
      toast.error(`Failed to create folder: ${String(err)}`);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    try {
      await fileOps.renameFile(renameTarget.id, renameName.trim());
      toast.success("File renamed");
      setRenameOpen(false);
      setRenameTarget(null);
    } catch (err) {
      toast.error(`Failed to rename: ${String(err)}`);
    }
  };

  const handleMove = async () => {
    if (!moveTarget) return;
    try {
      await fileOps.moveFile(
        moveTarget.id,
        moveFolderId === "none" ? null : moveFolderId,
      );
      toast.success("File moved");
      setMoveOpen(false);
      setMoveTarget(null);
    } catch (err) {
      toast.error(`Failed to move: ${String(err)}`);
    }
  };

  const handleUpdateTags = async () => {
    if (!tagsTarget) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await fileOps.updateTags(tagsTarget.id, tags);
      toast.success("Tags updated");
      setTagsOpen(false);
      setTagsTarget(null);
    } catch (err) {
      toast.error(`Failed to update tags: ${String(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fileOps.deleteFile(deleteTarget.id);
      toast.success("File deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Failed to delete: ${String(err)}`);
    }
  };

  const handleToggleShare = async (file: MediaFile) => {
    try {
      await fileOps.toggleShare(file.id);
      toast.success(
        file.isPublic ? "File made private" : "File shared publicly",
      );
    } catch (err) {
      toast.error(`Failed to toggle sharing: ${String(err)}`);
    }
  };

  // Filter and sort files
  const filteredFiles = fileOps.files
    .filter((f) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !f.name.toLowerCase().includes(q) &&
          !f.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      if (selectedFolderId) {
        if (f.folderId !== selectedFolderId) return false;
      }
      if (selectedCategory !== "all") {
        const cat = getEffectiveCategory(f.mimeType, f.name);
        if (cat !== selectedCategory) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return Number(b.size) - Number(a.size);
      if (sortBy === "type") return a.mimeType.localeCompare(b.mimeType);
      return Number(b.createdAt) - Number(a.createdAt);
    });

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
            <HardDrive className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">MediaVault</h1>
            <p className="text-muted-foreground text-sm">
              Your personal cloud storage for all media types.
            </p>
          </div>
          <Button
            data-ocid="auth.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full gap-2"
            size="lg"
          >
            {isLoggingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <HardDrive className="h-4 w-4" />
            )}
            Sign in with Internet Identity
          </Button>
          <p className="text-xs text-muted-foreground">
            Admin access only. Secure authentication via Internet Computer.
          </p>
        </div>
      </div>
    );
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Admin Recovery</h1>
            <p className="text-muted-foreground text-sm">
              Enter your admin token to reclaim access to your media vault.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <Label htmlFor="admin-token">Admin Token</Label>
            <Input
              data-ocid="recovery.input"
              id="admin-token"
              type="password"
              placeholder="Paste your admin token here"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClaimAdmin()}
              className="bg-secondary border-border"
            />
          </div>
          <Button
            data-ocid="recovery.primary_button"
            onClick={handleClaimAdmin}
            disabled={claimingAdmin || !tokenInput.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {claimingAdmin ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Claim Admin Access
          </Button>
          <Button
            data-ocid="recovery.secondary_button"
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UploadZone
      onFiles={handleFiles}
      uploadProgress={fileOps.uploadProgress}
      isUploading={fileOps.isUploading}
      className="flex flex-col h-screen overflow-hidden"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mr-4">
          <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center">
            <HardDrive className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold hidden sm:block">MediaVault</span>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-ocid="header.search_input"
            placeholder="Search files and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border h-8 text-sm"
          />
        </div>

        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortOption)}
        >
          <SelectTrigger
            data-ocid="header.select"
            className="w-32 h-8 text-sm border-border bg-secondary hidden sm:flex"
          >
            <SortAsc className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <Button
            data-ocid="header.toggle"
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            data-ocid="header.toggle"
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Button
          data-ocid="header.button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 hidden sm:flex"
          onClick={() => setNewFolderOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
          <span className="hidden md:inline">New Folder</span>
        </Button>

        <Button
          data-ocid="header.upload_button"
          size="sm"
          className="h-8 gap-1.5"
          onClick={triggerUpload}
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>

        <Button
          data-ocid="header.button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          folders={fileOps.folders}
          selectedFolderId={selectedFolderId}
          selectedCategory={selectedCategory}
          onSelectFolder={setSelectedFolderId}
          onSelectCategory={setSelectedCategory}
          onNewFolder={() => setNewFolderOpen(true)}
          storageStats={fileOps.storageStats}
        />

        <main className="flex-1 overflow-y-auto">
          {fileOps.loading ? (
            <div
              data-ocid="files.loading_state"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4"
            >
              {[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
              ].map((id) => (
                <Skeleton key={id} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : (
            <FileGrid
              files={filteredFiles}
              viewMode={viewMode}
              folders={fileOps.folders}
              onPreview={setPreviewFile}
              onRename={(f) => {
                setRenameTarget(f);
                setRenameName(f.name);
                setRenameOpen(true);
              }}
              onMove={(f) => {
                setMoveTarget(f);
                setMoveFolderId(f.folderId ?? "none");
                setMoveOpen(true);
              }}
              onDelete={(f) => {
                setDeleteTarget(f);
                setDeleteOpen(true);
              }}
              onToggleShare={handleToggleShare}
              onUpdateTags={(f) => {
                setTagsTarget(f);
                setTagsInput(f.tags.join(", "));
                setTagsOpen(true);
              }}
            />
          )}
        </main>
      </div>

      <MediaPreview
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDelete={(f) => {
          setDeleteTarget(f);
          setDeleteOpen(true);
          setPreviewFile(null);
        }}
        onToggleShare={handleToggleShare}
      />

      {/* New folder modal */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent
          data-ocid="folder.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              data-ocid="folder.input"
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="My Folder"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="folder.cancel_button"
              variant="ghost"
              onClick={() => setNewFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="folder.submit_button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename modal */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent
          data-ocid="rename.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input">New Name</Label>
            <Input
              data-ocid="rename.input"
              id="rename-input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="rename.cancel_button"
              variant="ghost"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="rename.save_button"
              onClick={handleRename}
              disabled={!renameName.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move modal */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent
          data-ocid="move.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Target Folder</Label>
            <Select value={moveFolderId} onValueChange={setMoveFolderId}>
              <SelectTrigger
                data-ocid="move.select"
                className="bg-secondary border-border"
              >
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder (Root)</SelectItem>
                {fileOps.folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              data-ocid="move.cancel_button"
              variant="ghost"
              onClick={() => setMoveOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="move.confirm_button" onClick={handleMove}>
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags modal */}
      <Dialog open={tagsOpen} onOpenChange={setTagsOpen}>
        <DialogContent
          data-ocid="tags.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Edit Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tags-input">Tags (comma separated)</Label>
            <Input
              data-ocid="tags.input"
              id="tags-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="nature, travel, 2024"
              onKeyDown={(e) => e.key === "Enter" && handleUpdateTags()}
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>
          <DialogFooter>
            <Button
              data-ocid="tags.cancel_button"
              variant="ghost"
              onClick={() => setTagsOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="tags.save_button" onClick={handleUpdateTags}>
              Save Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          data-ocid="delete.dialog"
          className="bg-card border-border"
        >
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              data-ocid="delete.cancel_button"
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="delete.delete_button"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="text-center py-3 text-xs text-muted-foreground border-t border-border shrink-0">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </UploadZone>
  );
}
