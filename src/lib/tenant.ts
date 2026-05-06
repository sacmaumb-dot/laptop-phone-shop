import { headers } from "next/headers";
import { prisma } from "./prisma";

// Hosts that should NEVER be treated as a tenant subdomain.
// Anything matching these is "root" — landing page / register / superadmin.
const ROOT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

const ROOT_DOMAINS = [
  "vercel.app", // any *.vercel.app deployment URL
  "trycloudflare.com",
  "ngrok.io",
  "ngrok-free.app",
];

const ROOT_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "mypos",
]);

/**
 * Extract subdomain from the incoming request Host header.
 *
 * Returns null when:
 *   - host is a known root (localhost, *.vercel.app, configured apex)
 *   - host has no subdomain (e.g. "mypos.app" — the apex)
 *   - subdomain is reserved (www, app, admin, api)
 *
 * Otherwise returns the lowercased subdomain (e.g. "shop-abc").
 */
export async function getRequestSubdomain(): Promise<string | null> {
  const h = await headers();
  const rawHost = h.get("x-forwarded-host") || h.get("host") || "";
  const host = rawHost.split(":")[0].toLowerCase();
  if (!host) return null;

  if (ROOT_HOSTS.has(host)) return null;

  // Treat *.vercel.app as a single root — Vercel doesn't give us per-tenant
  // subdomains for free. For dev/preview we run in single-domain mode.
  for (const rd of ROOT_DOMAINS) {
    if (host === rd) return null;
    if (host.endsWith("." + rd)) {
      // For *.vercel.app, the whole "<project>.vercel.app" is the root.
      // We treat anything with > 1 leading label as still root for safety.
      return null;
    }
  }

  const parts = host.split(".");
  if (parts.length < 3) return null; // apex like "mypos.app"

  const sub = parts[0];
  if (ROOT_SUBDOMAINS.has(sub)) return null;
  return sub;
}

/**
 * Resolve the active shop based on subdomain.
 * Returns null when no subdomain (root mode) or shop not found.
 */
export async function getShopFromSubdomain() {
  const sub = await getRequestSubdomain();
  if (!sub) return null;
  const shop = await prisma.shop.findUnique({ where: { subdomain: sub } });
  return shop;
}
