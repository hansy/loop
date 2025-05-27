import { IPFS_GATEWAY } from "@/config/ipfsConfig";

export const getCoverImageSrc = (ipfsSrc?: string) => {
  if (!ipfsSrc) {
    return "/cover_image.png";
  }

  const cid = ipfsSrc.split("ipfs://")[1];

  return `${IPFS_GATEWAY}${cid}`;
};
