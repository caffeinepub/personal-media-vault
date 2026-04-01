# Personal Media Vault

## Current State
The backend uses `files.get(id).get(Runtime.trap("File does not exist"))` in every file/folder mutation operation. Because Motoko evaluates function arguments eagerly, `Runtime.trap(...)` always executes before `.get()` is called, causing every lookup to unconditionally trap. This affects: deleteFile, renameFile, moveFileToFolder, updateFileTags, toggleFilePublic, and renameFolder.

## Requested Changes (Diff)

### Add
- Nothing new.

### Modify
- Replace all `x.get(Runtime.trap("..."))` patterns in main.mo with `switch` expressions that only trap when the value is null.

### Remove
- Nothing removed.

## Implementation Plan
1. In main.mo, replace every instance of `something.get(Runtime.trap("..."))` with:
   ```motoko
   switch (something) { case (?v) v; case null Runtime.trap("...") }
   ```
2. Apply to: deleteFile, renameFile, moveFileToFolder, updateFileTags, toggleFilePublic, renameFolder.
