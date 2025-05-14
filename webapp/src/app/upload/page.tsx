import { getVerifiedPrivyUserFromCookies } from "@/services/server/external/privy";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import UploadContent from "@/components/upload/UploadContent";

/**
 * Upload page allows users to upload new videos
 * This is a server component that handles authentication on the server side
 */
export default async function UploadPage() {
  const privyUser = await getVerifiedPrivyUserFromCookies(await cookies());

  if (!privyUser) {
    redirect("/login");
  }

  return <UploadContent />;
}
