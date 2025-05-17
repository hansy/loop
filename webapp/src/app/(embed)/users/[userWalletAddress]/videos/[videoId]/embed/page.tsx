import { findVideoById } from "@/services/server/database";
// import EmbeddedVideoContent from "@/components/video/EmbeddedVideoContent";
import { EmbeddedVideoContent } from "@/features/player/components";
import type { VideoMetadata } from "@/types";

interface PageProps {
  params: Promise<{
    userWalletAddress: string; // Part of the URL structure
    videoId: string;
  }>;
}

/**
 * Video embed page (within the (embed) route group).
 * Displays a single video meant for embedding on third-party sites.
 * Uses the minimal (embed) layout and only includes essential components.
 *
 * @param params - Route parameters containing videoId.
 */
export default async function VideoEmbedPage({ params }: PageProps) {
  const { videoId } = await params;
  const video = await findVideoById(videoId);

  if (!video) {
    // TODO: Implement a more embed-friendly error display here.
    // For example, render a small component saying "Video not available"
    // instead of redirecting, which might break out of an iframe or show a full 404 page.
    // For now, returning a simple message or null to avoid full page redirect in embed.
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        Video not found or is unavailable.
      </div>
    );
    // redirect("/404"); // Avoid redirect in embeds if possible
  }

  const metadata = video.metadata as VideoMetadata;

  return <EmbeddedVideoContent metadata={metadata} />;
}
