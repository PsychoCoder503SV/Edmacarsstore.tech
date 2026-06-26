export function SiteBackground() {
  return (
    <>
      <div className="site-bg-car" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fondoweb.webp" alt="" className="site-bg-car-img" />
      </div>
      <div className="site-bg-dim" aria-hidden />
    </>
  );
}