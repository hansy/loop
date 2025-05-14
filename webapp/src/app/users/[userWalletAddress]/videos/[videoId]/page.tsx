import { getVerifiedPrivyUserFromCookies } from "@/services/server/external/privy";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { findVideoById } from "@/services/server/database";
import { AppError } from "@/services/server/api/error";
import VideoContent from "@/components/video/VideoContent";
import Container from "@/components/layout/Container";

interface PageProps {
  params: {
    userWalletAddress: string;
    videoId: string;
  };
}

/**
 * Video view page displays a single video and its details
 * This is a server component that fetches video data on the server side
 *
 * @param params - Route parameters containing userWalletAddress and videoId
 */
export default async function VideoPage({ params }: PageProps) {
  const privyUser = await getVerifiedPrivyUserFromCookies(await cookies());

  if (!privyUser) {
    redirect("/login");
  }

  try {
    const video = await findVideoById(params.videoId);

    if (!video) {
      throw new AppError("Video not found", 404, "VIDEO_NOT_FOUND");
    }

    return (
      <Container>
        <VideoContent video={video} />
      </Container>
    );
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      redirect("/404");
    }
    throw error;
  }
}
