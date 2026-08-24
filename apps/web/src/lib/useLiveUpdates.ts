"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL, getToken } from "./api";

interface LiveUpdateEvent {
  campaignId?: string;
}

// Opens a single SSE connection while an admin is logged in and invalidates
// the relevant queries as soon as the server reports a change, so response
// counts and lists refresh live instead of waiting for the next poll.
export function useLiveUpdates(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const token = getToken();
    if (!token) return;

    const source = new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`);

    source.onmessage = (e) => {
      let event: LiveUpdateEvent;
      try {
        event = JSON.parse(e.data);
      } catch {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["donors"] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["brickSearch"] });
      queryClient.invalidateQueries({ queryKey: ["recipientStats"] });
      if (event.campaignId) {
        queryClient.invalidateQueries({ queryKey: ["recipients", event.campaignId] });
      }
    };

    return () => {
      source.close();
    };
  }, [enabled, queryClient]);
}
