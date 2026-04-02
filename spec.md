# Personal Media Vault

## Current State

- Full-stack media vault with ICP backend and React frontend
- Supports images, video, audio, PDF, 3D models (GLB/GLTF)
- Admin authenticated via Internet Identity
- Files stored with MIME type; blob URLs include filename/extension via `getBlobUrlWithFilename`
- Share pages at `/share/:fileId/:filename` with dynamic OG meta tags set by `setMetaTags()`
- `useActor.ts` STILL contains `_initializeAccessControlWithSecret` + `caffeineAdminToken` calls -- root cause of persistent admin/loading failures
- `index.html` has no base meta tags -- social crawlers (FB, Twitter) that don't execute JS get nothing
- MIME detection on upload uses `file.type || "application/octet-stream"` -- no extension fallback
- Share page has one Download button; no way to copy the raw media URL for inline platform embeds

## Requested Changes (Diff)

### Add
- Comprehensive extension-to-MIME lookup table in `mediaUtils.ts` for fallback MIME detection
- Base Open Graph and Twitter Card meta tags in `index.html` as static fallback for non-JS crawlers
- Full platform-specific OG tags in `setMetaTags()`: `og:image:secure_url`, `og:image:width`, `og:image:height`, `og:video:secure_url`, `og:video:width`, `og:video:height`, `og:audio:secure_url`, `og:locale`, `og:site_name`, `twitter:site`, Twitter player card (`twitter:card: player`) for video with `twitter:player` pointing to share URL
- "Copy media link" button on share page that copies the direct blob URL ending in the file extension (for Discord/Slack inline embed)
- `getMimeTypeFromFilename(filename)` utility that maps common extensions to MIME types

### Modify
- `useActor.ts`: Remove `_initializeAccessControlWithSecret` call and `caffeineAdminToken`/`getSecretParameter` import entirely
- `useFiles.ts` `uploadFile`: use `getMimeTypeFromFilename` as fallback when `file.type` is empty or `application/octet-stream`
- `setMetaTags()` in `SharePage.tsx`: expand to include all platform-specific tags listed above
- `index.html`: add static base OG/Twitter meta tags

### Remove
- `getSecretParameter` import from `useActor.ts`
- `_initializeAccessControlWithSecret` call from `useActor.ts`
- `adminToken` variable from `useActor.ts`

## Implementation Plan

1. Add `getMimeTypeFromFilename(filename): string` to `mediaUtils.ts` covering all file types the vault supports (images, video, audio, PDF, 3D, documents)
2. Update `useFiles.ts` to use the new MIME lookup as a fallback
3. Fix `useActor.ts` by removing all token-init code
4. Expand `setMetaTags()` in `SharePage.tsx` to cover all OG/Twitter/platform tags for maximum crawler compatibility
5. Add "Copy media link" button on share page
6. Add static base meta tags to `index.html`
