export const INTRO_COOKIE = "aza-intro-seen";

// One year — this is a "have they ever seen the pre-auth intro" flag,
// not a session flag, so it should persist across app restarts.
export const INTRO_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
