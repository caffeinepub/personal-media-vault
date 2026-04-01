import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Timestamp = bigint;
export interface MediaFile {
    id: FileId;
    blob: ExternalBlob;
    name: string;
    createdAt: Timestamp;
    size: bigint;
    tags: Array<string>;
    mimeType: string;
    description?: string;
    isPublic: boolean;
    folderId?: FolderId;
}
export interface MediaFolder {
    id: FolderId;
    name: string;
    createdAt: Timestamp;
    parentId?: FolderId;
}
export type FileId = string;
export type FolderId = string;
export interface backendInterface {
    claimAdminWithIdentity(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    createFileRecord(id: FileId, name: string, size: bigint, mimeType: string, folderId: FolderId | null, tags: Array<string>, blob: ExternalBlob, description: string | null): Promise<void>;
    deleteFile(id: FileId): Promise<void>;
    renameFile(id: FileId, newName: string): Promise<void>;
    moveFileToFolder(fileId: FileId, folderId: FolderId | null): Promise<void>;
    updateFileTags(id: FileId, newTags: Array<string>): Promise<void>;
    /** Explicitly sets isPublic. Returns empty string on success, error message on failure. */
    setFilePublic(id: FileId, isPublic: boolean): Promise<string>;
    toggleFilePublic(id: FileId): Promise<void>;
    createFolder(id: string, name: string, parentId: string | null): Promise<void>;
    renameFolder(id: string, newName: string): Promise<void>;
    deleteFolder(id: string): Promise<void>;
    getFileById(id: FileId): Promise<MediaFile | null>;
    getFolderById(id: string): Promise<MediaFolder | null>;
    listAllFiles(): Promise<Array<MediaFile>>;
    getFilesByFolder(folderId: string): Promise<Array<MediaFile>>;
    getFilesByMimeType(mimeTypePrefix: string): Promise<Array<MediaFile>>;
    searchFilesByTag(tag: string): Promise<Array<MediaFile>>;
    getPublicFiles(): Promise<Array<MediaFile>>;
    listAllFolders(): Promise<Array<MediaFolder>>;
}
