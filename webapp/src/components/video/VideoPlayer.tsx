"use client";

import { MediaPlayer, MediaProvider, Poster, Track } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import type { MediaSrc } from "@vidstack/react";
import VideoPlayerOverlay from "./VideoPlayerOverlay";

/**
 * Interface defining the props for the VideoPlayer component.
 * @interface VideoPlayerProps
 * @property {MediaSrc} src - The HLS video source URL and type
 * @property {string} [poster] - Optional poster image URL to display before video playback
 * @property {string} [title] - Optional title of the video
 * @property {Array<{src: string, label: string, language: string}>} [captions] - Optional array of caption tracks
 * @property {boolean} [isLoading=false] - Whether the video is in a loading state
 * @property {boolean} isLocked - Whether the video is locked and requires authentication
 * @property {boolean} isAuthenticated - Whether the user is authenticated
 * @property {VideoMetadata} video - Metadata for the video
 * @property {() => void} [onPlay] - Callback when video starts playing
 * @property {() => void} [onPause] - Callback when video is paused
 * @property {() => void} [onEnded] - Callback when video playback ends
 * @property {() => void} [onProfileClick] - Callback when profile button is clicked
 * @property {() => void} [onAuthenticate] - Callback when authentication is requested
 * @property {() => void} [onUnlockClick] - Callback when video unlock is requested
 */
interface VideoPlayerProps {
  src?: MediaSrc;
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
  onProfileClick?: () => void;
  onAuthenticate?: () => void;
  onUnlockClick?: () => void;
}

/**
 * VideoPlayer is a component that renders a video player with various features.
 * It uses Vidstack for video playback and includes custom overlays for different states.
 *
 * Features:
 * - HLS video playback
 * - Custom poster image
 * - Caption support
 * - Loading state
 * - Locked state with authentication
 * - Profile integration
 * - Event callbacks
 *
 * @component
 * @example
 * ```tsx
 * <VideoPlayer
 *   src={{ src: "https://example.com/video.m3u8", type: "application/x-mpegurl" }}
 *   poster="https://example.com/poster.jpg"
 *   title="My Video"
 *   isLocked={false}
 *   isAuthenticated={true}
 *   onPlay={() => console.log("Video started playing")}
 * />
 * ```
 */
export default function VideoPlayer({
  src,
  poster,
  title,
  captions,
  isLoading = false,
  isLocked,
  isAuthenticated,
  onPlay,
  onPause,
  onEnded,
  onProfileClick,
  onAuthenticate,
  onUnlockClick,
}: VideoPlayerProps) {
  const showPosterImage = (coverImage?: string) => {
    if (coverImage) {
      return coverImage;
    }

    return "/cover_image.png";
  };

  return (
    <MediaPlayer
      className="w-full aspect-video bg-black"
      title={title}
      src={src}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
    >
      <MediaProvider>
        <Poster
          src={showPosterImage(poster)}
          className="absolute inset-0 block h-full w-full bg-black rounded-md opacity-0 transition-opacity data-[visible]:opacity-100 [&>img]:h-full [&>img]:w-full [&>img]:object-contain object-cover"
        />
        {captions?.map((caption) => (
          <Track
            key={caption.src}
            src={caption.src}
            label={caption.label}
            language={caption.language}
            kind="captions"
          />
        ))}
      </MediaProvider>

      <DefaultVideoLayout icons={defaultLayoutIcons} />

      <VideoPlayerOverlay
        isLoading={isLoading}
        isLocked={isLocked}
        isAuthenticated={isAuthenticated}
        onProfileClick={onProfileClick}
        onAuthenticate={onAuthenticate}
        onUnlockClick={onUnlockClick}
      />
    </MediaPlayer>
  );
}
