// A simple utility to join class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface LoadingSpinnerProps {
  className?: string;
}

/**
 * A simple, minimal loading spinner component using a styled div.
 * It renders a circular border with one segment colored, which spins.
 *
 * @param {LoadingSpinnerProps} props - The props for the component.
 * @param {string} [props.className] - Optional CSS classes to apply for sizing and border color.
 *                                     Example: "h-6 w-6 border-b-2 border-blue-500"
 *                                     Defaults to "h-5 w-5 border-b-2 border-gray-500".
 * @returns {React.ReactElement} The rendered loading spinner.
 */
export default function LoadingSpinner({
  className,
}: LoadingSpinnerProps): React.ReactElement {
  const defaultSpinnerClasses = "h-5 w-5 border-b-2 border-gray-500";
  return (
    <div
      className={classNames(
        "animate-spin rounded-full",
        className || defaultSpinnerClasses
      )}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
