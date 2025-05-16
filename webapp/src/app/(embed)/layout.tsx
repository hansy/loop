import { ToastProvider } from "@/components/providers/ToastProvider";
import "./embed-globals.css"; // Import minimal embed-specific global styles

interface EmbedLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout for the (embed) route group.
 * This provides a bare-minimum HTML structure for embedded content,
 * including only the ToastProvider.
 */
export default function EmbedRootLayout({ children }: EmbedLayoutProps) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
