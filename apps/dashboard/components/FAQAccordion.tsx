'use client';

import { useState } from 'react';

type FAQItem = {
  question: string;
  answer: string;
};

const faqData: FAQItem[] = [
  {
    question: 'How much does it actually save?',
    answer:
      'In our 50-query benchmark: 43.9% fewer context tokens and 73% lower modeled cost at Claude-tier prices. A live 24-step, three-agent run showed 46% estimated context savings, and a cold repo slice can cut ~95% of the indexed corpus. Your number depends on how much history and how many files you send — the free audit estimates it on your traffic.',
  },
  {
    question: 'Does it change the answer quality?',
    answer:
      'RootRouter selects by relevance and removes redundancy with MMR inside a token budget; the current request and the most relevant context stay. It is not a guarantee. Every pick is logged in selections.jsonl so you can inspect what was kept and dropped, and you should measure on your own tasks.',
  },
  {
    question: 'Do you store my prompts?',
    answer:
      'RootRouter is self-hosted. The proxy and MCP server write a JSON context store on your machine, at a path you control. Nothing is sent to RootRouter servers. The model provider still receives the request you send, exactly as before.',
  },
  {
    question: 'Why not just use OpenRouter?',
    answer:
      'Different layer. OpenRouter chooses which provider or model API to call; RootRouter chooses what context gets sent. They stack: RootRouter trims the prompt, then the request goes to whichever provider you already use.',
  },
  {
    question: 'Does it add latency?',
    answer:
      'Selection runs locally and adds no extra LLM call. The proxy forwards the upstream stream unchanged; selection is milliseconds against multi-second completions.',
  },
  {
    question: 'Does it work with Cursor, Codex and Claude Code?',
    answer:
      'Yes, through MCP: index the repo once, then select a budgeted slice per task. For any OpenAI-compatible client, the proxy needs only a base_url change.',
  },
  {
    question: 'What is IRP and how does Antseed fit?',
    answer:
      'IRP is the Inference Routing Protocol. RootRouter can serve suggest-only rankings to marketplaces like Antseed: it ranks the buyer’s candidate models by task fit and expected cost and keeps zero state. See docs/irp.md for the endpoints and the privacy model.',
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={{ maxWidth: '720px' }}>
      {faqData.map((item, i) => (
        <div key={i} className="landing-accordion-item">
          <button
            type="button"
            className="landing-accordion-trigger"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            {item.question}
            <span className="landing-accordion-icon" aria-hidden>
              {openIndex === i ? '−' : '+'}
            </span>
          </button>
          {openIndex === i && (
            <div className="landing-accordion-panel">
              <div className="landing-accordion-content">{item.answer}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
