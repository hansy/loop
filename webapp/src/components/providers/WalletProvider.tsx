"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { PermissionlessProvider } from "@permissionless/wagmi";

import {
  activeChainConfig,
  LOGIN_METHODS,
  wagmiConfig,
  permissionlessConfig,
} from "@/config/chainConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

interface PrivyClientProviderProps {
  children: React.ReactNode;
}

/**
 * Client-side provider to initialize and configure Privy.
 * It uses chain configurations and login methods from chainConfig.
 */
export default function PrivyClientProvider({
  children,
}: PrivyClientProviderProps) {
  const { activeChain, supportedChains } = activeChainConfig;
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: LOGIN_METHODS,
        defaultChain: activeChain,
        supportedChains: supportedChains,
        appearance: {
          showWalletLoginFirst: true,
          theme: "light",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          showWalletUIs: false,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <PermissionlessProvider
            capabilities={permissionlessConfig.capabilities}
          >
            {children}
          </PermissionlessProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
