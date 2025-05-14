"use client";

import { Video } from "@/types/video";
import VideoGrid from "@/components/video/VideoGrid";
import Link from "next/link";

interface LibraryContentProps {
  videos: Video[];
}

/**
 * LibraryContent component displays the library page content
 * This is a client component that handles the interactive parts of the library page
 *
 * @param videos - Array of video objects to display
 */
export default function LibraryContent({ videos }: LibraryContentProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Videos</h1>
        <Link
          href="/upload"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Upload Video
        </Link>
      </div>

      <VideoGrid videos={videos} />
    </div>
  );
}
