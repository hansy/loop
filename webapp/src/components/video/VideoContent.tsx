"use client";

import { Video } from "@/types/video";
import { formatDistanceToNow } from "date-fns";
import { VideoMetadata } from "@/types/video";
import Link from "next/link";
import { IPFS_GATEWAY } from "@/config/ipfsConfig";
import { truncateString } from "@/utils/truncateString";

interface VideoContentProps {
  video: Video;
}

/**
 * VideoContent component displays detailed information about a single video
 * This is a client component that handles the interactive parts of the video view
 *
 * @param video - The video object to display
 */
export default function VideoContent({ video }: VideoContentProps) {
  const metadata = video.metadata as VideoMetadata;

  return (
    <div className="space-y-8">
      {/* Video Player Placeholder */}
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Video player coming soon</p>
      </div>

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
