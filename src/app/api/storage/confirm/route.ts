import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { DocumentType, DesignAssetType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      key,
      fileName,
      fileUrl,
      fileSizeBytes,
      contentType,
      category = "document",
      documentType = "specification",
      designAssetType = "drawing",
      description,
    } = body;

    if (!projectId || !key || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, key, fileName." },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, customerId: true, name: true, deletedAt: true },
    });

    if (!project || project.deletedAt) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (user.role !== "admin" && project.customerId !== user.id) {
      return NextResponse.json({ error: "Forbidden. You do not have access to this project." }, { status: 403 });
    }

    const finalUrl = fileUrl || key;

    if (category === "blueprint") {
      // Validate or map designAssetType
      const validTypes = Object.values(DesignAssetType);
      const assetType: DesignAssetType = validTypes.includes(designAssetType as DesignAssetType)
        ? (designAssetType as DesignAssetType)
        : DesignAssetType.drawing;

      const designAsset = await prisma.designAsset.create({
        data: {
          project: { connect: { id: projectId } },
          name: fileName,
          type: assetType,
          description: description || `Uploaded by ${user.name} (${user.role})`,
          versions: {
            create: {
              version: 1,
              fileUrl: finalUrl,
              fileName,
              mimeType: contentType,
              fileSize: fileSizeBytes ? Math.round(fileSizeBytes) : undefined,
            },
          },
        },
        include: { versions: true },
      });

      // Log timeline activity event
      await prisma.activityEvent.create({
        data: {
          projectId,
          actorId: user.id,
          type: "created",
          entityType: "design_asset",
          entityId: designAsset.id,
          description: `Blueprint "${fileName}" uploaded by ${user.name}`,
          metadata: { fileName, category: "blueprint", version: 1, key },
        },
      });

      revalidatePath(`/client/projects/${projectId}`);
      revalidatePath(`/admin/dashboard`);

      return NextResponse.json({
        success: true,
        asset: {
          id: designAsset.id,
          name: designAsset.name,
          type: designAsset.type,
          version: 1,
          fileUrl: finalUrl,
        },
      });
    } else {
      // Document upload
      const validTypes = Object.values(DocumentType);
      const docType: DocumentType = validTypes.includes(documentType as DocumentType)
        ? (documentType as DocumentType)
        : DocumentType.specification;

      const document = await prisma.document.create({
        data: {
          project: { connect: { id: projectId } },
          name: fileName,
          type: docType,
          description: description || `Uploaded by ${user.name} (${user.role})`,
          versions: {
            create: {
              version: 1,
              fileUrl: finalUrl,
              fileName,
              mimeType: contentType,
              fileSize: fileSizeBytes ? Math.round(fileSizeBytes) : undefined,
            },
          },
        },
        include: { versions: true },
      });

      // Log timeline activity event
      await prisma.activityEvent.create({
        data: {
          projectId,
          actorId: user.id,
          type: "created",
          entityType: "document",
          entityId: document.id,
          description: `Document "${fileName}" uploaded by ${user.name}`,
          metadata: { fileName, category: "document", version: 1, key },
        },
      });

      revalidatePath(`/client/projects/${projectId}`);
      revalidatePath(`/admin/dashboard`);

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          name: document.name,
          type: document.type,
          version: 1,
          fileUrl: finalUrl,
        },
      });
    }
  } catch (error) {
    console.error("[api/storage/confirm] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
