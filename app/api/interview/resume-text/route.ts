import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_CHARS = 50_000;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const name = (file as File).name?.toLowerCase() ?? "";
    const buf = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buf.toString("utf-8");
    } else if (name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buf });
      try {
        const result = await parser.getText();
        text = result.text ?? "";
      } finally {
        await parser.destroy().catch(() => {});
      }
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result.value ?? "";
    } else {
      return NextResponse.json(
        { error: "Use PDF, DOCX, or TXT." },
        { status: 400 },
      );
    }

    text = text.replace(/\0/g, "").trim();
    if (!text.length) {
      return NextResponse.json(
        { error: "Could not read text from this file." },
        { status: 422 },
      );
    }

    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS);
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error("resume-text", e);
    return NextResponse.json(
      { error: "Failed to parse resume." },
      { status: 500 },
    );
  }
}
