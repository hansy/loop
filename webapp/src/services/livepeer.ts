import { z } from "zod";

const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY;
const LIVEPEER_API_URL = "https://livepeer.com/api/v1";

// Response schema for Livepeer API
const transcodeResponseSchema = z.object({
  taskId: z.string(),
  status: z.string(),
  // Add other fields as needed based on Livepeer's API response
});

/**
 * Sends a video to Livepeer for transcoding
 * @param sourceUrl - The URL of the source video file
 * @returns The transcode task ID and status
 */
export async function sendToLivepeer(sourceUrl: string) {
  if (!LIVEPEER_API_KEY) {
    throw new Error("Livepeer API key is not configured");
  }

  const response = await fetch(`${LIVEPEER_API_URL}/transcode`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LIVEPEER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceUrl,
      // Add other Livepeer-specific configuration as needed
    }),
  });

  if (!response.ok) {
    throw new Error(`Livepeer API error: ${response.statusText}`);
  }

  const data = await response.json();
  return transcodeResponseSchema.parse(data);
}

/**
 * Checks the status of a transcode task
 * @param taskId - The ID of the transcode task
 * @returns The current status of the transcode task
 */
export async function checkTranscodeStatus(taskId: string) {
  if (!LIVEPEER_API_KEY) {
    throw new Error("Livepeer API key is not configured");
  }

  const response = await fetch(`${LIVEPEER_API_URL}/transcode/${taskId}`, {
    headers: {
      Authorization: `Bearer ${LIVEPEER_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Livepeer API error: ${response.statusText}`);
  }

  const data = await response.json();
  return transcodeResponseSchema.parse(data);
}
