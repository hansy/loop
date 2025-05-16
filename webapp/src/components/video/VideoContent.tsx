"use client";

import { useEffect, useState, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";
import { VideoUnlockModal } from "@/features/videoUnlock";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { IPFS_GATEWAY } from "@/config/ipfsConfig";
import { truncateString } from "@/utils/truncateString";
import { Video } from "@/types/video";
import { VideoMetadata } from "@/types/video";
import { useAuth } from "@/contexts/AuthContext";
import type { SessionSigsMap, AuthSig } from "@lit-protocol/types";
import type { MediaSrc } from "@vidstack/react";
import { authSigfromSessionSigs } from "@/utils/auth";
import { getPlaybackUrl } from "@/services/client/playbackApi";
import { PlaybackAccessRequest } from "@/services/client/playbackApi";
import { usePrivy } from "@privy-io/react-auth";
import { LitService } from "@/services/client/encrpytion/litService.client";
import { camelCaseString } from "@/utils/camelCaseString";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { randomBytes } from "crypto";
/**
 * Interface defining the props for the VideoContent component.
 * @interface VideoContentProps
 * @property {Video} video - The video object containing metadata and playback information
 */
interface VideoContentProps {
  video: Video;
}

/**
 * VideoContent component displays detailed information about a single video
 * This is a client component that handles the interactive parts of the video view
 *
 * @param video - The video object to display
 */
export function VideoContent({ video }: VideoContentProps) {
  const metadata = video.metadata as VideoMetadata;
  const [src, setSrc] = useState<MediaSrc | undefined>(undefined);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [litAuthSig, setLitAuthSig] = useState<AuthSig | undefined>(undefined);
  const { sessionSigs } = useAuth();
  const { user } = usePrivy();

  const handleUnlockError = () => {
    console.error("Unlock failed:");
  };

  const fetchVideoUrl = useCallback(
    async (tokenId: string, authSig?: AuthSig) => {
      setIsLoading(true);

      try {
        const params: PlaybackAccessRequest = {
          tokenId,
          authSig,
        };

        const path = await getPlaybackUrl(params);

        setSrc({
          src: `${path}hls/index.m3u8`,
          type: "application/x-mpegurl",
        });

        setIsLocked(false);
      } catch (error) {
        console.error("Error fetching video URL:", error);
        setIsLocked(true);
        setSrc(undefined);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getLitAuthSig = useCallback(
    async (ss: SessionSigsMap | null) => {
      if (!ss) {
        return;
      }

      try {
        const litClient = new LitService();
        const authSig = await litClient.runLitAction(ss, {
          chain: camelCaseString(DEFAULT_CHAIN.name),
          nonce: randomBytes(16).toString("hex"),
          exp: Date.now() + 3 * 60 * 1000,
          ciphertext: metadata.playbackAccess?.ciphertext,
          dataToEncryptHash: metadata.playbackAccess?.dataToEncryptHash,
          accessControlConditions: metadata.playbackAccess?.acl,
        });

        setLitAuthSig(authSig);

        await litClient.disconnect();
      } catch (error) {
        console.error("Error fetching Lit auth sig:", error);

        setLitAuthSig(undefined);
      }
    },
    [metadata.playbackAccess]
  );

  const handleUnlockSuccess = useCallback(async () => {
    await getLitAuthSig(sessionSigs);
  }, [sessionSigs, getLitAuthSig]);

  useEffect(() => {
    if (sessionSigs) {
      getLitAuthSig(sessionSigs);
    }
  }, [sessionSigs, getLitAuthSig]);

  useEffect(() => {
    if (video.tokenId) {
      // First try without authSig (in case video is public)
      fetchVideoUrl(video.tokenId.toString());
    }
  }, [fetchVideoUrl, video.tokenId]);

  useEffect(() => {
    // If first attempt failed and we have sessionSigs, try again with authSig
    if (isLocked && !!video.tokenId && !isLoading && litAuthSig) {
      fetchVideoUrl(video.tokenId.toString(), litAuthSig);
    }
  }, [isLocked, fetchVideoUrl, video.tokenId, isLoading, litAuthSig]);

  return (
    <div className="space-y-8">
      {/* Video Player */}
      <VideoPlayer
        src={src}
        poster={metadata.coverImage}
        title={metadata.title}
        isLoading={isLoading}
        isAuthenticated={!!sessionSigs}
        isLocked={isLocked}
        onPlay={() => {
          // TODO: Implement analytics or other play tracking
          console.log("Video started playing");
        }}
        onPause={() => {
          // TODO: Implement analytics or other pause tracking
          console.log("Video paused");
        }}
        onEnded={() => {
          // TODO: Implement analytics or other end tracking
          console.log("Video ended");
        }}
        onProfileClick={() => {
          console.log("Profile clicked");
        }}
        onAuthenticate={() => {
          console.log("Authenticate clicked");
        }}
        onUnlockClick={() => setIsUnlockModalOpen(true)}
      />

      {/* Video Details */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {metadata.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Uploaded{" "}
              {formatDistanceToNow(new Date(video.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Link
                href={`${IPFS_GATEWAY}${video.ipfsCid}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <code className="text-sm text-gray-900 font-mono">
                  {truncateString(video.ipfsCid, 5, 5)}
                </code>
              </Link>
            </div>
          </div>
        </div>

        {metadata.description && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">
              {metadata.description}
            </p>
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      <VideoUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        metadata={metadata}
        handlers={{
          onUnlockSuccess: handleUnlockSuccess,
          onUnlockError: handleUnlockError,
        }}
        hasEmbeddedWallet={user?.wallet?.connectorType === "embedded"}
      />
    </div>
  );
}
