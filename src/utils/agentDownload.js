/**
 * Trigger a browser file download from Kit agent SSE / live-voice tool responses.
 */

export function triggerAgentFileDownload({
  filename = "download.csv",
  content = "",
  mimeType = "text/csv;charset=utf-8",
} = {}) {
  if (typeof window === "undefined" || !content) return false;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "download.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
