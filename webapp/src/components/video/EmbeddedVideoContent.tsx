"use client";

import VideoPlayer from "./VideoPlayer";
import type { VideoMetadata } from "@/types";
import { useState, useEffect, useRef } from "react";
import type { SessionSigsMap } from "@lit-protocol/types";

// Basic definition for MediaSrc, adjust if a more specific type exists
type MediaSrc = string | undefined;

interface Props {
  metadata: VideoMetadata;
}

export default function EmbeddedVideoContent({ metadata }: Props) {
  const [src, setSrc] = useState<MediaSrc>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<SessionSigsMap | undefined>(
    undefined
  );
  const authWindowRef = useRef<Window | null>(null);
  const initialRequestSentRef = useRef(false); // Flag to track if initial request was sent

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (
        authWindowRef.current &&
        event.source !== authWindowRef.current &&
        event.source !== null
      ) {
        console.warn("Message received from unexpected source.", event.source);
        return;
      }
      if (event.source === null && authWindowRef.current?.closed) {
        console.log("Auth window was closed, ignoring message.");
        return;
      }

      const expectedAuthOrigin = new URL("/videos/", window.location.origin)
        .origin; // Base path for auth page
      // More robust check: allow any path under /videos/ for the auth page origin
      if (!event.origin.startsWith(expectedAuthOrigin)) {
        console.warn(
          `Message from unexpected origin: ${event.origin}. Expected to start with ${expectedAuthOrigin}`
        );
        return;
      }

      console.log("Player received message from auth page:", event.data);
      const messageData = event.data as { type?: string; payload?: any };
      if (messageData?.type === "AUTH_PAGE_READY") {
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
      } else if (messageData?.type === "AUTH_RESULT") {
        console.log("Received AUTH_RESULT:", messageData.payload);
        if (messageData.payload?.success && messageData.payload?.sessionSigs) {
          setSessionSigs(messageData.payload.sessionSigs);
          setIsLocked(false);
        } else {
          console.warn("Authentication failed or no sessionSigs received.");
        }
        setIsAuthenticating(false);
        if (authWindowRef.current && !authWindowRef.current.closed) {
          authWindowRef.current.close();
        }
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
    setIsAuthenticating(true);
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
        src={src}
        poster={metadata.coverImage}
        title={metadata.title}
        isLoading={isLoading || isAuthenticating}
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
