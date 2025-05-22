"use client";

import { useState, useCallback, useMemo } from "react";
import VideoPlayer from "./VideoPlayer";
import { VideoUnlockModal } from "@/features/videoUnlock";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { IPFS_GATEWAY } from "@/config/ipfsConfig";
import { Video } from "@/types/video";
import { VideoMetadata } from "@/types/video";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivy } from "@privy-io/react-auth";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import VideoEmbedCode from "./VideoEmbedCode";
import { APP_HOST } from "@/config/appConfig";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useVideoPlayback } from "@/hooks/useVideoPlayback";

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
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const { sessionSigs, isAuthenticating } = useAuth();
  const { user } = usePrivy();
  const { src, isLoading, fetchVideoSrc } = useVideoPlayback(
    video.metadata as VideoMetadata,
    sessionSigs
  );

  const isLocked = useMemo(() => {
    return !!!src;
  }, [src]);

  const handleUnlockError = (error: string) => {
    showErrorToast(error);
  };

  const handleUnlockSuccess = useCallback(async () => {
    showSuccessToast("Video unlocked successfully");
    setIsUnlockModalOpen(false);

    await fetchVideoSrc();
  }, [fetchVideoSrc]);

  return (
    <div className="space-y-8">
      {/* Video Player */}
      <VideoPlayer
        src={src}
        poster={metadata.coverImage}
        title={metadata.title}
        isLoading={isLoading || isAuthenticating}
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
            <div>
              <div className="mt-2 flex">
                <Link
                  href={`${IPFS_GATEWAY}${video.ipfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  type="button"
                  className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 sm:text-sm/6"
                >
                  <span>IPFS</span>
                  <ArrowTopRightOnSquareIcon className="ml-2 w-4 h-4" />
                </Link>
                <input
                  readOnly
                  id="company-website"
                  name="company-website"
                  type="text"
                  value={video.ipfsCid as string}
                  className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
            <VideoEmbedCode
              appHost={APP_HOST}
              creatorAddress={metadata.creator}
              videoId={video.id}
              videoTitle={metadata.title}
            />
          </div>
        </div>

        {metadata.description && (
          <div className="mt-6">
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
