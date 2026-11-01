import { NextRequest } from "next/server";
import { resendVerificationEmail } from "@/lib/auth/server";
import {
  apiError,
  apiInternalError,
  apiSuccess,
  parseAndValidateJson,
  ResendVerificationRequestSchema,
} from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const validation = await parseAndValidateJson(request, ResendVerificationRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await resendVerificationEmail(validation.data.email);
    if (result.error) {
      return apiError(result.error, 400);
    }

    return apiSuccess({ message: "Verification email resent successfully." });
  } catch (error) {
    return apiInternalError(error, "Unable to resend verification email.");
  }
}
