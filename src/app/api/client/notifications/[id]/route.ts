import { prisma } from "@/lib/db/prisma";
import {
  apiInternalError,
  apiNotFound,
  apiSuccess,
  requireRouteUser,
} from "@/lib/api";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;
  const { id } = await params;

  try {
    const notification = await prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    if (!notification.count) {
      return apiNotFound("Notification not found or already marked as read.");
    }

    return apiSuccess({ message: "Notification marked as read." });
  } catch (error) {
    return apiInternalError(error, "Unable to update notification.");
  }
}
