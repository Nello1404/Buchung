"use client";

import Link from "next/link";
import { useEffect } from "react";

// Cineastischer, scrollgesteuerter Nacht-Film: begleitet das Fahrzeug aus der
// Vogelperspektive vom Terminal bis in den beleuchteten Stellplatz. Reines
// Canvas – kein externes Bild-/Videomaterial nötig.

const CSS = `
#af-film{position:fixed;inset:0;width:100vw;height:100svh;display:block;z-index:0}
#af-spacer{position:relative;z-index:1;height:760vh}
.af-lb{position:fixed;left:0;right:0;height:52px;z-index:36;pointer-events:none}
.af-lb.top{top:0;background:linear-gradient(180deg,rgba(3,4,8,.96),rgba(3,4,8,0))}
.af-lb.bot{bottom:0;background:linear-gradient(0deg,rgba(3,4,8,.96),rgba(3,4,8,0))}
#af-progress{position:fixed;top:0;left:0;height:2px;width:0;z-index:50;
  background:linear-gradient(90deg,#9c7c38,#c8a45c,#f0d79b);box-shadow:0 0 14px rgba(200,164,92,.7)}
.af-bar{position:fixed;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:18px 24px}
.af-brand{display:flex;align-items:center;gap:11px;font-family:Georgia,serif;font-size:18px;letter-spacing:.02em;text-decoration:none;color:#f6f3ec;text-shadow:0 2px 16px rgba(0,0,0,.8)}
.af-brand .mono{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border:1px solid rgba(200,164,92,.55);border-radius:50%;font-size:11px;font-weight:700;color:#c8a45c;box-shadow:inset 0 0 22px -6px rgba(200,164,92,.7)}
.af-g{background:linear-gradient(135deg,#f0d79b,#c8a45c 55%,#9c7c38);-webkit-background-clip:text;background-clip:text;color:transparent}
.af-btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:14px;padding:11px 22px;border-radius:999px;text-decoration:none;color:#1a140a;
  background:linear-gradient(135deg,#f0d79b,#c8a45c 55%,#9c7c38);box-shadow:0 12px 34px -12px rgba(200,164,92,.85)}
.af-btn.ghost{background:transparent;color:#f6f3ec;border:1px solid rgba(200,164,92,.5);box-shadow:none}
.af-stage{position:fixed;inset:0;z-index:30;pointer-events:none}
.af-chapter{position:absolute;left:0;right:0;bottom:13%;padding:0 44px;opacity:0;transform:translateY(30px) scale(.985);
  transition:opacity .55s cubic-bezier(.2,.7,.2,1),transform .55s cubic-bezier(.2,.7,.2,1);text-align:center;filter:blur(6px)}
.af-chapter.show{opacity:1;transform:none;filter:none}
.af-chapter .ey{font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:#c8a45c;margin:0 0 16px;display:flex;gap:14px;justify-content:center;align-items:center;text-shadow:0 1px 10px rgba(0,0,0,.7)}
.af-chapter .ey .n{font-family:Georgia,serif;font-size:14px;letter-spacing:0;color:#f6f3ec;border:1px solid rgba(200,164,92,.55);border-radius:50%;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 0 26px -8px rgba(200,164,92,.8)}
.af-chapter h2{font-family:Georgia,serif;font-weight:600;text-transform:uppercase;line-height:1;letter-spacing:.01em;margin:0;font-size:clamp(2.1rem,6.2vw,4.6rem);text-wrap:balance;text-shadow:0 4px 40px rgba(0,0,0,.7)}
.af-chapter p{max-width:46ch;margin:18px auto 0;color:#b7b2a6;font-size:clamp(1rem,1.5vw,1.16rem);line-height:1.6;text-shadow:0 2px 18px rgba(0,0,0,.8)}
.af-gt{background:linear-gradient(135deg,#f0d79b,#c8a45c 55%,#9c7c38);-webkit-background-clip:text;background-clip:text;color:transparent}
.af-chapter .cta{margin-top:28px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap;pointer-events:auto}
#af-hero{bottom:auto;top:50%;transform:translateY(-50%);opacity:1;filter:none}
#af-hero.hide{opacity:0;transform:translateY(-56%);filter:blur(8px)}
#af-hero .kick{font-size:12px;letter-spacing:.36em;text-transform:uppercase;color:#c8a45c;margin:0 0 20px;text-shadow:0 1px 12px rgba(0,0,0,.7)}
#af-hero h2{font-family:Georgia,serif;font-weight:600;text-transform:uppercase;line-height:.97;margin:0;font-size:clamp(2.4rem,7.8vw,5.8rem);text-shadow:0 4px 44px rgba(0,0,0,.7)}
.af-cue{position:fixed;left:50%;bottom:26px;z-index:38;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:9px;color:#b7b2a6;font-size:11px;letter-spacing:.28em;text-transform:uppercase;transition:opacity .5s}
.af-cue .m{width:23px;height:36px;border:1px solid rgba(200,164,92,.55);border-radius:12px;position:relative;box-shadow:0 0 22px -8px rgba(200,164,92,.7)}
.af-cue .m::after{content:"";position:absolute;left:50%;top:8px;width:3px;height:8px;border-radius:2px;background:#c8a45c;transform:translateX(-50%);animation:afwh 1.6s ease-in-out infinite;box-shadow:0 0 8px #c8a45c}
@keyframes afwh{0%{opacity:0;transform:translate(-50%,0)}40%{opacity:1}80%{opacity:0;transform:translate(-50%,11px)}}
.af-badge{position:fixed;z-index:34;left:50%;transform:translateX(-50%) translateY(6px);top:19%;background:rgba(9,11,17,.66);border:1px solid rgba(200,164,92,.55);color:#f0d79b;
  padding:9px 18px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:.02em;opacity:0;transition:opacity .5s,transform .5s;backdrop-filter:blur(8px);box-shadow:0 0 34px -10px rgba(200,164,92,.6)}
.af-badge.show{opacity:1;transform:translateX(-50%) translateY(0)}
@media (prefers-reduced-motion:reduce){.af-cue .m::after{animation:none}}
.af-root :focus-visible{outline:2px solid #c8a45c;outline-offset:3px}
`;

