"use client";

import { useState, useCallback, useRef } from "react";
import type { VideoMetadata } from "@/types";
import type { SessionSigsMap, AuthSig } from "@lit-protocol/types";
import { LitService } from "@/services/client/encrpytion/litService.client";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { camelCaseString } from "@/utils/camelCaseString";
import { randomBytes } from "crypto";
import { getPlaybackSrc } from "@/services/client/playbackApi";
import type { MediaSrc } from "@vidstack/react";

export interface VideoAccessState {
  litAuthSig: AuthSig | null;
  playbackSrc: MediaSrc | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to manage video access control using Lit Protocol and fetch playback URLs.
 *
 * @param metadata - The metadata of the video, including playbackAccess details and video ID.
 * @returns An object containing:
 *  - `videoAccessState`: The current state of access check (litAuthSig, playbackUrl, isLoading, error).
 *  - `checkAccessAndGetUrl`: Function to initiate the access check and URL fetching process.
 */
export function useVideoAccess(metadata: VideoMetadata) {
  const [videoAccessState, setVideoAccessState] = useState<VideoAccessState>({
    litAuthSig: null,
    playbackSrc: null,
    isLoading: false,
    error: null,
  });

  const litServiceRef = useRef(new LitService());

  const checkAccessAndGetUrl = useCallback(
    async (sessionSigs: SessionSigsMap | null) => {
      if (!metadata.id) {
        console.warn("[useVideoAccess] Video ID is missing in metadata.");
        setVideoAccessState({
          isLoading: false,
          litAuthSig: null,
          playbackSrc: null,
          error: "Video ID missing.",
        });
        return;
      }

      if (!sessionSigs) {
        console.warn(
          "[useVideoAccess] SessionSigs not provided for access check."
        );
        setVideoAccessState({
          isLoading: false,
          litAuthSig: null,
          playbackSrc: null,
          error: "Authentication session not found.",
        });
        return;
      }

      if (!metadata.playbackAccess) {
        console.warn(
          `[useVideoAccess] playbackAccess metadata is missing for video ${metadata.id}. Assuming public or error.`
        );
        setVideoAccessState({
          isLoading: false,
          litAuthSig: null,
          playbackSrc: null, // Or a direct public URL if applicable
          error: "Video access control information is not configured.",
        });
        return;
      }

      setVideoAccessState({
        isLoading: true,
        litAuthSig: null,
        playbackSrc: null,
        error: null,
      });

      let obtainedLitAuthSig: AuthSig | null = null;

      try {
        console.log("[useVideoAccess] Attempting to run Lit action...");
        const jsParams = {
          chain: camelCaseString(DEFAULT_CHAIN.name),
          nonce: randomBytes(16).toString("hex"),
          exp: Date.now() + 3 * 60 * 1000, // 3 minutes expiry
          ciphertext: metadata.playbackAccess.ciphertext,
          dataToEncryptHash: metadata.playbackAccess.dataToEncryptHash,
          accessControlConditions: metadata.playbackAccess.acl,
        };

        obtainedLitAuthSig = await litServiceRef.current.runLitAction(
          sessionSigs, // First argument
          jsParams // Second argument
        );

        if (!obtainedLitAuthSig) {
          throw new Error("Lit action did not return an authSig.");
        }

        console.log(
          "[useVideoAccess] Lit action successful, received authSig:",
          obtainedLitAuthSig
        );

        console.log(
          "[useVideoAccess] Attempting to get playback URL with LitAuthSig..."
        );
        const src = await getPlaybackSrc({
          tokenId: metadata.tokenId,
          authSig: obtainedLitAuthSig,
        });

        if (!src) {
          throw new Error("Failed to retrieve playback URL.");
        }

        console.log("[useVideoAccess] Playback URL received:", src);

        setVideoAccessState({
          isLoading: false,
          litAuthSig: obtainedLitAuthSig,
          playbackSrc: src,
          error: null,
        });
      } catch {
        setVideoAccessState({
          isLoading: false,
          litAuthSig: obtainedLitAuthSig,
          playbackSrc: null,
          error: "You do not have access to this video.",
        });
      }
    },
    [metadata]
  );

  return { videoAccessState, checkAccessAndGetUrl };
}
