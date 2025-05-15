import { LockClosedIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface VideoPlayerOverlayProps {
  type: "loading" | "locked";
  isAuthenticated?: boolean;
  onVerifyAccess?: () => void;
}

export default function VideoPlayerOverlay({
  type,
  isAuthenticated = false,
  onVerifyAccess,
}: VideoPlayerOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        {type === "loading" ? (
          <LoadingSpinner className="h-12 w-12 border-b-2 border-gray-100" />
        ) : (
          <>
            <LockClosedIcon className="h-12 w-12 text-gray-400" />
            <div className="text-gray-100 text-lg font-medium">
              Video is locked
            </div>
            {!isAuthenticated && (
              <button
                onClick={onVerifyAccess}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Verify access
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
