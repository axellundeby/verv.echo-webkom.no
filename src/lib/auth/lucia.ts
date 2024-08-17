import { Lucia, Session, User } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../db/drizzle";
import { sessions, users, type User as DatabaseUser } from "../db/schemas";
import { cache } from "react";
import { cookies } from "next/headers";
import { Group } from "../constants";

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (user) => {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUser;
  }
}

export type AuthUser = User & {
  session: Session;
  groups: Array<Group>;
};

export const auth = cache(async (): Promise<AuthUser | null> => {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return null;
  }

  const result = await lucia.validateSession(sessionId);

  try {
    if (result.session && result.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }
    if (!result.session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }
  } catch {}

  if (!result.user) {
    return null;
  }

  const groups = await db.query.memberships
    .findMany({
      where: (membership, { eq }) => eq(membership.userId, result.user.id),
    })
    .then((res) => res.map((membership) => membership.groupId));

  return {
    ...result.user,
    session: result.session,
    groups,
  };
});
