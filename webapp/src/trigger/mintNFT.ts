import { logger, task } from "@trigger.dev/sdk/v3";
import {
  findVideoById,
  updateVideo,
} from "@/services/server/database/videoService";
import { ContractService } from "@/services/server/contracts/contractService";
import { LitService } from "@/services/server/encryption/litService.server";
import { ACC_TOKEN_PLACEHOLDER } from "@/config/litConfig";
import { Wallet } from "ethers";
import { VideoMetadata } from "@/types";
import { updateCID } from "./updateCID";

export const mintNFT = task({
  id: "mint-nft",
  maxDuration: 300,
  run: async (payload: { videoId: string }) => {
    const contractService = new ContractService();
    const litService = new LitService();

    try {
      // 1. Get video
      const video = await findVideoById(payload.videoId);
      if (!video) throw new Error("Video not found");
      const metadata = video.metadata as VideoMetadata;

      // 2. Mint NFT
      const tokenId = await contractService.mintVideoNFT(
        metadata.creator as `0x${string}`,
        "",
        BigInt(metadata.price.amount)
      );

      // 3. Handle encryption if needed
      let newMetadata = { ...metadata, tokenId };

      if (newMetadata.playbackAccess) {
        // Replace the tokenId placeholder with the actual tokenId
        const newMetadataStr = JSON.stringify(newMetadata).replace(
          ACC_TOKEN_PLACEHOLDER,
          tokenId
        );
        newMetadata = JSON.parse(newMetadataStr);

        const wallet = Wallet.createRandom();
        const encryptedAccess = await litService.encryptPlaybackAccess(
          newMetadata.playbackAccess!.acl,
          {
            privateKey: wallet.privateKey,
            videoTokenId: tokenId,
            videoId: payload.videoId,
          }
        );
        newMetadata.playbackAccess = encryptedAccess;

        await litService.disconnect();
      }

      // 4. Update video
      await updateVideo(payload.videoId, {
        tokenId: BigInt(tokenId),
        metadata: newMetadata,
      });

      // 5. Update CID
      await updateCID.trigger({
        videoId: payload.videoId,
        tokenId: BigInt(tokenId),
        metadata: newMetadata,
      });

      return true;
    } catch (e) {
      logger.error("Error minting video", {
        videoId: payload.videoId,
        error: e,
      });
      await updateVideo(payload.videoId, { status: "failed" });
      throw new Error("Error minting video");
    }
  },
});
