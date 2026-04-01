# Personal Media Vault

## Current State
Workspace is empty -- full rebuild from conversation history.

## Requested Changes (Diff)

### Add
- Full Personal Media Vault app with all previously established features (see Implementation Plan)
- Share page correctly reads `isPublic` flag from backend and displays file if public
- Admin is permanently linked to Internet Identity on first login (stable storage, survives upgrades)

### Modify
- Share toggle must actually persist `isPublic` flag in backend stable storage
- All backend share lookup functions must check the persisted `isPublic` field correctly

### Remove
- ALL token-based admin flows: `CAFFEINE_ADMIN_TOKEN`, `caffeineAdminToken`, `_initializeAccessControlWithSecret`, `forceClaimAdmin`
- "Claim Admin Access" button and all related UI
- Any URL fragment or query param related to admin tokens

## Implementation Plan

1. **Backend (Motoko)**
   - Stable var `adminPrincipal: ?Principal` -- set on first login, never reset
   - `claimAdminWithIdentity()`: sets adminPrincipal if not yet set, returns ok/err
   - `isAdmin(caller)`: returns true if caller == adminPrincipal, never traps
   - File metadata stored in stable HashMap: `fileId -> FileRecord { name, mimeType, blobHash, folderId, tags, isPublic, uploadedAt }`
   - `setFilePublic(fileId, isPublic)`: admin-only, updates isPublic in stable map, returns ok/err
   - `getPublicFile(fileId)`: returns file record if isPublic == true, else returns null
   - `listFiles(folderId?)`: admin-only, returns all files
   - `createFolder`, `listFolders`, `deleteFolder`
   - `deleteFile(fileId)`: admin-only, removes from stable map
   - Uses blob-storage for actual file data
   - Uses authorization component for role management

2. **Frontend**
   - Login page: Internet Identity sign-in only; on first login silently calls `claimAdminWithIdentity` and redirects to dashboard -- NO claim button, NO token UI
   - Dashboard: sidebar folder tree, file grid/list view, drag-and-drop upload with progress
   - File grid: thumbnails for images, icons for other types, file name, type badge
   - File detail dialog: preview (image/video/audio/PDF/3D GLB), share toggle, delete, download
   - Share toggle: calls `setFilePublic` and uses the returned result to confirm success -- no optimistic update
   - Blob URLs: always include filename+extension e.g. `/v1/blob/my-video.mp4?blob_hash=...`
   - Share page `/share/:fileId/:filename`: calls `getPublicFile`, renders preview + Open Graph meta tags
   - No admin token anywhere in URLs, state, or localStorage
