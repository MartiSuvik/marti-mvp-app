// Feature flags for the application
// Toggle these to enable/disable features

export const FEATURES = {
  // When true, users are redirected to waitlist after registration instead of the app
  WAITLIST_MODE: true,

  // Email domains that bypass waitlist mode and get full app access
  // Users with these email domains can access the app even in waitlist mode
  ADMIN_EMAIL_DOMAINS: ["scalingad.com"],
};

// Helper function to check if an email is whitelisted
export function isWhitelistedEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return FEATURES.ADMIN_EMAIL_DOMAINS.some(
    (allowedDomain) => domain === allowedDomain.toLowerCase()
  );
}
