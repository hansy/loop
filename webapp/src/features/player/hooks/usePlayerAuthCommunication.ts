"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import type { AuthResultPayload } from "./useAuthPageCommunication"; // Re-use from the auth page hook

// Message types expected from Auth Page
interface AuthPageReadyMessage {
  type: "AUTH_PAGE_READY";
  videoId?: string;
}

interface AuthResultMessage {
  type: "AUTH_RESULT";
  payload: AuthResultPayload;
}

type MessageFromAuthPage = AuthPageReadyMessage | AuthResultMessage;

// Payload for requesting authentication from the player to the auth page
interface RequestAuthenticationPayload {
  videoId: string;
  // any other relevant info the player wants to send
}

/**
 * Custom hook to manage postMessage communication for the video player (e.g., EmbeddedVideoContent).
 * It handles sending authentication requests and receiving results from an authentication window/iframe.
 *
 * @param authWindowOrigin The expected origin of the authentication window. This MUST be set for security.
 * @param videoId The ID of the video requiring authentication.
 * @param onAuthResult Callback triggered when an authentication result is received from the auth window.
 * @param onAuthPageReady Callback triggered when the auth page signals it's ready.
 *                        This can be used by the player to know when to send the auth request.
 * @returns An object containing:
 *  - `requestAuthentication`: Function to send an authentication request to the auth window.
 *  - `isLoading`: Boolean indicating if currently waiting for auth page to be ready or for auth result.
 */
