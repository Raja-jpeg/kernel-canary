import { evaluateCanary } from "./canary";
import { createWorkersAI } from "workers-ai-provider";
import { callable, routeAgentRequest } from "agents";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import { convertToModelMessages, streamText } from "ai";

type CanaryState = { sampleLoaded: boolean };

export class ChatAgent extends AIChatAgent<Env, CanaryState> {
  initialState: CanaryState = { sampleLoaded: false };

  @callable()
  loadSampleRollout() {
    this.setState({ sampleLoaded: true });
  }
  maxPersistedMessages = 100;
  chatRecovery = true;
  waitForMcpConnections = false;

  async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
    const workersai = createWorkersAI({ binding: this.env.AI });

    const sample = this.state.sampleLoaded ? evaluateCanary(8, 12) : undefined;
    const rolloutContext = sample
      ? `Loaded sample rollout: network p99 latency went from 8 ms to 12 ms.
    The rule is to hold if the increase is more than 20%.
    Computed decision: ${sample.decision}.
    Increase: ${sample.increasePercent}%. Limit: ${sample.limitMs} ms.
    Canary is ${sample.aboveLimitMs} ms above the limit.
    Use these computed values as given when explaining this sample.`
      : "No sample is loaded. Ask the engineer to load it before answering questions about its results.";
    const result = streamText({
      model: workersai("@cf/zai-org/glm-4.7-flash", {
        sessionAffinity: this.sessionAffinity
      }),
      system: `You are Kernel Canary, an assistant for engineers reviewing a fictional
      Linux kernel rollout. For questions about the loaded sample, use the computed
      decision and numbers provided below. Describe latency as increasing when the
      canary value is higher than the baseline.

      Explain which rollout rule was breached and by how much. Label the threshold
      as a rollout policy. If asked what to check next, suggest one measurement to
      compare under matched traffic and explain what it could help test. Avoid
      claiming a root cause or a throughput change from latency alone.

      ${rolloutContext}`,
      // Keep legacy tool calls and files out of the model context.
      messages: await convertToModelMessages(
        this.messages
          .map((message) => ({
            ...message,
            parts: message.parts.filter(
              (part) => part.type === "text" && part.text.trim()
            )
          }))
          .filter((message) => message.parts.length > 0)
      ),
      abortSignal: options?.abortSignal
    });

    return result.toUIMessageStreamResponse();
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
