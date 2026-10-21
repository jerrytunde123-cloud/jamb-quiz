/**
 * Zero-dependency celebratory confetti burst for browser environments.
 * Spawns colorful confetti particles across the screen and cleans itself up.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  shape: "rect" | "circle";
  opacity: number;
}

const COLORS = [
  "#f5a623", // Gold
  "#ff6b35", // Flame orange
  "#22c55e", // Emerald
  "#229ed9", // Telegram cyan
  "#e11d48", // Rose
  "#a855f7", // Violet
  "#38bdf8", // Sky blue
];

export function fireConfetti(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const particleCount = Math.min(120, Math.floor(width / 8));

  // Spawn from lower left and lower right towards center
  for (let i = 0; i < particleCount; i++) {
    const fromLeft = i % 2 === 0;
    const startX = fromLeft ? width * 0.2 : width * 0.8;
    const startY = height * 0.7;

    const angle = fromLeft
      ? -Math.PI / 3 + (Math.random() - 0.5) * 0.6
      : (-2 * Math.PI) / 3 + (Math.random() - 0.5) * 0.6;
    const speed = 12 + Math.random() * 16;

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.4 ? "rect" : "circle",
      opacity: 1,
    });
  }

  let animId: number;
  const gravity = 0.45;
  const drag = 0.985;
  const startTime = Date.now();
  const maxDuration = 3200; // 3.2 seconds

  function frame() {
    if (!ctx) return;
    const elapsed = Date.now() - startTime;
    if (elapsed > maxDuration || particles.length === 0) {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      cancelAnimationFrame(animId);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.rotation += p.rotSpeed;

      if (elapsed > 2000) {
        p.opacity = Math.max(0, 1 - (elapsed - 2000) / 1200);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    animId = requestAnimationFrame(frame);
  }

  animId = requestAnimationFrame(frame);
}
