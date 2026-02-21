let lastAngle = null;
let ws = null;
const activeKeyNum = [];

function getAngle(touch, rect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(touch.clientY - cy, touch.clientX - cx);
}

function angleDiff(a, b) {
  // -π〜πの範囲に正規化
  let diff = a - b;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
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
      const x = e.clientX;
      const y = e.clientY;

      const inside =
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      if (!inside) {
        pressUp(element);
      }
    });

    element.addEventListener("pointerup", (e) => {
      pressUp(element);
    });

    element.addEventListener("pointercancel", (e) => {
      pressUp(element);
    });
  });

  // turn
  const turn = document.querySelector(".turn");

  turn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const rect = turn.getBoundingClientRect();
    lastAngle = getAngle(e.touches[0], rect);
  });

  turn.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (lastAngle === null) return;

    const rect = turn.getBoundingClientRect();
    const currentAngle = getAngle(e.touches[0], rect);
    const diff = angleDiff(currentAngle, lastAngle);

    // ノイズ除去：微小な動きは無視
    if (Math.abs(diff) < 0.02) return;

    if (diff > 0) {
      onClockwise();
    } else {
      onCounterClockwise();
    }

    lastAngle = currentAngle;
  });

  turn.addEventListener("touchend", () => {
    lastAngle = null;
  });

  turn.addEventListener("touchcancel", () => {
    lastAngle = null;
  });

  function onClockwise() {
    const keyid = String(turn.getAttribute("data-keyid"));
    if (!activeKeyNum.includes(keyid)) {
      activeKeyNum.push(keyid);
      document.getElementById("sex").textContent = "→ 時計回り";
      // 数フレーム後に離す
      setTimeout(() => {
        const idx = activeKeyNum.indexOf(keyid);
        if (idx !== -1) activeKeyNum.splice(idx, 1);
      }, 50);
    }
  }

  function onCounterClockwise() {
    const keyid = String(parseInt(turn.getAttribute("data-keyid")) + 1);
    if (!activeKeyNum.includes(keyid)) {
      activeKeyNum.push(keyid);
      document.getElementById("sex").textContent = "← 反時計回り";
      setTimeout(() => {
        const idx = activeKeyNum.indexOf(keyid);
        if (idx !== -1) activeKeyNum.splice(idx, 1);
      }, 50);
    }
  }

  // ws
  ws = new WebSocket("ws://192.168.11.41.traefik.me:19810/iidx/ws");
  setInterval(
    () => {
      if (ws.readyState === WebSocket.OPEN) {
        const payload = Array.from({ length: 9 }, (_, i) =>
          activeKeyNum.includes(String(i)),
        );
        console.log("送信:", payload, "activeKeyNum:", activeKeyNum);
        ws.send(JSON.stringify(payload));
      } else {
        console.log("WS状態:", ws.readyState);
      }
    },
    (1 / 120) * 1000,
  );
});
