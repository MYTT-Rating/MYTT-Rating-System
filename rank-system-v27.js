(function () {
  "use strict";

  /*
   * Read the single official TIERS definition from app.js. The homepage uses
   * the same names, thresholds and badge artwork as player profiles. Do not
   * mutate TIERS here or create a competing rank table.
   * This script is loaded after app.js on the home page.
   */
  const OFFICIAL_TIERS = typeof TIERS !== "undefined" && Array.isArray(TIERS)
    ? TIERS
    : [];
  window.MYTT_FINAL_TIERS = OFFICIAL_TIERS;

  // Presentation-only metadata; these colors and connector classes are unchanged.
  const RANK_PRESENTATION = [
    {score:1500,color:"#d8dde4",line:"line-red"},
    {score:1600,color:"#19f53a",line:"line-orange"},
    {score:1700,color:"#21c9ff",line:"line-gold"},
    {score:1800,color:"#b55cff",line:"line-yellow"},
    {score:1900,color:"#ff3131",line:"line-green"},
    {score:2000,color:"#ff2e8d",line:"line-cyan"},
    {score:2100,color:"#f0a81c",line:"line-purple"},
    {score:2200,color:"#ffd51c",line:"line-pink"},
    {score:2300,color:"#ffd51c",line:null}
  ];
  const RANKS = RANK_PRESENTATION.map(style => {
    const tier = OFFICIAL_TIERS.find(t => t.min === style.score);
    return tier ? {
      name: tier.name,
      score: tier.min,
      badge: tier.badge,
      color: style.color,
      line: style.line
    } : null;
  }).filter(Boolean);

  function badgeUrl(file) {
    return `rank-badges/${file}?v=20260824-v64-custom-badges`;
  }

  function getHomepageRating() {
    const node = document.querySelector(".current-rating-v5 strong");
    const rating = Number(String(node?.textContent || "1500").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(rating) ? rating : 1500;
  }

  function getActiveRankIndex() {
    const rating = getHomepageRating();
    if (rating >= 2300) return 8;
    return Math.max(0, Math.min(8, Math.floor((rating - 1500) / 100)));
  }

  function fixProgressCopy() {
    const current = document.querySelector(".current-rating-v5");
    if (current) {
      const label = current.querySelector("span");
      if (label) label.textContent = "Rookie";
    }

    const head = document.querySelector(".hero-progress-head");
    if (head) {
      const labels = head.querySelectorAll("strong");
      if (labels[0]) labels[0].textContent = "Rookie";
      if (labels[1]) labels[1].textContent = "Challenger";
    }
  }

  function buildRoad() {
    const road = document.querySelector(".homepage-rank-road");
    if (!road) return;

    road.className = "homepage-rank-road mytt-native-rank-road-v47";
    road.innerHTML = "";

    RANKS.forEach((rank, index) => {
      const node = document.createElement("article");
      node.className = "home-rank-native-node";
      node.dataset.rankIndex = String(index);
      node.style.setProperty("--rank-color", rank.color);

      const shell = document.createElement("div");
      shell.className = "home-rank-native-shell";

      const img = document.createElement("img");
      img.className = "home-rank-native-badge";
      img.src = badgeUrl(rank.badge);
      img.alt = `${rank.name} badge`;
      img.decoding = "async";
      const phone = window.innerWidth <= 768;
      const aboveFold = !phone || index <= 3;
      img.loading = aboveFold ? "eager" : "lazy";
      img.fetchPriority = index === 0 ? "high" : (aboveFold ? "auto" : "low");
      shell.appendChild(img);

      const name = document.createElement("span");
      name.className = "home-rank-native-name";
      name.textContent = rank.name;

      const score = document.createElement("small");
      score.className = "home-rank-native-score";
      score.textContent = String(rank.score);

      const marker = document.createElement("span");
      marker.className = "home-rank-native-marker";
      marker.innerHTML = '<b>▲</b><em>YOU ARE HERE</em>';

      node.append(shell, name, score, marker);
      road.appendChild(node);

      if (rank.line) {
        const line = document.createElement("i");
        line.className = `home-rank-native-line ${rank.line}`;
        road.appendChild(line);
      }
    });

    const active = getActiveRankIndex();
    setActive(active);
    fixProgressCopy();
    bindRoad(road);
  }

  function setActive(index) {
    document.querySelectorAll(".home-rank-native-node").forEach((node, i) => {
      node.classList.toggle("active", i === index);
    });
  }

  function nearestVisibleRank(road) {
    const nodes = [...road.querySelectorAll(".home-rank-native-node")];
    if (!nodes.length) return 0;

    const r = road.getBoundingClientRect();
    const target = r.left + Math.min(58, r.width * 0.16);
    let best = 0;
    let dist = Infinity;

    nodes.forEach((node, i) => {
      const nr = node.getBoundingClientRect();
      const center = nr.left + nr.width / 2;
      const d = Math.abs(center - target);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  }

  function bindRoad(road) {
    let raf = 0;

    const syncMobileActive = () => {
      if (window.innerWidth > 768) {
        setActive(getActiveRankIndex());
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(nearestVisibleRank(road)));
    };

    road.addEventListener("scroll", syncMobileActive, { passive: true });
    window.addEventListener("resize", syncMobileActive, { passive: true });

    let down = false;
    let startX = 0;
    let startScroll = 0;

    road.addEventListener("pointerdown", (e) => {
      if (window.innerWidth > 768) return;
      down = true;
      startX = e.clientX;
      startScroll = road.scrollLeft;
      road.classList.add("is-dragging");
      try { road.setPointerCapture(e.pointerId); } catch (_) {}
    });

    road.addEventListener("pointermove", (e) => {
      if (!down) return;
      road.scrollLeft = startScroll - (e.clientX - startX);
    });

    const stop = () => {
      if (!down) return;
      down = false;
      road.classList.remove("is-dragging");
      syncMobileActive();
    };

    road.addEventListener("pointerup", stop);
    road.addEventListener("pointercancel", stop);
    road.addEventListener("pointerleave", stop);

    syncMobileActive();
  }

  function boot() {
    buildRoad();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
