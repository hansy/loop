"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import type { AuthSig, SessionSigsMap } from "@lit-protocol/types";
import type { MediaSrc } from "@vidstack/react";

// Payload structure from the player when it requests authentication
export interface AuthRequestPayloadType {
  videoId?: string;
  // Add other fields if player sends more data in the future
}

// Structure of the message received from the player
interface RequestAuthenticationMessage {
  type: "REQUEST_AUTHENTICATION";
  payload: AuthRequestPayloadType;
}

// Add other potential message types from the player here
// type OtherPlayerMessageTypes = ... ;
type MessageFromPlayer = RequestAuthenticationMessage; // | OtherPlayerMessageTypes;

// Payload structure for sending auth result back to the player
export interface AuthResultPayload {
  success: boolean;
  videoId?: string;
  sessionSigs?: SessionSigsMap | null;
  litAuthSig?: AuthSig | null;
  playbackSrc?: MediaSrc | null;
  error?: string | null;
}

/**
 * Custom hook to manage postMessage communication for the authentication page (e.g., VideoAuthContent).
 * It handles sending readiness signals, receiving authentication requests, and sending results back.
 *
 * @param playerOrigin The expected origin of the player window/iframe.
 * @param videoIdFromParam The video ID known by the auth page (e.g., from URL params).
 * @param onAuthRequest Callback triggered when an authentication request is received from the player.
 *                      It receives the payload from the player.
 * @returns An object containing:
 *  - `sendAuthResult`: Function to send the authentication outcome back to the player.
 *  - `authRequestPayload`: The payload received from the player's authentication request.
 */
export function useAuthPageCommunication(
  playerOrigin: string | null,
  videoIdFromParam: string,
  onAuthRequest: (payload: AuthRequestPayloadType) => void
) {
  const [authRequestPayload, setAuthRequestPayload] =
    useState<AuthRequestPayloadType | null>(null);
  const authPageReadySentRef = useRef(false);
  const onAuthRequestRef = useRef(onAuthRequest);

  // Keep the onAuthRequest callback fresh
  useEffect(() => {
    onAuthRequestRef.current = onAuthRequest;
  }, [onAuthRequest]);

  // Effect to handle incoming messages from the player
  useEffect(() => {
    if (!playerOrigin) {
      console.warn(
        "[useAuthPageCommunication] Player origin not set, cannot listen for messages."
      );
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== playerOrigin) {
        console.warn(
          `[useAuthPageCommunication] Message from unexpected origin: ${event.origin}. Expected ${playerOrigin}. Ignoring.`
        );
        return;
      }

      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data
      ) {
        const message = event.data as MessageFromPlayer;

        if (message.type === "REQUEST_AUTHENTICATION") {
          console.log(
            "[useAuthPageCommunication] Received REQUEST_AUTHENTICATION:",
            message.payload
          );
          setAuthRequestPayload(message.payload || null);
          if (onAuthRequestRef.current) {
            onAuthRequestRef.current(message.payload || {});
          }
        } else {
          console.warn(
            "[useAuthPageCommunication] Received unknown message type:",
            message.type
          );
        }
      } else {
        console.warn(
          "[useAuthPageCommunication] Received malformed message data:",
          event.data
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [playerOrigin]);

  // Effect to send AUTH_PAGE_READY to the player
  useEffect(() => {
    if (playerOrigin && !authPageReadySentRef.current) {
      const target =
        window.opener || (window.parent !== window ? window.parent : null);
      if (target) {
        console.log(
          "[useAuthPageCommunication] Sending AUTH_PAGE_READY to player."
        );
        target.postMessage(
          { type: "AUTH_PAGE_READY", videoId: videoIdFromParam },
          playerOrigin
        );
        authPageReadySentRef.current = true;
      } else {
        console.warn(
          "[useAuthPageCommunication] No target window (opener/parent) found to send AUTH_PAGE_READY.",
          "Ensure this page was opened by the player."
        );
      }
    }
  }, [playerOrigin, videoIdFromParam]);

  /**
   * Sends the authentication result back to the player window.
   * @param payload - The AuthResultPayload containing success status, videoId, sessionSigs, etc.
   */
  const sendAuthResult = useCallback(
    (payload: AuthResultPayload) => {
      const target =
        window.opener || (window.parent !== window ? window.parent : null);
      if (target && playerOrigin) {
        const message = {
          type: "AUTH_RESULT",
          payload: {
            ...payload,
            // Ensure videoId from original request is included if not overridden
            videoId:
              payload.videoId ||
              authRequestPayload?.videoId ||
              videoIdFromParam,
          },
        };
        target.postMessage(message, playerOrigin);
        console.log("[useAuthPageCommunication] Sent AUTH_RESULT:", message);
      } else {
        console.warn(
          "[useAuthPageCommunication] Cannot send AUTH_RESULT: No target window or playerOrigin.",
          { hasTarget: !!target, hasPlayerOrigin: !!playerOrigin }
        );
      }
    },
    [playerOrigin, authRequestPayload, videoIdFromParam]
  );

  return { sendAuthResult, authRequestPayload };
}
