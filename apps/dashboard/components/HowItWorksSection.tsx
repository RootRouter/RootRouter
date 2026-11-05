import Link from 'next/link';

const steps = [
  {
    n: '01',
    title: 'Point your agent at RootRouter',
    desc: 'Change one base_url, or add the MCP server. No rewrite, no SDK lock-in.',
  },
  {
    n: '02',
    title: 'RootRouter selects the smallest relevant slice',
    desc: 'History, repo chunks and tool output are ranked and cut to a token budget before they reach the model.',
  },
  {
    n: '03',
    title: 'Measure what it saved',
    desc: 'Tokens saved per request, a selection audit per task, and a dashboard when you want the detail.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="landing-section landing-section-gradient" id="how">
      <div className="landing-section-inner">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.35rem, 2.2vw, 1.65rem)',
            fontWeight: 600,
            color: 'var(--prism-text)',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          Three steps.
        </h2>
        <p
          style={{
            color: 'var(--prism-text-muted)',
            fontSize: '1.05rem',
            textAlign: 'center',
            maxWidth: '38rem',
            margin: '0 auto 2rem',
            lineHeight: 1.65,
          }}
        >
          The model and the agent stay the same. Only the context changes.
        </p>
        <div className="landing-value-grid">
          {steps.map((s) => (
            <div key={s.n} className="landing-value-card">
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--prism-violet)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                }}
              >
                STEP {s.n}
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  color: 'var(--prism-text)',
                  margin: '0.35rem 0 0.5rem',
                }}
              >
                {s.title}
              </h3>
              <p style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div
          className="holo-card-prism"
          style={{
            marginTop: '1.5rem',
            padding: '1.1rem 1.25rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            color: 'var(--prism-text-muted)',
            overflowX: 'auto',
          }}
        >
          <div style={{ color: 'var(--prism-cyan)', marginBottom: '0.35rem' }}># any OpenAI-compatible client</div>
          <div>base_url = &quot;http://localhost:8787/api/v1&quot;</div>
          <div style={{ color: 'var(--prism-text-dim)' }}>
            # then every /chat/completions is trimmed before it reaches the provider
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link
            href="https://github.com/RootRouter/RootRouter/blob/main/packages/proxy/README.md"
            className="landing-cta-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Proxy setup →
          </Link>
        </p>
      </div>
    </section>
  );
}
