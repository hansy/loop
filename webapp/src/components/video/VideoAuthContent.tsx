"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { VideoMetadata } from "@/types"; // Assuming VideoMetadata includes id and title
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

// Definitions from EmbedAuthClientHandler
interface MessageEventData {
  data: unknown;
  origin: string;
}

interface ReceivedMessage extends MessageEventData {
  type?: string;
  payload?: any; // Linter will flag this, acknowledge for now
}

// More specific type for the payload we expect in REQUEST_AUTHENTICATION
interface AuthRequestPayloadType {
  videoId?: string;
  // Add other fields if player sends more data
}

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
  const [receivedMessage, setReceivedMessage] =
    useState<ReceivedMessage | null>(null);
  const [openerOrigin, setOpenerOrigin] = useState<string | null>(null);
  const [authRequestPayload, setAuthRequestPayload] =
    useState<AuthRequestPayloadType | null>(null);
  const [loginInitiatedByPage, setLoginInitiatedByPage] = useState(false);
  const authPageReadySentRef = useRef(false); // Flag to track if AUTH_PAGE_READY was sent

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
      sigs: typeof sessionSigs | null,
      videoIdFromReq?: string
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
              sessionSigs: success ? sigs : null,
            },
          },
          openerOrigin
        );
        console.log(`Sent AUTH_RESULT (success: ${success})`);
        // Optionally close window on success, or let user close it.
        // if (success && window.opener) window.close();
      }
    },
    [openerOrigin, authRequestPayload, videoIdFromParam]
  ); // sessionSigs removed from deps, use passed sigs

  useEffect(() => {
    if (!openerOrigin) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== openerOrigin) {
        console.warn(
          `Message from unexpected origin: ${event.origin}. Expected ${openerOrigin}. Ignoring.`
        );
        return;
      }

      console.log("VideoAuthContent received message:", event.data);
      const msgData = event.data as {
        type?: string;
        payload?: AuthRequestPayloadType;
      };
      setReceivedMessage({
        data: msgData,
        origin: event.origin,
        type: msgData.type,
        payload: msgData.payload,
      });

      if (msgData.type === "REQUEST_AUTHENTICATION") {
        console.log(
          "Received REQUEST_AUTHENTICATION with payload:",
          msgData.payload
        );
        setAuthRequestPayload(msgData.payload || null);

        if (isAuthenticated && sessionSigs) {
          console.log(
            "User already authenticated. Sending success immediately."
          );
          sendAuthResult(true, sessionSigs, msgData.payload?.videoId);
        } else if (!isAuthenticating) {
          console.log("User not authenticated. Initiating login.");
          setLoginInitiatedByPage(true);
          login(); // Trigger Privy login flow
        } else {
          console.log("Authentication already in progress.");
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
    sendAuthResult,
    sessionSigs,
  ]);

  // Effect to react to authentication state changes from AuthContext
  useEffect(() => {
    // Only react if login was initiated by this page and we have an auth request
    if (loginInitiatedByPage && authRequestPayload) {
      if (isAuthenticated && sessionSigs) {
        console.log(
          "Login successful (detected by VideoAuthContent). Sending AUTH_RESULT."
        );
        sendAuthResult(true, sessionSigs, authRequestPayload.videoId);
        setLoginInitiatedByPage(false); // Reset flag
      } else if (!isAuthenticating && !isAuthenticated) {
        // This condition means auth process ended, but user is not authenticated.
        // Could be a login cancellation or failure.
        console.log(
          "Login failed or cancelled (detected by VideoAuthContent). Sending AUTH_RESULT."
        );
        sendAuthResult(false, null, authRequestPayload.videoId);
        setLoginInitiatedByPage(false); // Reset flag
      }
    }
  }, [
    isAuthenticated,
    isAuthenticating,
    sessionSigs,
    loginInitiatedByPage,
    authRequestPayload,
    sendAuthResult,
  ]);

  let authStatusContent;
  const userDisplayEmail = user?.email
    ? typeof user.email === "string"
      ? user.email
      : String(user.email)
    : "user";

  if (isAuthenticating || (loginInitiatedByPage && !isAuthenticated)) {
    authStatusContent = (
      <p>
        <strong>Authenticating... Please follow login prompts.</strong>
      </p>
    );
  } else if (isAuthenticated && sessionSigs) {
    authStatusContent = (
      <p>
        <strong>Successfully authenticated as {userDisplayEmail}.</strong> You
        can close this window.
      </p>
    );
  } else if (authRequestPayload && !isAuthenticated && !isAuthenticating) {
    // This state might occur if REQUEST_AUTHENTICATION arrived but login hasn't been triggered or failed silently before this page initiated it.
    authStatusContent = (
      <p>Please click the button in the player to authenticate or try again.</p>
    );
  } else if (!authRequestPayload && openerOrigin) {
    authStatusContent = (
      <p style={{ fontStyle: "italic" }}>
        Waiting for authentication request from player...
      </p>
    );
  }

  return (
    <div style={{ marginTop: "10px", textAlign: "center" }}>
      {openerOrigin ? (
        <p style={{ fontSize: "0.9em", color: "#555" }}>
          Player Origin: <strong>{openerOrigin}</strong>
        </p>
      ) : (
        <p style={{ fontSize: "0.9em", color: "red" }}>
          Player domain not specified or invalid.
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
        }}
      >
        {authStatusContent}
        {receivedMessage?.type === "REQUEST_AUTHENTICATION" &&
          !isAuthenticating &&
          !isAuthenticated && (
            <div style={{ marginTop: "10px" }}>
              {/* Button could be added here to manually re-trigger login if needed, but auto-trigger is in place */}
              {/* <button onClick={() => { setLoginInitiatedByPage(true); login(); }}>Retry Login</button> */}
            </div>
          )}
      </div>
    </div>
  );
}
