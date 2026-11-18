# Kernel Canary

A Linux kernel canary can regress tail latency before the rollout reaches the
rest of the fleet. Kernel Canary evaluates a fictional network p99 latency
comparison against a release gate and lets an engineer ask what the result means
and what to investigate next.

## 30-second demo

1. Click **Load sample rollout**.
2. Verify **HOLD** and a **50%** increase in network p99 latency from **8 ms** to
   **12 ms**. The allowed increase is 20%, giving a **9.6 ms** limit.
3. Refresh the same browser tab and confirm that the loaded sample still appears.
4. Ask "How far above the limit was the loaded sample?" Expect **2.4 ms**.

## Assignment requirements

| Requirement              | Implementation                                                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LLM                      | Cloudflare Workers AI runs GLM 4.7 Flash (`@cf/zai-org/glm-4.7-flash`) using the Worker's `AI` binding.                                                                                                                                |
| Workflow or coordination | The Cloudflare Worker routes the browser to a Cloudflare Agents SDK `AIChatAgent`. The agent records the sample load, evaluates the policy with TypeScript for each chat turn, and streams an explanation using those computed values. |
| Chat input               | The React interface accepts text questions about the sample and streams replies.                                                                                                                                                       |
| Memory or state          | A SQLite-backed Durable Object stores the loaded flag and chat history. A UUID in browser local storage reconnects a browser profile to the same Durable Object after refresh. A fresh profile gets a separate conversation.           |

## Release decision

TypeScript evaluates the policy and calculates the increase, limit, and margin.
Exactly 20% passes. Higher increases hold, and missing or invalid measurements
produce **Insufficient data**. This keeps the release gate reproducible and
reviewable. The AI explains the result and suggests follow-up checks, such as
comparing TCP retransmission rates under matched traffic. A suspected cause
remains a hypothesis until measurements support it.

## Run locally

Use Node.js 24 and npm. From the project directory, run:

```sh
npm ci
npx wrangler login
npm run dev
```

Open the local URL printed by Vite. Wrangler needs a Cloudflare login because the
`AI` binding sends inference requests to Cloudflare even during local
development. [Workers AI binding documentation](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)

## Check and deploy

```sh
npm run check
npm test
npm run build
```

The check script runs the formatter check, linter, and TypeScript. The tests use
Node's built-in runner and require no Cloudflare account.

To deploy to your authenticated Cloudflare account, run:

```sh
npm run deploy
```

This builds the Vite app and runs Wrangler deploy using `wrangler.jsonc`.

## Demo limits

The app uses fictional data and performs no infrastructure operations. Sessions
are anonymous. The conversation UUID is a routing identifier, so use demo data
only. Clearing browser storage loses the browser's link to its session. The
**Clear chat** control clears chat history for the current session.

## Credits

See [PROMPTS.md](PROMPTS.md) for the development prompt log. Kernel Canary is
based on the [Cloudflare Agents starter](https://github.com/cloudflare/agents-starter)
and retains its [MIT license and copyright notice](LICENSE).
