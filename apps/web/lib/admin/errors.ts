import { toast } from "sonner";
import { toApiError } from "@/lib/api";

export function notifyError(error: unknown): void {
  const apiError = toApiError(error);
  toast.error(
    apiError.code === "NETWORK_ERROR"
      ? "Could not reach the server. Check your connection and try again."
      : apiError.message,
  );
}
