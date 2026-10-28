import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { siteUrl } from "@/lib/seo/site";

export function proxy(request: NextRequest) {
  const requestHost = request.headers.get("host")?.toLowerCase() ?? "";
  const canonical = new URL(siteUrl());
  const vercelEnv = serverEnv().VERCEL_ENV;

  if (
    vercelEnv === "production" &&
    requestHost !== "" &&
    requestHost !== canonical.host.toLowerCase()
  ) {
    const url = request.nextUrl.clone();
    url.protocol = canonical.protocol;
    url.host = canonical.host;
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();
  if (vercelEnv === "preview") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
