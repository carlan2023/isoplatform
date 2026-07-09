// Public launch-record badge from websitelaunches.com. The image is a remote
// asset served from their host, so we use a plain <img> (next/image would
// require whitelisting the domain in next.config and gives no benefit for a
// small static SVG badge).
export default function LaunchBadge() {
  return (
    <a
      href="https://websitelaunches.com/site/amqualitysystems.com"
      target="_blank"
      rel="noopener"
      className="inline-block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://websitelaunches.com/badge/amqualitysystems.com.svg"
        alt="Established online - Public launch record"
        width={255}
        height={55}
      />
    </a>
  );
}
