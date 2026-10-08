"use server";

import { redirect } from "next/navigation";
import { logoutUser } from "@/lib/auth/server";

export async function logoutClient() {
  await logoutUser();
  redirect("/auth/login");
}
