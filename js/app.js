
"use strict";

/* ==========================================
   FF SENSI LAB — YORU STUDIO
   Version: Beta 0.2
   Sensitivity Generator
========================================== */

const $ = (id) => document.getElementById(id);

let currentSensitivity = null;
let currentDevice = null;

/* ==========================================
   1. UTILIDADES
========================================== */

function clamp(value, min = 0, max = 200) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getSelectedText(id) {
  const element = $(id);
  return element?.selectedOptions?.[0]?.textContent || "";
}

/* ==========================================
   2. DETECCIÓN DEL DISPOSITIVO
========================================== */

async function readDeviceInfo() {
  const button = $("detectBtn");

  if (button) button.disabled = true;

  try {
    const ua = navigator.userAgent || "";
    const android = ua.match(/Android\s([\d.]+)/i);

    let model = "";
    let manufacturer = "No identificado";
    let androidVersion = android ? android[1] : "No identificada";
    let browser = "Navegador móvil";

    // Detección avanzada cuando el navegador la permite.
    if (navigator.userAgentData) {
      try {
        const data =
          await navigator.userAgentData.getHighEntropyValues([
            "model",
            "platformVersion",
            "fullVersionList"
          ]);

        model = data.model || "";
        androidVersion = data.platformVersion || androidVersion;

        const brands = data.brands || [];

        if (brands.length) {
          manufacturer = brands[0].brand;
        }
      } catch (error) {
        console.log("Información avanzada no disponible:", error);
      }
    }

    // Identificación aproximada del navegador.
    if (/EdgA/i.test(ua)) {
      browser = "Microsoft Edge";
    } else if (/Firefox/i.test(ua)) {
      browser = "Firefox";
    } else if (/Chrome/i.test(ua)) {
      browser = "Google Chrome";
    } else if (/Safari/i.test(ua)) {
      browser = "Safari";
    }

    // Resolución física aproximada en píxeles.
    const width = Math.round(
      screen.width * (window.devicePixelRatio || 1)
    );

    const height = Math.round(
      screen.height * (window.devicePixelRatio || 1)
    );

    // Memoria aproximada expuesta por el navegador.
    const memory = navigator.deviceMemory || null;

    // Puntos táctiles máximos reportados.
    const touchPoints = navigator.maxTouchPoints || 0;

    // Completar el modelo cuando exista información.
    if (model) {
      $("deviceModel").value = model;
    }

    // La RAM se informa, pero no se modifica si no coincide
    // con una opción disponible en el selector.
    currentDevice = {
      model: model || $("deviceModel").value || "No identificado",
      manufacturer,
      androidVersion,
      width,
      height,
      memory,
      touchPoints,
      browser
    };

    $("deviceName").textContent =
      currentDevice.model;

    $("deviceInfo").textContent =
      `${manufacturer} · Android ${androidVersion} · ` +
      `${width} × ${height}px · ` +
      `RAM: ${memory ? memory + " GB aprox." : "No disponible"} · ` +
      `${touchPoints} puntos táctiles · ${browser}`;

    console.log("FF SENSI LAB - Dispositivo:", currentDevice);

  } catch (error) {
    console.error("Error de detección:", error);

    $("deviceName").textContent =
      "Detección parcial";

    $("deviceInfo").textContent =
      "Introduce los datos de tu dispositivo manualmente.";
  } finally {
    if (button) button.disabled = false;
  }
}

/* ==========================================
   3. ALGORITMO DE SENSIBILIDAD
========================================== */

