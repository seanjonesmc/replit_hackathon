/**
 * Thin model-call layer shared by the policy builder and the AI guard.
 *
 * Callers depend on the `ModelCaller` type, so tests can stub the model and
 * make no network calls. The default caller loads the Anthropic client lazily:
 * a missing integration then surfaces as a call failure (which every caller
 * turns into a parent review) instead of crashing the server at import time.
 */

/** Stronger model for the rarely run, accuracy-sensitive policy builder. */
export const POLICY_BUILDER_MODEL = "claude-sonnet-5-5";
/** Fast model for the guard, which runs while a purchase is being decided. */
export const GUARD_MODEL = "claude-haiku-5-5";

const MAX_TOKENS = 8192;

export interface ModelRequest {
  model: string;
  system: string;
  user: string;
  /**
   * In the purchase decision path: thinking off, low effort and no SDK
   * retries, so the caller's short timeout bounds the whole call.
   */
  latencySensitive: boolean;
  signal: AbortSignal;
}

/** Sends one system + user prompt and resolves with the model's text reply. */
export type ModelCaller = (request: ModelRequest) => Promise<string>;

export const callAnthropic: ModelCaller = async (request) => {
  const { anthropic } = await import("@workspace/integrations-anthropic-ai");
  const message = await anthropic.messages.create(
    {
      model: request.model,
      max_tokens: MAX_TOKENS,
      system: request.system,
      messages: [{ role: "user", content: request.user }],
      ...(request.latencySensitive
        ? { thinking: { type: "disabled" }, output_config: { effort: "low" } }
        : {}),
    },
    {
      signal: request.signal,
      ...(request.latencySensitive ? { maxRetries: 0 } : {}),
    },
  );
  return message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
};

export class ModelTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Model call timed out after ${timeoutMs}ms`);
    this.name = "ModelTimeoutError";
  }
}

/**
 * Runs one model call, aborting it and rejecting with ModelTimeoutError once
 * `timeoutMs` passes, whether or not the caller honours the abort signal.
 */
export async function callModelWithTimeout(
  callModel: ModelCaller,
  request: Omit<ModelRequest, "signal">,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ModelTimeoutError(timeoutMs));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      callModel({ ...request, signal: controller.signal }),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pulls the JSON object out of a model reply. Tolerates a Markdown code fence
 * or stray prose around the object; throws if no object parses.
 */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new SyntaxError("Model reply contains no JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Serialises untrusted data for a prompt. Escaping "<" keeps the JSON valid
 * while preventing values from closing the surrounding XML-style tag.
 */
export function toPromptJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}
