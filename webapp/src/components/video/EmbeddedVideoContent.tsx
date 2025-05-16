"use client";

import VideoPlayer from "./VideoPlayer";
import type { VideoMetadata } from "@/types";
import { useState } from "react";
import type { SessionSigsMap } from "@lit-protocol/types";

interface Props {
  metadata: VideoMetadata;
}

export default function EmbeddedVideoContent({ metadata }: Props) {
  const [src, setSrc] = useState<MediaSrc | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<SessionSigsMap | undefined>(
    undefined
  );
  return (
    <>
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
        onUnlockClick={() => {
          console.log("Unlock clicked");
        }}
      />
    </>
  );
}
