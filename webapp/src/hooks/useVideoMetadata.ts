import { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { VideoMetadata, VideoMetadataSchema } from "@/validations/videoSchemas";
import { v7 as uuidv7 } from "uuid";
import { convertToLitFormat } from "@/features/accessControl/utils/litConversion";
import { ACC_TOKEN_PLACEHOLDER } from "@/config/litConfig";

interface UseVideoMetadataReturn {
  metadata: VideoMetadata;
  errors: Record<string, string>;
  formCanSubmit: boolean;
  // Form field setters
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setVisibility: (visibility: "public" | "protected") => void;
  setPrice: (price: number) => void;
  setIsDownloadable: (isDownloadable: boolean) => void;
  setIsNSFW: (isNSFW: boolean) => void;
  setCoverImage: (coverImage: string) => void;
  // Video upload state setters
  setVideoKey: (key: string) => void;
  setVideoType: (type: string) => void;
  // Form state setters
  setErrors: (errors: Record<string, string>) => void;
  // Validation and formatting
  validateAndFormatMetadata: () => Promise<VideoMetadata>;
}

/**
 * Hook for managing video metadata state and form handling
 * @returns Object containing metadata state, form handlers, and validation state
 */
export function useVideoMetadata(): UseVideoMetadataReturn {
  const { address } = useAccount();
  const { state: accessControlState } = useAccessControl();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate ID once when hook mounts
  const [id] = useState(() => uuidv7());

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "protected">(
    "public"
  );
  const [price, setPrice] = useState(0);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);

  // Video upload state
  const [videoKey, setVideoKey] = useState<string | undefined>(undefined);
  const [videoType, setVideoType] = useState<string | undefined>(undefined);

  const createPriceObject = useCallback(() => {
    return {
      amount: visibility === "protected" ? String(BigInt(price * 1e6)) : "0",
      currency: "USDC" as const,
      denominatedSubunits: String(BigInt(1e6)),
    };
  }, [price, visibility]);

  const createSourcesObject = useCallback(() => {
    if (!videoKey || !videoType) {
      return [];
    }

    return [
      {
        id: videoKey,
        type: videoType,
        src: `storj://${process.env.NEXT_PUBLIC_S3_VIDEO_UPLOAD_BUCKET}/${videoKey}`,
      },
    ];
  }, [videoKey, videoType]);

  const createPlaybackAccessObject = useCallback(() => {
    const litConditions = convertToLitFormat(accessControlState);

    // Validate the converted conditions
    // if (!validateLitConditions(litConditions)) {
    //   throw new Error("Invalid access control conditions");
    // }

    return {
      acl: litConditions as unknown as Record<string, unknown>,
      type: "lit" as const,
    };
  }, [accessControlState]);

  const createMetadata = useCallback(() => {
    const baseMetadata = {
      id,
      tokenId: ACC_TOKEN_PLACEHOLDER,
      title,
      creator: address!,
      description,
      isDownloadable,
      isNSFW,
      coverImage,
      price: createPriceObject(),
      sources: createSourcesObject(),
    };

    if (visibility === "protected") {
      return {
        ...baseMetadata,
        visibility: "protected" as const,
        playbackAccess: createPlaybackAccessObject(),
      } as VideoMetadata;
    }

    return {
      ...baseMetadata,
      visibility: "public" as const,
    } as VideoMetadata;
  }, [
    title,
    description,
    visibility,
    address,
    id,
    isDownloadable,
    isNSFW,
    coverImage,
    createPriceObject,
    createSourcesObject,
    createPlaybackAccessObject,
  ]);

  const validateAndFormatMetadata = useCallback(async () => {
    if (!videoKey || !videoType) {
      throw new Error("Please upload a video first");
    }

    // Validate form data
    const data = createMetadata();

    // Format the data for the API
    return VideoMetadataSchema.parse(data);
  }, [createMetadata, videoKey, videoType]);

  const formCanSubmit = useMemo(() => {
    return Boolean(videoKey && videoType && title);
  }, [videoKey, videoType, title]);

  return {
    metadata: createMetadata(),
    errors,
    formCanSubmit,
    setTitle,
    setDescription,
    setVisibility,
    setPrice,
    setIsDownloadable,
    setIsNSFW,
    setCoverImage,
    setVideoKey,
    setVideoType,
    setErrors,
    validateAndFormatMetadata,
  };
}
