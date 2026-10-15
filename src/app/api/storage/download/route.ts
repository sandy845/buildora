import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { generatePresignedDownloadUrl } from "@/lib/storage";
import { canAccessProject } from "@/lib/services/shared";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter." }, { status: 400 });
    }

    const [documentVersion, designVersion] = await Promise.all([
      prisma.documentVersion.findFirst({
        where: { fileUrl: key, document: { deletedAt: null, project: { deletedAt: null } } },
        select: { document: { select: { project: { select: { customerId: true } } } } },
      }),
      prisma.designVersion.findFirst({
        where: { fileUrl: key, designAsset: { deletedAt: null, project: { deletedAt: null } } },
        select: { designAsset: { select: { project: { select: { customerId: true } } } } },
      }),
    ]);
    const customerId = documentVersion?.document.project.customerId
      ?? designVersion?.designAsset.project.customerId;
    if (!customerId) return NextResponse.json({ error: "File not found." }, { status: 404 });
    if (!canAccessProject(user, customerId)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const result = generatePresignedDownloadUrl(key, 3600);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      downloadUrl: result.url,
      expiresAt: result.expiresAt,
      isMock: result.isMock ?? false,
    });
  } catch (error) {
    console.error("[api/storage/download] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
