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
// Toasts removed for now, focusing on console logs and UI state changes as per new request

interface VideoAuthContentProps {
  metadata: VideoMetadata;
  origin: string | undefined;
}

export default function VideoAuthContent({
  metadata,
  origin: playerOriginProp,
}: VideoAuthContentProps) {
  const { user, login, isAuthenticated, isAuthenticating, sessionSigs } =
    useAuth();
  const { videoAccessState, checkAccessAndGetUrl } = useVideoAccess(metadata);

  const [playerActualOrigin, setPlayerActualOrigin] = useState<string | null>(
    null
  );
  // Simplified status message for broader states
  const [uiStatus, setUiStatus] = useState("Initializing...");
  const [showUnlockAction, setShowUnlockAction] = useState(false);
  const [isAuthPageUnlockModalOpen, setIsAuthPageUnlockModalOpen] =
    useState(false);
  const [requestedVideoId, setRequestedVideoId] = useState<string | null>(null);
  const [modalUnlockAttempted, setModalUnlockAttempted] = useState(0);

  useEffect(() => {
    if (playerOriginProp) {
      try {
        const url = new URL(playerOriginProp);
        setPlayerActualOrigin(url.origin);
        setUiStatus("Waiting for player interaction...");
      } catch (error) {
        console.error(
          "[VideoAuthContent] Invalid player origin prop:",
          playerOriginProp,
          error
        );
        setUiStatus("Configuration Error."); // Minimal user-facing error
      }
    } else {
      console.warn("[VideoAuthContent] Player origin prop is missing.");
      setUiStatus("Configuration Error.");
    }
  }, [playerOriginProp]);

  const handleAuthRequest = useCallback(
    async (payload: AuthRequestPayloadType) => {
      console.log(
        "[VideoAuthContent] Authentication requested by player:",
        payload
      );
      setRequestedVideoId(payload.videoId || metadata.id);
      setShowUnlockAction(false); // Reset unlock action visibility

      if (isAuthenticated && sessionSigs) {
        setUiStatus("Checking video access...");
        await checkAccessAndGetUrl(sessionSigs);
      } else if (isAuthenticating) {
        setUiStatus("Authenticating...");
      } else {
        setUiStatus("Login required to access this video.");
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
    playerActualOrigin,
    metadata.id,
    handleAuthRequest
  );

  useEffect(() => {
    if (videoAccessState.isLoading) {
      setUiStatus("Verifying video access...");
      setShowUnlockAction(false);
      return;
    }

    if (videoAccessState.error) {
      console.error(
        "[VideoAuthContent] Error checking video access:",
        videoAccessState.error
      );
      setUiStatus("Access to this video couldn't be verified."); // Generic message
      sendAuthResult({
        success: !!sessionSigs,
        videoId: requestedVideoId || metadata.id,
        sessionSigs: sessionSigs || null,
        litAuthSig: null,
        playbackSrc: null, // Changed from playbackUrl
        error: videoAccessState.error,
      });
      if (sessionSigs) {
        setShowUnlockAction(true);
      }
      return;
    }

    if (videoAccessState.playbackSrc && videoAccessState.litAuthSig) {
      setUiStatus("Access Granted! Returning to player...");
      setShowUnlockAction(false);
      sendAuthResult({
        success: true,
        videoId: requestedVideoId || metadata.id,
        sessionSigs,
        litAuthSig: videoAccessState.litAuthSig,
        playbackSrc: videoAccessState.playbackSrc, // Changed from playbackUrl
      });
      // Optionally close window after a short delay to show message
      // setTimeout(() => window.close(), 1500);
    } else if (
      sessionSigs &&
      !videoAccessState.isLoading &&
      !videoAccessState.error &&
      !videoAccessState.playbackSrc
    ) {
      console.warn("[VideoAuthContent] Access conditions not met after check.");
      setUiStatus("Specific access conditions for this video are not met.");
      sendAuthResult({
        success: true,
        videoId: requestedVideoId || metadata.id,
        sessionSigs,
        litAuthSig: videoAccessState.litAuthSig,
        playbackSrc: null, // Changed from playbackUrl
        error: "Video access conditions not met.",
      });
      setShowUnlockAction(true);
    }
  }, [
    videoAccessState,
    sendAuthResult,
    sessionSigs,
    metadata.id,
    requestedVideoId,
  ]);

  useEffect(() => {
    if (
      isAuthenticated &&
      sessionSigs &&
      authRequestPayload &&
      !videoAccessState.isLoading &&
      !videoAccessState.playbackSrc &&
      !videoAccessState.error
    ) {
      setUiStatus("Authenticated. Checking video access...");
      checkAccessAndGetUrl(sessionSigs);
    } else if (!isAuthenticated && !isAuthenticating && authRequestPayload) {
      setUiStatus("Login required to proceed.");
    }
  }, [
    isAuthenticated,
    sessionSigs,
    isAuthenticating,
    authRequestPayload,
    checkAccessAndGetUrl,
    videoAccessState,
  ]);

  useEffect(() => {
    if (modalUnlockAttempted > 0 && isAuthenticated && sessionSigs) {
      setUiStatus("Unlock attempt processed. Re-verifying video access...");
      checkAccessAndGetUrl(sessionSigs);
    }
  }, [
    modalUnlockAttempted,
    isAuthenticated,
    sessionSigs,
    checkAccessAndGetUrl,
  ]);

  const handleLogin = async () => {
    setUiStatus("Redirecting to login...");
    try {
      await login();
      // Subsequent logic is handled by useEffect reacting to isAuthenticated and authRequestPayload
    } catch (error) {
      console.error("[VideoAuthContent] Login failed:", error);
      setUiStatus("Login process failed. Please try again.");
      sendAuthResult({
        success: false,
        videoId: requestedVideoId || metadata.id,
        error: "Login process failed.",
      });
    }
  };

  const handleUnlockVideo = () => setIsAuthPageUnlockModalOpen(true);
  const handleUnlockModalClose = () => setIsAuthPageUnlockModalOpen(false);

  const handleUnlockSuccess = (option: UnlockOption) => {
    setIsAuthPageUnlockModalOpen(false);
    console.log(
      `[VideoAuthContent] Unlock method '${
        option.title || option.type
      }' reported success.`
    );
    setModalUnlockAttempted((prev) => prev + 1);
  };

  const handleUnlockError = (errorMsg: string) => {
    setIsAuthPageUnlockModalOpen(false);
    console.error(
      "[VideoAuthContent] Unlock attempt failed in modal:",
      errorMsg
    );
    setUiStatus(
      "Unlock attempt failed. You might need to try unlocking again or contact support."
    );
  };

  if (!playerActualOrigin && uiStatus === "Configuration Error.") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Configuration Error
        </h1>
        <p className="text-gray-700">
          This authentication page is not configured correctly. Please contact
          support.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Origin: {playerOriginProp || "Not Provided"}
        </p>
      </div>
    );
  }

  const AuthStateDisplay = () => {
    if (isAuthenticating)
      return <p className="text-sm text-gray-600">Connecting Wallet...</p>;
    if (isAuthenticated && user) {
      return (
        <div className="text-sm">
          <p className="text-gray-600">Authenticated as:</p>
          <p className="font-semibold text-gray-800 break-all">
            {user.wallet?.address || "Address not available"}
          </p>
        </div>
      );
    }
    return (
      <button
        onClick={handleLogin}
        className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
      >
        Connect Wallet & Authenticate
      </button>
    );
  };

  const AccessStatusDisplay = () => {
    if (!isAuthenticated) return null; // Don't show access status if not logged in
    if (videoAccessState.isLoading)
      return (
        <p className="text-sm text-gray-600 mt-4">Checking your access...</p>
      );
    if (videoAccessState.playbackSrc) {
      return (
        <p className="mt-4 text-lg font-semibold text-green-600">
          ✔️ Access Granted! Returning to video...
        </p>
      );
    }
    if (showUnlockAction) {
      return (
        <button
          onClick={handleUnlockVideo}
          className="w-full mt-6 px-4 py-3 font-semibold text-gray-100 bg-black rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out"
        >
          Unlock Video Content
        </button>
      );
    }
    // Default status message if no specific action above applies
    return <p className="text-sm text-gray-600 mt-4">{uiStatus}</p>;
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 p-4 pt-8 md:pt-16">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {metadata.title || "Video Title Not Available"}
          </h2>
          <p className="text-xs text-gray-500">
            Video ID: {metadata.id || "N/A"}
          </p>
        </div>

        <hr className="border-gray-200" />

        <div className="min-h-[60px] flex flex-col justify-center items-center">
          <AuthStateDisplay />
        </div>

        <div className="min-h-[60px] flex flex-col justify-center items-center">
          <AccessStatusDisplay />
        </div>
      </div>

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
    </div>
  );
}
