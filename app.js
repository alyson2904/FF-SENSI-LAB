const $ = (id) => document.getElementById(id);

function readDeviceInfo() {
  const ua = navigator.userAgent || "Android";
  const android = ua.match(/Android\s([\d.]+)/i);
  const info = android ? `Android ${android[1]} · navegador móvil` : "Navegador: " + ua.slice(0, 55);
  $("deviceName").textContent = "Datos básicos del dispositivo disponibles";
  $("deviceInfo").textContent = info + ". Modelo y DPI se confirman manualmente.";
  if (!$("deviceModel").value && /vivo/i.test(ua)) $("deviceModel").value = "Vivo (modelo por confirmar)";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/*
 * Algoritmo inicial experimental.
 * No es una fórmula oficial de Garena. Los factores son heurísticas
 * transparentes que después calibramos con pruebas reales.
 */
function generateSensitivity() {
  const dpi = Number($("dpi").value) || 500;
  const refresh = Number($("refresh").value) || 60;
  const ram = Number($("ram").value) || 4;
  const fingers = Number($("fingers").value) || 2;
  const style = $("style").value;

  // Normalizamos alrededor de 500 DPI y 90 Hz para una base ajustable.
  const dpiFactor = (dpi - 500) / 35;
  const refreshFactor = (refresh - 90) / 12;
  const ramFactor = ram <= 3 ? -3 : ram >= 8 ? 2 : 0;
  const fingerFactor = fingers === 2 ? 3 : fingers === 3 ? 0 : -2;

  let values = {
    "General": 186,
    "Punto rojo": 178,
    "Mira 2X": 170,
    "Mira 4X": 158,
    "Francotirador": 92,
    "Cámara":  customizeCamera(refresh)
  };

  let styleAdjust = {general:0, red:0, x2:0, x4:0, sniper:0};
  if (style === "headshot") styleAdjust = {general:5,red:5,x2:3,x4:0,sniper:0};
  if (style === "rush") styleAdjust = {general:6,red:4,x2:2,x4:-2,sniper:-3};
  if (style === "balanced") styleAdjust = {general:0,red:0,x2:0,x4:0,sniper:0};
  if (style === "range") styleAdjust = {general:-4,red:-2,x2:-3,x4:-5,sniper:3};

  const shared = dpiFactor * 1.2 + refreshFactor * 0.6 + ramFactor * 0.35;
  values["General"] = clamp(values["General"] + shared + fingerFactor + styleAdjust.general, 80, 200);
  values["Punto rojo"] = clamp(values["Punto rojo"] + shared + fingerFactor * .7 + styleAdjust.red, 80, 200);
  values["Mira 2X"] = clamp(values["Mira 2X"] + shared * .7 + styleAdjust.x2, 70, 200);
  values["Mira 4X"] = clamp(values["Mira 4X"] + shared * .45 + styleAdjust.x4, 60, 200);
  values["Francotirador"] = clamp(values["Francotirador"] + styleAdjust.sniper, 30, 150);
  values["Cámara"] = clamp(values["Cámara"] + dpiFactor * .4, 50, 200);

  $("resultGrid").innerHTML = Object.entries(values).map(([name, value]) =>
    `<div class="result-card"><small>${name.toUpperCase()}</small><strong>${value}</strong></div>`
  ).join("");

  const model = $("deviceModel").value.trim() || "Dispositivo sin nombre";
  $("resultNote").textContent = `${model} · ${dpi} DPI · ${refresh} Hz · ${fingers} dedos. Valores experimentales: prueba primero en el campo de entrenamiento.`;
  $("results").hidden = false;
  $("results").scrollIntoView({behavior:"smooth", block:"start"});
  window.currentSensitivity = values;
}

function customizeCamera(refresh) {
  return refresh >= 120 ? 160 : refresh >= 90 ? 155 : 150;
}

$("detectBtn").addEventListener("click", readDeviceInfo);
$("generateBtn").addEventListener("click", generateSensitivity);
$("retestBtn").addEventListener("click", () => $("style").focus());
$("copyBtn").addEventListener("click", async () => {
  if (!window.currentSensitivity) return;
  const text = Object.entries(window.currentSensitivity).map(([k,v]) => `${k}: ${v}`).join("\n");
  try {
    await navigator.clipboard.writeText("FF SENSI LAB · YORU STUDIO\n" + text);
    $("copyBtn").textContent = "¡COPIADO!";
  } catch {
    $("copyBtn").textContent = "No se pudo copiar";
  }
});
readDeviceInfo();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
