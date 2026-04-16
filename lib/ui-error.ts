export function toSafeErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (message.includes("unauthorized") || message.includes("forbidden") || message.includes("token") || message.includes("401") || message.includes("403")) {
    return "Your session expired. Please sign in again.";
  }

  if (message.includes("network") || message.includes("failed to fetch") || message.includes("timeout")) {
    return "We could not reach the server. Please check your internet and try again.";
  }

  if (message.includes("not found") || message.includes("404")) {
    return "We could not find this booking right now.";
  }

  return fallback;
}
