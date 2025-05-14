import Container from "@/components/layout/Container";
import { findVideosByUserId } from "@/services/server/database";
import { getVerifiedPrivyUserFromCookies } from "@/services/server/external/privy";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LibraryContent from "@/components/library/LibraryContent";

/**
 * Library page displays all videos uploaded by the authenticated user
 * This is a server component that fetches videos on the server side
 */
export default async function Library() {
  const privyUser = await getVerifiedPrivyUserFromCookies(await cookies());

  if (!privyUser) {
    redirect("/login");
  }

  const userId = privyUser.customMetadata.appUserId as string;
  const videos = await findVideosByUserId(userId);

  return (
    <Container>
      <LibraryContent videos={videos} />
    </Container>
  );
}
