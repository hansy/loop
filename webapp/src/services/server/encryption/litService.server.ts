import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_CLIENT_OPTIONS } from "@/config/litConfig";
import { encryptString } from "@lit-protocol/encryption";
import { AuthSig, UnifiedAccessControlConditions } from "@lit-protocol/types";
import { Wallet } from "ethers";
import { LitContracts } from "@lit-protocol/contracts-sdk";

/**
 * Service for handling Lit Protocol encryption operations
 */
export class LitService {
  private client: LitJsSdk.LitNodeClientNodeJs | undefined;

  constructor() {}

  async connect() {
    if (this.client) {
      return this.client;
    }

    try {
      const client = new LitJsSdk.LitNodeClientNodeJs(LIT_CLIENT_OPTIONS);

      await client.connect();

      this.client = client;

      return this.client;
    } catch (e) {
      console.error("Unable to initialize Lit client", e);

      throw new Error("Unable to initialize Lit client");
    }
  }

  async disconnect() {
    if (!this.client) {
      return;
    }

    await this.client.disconnect();
  }

  /**
   * Encrypts playback access data using Lit Protocol
   * @param acl - The access control conditions
   * @param data - The data to encrypt
   * @returns The encrypted access object
   */
  async encryptPlaybackAccess(
    acl: UnifiedAccessControlConditions,
    data: {
      privateKey: string;
      videoTokenId: string;
      videoId: string;
    }
  ) {
    const client = await this.connect();
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        unifiedAccessControlConditions: acl,
        dataToEncrypt: JSON.stringify(data),
      },
      client
    );

    return {
      acl,
      ciphertext,
      dataToEncryptHash,
      type: "lit" as const,
    };
  }

  async createDelegateAuthSig(
    address: string,
    expiration?: string
  ): Promise<AuthSig> {
    const client = await this.connect();

    const walletWithCapacityNFT = new Wallet(String(process.env.PRIVATE_KEY));
    const capacityTokenInfo = await this.mintCapacityCreditsNFT(
      walletWithCapacityNFT
    );

    try {
      const { capacityDelegationAuthSig } =
        await client.createCapacityDelegationAuthSig({
          uses: "100",
          dAppOwnerWallet: walletWithCapacityNFT,
          capacityTokenId: capacityTokenInfo.capacityTokenIdStr,
          delegateeAddresses: [address],
          statement: "Delegate Lit capacity to user",
          expiration,
        });

      return capacityDelegationAuthSig;
    } catch (e) {
      console.error("Error creating delegate auth sig", e);

      return Promise.reject(e);
    }
  }

  async mintCapacityCreditsNFT(wallet: Wallet) {
    try {
      const contractClient = new LitContracts({
        signer: wallet,
        network: LIT_CLIENT_OPTIONS.litNetwork,
      });
      await contractClient.connect();

      return await contractClient.mintCapacityCreditsNFT({
        requestsPerSecond: 10,
        daysUntilUTCMidnightExpiration: 5,
      });
    } catch (e) {
      console.error("Error minting capacity credits NFT", e);

      return Promise.reject(e);
    }
  }
}