function calculateSensitivity() {

  // Datos del dispositivo.
  const dpi = Number($("dpi").value) || 500;
  const refresh = Number($("refresh").value) || 60;
  const ram = Number($("ram").value) || 4;

  // Datos del jugador.
  const fingers = Number($("fingers").value) || 2;
  const style = $("style").value;
  const game = $("game").value;

  // Validación.
  if (dpi < 240 || dpi > 800) {
    alert("Introduce un valor de DPI entre 240 y 800.");
    $("dpi").focus();
    return null;
  }

  // Factores experimentales.
  const dpiFactor = (dpi - 500) / 35;
  const refreshFactor = (refresh - 90) / 12;

  const ramFactor =
    ram <= 3 ? -3 :
    ram >= 8 ? 2 : 0;

  const fingerFactor =
    fingers === 2 ? 3 :
    fingers === 3 ? 0 : -2;

  // Base de sensibilidad.
  const base = {
    general: 186,
    redDot: 178,
    scope2x: 170,
    scope4x: 158,
    sniper: 92,
    freeLook: 155
  };

  // Ajustes según el estilo.
  const styles = {
    all: {
      general: 0,
      redDot: 0,
      scope2x: 0,
      scope4x: 0,
      sniper: 0,
      freeLook: 0
    },

    headshot: {
      general: 5,
      redDot: 5,
      scope2x: 3,
      scope4x: 0,
      sniper: 0,
      freeLook: 0
    },

    rush: {
      general: 6,
      redDot: 4,
      scope2x: 2,
      scope4x: -2,
      sniper: -3,
      freeLook: 2
    },

    balanced: {
      general: 0,
      redDot: 0,
      scope2x: 0,
      scope4x: 0,
      sniper: 0,
      freeLook: 0
    },

    range: {
      general: -4,
      redDot: -2,
      scope2x: -3,
      scope4x: -5,
      sniper: 3,
      freeLook: -2
    }
  };

  const adjustment = styles[style] || styles.all;

  // Influencia combinada del dispositivo.
  const shared =
    dpiFactor * 1.2 +
    refreshFactor * 0.6 +
    ramFactor * 0.35;

  // Cálculo de los seis valores.
  const result = {
    "General": clamp(
      base.general + shared + fingerFactor +
      adjustment.general
    ),

    "Punto rojo": clamp(
      base.redDot + shared + fingerFactor * 0.7 +
      adjustment.redDot
    ),

    "Mira 2X": clamp(
      base.scope2x + shared * 0.7 +
      adjustment.scope2x
    ),

    "Mira 4X": clamp(
      base.scope4x + shared * 0.45 +
      adjustment.scope4x
    ),

    "Francotirador": clamp(
      base.sniper + adjustment.sniper,
      30,
      150
    ),

    "Vista libre": clamp(
      base.freeLook + dpiFactor * 0.4 +
      adjustment.freeLook
    )
  };

  return {
    values: result,
    metadata: {
      dpi,
      refresh,
      ram,
      fingers,
      style,
      game,
      model: $("deviceModel").value || "Sin identificar"
    }
  };
}

/* ==========================================
   4. MOSTRAR RESULTADOS
========================================== */

function generateSensitivity() {

  const calculated = calculateSensitivity();

  if (!calculated) return;

  currentSensitivity = calculated;

  const resultGrid = $("resultGrid");

  resultGrid.innerHTML = "";

  Object.entries(calculated.values).forEach(
    ([name, value]) => {

      const card = document.createElement("div");
      card.className = "result-card";

      const label = document.createElement("small");
      label.textContent = name.toUpperCase();

      const number = document.createElement("strong");
      number.textContent = value;

      card.appendChild(label);
      card.appendChild(number);

      resultGrid.appendChild(card);
    }
  );

  const meta = calculated.metadata;

  $("resultNote").textContent =
    `${meta.model} · ${meta.dpi} DPI · ` +
    `${meta.refresh} Hz · ${meta.fingers} dedos · ` +
    `${getSelectedText("game")}. ` +
    "Configuración experimental para comenzar a calibrar.";

  $("results").hidden = false;

  $("results").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  console.log(
    "FF SENSI LAB - Resultado:",
    currentSensitivity
  );
}

/* ==========================================
   5. COPIAR CONFIGURACIÓN
========================================== */

async function copySensitivity() {

  if (!currentSensitivity) {
    alert("Primero genera una sensibilidad.");
    return;
  }

  const values = currentSensitivity.values;
  const meta = currentSensitivity.metadata;

  const text =
    "FF SENSI LAB | YORU STUDIO\n\n" +
    `Dispositivo: ${meta.model}\n` +
    `DPI: ${meta.dpi}\n` +
    `Frecuencia: ${meta.refresh} Hz\n` +
    `Dedos: ${meta.fingers}\n\n` +
    Object.entries(values)
      .map(([name, value]) => `${name}: ${value}`)
      .join("\n");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";

      document.body.appendChild(area);
      area.select();

      const copied = document.execCommand("copy");
      area.remove();

      if (!copied) throw new Error("No se pudo copiar");
    }

    $("copyBtn").textContent = "¡CONFIGURACIÓN COPIADA!";

    setTimeout(() => {
      $("copyBtn").textContent = "Copiar configuración";
    }, 2200);

  } catch (error) {
    console.error("Error al copiar:", error);
    alert("No se pudo copiar. Intenta nuevamente.");
  }
}

/* ==========================================
   6. EVENTOS
========================================== */

function initializeApp() {

  $("detectBtn").addEventListener(
    "click",
    readDeviceInfo
  );

  $("generateBtn").addEventListener(
    "click",
    generateSensitivity
  );

  $("copyBtn").addEventListener(
    "click",
    copySensitivity
  );

  $("retestBtn").addEventListener(
    "click",
    () => {
      $("style").focus();
      $("results").hidden = true;
    }
  );

  // Detectar información básica al iniciar.
  readDeviceInfo();
}

/* ==========================================
   7. INICIAR APLICACIÓN
========================================== */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );
} else {
  initializeApp();
}
