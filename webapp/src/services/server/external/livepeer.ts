import type { VideoSource } from "@/types";
import { VIDEO_BUCKET } from "./s3";
import { AppError } from "../api/error";

const API_BASE = "https://livepeer.studio/api";

export const transcode = async (id: string, source: VideoSource) => {
  const ACCESS_KEY = process.env.S3_VIDEO_TRANSCODE_ACCESS_KEY;
  const ACCESS_SECRET = process.env.S3_VIDEO_TRANSCODE_SECRET_KEY;
  const ENDPOINT = process.env.S3_VIDEO_UPLOAD_ENDPOINT;
  const params = {
    input: {
      type: "s3",
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: ACCESS_SECRET,
      },
      bucket: VIDEO_BUCKET,
      path: `/${source.id}`,
    },
    storage: {
      type: "s3",
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: ACCESS_SECRET,
      },
      bucket: VIDEO_BUCKET,
    },
    outputs: {
      hls: {
        path: `/${id}/data/hls`,
      },
    },
  };

  try {
    const response = await fetch(`${API_BASE}/transcode`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new AppError("Failed to send transcoding request", 500);
    }

    const { id: taskId } = await response.json();

    return taskId;
  } catch (e) {
    throw new AppError(
      "Failed to send transcoding request",
      500,
      "LIVEPEER_ERROR",
      {
        originalError: e,
      }
    );
  }
};
