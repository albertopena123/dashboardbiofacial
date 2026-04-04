import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import { join, extname, resolve } from "node:path"
import { existsSync } from "node:fs"

// Only safe raster image formats — no SVG (can contain inline JS → XSS)
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
}

const UPLOADS_ROOT = resolve(process.cwd(), "uploads")

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params

  // Resolve and prevent path traversal
  const filePath = resolve(UPLOADS_ROOT, ...path)
  if (!filePath.startsWith(UPLOADS_ROOT)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const ext = extname(filePath).toLowerCase()
  if (!MIME_TYPES[ext]) {
    return new NextResponse("Unsupported file type", { status: 400 })
  }

  if (!existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const buffer = await readFile(filePath)
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME_TYPES[ext],
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
