"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { VideoMetadata } from "@/types"; // Assuming VideoMetadata includes id and title
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { LitService } from "@/services/client/encrpytion/litService.client"; // Import LitService
import { DEFAULT_CHAIN } from "@/config/chainConfig"; // Import DEFAULT_CHAIN
import { camelCaseString } from "@/utils/camelCaseString"; // Import camelCaseString
import { randomBytes } from "crypto"; // Import randomBytes
import type { AuthSig, SessionSigsMap } from "@lit-protocol/types"; // Import AuthSig and SessionSigsMap
import { VideoUnlockModal } from "@/features/videoUnlock"; // Import VideoUnlockModal
import { getPlaybackUrl } from "@/services/client/playbackApi"; // Import getPlaybackUrl

// Remove MessageEventData and ReceivedMessage if receivedMessage state is removed
// interface MessageEventData {
//   data: unknown;
//   origin: string;
// }

// More specific type for the payload we expect in REQUEST_AUTHENTICATION from the player
interface AuthRequestPayloadType {
  videoId?: string;
  // Add other fields if player sends more data
}

// interface ReceivedMessage extends MessageEventData { // This interface can be removed
//   type?: string;
//   payload?: AuthRequestPayloadType;
// }

// Updated Props for VideoAuthContent
interface VideoAuthContentProps {
  metadata: VideoMetadata;
  origin: string | undefined; // Origin of the player iframe
}

/**
 * Client component to handle postMessage logic for embed authentication.
 * Displays video title and handles communication with the player iframe.
 */
