const surfaces = [
  {
    name: 'Proxy',
    line: 'Zero-code context trimming.',
    desc: 'Point base_url at it. Every chat completion arrives trimmed, streamed and fail-open to the original request.',
    bestFor: 'Existing OpenAI-compatible agents',
    href: 'https://github.com/RootRouter/RootRouter/blob/main/packages/proxy/README.md',
    cta: 'Proxy docs',
  },
  {
    name: 'MCP',
    line: 'Only the files the task needs.',
    desc: 'Index a repository once, then select a budgeted slice per task with path filters and an audit log.',
    bestFor: 'Cursor, Codex, Claude Code',
    href: 'https://github.com/RootRouter/RootRouter/blob/main/packages/mcp/README.md',
    cta: 'MCP docs',
  },
  {
    name: 'IRP',
    line: 'Sell routing, not compute.',
    desc: 'Rank a buyer’s candidate models for one turn by task fit and expected cost. Stateless, no prompt storage.',
    bestFor: 'Inference marketplaces',
    href: 'https://github.com/RootRouter/RootRouter/blob/main/docs/irp.md',
    cta: 'IRP guide',
  },
];

export default function SurfacesSection() {
  return (
    <section className="landing-section landing-section-panel" id="surfaces">
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
          One engine, three surfaces.
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
          Same selection core. Pick the integration your agent already supports.
        </p>
        <div className="landing-value-grid">
          {surfaces.map((s) => (
            <div key={s.name} className="landing-value-card">
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--prism-violet)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {s.name}
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  color: 'var(--prism-text)',
                  margin: '0.35rem 0 0.5rem',
                }}
              >
                {s.line}
              </h3>
              <p style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                {s.desc}
              </p>
              <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.9rem', marginBottom: '0.9rem' }}>
                Best for: {s.bestFor}
              </p>
              <a
                href={s.href}
                className="landing-cta-secondary"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.9rem', display: 'inline-block' }}
              >
                {s.cta} →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
