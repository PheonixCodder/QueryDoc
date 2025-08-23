import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  req: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", (await params).filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);

    return new Response(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": stat.size.toString(),
        "Content-Disposition": `inline; filename="${(await params).filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Error reading file" }, { status: 500 });
  }
}
