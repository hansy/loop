"use client";

import VideoPlayer from "./VideoPlayer";
import type { VideoMetadata } from "@/types";
import { useState, useEffect, useRef } from "react";
import type { SessionSigsMap } from "@lit-protocol/types";

// Basic definition for MediaSrc, adjust if a more specific type exists
type MediaSrc = string | undefined;

// Message types expected from Auth Page
interface AuthPageReadyMessage {
  type: "AUTH_PAGE_READY";
  videoId?: string;
}

interface AuthResultMessagePayload {
  success: boolean;
  videoId?: string;
  sessionSigs?: SessionSigsMap;
}
interface AuthResultMessage {
  type: "AUTH_RESULT";
  payload: AuthResultMessagePayload;
}

type MessageFromAuthPage = AuthPageReadyMessage | AuthResultMessage;

interface Props {
  metadata: VideoMetadata;
}

export default function EmbeddedVideoContent({ metadata }: Props) {
  const [_src, _setSrc] = useState<MediaSrc>(undefined); // TODO: Implement video source loading logic using _setSrc to display the video upon successful auth.
  const [isLoading, setIsLoading] = useState(false); // TODO: Manage loading state (e.g., when fetching video data or during auth) using _setIsLoading.
  const [isLocked, setIsLocked] = useState(true);
  const [sessionSigs, setSessionSigs] = useState<SessionSigsMap | undefined>(
    undefined
  );
  const authWindowRef = useRef<Window | null>(null);
  const initialRequestSentRef = useRef(false); // Flag to track if initial request was sent

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      // Ensure message is from the auth window we opened
      if (event.source !== authWindowRef.current) {
        // Optionally log ignored messages from other sources for debugging, then return
        // console.log("EmbeddedVideoContent: Ignoring message not from auth window", event.origin, event.data);
        return;
      }

      // We've confirmed the source is our authWindow, so we expect its origin
      // to be the same as the page we loaded into it.
      // No need for an explicit origin check here if event.source is strictly checked,
      // but if an origin check was desired, it would be against the authPageUrl's origin.

      console.log(
        "Player received message from auth page (source confirmed):",
        event.data
      );
      const message = event.data as MessageFromAuthPage; // Assumes MessageFromAuthPage is defined (AUTH_PAGE_READY | AUTH_RESULT)

      if (message?.type === "AUTH_PAGE_READY") {
        if (!initialRequestSentRef.current) {
          console.log(
            "Auth page is ready. Player sending initial REQUEST_AUTHENTICATION."
          );
          authWindowRef.current?.postMessage(
            {
              type: "REQUEST_AUTHENTICATION",
              payload: { videoId: metadata.id },
            },
            event.origin // Reply to the actual origin that sent AUTH_PAGE_READY
          );
          initialRequestSentRef.current = true;
        } else {
          console.log(
            "Auth page ready signal received again, but initial request already sent."
          );
        }
      } else if (message?.type === "AUTH_RESULT") {
        console.log("Received AUTH_RESULT:", message.payload);
        if (message.payload?.success && message.payload?.sessionSigs) {
          setSessionSigs(message.payload.sessionSigs);
          // TODO: Potentially call _setSrc here with the actual video URL
          // TODO: Potentially set _setIsLoading(false) if a loading process was started
        } else {
          console.warn("Authentication failed or no sessionSigs received.");
          // TODO: Potentially set _setIsLoading(false) if a loading process was started
        }
        setIsLoading(false);
        // if (authWindowRef.current && !authWindowRef.current.closed) {
        //   authWindowRef.current.close(); // Temporarily commented out for debugging
        // }
        initialRequestSentRef.current = false; // Reset for potential future auth attempts
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
      // Clean up: close auth window if component unmounts and window is still open
      if (authWindowRef.current && !authWindowRef.current.closed) {
        authWindowRef.current.close();
      }
    };
  }, [metadata.id]); // Dependencies: metadata.id for REQUEST_AUTHENTICATION

  const handleAuthenticate = () => {
    console.log("Authenticate clicked in EmbeddedVideoContent");
    setIsLoading(true);
    // TODO: Potentially set _setIsLoading(true) here
    initialRequestSentRef.current = false; // Reset flag each time auth is initiated

    const playerDomain = window.location.origin;
    const authPageUrl = `/videos/${
      metadata.id
    }/auth?playerOrigin=${encodeURIComponent(playerDomain)}`;

    if (authWindowRef.current && !authWindowRef.current.closed) {
      authWindowRef.current.close();
    }

    const newAuthWindow = window.open(
      authPageUrl,
      "authWindow",
      "width=500,height=600,scrollbars=yes"
    );
    authWindowRef.current = newAuthWindow;

    if (newAuthWindow) {
      newAuthWindow.focus();
    }
  };

  return (
    <>
      <VideoPlayer
        src={_src}
        poster={metadata.coverImage}
        title={metadata.title}
        isLoading={isLoading}
        isAuthenticated={!!sessionSigs}
        isLocked={isLocked}
        onPlay={() => {
          console.log("Video started playing");
        }}
        onPause={() => {
          console.log("Video paused");
        }}
        onEnded={() => {
          console.log("Video ended");
        }}
        onProfileClick={() => {
          console.log("Profile clicked");
        }}
        onAuthenticate={handleAuthenticate}
        onUnlockClick={() => {
          console.log("Unlock clicked - currently same as authenticate");
          handleAuthenticate();
        }}
      />
    </>
  );
}
