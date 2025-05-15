"use client";

import { Video } from "@/types/video";
import VideoCard from "./VideoCard";

/**
 * Interface defining the props for the VideoGrid component.
 * @interface VideoGridProps
 * @property {Video[]} videos - Array of video objects to display in the grid
 */
interface VideoGridProps {
  videos: Video[];
}

/**
 * VideoGrid is a component that displays a responsive grid of video cards.
 * It handles empty states and provides a consistent layout for video collections.
 *
 * Features:
 * - Responsive grid layout (1-4 columns based on screen size)
 * - Empty state handling
 * - Consistent spacing and alignment
 * - Automatic grid item sizing
 *
 * @component
 * @example
 * ```tsx
 * <VideoGrid
 *   videos={[
 *     {
 *       id: "123",
 *       metadata: {
 *         title: "Video 1",
 *         coverImage: "https://example.com/cover1.jpg"
 *       },
 *       status: "ready"
 *     },
 *     {
 *       id: "456",
 *       metadata: {
 *         title: "Video 2",
 *         coverImage: "https://example.com/cover2.jpg"
 *       },
 *       status: "processing"
 *     }
 *   ]}
 * />
 * ```
 */
export default function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No videos yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload your first video to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
