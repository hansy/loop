import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { encryptString } from "@lit-protocol/encryption";
import { UnifiedAccessControlConditions } from "@lit-protocol/types";

/**
 * Service for handling Lit Protocol encryption operations
 */
export class LitService {
  private readonly client: LitJsSdk.LitNodeClientNodeJs;

  constructor() {
    this.client = new LitJsSdk.LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.DatilTest,
      debug: true,
    });
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
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        unifiedAccessControlConditions: acl,
        dataToEncrypt: JSON.stringify(data),
      },
      this.client
    );

    return {
      acl,
      ciphertext,
      dataToEncryptHash,
      type: "lit" as const,
    };
  }
}
