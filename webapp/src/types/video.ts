import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { videos, videoStatusEnum } from "../db/schema";
import type { UnifiedAccessControlConditions } from "@lit-protocol/types";

/**
 * Represents the possible status values for a video.
 */
export type VideoStatus = (typeof videoStatusEnum.enumValues)[number];

/**
 * Represents the visibility of a video.
 */
export type VideoVisibility = "public" | "protected";

/**
 * Represents a video source.
 */
export interface VideoSource {
  id: string;
  src: string;
  type: string;
}

/**
 * Represents a video cover image.
 */
export interface VideoCoverImage {
  width: number;
  height: number;
  src: string;
}

/**
 * Represents the price of a video.
 */
export interface VideoPrice {
  amount: bigint;
  currency: "USDC";
  denominatedSubunits: bigint;
}

/**
 * Represents video access control.
 */
export interface VideoAccess {
  acl: UnifiedAccessControlConditions;
  type: "lit";
  ciphertext?: string;
  dataToEncryptHash?: string;
}

/**
 * Base interface for video metadata.
 */
interface VideoMetadataBase {
  id: string;
  tokenId: bigint;
  title: string;
  creator: string;
  description?: string;
  visibility: VideoVisibility;
  isDownloadable: boolean;
  isNSFW: boolean;
  price: VideoPrice;
  sources: VideoSource[];
  coverImage: string;
  playbackAccess?: VideoAccess;
}

/**
 * Interface for protected video metadata.
 */
export interface VideoMetadataProtected extends VideoMetadataBase {
  visibility: "protected";
  playbackAccess: VideoAccess;
}

/**
 * Interface for public video metadata.
 */
export interface VideoMetadataPublic extends VideoMetadataBase {
  visibility: "public";
}

/**
 * Union type for all video metadata.
 */
export type VideoMetadata = VideoMetadataProtected | VideoMetadataPublic;

/**
 * Represents a video record selected from the database.
 */
export type Video = InferSelectModel<typeof videos>;

/**
 * Represents the shape of data required to insert a new video.
 */
export type NewVideo = InferInsertModel<typeof videos>;
