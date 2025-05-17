"use client";

import VideoPlayer from "@/components/video/VideoPlayer"; // Adjusted path assuming VideoPlayer is a general component
import type { VideoMetadata } from "@/types";
import { useState, useEffect, useCallback } from "react";
import {
  usePlayerAuthCommunication,
  type AuthResultPayload,
} from "@/features/player/hooks";
import type { MediaSrc } from "@vidstack/react";

interface EmbeddedVideoContentProps {
  metadata: VideoMetadata;
}

export default function EmbeddedVideoContent({
  metadata,
}: EmbeddedVideoContentProps) {
  const [videoSrc, setVideoSrc] = useState<MediaSrc | undefined>(undefined);
  // Combined loading state for both player loading and auth process
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [isAuthenticatedSession, setIsAuthenticatedSession] = useState(false);

  const handleAuthResult = useCallback((payload: AuthResultPayload) => {
    console.log("[EmbeddedVideoContent] Received AUTH_RESULT:", payload);
    setIsPlayerLoading(false);

    if (payload.success) {
      setIsAuthenticatedSession(true);
      if (payload.playbackSrc) {
        setVideoSrc(payload.playbackSrc);
        console.log(
          "[EmbeddedVideoContent] Playback URL received:",
          payload.playbackSrc
        );
      } else {
        // const errMsg =
        //   payload.error ||
        //   "Authenticated, but video is not available for playback.";
        // showErrorToast(errMsg);
        if (payload.litAuthSig) {
          console.warn(
            "[EmbeddedVideoContent] Auth success with LitAuthSig but no playbackUrl."
          );
        } else {
          console.warn(
            "[EmbeddedVideoContent] Auth success but no playbackUrl or LitAuthSig for playback."
          );
        }
      }
    } else {
      setIsAuthenticatedSession(false);
      // const errMsg = payload.error || "Authentication failed.";
      // showErrorToast(errMsg);
      setVideoSrc(undefined);
      console.warn(
        "[EmbeddedVideoContent] Authentication failed:",
        payload.error
      );
    }
  }, []);

  const authWindowOrigin =
    typeof window !== "undefined" ? window.location.origin : null;

  const {
    openAuthWindow,
    requestAuthentication,
    isLoading: isAuthWindowLoading, // This is the isLoading from the usePlayerAuthCommunication hook
  } = usePlayerAuthCommunication(
    authWindowOrigin,
    metadata.id,
    handleAuthResult,
    () => {
      // onAuthPageReady callback
      console.log(
        "[EmbeddedVideoContent] Auth page is ready. Requesting authentication."
      );
      requestAuthentication();
      // No need to setIsPlayerLoading(true) here, as openAuthWindow already does via its internal state reflected in isAuthWindowLoading
    }
  );

  // Effect to update player loading state based on auth window loading state
  useEffect(() => {
    setIsPlayerLoading(isAuthWindowLoading);
  }, [isAuthWindowLoading]);

  const handleAuthenticate = useCallback(() => {
    if (!metadata.id) {
      // const errMsg = "Video ID is missing, cannot authenticate.";
      // showErrorToast(errMsg);
      return;
    }
    console.log("[EmbeddedVideoContent] Authenticate action triggered.");

    const authPageUrl = `/videos/${
      metadata.id
    }/auth?playerOrigin=${encodeURIComponent(authWindowOrigin || "")}`;
    openAuthWindow(authPageUrl);
    // The onAuthPageReady callback in usePlayerAuthCommunication will call requestAuthentication
  }, [metadata.id, openAuthWindow, authWindowOrigin]);

  return (
    <>
      <VideoPlayer
        src={videoSrc}
        poster={metadata.coverImage}
        title={metadata.title}
        isLoading={isPlayerLoading} // Reflects auth process primarily
        isAuthenticated={isAuthenticatedSession} // Based on successful auth with sessionSigs
        isLocked={!videoSrc && !isPlayerLoading} // Locked if no src and not actively loading/authenticating
        onAuthenticate={handleAuthenticate}
        onUnlockClick={handleAuthenticate} // Re-use authenticate logic for unlock click
        // Add other necessary props for VideoPlayer
        onPlay={() => console.log("Video event: onPlay")}
        onPause={() => console.log("Video event: onPause")}
        onEnded={() => console.log("Video event: onEnded")}
        onProfileClick={() => console.log("Video event: onProfileClick")}
      />
    </>
  );
}
