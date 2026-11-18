import { evaluateCanary } from "./canary";
import { Suspense, useCallback, useState, useEffect, useRef } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import type { UIMessage } from "ai";
import type { ChatAgent } from "./server";
import { Button, InputArea, PoweredByCloudflare, Text } from "@cloudflare/kumo";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import {
  PaperPlaneRightIcon,
  StopIcon,
  TrashIcon,
  CircleIcon,
  MoonIcon,
  SunIcon,
  BrainIcon,
  CaretDownIcon
} from "@phosphor-icons/react";

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute("data-mode") === "dark"
  );

  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    const mode = next ? "dark" : "light";
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem("theme", mode);
  }, [dark]);

  return (
    <Button
      variant="secondary"
      shape="square"
      icon={dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      onClick={toggle}
      aria-label="Toggle theme"
    />
  );
}

function Chat() {
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [conversationId] = useState(() => {
    const key = "kernel-canary-conversation";
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  });
  const sample = evaluateCanary(8, 12);

  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const agent = useAgent<ChatAgent, ChatAgent["state"]>({
    agent: "ChatAgent",
    name: conversationId,
    onStateUpdate: (state) => setSampleLoaded(state.sampleLoaded),
    onOpen: useCallback(() => setConnected(true), []),
    onClose: useCallback(() => setConnected(false), [])
  });
  const { messages, sendMessage, clearHistory, stop, status, error } =
    useAgentChat({ agent, experimental_throttle: 100 });
  const askWhy = "Why did the loaded sample rollout hold?";
  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Re-focus the input after streaming ends
  useEffect(() => {
    if (connected && !isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [connected, isStreaming]);

  async function loadSample() {
    setLoadingSample(true);
    setSampleError(false);
    try {
      await agent.stub.loadSampleRollout();
    } catch {
      setSampleError(true);
    } finally {
      setLoadingSample(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text || !connected || isStreaming) return;
    setInput("");
    void sendMessage({ text });
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  return (
    <div className="flex flex-col h-dvh bg-kumo-elevated">
      <header className="px-5 py-4 bg-kumo-base border-b border-kumo-line">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-kumo-default">
              Kernel Canary
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <CircleIcon
                size={8}
                weight="fill"
                className={connected ? "text-kumo-success" : "text-kumo-danger"}
              />
              <Text size="xs" variant="secondary">
                {connected ? "Connected" : "Disconnected"}
              </Text>
            </div>
            <ThemeToggle />
            <Button
              variant="secondary"
              icon={<TrashIcon size={16} />}
              onClick={clearHistory}
            >
              Clear chat
            </Button>
          </div>
        </div>
      </header>

      <section
        aria-label="Sample rollout"
        className="border-b border-kumo-line bg-kumo-base px-5 py-3"
      >
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-sm text-kumo-default">
            Review a fictional Linux kernel rollout. Hold if network p99 latency
            rises by more than 20%.
          </p>
          <Button
            type="button"
            disabled={!connected || loadingSample}
            onClick={loadSample}
          >
            {loadingSample ? "Loading sample..." : "Load sample rollout"}
          </Button>
          {sampleError && (
            <p role="alert" className="mt-2 text-kumo-danger">
              Could not load the sample. Try again.
            </p>
          )}
          {sampleLoaded && (
            <output className="block mt-2 text-sm text-kumo-default">
              <strong>{sample.decision.toUpperCase()}</strong>
              {sample.increasePercent !== undefined &&
                sample.limitMs !== undefined &&
                sample.aboveLimitMs !== undefined && (
                  <>
                    {" · Network p99 latency increased "}
                    {sample.increasePercent.toFixed(0)}% (8 → 12 ms). Limit:{" "}
                    {sample.limitMs.toFixed(1)} ms. Above limit:{" "}
                    {sample.aboveLimitMs.toFixed(1)} ms.
                  </>
                )}
            </output>
          )}
        </div>
      </section>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="text-center">
              {sampleLoaded ? (
                <Button
                  variant="outline"
                  disabled={!connected || isStreaming}
                  onClick={() => void sendMessage({ text: askWhy })}
                >
                  {askWhy}
                </Button>
              ) : (
                <p className="text-sm text-kumo-default">
                  Load the sample rollout, then ask why it held.
                </p>
              )}
            </div>
          )}
          {messages.map((message: UIMessage, index: number) => {
            const isUser = message.role === "user";
            const isLastAssistant =
              message.role === "assistant" && index === messages.length - 1;

            return (
              <div key={message.id} className="space-y-2">
                {message.parts.map((part, i) => {
                  const key = `${message.id}-${i}`;

                  if (part.type === "reasoning") {
                    if (!part.text.trim()) return null;
                    const isDone = part.state === "done" || !isStreaming;
                    return (
                      <div key={key} className="flex justify-start">
                        <details className="max-w-[85%] w-full" open={!isDone}>
                          <summary className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm select-none">
                            <BrainIcon size={14} className="text-purple-400" />
                            <span className="font-medium text-kumo-default">
                              Reasoning
                            </span>
                            {isDone ? (
                              <span className="text-xs text-kumo-success">
                                Complete
                              </span>
                            ) : (
                              <span className="text-xs text-kumo-brand">
                                Thinking...
                              </span>
                            )}
                            <CaretDownIcon
                              size={14}
                              className="ml-auto text-kumo-inactive"
                            />
                          </summary>
                          <pre className="mt-2 px-3 py-2 rounded-lg bg-kumo-control text-xs text-kumo-default whitespace-pre-wrap overflow-auto max-h-64">
                            {part.text}
                          </pre>
                        </details>
                      </div>
                    );
                  }
                  if (part.type === "text") {
                    if (!part.text) return null;

                    if (isUser) {
                      return (
                        <div key={key} className="flex justify-end">
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-kumo-contrast text-kumo-inverse leading-relaxed">
                            {part.text}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-kumo-base text-kumo-default leading-relaxed">
                          <Streamdown
                            className="sd-theme rounded-2xl rounded-bl-md p-3"
                            plugins={{ code }}
                            controls={false}
                            isAnimating={isLastAssistant && isStreaming}
                          >
                            {part.text}
                          </Streamdown>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            );
          })}

          {isStreaming && (
            <output className="block text-sm text-kumo-default">
              Generating response...
            </output>
          )}
          {error && (
            <p role="alert" className="text-sm text-kumo-danger">
              Could not complete the response. Check the connection and try
              again.
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input */}
      <div className="border-t border-kumo-line bg-kumo-base">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="max-w-3xl mx-auto px-5 py-4"
        >
          <div className="flex items-end gap-3 rounded-xl border border-kumo-line bg-kumo-base p-3 shadow-sm focus-within:ring-2 focus-within:ring-kumo-ring focus-within:border-transparent transition-shadow">
            <InputArea
              ref={textareaRef}
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              aria-label="Ask about the rollout"
              placeholder={sampleLoaded ? askWhy : "Ask about the rollout..."}
              disabled={!connected || isStreaming}
              rows={1}
              className="flex-1 ring-0! focus:ring-0! shadow-none! bg-transparent! outline-none! resize-none max-h-40"
            />
            {isStreaming ? (
              <Button
                type="button"
                variant="secondary"
                shape="square"
                aria-label="Stop generation"
                icon={<StopIcon size={18} />}
                onClick={stop}
                className="mb-0.5"
              />
            ) : (
              <Button
                type="submit"
                variant="primary"
                shape="square"
                aria-label="Send message"
                disabled={!input.trim() || !connected}
                icon={<PaperPlaneRightIcon size={18} />}
                className="mb-0.5"
              />
            )}
          </div>
        </form>
        <div className="flex justify-center pb-3">
          <PoweredByCloudflare href="https://developers.cloudflare.com/agents/" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-kumo-inactive">
          Loading...
        </div>
      }
    >
      <Chat />
    </Suspense>
  );
}