export default function VideoAuthContent({
  metadata,
  origin: playerOriginProp, // Use the passed origin prop
}: VideoAuthContentProps) {
  // const [receivedMessage, setReceivedMessage] = useState<ReceivedMessage | null>(null); // REMOVED
  const [openerOrigin, setOpenerOrigin] = useState<string | null>(null);
  const [authRequestPayload, setAuthRequestPayload] =
    useState<AuthRequestPayloadType | null>(null); // This state stores the payload from REQUEST_AUTHENTICATION
  const [loginInitiatedByPage, setLoginInitiatedByPage] = useState(false);
  const authPageReadySentRef = useRef(false); // Flag to track if AUTH_PAGE_READY was sent
  const litServiceRef = useRef(new LitService()); // Instantiate LitService

  // New states for Lit access check
  const [litAuthSig, setLitAuthSig] = useState<AuthSig | null | undefined>(
    undefined
  );
  const [playbackUrl, setPlaybackUrl] = useState<string | null | undefined>(
    undefined
  );
  const [isCheckingAccessOrUrl, setIsCheckingAccessOrUrl] = useState(false);
  const [showUnlockButtonAndInfo, setShowUnlockButtonAndInfo] = useState(false);
  const [isAuthPageUnlockModalOpen, setIsAuthPageUnlockModalOpen] =
    useState(false);

  const { user, login, isAuthenticated, isAuthenticating, sessionSigs } =
    useAuth();

  // Derive videoId and videoTitle from metadata prop
  const videoIdFromParam = metadata.id;
  const videoTitle = metadata.title;

  useEffect(() => {
    if (playerOriginProp) {
      try {
        const url = new URL(playerOriginProp);
        setOpenerOrigin(url.origin);
      } catch (error) {
        console.error("Invalid origin prop:", playerOriginProp, error);
      }
    } else {
      console.warn("origin prop is missing or invalid.");
    }
  }, [playerOriginProp]);

  const sendAuthResult = useCallback(
    (
      success: boolean,
      currentSessionSigs: SessionSigsMap | null,
      videoIdFromReq?: string,
      authSigForVideo?: AuthSig | null,
      finalPlaybackUrl?: string | null
    ) => {
      const target =
        window.opener || (window.parent !== window ? window.parent : null);
      if (target && openerOrigin) {
        target.postMessage(
          {
            type: "AUTH_RESULT",
            payload: {
              success,
              videoId:
                videoIdFromReq ||
                authRequestPayload?.videoId ||
                videoIdFromParam,
              sessionSigs: success ? currentSessionSigs : null,
              litAuthSig: success ? authSigForVideo : null,
              playbackUrl: success ? finalPlaybackUrl : null,
            },
          },
          openerOrigin
        );
        console.log(
          `Sent AUTH_RESULT (success: ${success}, litAuthSig: ${
            authSigForVideo ? "present" : "absent"
          }, playbackUrl: ${finalPlaybackUrl ? "present" : "absent"})`
        );
      }
    },
    [openerOrigin, authRequestPayload, videoIdFromParam]
  );

  const checkVideoAccessAndGetUrl = useCallback(
    async (
      currentSessionSigs: SessionSigsMap,
      currentMetadata: VideoMetadata
    ) => {
      if (!currentMetadata.playbackAccess || !currentMetadata.id) {
        console.warn(
          "Cannot check video access/get URL: playbackAccess metadata or video ID is missing."
        );
        setShowUnlockButtonAndInfo(true);
        setIsCheckingAccessOrUrl(false);
        sendAuthResult(
          true,
          currentSessionSigs,
          currentMetadata.id,
          null,
          null
        );
        return;
      }

      setIsCheckingAccessOrUrl(true);
      setLitAuthSig(undefined);
      setPlaybackUrl(undefined);
      setShowUnlockButtonAndInfo(false);
      let obtainedLitAuthSig: AuthSig | null = null;

      try {
        console.log("Attempting to run Lit action...");
        const jsParams = {
          chain: camelCaseString(DEFAULT_CHAIN.name),
          nonce: randomBytes(16).toString("hex"),
          exp: Date.now() + 3 * 60 * 1000, // 3 minutes expiry
          ciphertext: currentMetadata.playbackAccess.ciphertext,
          dataToEncryptHash: currentMetadata.playbackAccess.dataToEncryptHash,
          accessControlConditions: currentMetadata.playbackAccess.acl,
        };
        obtainedLitAuthSig = await litServiceRef.current.runLitAction(
          currentSessionSigs,
          jsParams
        );
        setLitAuthSig(obtainedLitAuthSig);
        console.log(
          "Lit action successful, received authSig:",
          obtainedLitAuthSig
        );

        console.log("Attempting to get playback URL with LitAuthSig...");
        const signedPlaybackUrl = await getPlaybackUrl({
          tokenId: currentMetadata.tokenId,
          authSig: obtainedLitAuthSig,
        });
        setPlaybackUrl(signedPlaybackUrl);
        console.log("Playback URL received:", signedPlaybackUrl);
        sendAuthResult(
          true,
          currentSessionSigs,
          currentMetadata.id,
          obtainedLitAuthSig,
          signedPlaybackUrl
        );
      } catch (error) {
        console.error(
          "Error during video access check or getting playback URL:",
          error
        );
        // If error occurred after getting litAuthSig but before/during getPlaybackUrl
        if (obtainedLitAuthSig) {
          sendAuthResult(
            true,
            currentSessionSigs,
            currentMetadata.id,
            obtainedLitAuthSig,
            null
          );
        } else {
          // Error occurred during lit action itself
          setLitAuthSig(null);
          setShowUnlockButtonAndInfo(true);
          sendAuthResult(
            true,
            currentSessionSigs,
            currentMetadata.id,
            null,
            null
          );
        }
      } finally {
        setIsCheckingAccessOrUrl(false);
      }
    },
    [sendAuthResult]
  );

  useEffect(() => {
    if (!openerOrigin) return;

    // Define the specific message type expected from the player
    interface RequestAuthenticationMessage {
      type: "REQUEST_AUTHENTICATION";
      payload: AuthRequestPayloadType;
    }
    // We could also expect other message types in the future
    type MessageFromPlayer = RequestAuthenticationMessage; // | OtherMessageTypes...

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== openerOrigin) {
        console.warn(
          `Message from unexpected origin: ${event.origin}. Expected ${openerOrigin}. Ignoring.`
        );
        return;
      }

      // Stricter check for message structure
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data
      ) {
        const msgData = event.data as MessageFromPlayer; // Cast after confirming 'type' exists

        if (msgData.type === "REQUEST_AUTHENTICATION") {
          console.log(
            "VideoAuthContent received REQUEST_AUTHENTICATION:",
            msgData
          );
          // setReceivedMessage removed
          setAuthRequestPayload(msgData.payload || null);

          console.log(
            "Received REQUEST_AUTHENTICATION with payload:",
            msgData.payload
          );

          if (isAuthenticated && sessionSigs) {
            console.log(
              "User ALREADY authenticated. Checking video access & getting URL."
            );
            checkVideoAccessAndGetUrl(sessionSigs, metadata);
          } else if (!isAuthenticated) {
            console.log(
              "User not authenticated. Calling login(). AuthContext state: isAuthenticated=",
              isAuthenticated,
              ", isAuthenticating=",
              isAuthenticating
            );
            setLoginInitiatedByPage(true);
            login();
          } else {
            console.log(
              "REQUEST_AUTHENTICATION: User authenticated but sessionSigs might be pending. Waiting..."
            );
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Inform opener that auth page is ready, only once
    if (!authPageReadySentRef.current) {
      const target =
        window.opener || (window.parent !== window ? window.parent : null);
      if (target && openerOrigin) {
        console.log(
          "VideoAuthContent sending AUTH_PAGE_READY to:",
          openerOrigin
        );
        target.postMessage(
          { type: "AUTH_PAGE_READY", videoId: videoIdFromParam },
          openerOrigin
        );
        authPageReadySentRef.current = true; // Mark as sent
      }
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [
    openerOrigin,
    videoIdFromParam,
    isAuthenticated,
    isAuthenticating,
    login,
    checkVideoAccessAndGetUrl,
    sessionSigs,
    metadata,
  ]);

  // Effect to react to authentication state changes from AuthContext
  useEffect(() => {
    // Only react if login was initiated by this page and we have an auth request
    if (loginInitiatedByPage && authRequestPayload) {
      if (isAuthenticated && sessionSigs) {
        console.log(
          "Login process successful. Checking video access & getting URL..."
        );
        checkVideoAccessAndGetUrl(sessionSigs, metadata);
        setLoginInitiatedByPage(false); // Reset flag
      } else if (!isAuthenticating && !isAuthenticated) {
        // This condition means auth process ended, but user is not authenticated.
        // Could be a login cancellation or failure.
        // As per user request, do not send AUTH_RESULT with success: false.
        console.log(
          "Login process failed/cancelled. No AUTH_RESULT (false) sent."
        );
        setLoginInitiatedByPage(false); // Reset flag, auth attempt is over. Popup remains open.
        // Update UI to reflect failed login, possibly show unlock button if videoId is known from payload.
        // This assumes authRequestPayload.videoId is the one we want to unlock.
        if (authRequestPayload.videoId) {
          setShowUnlockButtonAndInfo(true);
        }
      }
    }
  }, [
    isAuthenticated,
    isAuthenticating,
    sessionSigs,
    loginInitiatedByPage,
    authRequestPayload,
    checkVideoAccessAndGetUrl,
    metadata,
  ]);

  const handleUnlockModalSuccess = useCallback(async () => {
    setIsAuthPageUnlockModalOpen(false);
    if (sessionSigs) {
      console.log(
        "Unlock modal success. Re-checking video access & getting URL."
      );
      checkVideoAccessAndGetUrl(sessionSigs, metadata);
    } else {
      console.warn("Cannot re-check after unlock: sessionSigs missing.");
      // Potentially guide user to re-authenticate if sessionSigs were lost
    }
  }, [sessionSigs, metadata, checkVideoAccessAndGetUrl]);

  const handleUnlockModalError = (error: string) => {
    console.error("VideoUnlockModal error in auth page:", error);
    setIsAuthPageUnlockModalOpen(false);
    // Optionally, display an error message to the user on this auth page
  };

  let authStatusContent;
  const userDisplayEmail = user?.email
    ? typeof user.email === "string"
      ? user.email
      : String(user.email)
    : "user";

  if (isCheckingAccessOrUrl) {
    authStatusContent = (
      <p>
        <strong>Checking video access & retrieving URL...</strong>
      </p>
    );
  } else if (
    isAuthenticating ||
    (loginInitiatedByPage && !isAuthenticated && !isCheckingAccessOrUrl)
  ) {
    // If login was initiated by this page but not yet authenticated and not checking access (implies pre-auth or privy modal active)
    authStatusContent = (
      <p>
        <strong>Authenticating... Please follow login prompts.</strong>
      </p>
    );
  } else if (isAuthenticated && sessionSigs && litAuthSig && playbackUrl) {
    // Access granted
    authStatusContent = (
      <p>
        <strong>Video unlocked! Authenticated as {userDisplayEmail}.</strong>{" "}
        You can close this window.
      </p>
    );
  } else if (
    isAuthenticated &&
    sessionSigs &&
    litAuthSig &&
    playbackUrl === null
  ) {
    // Authenticated, but unable to retrieve video URL
    authStatusContent = (
      <div>
        <p>
          <strong>Authenticated as {userDisplayEmail}.</strong>
        </p>
        <p>
          However, we encountered an issue retrieving the video playback URL.
          Please try again later.
        </p>
      </div>
    );
  } else if (
    isAuthenticated &&
    sessionSigs &&
    litAuthSig === null &&
    showUnlockButtonAndInfo
  ) {
    // Authenticated, but no video access
    authStatusContent = (
      <div>
        <p>
          <strong>Authenticated as {userDisplayEmail}.</strong>
        </p>
        <p>You do not have access to this video yet.</p>
        <button
          onClick={() => setIsAuthPageUnlockModalOpen(true)}
          style={{
            marginTop: "10px",
            padding: "8px 15px",
            cursor: "pointer",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Unlock Video Access
        </button>
      </div>
    );
  } else if (showUnlockButtonAndInfo) {
    // General case to show button if auth failed before access check
    authStatusContent = (
      <div>
        <p>
          Authentication or video access check failed. Please try again or
          unlock access.
        </p>
        <button
          onClick={() => setIsAuthPageUnlockModalOpen(true)}
          style={{
            marginTop: "10px",
            padding: "8px 15px",
            cursor: "pointer",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Unlock Video Access
        </button>
      </div>
    );
  } else if (
    authRequestPayload &&
    !isAuthenticated &&
    !isAuthenticating &&
    !isCheckingAccessOrUrl
  ) {
    // Auth failed or cancelled (covered by showUnlockButtonAndInfo now, but keep as fallback for clarity)
    // Or if REQUEST_AUTHENTICATION arrived but login hasn't been triggered (less likely with current flow)
    authStatusContent = (
      <p>Authentication required. Please try again via player.</p>
    );
  } else if (!authRequestPayload && openerOrigin) {
    authStatusContent = (
      <p style={{ fontStyle: "italic" }}>
        Waiting for authentication request from player...
      </p>
    );
  }

  return (
    <>
      <div
        style={{
          marginTop: "10px",
          textAlign: "center",
          padding: "20px",
          fontFamily: "sans-serif",
        }}
      >
        {openerOrigin && (
          <p style={{ fontSize: "0.9em", color: "#555" }}>
            Player Origin: <strong>{openerOrigin}</strong>
          </p>
        )}
        {videoTitle && (
          <p style={{ fontSize: "1.1em", fontWeight: "bold" }}>
            Video: {videoTitle}
          </p>
        )}
        {videoIdFromParam && (
          <p style={{ fontSize: "0.8em", color: "#777" }}>
            (ID: {videoIdFromParam})
          </p>
        )}

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #eee",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          {authStatusContent}
        </div>
      </div>
      <VideoUnlockModal
        isOpen={isAuthPageUnlockModalOpen}
        onClose={() => setIsAuthPageUnlockModalOpen(false)}
        metadata={metadata}
        handlers={{
          onUnlockSuccess: handleUnlockModalSuccess,
          onUnlockError: handleUnlockModalError,
        }}
        hasEmbeddedWallet={user?.wallet?.connectorType === "embedded"}
      />
    </>
  );
}
