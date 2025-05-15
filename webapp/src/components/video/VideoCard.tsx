"use client";

import { Video } from "@/types/video";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { VideoMetadata } from "@/types/video";
import Image from "next/image";

/**
 * Interface defining the props for the VideoCard component.
 * @interface VideoCardProps
 * @property {Video} video - The video object containing metadata and status information
 */
interface VideoCardProps {
  video: Video;
}

/**
 * VideoCard is a component that displays a preview card for a single video.
 * It shows the video thumbnail, title, upload date, and status information.
 *
 * Features:
 * - Responsive thumbnail display
 * - Status badges (Processing, Failed, Ready)
 * - Upload date display
 * - Visibility and NSFW indicators
 * - Conditional link behavior based on video status
 * - Hover effects and transitions
 *
 * @component
 * @example
 * ```tsx
 * <VideoCard
 *   video={{
 *     id: "123",
 *     metadata: {
 *       title: "My Video",
 *       coverImage: "https://example.com/cover.jpg",
 *       creator: "0x123...",
 *       isNSFW: false
 *     },
 *     createdAt: "2024-01-01T00:00:00Z",
 *     status: "ready",
 *     visibility: "public"
 *   }}
 * />
 * ```
 */
export default function VideoCard({ video }: VideoCardProps) {
  const metadata = video.metadata as VideoMetadata;
  const isProcessing =
    video.status === "transcoding" || video.status === "minting";
  const isReady = video.status === "ready";
  const isFailed = video.status === "failed";

  const getStatusBadge = () => {
    if (isProcessing) {
      return (
        <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-medium">
          Processing
        </div>
      );
    }
    if (isFailed) {
      return (
        <div className="absolute top-2 right-2 bg-red-500/75 text-white px-2 py-1 rounded text-xs font-medium">
          Failed
        </div>
      );
    }
    if (isReady) {
      return (
        <div className="absolute top-2 right-2 bg-green-500/75 text-white px-2 py-1 rounded text-xs font-medium">
          Ready
        </div>
      );
    }
    return null;
  };

  return (
    <Link
      href={`${
        isReady ? `/users/${metadata.creator}/videos/${video.id}` : "#"
      } `}
      className={`block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
        !isReady ? "opacity-80 cursor-not-allowed" : ""
      }`}
    >
      <div className="aspect-video bg-gray-100 relative">
        <Image
          src={metadata.coverImage || "/cover_image.png"}
          alt={metadata.title}
          className="w-full h-full object-cover"
          width={400}
          height={400}
        />
        {/* {metadata.coverImage ? (
          <img
            src={metadata.coverImage}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No thumbnail
          </div>
        )} */}
        {getStatusBadge()}
      </div>
      <div className="p-4">
        <h3 className="text-base font-medium text-gray-900 truncate">
          {metadata.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              video.visibility === "public"
                ? "bg-green-50 text-green-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {video.visibility}
          </span>
          {metadata.isNSFW && (
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700">
              NSFW
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
