import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardPageClient } from "@/components/dashboard-page-client";
import {
  normalizeShotgunToken,
  SHOTGUN_TOKEN_COOKIE_KEY,
} from "@/lib/shotgun";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = normalizeShotgunToken(
    cookieStore.get(SHOTGUN_TOKEN_COOKIE_KEY)?.value || ""
  );

  if (!token) {
    redirect("/");
  }

  return <DashboardPageClient />;
}