export function AblaufFilm() {
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const cv = document.getElementById("af-film") as HTMLCanvasElement | null;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, DPR = 1, rafId = 0, stopped = false, now = 0;

    function resize() {
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = cv!.clientWidth; H = cv!.clientHeight;
      cv!.width = W * DPR; cv!.height = H * DPR;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    // Weg (Vogelperspektive): Terminal oben -> Kurven -> goldene Ziel-Bucht unten
    const WP: number[][] = [[0.0, 0], [-0.30, 540], [0.32, 1120], [-0.20, 1700], [0.04, 2220], [0.11, 2500], [0.11, 2682]];
    function sample(t: number) {
      const n = WP.length - 1, f = Math.max(0, Math.min(0.9999, t)) * n, i = Math.floor(f), r = f - i;
      const a = WP[i], b = WP[i + 1], e = r * r * (3 - 2 * r);
      return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
    }
    function ease(x: number) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
    function clamp(x: number, a: number, b: number) { return x < a ? a : (x > b ? b : x); }
    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath(); ctx!.moveTo(x + r, y); ctx!.arcTo(x + w, y, x + w, y + h, r); ctx!.arcTo(x + w, y + h, x, y + h, r);
      ctx!.arcTo(x, y + h, x, y, r); ctx!.arcTo(x, y, x + w, y, r); ctx!.closePath();
    }

    const PT: { x: number; y: number; r: number; sp: number; a: number; ph: number }[] = [];
    for (let i = 0; i < 58; i++) PT.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 2.2, sp: 0.006 + Math.random() * 0.02, a: 0.05 + Math.random() * 0.25, ph: Math.random() * 6.28 });

    const grain = document.createElement("canvas"); grain.width = grain.height = 140;
    (function () {
      const g = grain.getContext("2d")!; const id = g.createImageData(140, 140); const d = id.data;
      for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      g.putImageData(id, 0, 0);
    })();

    const LOT_Y0 = 2440, COLS = 6, ROWS = 4, BW = 0.16, BH = 100;

    function draw(p: number, ts: number) {
      const c = ctx!;
      c.clearRect(0, 0, W, H);
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#070a12"); bg.addColorStop(0.5, "#05070d"); bg.addColorStop(1, "#04050a");
      c.fillStyle = bg; c.fillRect(0, 0, W, H);

      const driveP = clamp((p - 0.06) / 0.60, 0, 1);
      const carT = ease(Math.min(driveP, 1));
      const cpos = sample(carT);
      const ahead = sample(Math.min(carT + 0.008, 1));
      const behind = sample(Math.max(carT - 0.012, 0));
      const worldScale = W / 900;
      const endT = clamp((p - 0.72) / 0.28, 0, 1);
      const zoom = 1 - 0.16 * endT;
      const sc = worldScale * zoom;
      const camMeters = cpos[1];
      const camScreenY = H * (0.58 - 0.12 * endT);
      const sway = reduce ? 0 : (Math.sin(ts / 5200) * 0.010 + Math.sin(ts / 3300) * 0.006);
      const driftX = reduce ? 0 : Math.sin(ts / 4600) * 7;

      c.save();
      c.translate(W / 2 + driftX, camScreenY);
      c.rotate(sway);
      c.scale(sc, sc);
      const LX = (mx: number) => mx * 380;
      const LY = (my: number) => my - camMeters;
      function lamp(x: number, y: number, r: number, col: string) {
        c.save(); c.globalCompositeOperation = "lighter";
        const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); c.restore();
      }

      lamp(0, LY(-40), 620, "rgba(60,74,110,.28)");
      lamp(LX(-0.02), LY(LOT_Y0 + 140), 560, "rgba(120,96,44,.30)");

      c.fillStyle = "rgba(20,30,26,.5)";
      for (let gi = 0; gi < 7; gi++) { const gy = 120 + gi * 360; c.fillRect(LX(-1.4), LY(gy), 190, 210); c.fillRect(LX(1.4) - 190, LY(gy + 130), 190, 210); }

      // Terminal
      (function () {
        const x = LX(-0.92), y = LY(-170), w = LX(0.92) - LX(-0.92), h = LY(50) - LY(-170);
        c.fillStyle = "#0a0e18"; roundRect(x, y, w, h, 14); c.fill();
        c.strokeStyle = "rgba(200,164,92,.30)"; c.lineWidth = 1.4; c.stroke();
        const cols = 13, rows = 5, pad = 14, cw = (w - pad * 2) / cols, ch = (h - pad * 2) / rows;
        for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
          const lit = ((col * 3 + r * 7 + (r === 2 ? 2 : 0)) % 4 !== 0);
          const wx = x + pad + col * cw + 2, wy = y + pad + r * ch + 2, ww = cw - 4, wh = ch - 4;
          if (lit) { c.fillStyle = "rgba(240,215,155,.55)"; c.fillRect(wx, wy, ww, wh); lamp(wx + ww / 2, wy + wh / 2, cw * 1.0, "rgba(240,215,155,.10)"); }
          else { c.fillStyle = "rgba(90,100,120,.16)"; c.fillRect(wx, wy, ww, wh); }
        }
        c.fillStyle = "rgba(240,215,155,.85)"; c.font = "600 16px Georgia,serif"; c.textAlign = "center";
        c.fillText("TERMINAL", 0, LY(-8));
        c.fillStyle = "rgba(240,215,155,.5)"; c.fillRect(x + 10, LY(46), w - 20, 3);
      })();

      // Straße
      (function () {
        const steps = 100;
        c.lineCap = "round"; c.lineJoin = "round";
        c.lineWidth = 66; c.strokeStyle = "#0c1017";
        c.beginPath(); for (let i = 0; i <= steps; i++) { const s = sample(i / steps); if (i) c.lineTo(LX(s[0]), LY(s[1])); else c.moveTo(LX(s[0]), LY(s[1])); } c.stroke();
        c.setLineDash([20, 20]); c.lineWidth = 2.2; c.strokeStyle = "rgba(240,215,155,.42)";
        c.beginPath(); for (let j = 0; j <= steps; j++) { const t = sample(j / steps); if (j) c.lineTo(LX(t[0]), LY(t[1])); else c.moveTo(LX(t[0]), LY(t[1])); } c.stroke(); c.setLineDash([]);
        for (let k = 0; k <= 48; k++) {
          const tt = k / 48; const a = sample(tt), b = sample(Math.min(tt + 0.004, 1));
          const dx = (b[0] - a[0]) * 380, dy = (b[1] - a[1]); const len = Math.hypot(dx, dy) || 1; const nx = -dy / len, ny = dx / len;
          const ax = a[0] * 380, ay = a[1] - camMeters;
          for (let side = -1; side <= 1; side += 2) {
            const lxp = ax + nx * 36 * side, lyp = ay + ny * 36 * side;
            c.fillStyle = "rgba(240,215,155,.9)"; c.beginPath(); c.arc(lxp, lyp, 1.7, 0, 6.283); c.fill();
            lamp(lxp, lyp, 16, "rgba(240,215,155,.18)");
          }
        }
      })();

      // Parkplatz
      (function () {
        const padX0 = LX(-0.52), padX1 = LX(0.52), padY0 = LY(LOT_Y0 - 40), padY1 = LY(LOT_Y0 + ROWS * BH + 30);
        c.fillStyle = "#0a0d14"; roundRect(padX0, padY0, padX1 - padX0, padY1 - padY0, 10); c.fill();
        c.strokeStyle = "rgba(200,164,92,.30)"; c.lineWidth = 1.4; c.stroke();
        for (let m = 0; m < 4; m++) {
          const mx = (m % 2 ? 0.40 : -0.40); const my = LOT_Y0 + (m < 2 ? 0 : ROWS * BH); const px = LX(mx), py = LY(my);
          lamp(px, py, 150, "rgba(240,215,155,.16)"); c.fillStyle = "rgba(240,215,155,.9)"; c.beginPath(); c.arc(px, py, 2.4, 0, 6.283); c.fill();
        }
        for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
          const bx0 = LX(-0.44 + col * BW), by0 = LY(LOT_Y0 + r * BH), bx1 = LX(-0.44 + col * BW + BW - 0.02), by1 = LY(LOT_Y0 + r * BH + BH - 16);
          c.strokeStyle = "rgba(200,164,92,.26)"; c.lineWidth = 1.3; c.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
          const occ = ((r * 7 + col * 3) % 5 === 0) && !(r === 2 && col === 3);
          if (occ) {
            c.fillStyle = "rgba(60,64,74,.85)"; roundRect(bx0 + 6, by0 + 8, (bx1 - bx0) - 12, (by1 - by0) - 16, 4); c.fill();
            c.fillStyle = "rgba(150,160,180,.14)"; roundRect(bx0 + 9, by0 + 11, (bx1 - bx0) - 18, (by1 - by0) - 30, 3); c.fill();
          }
        }
        if (p > 0.54) {
          const gx0 = LX(-0.44 + 3 * BW), gy0 = LY(LOT_Y0 + 2 * BH), gx1 = LX(-0.44 + 3 * BW + BW - 0.02), gy1 = LY(LOT_Y0 + 2 * BH + BH - 16);
          const pulse = 0.6 + 0.4 * Math.sin(ts / 500);
          lamp((gx0 + gx1) / 2, (gy0 + gy1) / 2, 120, "rgba(240,215,155," + (0.14 + 0.10 * pulse) + ")");
          c.strokeStyle = "rgba(240,215,155," + (0.7 + 0.3 * pulse) + ")"; c.lineWidth = 2.6; c.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
        }
      })();

      // Auto
      (function () {
        const X = LX(cpos[0]), Y = LY(cpos[1]);
        const ang = Math.atan2(LY(ahead[1]) - LY(behind[1]), LX(ahead[0]) - LX(behind[0]));
        const cl = 48, cw = 24, moving = (p < 0.60);
        c.save(); c.translate(X, Y); c.rotate(ang + Math.PI / 2);
        c.fillStyle = "rgba(0,0,0,.5)"; roundRect(-cw / 2 - 3, -cl / 2 + 5, cw + 6, cl, 8); c.fill();
        if (moving) {
          c.save(); c.globalCompositeOperation = "lighter";
          const cone = c.createLinearGradient(0, -cl / 2, 0, -cl / 2 - 150); cone.addColorStop(0, "rgba(245,225,170,.55)"); cone.addColorStop(1, "rgba(245,225,170,0)");
          c.fillStyle = cone; c.beginPath(); c.moveTo(-cw * 0.42, -cl / 2); c.lineTo(cw * 0.42, -cl / 2); c.lineTo(cw * 1.7, -cl / 2 - 150); c.lineTo(-cw * 1.7, -cl / 2 - 150); c.closePath(); c.fill(); c.restore();
        }
        const body = c.createLinearGradient(-cw / 2, 0, cw / 2, 0); body.addColorStop(0, "#7c6230"); body.addColorStop(.5, "#f0d79b"); body.addColorStop(1, "#7c6230");
        c.fillStyle = body; roundRect(-cw / 2, -cl / 2, cw, cl, 8); c.fill();
        c.fillStyle = "rgba(10,12,18,.82)"; roundRect(-cw / 2 + 4, -cl / 2 + cl * 0.28, cw - 8, cl * 0.34, 4); c.fill();
        c.save(); c.globalCompositeOperation = "lighter";
        c.fillStyle = "rgba(255,244,210,.95)"; c.beginPath(); c.arc(-cw * 0.28, -cl / 2 + 2, 2.2, 0, 6.283); c.arc(cw * 0.28, -cl / 2 + 2, 2.2, 0, 6.283); c.fill();
        c.fillStyle = "rgba(255,90,74,.9)"; c.beginPath(); c.arc(-cw * 0.28, cl / 2 - 2, 2, 0, 6.283); c.arc(cw * 0.28, cl / 2 - 2, 2, 0, 6.283); c.fill();
        c.restore();
        c.restore();
        lamp(X, Y, 60, "rgba(240,215,155,.10)");
      })();

      c.restore();

      // Flugzeug (Kapitel 04)
      if (p > 0.72 && p < 0.92) {
        const lp = (p - 0.72) / 0.20, px = -0.12 * W + lp * 1.24 * W, py = H * 0.22 + Math.sin(lp * 3.14) * 12;
        c.save(); c.translate(px, py); c.rotate(0.14);
        c.fillStyle = "rgba(230,225,215,.92)";
        c.beginPath(); c.moveTo(0, -3.2); c.lineTo(36, -1); c.lineTo(43, 0); c.lineTo(36, 1); c.lineTo(0, 3.2);
        c.lineTo(-9, 15); c.lineTo(-4, 4); c.lineTo(-15, 4); c.lineTo(-6, 0); c.lineTo(-15, -4); c.lineTo(-4, -4); c.lineTo(-9, -15); c.closePath(); c.fill();
        const blink = (Math.sin(now / 120) > 0);
        c.globalCompositeOperation = "lighter";
        c.fillStyle = "rgba(255,90,74," + (blink ? 0.95 : 0.25) + ")"; c.beginPath(); c.arc(-9, 15, 2.4, 0, 6.283); c.fill();
        c.fillStyle = "rgba(90,255,140," + (blink ? 0.25 : 0.95) + ")"; c.beginPath(); c.arc(-9, -15, 2.4, 0, 6.283); c.fill();
        const land = c.createLinearGradient(40, 0, 120, 0); land.addColorStop(0, "rgba(255,244,210,.6)"); land.addColorStop(1, "rgba(255,244,210,0)");
        c.fillStyle = land; c.beginPath(); c.moveTo(42, -2); c.lineTo(120, -10); c.lineTo(120, 10); c.lineTo(42, 2); c.closePath(); c.fill();
        c.globalCompositeOperation = "source-over";
        c.strokeStyle = "rgba(200,207,220,.25)"; c.setLineDash([7, 9]); c.lineWidth = 2;
        c.beginPath(); c.moveTo(-46, 0); c.lineTo(-9, 0); c.stroke(); c.setLineDash([]);
        c.restore();
      }

      // Lichtpartikel
      c.save(); c.globalCompositeOperation = "lighter";
      for (let i = 0; i < PT.length; i++) {
        const pt = PT[i];
        let yy = (pt.y - (reduce ? 0 : (ts * 0.00001 * pt.sp * 40))); yy = ((yy % 1) + 1) % 1;
        const sx = pt.x * W + Math.sin(ts / 3000 + pt.ph) * 10; let sy = yy * H + (p * 40 * pt.sp * 30);
        sy = ((sy % H) + H) % H;
        const g = c.createRadialGradient(sx, sy, 0, sx, sy, pt.r * 6); g.addColorStop(0, "rgba(240,215,155," + pt.a + ")"); g.addColorStop(1, "rgba(240,215,155,0)");
        c.fillStyle = g; c.beginPath(); c.arc(sx, sy, pt.r * 6, 0, 6.283); c.fill();
      }
      c.restore();

      // Vignette + Scrims
      const vg = c.createRadialGradient(W / 2, H / 2, H * 0.26, W / 2, H / 2, H * 0.82); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.62)");
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      const top = c.createLinearGradient(0, 0, 0, H * 0.2); top.addColorStop(0, "rgba(4,5,10,.7)"); top.addColorStop(1, "rgba(4,5,10,0)");
      c.fillStyle = top; c.fillRect(0, 0, W, H * 0.2);
      const bot = c.createLinearGradient(0, H * 0.4, 0, H); bot.addColorStop(0, "rgba(5,7,13,0)"); bot.addColorStop(1, "rgba(5,7,13,.82)");
      c.fillStyle = bot; c.fillRect(0, H * 0.4, W, H * 0.6);

      if (!reduce) {
        c.save(); c.globalAlpha = 0.045; c.globalCompositeOperation = "overlay";
        const ox = (Math.random() * 140) | 0, oy = (Math.random() * 140) | 0;
        for (let gx = -ox; gx < W; gx += 140) for (let gy = -oy; gy < H; gy += 140) c.drawImage(grain, gx, gy);
        c.restore();
      }
    }

    let target = 0, cur = 0;
    function computeTarget() { const h = document.documentElement, max = h.scrollHeight - h.clientHeight; target = max > 0 ? h.scrollTop / max : 0; }
    computeTarget();

    const chapters = Array.prototype.slice.call(document.querySelectorAll(".af-chapter[data-from]")) as HTMLElement[];
    const hero = document.getElementById("af-hero");
    const cue = document.getElementById("af-cue");
    const badge = document.getElementById("af-badge");
    const prog = document.getElementById("af-progress");
    function overlays(p: number) {
      if (prog) prog.style.width = (p * 100) + "%";
      if (hero) hero.classList.toggle("hide", p > 0.05);
      if (cue) cue.style.opacity = p > 0.05 ? "0" : "1";
      chapters.forEach((ch) => {
        const f = parseFloat(ch.dataset.from!), t = parseFloat(ch.dataset.to!);
        ch.classList.toggle("show", p >= f && p <= t);
      });
      if (badge) badge.classList.toggle("show", p > 0.56 && p < 0.9);
    }

    let lastDrawn = -1;
    function loop(ts: number) {
      if (stopped) return;
      now = ts;
      cur += (target - cur) * (reduce ? 1 : 0.10);
      if (Math.abs(target - cur) < 0.0002) cur = target;
      if (reduce) { if (cur !== lastDrawn) { draw(cur, ts); overlays(cur); lastDrawn = cur; } }
      else { draw(cur, ts); overlays(cur); }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    addEventListener("resize", resize, { passive: true });
    addEventListener("scroll", computeTarget, { passive: true });

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      removeEventListener("resize", resize);
      removeEventListener("scroll", computeTarget);
    };
  }, []);

  return (
    <div className="af-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <canvas id="af-film" />
      <div id="af-spacer" />

      <div className="af-lb top" />
      <div className="af-lb bot" />
      <div id="af-progress" />

      <header className="af-bar">
        <Link className="af-brand" href="/" aria-label="FlySpot Valet – zur Startseite">
          <span className="mono">FS</span>
          <span>FlySpot <span className="af-g">Valet</span></span>
        </Link>
        <Link className="af-btn" href="/buchen">Parkplatz buchen</Link>
      </header>

      <div className="af-stage">
        <div className="af-chapter" id="af-hero">
          <p className="kick">Valet &amp; Shuttle · Flughafen Frankfurt</p>
          <h2>Ihr Ablauf –<br /><span className="af-gt">zum Durchscrollen</span></h2>
          <p style={{ marginTop: 22 }}>Begleiten Sie Ihr Fahrzeug bei Nacht aus der Vogelperspektive – vom Terminal bis zum sicheren, beleuchteten Stellplatz. Scrollen Sie los.</p>
        </div>

        <div className="af-chapter" data-from="0.10" data-to="0.26">
          <p className="ey"><span className="n">01</span> Ankunft</p>
          <h2>Direkt am <span className="af-gt">Terminal</span></h2>
          <p>Sie fahren vor, wir übernehmen Fahrzeug und Schlüssel – alles im digitalen Übergabeprotokoll dokumentiert.</p>
        </div>

        <div className="af-chapter" data-from="0.30" data-to="0.52">
          <p className="ey"><span className="n">02</span> Auf dem Weg</p>
          <h2>Sicher zum <span className="af-gt">Stellplatz</span></h2>
          <p>Unser Fahrer bringt Ihr Auto auf direktem Weg auf unser gesichertes Gelände – Sie sind längst am Gate.</p>
        </div>

        <div className="af-chapter" data-from="0.56" data-to="0.72">
          <p className="ey"><span className="n">03</span> Geparkt</p>
          <h2>Abgestellt &amp; <span className="af-gt">bewacht</span></h2>
          <p>Videoüberwacht, vollständig versichert. Jeder Stellplatz wird erfasst – wir wissen immer, wo Ihr Auto steht.</p>
        </div>

        <div className="af-chapter" data-from="0.76" data-to="0.88">
          <p className="ey"><span className="n">04</span> Flug im Blick</p>
          <h2>Pünktlich zur <span className="af-gt">Landung</span></h2>
          <p>Wir verfolgen Ihren Rückflug in Echtzeit und stellen Ihr Auto passend zur tatsächlichen Ankunft bereit.</p>
        </div>

        <div className="af-chapter" data-from="0.92" data-to="1.01">
          <p className="ey"><span className="n">05</span> Bereit</p>
          <h2>Jetzt Parkplatz <span className="af-gt">sichern</span></h2>
          <p>In wenigen Minuten gebucht – kostenlose Stornierung bis 48 Stunden vor Anreise.</p>
          <div className="cta">
            <Link className="af-btn" href="/buchen">Parkplatz buchen</Link>
            <Link className="af-btn ghost" href="/service">FlySpot Service</Link>
          </div>
        </div>
      </div>

      <div className="af-badge" id="af-badge">📍 Stellplatz: Reihe C · 12</div>
      <div className="af-cue" id="af-cue"><span>Scrollen</span><span className="m" /></div>
    </div>
  );
}
