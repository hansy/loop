import { useState, useCallback, useEffect } from "react";
import type { SessionSigsMap, AuthSig } from "@lit-protocol/types";
import type { MediaSrc } from "@vidstack/react";
import { getPlaybackSrc } from "@/services/client/playbackApi";
import { PlaybackAccessRequest } from "@/services/client/playbackApi";
import { LitService } from "@/services/client/encrpytion/litService.client";
import { camelCaseString } from "@/utils/camelCaseString";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { randomBytes } from "crypto";
import { VideoMetadata } from "@/types/video";

/**
 * Interface for the hook's return value
 */
interface UseVideoPlaybackReturn {
  src: MediaSrc | undefined;
  isLoading: boolean;
  fetchVideoSrc: () => Promise<void>;
}

/**
 * Custom hook to manage video playback state and authentication
 * @param video - The video object containing metadata and playback information
 * @returns Object containing video playback state and handlers
 */
export function useVideoPlayback(
  metadata: VideoMetadata,
  sessionSigs: SessionSigsMap | null
): UseVideoPlaybackReturn {
  const [src, setSrc] = useState<MediaSrc | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [litAuthSig, setLitAuthSig] = useState<AuthSig | undefined>(undefined);

  const generateLitAuthSig = useCallback(
    async (ss: SessionSigsMap | null) => {
      if (!ss || !metadata.tokenId) return;

      setIsLoading(true);
      const litClient = new LitService();

      try {
        const params = {
          chain: camelCaseString(DEFAULT_CHAIN.name),
          nonce: randomBytes(16).toString("hex"),
          exp: Date.now() + 3 * 60 * 1000,
          ciphertext: metadata.playbackAccess?.ciphertext,
          dataToEncryptHash: metadata.playbackAccess?.dataToEncryptHash,
          accessControlConditions: metadata.playbackAccess?.acl,
        };

        const authSig = await litClient.runLitAction(ss, params);

        setLitAuthSig(authSig);

        return authSig;
      } catch (error) {
        console.error("Error fetching Lit auth sig:", error);
      } finally {
        setIsLoading(false);
        await litClient.disconnect();
      }
    },
    [metadata.playbackAccess, metadata.tokenId]
  );

  const fetchVideoSrc = useCallback(async () => {
    setIsLoading(true);

    let authSig = litAuthSig;

    try {
      if (!authSig && sessionSigs) {
        authSig = await generateLitAuthSig(sessionSigs);
      }

      const params: PlaybackAccessRequest = {
        tokenId: metadata.tokenId.toString(),
        authSig,
      };
      const newSrc = await getPlaybackSrc(params);

      setSrc(newSrc);
    } catch (error) {
      console.error("Error fetching video URL:", error);

      setSrc(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [metadata.tokenId, litAuthSig, generateLitAuthSig, sessionSigs]);

  // Initial fetch attempt
  useEffect(() => {
    fetchVideoSrc();
  }, [fetchVideoSrc]);

  return {
    src,
    isLoading,
    fetchVideoSrc,
  };
}
