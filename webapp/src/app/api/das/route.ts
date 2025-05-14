import { handleApiRoute } from "@/services/server/api";
import { AppError } from "@/services/server/api/error";
import { successResponse } from "@/services/server/api";
import { LitService } from "@/services/server/encryption/litService.server";

export const GET = handleApiRoute(async (_req, privyUser) => {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
  const litServer = new LitService();
  const das = await litServer.createDelegateAuthSig("");

  await litServer.disconnect();

  return successResponse({ delegatedAuthSig: das }, 201);
});
