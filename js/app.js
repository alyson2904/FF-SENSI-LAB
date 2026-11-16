
"use strict";

/* ==========================================
   FF SENSI LAB — YORU STUDIO
   Version: Beta 0.3
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

function getValue(id) {
  return $(id)?.value?.trim() ?? "";
}

function getSelectedText(id) {
  const element = $(id);
  return element?.selectedOptions?.[0]?.textContent?.trim() || "";
}

function showMessage(message) {
  alert(message);
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}


/* ==========================================
   2. DETECCIÓN DEL DISPOSITIVO
========================================== */

async function readDeviceInfo() {
  const button = $("detectBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Detectando...";
  }

  setText("deviceName", "Buscando dispositivo...");
  setText("deviceInfo", "Consultando información disponible.");

  try {
    const ua = navigator.userAgent || "";

    let model = "";
    let androidVersion = "No disponible";
    let platform = "No identificada";
    let browser = "Navegador no identificado";

    const androidMatch = ua.match(/Android\s([\d.]+)/i);

    if (androidMatch) {
      androidVersion = androidMatch[1];
      platform = "Android";
    } else if (/iPhone|iPad/i.test(ua)) {
      platform = "iOS";
    }

    // Información avanzada, si el navegador la permite.
    if (
      navigator.userAgentData &&
      typeof navigator.userAgentData.getHighEntropyValues === "function"
    ) {
      try {
        const data = await navigator.userAgentData.getHighEntropyValues([
          "model",
          "platformVersion"
        ]);

        model = (data.model || "").trim();

        if (data.platform) {
          platform = data.platform;
        }

        if (data.platformVersion) {
          androidVersion = data.platformVersion;
        }

      } catch (error) {
        console.warn("Información avanzada no disponible:", error);
      }
    }

    // Navegador.
    if (/EdgA/i.test(ua)) {
      browser = "Microsoft Edge";
    } else if (/Firefox/i.test(ua)) {
      browser = "Firefox";
    } else if (/Chrome/i.test(ua)) {
      browser = "Google Chrome";
    } else if (/Safari/i.test(ua)) {
      browser = "Safari";
    }

    const width = Math.round(
      screen.width * (window.devicePixelRatio || 1)
    );

    const height = Math.round(
      screen.height * (window.devicePixelRatio || 1)
    );

    // Memoria aproximada expuesta por el navegador.
    const memory = navigator.deviceMemory || null;

    const touchPoints = navigator.maxTouchPoints || 0;

    // Completar el campo únicamente si se detectó un modelo.
    if (model && $("deviceModel")) {
      $("deviceModel").value = model;
    }

    currentDevice = {
      model: model,
      platform,
      androidVersion,
      width,
      height,
      memory,
      touchPoints,
      browser,
      detectedModel: Boolean(model)
    };

    if (model) {
      setText("deviceName", model);

      setText(
        "deviceInfo",
        `Modelo detectado · ${platform} · Versión ${androidVersion} · ` +
        `${width} × ${height} px · ` +
        `RAM del navegador: ${memory ? memory + " GB aprox." : "No disponible"} · ` +
        `${browser}`
      );

    } else {
      setText("deviceName", "Modelo no identificado");

      setText(
        "deviceInfo",
        `El navegador no pudo identificar tu modelo. ` +
        `${platform} · ${width} × ${height} px · ` +
        `RAM: ${memory ? memory + " GB aprox." : "No disponible"} · ` +
        `${browser}. Escríbelo manualmente.`
      );
    }

    console.log("FF SENSI LAB - Dispositivo:", currentDevice);

  } catch (error) {
    console.error("Error de detección:", error);

    currentDevice = null;

    setText("deviceName", "No se pudo detectar");

    setText(
      "deviceInfo",
      "Introduce manualmente la marca y el modelo de tu teléfono."
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Detectar dispositivo";
    }
  }
}


/* ==========================================
   3. VALIDACIÓN DEL PERFIL
========================================== */

function validateDevice() {
  const model = getValue("deviceModel");

  if (!model) {
    showMessage(
      "Primero escribe la marca y el modelo de tu teléfono."
    );

    $("deviceModel")?.focus();
    return false;
  }

  const ram = getValue("ram");

  if (!ram) {
    showMessage("Selecciona la memoria RAM de tu dispositivo.");
    $("ram")?.focus();
    return false;
  }

  const refresh = getValue("refresh");

  if (!refresh) {
    showMessage("Selecciona la frecuencia de tu pantalla.");
    $("refresh")?.focus();
    return false;
  }

  const fingers = getValue("fingers");

  if (!fingers) {
    showMessage("Selecciona cuántos dedos utilizas.");
    $("fingers")?.focus();
    return false;
  }

  const style = getValue("style");

  if (!style) {
    showMessage("Selecciona tu estilo de juego.");
    $("style")?.focus();
    return false;
  }

  const game = getValue("game");

  if (!game) {
    showMessage("Selecciona tu versión de Free Fire.");
    $("game")?.focus();
    return false;
  }

  return true;
}


/* ==========================================
   4. GENERADOR DE SENSIBILIDAD
========================================== */

