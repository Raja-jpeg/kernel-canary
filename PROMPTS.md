## Development prompts and test results

### Debugging repeated model output

```text
can you see the responses of the model it is given gibberish like repeated words
```

### Continuing after the model fix

```text
perfect now it works, now what, please guide with the next steps
```

### Reviewing the updated model prompt

```text
I only changed the prompt, can you please check the response and guide with the next steps as well
```

### Verifying the rollout rule

I shared the following terminal output to confirm the expected results, including `Insufficient data` when the canary measurement was missing.

| Case | Decision | Increase (%) | Limit (ms) | Above limit (ms) |
| --- | --- | ---: | ---: | ---: |
| 0 | Pass | 10 | 12 | 0 |
| 1 | Pass | 20 | 12 | 0 |
| 2 | Hold | 50 | 9.6 | 2.4 |
| 3 | Insufficient data | | | |

### Confirming the sample rollout UI changes

```text
done with the mentioned changes
```

### Debugging the state type

```text
Property 'sampleLoaded' does not exist on type 'ChatAgent'.ts(2339)
any
```

### Confirming the rollout recall test

```text
done, I got the expected answer
```

### Investigating conversation isolation

```text
opening in incognito did not start afresh, it has old conversation
```

```text
two urls end in different random ids in incognito and normal browsing window
```

```text
incognito did not show isolation test result conversation
```

### Requesting cleanup and submission documentation

```text
can you please prompt to clean up and what the project should have in read me etc for the job application
```

## Assignment preparation and cleanup

```text
Prepare my existing Kernel Canary project for Cloudflare’s optional AI assignment. I’m applying for the Senior Linux Engineer role. Work in the current checkout. Inspect my changes first and preserve the working rollout rule, chat, and persistence.

Project behavior
- Kernel Canary helps an engineer review a Linux kernel canary rollout.
- The fictional sample compares network p99 latency of 8 ms on the baseline with 12 ms on the canary. The rule says to hold if latency rises by more than 20%.
- TypeScript computes HOLD, a 50% increase, a 9.6 ms limit, and 2.4 ms above the limit. Exactly 20% passes. Missing or invalid input returns Insufficient data.
- The model explains the computed result and suggests a concrete investigation. It should distinguish measured findings from hypotheses.
- Keep the working Workers AI model, GLM 4.7 Flash. Keep the Cloudflare Worker, AIChatAgent, and Durable Object. Preserve rollout and chat state across refreshes and the separate conversation IDs for different browsers.

Clean up the app
- Remove unused starter features from both the UI and the server: MCP controls and callable methods, weather, timezone, calculator, scheduling, and image attachments. Remove their unused imports and dependencies where safe.
- Keep the rollout panel, Load sample rollout button, chat, and clear loading and error states. Replace leftover starter branding, browser title, and example prompts with Kernel Canary content. Make the demo sequence obvious: load the sample, then ask why the rollout held.
- Keep the demo focused on fictional data. Do not add real infrastructure integrations or rollout execution.
- Check the current package scripts and run the available type check, build, and tests. Add focused tests for the rollout rule if they are missing: below threshold, exactly at threshold, above threshold, and missing or invalid data. Do not run npm audit fix --force.

Write README.md for the hiring reviewer
1. Start with a short description of the problem and what Kernel Canary does. Add the live demo URL if it has been verified. If it has not been deployed, leave the live link out and flag that in your handoff.
2. Add a 30-second demo. Click Load sample rollout, verify HOLD and the 50% increase, refresh, then ask “How far above the limit was the loaded sample?” The expected answer is 2.4 ms.
3. Map the four assignment requirements to the actual implementation: LLM, workflow or coordination, chat input, and memory or state. Name the model and Cloudflare components used.
4. Explain the engineering decision in a short paragraph. TypeScript evaluates the policy and calculates the numbers. The AI explains the result and suggests follow-up checks. Relate this to safe kernel release engineering.
5. Include reproducible setup, test, and deploy commands verified against the repo. Explain the Cloudflare login requirement for local Workers AI. Describe the project’s limits, including fictional metrics and anonymous demo sessions.
6. Link to PROMPTS.md. Credit the Cloudflare Agents starter and preserve its license notices.

At the end, tell me what changed, which checks passed, and what still needs testing. Do not deploy or push to GitHub during this cleanup.
```
