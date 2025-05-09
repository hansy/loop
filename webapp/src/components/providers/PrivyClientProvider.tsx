"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { getActiveChainConfig, LOGIN_METHODS } from "@/config/chainConfig";

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
  const { activeChain, supportedChains } = getActiveChainConfig();

  // You might need to input your Privy App ID directly here
  // if it's not available via process.env in the client bundle
  // or ensure NEXT_PUBLIC_PRIVY_APP_ID is correctly set and exposed.
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    // It's crucial to have an app ID. You might want to throw an error
    // or return a placeholder/loading state if it's missing,
    // especially during development.
    console.error(
      "Privy App ID is not configured. Please set NEXT_PUBLIC_PRIVY_APP_ID."
    );
    // Returning null or a loading indicator might be appropriate here depending on UX preference
    return <>{children}</>; // Or some fallback UI
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: LOGIN_METHODS,
        defaultChain: activeChain,
        supportedChains: supportedChains,
        // Recommended: Handle cases where users connect a wallet that's not on the defaultChain
        // onModalOpen: () => console.log('Privy modal opened'),
        // onLogin: (user) => console.log('User logged in', user),
        // Consider adding appearance and embeddedWallets configuration as needed
        appearance: {
          showWalletLoginFirst: true, // Prioritizes wallet login methods
          theme: "light", // Default theme
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          showWalletUIs: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
