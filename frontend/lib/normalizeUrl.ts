export function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    if (url.startsWith("http")) {
      const u = new URL(url);
      return `${u.protocol}//${u.hostname}`;
    } else {
      const u = new URL(`https://${url}`);
      return `${u.protocol}//${u.hostname}`;
    }
  } catch {
    return url;
  }
}
