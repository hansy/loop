"use client";

import { MediaPlayer, MediaProvider, Poster, Track } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VideoPlayerProps {
  src: string | null;
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
  if (isLoading) {
    return (
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">This video is locked</div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <MediaPlayer
        className="w-full h-full"
        title={title}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      >
        <MediaProvider>
          <Poster className="vds-poster" src={poster} alt={title} />
          <video src={src} />

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
      </MediaPlayer>
    </div>
  );
}
