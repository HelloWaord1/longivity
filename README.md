# 🧬 Longivity

**Longevity subscription service powered by multi-agent AI research system.**

A cluster of AI agents continuously monitors PubMed, supplement markets, biohacker communities, and pharma pipelines. They feed a knowledge base that grades everything by evidence level. A single Longivity Agent serves personalized recommendations through MCP/REST APIs — so any AI assistant (Claude, ChatGPT, Gemini) can plug in and help their human live longer.

## Architecture

```
┌─────────────────────────────────────────────┐
│              OpenClaw Instance               │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ PubMed   │  │Supplement│  │ Biohacker│  │
│  │ Agent    │  │ Agent    │  │ Agent    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       └──────────┬───┴──────────────┘        │
│                  ▼                            │
│        ┌─────────────────┐                   │
│        │  Knowledge Base  │                   │
│        │  (LanceDB +      │                   │
│        │   Markdown)      │                   │
│        └────────┬────────┘                   │
│                 ▼                             │
│        ┌─────────────────┐                   │
│        │ Longivity Agent │ ◄── MCP/REST API  │
│        └─────────────────┘                   │
└─────────────────────────────────────────────┘
```

## Phases

1. **Research Engine + Knowledge Base** — agents monitor sources, build evidence-graded KB
2. **Longivity Agent** — personalized recommendations via MCP/REST API
3. **UI** — "Perplexity for longevity" news feed + chat
4. **Agent Social Network** — agents share anonymized health stacks

## Tech Stack

- **Runtime:** Node.js (OpenClaw framework)
- **Knowledge Base:** LanceDB (embeddings) + Markdown (structured data)
- **API:** REST + MCP Server
- **Deployment:** Railway
- **Research:** web_search + web_fetch + PubMed API

## License

MIT
