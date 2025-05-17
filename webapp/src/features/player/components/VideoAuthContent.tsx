"use client";

import { useEffect, useState, useCallback } from "react";
import type { VideoMetadata } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAuthPageCommunication,
  useVideoAccess,
  type AuthRequestPayloadType,
} from "@/features/player/hooks";
import { VideoUnlockModal, type UnlockOption } from "@/features/videoUnlock";
import { showErrorToast } from "@/utils/toast";

interface VideoAuthContentProps {
  metadata: VideoMetadata;
  origin: string | undefined; // Origin of the player iframe, passed as a prop
}

// Basic button styling - can be moved to a CSS module or global style later
const buttonStyles: React.CSSProperties = {
  padding: "8px 16px",
  margin: "4px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#f0f0f0",
};

const primaryButtonStyles: React.CSSProperties = {
  ...buttonStyles,
  backgroundColor: "#007bff",
  color: "white",
  borderColor: "#007bff",
};

/**
 * Client component to handle the authentication flow for embedded videos.
 * It communicates with the parent player window, manages user authentication,
 * checks video access rights (e.g., using Lit Protocol), and returns the outcome.
 */
export default function VideoAuthContent({
  metadata,
  origin: playerOriginProp,
}: VideoAuthContentProps) {
  const { login, isAuthenticated, isAuthenticating, sessionSigs } = useAuth();
  const { videoAccessState, checkAccessAndGetUrl } = useVideoAccess(metadata);

  const [playerActualOrigin, setPlayerActualOrigin] = useState<string | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState(
    "Initializing authentication..."
  );
  const [showUnlockButtonAndInfo, setShowUnlockButtonAndInfo] = useState(false);
  const [isAuthPageUnlockModalOpen, setIsAuthPageUnlockModalOpen] =
    useState(false);
  const [requestedVideoId, setRequestedVideoId] = useState<string | null>(null);

  // To trigger re-check after modal success
  const [modalUnlockAttempted, setModalUnlockAttempted] = useState(0);

  // Validate and set the player origin from prop
  useEffect(() => {
    if (playerOriginProp) {
      try {
        const url = new URL(playerOriginProp);
        setPlayerActualOrigin(url.origin);
        setStatusMessage("Waiting for player...");
      } catch (error) {
        console.error(
          "[VideoAuthContent] Invalid player origin prop:",
          playerOriginProp,
          error
        );
        const errMsg = "Error: Invalid player origin configuration.";
        setStatusMessage(errMsg);
        showErrorToast(errMsg);
      }
    } else {
      console.warn("[VideoAuthContent] Player origin prop is missing.");
      const errMsg = "Error: Player origin not specified.";
      setStatusMessage(errMsg);
      showErrorToast(errMsg);
    }
  }, [playerOriginProp]);

  const handleAuthRequest = useCallback(
    async (payload: AuthRequestPayloadType) => {
      console.log(
        "[VideoAuthContent] Authentication requested by player:",
        payload
      );
      setRequestedVideoId(payload.videoId || metadata.id); // Prefer payload, fallback to metadata
      setStatusMessage("Processing authentication request...");

      if (isAuthenticated && sessionSigs) {
        setStatusMessage("User authenticated. Checking video access...");
        await checkAccessAndGetUrl(sessionSigs);
      } else if (isAuthenticating) {
        setStatusMessage("Authentication in progress...");
      } else {
        setStatusMessage(
          "User not authenticated. Please log in to access this video."
        );
      }
    },
    [
      isAuthenticated,
      sessionSigs,
      checkAccessAndGetUrl,
      isAuthenticating,
      metadata.id,
    ]
  );

  const { sendAuthResult, authRequestPayload } = useAuthPageCommunication(
    playerActualOrigin, // Use the validated origin
    metadata.id, // Fallback videoId if not in player request
    handleAuthRequest
  );

  // Effect to react to changes in video access state from useVideoAccess hook
  useEffect(() => {
    if (videoAccessState.isLoading) {
      setStatusMessage("Verifying video access details...");
      setShowUnlockButtonAndInfo(false);
      return;
    }

    if (videoAccessState.error) {
      const errMsg = `Error checking video access: ${videoAccessState.error}`;
      setStatusMessage(errMsg);
      showErrorToast(errMsg);
      sendAuthResult({
        success: !!sessionSigs,
        videoId: requestedVideoId || metadata.id,
        sessionSigs: sessionSigs || null,
        litAuthSig: null,
        playbackSrc: null,
        error: videoAccessState.error,
      });
      if (sessionSigs) {
        setShowUnlockButtonAndInfo(true);
      }
      return;
    }

    if (videoAccessState.playbackSrc && videoAccessState.litAuthSig) {
      setStatusMessage("Access granted. Video unlocked.");
      sendAuthResult({
        success: true,
        videoId: requestedVideoId || metadata.id,
        sessionSigs,
        litAuthSig: videoAccessState.litAuthSig,
        playbackSrc: videoAccessState.playbackSrc,
      });
      setShowUnlockButtonAndInfo(false);
    } else if (
      sessionSigs &&
      !videoAccessState.isLoading &&
      !videoAccessState.error &&
      !videoAccessState.playbackSrc
    ) {
      setStatusMessage(
        "Access to this video was not granted based on current conditions."
      );
      sendAuthResult({
        success: true,
        videoId: requestedVideoId || metadata.id,
        sessionSigs,
        litAuthSig: videoAccessState.litAuthSig,
        playbackSrc: null,
        error: "Video access conditions not met.",
      });
      setShowUnlockButtonAndInfo(true);
    }
  }, [
    videoAccessState,
    sendAuthResult,
    sessionSigs,
    metadata.id,
    requestedVideoId,
  ]);

  // Effect to handle user authentication state changes from useAuth
  useEffect(() => {
    if (isAuthenticated && sessionSigs && authRequestPayload) {
      setStatusMessage("User now authenticated. Re-checking video access...");
      checkAccessAndGetUrl(sessionSigs);
    } else if (!isAuthenticated && !isAuthenticating && authRequestPayload) {
      setStatusMessage("Please log in to access this video.");
    }
  }, [
    isAuthenticated,
    sessionSigs,
    isAuthenticating,
    authRequestPayload,
    checkAccessAndGetUrl,
  ]);

  // Effect to re-check access after a successful modal unlock
  useEffect(() => {
    if (modalUnlockAttempted > 0 && isAuthenticated && sessionSigs) {
      setStatusMessage(
        "Unlock attempt successful. Re-verifying video access..."
      );
      checkAccessAndGetUrl(sessionSigs);
    }
  }, [
    modalUnlockAttempted,
    isAuthenticated,
    sessionSigs,
    checkAccessAndGetUrl,
  ]);

  const handleLogin = async () => {
    setStatusMessage("Redirecting to login...");
    try {
      await login();
      setStatusMessage("Login successful. Waiting for video access check...");
    } catch (error) {
      console.error("[VideoAuthContent] Login failed:", error);
      const errMsg = "Login failed. Please try again.";
      setStatusMessage(errMsg);
      showErrorToast(errMsg);
      sendAuthResult({
        success: false,
        videoId: requestedVideoId || metadata.id,
        error: "Login process failed.",
      });
    }
  };

  const handleUnlockVideo = () => {
    setIsAuthPageUnlockModalOpen(true);
  };

  const handleUnlockModalClose = () => {
    setIsAuthPageUnlockModalOpen(false);
    setStatusMessage(
      "Unlock process ended. You might need to try authenticating again."
    );
  };

  const handleUnlockSuccess = (option: UnlockOption) => {
    setIsAuthPageUnlockModalOpen(false);
    setStatusMessage(
      `Unlock method '${
        option.title || option.type
      }' reported success. Re-checking video access...`
    );
    setModalUnlockAttempted((prev) => prev + 1);
  };

  const handleUnlockError = (errorMsg: string) => {
    setIsAuthPageUnlockModalOpen(false);
    const finalMsg = `Unlock attempt failed: ${errorMsg}. You may need to try authenticating again.`;
    setStatusMessage(finalMsg);
    showErrorToast(finalMsg);
  };

  if (!playerActualOrigin) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", color: "red" }}>
        <h1>Authentication Error</h1>
        <p>{statusMessage}</p>
        <p>Cannot proceed without a valid player origin.</p>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "20px", fontFamily: "sans-serif", textAlign: "center" }}
    >
      <h2>Video Access Authentication</h2>
      <p>Video: {metadata.title || "Loading..."}</p>
      <hr style={{ margin: "20px 0" }} />

      {isAuthenticating && <p>Logging in, please wait...</p>}
      {videoAccessState.isLoading && (
        <p>Checking video access, please wait...</p>
      )}

      <p style={{ fontWeight: "bold", minHeight: "40px" }}>{statusMessage}</p>

      {!isAuthenticated && !isAuthenticating && (
        <button onClick={handleLogin} style={buttonStyles}>
          Login to Continue
        </button>
      )}

      {isAuthenticated &&
        showUnlockButtonAndInfo &&
        !videoAccessState.isLoading && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <p>
              You have access to your account, but specific conditions for this
              video might not be met, or an error occurred.
            </p>
            <button onClick={handleUnlockVideo} style={primaryButtonStyles}>
              Attempt to Unlock Video
            </button>
          </div>
        )}

      {isAuthPageUnlockModalOpen && metadata && (
        <VideoUnlockModal
          isOpen={isAuthPageUnlockModalOpen}
          onClose={handleUnlockModalClose}
          metadata={metadata}
          handlers={{
            onUnlockSuccess: handleUnlockSuccess,
            onUnlockError: (error: string | Error) =>
              handleUnlockError(error instanceof Error ? error.message : error),
          }}
          hasEmbeddedWallet={false}
        />
      )}

      <div style={{ marginTop: "30px", fontSize: "0.8em", color: "#777" }}>
        <p>Please do not close this window. It will update automatically.</p>
        <p>Video ID: {requestedVideoId || metadata.id}</p>
        <p>Player Origin: {playerActualOrigin}</p>
      </div>
    </div>
  );
}
