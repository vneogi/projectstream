import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getPostById } from "@/lib/data";
import { extractTextFromUpload } from "@/lib/extract-text";
import { isAllowedMaterial } from "@/lib/file-types";
import { limitOrRespond } from "@/lib/http-limit";
import { storePostMaterial } from "@/lib/store-material";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = limitOrRespond(request, "admin-material", 20, 10 * 60 * 1000);
  if (limited) return limited;

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!isAllowedMaterial(file.name, file.type)) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Upload a PDF, Word, slides, spreadsheet, or image.",
      },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storePostMaterial(post, file, buffer);
  if (!stored.ok) {
    return NextResponse.json({ error: stored.error }, { status: stored.status });
  }

  const parsed = extractTextFromUpload(file.name, file.type, buffer);

  return NextResponse.json({
    ok: true,
    fileName: file.name,
    filePath: stored.path,
    extractedText: parsed.text,
    parseNote: parsed.note,
  });
}
