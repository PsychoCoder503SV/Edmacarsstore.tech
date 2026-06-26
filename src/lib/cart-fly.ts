export function animateFlyToCart(fromEl: HTMLElement, imageUrl?: string | null): void {
  const cart = document.getElementById("cart-icon-anchor");
  if (!cart) return;

  const from = fromEl.getBoundingClientRect();
  const to = cart.getBoundingClientRect();

  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const endX = to.left + to.width / 2;
  const endY = to.top + to.height / 2;

  const arcLift = 70 + Math.random() * 90;
  const arcSide = (Math.random() - 0.5) * 160;
  const ctrlX = (startX + endX) / 2 + arcSide;
  const ctrlY = Math.min(startY, endY) - arcLift;

  const spinTotal = 420 + Math.random() * 540;
  const duration = 1150 + Math.random() * 250;

  const flyer = document.createElement("div");
  flyer.className = "cart-fly-item";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    img.className = "cart-fly-item-img";
    flyer.appendChild(img);
  } else {
    flyer.classList.add("cart-fly-item-dot");
  }

  document.body.appendChild(flyer);

  const start = performance.now();

  function bezier(t: number, p0: number, p1: number, p2: number) {
    const u = 1 - t;
    return u * u * p0 + 2 * u * t * p1 + t * t * p2;
  }

  function frame(now: number) {
    const raw = Math.min(1, (now - start) / duration);
    const t = 1 - Math.pow(1 - raw, 2.4);

    const x = bezier(t, startX, ctrlX, endX);
    const y = bezier(t, startY, ctrlY, endY);

    const scale = 1.15 - t * 0.45;
    const spin =
      t < 0.72
        ? t * spinTotal * 0.35
        : spinTotal * 0.35 + ((t - 0.72) / 0.28) * spinTotal * 0.65;

    flyer.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${spin}deg) scale(${scale})`;
    flyer.style.opacity = String(Math.max(0.15, 1 - t * 0.25));

    if (raw < 1) {
      requestAnimationFrame(frame);
    } else {
      flyer.classList.add("cart-fly-item-land");
      window.setTimeout(() => flyer.remove(), 180);
    }
  }

  requestAnimationFrame(frame);
}