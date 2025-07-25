// Simple in-memory storage shared across API routes
// In production, replace with a proper database
export const userDiscogsUsernames = new Map<string, string>();