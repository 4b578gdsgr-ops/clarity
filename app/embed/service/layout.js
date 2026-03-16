// Embed routes have no nav, header, or footer.
// TopNav checks pathname and returns null for /embed/* routes.
// This layout is intentionally minimal.
export default function EmbedLayout({ children }) {
  return children;
}
