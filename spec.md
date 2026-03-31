# Personal Media Vault

## Current State
New project. Empty Motoko backend stub. No frontend yet.

## Requested Changes (Diff)

### Add
- Full-stack personal cloud storage for all media types
- Authorization system (single admin user, password-protected)
- Blob storage integration for files of any size/type
- Folder/collection system to organize files
- Tags and metadata per file
- Search and filter (by name, type, tag, folder)
- Grid and list view modes
- Drag-and-drop + bulk upload with progress indicators
- Rename, move, delete operations
- In-app media preview: images, video, audio, PDF
- 3D model viewer (Three.js / React Three Fiber) for GLB/GLTF; fallback for OBJ/FBX/STL
- Public shareable URLs per file (toggleable)
- Public share pages with Open Graph meta tags (og:title, og:description, og:image, og:url, og:video, og:audio)
- Storage usage overview
- Dark-themed responsive UI

### Modify
- Replace empty Motoko stub with full backend

### Remove
- Nothing

## Implementation Plan
1. Select `authorization` and `blob-storage` Caffeine components
2. Generate Motoko backend:
   - File metadata store (id, name, mimeType, size, folderId, tags, isPublic, blobKey, createdAt)
   - Folder store (id, name, parentId)
   - Admin auth (single user via authorization component)
   - CRUD for files and folders
   - Public sharing toggle
   - Query: search/filter by name/type/tag/folder
3. Build React frontend:
   - Admin login page
   - Sidebar: folder tree + storage stats
   - Main area: grid/list file browser with search/filter bar
   - Drag-and-drop upload zone with progress
   - File action menu: rename, move, delete, toggle share
   - Media preview modal: image, video, audio, PDF, 3D
   - 3D viewer with React Three Fiber for GLB/GLTF
   - Public share page route with OG meta tag injection
   - Copy-to-clipboard for share links
