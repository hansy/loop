import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_ACTION_IPFS_CID, LIT_CLIENT_OPTIONS } from "@/config/litConfig";
import { encryptString } from "@lit-protocol/encryption";
import {
  AuthSig,
  UnifiedAccessControlConditions,
  AuthCallbackParams,
  LitResourceAbilityRequest,
  SessionSigsMap,
} from "@lit-protocol/types";
import {
  createSiweMessageWithRecaps,
  LitActionResource,
} from "@lit-protocol/auth-helpers";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { camelCaseString } from "@/utils/camelCaseString";
import { SignMessageMutateAsync } from "wagmi/query";
import { LIT_ABILITY } from "@lit-protocol/constants";

interface LitActionParams {
  ciphertext?: string;
  dataToEncryptHash?: string;
  accessControlConditions?: UnifiedAccessControlConditions;
  chain: string;
  nonce: string;
  exp: number;
}

// const removeLitLocalStorageObjects = () => {
//   localStorage!.removeItem("lit-wallet-sig");
//   localStorage!.removeItem("lit-session-key");
// };

/**
 * Service for handling Lit Protocol encryption operations
 */
export class LitService {
  private client: LitJsSdk.LitNodeClient | undefined;

  constructor() {}

  async connect() {
    if (this.client) {
      return this.client;
    }

    try {
      const client = new LitJsSdk.LitNodeClient(LIT_CLIENT_OPTIONS);

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

    // removeLitLocalStorageObjects();
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

  async createAuthSig(
    params: AuthCallbackParams,
    address: string,
    signMessage: SignMessageMutateAsync
  ) {
    const client = await this.connect();

    try {
      const preparedMessage = await createSiweMessageWithRecaps({
        uri: String(params.uri),
        expiration: String(params.expiration),
        resources:
          params.resourceAbilityRequests as LitResourceAbilityRequest[],
        walletAddress: address,
        nonce: await client.getLatestBlockhash(),
        litNodeClient: client,
        statement: params.statement,
        chainId: DEFAULT_CHAIN.id,
      });

      const signature = await signMessage({ message: preparedMessage });

      return {
        sig: signature,
        derivedVia: "loop.web3.auth",
        signedMessage: preparedMessage,
        address: address,
      };
    } catch (e) {
      console.error(e);
      return Promise.reject("Error signing message");
    }
  }

  async generateSessionSigs(
    address: string,
    signMessage: SignMessageMutateAsync,
    capacityDelegationAuthSig: AuthSig
  ) {
    const client = await this.connect();

    try {
      return await client.getSessionSigs({
        chain: camelCaseString(DEFAULT_CHAIN.name),
        resourceAbilityRequests: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution,
          },
        ],
        authNeededCallback: async (params) => {
          return await this.createAuthSig(params, address, signMessage);
        },
        capabilityAuthSigs: [capacityDelegationAuthSig],
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async runLitAction(
    sessionSigs: SessionSigsMap,
    jsParams: LitActionParams
  ): Promise<AuthSig> {
    const client = await this.connect();

    try {
      const litActionResult = await client.executeJs({
        ipfsId: LIT_ACTION_IPFS_CID,
        sessionSigs,
        jsParams,
      });

      console.log(litActionResult);

      if (litActionResult.success && litActionResult.logs === undefined) {
        const res = litActionResult.response as string;

        if (res !== "") {
          return JSON.parse(res);
        }
      }

      return Promise.reject("User doesn't have permission");
    } catch (e) {
      return Promise.reject(`Error with Lit Action: ${JSON.stringify(e)}`);
    }
  }
}
