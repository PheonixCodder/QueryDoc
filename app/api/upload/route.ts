import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to /public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return public URL
    return NextResponse.json({
      file_key: fileName,
      file_name: file.name,
      file_url: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
