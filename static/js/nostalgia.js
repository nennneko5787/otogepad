let ws = null;
let wideModeEnabled = false;
const activeKeyNum = [];
const pointerActiveKeys = new Map();

const allKeys = () => Array.from(document.querySelectorAll(".key"));

function getNeighborKeys(element) {
  if (!wideModeEnabled) return [element];
  const keys = allKeys();
  const idx = keys.indexOf(element);
  const result = [element];
  if (idx > 0) result.push(keys[idx - 1]);
  if (idx < keys.length - 1) result.push(keys[idx + 1]);
  return result;
}

async function fetchOutputPorts() {
  const portsSelect = document.getElementById("ports");

  const response = await fetch("/nostalgia/ports");
  const ports = await response.json();

  ports.forEach((port, i) => {
    const option = document.createElement("option");
    option.textContent = port;
    option.value = i;

    portsSelect.append(option);
  });
}

async function submitPort() {
  const portsSelect = document.getElementById("ports");

  const response = await fetch("/nostalgia/ports", {
    method: "POST",
    body: portsSelect.value,
  });
  const jsonData = await response.json();
}

function pressDown(element) {
  if (activeKeyNum.includes(element.getAttribute("data-keyid"))) return;
  activeKeyNum.push(element.getAttribute("data-keyid"));
  element.classList.add("active");
}

function pressUp(element) {
  const idx = activeKeyNum.indexOf(element.getAttribute("data-keyid"));
  if (idx === -1) return;
  activeKeyNum.splice(idx, 1);
  element.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".key").forEach((element) => {
    element.addEventListener("pointerdown", (e) => {
      element.setPointerCapture(e.pointerId);
      if (!pointerActiveKeys.has(e.pointerId)) {
        pointerActiveKeys.set(e.pointerId, new Set());
      }
      const keys = pointerActiveKeys.get(e.pointerId);
      for (const key of getNeighborKeys(element)) {
        keys.add(key);
        pressDown(key);
      }
    });
  });

  document.addEventListener("pointermove", (e) => {
    const keys = pointerActiveKeys.get(e.pointerId);
    if (!keys) return;
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const directHit = elements.find((el) => el.classList.contains("key"));

    const hoveredKeys = new Set(directHit ? getNeighborKeys(directHit) : []);

    for (const key of hoveredKeys) {
      if (!keys.has(key)) {
        keys.add(key);
        pressDown(key);
      }
    }
    for (const key of [...keys]) {
      if (!hoveredKeys.has(key)) {
        keys.delete(key);
        pressUp(key);
      }
    }
  });

  const cleanup = (e) => {
    const keys = pointerActiveKeys.get(e.pointerId);
    if (!keys) return;
    for (const key of keys) pressUp(key);
    pointerActiveKeys.delete(e.pointerId);
  };

  document.addEventListener("pointerup", cleanup);
  document.addEventListener("pointercancel", cleanup);

  fetchOutputPorts();
  document.getElementById("submitPort").addEventListener("click", () => {
    submitPort();
  });

  const slider = document.getElementById("sizeSlider");
  const sizeValue = document.getElementById("sizeValue");
  const container = document.querySelector(".container");

  slider.addEventListener("input", () => {
    const val = slider.value;
    sizeValue.textContent = val + "%";
    container.style.width = val + "%";
  });

  document.getElementById("wideMode").addEventListener("click", () => {
    wideModeEnabled = !wideModeEnabled;
    const btn = document.getElementById("wideMode");
    btn.textContent = wideModeEnabled ? "広域ON" : "広域OFF";
    btn.style.background = wideModeEnabled ? "#98fb98" : "#ddd";
  });

  // ws
  ws = new WebSocket("ws://192.168.11.41.traefik.me:19810/nostalgia/ws");
  setInterval(
    () => {
      if (ws.readyState === WebSocket.OPEN) {
        const payload = Array.from({ length: 48 }, (_, i) =>
          activeKeyNum.includes(String(i)),
        );
        ws.send(JSON.stringify(payload));
      }
    },
    (1 / 120) * 1000,
  );
});
