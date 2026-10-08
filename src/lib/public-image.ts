import { existsSync, statSync } from "node:fs";
import path from "node:path";

/** Public path with mtime query so next/image cache updates when the file is replaced. */
export function versionedPublicSrc(publicPath: string): string | null {
  const relative = publicPath.replace(/^\//, "");
  const absolute = path.join(process.cwd(), "public", relative);
  if (!existsSync(absolute)) return null;
  const v = Math.floor(statSync(absolute).mtimeMs);
  return `/${relative}?v=${v}`;
}
