import { ExternalBlob } from "@/backend";
import type { MediaFile, MediaFolder } from "@/backend";
import { useActor } from "@/hooks/useActor";
import { generateId } from "@/lib/mediaUtils";
import { useCallback, useState } from "react";

export type { MediaFile, MediaFolder };

export function useFiles() {
  const { actor } = useActor();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(
    new Map(),
  );
  const [isUploading, setIsUploading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [allFiles, allFolders] = await Promise.all([
        actor.listAllFiles(),
        actor.listAllFolders(),
      ]);
      setFiles(allFiles);
      setFolders(allFolders);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  const loadFolders = useCallback(async () => {
    if (!actor) return;
    const allFolders = await actor.listAllFolders();
    setFolders(allFolders);
  }, [actor]);

  const uploadFile = useCallback(
    async (
      file: File,
      folderId?: string,
      tags?: string[],
      description?: string,
    ) => {
      if (!actor) return;
      const id = generateId();
      const trackKey = `${id}-${file.name}`;
      setIsUploading(true);
      setUploadProgress((prev) => new Map(prev).set(trackKey, 0));
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress((prev) => new Map(prev).set(trackKey, pct));
        });
        const mimeType = file.type || "application/octet-stream";
        await actor.createFileRecord(
          id,
          file.name,
          BigInt(file.size),
          mimeType,
          folderId ?? null,
          tags ?? [],
          blob,
          description ?? null,
        );
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.delete(trackKey);
          return next;
        });
        await loadFiles();
      } finally {
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.delete(trackKey);
          return next;
        });
        setIsUploading(uploadProgress.size > 1);
      }
    },
    [actor, loadFiles, uploadProgress.size],
  );

  const deleteFile = useCallback(
    async (id: string) => {
      if (!actor) return;
      await actor.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [actor],
  );

  const renameFile = useCallback(
    async (id: string, name: string) => {
      if (!actor) return;
      await actor.renameFile(id, name);
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    },
    [actor],
  );

  const moveFile = useCallback(
    async (fileId: string, folderId: string | null) => {
      if (!actor) return;
      await actor.moveFileToFolder(fileId, folderId);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, folderId: folderId ?? undefined } : f,
        ),
      );
    },
    [actor],
  );

  const updateTags = useCallback(
    async (id: string, tags: string[]) => {
      if (!actor) return;
      await actor.updateFileTags(id, tags);
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, tags } : f)));
    },
    [actor],
  );

  // Uses explicit setFilePublic for reliable persistence.
  // Returns the confirmed new isPublic value.
  const toggleShare = useCallback(
    async (id: string): Promise<boolean> => {
      if (!actor) throw new Error("Not connected");
      const file = files.find((f) => f.id === id);
      if (!file) throw new Error("File not found");
      const newPublic = !file.isPublic;
      const errMsg = await actor.setFilePublic(id, newPublic);
      if (errMsg) throw new Error(errMsg);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isPublic: newPublic } : f)),
      );
      return newPublic;
    },
    [actor, files],
  );

  const createFolder = useCallback(
    async (name: string, parentId?: string) => {
      if (!actor) return;
      const id = generateId();
      await actor.createFolder(id, name, parentId ?? null);
      await loadFolders();
    },
    [actor, loadFolders],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      if (!actor) return;
      await actor.renameFolder(id, name);
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    },
    [actor],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (!actor) return;
      await actor.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    },
    [actor],
  );

  const storageStats = {
    totalFiles: files.length,
    totalSize: files.reduce((acc, f) => acc + Number(f.size), 0),
  };

  return {
    files,
    folders,
    loading,
    isUploading,
    uploadProgress,
    storageStats,
    loadFiles,
    loadFolders,
    uploadFile,
    deleteFile,
    renameFile,
    moveFile,
    updateTags,
    toggleShare,
    createFolder,
    renameFolder,
    deleteFolder,
  };
}
