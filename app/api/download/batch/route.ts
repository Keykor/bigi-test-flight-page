import { get, list } from "@vercel/blob"
import { NextResponse } from "next/server"
import JSZip from "jszip"

export async function GET(): Promise<NextResponse> {
  try {
    const { blobs } = await list()

    if (blobs.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 404 })
    }

    const zip = new JSZip()

    await Promise.all(
      blobs.map(async (blob) => {
        try {
          const result = await get(blob.pathname, { access: "private" })
          if (result && result.statusCode === 200) {
            const reader = result.stream.getReader()
            const chunks: Uint8Array[] = []
            let done = false
            while (!done) {
              const { value, done: d } = await reader.read()
              if (value) chunks.push(value)
              done = d
            }
            const text = Buffer.concat(chunks.map(c => Buffer.from(c))).toString("utf-8")
            const filename = blob.pathname.split("/").pop() ?? blob.pathname
            zip.file(filename, text)
          }
        } catch (e) {
          console.error(`Failed to fetch ${blob.pathname}:`, e)
        }
      })
    )

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="experiments_${timestamp}.zip"`,
      },
    })
  } catch (error) {
    console.error("Error creating batch download:", error)
    return NextResponse.json({ error: "Failed to create batch download" }, { status: 500 })
  }
}
