import { task, logger } from "@trigger.dev/sdk/v3";
import type { Video, VideoMetadata } from "@/types/video";
import { pinJSON } from "@/services/server/ipfs/ipfsService";
import { updateVideo } from "@/services/server/database/videoService";
import { createVideoMetadataKeyName } from "@/utils/key";
import { ContractService } from "@/services/server/contracts/contractService";

export const updateCID = task({
  id: "update-cid",
  run: async (payload: {
    videoId: string;
    tokenId: bigint;
    metadata: VideoMetadata;
  }) => {
    const { videoId, tokenId, metadata } = payload;

    logger.log(`Updating CID for video ${videoId}`);

    try {
      logger.log("Adding new metadata to IPFS");

      const cid = await pinJSON(
        metadata as unknown as Record<string, string>,
        createVideoMetadataKeyName(videoId)
      );

      logger.log("Updating CID", { cid });

      const contractService = new ContractService();
      await contractService.updateMetadataCID(tokenId, cid);

      logger.log("CID updated. Updating price.");

      await contractService.updatePrice(tokenId, BigInt(metadata.price.amount));

      logger.log("Price updated.");

      const updateFields: Partial<Video> = {
        ipfsCid: cid,
        status: "ready",
      };

      logger.log("Updating video record in DB");

      await updateVideo(videoId, updateFields);

      logger.log("Video updated successfully");

      return true;
    } catch (e) {
      logger.error("Error updating CID", { videoId, error: e });

      throw new Error("Error updating CID");
    }
  },
});
