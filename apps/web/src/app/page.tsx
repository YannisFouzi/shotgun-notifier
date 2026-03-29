import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HomePageClient } from "@/components/home-page-client";
import {
  normalizeShotgunToken,
  SHOTGUN_TOKEN_COOKIE_KEY,
} from "@/lib/shotgun";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = normalizeShotgunToken(
    cookieStore.get(SHOTGUN_TOKEN_COOKIE_KEY)?.value || ""
  );

  if (token) {
    redirect("/dashboard");
  }

  return <HomePageClient />;
}
