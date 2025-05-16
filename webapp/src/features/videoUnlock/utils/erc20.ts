import { parseSignature, PublicClient } from "viem";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { CONTRACT_ADDRESSES } from "@/config/contractsConfig";
import { Signature, TypedDataDomain, WalletClient } from "viem";

// ERC20Permit ABI for nonces function
const erc20PermitAbi = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const usdcContract = {
  address: CONTRACT_ADDRESSES.USDC,
  abi: erc20PermitAbi,
};

/**
 * Fetches the current nonce for an ERC20 permit
 * @param publicClient The public client to use for contract interactions (e.g. pimlicoClient for paymaster transactions)
 * @param owner The address to get the nonce for
 * @returns The current nonce for the owner address
 * @throws Error if nonce fetching fails
 */
export const generateNonce = async (
  publicClient: PublicClient,
  owner: `0x${string}`
): Promise<bigint> => {
  try {
    return await publicClient.readContract({
      ...usdcContract,
      functionName: "nonces",
      args: [owner],
    });
  } catch (e) {
    console.error("Error fetching nonce:", e);
    throw new Error("Failed to fetch nonce");
  }
};

/**
 * Signs a permit for USDC token spending
 * @param signer The wallet client to sign with
 * @param value The amount to permit
 * @param spenderAddress The address to permit spending
 * @param deadline The deadline for the permit
 * @param nonce The current nonce for the owner address
 * @returns The signature for the permit
 */
export const signPermit = async (
  signer: WalletClient,
  value: bigint,
  spenderAddress: string,
  deadline: bigint,
  nonce: bigint
): Promise<Signature> => {
  const domain: TypedDataDomain = {
    name: "USD Coin",
    version: "2",
    chainId: DEFAULT_CHAIN.id,
    verifyingContract: CONTRACT_ADDRESSES.USDC,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const address = signer.account?.address;
  if (!address) {
    throw new Error("No account address found in wallet client");
  }

  const data = {
    owner: address,
    spender: spenderAddress,
    value,
    nonce,
    deadline,
  };

  try {
    const signed = await signer.signTypedData({
      account: address,
      domain,
      types,
      primaryType: "Permit",
      message: data,
    });

    return parseSignature(signed) as Signature;
  } catch (e) {
    console.error("Error generating permit signature", e);
    throw new Error("Error generating permit signature");
  }
};
