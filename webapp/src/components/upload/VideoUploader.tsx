import React from "react";
import { VideoCameraIcon } from "@heroicons/react/24/solid";

interface VideoUploaderProps {
  onFileSelect?: (file: File) => void;
}

export default function VideoUploader({ onFileSelect }: VideoUploaderProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <h2 className="text-base/7 font-semibold text-gray-900">Video File</h2>
      <p className="mt-1 text-sm/6 text-gray-600">
        Upload your video. Supported formats: MP4, MOV, AVI up to 2GB.
      </p>
      <div className="mt-4">
        <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
          <div className="text-center">
            <VideoCameraIcon
              className="mx-auto size-12 text-gray-300"
              aria-hidden="true"
            />
            <div className="mt-4 flex text-sm/6 text-gray-600">
              <label
                htmlFor="video-upload"
                className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:outline-hidden hover:text-indigo-500"
              >
                <span>Upload a video</span>
                <input
                  id="video-upload"
                  name="video-upload"
                  type="file"
                  className="sr-only"
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs/5 text-gray-600">MP4, MOV, AVI up to 2GB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
