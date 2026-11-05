export default function RoutingSection() {
  const bullets = [
    'Task-aware: ranks by detected capabilities and difficulty, not just price.',
    'Cost-aware: expected_cost_usd per candidate, including cache-read pricing.',
    'Zero retention: no prompt storage, no upstream calls, no model hosting.',
  ];
  return (
    <section className="landing-section landing-section-panel" id="routing">
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
            On Antseed
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.35rem, 2.2vw, 1.75rem)',
              fontWeight: 600,
              color: 'var(--prism-text)',
              marginBottom: '1rem',
              lineHeight: 1.25,
            }}
          >
            Pick RootRouter as your routing service.
          </h2>
          <p style={{ color: 'var(--prism-text-muted)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
            RootRouter speaks IRP suggest-only: it ranks the candidates you allow for one turn by task fit and
            expected cost. It does not run inference, does not store prompts, and does not call upstream providers.
          </p>
          <ul style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.7, paddingLeft: '1.1rem', marginBottom: '1.5rem' }}>
            {bullets.map((b) => (
              <li key={b} style={{ marginBottom: '0.35rem' }}>{b}</li>
            ))}
          </ul>
          <a
            href="https://github.com/RootRouter/RootRouter/blob/main/docs/irp.md"
            className="landing-cta-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            How IRP works →
          </a>
        </div>
        <div className="landing-hero-visual">
          <div
            className="holo-card-prism"
            style={{
              padding: '1.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.8,
              color: 'var(--prism-text-muted)',
            }}
          >
            <div style={{ color: 'var(--prism-cyan)', marginBottom: '0.5rem' }}>irp · suggest-only</div>
            <div>GET&nbsp;&nbsp;/v1/routing/models</div>
            <div>POST /v1/routing/rank</div>
            <div style={{ marginTop: '0.75rem', color: 'var(--prism-text-dim)' }}>→ ranking + expected_cost_usd</div>
            <div style={{ color: 'var(--prism-text-dim)' }}>→ retention 0 · no prompt logs</div>
          </div>
        </div>
      </div>
    </section>
  );
}
