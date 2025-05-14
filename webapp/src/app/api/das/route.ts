import { handleApiRoute } from "@/services/server/api";
import { AppError } from "@/services/server/api/error";
import { successResponse } from "@/services/server/api";
import { LitService } from "@/services/server/encryption/litService.server";

export const GET = handleApiRoute(async (req, privyUser) => {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const walletAddress = req.nextUrl.searchParams.get("walletAddress");

  if (!walletAddress) {
    throw new AppError(
      "Wallet address is required",
      400,
      "WALLET_ADDRESS_REQUIRED"
    );
  }

  const litServer = new LitService();
  const das = await litServer.createDelegateAuthSig(walletAddress);

  await litServer.disconnect();

  return successResponse({ delegatedAuthSig: das }, 201);
});
