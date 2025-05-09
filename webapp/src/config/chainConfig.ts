import { base, baseSepolia } from "viem/chains";
import { PrivyClientConfig } from "@privy-io/react-auth";

// Define login methods
export const LOGIN_METHODS: PrivyClientConfig["loginMethods"] = [
  "email",
  "wallet",
  "google",
];

// Environment variable to determine the environment
const NEXT_PUBLIC_ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT;

export const DEFAULT_CHAIN =
  NEXT_PUBLIC_ENVIRONMENT === "production" ? base : baseSepolia;

interface ChainConfig {
  activeChain: typeof base | typeof baseSepolia;
  supportedChains: (typeof base | typeof baseSepolia)[];
}

/**
 * Determines the active chain configuration based on the environment.
 * @returns {ChainConfig} The active chain and supported chains.
 */
export const getActiveChainConfig = (): ChainConfig => {
  return {
    activeChain: DEFAULT_CHAIN,
    supportedChains: [DEFAULT_CHAIN],
  };
};
