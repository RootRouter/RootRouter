const paths = [
  {
    name: 'Proxy',
    cmd: 'npx -p @rootrouter/proxy@beta rootrouter-proxy',
    note: 'Then set base_url to http://localhost:8787/api/v1',
    href: 'https://github.com/RootRouter/RootRouter/blob/main/packages/proxy/README.md',
  },
  {
    name: 'MCP',
    cmd: 'npx rootrouter@beta init cursor --project-store',
    note: 'Or: npx rootrouter@beta init codex --project-store',
    href: 'https://github.com/RootRouter/RootRouter/blob/main/packages/mcp/README.md',
  },
  {
    name: 'SDK',
    cmd: 'npm install rootrouter@beta',
    note: 'Programmatic context selection, routing and telemetry',
    href: 'https://github.com/RootRouter/RootRouter#readme',
  },
];

export default function InstallSection() {
  return (
    <section className="landing-section landing-section-panel" id="install">
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
          Install in five minutes.
        </h2>
        <p
          style={{
            color: 'var(--prism-text-muted)',
            fontSize: '1.05rem',
            textAlign: 'center',
            maxWidth: '36rem',
            margin: '0 auto 2rem',
            lineHeight: 1.65,
          }}
        >
          Self-hosted, MIT. No account, no dashboard required.
        </p>
        <div className="landing-value-grid">
          {paths.map((p) => (
            <div key={p.name} className="landing-value-card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--prism-text)', marginBottom: '0.5rem' }}>
                {p.name}
              </h3>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  color: 'var(--prism-cyan)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--prism-border)',
                  borderRadius: 'var(--prism-radius-sm)',
                  padding: '0.6rem 0.7rem',
                  overflowX: 'auto',
                  marginBottom: '0.6rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {p.cmd}
              </pre>
              <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '0.8rem' }}>{p.note}</p>
              <a href={p.href} className="landing-cta-secondary" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem' }}>
                Docs →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
