import { cookies } from "next/headers";

const cookieName = "pondi-polama-access";
const secureCookie = process.env.VERCEL === "1";

export function accessToken() {
  const passcode = process.env.TRIP_PASSCODE ?? "pondipolama";
  return Buffer.from(`pondi:${passcode}`).toString("base64url");
}

export async function hasAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value === accessToken();
}

export async function setAccessCookie() {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, accessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookie,
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  };
}
