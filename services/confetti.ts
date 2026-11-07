/**
 * Lightweight, zero-dependency HTML5 Canvas Confetti effect
 */

export const triggerConfetti = (durationMs: number = 3000) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#f97316'];

    interface Particle {
      x: number;
      y: number;
      w: number;
      h: number;
      vx: number;
      vy: number;
      rotation: number;
      vRot: number;
      color: string;
      shape: 'rect' | 'circle';
    }

    const particles: Particle[] = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 200,
        y: height / 3 + (Math.random() - 0.5) * 100,
        w: Math.random() * 10 + 6,
        h: Math.random() * 8 + 4,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -12 - 4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.3 ? 'rect' : 'circle'
      });
    }

    let startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // Gravity
        p.vx *= 0.98; // Friction
        p.rotation += p.vRot;

        if (p.y < height) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive && elapsed < durationMs) {
        requestAnimationFrame(render);
      } else {
        canvas.remove();
      }
    };

    requestAnimationFrame(render);
  } catch (e) {
    console.error("Confetti trigger failed", e);
  }
};
