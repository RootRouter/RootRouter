export const AUDIT_EMAIL = 'hello@brahma101.cyou';

const mailto = `mailto:${AUDIT_EMAIL}?subject=${encodeURIComponent(
  'Free context audit'
)}&body=${encodeURIComponent(
  'What I run:\n- Agent / framework:\n- Model(s):\n- Approx. tokens per request:\n- Repo or trace to review (link or attach):\n\nWhat I want to understand:\n'
)}`;

const deliverables = [
  'A token breakdown of a real request or repository.',
  'A sample of what RootRouter would keep, with the reason for each pick.',
  'An estimate of monthly savings, with the method written down.',
];

export default function AuditSection() {
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
          <ul style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.7, paddingLeft: '1.1rem', marginBottom: '1.5rem' }}>
            {deliverables.map((d) => (
              <li key={d} style={{ marginBottom: '0.35rem' }}>{d}</li>
            ))}
          </ul>
          <a href={mailto} className="landing-cta-primary">
            Request an audit →
          </a>
          <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.9rem', marginTop: '0.9rem' }}>
            No commitment. One repo or one trace is enough. I run it myself.
          </p>
        </div>
        <div className="landing-hero-visual">
          <div
            className="holo-card-prism"
            style={{
              padding: '1.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.9,
              color: 'var(--prism-text-muted)',
            }}
          >
            <div style={{ color: 'var(--prism-cyan)', marginBottom: '0.5rem' }}>what to send</div>
            <div>1 · one trace (JSON) or repo URL</div>
            <div>2 · model(s) and monthly spend</div>
            <div>3 · the task that costs the most</div>
            <div style={{ marginTop: '0.9rem', color: 'var(--prism-text-dim)' }}>reply with: tokens in, tokens kept, estimated monthly saving</div>
          </div>
        </div>
      </div>
    </section>
  );
}
