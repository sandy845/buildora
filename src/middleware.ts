import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "buildora_session";

type SessionPayload = {
  sessionId?: string;
  userId?: string;
  role?: "customer" | "admin";
  expiresAt?: number;
};

function base64urlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return atob(base64);
  } catch {
    return "";
  }
}

async function verifyTokenSignature(body: string, signature: string, secret: string): Promise<boolean> {
  if (!body || !signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signedBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const bytes = new Uint8Array(signedBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const computedSignature = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return computedSignature === signature;
  } catch {
    return false;
  }
}

async function getVerifiedSession(req: NextRequest): Promise<SessionPayload | null> {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const [body, signature] = cookie.split(".");
  if (!body || !signature) return null;

  const secret =
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "buildora_test_session_key_32_chars_minimum_length"
      : "");

  if (!secret) return null;

  const isValidSignature = await verifyTokenSignature(body, signature, secret);
  if (!isValidSignature) return null;

  try {
    const decoded = JSON.parse(base64urlDecode(body)) as SessionPayload;
    if (!decoded.userId || !decoded.role || !decoded.expiresAt) return null;
    if (decoded.expiresAt <= Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF / Origin protection on state-modifying API requests
  if (pathname.startsWith("/api/")) {
    const method = req.method.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host") || req.nextUrl.host;

      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          const allowedAppHost = process.env.NEXT_PUBLIC_APP_URL
            ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
            : null;

          const isAllowed =
            originHost === host ||
            (allowedAppHost !== null && originHost === allowedAppHost) ||
            (process.env.NODE_ENV !== "production" &&
              (originHost.startsWith("localhost:") ||
                originHost === "localhost" ||
                originHost.startsWith("127.0.0.1:")));

          if (!isAllowed) {
            return NextResponse.json(
              {
                success: false,
                error: "Cross-site request blocked: Origin mismatch.",
                code: "CSRF_ORIGIN_MISMATCH",
              },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid request origin.",
              code: "INVALID_ORIGIN",
            },
            { status: 403 }
          );
        }
      }
    }
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const session = await getVerifiedSession(req);
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "admin") {
      // Customer attempting to access admin portal
      return NextResponse.redirect(new URL("/client/dashboard", req.url));
    }
  }

  // Protect /client routes
  if (pathname.startsWith("/client")) {
    const session = await getVerifiedSession(req);
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/client/:path*",
    "/api/:path*",
  ],
};

