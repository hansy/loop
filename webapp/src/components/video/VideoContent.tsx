"use client";

import { useEffect, useState, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";
import { authSigfromSessionSigs } from "../../utils/auth";
import {
  getPlaybackUrl,
  PlaybackAccessRequest,
} from "@/services/client/playbackApi";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { IPFS_GATEWAY } from "@/config/ipfsConfig";
import { truncateString } from "@/utils/truncateString";
import { Video } from "@/types/video";
import { VideoMetadata } from "@/types/video";
import { useAuth } from "@/contexts/AuthContext";
import type { SessionSigsMap } from "@lit-protocol/types";
import type { HLSSrc } from "@vidstack/react";

interface VideoContentProps {
  video: Video;
}

/**
 * VideoContent component displays detailed information about a single video
 * This is a client component that handles the interactive parts of the video view
 *
 * @param video - The video object to display
 * @param sessionSigs - Optional session signatures for authentication
 */
export function VideoContent({ video }: VideoContentProps) {
  const metadata = video.metadata as VideoMetadata;
  const [src, setSrc] = useState<HLSSrc | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const { sessionSigs } = useAuth();

  const fetchVideoUrl = useCallback(
    async (tokenId: string, sessionSigs?: SessionSigsMap) => {
      setIsLoading(true);

      try {
        const params: PlaybackAccessRequest = {
          tokenId,
        };
        if (sessionSigs) {
          params.authSig = authSigfromSessionSigs(sessionSigs);
        }

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

  // useEffect(() => {
  //   if (video.tokenId) {
  //     // First try without authSig (in case video is public)
  //     fetchVideoUrl(video.tokenId.toString());
  //   }
  // }, [fetchVideoUrl, video.tokenId]);

  // useEffect(() => {
  //   // If first attempt failed and we have sessionSigs, try again with authSig
  //   if (isLocked && !!video.tokenId && !isLoading && sessionSigs) {
  //     fetchVideoUrl(video.tokenId.toString(), sessionSigs);
  //   }
  // }, [sessionSigs, isLocked, fetchVideoUrl, video.tokenId, isLoading]);

  return (
    <div className="space-y-8">
      {/* Video Player - Always rendered */}
      <VideoPlayer
        src={src}
        poster={metadata.coverImage}
        title={metadata.title}
        isLoading={isLoading}
        isAuthenticated={false}
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
    </div>
  );
}
