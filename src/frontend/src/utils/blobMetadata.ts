// WeakMap registry to associate MIME type and filename with ExternalBlob instances
const mimeTypes = new WeakMap<object, string>();
const filenames = new WeakMap<object, string>();

export function setBlobMimeType(blob: object, mimeType: string): void {
  mimeTypes.set(blob, mimeType);
}
export function getBlobMimeType(blob: object): string {
  return mimeTypes.get(blob) ?? "application/octet-stream";
}
export function setBlobFilename(blob: object, filename: string): void {
  filenames.set(blob, filename);
}
export function getBlobFilename(blob: object): string | undefined {
  return filenames.get(blob);
}
