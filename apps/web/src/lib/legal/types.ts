export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdatedLabel: string;
  lastUpdatedISO: string;
  sections: LegalSection[];
};
