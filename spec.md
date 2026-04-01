# Personal Media Vault

## Current State
Workspace is empty -- full rebuild from conversation history.

## Requested Changes (Diff)

### Add
- Full personal cloud storage app with Internet Identity authentication
- File upload (images, video, audio, PDF, GLB/GLTF) with drag-and-drop and concurrent progress tracking
- Folder organization with sidebar tree
- Tags, search, and filter features
- Grid and list views with thumbnails and file type icons
- Public share pages at `/share/:fileId/:filename.ext` with Open Graph meta tags
- Blob URLs include filename and extension: `/v1/blob/filename.ext?blob_hash=...`
- Files stored with correct MIME type on upload
- 3D model viewer (Three.js / React Three Fiber) for GLB/GLTF files
- Admin silently claimed on first Internet Identity login, stored in `stable var adminPrincipal`

### Modify
- N/A (fresh build)

### Remove
- ALL token-based admin logic: `_initializeAccessControlWithSecret`, `forceClaimAdmin`, `CAFFEINE_ADMIN_TOKEN`, `caffeineAdminToken`
- "Claim Admin Access" button and all related UI
- Any URL hash fragments related to admin tokens

## Implementation Plan

1. **Backend (Motoko)**
   - `stable var adminPrincipal : ?Principal` -- first caller to `claimAdminWithIdentity` becomes permanent admin
   - `claimAdminWithIdentity()` -- silently sets admin on first login, idempotent for existing admin
   - `isAdmin(p: Principal) : Bool` -- returns false for unregistered, never traps
   - File metadata store: `fileId`, `name`, `mimeType`, `blobHash`, `size`, `folderId`, `tags`, `isPublic`, `createdAt`
   - `setFilePublic(fileId, isPublic)` -- admin only, persists the flag
   - `getPublicFile(fileId)` -- returns file if `isPublic = true`, else error
   - `listFiles`, `addFile`, `deleteFile`, `updateFile` -- admin CRUD
   - Folder management: `createFolder`, `listFolders`, `deleteFolder`
   - No token-based functions whatsoever

2. **Frontend**
   - Internet Identity login page -> silent `claimAdminWithIdentity` call -> dashboard
   - Dashboard: sidebar (folder tree), main area (grid/list toggle), search/filter bar
   - Upload: drag-and-drop zone, concurrent progress tracking, MIME type detection on client
   - File preview dialog: image, video, audio, PDF embed, 3D model viewer
   - Share toggle in file detail -> calls `setFilePublic` -> success/error toast
   - Share page at `/share/:fileId/:filename` -- calls `getPublicFile`, renders with OG meta tags
   - All blob URLs constructed as `/v1/blob/filename.ext?blob_hash=...`
   - No admin claim UI anywhere
   - Clean the URL hash -- never append `caffeineAdminToken` to any URL
