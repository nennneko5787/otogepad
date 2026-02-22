let ws = null;
const activeKeyNum = [];

let lastAngle = null;
let turnValue = 0;
const SCRATCH_THRESHOLD = 1.5;
const SCRATCH_WINDOW_MS = 80;
const SCRATCH_RELEASE_MS = 150;

let recentMoves = [];
let scratchCWActive = false;
let scratchCCWActive = false;
let scratchReleaseTimer = null;

function getAngle(touch, rect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(touch.clientY - cy, touch.clientX - cx);
}

function angleDiff(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

function getVelocity(now) {
  const cutoff = now - SCRATCH_WINDOW_MS;
  recentMoves = recentMoves.filter((m) => m.time >= cutoff);
  if (recentMoves.length === 0) return 0;

  const totalDelta = recentMoves.reduce((s, m) => s + m.delta, 0);
  const dt = (now - recentMoves[0].time) / 1000 || 0.001;
  return totalDelta / dt;
}

function activateScratch(keyid) {
  if (!activeKeyNum.includes(keyid)) {
    activeKeyNum.push(keyid);
  }
}
function deactivateScratch(keyid) {
  const idx = activeKeyNum.indexOf(keyid);
  if (idx !== -1) activeKeyNum.splice(idx, 1);
}

function onTurnMove(diff, now) {
  turnValue += diff * (127 / Math.PI);
  if (turnValue > 127.0) {
    turnValue = -127.0;
  }
  if (turnValue < -127.0) {
    turnValue = 127.0;
  }

  recentMoves.push({ time: now, delta: diff });

  const velocity = getVelocity(now);
  const cwKeyid = String(turn.getAttribute("data-keyid"));
  const ccwKeyid = String(parseInt(turn.getAttribute("data-keyid")) + 1);

  if (Math.abs(velocity) >= SCRATCH_THRESHOLD) {
    if (velocity > 0) {
      // right scratch
      if (!scratchCWActive) {
        scratchCWActive = true;
        activateScratch(cwKeyid);
      }
      if (scratchCCWActive) {
        scratchCCWActive = false;
        deactivateScratch(ccwKeyid);
      }
    } else {
      // left scratch
      if (!scratchCCWActive) {
        scratchCCWActive = true;
        activateScratch(ccwKeyid);
      }
      if (scratchCWActive) {
        scratchCWActive = false;
        deactivateScratch(cwKeyid);
      }
    }

    clearTimeout(scratchReleaseTimer);
    scratchReleaseTimer = setTimeout(() => {
      releaseScratch(cwKeyid, ccwKeyid);
    }, SCRATCH_RELEASE_MS);
  } else {
    if (scratchCWActive || scratchCCWActive) {
      clearTimeout(scratchReleaseTimer);
      releaseScratch(cwKeyid, ccwKeyid);
    }
  }
}

function releaseScratch(cwKeyid, ccwKeyid) {
  if (scratchCWActive) {
    scratchCWActive = false;
    deactivateScratch(cwKeyid);
  }
  if (scratchCCWActive) {
    scratchCCWActive = false;
    deactivateScratch(ccwKeyid);
  }
}

function pressDown(element) {
  activeKeyNum.push(element.getAttribute("data-keyid"));
  element.classList.add("active");
}

function pressUp(element) {
  activeKeyNum.splice(
    activeKeyNum.indexOf(element.getAttribute("data-keyid")),
    1,
  );
  element.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".key").forEach((element) => {
    element.addEventListener("pointerdown", (e) => {
      pressDown(element);
    });

    element.addEventListener("pointermove", (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX,
        y = e.clientY;
      const inside =
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (!inside) pressUp(element);
    });

    element.addEventListener("pointerup", (e) => {
      pressUp(element);
    });

    element.addEventListener("pointercancel", (e) => {
      pressUp(element);
    });
  });

  turn = document.querySelector(".turn");

  turn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const rect = turn.getBoundingClientRect();
    lastAngle = getAngle(e.touches[0], rect);
    recentMoves = [];
  });

  turn.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (lastAngle === null) return;

    const rect = turn.getBoundingClientRect();
    const currentAngle = getAngle(e.touches[0], rect);
    const diff = angleDiff(currentAngle, lastAngle);

    if (Math.abs(diff) < 0.02) return;
    const now = performance.now();
    onTurnMove(diff, now);
    lastAngle = currentAngle;
  });

  turn.addEventListener("touchend", () => {
    lastAngle = null;
    recentMoves = [];
    const cwKeyid = String(turn.getAttribute("data-keyid"));
    const ccwKeyid = String(parseInt(turn.getAttribute("data-keyid")) + 1);
    clearTimeout(scratchReleaseTimer);
    releaseScratch(cwKeyid, ccwKeyid);
  });

  turn.addEventListener("touchcancel", () => {
    lastAngle = null;
    recentMoves = [];
    const cwKeyid = String(turn.getAttribute("data-keyid"));
    const ccwKeyid = String(parseInt(turn.getAttribute("data-keyid")) + 1);
    clearTimeout(scratchReleaseTimer);
    releaseScratch(cwKeyid, ccwKeyid);
  });

  // ws
  ws = new WebSocket("ws://192.168.11.41.traefik.me:19810/iidx/ws");
  setInterval(
    () => {
      if (ws.readyState === WebSocket.OPEN) {
        const payload = Array.from({ length: 9 }, (_, i) =>
          activeKeyNum.includes(String(i)),
        );
        ws.send(JSON.stringify(payload));
      }
    },
    (1 / 120) * 1000,
  );
});
