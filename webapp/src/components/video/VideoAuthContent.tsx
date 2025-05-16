"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { VideoMetadata } from "@/types"; // Assuming VideoMetadata includes id and title
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

// Definitions from EmbedAuthClientHandler
interface MessageEventData {
  data: unknown;
  origin: string;
}

// More specific type for the payload we expect in REQUEST_AUTHENTICATION from the player
interface AuthRequestPayloadType {
  videoId?: string;
  // Add other fields if player sends more data
}

interface ReceivedMessage extends MessageEventData {
  // data will be AuthRequestPayloadType when type is REQUEST_AUTHENTICATION
  type?: string;
  payload?: AuthRequestPayloadType; // Correctly typed based on expected REQUEST_AUTHENTICATION payload
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
    useState<AuthRequestPayloadType | null>(null); // This state stores the payload from REQUEST_AUTHENTICATION
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
                authRequestPayload?.videoId || // Use the stored payload's videoId
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
    [openerOrigin, authRequestPayload, videoIdFromParam] // sessionSigs removed from deps, use passed sigs
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
          setReceivedMessage({
            data: msgData,
            origin: event.origin,
            type: msgData.type,
            payload: msgData.payload,
          });

          console.log(
            "Received REQUEST_AUTHENTICATION with payload:",
            msgData.payload
          );
          setAuthRequestPayload(msgData.payload || null);

          if (isAuthenticated && sessionSigs) {
            console.log(
              "User already fully authenticated (including backend & sessionSigs). Sending success."
            );
            sendAuthResult(true, sessionSigs, msgData.payload?.videoId);
          } else {
            // If not fully authenticated by AuthContext's definition,
            // always try to initiate or ensure the Privy login process is started.
            // The login() from useLogin() should handle if a Privy process is already active.
            console.log(
              "User not fully authenticated by AuthContext. Attempting to call login(). Current AuthContext state: isAuthenticated =",
              isAuthenticated, // from useAuth()
              ", isAuthenticating (from AuthContext, for logging) =",
              isAuthenticating // from useAuth(), logged for clarity but not used in this condition
            );
            setLoginInitiatedByPage(true); // Track that this component instance initiated/propagated the login call
            login(); // Call login() from AuthContext, which triggers Privy's useLogin
          }
        } else {
          // Received a message with a 'type' property, but it's not REQUEST_AUTHENTICATION
          const unknownType =
            typeof (event.data as any).type === "string"
              ? (event.data as any).type
              : "unknown";
          console.warn(
            `VideoAuthContent: Received message with known structure but unexpected type: '${unknownType}'. Full message:`,
            event.data
          );
        }
      } else if (
        typeof event.data === "object" &&
        event.data !== null &&
        "name" in event.data &&
        (event.data as { name: unknown }).name === "metamask-provider"
      ) {
        // Specifically identify and log (or ignore) MetaMask messages
        // console.log("VideoAuthContent: Ignoring MetaMask provider message:", event.data);
        // No action needed for these, so we can just return or do nothing.
      }
      // Add more 'else if' blocks here for other known message sources you want to specifically handle or ignore
      else {
        // Catches truly unstructured messages or messages from other sources not matching your primary expected types.
        console.warn(
          "VideoAuthContent: Received message with unexpected structure (not an object with 'type', or not a known provider like MetaMask):",
          event.data
        );
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
        // As per user request, do not send AUTH_RESULT with success: false.
        console.log(
          "Login failed or cancelled (detected by VideoAuthContent). No AUTH_RESULT (success: false) will be sent."
        );
        // sendAuthResult(false, null, authRequestPayload.videoId); // <<< LINE REMOVED/COMMENTED
        setLoginInitiatedByPage(false); // Reset flag, auth attempt is over. Popup remains open.
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
        <strong>Authenticating...</strong>
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
    authStatusContent = <p>Authenticating...</p>;
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
