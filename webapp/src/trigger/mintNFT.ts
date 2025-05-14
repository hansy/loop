import { logger, task } from "@trigger.dev/sdk/v3";
import {
  findVideoById,
  updateVideo,
} from "@/services/server/database/videoService";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import { DEFAULT_CHAIN, transport } from "@/config/chainConfig";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
} from "viem";
import { VideoNFTABI } from "@/abis/videoNFT";
import { VideoMetadata } from "@/types";
import { ACC_TOKEN_PLACEHOLDER } from "@/config/litConfig";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { encryptString } from "@lit-protocol/encryption";
import { Wallet } from "ethers";

export const mintNFT = task({
  id: "mint-nft",
  maxDuration: 300,
  run: async (payload: { videoId: string }) => {
    const { videoId } = payload;

    logger.log(`Minting NFT for video ${videoId}`);

    try {
      logger.log("Fetching video record from DB");

      const video = await findVideoById(videoId);

      if (!video) {
        throw new Error("Video not found");
      }

      const metadata = video.metadata as VideoMetadata;

      logger.log("Setting up provider and wallet");

      const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
      const publicClient = createPublicClient({
        chain: DEFAULT_CHAIN,
        transport: http(transport("server", DEFAULT_CHAIN.name)),
      });
      const walletClient = createWalletClient({
        chain: DEFAULT_CHAIN,
        transport: http(transport("server", DEFAULT_CHAIN.name)),
        account,
      });
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESSES.VIDEO_NFT,
        abi: VideoNFTABI,
        functionName: "mintVideoNFT",
        args: [
          metadata.creator as `0x${string}`,
          "",
          BigInt(metadata.price.amount),
        ],
        account,
      });
      const hash = await walletClient.writeContract(request);

      logger.log("Calling mintVideoNFT contract method");

      if (hash) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const topics = parseEventLogs({
          abi: VideoNFTABI,
          eventName: "VideoCreated",
          logs: receipt.logs,
        });

        const tokenId = topics[0].args.tokenId.toString();

        logger.log("Minted NFT", { tokenId });

        if (tokenId) {
          let newMetadata = { ...metadata, tokenId };

          if (newMetadata.playbackAccess) {
            logger.log("Playback access found, generating new acl");

            // Replace the tokenId placeholder with the actual tokenId
            const newMetadataStr = JSON.stringify(newMetadata).replace(
              ACC_TOKEN_PLACEHOLDER,
              tokenId
            );

            newMetadata = JSON.parse(newMetadataStr);

            const litClient = new LitJsSdk.LitNodeClientNodeJs({
              alertWhenUnauthorized: false,
              litNetwork: LIT_NETWORK.DatilTest,
              debug: true,
            });

            const wallet = Wallet.createRandom();
            const { ciphertext, dataToEncryptHash } = await encryptString(
              {
                unifiedAccessControlConditions: newMetadata.playbackAccess!.acl,
                dataToEncrypt: JSON.stringify({
                  privateKey: wallet.privateKey,
                  videoTokenId: tokenId,
                  videoId,
                }),
              },
              litClient
            );

            const newPlaybackAccess = {
              acl: newMetadata.playbackAccess!.acl,
              ciphertext,
              dataToEncryptHash,
              type: "lit" as const,
            };

            newMetadata.playbackAccess = newPlaybackAccess;
          }

          logger.log(
            "Updating video record in DB with tokenId and new metadata"
          );

          await updateVideo(videoId, {
            tokenId: BigInt(tokenId),
            metadata: newMetadata,
          });

          logger.log("Minted NFT successfully");

          return true;
        }

        throw new Error("No tokenId when minting NFT");
      }

      throw new Error("No tx hash when minting NFT");
    } catch (e) {
      logger.error("Error minting video", { videoId, error: e });
      await updateVideo(videoId, { status: "failed" });

      throw new Error("Error minting video");
    }
  },
});
