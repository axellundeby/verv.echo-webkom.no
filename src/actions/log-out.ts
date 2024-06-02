"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { lucia } from "@/server/auth/lucia";

export const logout = async () => {
  const { session } = await auth();

  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();

  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return redirect("/");
};
