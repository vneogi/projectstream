const DOCUMENT_EXT = [
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "odt",
  "odp",
  "rtf",
  "txt",
  "xls",
  "xlsx",
  "csv",
  "ods",
];

const IMAGE_EXT = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "tif",
  "tiff",
  "heic",
  "heif",
  "img",
];

export const MATERIAL_EXTENSIONS = [...DOCUMENT_EXT, ...IMAGE_EXT];

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function isAllowedMaterial(name: string, mime = ""): boolean {
  const ext = extensionOf(name);
  if (MATERIAL_EXTENSIONS.includes(ext)) return true;
  const type = mime.toLowerCase();
  return (
    type.startsWith("image/") ||
    type.includes("pdf") ||
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    type.includes("msword") ||
    type.includes("wordprocessingml") ||
    type.includes("spreadsheet") ||
    type.includes("excel")
  );
}

export function downloadLabel(fileName?: string): string {
  if (!fileName) return "file";
  const ext = extensionOf(fileName);
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === "pdf") return "PDF";
  if (ext === "ppt" || ext === "pptx" || ext === "odp") return "slides";
  if (ext === "doc" || ext === "docx" || ext === "odt" || ext === "rtf") {
    return "document";
  }
  if (ext === "xls" || ext === "xlsx" || ext === "csv" || ext === "ods") {
    return "spreadsheet";
  }
  return ext.toUpperCase() || "file";
}
