import { base, baseSepolia } from "viem/chains";
import { PrivyClientConfig } from "@privy-io/react-auth";
import { createConfig } from "@privy-io/wagmi";
import { http } from "viem";

// Define login methods
export const LOGIN_METHODS: PrivyClientConfig["loginMethods"] = [
  "email",
  "wallet",
  "google",
];

// Environment variable to determine the environment
const NEXT_PUBLIC_ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT;
const CLIENT_ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const SERVER_ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

export const DEFAULT_CHAIN =
  NEXT_PUBLIC_ENVIRONMENT === "production" ? base : baseSepolia;

/**
 * Defines the active chain and supported chains primarily for PrivyProvider config.
 */
export const activeChainConfig = {
  activeChain: DEFAULT_CHAIN,
  supportedChains: [DEFAULT_CHAIN],
};

const TRANSPORT_BASE: Record<string, string> = {
  [base.name]: "https://base-mainnet.g.alchemy.com/v2/",
  [baseSepolia.name]: "https://base-sepolia.g.alchemy.com/v2/",
};

export const transport = (env: "client" | "server", chainName: string) => {
  const key =
    env === "client" ? CLIENT_ALCHEMY_API_KEY : SERVER_ALCHEMY_API_KEY;

  return TRANSPORT_BASE[chainName] + key;
};

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(transport("client", base.name)),
    [baseSepolia.id]: http(transport("client", baseSepolia.name)),
  },
});
