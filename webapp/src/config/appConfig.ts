import { IS_PRODUCTION } from "@/utils/env";

export const PLAYBACK_ENDPOINT = IS_PRODUCTION
  ? "https://playback.getloop.xyz/api/"
  : "http://localhost:8080/";
