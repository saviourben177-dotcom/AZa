export interface GuideStep {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    key: "welcome",
    eyebrow: "Welcome",
    title: "Everything you need, in one place",
    body: "Aza brings opportunities, skills, ideas and business tools together — built for young people finding their next step. This quick tour covers the main things you can do.",
  },
  {
    key: "discover",
    eyebrow: "Discover",
    title: "Swipe through opportunities",
    body: "Scholarships, grants, hackathons, fellowships, internships and gigs — swipe right to save one for later, left to skip it. Everything is curator-checked before it's shown to you.",
  },
  {
    key: "cv",
    eyebrow: "CV Builder",
    title: "Build a CV in minutes",
    body: "Fill in your details once, then generate a polished CV — or tailor it automatically to a specific opportunity before you apply. Download it as a Word document whenever you need it.",
  },
  {
    key: "skills",
    eyebrow: "Growth Hub",
    title: "Track skills and learn for free",
    body: "Add skills you're building, track your progress, and find free courses and resources picked for your field.",
  },
  {
    key: "ideas",
    eyebrow: "Growth Hub",
    title: "Share ideas, find a team",
    body: "Post a business or project idea, get upvotes, and mark it as looking for collaborators — it'll show up in Team Finder so the right people can find you and ask to join.",
  },
  {
    key: "business",
    eyebrow: "Business Hub",
    title: "Tools to build your business",
    body: "Browse local businesses, use templates and calculators, find funding and incubators, or buy, sell and collaborate in the marketplace.",
  },
  {
    key: "profile",
    eyebrow: "Profile",
    title: "You're set — go explore",
    body: "Your profile keeps track of your CV, ideas, skills and join requests in one place. You can replay this guide anytime from Profile → App Guide.",
  },
];
