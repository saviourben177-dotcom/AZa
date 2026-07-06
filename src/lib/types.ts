export type UserRole = "user" | "curator" | "admin";

export type OpportunityCategory =
  | "scholarship"
  | "grant"
  | "hackathon"
  | "fellowship"
  | "internship"
  | "competition"
  | "job_gig";

export type ProductCategory = "food" | "fuel_energy" | "building_materials";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  age: number | null;
  status: string[];
  status_other: string | null;
  field_of_interest: string | null;
  job_title: string | null;
  industry: string | null;
  business_description: string | null;
  freelance_skill: string | null;
  disability_or_health_note: string | null;
  highest_qualification: string | null;
  skilled_or_unskilled: string | null;
  region: string | null;
  exact_location: string | null;
  is_currently_learning: boolean | null;
  learning_context: string[];
  additional_notes: string | null;
  onboarding_completed: boolean;
  show_business_hub: boolean;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  org: string;
  category: OpportunityCategory;
  description: string;
  eligibility: string | null;
  deadline: string | null; // ISO date
  apply_url: string;
  location: string | null;
  remote: boolean;
  tags: string[];
  curator_verified: boolean;
  min_age: number | null;
  max_age: number | null;
  region: string | null;
  relevant_status: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Price {
  id: string;
  product_name: string;
  category: ProductCategory;
  unit: string | null;
  price_kobo: number;
  last_updated_by: string | null;
  last_updated_at: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  category: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedOpportunity {
  user_id: string;
  opportunity_id: string;
  saved_at: string;
}

export const OPPORTUNITY_CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  scholarship: "Scholarship",
  grant: "Grant",
  hackathon: "Hackathon",
  fellowship: "Fellowship",
  internship: "Internship",
  competition: "Competition",
  job_gig: "Job / Gig",
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  food: "Food",
  fuel_energy: "Fuel & Energy",
  building_materials: "Building Materials",
};

export function koboToNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isClosingSoon(dateStr: string | null): boolean {
  const days = daysUntil(dateStr);
  return days !== null && days >= 0 && days <= 7;
}

export interface BusinessTool {
  id: string;
  title: string;
  description: string | null;
  tool_type: "template" | "calculator" | "guide" | "checklist";
  url: string;
  category: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Incubator {
  id: string;
  name: string;
  description: string | null;
  focus_area: string | null;
  location: string | null;
  remote: boolean;
  application_url: string | null;
  deadline: string | null;
  curator_verified: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  stage: "idea" | "validation" | "building" | "launched";
  visibility: "public" | "private";
  upvotes_count: number;
  looking_for_collaborators: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdeaRole {
  id: string;
  idea_id: string;
  role_name: string;
  slots_needed: number;
  slots_filled: number;
  created_at: string;
}

export type JoinRequestStatus = "pending" | "accepted" | "declined";

export interface JoinRequest {
  id: string;
  idea_id: string;
  role_id: string;
  requester_id: string;
  message: string;
  portfolio_url: string | null;
  status: JoinRequestStatus;
  created_at: string;
  responded_at: string | null;
}

export interface TeamMessage {
  id: string;
  join_request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const IDEA_STAGE_LABELS: Record<Idea["stage"], string> = {
  idea: "Idea",
  validation: "Validation",
  building: "Building",
  launched: "Launched",
};

export type MarketplaceListingType = "sell" | "buy" | "collaborate" | "service";

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  listing_type: MarketplaceListingType;
  category: string | null;
  price_kobo: number | null;
  image_url: string | null;
  location: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  status: "active" | "sold" | "closed";
  created_at: string;
  updated_at: string;
}
