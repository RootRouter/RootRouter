'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const deliverables = [
  'A token breakdown of a real request or repository.',
  'A sample of what RootRouter would keep, with the reason for each pick.',
  'An estimate of monthly savings, with the method written down.',
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.7rem',
  borderRadius: 'var(--prism-radius-sm)',
  border: '1px solid var(--prism-border)',
  background: 'rgba(0, 0, 0, 0.35)',
  color: 'var(--prism-text)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: 'var(--prism-text-dim)',
  marginBottom: '0.3rem',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.02em',
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function AuditSection() {
  const create = useMutation(api.auditRequests.create);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    stack: '',
    monthlyTokens: '',
    repoUrl: '',
    notes: '',
    website: '',
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      await create({
        email: form.email,
        stack: form.stack || undefined,
        monthlyTokens: form.monthlyTokens || undefined,
        repoUrl: form.repoUrl || undefined,
        notes: form.notes || undefined,
        website: form.website || undefined,
        source: 'landing',
      });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  function reset() {
    setForm({ email: '', stack: '', monthlyTokens: '', repoUrl: '', notes: '', website: '' });
    setStatus('idle');
    setError('');
  }

  return (
    <section className="landing-section landing-section-dark" id="audit">
      <div className="landing-section-inner landing-two-col">
        <div>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--prism-cyan)',
              fontFamily: 'var(--font-display)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Free audit
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 600,
              color: 'var(--prism-text)',
              marginBottom: '1rem',
              lineHeight: 1.25,
            }}
          >
            Get a free context audit.
          </h2>
          <p style={{ color: 'var(--prism-text-muted)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
            Send one agent trace or repository. You get a token breakdown, a sample of what RootRouter would keep, and
            an estimate of what it would save — with the method and the numbers.
          </p>
          <ul style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.7, paddingLeft: '1.1rem', marginBottom: '1rem' }}>
            {deliverables.map((d) => (
              <li key={d} style={{ marginBottom: '0.35rem' }}>{d}</li>
            ))}
          </ul>
          <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.9rem' }}>
            No commitment. One repo or one trace is enough. I run it myself.
          </p>
        </div>

        <div className="landing-hero-visual">
          <div className="holo-card-prism" style={{ padding: '1.5rem' }}>
            {status === 'sent' ? (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--prism-cyan)', marginBottom: '0.5rem' }}>
                  Request received.
                </h3>
                <p style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  I&apos;ll reply to <strong style={{ color: 'var(--prism-text)' }}>{form.email}</strong> with the token
                  breakdown and the estimate.
                </p>
                <button type="button" onClick={reset} className="landing-cta-secondary">
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle} htmlFor="audit-email">Email</label>
                  <input
                    id="audit-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@company.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle} htmlFor="audit-stack">What you run</label>
                    <input
                      id="audit-stack"
                      value={form.stack}
                      onChange={(e) => set('stack', e.target.value)}
                      placeholder="Cursor + Claude, OpenClaw…"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="audit-tokens">Monthly tokens or spend</label>
                    <input
                      id="audit-tokens"
                      value={form.monthlyTokens}
                      onChange={(e) => set('monthlyTokens', e.target.value)}
                      placeholder="40M tokens / $300"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle} htmlFor="audit-repo">Repo or trace link</label>
                  <input
                    id="audit-repo"
                    value={form.repoUrl}
                    onChange={(e) => set('repoUrl', e.target.value)}
                    placeholder="GitHub URL, gist, or 'can share privately'"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle} htmlFor="audit-notes">What costs the most?</label>
                  <textarea
                    id="audit-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Long refactors, big repos, repeated context…"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Honeypot: hidden from humans, filled by bots. */}
                <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden>
                  <label htmlFor="audit-website">Website</label>
                  <input
                    id="audit-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                  />
                </div>

                <button type="submit" className="landing-cta-primary" disabled={status === 'sending'} style={{ opacity: status === 'sending' ? 0.7 : 1 }}>
                  {status === 'sending' ? 'Sending…' : 'Request an audit →'}
                </button>
                {status === 'error' && (
                  <p style={{ color: 'var(--prism-amber)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
