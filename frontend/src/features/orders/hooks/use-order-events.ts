"use client";

import { useEffect, useState } from "react";
import { endpoints } from "@/shared/api/endpoints";
import { env } from "@/shared/config/env";
import type { OrderEventPayload } from "../types";

type UseOrderEventsOptions = {
  token: string | null;
  onOrderCreated?: (event: OrderEventPayload) => void;
  onOrderStatusChanged?: (event: OrderEventPayload) => void;
};

type ConnectionState = "idle" | "connecting" | "connected" | "error";

function parseSseMessage(message: string) {
  const lines = message.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  return {
    eventName,
    data: dataLines.join("\n"),
  };
}

function parseOrderEvent(data: string) {
  try {
    return JSON.parse(data) as OrderEventPayload;
  } catch {
    return null;
  }
}

export function useOrderEvents({
  token,
  onOrderCreated,
  onOrderStatusChanged,
}: UseOrderEventsOptions) {
  const [state, setState] = useState<ConnectionState>("idle");

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    async function connect() {
      setState("connecting");

      try {
        const response = await fetch(`${env.apiBaseUrl}${endpoints.orders.events}`, {
          cache: "no-store",
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed with status ${response.status}`);
        }

        setState("connected");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split("\n\n");
          buffer = messages.pop() ?? "";

          for (const message of messages) {
            const { eventName, data } = parseSseMessage(message);
            if (eventName === "connected") {
              continue;
            }

            const parsed = parseOrderEvent(data);
            if (!parsed) {
              continue;
            }

            if (eventName === "order-created") {
              onOrderCreated?.(parsed);
            }
            if (eventName === "order-status-changed") {
              onOrderStatusChanged?.(parsed);
            }
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setState("error");
        }
      }
    }

    connect();

    return () => {
      controller.abort();
    };
  }, [onOrderCreated, onOrderStatusChanged, token]);

  return { state };
}
