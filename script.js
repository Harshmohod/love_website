/* =========================================================
   LUXURY ROMANTIC LOVE LETTER — SCRIPT
   Loading, music, cursor, particles, transitions,
   lightbox, envelope, scroll reveals
   ========================================================= */

(function () {
  "use strict";

  /* ---------- UTILITIES ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;

  if (isTouch || window.innerWidth <= 700) {
    document.body.classList.add("touch-device");
  }

  /* =========================================================
     LOADING SCREEN
     ========================================================= */
  function initLoading() {
    const screen = $("#loading-screen");
    if (!screen) return;

    const hide = () => {
      screen.classList.add("is-done");
      screen.setAttribute("aria-busy", "false");
      setTimeout(() => {
        screen.style.display = "none";
      }, 1000);
    };

    // Wait for fonts + images + minimum elegant beat
    const minTime = new Promise((r) => setTimeout(r, prefersReducedMotion ? 200 : 1800));
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    Promise.all([minTime, fontsReady]).then(hide);

    // Safety fallback
    setTimeout(hide, 4000);
  }

  /* =========================================================
     PAGE TRANSITIONS
     ========================================================= */
  function initPageTransitions() {
    const overlay = $("#page-transition");
    if (!overlay) return;

    $$("a[data-transition], a[href$='.html']").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || link.target === "_blank") return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        e.preventDefault();
        overlay.classList.add("is-active");
        overlay.setAttribute("aria-hidden", "false");

        setTimeout(() => {
          window.location.href = href;
        }, prefersReducedMotion ? 100 : 700);
      });
    });

    // Fade in on load
    requestAnimationFrame(() => {
      overlay.classList.remove("is-active");
    });
  }

  /* Smooth exit used by jelly button */
  function navigateWithTransition(url) {
    const overlay = $("#page-transition");
    if (!overlay) {
      window.location.href = url;
      return;
    }
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.filter = "blur(6px)";
    document.body.style.transform = "scale(1.03)";
    document.body.style.transition =
      "filter 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)";

    setTimeout(() => {
      window.location.href = url;
    }, prefersReducedMotion ? 100 : 750);
  }

  /* =========================================================
     MUSIC — autoplay after first interaction
     ========================================================= */
  function initMusic() {
    const audio = $("#bg-music");
    const toggle = $("#music-toggle");
    if (!audio || !toggle) return;

    let unlocked = false;
    let userPaused = false;

    // Soft ambient by default; upgrade to music.mp3 when the user adds their song
    audio.src = "assets/Dil Meri Na Sune - Instrumental _ Flute.mp3";
    fetch("assets/Dil Meri Na Sune - Instrumental _ Flute.mp3", { method: "HEAD" })
      .then((res) => {
        if (res.ok) audio.src = "assets/Dil Meri Na Sune - Instrumental _ Flute.mp3";
      })
      .catch(() => {});

    const updateUI = () => {
      const muted = audio.paused || audio.muted;
      toggle.classList.toggle("is-muted", muted);
      toggle.classList.toggle("is-playing", !muted);
      toggle.setAttribute(
        "aria-label",
        muted ? "Play music" : "Mute music"
      );
    };

    const tryPlay = async () => {
      if (userPaused) return;
      try {
        audio.muted = false;
        audio.volume = 0.35;
        await audio.play();
        unlocked = true;
        updateUI();
      } catch (_) {
        // Autoplay blocked until gesture — expected
      }
    };

    const unlockOnGesture = () => {
      if (unlocked || userPaused) return;
      tryPlay();
    };

    ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, unlockOnGesture, { once: true, passive: true });
    });

    // Resume across pages within same session
    try {
      if (sessionStorage.getItem("musicPlaying") === "1") {
        userPaused = false;
        tryPlay();
      }
      if (sessionStorage.getItem("musicPlaying") === "0") {
        userPaused = true;
      }
    } catch (_) {}

    toggle.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (audio.paused) {
        userPaused = false;
        try {
          await audio.play();
          audio.muted = false;
          try {
            sessionStorage.setItem("musicPlaying", "1");
          } catch (_) {}
        } catch (_) {}
      } else {
        audio.pause();
        userPaused = true;
        try {
          sessionStorage.setItem("musicPlaying", "0");
        } catch (_) {}
      }
      updateUI();
    });

    audio.addEventListener("play", updateUI);
    audio.addEventListener("pause", updateUI);
    updateUI();
  }

  /* =========================================================
     CUSTOM HEART CURSOR + SPARKLE TRAIL
     ========================================================= */
  function initCursor() {
    if (isTouch || prefersReducedMotion || window.innerWidth <= 700) return;

    const cursor = $("#cursor");
    const trail = $("#cursor-trail");
    if (!cursor || !trail) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let sparkleThrottle = 0;

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      cursor.style.transform = `translate(${x}px, ${y}px)`;

      sparkleThrottle++;
      if (sparkleThrottle % 3 === 0) {
        spawnSparkle(x, y);
      }
    };

    document.addEventListener("mousemove", onMove, { passive: true });

    const animateTrail = () => {
      tx += (x - tx) * 0.18;
      ty += (y - ty) * 0.18;
      trail.style.transform = `translate(${tx}px, ${ty}px)`;
      trail.style.opacity = "0.55";
      requestAnimationFrame(animateTrail);
    };
    requestAnimationFrame(animateTrail);
  }

  function spawnSparkle(x, y) {
    const dot = document.createElement("span");
    dot.className = "sparkle-dot";
    dot.style.left = x + (Math.random() * 16 - 8) + "px";
    dot.style.top = y + (Math.random() * 16 - 8) + "px";
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
  }

  /* =========================================================
     LANDING — PARTICLES, HEARTS, PETALS, BOKEH
     ========================================================= */
  function initLandingAtmosphere() {
    if (document.body.dataset.page !== "landing") return;
    if (prefersReducedMotion) return;

    createBokeh();
    createFloatingHearts();
    createPetals();
    initParticleCanvas();
    initParallax();
    initJellyButton();
  }

  function createBokeh() {
    const layer = $("#bokeh-layer");
    if (!layer) return;

    for (let i = 0; i < 18; i++) {
      const orb = document.createElement("span");
      orb.className = "bokeh-orb";
      const size = 20 + Math.random() * 80;
      orb.style.width = size + "px";
      orb.style.height = size + "px";
      orb.style.left = Math.random() * 100 + "%";
      orb.style.bottom = Math.random() * 40 + "%";
      orb.style.animationDuration = 10 + Math.random() * 18 + "s";
      orb.style.animationDelay = -Math.random() * 12 + "s";
      layer.appendChild(orb);
    }
  }

  function createFloatingHearts() {
    const layer = $("#hearts-layer");
    if (!layer) return;

    for (let i = 0; i < 16; i++) {
      const h = document.createElement("span");
      h.className = "floating-heart-tiny";
      h.textContent = "♥";
      h.style.left = Math.random() * 100 + "%";
      h.style.fontSize = 8 + Math.random() * 10 + "px";
      h.style.animationDuration = 14 + Math.random() * 16 + "s";
      h.style.animationDelay = -Math.random() * 20 + "s";
      layer.appendChild(h);
    }
  }

  function createPetals() {
    const layer = $("#petals-layer");
    if (!layer) return;

    for (let i = 0; i < 12; i++) {
      const p = document.createElement("span");
      p.className = "floating-petal";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 16 + Math.random() * 14 + "s";
      p.style.animationDelay = -Math.random() * 18 + "s";
      p.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
      layer.appendChild(p);
    }
  }

  /* Sparkling particle canvas — lightweight, 60fps */
  function initParticleCanvas() {
    const canvas = $("#particles-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0;
    let h = 0;
    let particles = [];
    let raf = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(70, Math.floor((w * h) / 18000));
      particles = Array.from({ length: count }, () => spawn());
    };

    const spawn = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.15 - Math.random() * 0.35,
      a: Math.random() * 0.6 + 0.15,
      tw: Math.random() * Math.PI * 2,
    });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.03;
        if (p.y < -10 || p.x < -10 || p.x > w + 10) {
          Object.assign(p, spawn(), { y: h + 10 });
        }
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(248, 215, 232, ${alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(draw);
      }
    });
  }

  /* Subtle mouse parallax on glow layers */
  function initParallax() {
    const layers = $$(".bg-glow, .bg-rays");
    if (!layers.length) return;

    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true }
    );

    const tick = () => {
      cx += (mx - cx) * 0.04;
      cy += (my - cy) * 0.04;
      layers.forEach((el, i) => {
        const depth = (i + 1) * 6;
        el.style.translate = `${cx * depth}px ${cy * depth}px`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* =========================================================
     JELLY BUTTON — ripple, hearts, transition to gallery
     ========================================================= */
  function initJellyButton() {
    const btn = $("#enter-gallery");
    if (!btn) return;

    const ripple = $(".jelly-btn-ripple", btn);

    btn.addEventListener("click", (e) => {
      // Ripple
      if (ripple) {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = e.clientX - rect.left - size / 2 + "px";
        ripple.style.top = e.clientY - rect.top - size / 2 + "px";
        ripple.classList.remove("is-active");
        void ripple.offsetWidth;
        ripple.classList.add("is-active");
      }

      // Heart particles
      burstHearts(e.clientX, e.clientY);

      // Unlock music on click
      const audio = $("#bg-music");
      if (audio) {
        audio.volume = 0.35;
        audio.play().catch(() => {});
        try {
          sessionStorage.setItem("musicPlaying", "1");
        } catch (_) {}
      }

      setTimeout(() => navigateWithTransition("gallery.html"), 420);
    });
  }

  function burstHearts(x, y) {
    for (let i = 0; i < 10; i++) {
      const h = document.createElement("span");
      h.className = "btn-heart-particle";
      h.textContent = "♥";
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 50 + Math.random() * 60;
      h.style.left = x + "px";
      h.style.top = y + "px";
      h.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      h.style.setProperty("--dy", Math.sin(angle) * dist - 30 + "px");
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 900);
    }
  }

  /* =========================================================
     GALLERY PAGE — decor, scroll reveal, lightbox, envelope
     ========================================================= */
  function initGalleryPage() {
    if (document.body.dataset.page !== "gallery") return;

    createGalleryDecor();
    initScrollReveal();
    initLightbox();
    initEnvelope();
  }

  function createGalleryDecor() {
    const layer = $("#gallery-decor");
    if (!layer || prefersReducedMotion) return;

    const symbols = ["❀", "♥", "✦", "✿", "♡"];
    for (let i = 0; i < 22; i++) {
      const el = document.createElement("span");
      el.textContent = symbols[i % symbols.length];
      el.style.left = Math.random() * 100 + "%";
      el.style.fontSize = 10 + Math.random() * 14 + "px";
      el.style.color =
        i % 2 === 0 ? "rgba(122, 0, 25, 0.35)" : "rgba(248, 215, 232, 0.9)";
      el.style.animationDuration = 18 + Math.random() * 20 + "s";
      el.style.animationDelay = -Math.random() * 22 + "s";
      layer.appendChild(el);
    }
  }

  function initScrollReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el) => io.observe(el));
  }

  /* ---------- LIGHTBOX ---------- */
  function initLightbox() {
    const lightbox = $("#lightbox");
    const img = $("#lightbox-img");
    const caption = $("#lightbox-caption");
    const btnClose = $("#lightbox-close");
    const btnPrev = $("#lightbox-prev");
    const btnNext = $("#lightbox-next");
    const items = $$(".memory-item");

    if (!lightbox || !items.length) return;

    let index = 0;
    let lastFocus = null;

    const open = (i) => {
      index = (i + items.length) % items.length;
      const item = items[index];
      const src = item.dataset.full || $("img", item).src;
      const cap = $(".memory-caption", item);

      lastFocus = document.activeElement;
      img.src = src;
      img.alt = $("img", item).alt || "Memory photo";
      caption.textContent = cap ? cap.textContent.trim() : "";

      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add("is-open"));
      document.body.style.overflow = "hidden";
      btnClose.focus();
    };

    const close = () => {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => {
        lightbox.hidden = true;
        img.src = "";
      }, 400);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    items.forEach((item, i) => {
      item.addEventListener("click", () => open(i));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(i);
        }
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", () => open(index - 1));
    btnNext.addEventListener("click", () => open(index + 1));

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(index - 1);
      if (e.key === "ArrowRight") open(index + 1);
    });
  }

  /* ---------- ENVELOPE ---------- */
  function initEnvelope() {
    const envelope = $("#envelope");
    if (!envelope) return;

    envelope.addEventListener("click", () => {
      const open = envelope.classList.toggle("is-open");
      envelope.setAttribute("aria-expanded", open ? "true" : "false");
    });

    envelope.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        envelope.click();
      }
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    initLoading();
    initPageTransitions();
    initMusic();
    initCursor();
    initLandingAtmosphere();
    initGalleryPage();
  });
})();
