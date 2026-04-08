import { get, list } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const participantId = searchParams.get("participantId")
  const experimentId = searchParams.get("experimentId")

  if (!participantId) {
    return NextResponse.json({ error: "participantId is required" }, { status: 400 })
  }

  // Both IDs → single JSON file
  if (experimentId) {
    const pathname = `P${participantId}-E${experimentId}.json`
    try {
      const result = await get(pathname, { access: "private" })
      if (!result || result.statusCode !== 200) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }
      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${pathname}"`,
        },
      })
    } catch (error) {
      console.error("Error downloading blob:", error)
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
    }
  }

  // Only participantId → ZIP with all their experiments
  try {
    const { blobs } = await list({ prefix: `P${participantId}-E` })

    if (blobs.length === 0) {
      return NextResponse.json({ error: "No files found for this participant" }, { status: 404 })
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
            const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8")
            zip.file(blob.pathname.split("/").pop() ?? blob.pathname, text)
          }
        } catch (e) {
          console.error(`Failed to fetch ${blob.pathname}:`, e)
        }
      })
    )

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${participantId}-experiments.zip"`,
      },
    })
  } catch (error) {
    console.error("Error creating zip:", error)
    return NextResponse.json({ error: "Failed to download files" }, { status: 500 })
  }
}
