import { getVerifiedPrivyUserFromCookies } from "@/services/server/external/privy";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { findVideoById } from "@/services/server/database";
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
  let video;

  try {
    await getVerifiedPrivyUserFromCookies(await cookies());

    video = await findVideoById(params.videoId);
  } catch {
    redirect("/login");
  }

  if (!video) {
    redirect("/404");
  }

  return (
    <Container>
      <VideoContent video={video} />
    </Container>
  );
}
