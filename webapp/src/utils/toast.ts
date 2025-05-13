import { toast, ToastOptions } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  closeButton: true,
};

/**
 * Shows a success toast notification.
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, { ...defaultOptions, ...options });
};

/**
 * Shows an error toast notification.
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, { ...defaultOptions, ...options });
};

/**
 * Shows an info toast notification.
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, { ...defaultOptions, ...options });
};

/**
 * Shows a warning toast notification.
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, { ...defaultOptions, ...options });
};

/**
 * Shows a loading toast notification that can be updated.
 * @param message - The initial message to display
 * @param options - Optional toast configuration
 * @returns The toast ID for updating
 */
export const showLoadingToast = (message: string, options?: ToastOptions) => {
  return toast.loading(message, { ...defaultOptions, ...options });
};

/**
 * Updates an existing loading toast.
 * @param toastId - The ID of the toast to update
 * @param message - The new message to display
 * @param type - The new toast type
 * @param options - Optional toast configuration
 */
export const updateToast = (
  toastId: string | number,
  message: string,
  type: "success" | "error" | "info" | "warning" = "info",
  options?: ToastOptions
) => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    ...defaultOptions,
    ...options,
  });
};
