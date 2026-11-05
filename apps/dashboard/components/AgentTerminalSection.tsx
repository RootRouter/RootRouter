'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';

type TabId = 'cursor' | 'codex' | 'claude' | 'openclaw' | 'http';

const codeCls = {
  kw: { color: 'var(--prism-violet)' },
  ty: { color: 'var(--prism-cyan)' },
  str: { color: 'var(--prism-amber)' },
  comment: { color: 'var(--prism-text-dim)', fontStyle: 'italic' as const },
};

const iconWrap: React.CSSProperties = { width: 18, height: 18, display: 'inline-flex', flexShrink: 0 };

function IconCursor() {
  return (
    <svg style={iconWrap} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#171717" />
      <path fill="#E8E8E8" d="M7.2 5.4 16.8 12l-5.1 1.4-2.2 5.2L7.2 5.4z" />
      <path fill="#A3A3A3" d="M11.7 13.4 16.8 12l-5.1 1.4z" />
    </svg>
  );
}

function IconCodex() {
  return (
    <svg style={iconWrap} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#10A37F" />
      <path
        fill="#fff"
        d="M12 5.2c-2.3 0-3.6 1.5-3.6 3.4 0 1.3.7 2.4 1.8 3.1-.9.6-1.5 1.6-1.5 2.8 0 2 1.5 3.3 3.3 3.3s3.3-1.3 3.3-3.3c0-1.2-.6-2.2-1.5-2.8 1.1-.7 1.8-1.8 1.8-3.1 0-1.9-1.3-3.4-3.6-3.4zm0 1.6c1.2 0 1.9.8 1.9 1.8S13.2 10.4 12 10.4s-1.9-.8-1.9-1.8.7-1.8 1.9-1.8zm0 6.2c1.1 0 1.8.7 1.8 1.7S13.1 16.4 12 16.4s-1.8-.7-1.8-1.7.7-1.7 1.8-1.7z"
      />
    </svg>
  );
}

function IconClaude() {
  return (
    <svg style={iconWrap} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#D97757" />
      <g fill="#fff">
        <rect x="11" y="5" width="2" height="14" rx="1" />
        <rect x="5" y="11" width="14" height="2" rx="1" />
        <rect x="7" y="7" width="2" height="10" rx="1" transform="rotate(45 8 12)" />
        <rect x="15" y="7" width="2" height="10" rx="1" transform="rotate(-45 16 12)" />
      </g>
    </svg>
  );
}

function IconOpenClaw() {
  return (
    <svg style={iconWrap} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#DC2626" />
      <path
        fill="#fff"
        d="M8 6.5c0 2.2-1.2 3.8-1.2 5.6 0 2.8 2.3 5 5.2 5s5.2-2.2 5.2-5c0-1.8-1.2-3.4-1.2-5.6-.9 1.1-2.2 1.8-4 1.8S8.9 7.6 8 6.5z"
      />
      <path fill="#FECACA" d="M10.2 16.2h3.6l-.7 2.3h-2.2z" />
    </svg>
  );
}

function IconHttp() {
  return (
    <svg style={iconWrap} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#1F2937" />
      <path fill="none" stroke="#5EEAD4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m7 9 3 3-3 3M12.5 15H17" />
    </svg>
  );
}

const tabs: { id: TabId; label: string; icon: () => ReactNode }[] = [
  { id: 'cursor', label: 'Cursor', icon: IconCursor },
  { id: 'codex', label: 'Codex', icon: IconCodex },
  { id: 'claude', label: 'Claude Code', icon: IconClaude },
  { id: 'openclaw', label: 'OpenClaw', icon: IconOpenClaw },
  { id: 'http', label: 'Any HTTP agent', icon: IconHttp },
];

function CursorPanel() {
  return (
    <pre style={{ margin: 0, padding: '1rem 1.25rem', overflowX: 'auto' }}>
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre' }}>
        <span style={codeCls.comment}># one-time, per repository</span>
        {'\n'}npx rootrouter@beta init cursor --project-store --project-agent-id my-project
        {'\n\n'}
        <span style={codeCls.comment}># then, in Cursor, the MCP tools do the work</span>
        {'\n'}index_repo(path=<span style={codeCls.str}>&quot;.&quot;</span>)
        {'\n'}select_context(query=<span style={codeCls.str}>&quot;slice + modules + anchor files&quot;</span>, tokenBudget=<span style={codeCls.ty}>2500</span>)
        {'\n\n'}
        <span style={codeCls.comment}># warm single-file change? edit directly, skip MCP</span>
      </code>
    </pre>
  );
}

function CodexPanel() {
  return (
    <pre style={{ margin: 0, padding: '1rem 1.25rem', overflowX: 'auto' }}>
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre' }}>
        <span style={codeCls.comment}># project-scoped MCP + AGENTS.md</span>
        {'\n'}npx rootrouter@beta init codex --project-store --write-agents-md
        {'\n\n'}
        <span style={codeCls.comment}># store</span>
        {'\n'}~/.rootrouter/<span style={codeCls.ty}>&lt;project-slug&gt;</span>/codex-store.json
        {'\n\n'}
        <span style={codeCls.comment}># config written to .codex/config.toml</span>
        {'\n'}[mcp_servers.rootrouter]
        {'\n'}command = <span style={codeCls.str}>&quot;node&quot;</span>
      </code>
    </pre>
  );
}

