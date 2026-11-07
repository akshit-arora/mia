// Shared frame-rate overlay for every page and game. Hidden unless `?fps` is in the URL; when off, this file does
// nothing but one regex test at start-up (no timers, no listeners, no patched canvas).
//   fps    = frames drawn per second (idle screens redraw at 4 fps on purpose; busy ones run at up to 30)
//   worst  = longest gap between two browser animation ticks in the last 2 s, in ms (a jank signal: 17 is perfect)
//   draw   = average and maximum time one draw call of ours took, in ms (max is per half second; drawMaxAll in window.__fps is since opening)
//   calls  = canvas calls in the latest frame and the maximum seen since the page opened (limit 25)
// Numbers are also exposed as window.__fps for tests.
import type { Stage } from '../engine';

export interface FpsStats { fps: number; worst: number; drawAvg: number; drawMax: number; drawMaxAll: number; calls: number; callsMax: number }

export function initFps(stage: Stage): void {
  if (!/[?&]fps\b/.test(location.search)) return;
  const ctx = stage.ctx as unknown as Record<string, unknown>;
  let calls = 0;
  for (const m of ['drawImage', 'fillRect', 'strokeRect', 'clearRect', 'fill', 'stroke', 'fillText', 'strokeText']) {
    const orig = ctx[m] as (...a: unknown[]) => unknown;
    if (typeof orig !== 'function') continue;
    ctx[m] = function (this: unknown, ...a: unknown[]) { calls++; return orig.apply(stage.ctx, a); };
  }
  const el = document.createElement('div');
  el.id = 'fps';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;left:50%;top:2px;transform:translateX(-50%);z-index:99;padding:2px 8px;border-radius:8px;background:rgba(0,0,0,.72);color:#9bffb0;font:600 11px/1.3 ui-monospace,Menlo,monospace;pointer-events:none;white-space:nowrap';
  document.body.appendChild(el);

  const st: FpsStats = { fps: 0, worst: 0, drawAvg: 0, drawMax: 0, drawMaxAll: 0, calls: 0, callsMax: 0 };
  let t0 = 0, frames = 0, sum = 0, mx = 0, lastTick = 0, winWorst = 0, prevWorst = 0, winStart = 0, tickWorst = 0;
  stage.probe = {
    begin() { calls = 0; t0 = performance.now(); },
    end() {
      const d = performance.now() - t0;
      frames++; sum += d; if (d > mx) mx = d;
      st.calls = calls; if (calls > st.callsMax) st.callsMax = calls;
    },
  };
  let lastShow = performance.now();
  const tick = (now: number): void => {
    window.requestAnimationFrame(tick);
    if (lastTick) { const gap = now - lastTick; if (gap > tickWorst) tickWorst = gap; }
    lastTick = now;
    const n = performance.now();
    if (n - winStart > 1000) { winStart = n; prevWorst = winWorst; winWorst = tickWorst; tickWorst = 0; }
    if (n - lastShow < 500) return;
    const secs = (n - lastShow) / 1000; lastShow = n;
    st.fps = Math.round(frames / secs);
    st.drawAvg = frames ? sum / frames : 0; st.drawMax = mx; if (mx > st.drawMaxAll) st.drawMaxAll = mx;
    st.worst = Math.round(Math.max(winWorst, prevWorst, tickWorst));
    frames = 0; sum = 0; mx = 0;
    el.textContent = `${st.fps} fps | worst ${st.worst} ms | draw ${st.drawAvg.toFixed(2)} (max ${st.drawMax.toFixed(1)}) ms | calls ${st.calls} (max ${st.callsMax})`;
    (window as unknown as Record<string, unknown>).__fps = st;
  };
  window.requestAnimationFrame(tick);
  (window as unknown as Record<string, unknown>).__fps = st;
}
