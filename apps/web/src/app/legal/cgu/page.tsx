import type { Metadata } from "next";

import { LegalPageView } from "@/components/legal-page-view";
import { CGU_DOCUMENTS } from "@/lib/legal/cgu-content";

export const metadata: Metadata = {
  title: "CGU — ShotNotif",
  description: "Conditions générales d’utilisation du service ShotNotif.",
};

export default function CguPage() {
  return <LegalPageView documents={CGU_DOCUMENTS} />;
}
