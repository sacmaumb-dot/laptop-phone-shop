import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { getRequestSubdomain } from "./tenant";

const SESSION_COOKIE = "shop_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  shopId: string | null;
  shopSubdomain: string | null;
  shopName: string | null;
};

export async function login(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { shop: true },
  });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return toSessionUser(user);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { shop: true },
  });
  if (!user || !user.active) return null;

  // Cross-tenant safety: if request comes via a subdomain that does NOT
  // match the user's shop, do not return a session — they should not see
  // another shop's data even if they have a valid cookie.
  const sub = await getRequestSubdomain();
  if (sub && user.shop && user.shop.subdomain !== sub) {
    // Superadmin can access any subdomain.
    if (user.role !== "superadmin") return null;
  }
  return toSessionUser(user);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Returns a session that has a valid shopId. Throws when:
 *  - not logged in
 *  - logged in but is a superadmin without an explicit shop context
 */
export async function requireShopSession(): Promise<
  SessionUser & { shopId: string }
> {
  const session = await requireSession();
  if (!session.shopId) {
    throw new Error("No shop context");
  }
  return session as SessionUser & { shopId: string };
}

function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  shopId: string | null;
  shop: { subdomain: string; name: string } | null;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    shopId: user.shopId,
    shopSubdomain: user.shop?.subdomain ?? null,
    shopName: user.shop?.name ?? null,
  };
}
