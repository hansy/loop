"use client";

import { useState, useCallback } from "react";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

interface VideoEmbedCodeProps {
  appHost: string;
  creatorAddress: string;
  videoId: string;
  videoTitle?: string;
}

export default function VideoEmbedCode({
  appHost,
  creatorAddress,
  videoId,
  videoTitle,
}: VideoEmbedCodeProps) {
  const [, setEmbedCopied] = useState(false);

  const embedSrc = `${appHost}/users/${creatorAddress}/videos/${videoId}/embed`;
  const embedCode = `<iframe src="${embedSrc}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${
    videoTitle?.replace(/"/g, "&quot;") || "Video Player"
  }"></iframe>`;

  const handleCopyEmbedCode = useCallback(() => {
    navigator.clipboard.writeText(embedCode).then(
      () => {
        setEmbedCopied(true);
        showSuccessToast("Embed code copied to clipboard!");
        setTimeout(() => setEmbedCopied(false), 2000); // Reset after 2 seconds
      },
      (err) => {
        showErrorToast("Failed to copy embed code.");
        console.error("Failed to copy embed code: ", err);
      }
    );
  }, [embedCode]);

  if (!creatorAddress || !videoId) {
    return null; // Don't render if essential props are missing
  }

  return (
    <div>
      <div className="mt-2 flex">
        <button
          type="button"
          onClick={handleCopyEmbedCode}
          className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-300 sm:text-sm/6 cursor-pointer"
        >
          <span>Embed Code</span>
          <ClipboardDocumentCheckIcon className="ml-2 w-4 h-4" />
        </button>
        <input
          readOnly
          id="company-website"
          name="company-website"
          type="text"
          value={embedCode}
          className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        />
      </div>
    </div>
  );
}
