import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Get the filename from the query parameters
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    // Get the blob from the request
    const blob = await request.blob()

    // Upload to Vercel Blob
    const { url } = await put(filename, blob, {
      access: "public",
      contentType: "application/json",
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
