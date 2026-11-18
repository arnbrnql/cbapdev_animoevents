const localOrigin = "http://localhost";
const eventDetail = /^\/events\/[0-9a-f]{24}$/i;

function getReturnPath(value, fallback) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const destination = new URL(value, localOrigin);
    const path = destination.pathname;
    if (
      destination.origin === localOrigin &&
      (path === "/" || path === "/events" || path === "/bookmarks" || eventDetail.test(path))
    ) {
      return path + destination.search;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

module.exports = getReturnPath;
