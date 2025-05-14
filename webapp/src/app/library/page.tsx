import Container from "@/components/layout/Container";
import { findVideosByUserId } from "@/services/server/database";
import { getVerifiedPrivyUserFromCookies } from "@/services/server/external/privy";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LibraryContent from "@/components/library/LibraryContent";
import type { User } from "@privy-io/server-auth";

/**
 * Library page displays all videos uploaded by the authenticated user
 * This is a server component that fetches videos on the server side
 */
export default async function Library() {
  let privyUser: User;
  try {
    privyUser = await getVerifiedPrivyUserFromCookies(await cookies());
  } catch {
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
