# Personal Media Vault

## Current State
- Share URLs are `/share/:fileId` with no file extension
- Files are uploaded to blob storage with `Content-Type: application/octet-stream` hardcoded in StorageClient.ts, regardless of actual file type
- `useActor.ts` still calls `_initializeAccessControlWithSecret` on every actor creation, breaking admin access
- `getDirectURL()` returns a bare blob URL with no filename/extension in the path

## Requested Changes (Diff)

### Add
- `src/frontend/src/utils/blobMetadata.ts`: WeakMap-based registry to associate MIME type and filename with ExternalBlob instances before upload
- Second TanStack Router route `/share/$fileId/$filename` that renders the same SharePage

### Modify
- `StorageClient.ts`: `putFile(blobBytes, onProgress?, mimeType?)` -- use actual mimeType in fileHeaders instead of `application/octet-stream`; `getDirectURL(hash, filename?)` -- when filename provided, insert it as path segment `/v1/blob/<filename>?blob_hash=...` so URL ends with the extension
- `config.ts`: pass mimeType from `getBlobMimeType(file)` to `storageClient.putFile()`; in `downloadFile` pass filename from `getBlobFilename()` to `storageClient.getDirectURL()`
- `useFiles.ts`: after `ExternalBlob.fromBytes(bytes)`, call `setBlobMimeType(blob, file.type)` and `setBlobFilename(blob, file.name)`
- `App.tsx`: add `/share/$fileId/$filename` route using same SharePage component; update routeTree
- `MediaPreview.tsx`: change share URL from `/share/${file.id}` to `/share/${file.id}/${encodeURIComponent(file.name)}`
- `SharePage.tsx`: use `useParams({ strict: false })` to handle both route forms; update OG tag URLs to use the blob URL which now includes filename/extension in path
- `useActor.ts`: remove the `_initializeAccessControlWithSecret(adminToken)` call entirely

### Remove
- `_initializeAccessControlWithSecret` call from `useActor.ts`

## Implementation Plan
1. Create `blobMetadata.ts` with WeakMap registry for mimeType and filename
2. Modify `StorageClient.ts` to accept and use mimeType in putFile, and filename in getDirectURL (insert as path segment before query string)
3. Modify `config.ts` to use blobMetadata when uploading and downloading
4. Modify `useFiles.ts` to register mimeType and filename on blob before upload
5. Modify `App.tsx` to add the `/share/$fileId/$filename` route
6. Modify `MediaPreview.tsx` to include filename in share URL
7. Modify `SharePage.tsx` to use strict:false params and handle both route forms
8. Fix `useActor.ts` by removing `_initializeAccessControlWithSecret` call
