export default function BrandMark({ alt = "", className }) {
  return <img src="/logo.png" alt={alt || ""} className={className} />;
}