export function usePlayerAuthCommunication(
  authWindowOrigin: string | null, // The specific origin of the auth window (e.g., window.location.origin if same-site)
  videoId: string,
  onAuthResult: (payload: AuthResultPayload) => void,
  onAuthPageReady?: () => void // Optional callback
) {
  const [isAuthProcessActive, setIsAuthProcessActive] = useState(false);
  const [hasAuthPageSignaledReady, setHasAuthPageSignaledReady] =
    useState(false);

  const authWindowRef = useRef<Window | null>(null); // To store the reference to the opened auth window

  const onAuthResultRef = useRef(onAuthResult);
  const onAuthPageReadyRef = useRef(onAuthPageReady);

  useEffect(() => {
    onAuthResultRef.current = onAuthResult;
  }, [onAuthResult]);

  useEffect(() => {
    onAuthPageReadyRef.current = onAuthPageReady;
  }, [onAuthPageReady]);

  useEffect(() => {
    if (!authWindowOrigin) {
      if (isAuthProcessActive) {
        // If an auth process was active but origin became null (e.g. window closed prematurely by other means)
        console.warn(
          "[usePlayerAuthCommunication] Auth window origin became null during active process."
        );
        onAuthResultRef.current?.({
          success: false,
          videoId,
          error: "Authentication window closed unexpectedly.",
        });
        setIsAuthProcessActive(false);
        setHasAuthPageSignaledReady(false);
      }
      return; // Do nothing if the origin isn't set
    }

    const handleMessage = (event: MessageEvent) => {
      // Crucial: Check the origin of the message
      if (event.origin !== authWindowOrigin) {
        // console.warn(
        //   `[usePlayerAuthCommunication] Message from unexpected origin: ${event.origin}. Expected ${authWindowOrigin}. Ignoring.`
        // );
        return;
      }

      // Ensure the message is from the specific window we opened, if a reference is held
      if (authWindowRef.current && event.source !== authWindowRef.current) {
        // console.warn(
        //   "[usePlayerAuthCommunication] Message not from the tracked auth window. Ignoring."
        // );
        return;
      }

      const message = event.data as MessageFromAuthPage;

      if (message?.type === "AUTH_PAGE_READY") {
        console.log(
          "[usePlayerAuthCommunication] Received AUTH_PAGE_READY from auth window.",
          message
        );
        setHasAuthPageSignaledReady(true);
        onAuthPageReadyRef.current?.();
        // No longer setting isLoading here, requestAuthentication will handle it.
      } else if (message?.type === "AUTH_RESULT") {
        console.log(
          "[usePlayerAuthCommunication] Received AUTH_RESULT from auth window:",
          message.payload
        );
        onAuthResultRef.current?.(message.payload);
        setIsAuthProcessActive(false); // Auth process (waiting for result) is now complete
        setHasAuthPageSignaledReady(false); // Reset for next potential auth attempt
        if (authWindowRef.current && !authWindowRef.current.closed) {
          // authWindowRef.current.close(); // Consider if auto-closing is desired
        }
        authWindowRef.current = null;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      // If the hook unmounts while an auth process was active, treat as failure.
      if (isAuthProcessActive) {
        onAuthResultRef.current?.({
          success: false,
          videoId,
          error: "Authentication process interrupted.",
        });
      }
    };
  }, [authWindowOrigin, videoId, isAuthProcessActive]); // Added isAuthProcessActive

  /**
   * Opens the authentication window and initiates the communication handshake.
   * @param authUrl - The URL for the authentication page.
   * @param windowTarget - The target for window.open (e.g., _blank, or a name).
   * @param windowFeatures - Features string for window.open.
   */
  const openAuthWindow = useCallback(
    (
      authUrl: string,
      windowTarget = "authWindow",
      windowFeatures = "width=500,height=600,scrollbars=yes"
    ) => {
      if (!authWindowOrigin) {
        console.error(
          "[usePlayerAuthCommunication] Cannot open auth window: authWindowOrigin is not set."
        );
        onAuthResultRef.current?.({
          success: false,
          videoId,
          error: "Configuration error: Auth origin not set.",
        });
        return null;
      }

      if (authWindowRef.current && !authWindowRef.current.closed) {
        authWindowRef.current.focus();
        console.warn(
          "[usePlayerAuthCommunication] Auth window already open. Focusing it."
        );
        // Optionally, resend AUTH_PAGE_READY or re-initiate logic if needed,
        // but current setup relies on auth page sending AUTH_PAGE_READY upon its load.
        return authWindowRef.current;
      }

      console.log(
        `[usePlayerAuthCommunication] Opening auth window at ${authUrl} with expected origin ${authWindowOrigin}`
      );
      setIsAuthProcessActive(true); // Indicate that we are starting an auth attempt
      setHasAuthPageSignaledReady(false);

      const newAuthWindow = window.open(authUrl, windowTarget, windowFeatures);
      authWindowRef.current = newAuthWindow;

      if (!newAuthWindow) {
        console.error(
          "[usePlayerAuthCommunication] Failed to open auth window. Pop-ups might be blocked."
        );
        onAuthResultRef.current?.({
          success: false,
          videoId,
          error: "Failed to open authentication window. Check pop-up blocker.",
        });
        setIsAuthProcessActive(false);
      }
      return newAuthWindow;
    },
    [videoId, authWindowOrigin]
  );

  /**
   * Sends a REQUEST_AUTHENTICATION message to the auth window.
   * Typically called after AUTH_PAGE_READY is received or when openAuthWindow is called and communication is established.
   */
  const requestAuthentication = useCallback(() => {
    if (!authWindowRef.current || authWindowRef.current.closed) {
      console.warn(
        "[usePlayerAuthCommunication] Auth window not available or closed. Cannot send REQUEST_AUTHENTICATION."
      );
      // Consider if this should trigger an error state for onAuthResult
      // onAuthResultRef.current?.({ success: false, videoId, error: "Auth window closed before request could be sent." });
      // setIsAuthProcessActive(false);
      return;
    }
    if (!authWindowOrigin) {
      console.error(
        "[usePlayerAuthCommunication] Cannot send request: authWindowOrigin is not set."
      );
      return;
    }

    const payload: RequestAuthenticationPayload = { videoId };
    console.log(
      "[usePlayerAuthCommunication] Sending REQUEST_AUTHENTICATION to auth window:",
      payload
    );
    authWindowRef.current.postMessage(
      { type: "REQUEST_AUTHENTICATION", payload },
      authWindowOrigin
    );
    // setIsAuthProcessActive(true); // Already set by openAuthWindow, or manage independently if requestAuth can be called separately
  }, [videoId, authWindowOrigin]);

  return {
    openAuthWindow,
    requestAuthentication,
    isLoading: isAuthProcessActive,
    hasAuthPageSignaledReady,
    authWindowRef,
  };
}
