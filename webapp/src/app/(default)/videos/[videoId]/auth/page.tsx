import { findVideoById } from "@/services/server/database";
import { VideoMetadata } from "@/types/video";
import VideoAuthContent from "@/components/video/VideoAuthContent";

interface VideoAuthPageProps {
  params: Promise<{ videoId?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Server component page for handling video authentication within an embed context.
 * It fetches video metadata and player origin, then renders VideoAuthContent
 * to handle the client-side authentication flow.
 *
 * @param params Page parameters, expecting videoId.
 * @param searchParams Query parameters, expecting playerOrigin.
 * @returns React component.
 */
export default async function VideoAuthPage({
  params,
  searchParams,
}: VideoAuthPageProps) {
  const { videoId } = await params;
  const playerOrigin = (await searchParams).playerOrigin as string | undefined;

  if (!videoId) {
    console.error("VideoAuthPage: videoId is missing from params.");
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", color: "#333" }}>
        <h1>Authentication Error</h1>
        <p>Video identifier is missing. Cannot proceed with authentication.</p>
        <p>Please ensure the link or embed code is correct.</p>
      </div>
    );
  }

  if (!playerOrigin) {
    console.error("VideoAuthPage: playerOrigin is missing from searchParams.");
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", color: "#333" }}>
        <h1>Authentication Configuration Error</h1>
        <p>
          Player origin not specified. This page cannot proceed with
          authentication.
        </p>
        <p>
          This is likely an issue with how the video is embedded. Please contact
          support.
        </p>
      </div>
    );
  }

  let videoObject: { metadata: VideoMetadata } | null = null;
  try {
    const rawVideoData = await findVideoById(videoId);
    if (
      rawVideoData &&
      typeof rawVideoData.metadata === "object" &&
      rawVideoData.metadata !== null
    ) {
      videoObject = rawVideoData as { metadata: VideoMetadata };
    } else if (rawVideoData) {
      console.warn(
        `VideoAuthPage: Video data found for ID ${videoId}, but metadata is missing or invalid.`
      );
    }
  } catch (error) {
    console.error(
      `VideoAuthPage: Error fetching video data for ID ${videoId}:`,
      error
    );
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", color: "#333" }}>
        <h1>Authentication Error</h1>
        <p>
          Could not load video information. An unexpected error occurred while
          fetching video details.
        </p>
        <p>
          Please try again. If the issue persists, the video may be unavailable
          or there might be a server problem.
        </p>
      </div>
    );
  }

  if (!videoObject || !videoObject.metadata) {
    console.warn(`VideoAuthPage: Video metadata not found for ID ${videoId}.`);
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", color: "#333" }}>
        <h1>Authentication Error</h1>
        <p>
          Video information incomplete or not found. The requested video (ID:{" "}
          {videoId}) may not have valid metadata or is no longer available.
        </p>
        <p>Please check the video ID or contact the site administrator.</p>
      </div>
    );
  }

  const metadata: VideoMetadata = videoObject.metadata;

  return <VideoAuthContent metadata={metadata} origin={playerOrigin} />;
}