function calculateSensitivity() {
  if (!validateDevice()) {
    return null;
  }

  const model = getValue("deviceModel");

  // DPI opcional.
  const dpiInput = getValue("dpi");

  const dpi = dpiInput === ""
    ? null
    : Number(dpiInput);

  const refresh = Number(getValue("refresh"));
  const ram = Number(getValue("ram"));
  const fingers = Number(getValue("fingers"));

  const style = getValue("style");
  const game = getValue("game");

  if (
    dpi !== null &&
    (!Number.isFinite(dpi) || dpi < 240 || dpi > 800)
  ) {
    showMessage(
      "El DPI debe estar entre 240 y 800, o puedes dejarlo vacío."
    );

    $("dpi")?.focus();
    return null;
  }

  const dpiFactor = dpi === null
    ? 0
    : (dpi - 500) / 35;

  const refreshFactor = (refresh - 90) / 12;

  const ramFactor =
    ram <= 3 ? -3 :
    ram >= 8 ? 2 : 0;

  const fingerFactor =
    fingers === 2 ? 3 :
    fingers === 3 ? 0 : -2;

  // Valores base experimentales.
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

  const adjustment = styles[style];

  const shared =
    dpiFactor * 1.2 +
    refreshFactor * 0.6 +
    ramFactor * 0.35;

  const values = {
    "General": clamp(
      base.general + shared + fingerFactor + adjustment.general
    ),

    "Punto rojo": clamp(
      base.redDot + shared + fingerFactor * 0.7 +
      adjustment.redDot
    ),

    "Mira 2X": clamp(
      base.scope2x + shared * 0.7 + adjustment.scope2x
    ),

    "Mira 4X": clamp(
      base.scope4x + shared * 0.45 + adjustment.scope4x
    ),

    "Francotirador": clamp(
      base.sniper + adjustment.sniper,
      30,
      150
    ),

    "Vista libre": clamp(
      base.freeLook +
      (dpi === null ? 0 : dpiFactor * 0.4) +
      adjustment.freeLook
    )
  };

  return {
    values,

    metadata: {
      model,
      dpi,
      refresh,
      ram,
      fingers,
      style,
      game,
      dpiKnown: dpi !== null
    }
  };
}


/* ==========================================
   5. MOSTRAR RESULTADOS
========================================== */

function generateSensitivity() {
  const calculated = calculateSensitivity();

  if (!calculated) return;

  const resultGrid = $("resultGrid");
  const results = $("results");

  if (!resultGrid || !results) {
    showMessage("No se encontró el área de resultados.");
    return;
  }

  currentSensitivity = calculated;

  resultGrid.innerHTML = "";

  Object.entries(calculated.values).forEach(([name, value]) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const label = document.createElement("small");
    label.textContent = name.toUpperCase();

    const number = document.createElement("strong");
    number.textContent = String(value);

    card.appendChild(label);
    card.appendChild(number);

    resultGrid.appendChild(card);
  });

  const meta = calculated.metadata;

  const dpiText = meta.dpiKnown
    ? `${meta.dpi} DPI`
    : "DPI no especificado";

  const note = $("resultNote");

  if (note) {
    note.textContent =
      `${meta.model} · ${dpiText} · ` +
      `${meta.ram} GB RAM · ${meta.refresh} Hz · ` +
      `${meta.fingers} dedos · ${getSelectedText("game")}. ` +
      "Configuración experimental para calibrar.";
  }

  results.hidden = false;

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  console.log("FF SENSI LAB - Resultado:", currentSensitivity);
}


/* ==========================================
   6. COPIAR CONFIGURACIÓN
========================================== */

async function copySensitivity() {
  if (!currentSensitivity) {
    showMessage("Primero genera una sensibilidad.");
    return;
  }

  const values = currentSensitivity.values;
  const meta = currentSensitivity.metadata;

  const textToCopy =
    "FF SENSI LAB | YORU STUDIO\n\n" +
    `Dispositivo: ${meta.model}\n` +
    `RAM: ${meta.ram} GB\n` +
    `DPI: ${meta.dpiKnown ? meta.dpi : "No especificado"}\n` +
    `Frecuencia: ${meta.refresh} Hz\n` +
    `Dedos: ${meta.fingers}\n` +
    `Juego: ${meta.game}\n\n` +
    Object.entries(values)
      .map(([name, value]) => `${name}: ${value}`)
      .join("\n") +
    "\n\nConfiguración experimental. Ajustar mediante pruebas.";

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);

    } else {
      const area = document.createElement("textarea");

      area.value = textToCopy;
      area.style.position = "fixed";
      area.style.left = "-9999px";

      document.body.appendChild(area);
      area.select();

      const copied = document.execCommand("copy");

      area.remove();

      if (!copied) {
        throw new Error("No se pudo copiar");
      }
    }

    const button = $("copyBtn");

    if (button) {
      const originalText = button.textContent;

      button.textContent = "¡Configuración copiada!";

      setTimeout(() => {
        button.textContent = originalText;
      }, 2200);
    }

  } catch (error) {
    console.error("Error al copiar:", error);

    showMessage("No se pudo copiar. Intenta nuevamente.");
  }
}


/* ==========================================
   7. EVENTOS
========================================== */

function initializeApp() {
  const detectBtn = $("detectBtn");
  const generateBtn = $("generateBtn");
  const copyBtn = $("copyBtn");
  const retestBtn = $("retestBtn");

  if (detectBtn) {
    detectBtn.addEventListener("click", readDeviceInfo);
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generateSensitivity);
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", copySensitivity);
  }

  if (retestBtn) {
    retestBtn.addEventListener("click", () => {
      if ($("style")) {
        $("style").focus();
      }

      if ($("results")) {
        $("results").hidden = true;
      }
    });
  }

  // Intentar detectar el dispositivo al abrir.
  readDeviceInfo();
}


/* ==========================================
   8. INICIAR APLICACIÓN
========================================== */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
