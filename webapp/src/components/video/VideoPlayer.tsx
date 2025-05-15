"use client";

import { MediaPlayer, MediaProvider, Poster, Track } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { HLSSrc } from "@vidstack/react";

interface VideoPlayerProps {
  src: HLSSrc | undefined;
  poster?: string;
  title?: string;
  captions?: {
    src: string;
    label: string;
    language: string;
  }[];
  isLoading?: boolean;
  isLocked: boolean;
  isAuthenticated: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

/**
 * VideoPlayer is a stateless component that renders a video player using Vidstack.
 * It supports basic video playback with optional poster images and captions.
 * The player can handle different states like loading, errors, and locked content.
 *
 * @example
 * ```tsx
 * <VideoPlayer
 *   src="https://example.com/video.mp4"
 *   poster="https://example.com/poster.jpg"
 *   title="My Video"
 *   isLoading={false}
 *   error={null}
 * />
 * ```
 */
export default function VideoPlayer({
  src,
  poster,
  title,
  captions,
  isLoading = false,
  isLocked = true,
  isAuthenticated = false,
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <MediaPlayer
        className="w-full h-full"
        title={title}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        playsInline
        autoPlay={false}
        muted={false}
        src={src}
      >
        <MediaProvider>
          <Poster className="vds-poster" src={poster} alt={title} />
          {captions?.map((caption) => (
            <Track
              key={caption.src}
              src={caption.src}
              label={caption.label}
              language={caption.language}
              kind="captions"
              default
            />
          ))}
        </MediaProvider>

        <DefaultVideoLayout icons={defaultLayoutIcons} />

        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner className="h-12 w-12 border-b-2 border-gray-100" />
            </div>
          </div>
        )}

        {!isLoading && !src && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-gray-100">This video is locked</div>
          </div>
        )}
      </MediaPlayer>
    </div>
  );
}
