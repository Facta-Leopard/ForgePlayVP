/* First-party language preference only. No network requests or analytics. */
(() => {
  "use strict";
  const languages = ["en", "ko", "ja", "es", "de", "fr", "zh-Hans", "zh-Hant"];
  const names = {en: "English", ko: "한국어", ja: "日本語", es: "Español", de: "Deutsch", fr: "Français", "zh-Hans": "简体中文", "zh-Hant": "繁體中文"};
  const root = "/ForgePlayVP/";
  const key = "forgeplayvp.language";
  const page = document.documentElement.dataset.page || "";
  const neutral = document.documentElement.dataset.languageRoute === "auto";
  function systemLanguage() {
    for (const raw of navigator.languages?.length ? navigator.languages : [navigator.language || "en"]) {
      const value = raw.replaceAll("_", "-").toLowerCase();
      const parts = value.split("-");
      if (parts[0] === "zh") {
        if (parts.includes("hant")) return "zh-Hant";
        if (parts.includes("hans")) return "zh-Hans";
        return parts.some(x => ["tw", "hk", "mo"].includes(x)) ? "zh-Hant" : "zh-Hans";
      }
      if (languages.includes(parts[0])) return parts[0];
    }
    return "en";
  }
  function preference() {
    try {
      const value = localStorage.getItem(key);
      return languages.includes(value) ? value : "system";
    } catch { return "system"; }
  }
  function remember(value) {
    try { localStorage.setItem(key, value); } catch { /* Navigation still works. */ }
  }
  function preferred() {
    const value = preference();
    return value === "system" ? systemLanguage() : value;
  }
  function route(language, destination = page) {
    return destination === "privacy" ? root + "privacy/#" + language :
      root + language + "/" + (destination ? destination + "/" : "");
  }
  let fragment = "";
  try { fragment = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore malformed anchors. */ }
  let language = page === "privacy" ?
    (languages.find(code => fragment === code || fragment.startsWith(code + "-")) || preferred()) :
    (neutral ? preferred() : document.documentElement.lang);
  if (neutral && page !== "privacy") {
    location.replace(route(language) + location.search + location.hash);
    return;
  }
  function updateNavigation() {
    const current = document.querySelector("[data-language-name]");
    if (current) current.textContent = names[language];
    for (const link of document.querySelectorAll("[data-site-page]")) {
      link.href = route(language, link.dataset.sitePage);
      if (link.dataset.labels) link.textContent = JSON.parse(link.dataset.labels)[language];
    }
    for (const link of document.querySelectorAll("[data-language]")) {
      if (link.dataset.language === language) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  }
  function start() {
    updateNavigation();
    for (const link of document.querySelectorAll("[data-language], [data-system-language]")) {
      link.addEventListener("click", event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const value = link.hasAttribute("data-system-language") ? "system" : link.dataset.language;
        if (value !== "system" && !languages.includes(value)) return;
        remember(value);
        language = value === "system" ? systemLanguage() : value;
        updateNavigation();
        const menu = document.querySelector("details.language");
        if (menu) menu.open = false;
        if (page === "privacy") {
          location.hash = language;
          document.getElementById(language)?.scrollIntoView();
          document.getElementById(language)?.focus({preventScroll: true});
        } else location.assign(route(language) + location.search + location.hash);
      });
    }
    if (page === "privacy" && !fragment) {
      history.replaceState(null, "", location.pathname + location.search + "#" + language);
      document.getElementById(language)?.scrollIntoView();
    }
    window.addEventListener("hashchange", () => {
      const code = languages.find(value => location.hash === "#" + value || location.hash.startsWith("#" + value + "-"));
      if (code) { language = code; updateNavigation(); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once: true});
  else start();
})();
