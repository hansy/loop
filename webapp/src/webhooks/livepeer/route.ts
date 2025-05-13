import { NextRequest } from "next/server";
import {
  getVideoByTranscodeTaskId,
  updateVideo,
} from "@/services/server/database";
import type { VideoMetadata, VideoSource } from "@/types";
import { AppError } from "@/services/server/api/error";
import { VIDEO_BUCKET } from "@/services/server/external/s3";
import {
  handleWebhook,
  successResponse,
  WebhookVerificationOptions,
} from "@/services/server/api";
import { createHmac, timingSafeEqual } from "crypto";

interface LivepeerWebhookPayload {
  event: string;
  payload: {
    task: {
      id: string;
    };
  };
}

/**
 * Verifies a Livepeer webhook signature
 * @param payload - The raw request body as a string
 * @param signature - The Livepeer-Signature header value
 * @param headers - All request headers (not used for Livepeer verification)
 * @returns Whether the signature is valid
 */
function verifyLivepeerWebhook(payload: string, signature: string): boolean {
  try {
    // Parse the signature header
    const elements = signature.split(",");
    const signatureParts: Record<string, string> = {};

    for (const element of elements) {
      const [prefix, value] = element.split("=");
      signatureParts[prefix] = value;
    }

    // Extract timestamp and signature
    const timestamp = signatureParts["t"];
    const signatureValue = signatureParts["v1"];

    if (!timestamp || !signatureValue) {
      return false;
    }

    // Create the signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Calculate the expected signature
    const hmac = createHmac("sha256", process.env.LIVEPEER_WEBHOOK_SECRET!);
    const expectedSignature = hmac.update(signedPayload).digest("hex");

    // Compare signatures using timing-safe comparison
    return timingSafeEqual(
      Buffer.from(signatureValue),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Error verifying Livepeer webhook signature:", error);
    return false;
  }
}

async function handleLivepeerWebhook(
  _req: NextRequest,
  body: LivepeerWebhookPayload
) {
  const { event, payload } = body;

  if (event === "task.completed" || event === "task.failed") {
    const taskSuccess = event === "task.completed";
    const {
      task: { id: taskId },
    } = payload;

    try {
      const video = await getVideoByTranscodeTaskId(taskId);

      if (!video) {
        throw new AppError("Video not found", 404, "VIDEO_NOT_FOUND");
      }

      if (taskSuccess) {
        const srcId = `${video.id}/data/hls/index.m3u8`;
        const src: VideoSource = {
          id: srcId,
          src: `storj://${VIDEO_BUCKET}/${srcId}`,
          type: "application/x-mpegURL",
        };
        const metadata = video.metadata as VideoMetadata;
        const sources = metadata.sources;
        sources.push(src);

        const newMetadata = { ...metadata, sources };

        await updateVideo(video.id, {
          metadata: newMetadata,
          status: "minting",
        });

        // await mintNFT.trigger({ videoId: id });
      } else {
        await updateVideo(video.id, { status: "failed" });
      }
    } catch (e) {
      console.error("Error handling Livepeer task", e, payload, taskId);
      throw e;
    }
  }

  return successResponse(null, 200);
}

const webhookOptions: WebhookVerificationOptions = {
  verifySignature: verifyLivepeerWebhook,
  signatureHeader: "livepeer-signature",
};

export const POST = handleWebhook<LivepeerWebhookPayload>(
  handleLivepeerWebhook,
  webhookOptions
);
