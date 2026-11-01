import { NextRequest } from "next/server";
import { setSession } from "@/lib/auth/server";
import { getUser, updateUser } from "@/lib/db/data-access";
import {
  apiError,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  ClientUpdateProfileSchema,
  parseAndValidateJson,
  requireRouteUser,
} from "@/lib/api";

export async function GET() {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }

  return apiSuccess({
    name: guard.user.name,
    email: guard.user.email,
  });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const validation = await parseAndValidateJson(request, ClientUpdateProfileSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { name, phone } = validation.data;
    if (!name && !phone) {
      return apiError("Please provide at least one profile field to update.", 400);
    }

    const account = await getUser({ id: user.id });
    if (!account || account.deletedAt || account.accountStatus !== "active") {
      return apiNotFound("Your account profile could not be found. Please sign in again.");
    }

    const updateData: { name?: string; phone?: string } = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const updated = await updateUser({ id: user.id }, updateData);

    await setSession(user.id, user.role, account.email, updated.name || user.name);

    return apiSuccess({
      account: {
        name: updated.name,
        email: account.email,
        phone: updated.phone,
      },
    });
  } catch (error) {
    return apiInternalError(error, "Unable to update your profile.");
  }
}
