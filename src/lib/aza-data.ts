// Sample data for the preview. Replace with real queries when wired to a backend.
export type Person = { id: string; name: string; role?: string; location?: string; initials: string };

const peopleData = {
  ada: { id: "ada", name: "Adaeze Okafor", role: "Agritech founder", location: "Enugu", initials: "AO" },
  tunde: { id: "tunde", name: "Tunde Bakare", role: "Backend engineer", location: "Lagos", initials: "TB" },
  zainab: { id: "zainab", name: "Zainab Musa", role: "Product designer", location: "Kano", initials: "ZM" },
  kofi: { id: "kofi", name: "Kofi Mensah", role: "Logistics ops", location: "Accra", initials: "KM" },
  ife: { id: "ife", name: "Ifeoluwa Adeyemi", role: "Student, UNILAG", location: "Lagos", initials: "IA" },
};

export const people: Record<string, Person> & typeof peopleData = peopleData;
export const me: Person = peopleData.ife;
export const getPerson = (id: string): Person => people[id] ?? { id, name: "Member", initials: "?" };

export type Ask = "Seeking Co-Founder" | "Feedback Wanted" | "Looking for Beta Testers" | "Distribution Advice";

export type Comment = { id: string; author: string; body: string; hoursAgo: number; replies?: Comment[] };

export type Idea = {
  id: string;
  author: string;
  hoursAgo: number;
  ask: Ask;
  stage: string;
  pitch: string;
  upvotes: number;
  comments: Comment[];
};

export const ideas: Idea[] = [
  {
    id: "cold-chain",
    author: "ada",
    hoursAgo: 2,
    ask: "Seeking Co-Founder",
    stage: "Validating",
    pitch:
      "Tomato farmers around Enugu lose almost half their harvest before it reaches a market. I'm piloting solar-powered cold rooms that farmers rent by the crate, paid per day through USSD. Three cooperatives have signed letters of intent. I need a technical co-founder who can own the payments and booking side while I handle farmer relationships and the hardware.",
    upvotes: 48,
    comments: [
      {
        id: "c1",
        author: "kofi",
        hoursAgo: 1,
        body: "We tried crate-based pricing in Kumasi. Farmers preferred paying per kg because crates vary a lot in size. Worth testing both early.",
        replies: [
          { id: "c1r1", author: "ada", hoursAgo: 1, body: "That's really useful, thank you. Did weighing at the door slow things down much?" },
          { id: "c1r2", author: "kofi", hoursAgo: 0.5, body: "A little at first. A cheap hanging scale fixed most of it." },
        ],
      },
      { id: "c2", author: "tunde", hoursAgo: 0.3, body: "I've built USSD flows with Africa's Talking before. Happy to jump on a call this week." },
    ],
  },
  {
    id: "exam-prep",
    author: "ife",
    hoursAgo: 5,
    ask: "Looking for Beta Testers",
    stage: "Building",
    pitch:
      "A WhatsApp study buddy for JAMB candidates: daily past questions, explanations in plain English or Pidgin, and a weekly mock score you can share with your parents. First 200 students get it free while I tune the questions.",
    upvotes: 31,
    comments: [],
  },
  {
    id: "tailor-booking",
    author: "zainab",
    hoursAgo: 26,
    ask: "Feedback Wanted",
    stage: "Idea",
    pitch:
      "Tailors in Kano lose customers because measurements live on paper and fittings get double-booked. A simple booking page plus a saved measurement card per customer. Is this a real pain, or do tailors prefer things the way they are?",
    upvotes: 19,
    comments: [
      { id: "c3", author: "ada", hoursAgo: 20, body: "My aunt runs a shop. Double bookings during Sallah season are a nightmare, so yes, it's real." },
    ],
  },
  {
    id: "fuel-share",
    author: "kofi",
    hoursAgo: 50,
    ask: "Distribution Advice",
    stage: "Launched",
    pitch:
      "Small shops can now split a generator diesel delivery with neighbours on the same street. It's live on 4 streets in Accra. How do I reach market associations without paying a fortune for agents?",
    upvotes: 57,
    comments: [],
  },
];

export type Opportunity = {
  id: string;
  title: string;
  org: string;
  orgMark: string;
  verified: boolean;
  category: string;
  location: string;
  daysLeft: number;
  amount?: string;
  summary?: string;
  description?: string;
  eligibility?: string;
  applyUrl?: string;
  saved?: boolean;
};

