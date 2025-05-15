import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES } from "@/config/contractsConfig";
import { DEFAULT_CHAIN, transport } from "@/config/chainConfig";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
  type PublicClient,
  type WalletClient,
  type TransactionReceipt,
} from "viem";
import { VideoNFTABI } from "@/abis/videoNFT";

/**
 * Service for handling blockchain contract interactions
 */
export class ContractService {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;

  constructor() {
    const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);

    // @ts-expect-error Ignore this
    this.publicClient = createPublicClient({
      chain: DEFAULT_CHAIN,
      transport: http(transport("server", DEFAULT_CHAIN.name)),
    });

    this.walletClient = createWalletClient({
      chain: DEFAULT_CHAIN,
      transport: http(transport("server", DEFAULT_CHAIN.name)),
      account,
    });
  }

  /**
   * Mints a new video NFT
   * @param creator - The creator's address
   * @param metadata - The video metadata URI (empty string for now)
   * @param price - The price in wei
   * @returns The transaction hash and token ID
   */
  async mintVideoNFT(
    creator: `0x${string}`,
    cid: string,
    price: bigint
  ): Promise<string> {
    const { request } = await this.publicClient.simulateContract({
      address: CONTRACT_ADDRESSES.VIDEO_NFT,
      abi: VideoNFTABI,
      functionName: "mintVideoNFT",
      args: [creator, cid, price],
      account: this.walletClient.account,
    });

    const hash = await this.walletClient.writeContract(request);
    const receipt = await this.waitForTransaction(hash);

    const topics = parseEventLogs({
      abi: VideoNFTABI,
      eventName: "VideoCreated",
      logs: receipt.logs,
    });

    const tokenId = topics[0].args.tokenId.toString();

    if (!tokenId) {
      throw new Error("No tokenId when minting NFT");
    }

    return tokenId;
  }

  /**
   * Waits for a transaction to be mined
   * @param hash - The transaction hash
   * @returns The transaction receipt
   */
  async waitForTransaction(hash: `0x${string}`): Promise<TransactionReceipt> {
    return this.publicClient.waitForTransactionReceipt({ hash });
  }

  async updateMetadataCID(tokenId: bigint, cid: string) {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: CONTRACT_ADDRESSES.VIDEO_NFT,
        abi: VideoNFTABI,
        functionName: "updateMetadataCID",
        args: [tokenId, cid],
        account: this.walletClient.account,
      });

      const hash = await this.walletClient.writeContract(request);
      const receipt = await this.waitForTransaction(hash);

      return receipt;
    } catch (error) {
      console.error("Error updating metadata CID", error);
      throw new Error("Error updating metadata CID");
    }
  }

  async updatePrice(tokenId: bigint, price: bigint) {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: CONTRACT_ADDRESSES.VIDEO_NFT,
        abi: VideoNFTABI,
        functionName: "updatePrice",
        args: [tokenId, price],
        account: this.walletClient.account,
      });

      const hash = await this.walletClient.writeContract(request);
      const receipt = await this.waitForTransaction(hash);

      return receipt;
    } catch (error) {
      console.error("Error updating price", error);
      throw new Error("Error updating price");
    }
  }
}
