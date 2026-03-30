import type { Metadata } from "next";

import { LegalPageView } from "@/components/legal-page-view";
import { CGV_DOCUMENTS } from "@/lib/legal/cgv-content";

export const metadata: Metadata = {
  title: "CGV — ShotNotif",
  description: "Conditions générales de vente ShotNotif.",
};

export default function CgvPage() {
  return <LegalPageView documents={CGV_DOCUMENTS} />;
}