export const opportunities: Opportunity[] = [
  { id: "o1", title: "Tony Elumelu Entrepreneurship Programme 2027", org: "TEF", orgMark: "TE", verified: true, category: "Grant", location: "Pan-African", daysLeft: 3, amount: "$5,000" },
  { id: "o2", title: "MTN Foundation Science & Tech Scholarship", org: "MTN Foundation", orgMark: "MT", verified: true, category: "Scholarship", location: "Nigeria", daysLeft: 6, amount: "₦200,000/yr" },
  { id: "o3", title: "Google Africa Developer Scholarship", org: "Google", orgMark: "G", verified: true, category: "Fellowship", location: "Remote", daysLeft: 18 },
  { id: "o4", title: "Lagos Climate Hackathon", org: "LSETF", orgMark: "LS", verified: false, category: "Hackathon", location: "Lagos", daysLeft: 9, amount: "₦5m prize pool" },
  { id: "o5", title: "Product Design Internship", org: "Paystack", orgMark: "PS", verified: true, category: "Internship", location: "Lagos · Hybrid", daysLeft: 24 },
  { id: "o6", title: "Youth Agripreneur Challenge", org: "AfDB", orgMark: "AD", verified: false, category: "Competition", location: "Pan-African", daysLeft: 41, amount: "$10,000" },
];

export function timeAgo(h: number) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ---- Secondary-screen sample data ----
export const opportunityDetails: Record<string, { description: string; eligibility: string; applyUrl: string; applicants: number }> = Object.fromEntries(
  opportunities.map((o) => [o.id, {
    description: `${o.title} supports young Africans with funding, mentorship and a peer network. Selected applicants join a cohort and receive structured support over the programme.`,
    eligibility: "Ages 18–35 · Resident in an eligible country · Early-stage idea or business",
    applyUrl: "https://example.com/apply",
    applicants: 120 + o.daysLeft * 7,
  }]),
);

export type BusinessListing = { id: string; name: string; mark: string; category: string; location: string; verified: boolean; rating: number; reviews: number; description: string; phone: string };
export const businesses: BusinessListing[] = [
  { id: "b1", name: "Mama Nkechi's Kitchen", mark: "MN", category: "Food", location: "Yaba, Lagos", verified: true, rating: 4.6, reviews: 38, description: "Home-style soups and swallow, delivered across Yaba and Surulere.", phone: "+234 803 000 0001" },
  { id: "b2", name: "Bright Solar Supplies", mark: "BS", category: "Fuel & energy", location: "Ikeja, Lagos", verified: true, rating: 4.2, reviews: 21, description: "Solar panels, inverters and installation for homes and shops.", phone: "+234 803 000 0002" },
  { id: "b3", name: "Danjuma Blocks", mark: "DB", category: "Building materials", location: "Kaduna", verified: false, rating: 3.9, reviews: 9, description: "Six- and nine-inch blocks, delivered within Kaduna metropolis.", phone: "+234 803 000 0003" },
];

export type Listing = { id: string; type: "Sell" | "Buy" | "Collaborate" | "Service"; title: string; price?: string; location: string; author: string; hoursAgo: number; body: string };
export const listings: Listing[] = [
  { id: "l1", type: "Sell", title: "Used chest freezer, 300L", price: "₦180,000", location: "Enugu", author: "ada", hoursAgo: 4, body: "Works perfectly, two years old. Moving to a cold room." },
  { id: "l2", type: "Collaborate", title: "Looking for a bakery to co-brand with", location: "Lagos", author: "zainab", hoursAgo: 30, body: "I design packaging. Want to partner with a small bakery on a new range." },
  { id: "l3", type: "Service", title: "USSD integration in a week", price: "From ₦250,000", location: "Remote", author: "tunde", hoursAgo: 52, body: "I build and host USSD menus with Africa's Talking." },
  { id: "l4", type: "Buy", title: "Need 50 bags of cement monthly", location: "Kaduna", author: "kofi", hoursAgo: 70, body: "Steady monthly order, looking for a fair supplier." },
];

export const incubators = [
  { id: "i1", name: "CcHUB", mark: "CC", location: "Lagos", focus: "Tech · Social impact", intake: "Rolling" },
  { id: "i2", name: "Ventures Platform", mark: "VP", location: "Abuja", focus: "Early-stage tech", intake: "March & September" },
  { id: "i3", name: "MEST Africa", mark: "ME", location: "Accra", focus: "Software founders", intake: "Annual" },
];

export const funding = [
  { id: "f1", name: "Bank of Industry Youth Fund", kind: "Loan", amount: "Up to ₦25m", note: "Single-digit interest for registered businesses" },
  { id: "f2", name: "LSETF Micro Loan", kind: "Loan", amount: "₦500k – ₦5m", note: "Lagos residents only" },
  { id: "f3", name: "Tony Elumelu Seed Capital", kind: "Grant", amount: "$5,000", note: "Non-refundable, pan-African" },
  { id: "f4", name: "Microtraction", kind: "Equity", amount: "$150,000", note: "Pre-seed, 7% equity" },
];

