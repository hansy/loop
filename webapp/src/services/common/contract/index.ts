import { DEFAULT_CHAIN, transport } from "@/config/chainConfig";
import {
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  http,
  type Account,
  parseEventLogs,
} from "viem";

export default class Contract {
  address: string;
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: Account;

  constructor(address: string, account: any) {
    this.address = address;

    this.publicClient = createPublicClient({
      chain: DEFAULT_CHAIN,
      transport: http(transport("server", DEFAULT_CHAIN.name)),
    });

    this.walletClient = createWalletClient({
      chain: DEFAULT_CHAIN,
      transport: http(transport("server", DEFAULT_CHAIN.name)),
    });
    this.account = account;
  }

  async write(
    abi: any,
    functionName: string,
    args: any[],
    waitForReceipt = false
  ) {
    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.address as `0x${string}`,
        abi,
        functionName,
        args,
        account: this.account,
      });

      const tx = await this.walletClient.writeContract(request);

      if (waitForReceipt) {
        await this.getTransactionReceipt(tx);
      }

      return tx;
    } catch (e) {
      console.error("Error writing to contract", e, functionName, args);

      return null;
    }
  }

  async getTransactionReceipt(hash: `0x${string}`) {
    return await this.publicClient.waitForTransactionReceipt({
      hash,
    });
  }

  parseEventLogs({ abi, eventName, logs }: any) {
    return parseEventLogs({
      abi,
      eventName,
      logs,
    });
  }
}
