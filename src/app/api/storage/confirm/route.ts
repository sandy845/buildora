import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { DocumentType, DesignAssetType } from "@/lib/types/models";
import { validateUpload, isValidStorageKey } from "@/lib/storage";
import { canAccessProject } from "@/lib/services/shared";
import {
  apiError,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  parseAndValidateJson,
  requireRouteUser,
  StorageConfirmRequestSchema,
} from "@/lib/api";

export async function POST(req: NextRequest) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const validation = await parseAndValidateJson(req, StorageConfirmRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const {
      projectId,
      key,
      fileName,
      fileUrl,
      fileSizeBytes,
      contentType,
      category,
      documentType,
      designAssetType,
      description,
    } = validation.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, customerId: true, name: true, deletedAt: true },
    });

    if (!project || project.deletedAt) {
      return apiNotFound("Project not found.");
    }

    if (!canAccessProject(user, project.customerId)) {
      return apiForbidden("You do not have permission to attach documents to this project.");
    }

    if (!isValidStorageKey(key, projectId)) {
      return apiError("Invalid or unsafe storage object key for this project.", 400);
    }
    if (fileUrl && !fileUrl.includes(key)) {
      return apiError("File URL does not match the storage object key.", 400);
    }

    const uploadValidation = validateUpload(contentType, fileSizeBytes, category, fileName);
    if (!uploadValidation.valid) {
      return apiError(uploadValidation.error, 400);
    }

    const finalUrl = key;

    if (category === "blueprint") {
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

      return apiSuccess({
        asset: {
          id: designAsset.id,
          name: designAsset.name,
          type: designAsset.type,
          version: 1,
          fileUrl: finalUrl,
        },
      });
    } else {
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

      return apiSuccess({
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
    return apiInternalError(error, "Failed to confirm file upload.");
  }
}
