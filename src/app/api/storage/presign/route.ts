import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import {
  buildObjectKey,
  generatePresignedUploadUrl,
  isMockStorageAllowed,
  validateUpload,
} from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      fileName,
      contentType,
      fileSizeBytes,
      category = "document",
    } = body;

    if (!projectId || !fileName || !contentType || typeof fileSizeBytes !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: projectId, fileName, contentType, fileSizeBytes." },
        { status: 400 }
      );
    }

    if (category !== "document" && category !== "blueprint") {
      return NextResponse.json(
        { error: "Invalid category. Must be 'document' or 'blueprint'." },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, customerId: true, deletedAt: true },
    });

    if (!project || project.deletedAt) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (user.role !== "admin" && project.customerId !== user.id) {
      return NextResponse.json({ error: "Forbidden. You do not have access to this project." }, { status: 403 });
    }

    // Validate MIME type and file size limits
    const validation = validateUpload(contentType, fileSizeBytes, category, fileName);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Build unique object key
    const subfolder = category === "blueprint" ? "blueprints" : "documents";
    const objectKey = buildObjectKey(`projects/${projectId}`, subfolder, fileName);

    // Generate AWS S3 / Cloudflare R2 presigned PUT URL
    const result = generatePresignedUploadUrl(objectKey, contentType);
    if ("isMock" in result && result.isMock && !isMockStorageAllowed()) {
      return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      presignedUrl: result.url,
      key: result.key,
      expiresAt: result.expiresAt,
      isMock: result.isMock ?? false,
    });
  } catch (error) {
    console.error("[api/storage/presign] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
