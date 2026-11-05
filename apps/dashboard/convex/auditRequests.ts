import { v } from 'convex/values';
import { mutation } from './_generated/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

/**
 * Store a free context audit request from the landing page.
 *
 * Public mutation by design (the form is anonymous). Honeypot + per-email
 * throttle keep the obvious bots out; the payload is length-capped.
 */
export const create = mutation({
  args: {
    email: v.string(),
    stack: v.optional(v.string()),
    monthlyTokens: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.optional(v.string()),
    /** Honeypot: humans never see or fill this. */
    website: v.optional(v.string()),
  },
  returns: v.union(v.id('auditRequests'), v.null()),
  handler: async (ctx, args) => {
    if (args.website && args.website.trim().length > 0) return null;

    const email = args.email.trim().toLowerCase();
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      throw new Error('Invalid email address');
    }

    // Same email twice within a minute: return the existing request.
    const recent = await ctx.db
      .query('auditRequests')
      .withIndex('by_email', (q) => q.eq('email', email))
      .order('desc')
      .first();
    if (recent && Date.now() - recent.createdAt < 60_000) return recent._id;

    const stack = clean(args.stack, 200);
    const monthlyTokens = clean(args.monthlyTokens, 100);
    const repoUrl = clean(args.repoUrl, 500);
    const notes = clean(args.notes, 2000);
    const source = clean(args.source, 100) ?? 'website';

    return await ctx.db.insert('auditRequests', {
      email,
      createdAt: Date.now(),
      source,
      ...(stack ? { stack } : {}),
      ...(monthlyTokens ? { monthlyTokens } : {}),
      ...(repoUrl ? { repoUrl } : {}),
      ...(notes ? { notes } : {}),
    });
  },
});
