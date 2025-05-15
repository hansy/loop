"use client";

import { MediaPlayer, MediaProvider, Poster, Track } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import type { HLSSrc } from "@vidstack/react";
import VideoPlayerOverlay from "./VideoPlayerOverlay";

/**
 * Interface defining the props for the VideoPlayer component.
 * @interface VideoPlayerProps
 * @property {HLSSrc | undefined} src - The HLS video source URL and type
 * @property {string} [poster] - Optional poster image URL to display before video playback
 * @property {string} [title] - Optional title of the video
 * @property {Array<{src: string, label: string, language: string}>} [captions] - Optional array of caption tracks
 * @property {boolean} [isLoading=false] - Whether the video is in a loading state
 * @property {boolean} isLocked - Whether the video is locked and requires authentication
 * @property {boolean} isAuthenticated - Whether the user is authenticated
 * @property {() => void} [onPlay] - Callback when video starts playing
 * @property {() => void} [onPause] - Callback when video is paused
 * @property {() => void} [onEnded] - Callback when video playback ends
 * @property {() => void} [onVerifyAccess] - Callback to verify video access
 * @property {() => void} [onProfileClick] - Callback when profile button is clicked
 * @property {() => void} [onAuthenticate] - Callback when authentication is requested
 * @property {() => void} [onUnlock] - Callback when video unlock is requested
 */
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
  onVerifyAccess?: () => void;
  onProfileClick?: () => void;
  onAuthenticate?: () => void;
  onUnlock?: () => void;
}

/**
 * VideoPlayer is a stateless component that renders a video player using Vidstack.
 * It supports basic video playback with optional poster images and captions.
 * The player can handle different states like loading, errors, and locked content.
 *
 * Features:
 * - HLS video playback support
 * - Loading state with spinner
 * - Locked state with authentication flow
 * - Optional poster images
 * - Caption support
 * - Customizable callbacks for player events
 *
 * @component
 * @example
 * ```tsx
 * <VideoPlayer
 *   src={{
 *     src: "https://example.com/video.m3u8",
 *     type: "application/x-mpegurl"
 *   }}
 *   poster="https://example.com/poster.jpg"
 *   title="My Video"
 *   isLoading={false}
 *   isLocked={true}
 *   isAuthenticated={false}
 *   onPlay={() => console.log("Video started")}
 *   onPause={() => console.log("Video paused")}
 *   onEnded={() => console.log("Video ended")}
 *   onAuthenticate={() => handleAuth()}
 *   onUnlock={() => handleUnlock()}
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
  onProfileClick,
  onAuthenticate,
  onUnlock,
}: VideoPlayerProps) {
  console.log(src);
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

        <VideoPlayerOverlay
          isLoading={isLoading}
          isLocked={isLocked}
          isAuthenticated={isAuthenticated}
          onProfileClick={onProfileClick}
          onAuthenticate={onAuthenticate}
          onUnlock={onUnlock}
        />
      </MediaPlayer>
    </div>
  );
}
