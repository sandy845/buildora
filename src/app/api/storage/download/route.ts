import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generatePresignedDownloadUrl } from "@/lib/storage";

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
