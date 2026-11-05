const points = [
  {
    title: 'Your prompts stay with you',
    desc: 'The proxy and the MCP server run on your infrastructure. The provider still receives the request you send — RootRouter does not add a middleman.',
  },
  {
    title: 'Explicit storage',
    desc: 'Context lives in a JSON store whose path you set. There is no hosted database and no RootRouter account.',
  },
  {
    title: 'No tracking',
    desc: 'No analytics scripts, no phone-home. On-chain telemetry is optional and off by default.',
  },
];

export default function PrivacySection() {
  return (
    <section className="landing-section landing-section-panel" id="privacy">
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
          Self-hosted by design.
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
          Context is sensitive. RootRouter is software you run, not a service that collects your traffic.
        </p>
        <div className="landing-value-grid">
          {points.map((p) => (
            <div key={p.title} className="landing-value-card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--prism-text)', marginBottom: '0.5rem' }}>
                {p.title}
              </h3>
              <p style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a
            href="https://github.com/RootRouter/RootRouter/blob/main/docs/decisions/0001-product-shape.md"
            className="landing-cta-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the decision record →
          </a>
        </p>
      </div>
    </section>
  );
}
