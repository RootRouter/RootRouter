import Link from 'next/link';
import HeroSnapshotGraphs from '../components/HeroSnapshotGraphs';
import HowItWorksSection from '../components/HowItWorksSection';
import SurfacesSection from '../components/SurfacesSection';
import ProofSection from '../components/ProofSection';
import RoutingSection from '../components/RoutingSection';
import PrivacySection from '../components/PrivacySection';
import AuditSection from '../components/AuditSection';
import InstallSection from '../components/InstallSection';
import FAQAccordion from '../components/FAQAccordion';

export const metadata = {
  title: 'RootRouter — Cut AI agent context costs',
  description:
    'Trim 44% of the context your agents send — up to 95% on cold repo slices. Self-hosted proxy, MCP server and IRP routing for Cursor, Codex, Claude Code and any OpenAI-compatible agent.',
};

const problems = [
  {
    title: 'The thread grows. So does the bill.',
    desc: 'Every turn re-sends history the model does not need. Cost scales with the conversation, not with the task.',
  },
  {
    title: 'The repo is bigger than the task.',
    desc: 'Agents read everything to find three files, then pay for the other thousand.',
  },
  {
    title: 'Savings are unprovable.',
    desc: 'Nobody can show what context was sent, what was dropped, or what it cost. RootRouter logs it.',
  },
];

const footerLinks = [
  { href: 'https://github.com/RootRouter/RootRouter#readme', label: 'Docs', external: true },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/SKILL.md', label: 'SKILL.md' },
  { href: '/FENG-SHUI.md', label: 'Feng Shui' },
  { href: 'https://github.com/RootRouter/RootRouter', label: 'GitHub', external: true },
];

export default function HomePage() {
  return (
    <>
      <section className="landing-section landing-section-dark">
        <div className="landing-section-inner landing-two-col">
          <div>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--prism-violet)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.75rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Self-hosted · MIT · Any OpenAI-compatible agent
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                fontWeight: 600,
                color: 'var(--prism-text)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '1rem',
              }}
            >
              Your agents re-send everything. We fix that.
            </h1>
            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--prism-text-muted)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
                maxWidth: '32rem',
              }}
            >
              RootRouter cuts the context your agents send — 44% in our benchmark, up to 95% on cold repo slices —
              with one <code style={{ color: 'var(--prism-cyan)' }}>base_url</code> change or an MCP server for coding
              agents.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <Link href="#audit" className="landing-cta-primary">
                Get a free context audit
              </Link>
              <Link href="#install" className="landing-cta-secondary">
                Install in 5 minutes
              </Link>
            </div>
            <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.9rem', marginTop: '1rem' }}>
              Running in production on OpenClaw · No analytics, no phone-home.
            </p>
          </div>
          <div className="landing-hero-visual">
            <HeroSnapshotGraphs />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-panel" style={{ paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>
        <div className="landing-section-inner" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', margin: 0 }}>
            Works with Cursor · Codex · Claude Code · OpenClaw · any OpenAI-compatible API · MCP
          </p>
        </div>
      </section>

      <section className="landing-section landing-section-dark" id="product">
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
            Context is the bill nobody owns.
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
            Agents send the whole thread, the whole repo and every tool output. It costs money, buries the signal and
            leaves no evidence of what was sent.
          </p>
          <div className="landing-value-grid">
            {problems.map((p) => (
              <div key={p.title} className="landing-value-card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--prism-text)', marginBottom: '0.5rem' }}>
                  {p.title}
                </h3>
                <p style={{ color: 'var(--prism-text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--prism-text-dim)', fontSize: '0.95rem', textAlign: 'center', marginTop: '1.5rem' }}>
            RootRouter fixes the context layer. The model and the agent framework stay yours.
          </p>
        </div>
      </section>

      <HowItWorksSection />
      <SurfacesSection />
      <ProofSection />
      <RoutingSection />
      <PrivacySection />
      <AuditSection />
      <InstallSection />

      <section className="landing-section landing-section-dark">
        <div className="landing-section-inner">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
              fontWeight: 600,
              color: 'var(--prism-text)',
              marginBottom: '0.25rem',
            }}
          >
            FAQ
          </h2>
          <p style={{ color: 'var(--prism-text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            Cost, quality, data, and how it fits with the tools you already use.
          </p>
          <FAQAccordion />
        </div>
      </section>

      <section className="landing-section" style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="landing-section-inner">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.35rem, 2.4vw, 1.8rem)',
              fontWeight: 600,
              color: 'var(--prism-text)',
              marginBottom: '0.75rem',
            }}
          >
            Start with your own numbers.
          </h2>
          <p style={{ color: 'var(--prism-text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem', maxWidth: '34rem', margin: '0 auto 1.5rem' }}>
            One trace or one repo is enough to see what you are re-sending and what RootRouter would cut.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <Link href="#audit" className="landing-cta-primary">
              Get a free context audit
            </Link>
            <Link href="#install" className="landing-cta-secondary">
              Install in 5 minutes
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--prism-cyan)', textDecoration: 'none' }}>
            RootRouter
          </Link>
          <div className="landing-footer-links">
            {footerLinks.map(({ href, label, external }) => (
              <Link key={href} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: '0.95rem', color: 'var(--prism-text-dim)' }}>
            Self-hosted · MIT · No analytics
          </span>
        </div>
      </footer>
    </>
  );
}