function ClaudePanel() {
  return (
    <pre style={{ margin: 0, padding: '1rem 1.25rem', overflowX: 'auto' }}>
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre' }}>
        <span style={codeCls.comment}>// .mcp.json at the project root</span>
        {'\n'}{'{'}
        {'\n  '}<span style={codeCls.str}>&quot;mcpServers&quot;</span>: {'{'}
        {'\n    '}<span style={codeCls.str}>&quot;rootrouter&quot;</span>: {'{'}
        {'\n      '}<span style={codeCls.str}>&quot;command&quot;</span>: <span style={codeCls.str}>&quot;npx&quot;</span>,
        {'\n      '}<span style={codeCls.str}>&quot;args&quot;</span>: [<span style={codeCls.str}>&quot;-p&quot;</span>, <span style={codeCls.str}>&quot;@rootrouter/mcp@beta&quot;</span>, <span style={codeCls.str}>&quot;rootrouter-mcp&quot;</span>],
        {'\n      '}<span style={codeCls.str}>&quot;env&quot;</span>: {'{'} <span style={codeCls.str}>&quot;ROOTROUTER_DEFAULT_AGENT_ID&quot;</span>: <span style={codeCls.str}>&quot;my-project&quot;</span> {'}'}
        {'\n    '}{'}'}
        {'\n  '}{'}'}
        {'\n'}{'}'}
        {'\n\n'}
        <span style={codeCls.comment}>// then: index_repo once, select_context per task</span>
      </code>
    </pre>
  );
}

function OpenClawPanel() {
  return (
    <pre style={{ margin: 0, padding: '1rem 1.25rem', overflowX: 'auto' }}>
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre' }}>
        <span style={codeCls.comment}># 1 · start the proxy</span>
        {'\n'}npx -p @rootrouter/proxy@beta rootrouter-proxy
        {'\n\n'}
        <span style={codeCls.comment}># 2 · point the OpenClaw provider at it</span>
        {'\n'}baseUrl = <span style={codeCls.str}>&quot;http://localhost:8787/api/v1&quot;</span>
        {'\n\n'}
        <span style={codeCls.comment}># 3 · optional: scope recall per agent</span>
        {'\n'}x-rootrouter-agent-id: openclaw:<span style={codeCls.ty}>&lt;project&gt;</span>
      </code>
    </pre>
  );
}

function HttpPanel() {
  return (
    <pre style={{ margin: 0, padding: '1rem 1.25rem', overflowX: 'auto' }}>
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre' }}>
        <span style={codeCls.comment}># any OpenAI-compatible client</span>
        {'\n'}base_url = <span style={codeCls.str}>&quot;http://localhost:8787/api/v1&quot;</span>
        {'\n\n'}
        <span style={codeCls.comment}># the response tells you what it saved</span>
        {'\n'}x-rootrouter-tokens-saved: <span style={codeCls.ty}>18422</span>
        {'\n\n'}
        <span style={codeCls.comment}># streaming is forwarded unchanged; failures fail open</span>
      </code>
    </pre>
  );
}

const panelByTab: Record<TabId, () => ReactNode> = {
  cursor: CursorPanel,
  codex: CodexPanel,
  claude: ClaudePanel,
  openclaw: OpenClawPanel,
  http: HttpPanel,
};

const filenameByTab: Record<TabId, string> = {
  cursor: 'cursor-mcp.sh',
  codex: 'codex-setup.sh',
  claude: '.mcp.json',
  openclaw: 'openclaw.sh',
  http: 'proxy.sh',
};

const descByTab: Record<TabId, string> = {
  cursor: 'MCP for cold slices and cross-module work: index once, then ask for a budgeted slice instead of the whole repo.',
  codex: 'Project-scoped MCP plus AGENTS.md. The same cold-slice workflow, wired into Codex.',
  claude: 'Drop the MCP server into .mcp.json. Same tools as Cursor, no rootrouter CLI required.',
  openclaw: 'Zero-code path: the proxy trims chat history on every completion, streams unchanged and fails open.',
  http: 'No MCP, no SDK. One base_url change and the request is trimmed before it reaches the provider.',
};

export default function AgentTerminalSection() {
  const [tab, setTab] = useState<TabId>('cursor');
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const Panel = panelByTab[tab];

  async function copy() {
    try {
      await navigator.clipboard.writeText(bodyRef.current?.innerText ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="landing-section landing-section-panel" id="install">
      <div className="landing-section-inner" style={{ maxWidth: '880px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.35rem, 2.2vw, 1.65rem)',
            fontWeight: 600,
            color: 'var(--prism-text)',
            marginBottom: '0.5rem',
          }}
        >
          Install for your agent.
        </h2>
        <p style={{ color: 'var(--prism-text-muted)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
          {descByTab[tab]}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            marginBottom: '1rem',
            padding: '0.35rem',
            borderRadius: '999px',
            border: '1px solid var(--prism-border)',
            background: 'rgba(0,0,0,0.25)',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  color: active ? 'var(--prism-text)' : 'var(--prism-text-muted)',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                }}
              >
                <Icon />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="holo-terminal-prism">
          <div className="holo-terminal-header">
            <div className="holo-terminal-dots">
              <span className="holo-terminal-dot holo-terminal-dot-red" aria-hidden />
              <span className="holo-terminal-dot holo-terminal-dot-amber" aria-hidden />
              <span className="holo-terminal-dot holo-terminal-dot-cyan" aria-hidden />
            </div>
            <span className="holo-terminal-filename">{filenameByTab[tab]}</span>
            <button
              type="button"
              onClick={copy}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid var(--prism-border)',
                borderRadius: 'var(--prism-radius-sm)',
                color: 'var(--prism-text-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div ref={bodyRef}>
            <Panel />
          </div>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--prism-text-dim)' }}>
          SDK: <code style={{ color: 'var(--prism-cyan)' }}>npm install rootrouter@beta</code> ·{' '}
          <Link
            href="https://github.com/RootRouter/RootRouter#readme"
            style={{ color: 'var(--prism-cyan)' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            full docs
          </Link>
        </p>
      </div>
    </section>
  );
}
