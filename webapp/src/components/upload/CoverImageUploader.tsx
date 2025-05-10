import React from "react";
import { PhotoIcon } from "@heroicons/react/24/solid";

interface CoverImageUploaderProps {
  onFileSelect?: (file: File) => void;
  onFrameSelect?: () => void;
}

export default function CoverImageUploader({
  onFileSelect,
  onFrameSelect,
}: CoverImageUploaderProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <h2 className="text-base/7 font-semibold text-gray-900">Cover Image</h2>
      <p className="mt-1 text-sm/6 text-gray-600">
        Choose a frame from your video or upload your own cover image.
      </p>
      <div className="mt-4">
        <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
          <div className="text-center">
            <PhotoIcon
              className="mx-auto size-12 text-gray-300"
              aria-hidden="true"
            />
            <div className="mt-4 flex text-sm/6 text-gray-600">
              <label
                htmlFor="cover-upload"
                className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:outline-hidden hover:text-indigo-500"
              >
                <span>Upload a cover</span>
                <input
                  id="cover-upload"
                  name="cover-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                onClick={onFrameSelect}
                className="pl-1 text-indigo-600 hover:text-indigo-500"
              >
                or choose from video
              </button>
            </div>
            <p className="text-xs/5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
