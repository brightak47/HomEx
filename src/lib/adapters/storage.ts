import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadDir = path.join(process.cwd(), "public", "uploads");

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function saveLocalUpload(file: File) {
  if (!allowed.has(file.type)) {
    throw new Error("Upload a JPG, PNG, WebP, MP4, or WebM file");
  }
  if (file.size > 80 * 1024 * 1024) {
    throw new Error("File must be under 80MB for the MVP upload");
  }

  await mkdir(uploadDir, { recursive: true });
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);
  return { url: `/uploads/${filename}`, filename, contentType: file.type };
}
