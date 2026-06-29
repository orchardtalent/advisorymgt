import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Files live on a persistent disk volume. UPLOAD_DIR is set in production (mounted
// Coolify volume, e.g. /data/uploads); locally it defaults to ./uploads.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

function safeName(name: string) {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 120) || "file";
}

// Write bytes for an engagement; returns the storage key (path relative to UPLOAD_DIR).
export async function saveFile(engagementId: string, originalName: string, bytes: Buffer): Promise<string> {
  const dir = path.join(UPLOAD_DIR, engagementId);
  await fs.mkdir(dir, { recursive: true });
  const key = path.join(engagementId, `${crypto.randomBytes(8).toString("hex")}-${safeName(originalName)}`);
  await fs.writeFile(path.join(UPLOAD_DIR, key), bytes);
  return key.split(path.sep).join("/"); // store with forward slashes
}

function absolutePath(storageKey: string) {
  // Resolve and guard against path traversal outside UPLOAD_DIR.
  const abs = path.resolve(UPLOAD_DIR, storageKey);
  const root = path.resolve(UPLOAD_DIR);
  if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return abs;
}

export async function readFile(storageKey: string): Promise<Buffer> {
  return fs.readFile(absolutePath(storageKey));
}

export async function deleteFile(storageKey: string): Promise<void> {
  await fs.rm(absolutePath(storageKey), { force: true });
}
