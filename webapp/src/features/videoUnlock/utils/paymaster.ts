import { http, PublicClient, WalletClient } from "viem";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import {
  entryPoint07Address,
  type EntryPointVersion,
} from "viem/account-abstraction";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";

export const RPC_URL = process.env.NEXT_PUBLIC_PAYMASTER_RPC_ENDPOINT!;

/**
 * Pimlico public client for paymaster transactions
 * Uses the paymaster RPC endpoint for all transactions
 */

export const pimlicoClient = createPimlicoClient({
  chain: DEFAULT_CHAIN,
  transport: http(RPC_URL),
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7" as EntryPointVersion,
  },
});

export const getSmartAccountClient = async (
  publicClient: PublicClient,
  walletClient: WalletClient
) => {
  return createSmartAccountClient({
    account: await toSimpleSmartAccount({
      client: publicClient,
      // @ts-expect-error ignore
      owner: walletClient,
    }),
    chain: DEFAULT_CHAIN,
    bundlerTransport: http(RPC_URL),
    paymaster: pimlicoClient, // optional
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast; // only when using pimlico bundler
      },
    },
  });
};
