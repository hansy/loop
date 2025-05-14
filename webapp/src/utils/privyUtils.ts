import type { LinkedAccountWithMetadata } from "@privy-io/react-auth";

export const getLatestWallet = (
  linkedAccounts: LinkedAccountWithMetadata[]
) => {
  // Filter for wallet accounts and sort by latestVerifiedAt
  const wallets = linkedAccounts
    .filter((account) => account.type === "wallet")
    .sort((a, b) => {
      // Convert dates to timestamps for comparison
      const dateA = a.latestVerifiedAt?.getTime() ?? 0;
      const dateB = b.latestVerifiedAt?.getTime() ?? 0;
      return dateB - dateA; // Sort descending (newest first)
    });

  // Return the most recently verified wallet, or undefined if none exist
  return wallets[0];
};
