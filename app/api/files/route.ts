import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  try {
    const { blobs } = await list()
    const files = blobs.map((b) => ({
      pathname: b.pathname,
      url: b.url,
      size: b.size,
      uploadedAt: b.uploadedAt,
    }))
    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error listing blobs:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}
