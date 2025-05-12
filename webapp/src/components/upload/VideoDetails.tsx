import React from "react";

interface VideoDetailsProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  error?: string;
}

export default function VideoDetails({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  error,
}: VideoDetailsProps) {
  return (
    <div>
      <h2 className="text-base/7 font-semibold text-gray-900">Video Details</h2>
      <div className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Title
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              placeholder="Enter video title"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Description
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              placeholder="Enter video description"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