export const teamPosts = [
  { id: "cold-chain", name: "Cold-chain for tomato farmers", need: "Backend developer", where: "Enugu · Hybrid", members: 2, owner: "ada", roles: ["Backend developer", "Field operations"], commitment: "15 hrs/week", equity: "Equity on offer" },
  { id: "exam-prep", name: "WhatsApp JAMB tutor", need: "Content writer (Maths)", where: "Remote", members: 1, owner: "ife", roles: ["Maths content writer"], commitment: "5 hrs/week", equity: "Paid per set" },
  { id: "fuel-share", name: "Street diesel sharing", need: "Field sales lead", where: "Accra", members: 3, owner: "kofi", roles: ["Field sales lead"], commitment: "Full-time", equity: "Salary + equity" },
];

export const joinRequests = [
  { id: "r1", team: "Cold-chain for tomato farmers", from: "tunde", role: "Backend developer", status: "pending" as const, hoursAgo: 3, note: "I've shipped USSD and payments before." },
  { id: "r2", team: "WhatsApp JAMB tutor", from: "zainab", role: "Maths content writer", status: "accepted" as const, hoursAgo: 40, note: "Former maths tutor, happy to help." },
  { id: "r3", team: "Street diesel sharing", from: "ife", role: "Field sales lead", status: "declined" as const, hoursAgo: 90, note: "Weekends only." },
];

export const messages = [
  { id: "m1", author: "tunde", body: "Hi Adaeze, keen to help on payments. When's a good time to talk?", hoursAgo: 3 },
  { id: "m2", author: "ada", body: "Thanks Tunde! Thursday 4pm works. I'll send a calendar invite.", hoursAgo: 2 },
];

export const skills = [
  { id: "s1", name: "Product design", category: "Design", progress: 60 },
  { id: "s2", name: "Python basics", category: "Coding", progress: 25 },
  { id: "s3", name: "Bookkeeping", category: "Business", progress: 100 },
];

export const courses = [
  { id: "c1", title: "Google UX Design Certificate", provider: "Coursera", skill: "Design", free: true, hours: 20 },
  { id: "c2", title: "Python for Everybody", provider: "freeCodeCamp", skill: "Coding", free: true, hours: 14 },
  { id: "c3", title: "Bookkeeping for small businesses", provider: "LBS Online", skill: "Business", free: false, hours: 6 },
  { id: "c4", title: "Prompting with AI tools", provider: "DeepLearning.AI", skill: "AI", free: true, hours: 2 },
];

export const notifications = [
  { id: "n1", title: "Tony Elumelu closes in 3 days", body: "You saved this. Finish your application.", hoursAgo: 1, unread: true, to: "/opportunities/o1" },
  { id: "n2", title: "Tunde replied to your idea", body: "\"I've built USSD flows with Africa's Talking before…\"", hoursAgo: 3, unread: true, to: "/growth/ideas/cold-chain" },
  { id: "n3", title: "Join request accepted", body: "You're now on the WhatsApp JAMB tutor team.", hoursAgo: 40, unread: false, to: "/business/team-finder/my-requests" },
];

export const prices = [
  { id: "p1", product: "Rice (50kg bag)", category: "Food", price: 78000, change: 2.1 },
  { id: "p2", product: "Garri (paint bucket)", category: "Food", price: 3500, change: -1.4 },
  { id: "p3", product: "Petrol (per litre)", category: "Fuel & energy", price: 1050, change: 0 },
  { id: "p4", product: "Diesel (per litre)", category: "Fuel & energy", price: 1380, change: 3.2 },
  { id: "p5", product: "Cement (50kg)", category: "Building materials", price: 9200, change: 1.1 },
];

export const curatorQueue = [
  { id: "q1", kind: "Opportunity", title: "Lagos Climate Hackathon", by: "kofi", hoursAgo: 5 },
  { id: "q2", kind: "Business", title: "Danjuma Blocks", by: "tunde", hoursAgo: 20 },
  { id: "q3", kind: "Idea", title: "Street diesel sharing", by: "kofi", hoursAgo: 48 },
];

export const reports = [
  { id: "r1", type: "comment", content: "DM me for guaranteed 10x returns on crypto", reporter: "kofi", reported: "tunde", reason: "Spam or scam", hoursAgo: 2 },
  { id: "r2", type: "post", content: "Street diesel sharing — pay upfront to my personal account", reporter: "ada", reported: "kofi", reason: "False or misleading", hoursAgo: 9 },
  { id: "r3", type: "message", content: "You're useless, stop applying", reporter: "ada", reported: "tunde", reason: "Harassment or bullying", hoursAgo: 30 },
];
