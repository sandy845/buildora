import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Mock storage is disabled in production." }, { status: 404 });
  }
  // In development/test mock mode, accept the file stream and return 200 OK
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || "mock-file";
  console.info(`[mock-upload] Simulated S3/R2 direct upload for object: ${key}`);

  return new NextResponse(null, {
    status: 200,
    headers: {
      "ETag": `"mock-etag-${Date.now()}"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Mock storage is disabled in production." }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") || "mock-file";

  return NextResponse.json({
    status: "mock_file_available",
    key,
    message: "This is a simulated S3/R2 object for local development or testing.",
  });
}
