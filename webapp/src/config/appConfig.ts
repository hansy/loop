import { IS_PRODUCTION } from "@/utils/env";

export const PLAYBACK_ENDPOINT = IS_PRODUCTION
  ? "https://playback.getloop.xyz/api/"
  : "http://localhost:8080/";

export const APP_HOST = IS_PRODUCTION
  ? "https://www.getloop.xyz"
  : "http://localhost:3000";
