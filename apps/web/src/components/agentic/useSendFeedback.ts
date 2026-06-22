"use client";

import { useEffect, useRef, useState } from "react";

export type SendFeedback = "idle" | "success" | "shake";

export function useSendFeedback(
  isSending: boolean,
  sendError?: boolean,
) {
  const [sendFeedback, setSendFeedback] = useState<SendFeedback>("idle");
  const prevSendingRef = useRef(isSending);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevSendingRef.current && !isSending) {
      if (sendError) {
        setSendFeedback("shake");
        sendTimerRef.current = setTimeout(() => setSendFeedback("idle"), 600);
      } else {
        setSendFeedback("success");
        sendTimerRef.current = setTimeout(() => setSendFeedback("idle"), 2000);
      }
    }
    prevSendingRef.current = isSending;
    return () => {
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    };
  }, [isSending, sendError]);

  return { sendFeedback, setSendFeedback };
}
