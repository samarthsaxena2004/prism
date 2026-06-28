"use client";
import { useCallback, useRef } from "react";

type SSEHandler = (event: Record<string, unknown>) => void;

/**
 * Thin SSE consumer hook.
 * InvestigationRoom handles SSE inline for fine-grained state control,
 * but this hook is available for simpler one-shot SSE reads.
 */
export function useSSE() {
  const abortRef = useRef<AbortController | null>(null);

  const connect = useCallback(async (url: string, body: unknown, onEvent: SSEHandler) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: abortRef.current.signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try { onEvent(JSON.parse(line.slice(6))); } catch { /* skip malformed */ }
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { connect, disconnect };
}
