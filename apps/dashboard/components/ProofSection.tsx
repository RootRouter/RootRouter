import { evidenceMetrics, headline, methodLabels, type EvidenceMethod } from '../lib/landing-metrics';

const methodColors: Record<EvidenceMethod, { bg: string; border: string; text: string }> = {
  audited: { bg: 'rgba(0, 255, 204, 0.12)', border: 'rgba(0, 255, 204, 0.35)', text: 'var(--prism-cyan)' },
  simulated: { bg: 'rgba(255, 180, 80, 0.12)', border: 'rgba(255, 180, 80, 0.35)', text: 'var(--prism-amber)' },
  'live-api': { bg: 'rgba(100, 140, 255, 0.12)', border: 'rgba(100, 140, 255, 0.35)', text: '#9eb8ff' },
};

export default function ProofSection() {
  return (
    <section className="landing-section landing-section-dark" id="proof">
      <div className="landing-section-inner">
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--prism-cyan)',
            fontFamily: 'var(--font-display)',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}
        >
          Evidence
        </p>
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
          Less context. Same answers.
        </h2>
        <p
          style={{
            color: 'var(--prism-text-muted)',
            fontSize: '1.05rem',
            lineHeight: 1.65,
            textAlign: 'center',
            maxWidth: '40rem',
            margin: '0 auto 2rem',
          }}
        >
          Measured, not promised. Every number below carries its baseline.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            maxWidth: '720px',
            margin: '0 auto 0.75rem',
          }}
        >
          <div className="landing-value-card" style={{ textAlign: 'center' }}>
            <div className="landing-stat-value" style={{ fontSize: '3rem' }}>{headline.tokens}</div>
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--prism-text)' }}>fewer context tokens</div>
          </div>
          <div className="landing-value-card" style={{ textAlign: 'center' }}>
            <div className="landing-stat-value" style={{ fontSize: '3rem' }}>{headline.cost}</div>
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--prism-text)' }}>lower modeled cost</div>
          </div>
        </div>
        <p
          style={{
            color: 'var(--prism-text-dim)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: '44rem',
            margin: '0 auto 2rem',
          }}
        >
          {headline.baseline}
        </p>

        <div className="landing-value-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {evidenceMetrics.map((m) => {
            const colors = methodColors[m.method];
            return (
              <div key={m.id} className="landing-value-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--prism-radius-sm)',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {methodLabels[m.method]}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--prism-text-dim)' }}>{m.path}</span>
                </div>
                <div className="landing-stat-value" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{m.value}</div>
                <div style={{ fontFamily: 'var(--font-display)', color: 'var(--prism-text)', marginBottom: '0.5rem' }}>{m.label}</div>
                <p style={{ color: 'var(--prism-text-muted)', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '0.5rem' }}>{m.detail}</p>
                {m.footnote && (
                  <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{m.footnote}</p>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a
            href="https://github.com/RootRouter/RootRouter/blob/main/docs/BENCHMARKS.md"
            className="landing-cta-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            How we measure →
          </a>
        </p>
      </div>
    </section>
  );
}
