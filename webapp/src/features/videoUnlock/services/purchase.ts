// import { createSmartAccountClient } from "permissionless";
// import {
//   encodeFunctionData,
//   http,
//   type WalletClient,
//   type Signature,
//   type PublicClient,
// } from "viem";
// import { toSimpleSmartAccount } from "permissionless/accounts";
// import { baseSepolia } from "viem/chains";
// import { entryPoint07Address } from "viem/account-abstraction";
// import { purchaseManagerABI } from "@/constants/abis";
// import type { VideoMetadata } from "@/types/video";
// import { pimlicoClient, createBundlerClient } from "../utils/paymaster";
// import { CONTRACT_ADDRESSES } from "@/config/contractsConfig";

// const RPC_URL = process.env.NEXT_PUBLIC_PAYMASTER_RPC_ENDPOINT!;

// /**
//  * Executes a video purchase transaction
//  * @param walletClient The wallet client to use for the transaction
//  * @param publicClient The public client to use for the transaction
//  * @param tokenId The ID of the video token to purchase
//  * @param signature The permit signature
//  * @param deadline The deadline for the permit
//  * @returns The transaction hash
//  */
// export const executePurchase = async (
//   walletClient: WalletClient,
//   publicClient: PublicClient,
//   tokenId: string,
//   signature: Signature,
//   deadline: bigint
// ): Promise<string> => {
//   try {
//     if (!walletClient.account?.address) {
//       throw new Error("No account address found in wallet client");
//     }

//     const bundlerClient = await createBundlerClient(publicClient, walletClient);

//     const simpleAccount = await toSimpleSmartAccount({
//       signer: walletClient,
//       client: pimlicoClient,
//       entryPoint: {
//         address: entryPoint07Address,
//         version: "0.7",
//       },
//     });

//     const smartAccountClient = createSmartAccountClient({
//       account: simpleAccount,
//       chain: baseSepolia,
//       bundlerTransport: http(RPC_URL),
//     });

//     const callData = encodeFunctionData({
//       abi: purchaseManagerABI,
//       functionName: "purchaseVideoWithPermit",
//       args: [
//         tokenId,
//         walletClient.account.address,
//         deadline,
//         Number(signature.v),
//         signature.r,
//         signature.s,
//       ],
//     });

//     const txHash = await smartAccountClient.sendTransaction({
//       account: smartAccountClient.account,
//       to: CONTRACT_ADDRESSES.PURCHASE_MANAGER,
//       data: callData,
//     });

//     return txHash;
//   } catch (error) {
//     console.error("Error executing purchase:", error);
//     throw new Error("Failed to execute purchase transaction");
//   }
// };

// /**
//  * Obtains Lit Protocol authentication for video access
//  * @param video The video metadata
//  * @returns The authentication signature
//  */
// export const getVideoAccess = async (video: VideoMetadata) => {
//   const lit = await initLit();
//   try {
//     const authSig = await runLitAction(lit, {
//       accessControlConditions: video.playbackAccess?.acl,
//       chain: "base-sepolia",
//       nonce: Date.now().toString(),
//       exp: Date.now() + 3 * 60 * 1000,
//       ciphertext: video.playbackAccess?.ciphertext,
//       dataToEncryptHash: video.playbackAccess?.dataToEncryptHash,
//     });
//     return authSig;
//   } finally {
//     await lit.disconnect();
//   }
// };
