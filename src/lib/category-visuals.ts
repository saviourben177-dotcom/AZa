import type { OpportunityCategory } from "@/lib/types";

/**
 * Since individual opportunities don't have their own photo, each category
 * gets one strong, consistent image. This keeps every Discover/listing card
 * photo-first (per the reference design) without needing a DB migration or
 * per-item image sourcing.
 *
 * Swap any URL below if a specific image ever needs replacing — it's a
 * single line, no schema change required.
 */
export const CATEGORY_IMAGE: Record<OpportunityCategory, string> = {
  scholarship:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  grant:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  hackathon:
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  fellowship:
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
  internship:
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  competition:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  job_gig:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80",
};

export const CATEGORY_EYEBROW: Record<OpportunityCategory, string> = {
  scholarship: "Scholarship",
  grant: "Grant",
  hackathon: "Hackathon",
  fellowship: "Fellowship",
  internship: "Internship",
  competition: "Competition",
  job_gig: "Job / Gig",
};
