"use client";

import { Video } from "@/types/video";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: Video[];
}

/**
 * VideoGrid component displays a responsive grid of videos
 *
 * @param videos - Array of video objects to display
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
