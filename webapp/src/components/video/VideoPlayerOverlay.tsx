import { UserCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

/**
 * Interface defining the props for the VideoPlayerOverlay component.
 * @interface VideoPlayerOverlayProps
 * @property {boolean} isLoading - Whether the video is in a loading state
 * @property {boolean} isLocked - Whether the video is locked and requires authentication
 * @property {boolean} [isAuthenticated=false] - Whether the user is authenticated
 * @property {() => void} [onProfileClick] - Callback when profile button is clicked
 * @property {() => void} [onAuthenticate] - Callback when authentication is requested
 * @property {() => void} [onUnlockClick] - Callback when video unlock is requested
 */
interface VideoPlayerOverlayProps {
  isLoading: boolean;
  isLocked: boolean;
  isAuthenticated: boolean;
  onProfileClick?: () => void;
  onAuthenticate?: () => void;
  onUnlockClick?: () => void;
}

/**
 * VideoPlayerOverlay is a component that renders different overlay states for the video player.
 * It handles loading states, locked states, and authentication flows.
 *
 * Features:
 * - Loading spinner during video loading
 * - Locked state with authentication/unlock options
 * - Profile button for authenticated users
 * - Responsive backdrop blur effect
 * - Conditional rendering based on state
 *
 * @component
 * @example
 * ```tsx
 * <VideoPlayerOverlay
 *   isLoading={true}
 *   isLocked={false}
 *   isAuthenticated={true}
 *   onProfileClick={() => handleProfileClick()}
 *   onAuthenticate={() => handleAuth()}
 *   onUnlockClick={() => handleUnlockClick()}
 * />
 * ```
 */
export default function VideoPlayerOverlay({
  isLoading,
  isLocked,
  isAuthenticated = false,
  onProfileClick,
  onAuthenticate,
  onUnlockClick,
}: VideoPlayerOverlayProps) {
  if (!isLoading && !isLocked) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
      {isAuthenticated && (
        <button
          type="button"
          onClick={onProfileClick}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
        >
          <UserCircleIcon className="h-6 w-6 text-gray-300" />
        </button>
      )}
      <div className="flex flex-col items-center gap-4 text-center px-4">
        {isLoading ? (
          <LoadingSpinner className="h-12 w-12 border-b-2 border-gray-100" />
        ) : (
          <>
            <LockClosedIcon className="h-12 w-12 text-gray-400" />
            <div className="text-gray-100 text-lg font-medium">
              Video is locked
            </div>
            <button
              type="button"
              onClick={isAuthenticated ? onUnlockClick : onAuthenticate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isAuthenticated ? "Unlock video" : "Verify access"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
