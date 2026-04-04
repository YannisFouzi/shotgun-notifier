"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { apiAdminStats } from "@/lib/api";
import { getOrganizerIdFromToken, readStoredShotgunToken } from "@/lib/shotgun";

const ADMIN_ORG_ID = process.env.NEXT_PUBLIC_ADMIN_ORG_ID || "";

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = readStoredShotgunToken();
    if (!token || !ADMIN_ORG_ID) return;
    const orgId = getOrganizerIdFromToken(token);
    setIsAdmin(orgId === ADMIN_ORG_ID);
  }, []);

  return isAdmin;
}

export function AdminUserCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    void apiAdminStats()
      .then((data) => setCount(data.stats.totalOrganizers))
      .catch(() => {});
  }, []);

  if (count === null) return null;

  return (
    <span className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-1 text-xs text-muted-foreground">
      <Users className="size-3" />
      {count}
    </span>
  );
}
