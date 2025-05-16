"use client";

import VideoPlayer from "./VideoPlayer";
import type { VideoMetadata } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import type { SessionSigsMap, AuthSig } from "@lit-protocol/types";

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
  litAuthSig?: AuthSig | null;
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
  const [src, setSrc] = useState<MediaSrc>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<SessionSigsMap | undefined>(
    undefined
  );
  const [playerLitAuthSig, setPlayerLitAuthSig] = useState<
    AuthSig | null | undefined
  >(undefined);

  const authWindowRef = useRef<Window | null>(null);
  const initialRequestSentRef = useRef(false);

  const fetchVideoUrl = useCallback(async () => {
    if (!metadata.id) return;
    console.log(
      "Placeholder: fetchVideoUrl called. Would fetch with videoId:",
      metadata.id,
      "and LitAuthSig:",
      playerLitAuthSig
    );
    if (playerLitAuthSig) {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSrc(`simulated_playback_url_for_${metadata.id}`);
      setIsLoading(false);
    } else if (!playerLitAuthSig && sessionSigs) {
      console.log(
        "Authenticated, but no direct LitAuthSig for video playback received."
      );
    }
  }, [metadata.id, playerLitAuthSig, sessionSigs]);

  useEffect(() => {
    if (playerLitAuthSig) {
      fetchVideoUrl();
    }
  }, [playerLitAuthSig, fetchVideoUrl]);

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.source !== authWindowRef.current) {
        return;
      }

      console.log(
        "Player received message from auth page (source confirmed):",
        event.data
      );
      const message = event.data as MessageFromAuthPage;

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
            event.origin
          );
          initialRequestSentRef.current = true;
        } else {
          console.log(
            "Auth page ready signal received again, but initial request already sent."
          );
        }
      } else if (message?.type === "AUTH_RESULT") {
        setIsLoading(false);
        console.log("Received AUTH_RESULT:", message.payload);
        if (message.payload?.success && message.payload?.sessionSigs) {
          setSessionSigs(message.payload.sessionSigs);
          setPlayerLitAuthSig(message.payload.litAuthSig);

          if (message.payload.litAuthSig) {
            console.log(
              "AUTH_RESULT: Success with LitAuthSig. Video should unlock."
            );
          } else {
            console.log(
              "AUTH_RESULT: Success but no LitAuthSig (access denied or not applicable)."
            );
          }
        } else {
          console.warn("Authentication failed or no sessionSigs received.");
        }
        setIsLoading(false);
        initialRequestSentRef.current = false;
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
      // if (authWindowRef.current && !authWindowRef.current.closed) {
      //   authWindowRef.current.close(); // Temporarily commented out for debugging
      // }
    };
  }, [metadata.id, fetchVideoUrl]);

  const handleAuthenticate = () => {
    console.log("Authenticate clicked in EmbeddedVideoContent");
    setIsLoading(true);
    initialRequestSentRef.current = false;

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
    if (newAuthWindow) newAuthWindow.focus();
  };

  return (
    <>
      <VideoPlayer
        src={src}
        poster={metadata.coverImage}
        title={metadata.title}
        isLoading={isLoading}
        isAuthenticated={!!sessionSigs}
        isLocked={!!!src}
        onPlay={() => console.log("Video started playing")}
        onPause={() => console.log("Video paused")}
        onEnded={() => console.log("Video ended")}
        onProfileClick={() => console.log("Profile clicked")}
        onAuthenticate={handleAuthenticate}
        onUnlockClick={() => {
          console.log("VideoPlayer native onUnlockClick triggered.");
          if (!isLoading && !!src) {
            console.log("Attempting to re-authenticate via onUnlockClick.");
            handleAuthenticate();
          } else if (isLoading) {
            console.log(
              "Already authenticating, onUnlockClick does nothing further."
            );
          }
        }}
      />
    </>
  );
}
