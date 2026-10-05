import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import Admin from "./admin.jsx";
import GamePortal from "./GamePortal.jsx";
import OriginalGames from "./OriginalGames.jsx";
import "./game-portal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const apiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    credentials: "include",
  });

const walletFetch = async (url, options = {}, timeoutMs = 25000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await apiFetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "The deposit service took too long to respond. Please try again."
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
};

const caseMeta = {
  1: { accent: "violet", icon: "🎁", tag: "POPULAR" },
  2: { accent: "cyan", icon: "💎", tag: "HOT" },
  3: { accent: "pink", icon: "🌌", tag: "NEW" },
  4: { accent: "gold", icon: "👑", tag: "HIGH RISK" },
};

const fallbackCases = [
  { id: 1, name: "Starter Case", price_cents: 299 },
  { id: 2, name: "Neon Case", price_cents: 799 },
  { id: 3, name: "Galaxy Case", price_cents: 1499 },
  { id: 4, name: "Titan Case", price_cents: 2999 },
];

const rarityClass = (rarity) => String(rarity || "Common").toLowerCase();

function ItemArt({ rarity = "Common", imageUrl = "", compact = false, large = false }) {
  const cls = `item-art-svg${compact ? " compact" : ""}${large ? " large" : ""}`;
  const tier = String(rarity || "Common");
  const resolvedImageUrl = String(imageUrl || "").trim();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedImageUrl]);

  if (resolvedImageUrl && !imageFailed) {
    return (
      <img
        className={`${cls} item-art-image`}
        src={resolvedImageUrl}
        alt=""
        aria-hidden="true"
        draggable="false"
        onError={() => setImageFailed(true)}
        style={{
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  }

  if (tier === "Secret") {
    return (
      <svg className={cls} viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id="secretCore" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#fff"/>
            <stop offset="18%" stopColor="#ffb8f6"/>
            <stop offset="48%" stopColor="#ff5fe4"/>
            <stop offset="100%" stopColor="#7a35b7"/>
          </radialGradient>
          <filter id="secretGlow">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" r="39" fill="#ff65e522" filter="url(#secretGlow)"/>
        <path
          d="M60 9 69 39 100 30 80 52 109 68 76 70 82 103 60 80 38 103 44 70 11 68 40 52 20 30 51 39Z"
          fill="url(#secretCore)"
          stroke="#ffd7fa"
          strokeWidth="2"
        />
        <circle cx="60" cy="57" r="13" fill="#fff" opacity=".9"/>
        <circle cx="56" cy="53" r="4" fill="#fff"/>
      </svg>
    );
  }

  if (tier === "Legendary") {
    return (
      <svg className={cls} viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="legendGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff1a6"/>
            <stop offset="45%" stopColor="#ffd45e"/>
            <stop offset="100%" stopColor="#b9781c"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="61" r="42" fill="#ffd45e18"/>
        <path
          d="M24 42 38 58 49 30 60 55 71 30 82 58 96 42 90 91H30Z"
          fill="url(#legendGold)"
          stroke="#fff0a2"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M30 78H90V92H30Z" fill="#d59b2c"/>
        <circle cx="38" cy="58" r="5" fill="#fff3b1"/>
        <circle cx="60" cy="55" r="5" fill="#fff3b1"/>
        <circle cx="82" cy="58" r="5" fill="#fff3b1"/>
        <path
          d="M43 79H77"
          stroke="#fff1a6"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (tier === "Epic") {
    return (
      <svg className={cls} viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id="epicOrb">
            <stop offset="0%" stopColor="#f4d9ff"/>
            <stop offset="35%" stopColor="#c080ff"/>
            <stop offset="100%" stopColor="#6335a7"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="42" fill="#c080ff18"/>
        <path
          d="M60 13 91 31 100 63 79 94 43 94 20 63 29 31Z"
          fill="url(#epicOrb)"
          stroke="#e7c8ff"
          strokeWidth="2"
        />
        <path
          d="M60 13V94M29 31 79 94M91 31 43 94M20 63H100"
          stroke="#fff"
          strokeOpacity=".28"
          strokeWidth="2"
        />
        <circle cx="51" cy="45" r="9" fill="#fff" opacity=".38"/>
      </svg>
    );
  }

  if (tier === "Rare") {
    return (
      <svg className={cls} viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="rareCrystal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#bfe4ff"/>
            <stop offset="45%" stopColor="#55a8ff"/>
            <stop offset="100%" stopColor="#2769bb"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="38" fill="#55a8ff16"/>
        <path
          d="M60 10 92 44 76 91 44 91 28 44Z"
          fill="url(#rareCrystal)"
          stroke="#cce9ff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M60 10V91M28 44H92M28 44 60 57 92 44"
          stroke="#fff"
          strokeOpacity=".3"
          strokeWidth="2"
        />
        <path
          d="M45 35 56 24"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".55"
        />
      </svg>
    );
  }

  return (
    <svg className={cls} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="commonPrism" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#d9dbe4"/>
          <stop offset="100%" stopColor="#8e929e"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="36" fill="#d9dbe40e"/>
      <path
        d="M60 14 92 43 80 91 40 91 28 43Z"
        fill="url(#commonPrism)"
        stroke="#f5f6fa"
        strokeWidth="2"
      />
      <path
        d="M60 14V91M28 43H92M28 43 60 58 92 43"
        stroke="#fff"
        strokeOpacity=".34"
        strokeWidth="2"
      />
      <path
        d="M46 32 57 23"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".65"
      />
    </svg>
  );
}

function CaseArt({ caseId = 1, accent = "violet" }) {
  const palettes = {
    violet: ["#b084ff", "#6d42d8", "#2b1850"],
    cyan: ["#62d7ff", "#2389c4", "#123047"],
    pink: ["#ff8bd8", "#c449a1", "#461738"],
    gold: ["#ffe08a", "#c58a28", "#4a3210"],
  };

  const [light, mid, dark] = palettes[accent] || palettes.violet;

  return (
    <svg
      className={`case-art case-art-${caseId}`}
      viewBox="0 0 240 180"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`caseTop-${caseId}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor={light}/>
          <stop offset="100%" stopColor={mid}/>
        </linearGradient>

        <linearGradient
          id={`caseBody-${caseId}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor={mid}/>
          <stop offset="100%" stopColor={dark}/>
        </linearGradient>

        <filter id={`caseGlow-${caseId}`}>
          <feGaussianBlur stdDeviation="7" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <ellipse
        cx="120"
        cy="145"
        rx="70"
        ry="13"
        fill={light}
        opacity=".12"
        filter={`url(#caseGlow-${caseId})`}
      />

      <g transform="translate(45 20) rotate(-4 75 65)">
        <path
          d="M12 38 75 12 138 38 75 64Z"
          fill={`url(#caseTop-${caseId})`}
          stroke={light}
          strokeWidth="2"
        />

        <path
          d="M12 38V112L75 145V64Z"
          fill={`url(#caseBody-${caseId})`}
          stroke={mid}
          strokeWidth="2"
        />

        <path
          d="M138 38V112L75 145V64Z"
          fill={dark}
          stroke={mid}
          strokeWidth="2"
        />

        <path
          d="M75 64V145"
          stroke={light}
          strokeOpacity=".45"
          strokeWidth="2"
        />

        <path
          d="M12 38 75 64 138 38"
          fill="none"
          stroke="#fff"
          strokeOpacity=".2"
          strokeWidth="2"
        />

        <rect
          x="67"
          y="67"
          width="16"
          height="34"
          rx="4"
          fill={light}
          opacity=".9"
        />

        <rect
          x="63"
          y="91"
          width="24"
          height="7"
          rx="3.5"
          fill="#fff"
          opacity=".28"
        />

        <circle cx="75" cy="40" r="17" fill="#fff" opacity=".06"/>

        <path
          d="M67 38 75 30 83 38 75 46Z"
          fill="#fff"
          opacity=".75"
        />
      </g>
    </svg>
  );
}

const caseDescriptions = {
  1: "The perfect first pull with balanced odds.",
  2: "Charged with brighter rewards and higher variance.",
  3: "Cosmic drops with a serious shot at Epic.",
  4: "High-stakes rewards built for the bold.",
};

const CRYPTO_DEPOSIT_OPTIONS = [
  { code: "USDTTRC20", label: "USDT · TRC-20" },
  { code: "USDTERC20", label: "USDT · ERC-20" },
  { code: "USDTBSC", label: "USDT · BSC" },
  { code: "USDTMATIC", label: "USDT · Polygon" },
  { code: "USDTSOL", label: "USDT · Solana" },
  { code: "USDC", label: "USDC · ERC-20" },
  { code: "USDCMATIC", label: "USDC · Polygon" },
  { code: "USDCSOL", label: "USDC · Solana" },
  { code: "SOL", label: "SOL · Solana" },
  { code: "LTC", label: "LTC · Litecoin" },
];

function truncateAddress(value, length = 36) {
  const text = String(value || "");
  if (text.length <= length) return text;
  const side = Math.floor(length / 2);
  return `${text.slice(0, side)}…${text.slice(-side)}`;
}

function formatCreatorDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function useScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(
      ".section, .how, .fair, .faq, .case-grid .case-card, .recent-wins, .steps > div, .jackpot-live-player"
    ));

    if (!nodes.length) return undefined;

    nodes.forEach((node, index) => {
      node.classList.add("scroll-reveal");
      node.style.setProperty("--reveal-delay", `${Math.min(index % 8, 7) * 55}ms`);
    });

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}


function JackpotWheel({ players = [], totalCents = 0 }) {
  const numericTotal = Math.max(0, Number(totalCents || 0));

  const sortedPlayers = [...players]
    .map((player) => ({
      ...player,
      contributionCents: Math.max(
        0,
        Number(player.contributionCents || 0)
      ),
      odds: Math.max(0, Number(player.odds || 0)),
    }))
    .sort(
      (a, b) =>
        b.contributionCents - a.contributionCents
    );

  const maxVisiblePlayers = 10;
  const visiblePlayers = sortedPlayers.slice(
    0,
    maxVisiblePlayers
  );

  const othersCents = sortedPlayers
    .slice(maxVisiblePlayers)
    .reduce(
      (sum, player) =>
        sum + player.contributionCents,
      0
    );

  if (othersCents > 0) {
    visiblePlayers.push({
      userId: "others",
      username: "Others",
      contributionCents: othersCents,
      odds:
        numericTotal > 0
          ? (othersCents / numericTotal) * 100
          : 0,
      isOthers: true,
    });
  }

  const hasEntries =
    numericTotal > 0 &&
    visiblePlayers.length > 0;

  const colors = [
    "#9d6cff",
    "#7b4fe0",
    "#b779ff",
    "#6546bb",
    "#8f65dc",
    "#5c49a2",
    "#a875ed",
    "#7258c0",
    "#9467d8",
    "#60479c",
    "#858092",
  ];

  const size = 520;
  const center = size / 2;
  const outerRadius = 226;
  const innerRadius = 118;

  const polar = (radius, angleDegrees) => {
    const radians =
      ((angleDegrees - 90) * Math.PI) / 180;

    return {
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians),
    };
  };

  const arcPath = (
    startAngle,
    endAngle
  ) => {
    const startOuter = polar(
      outerRadius,
      startAngle
    );
    const endOuter = polar(
      outerRadius,
      endAngle
    );
    const endInner = polar(
      innerRadius,
      endAngle
    );
    const startInner = polar(
      innerRadius,
      startAngle
    );

    const largeArc =
      endAngle - startAngle > 180
        ? 1
        : 0;

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
      "Z",
    ].join(" ");
  };

  let runningAngle = 0;

  return (
    <div
      className={`jackpot-wheel-modern ${
        hasEntries ? "has-entries" : "empty"
      }`}
    >
      <div className="jackpot-wheel-modern-glow"></div>

      <svg
        className="jackpot-wheel-modern-svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Weighted jackpot wheel"
      >
        <defs>
          {colors.map((color, index) => (
            <linearGradient
              key={`segment-gradient-${index}`}
              id={`jackpot-segment-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="28%" stopColor={color} />
              <stop offset="100%" stopColor="#080b12" stopOpacity="0.74" />
            </linearGradient>
          ))}
          <radialGradient id="jackpotWheelHub" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#8d61c8" />
            <stop offset="42%" stopColor="#3d2858" />
            <stop offset="74%" stopColor="#1b1926" />
            <stop offset="100%" stopColor="#0d0f15" />
          </radialGradient>
          <radialGradient id="jackpotWheelEmpty" cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#27223a" />
            <stop offset="58%" stopColor="#131620" />
            <stop offset="100%" stopColor="#090c12" />
          </radialGradient>
          <filter id="jackpotWheelShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.42" />
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={outerRadius + 10}
          fill="none"
          stroke="rgba(213,184,255,.28)"
          strokeWidth="2"
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius + 17}
          fill="none"
          stroke="rgba(138,92,214,.16)"
          strokeWidth="7"
          strokeDasharray="2 11"
        />

        {!hasEntries ? (
          <>
            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              fill="url(#jackpotWheelEmpty)"
              stroke="#6c4aa1"
              strokeWidth="3"
            />
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="#0c0f16"
              stroke="rgba(176,132,255,.35)"
              strokeWidth="2"
            />
          </>
        ) : (
          visiblePlayers.map(
            (player, index) => {
              const sweep =
                Math.max(0, player.odds) * 3.6;
              const startAngle =
                runningAngle;
              const endAngle =
                runningAngle + sweep;

              runningAngle = endAngle;

              const midAngle =
                startAngle + sweep / 2;

              const labelPoint =
                polar(172, midAngle);

              const avatarPoint =
                polar(198, midAngle);

              const fill =
                colors[index % colors.length];

              const initials =
                player.isOthers
                  ? "…"
                  : String(
                      player.username ||
                        "P"
                    )
                      .slice(0, 1)
                      .toUpperCase();

              const showText =
                sweep >= 32 &&
                !player.isOthers;

              return (
                <g
                  key={`wheel-segment-${player.userId}`}
                >
                  <path
                    d={arcPath(
                      startAngle,
                      endAngle
                    )}
                    fill={`url(#jackpot-segment-${index % colors.length})`}
                    fillOpacity={
                      player.isOthers
                        ? 0.68
                        : 0.96
                    }
                    stroke="#0a0d14"
                    strokeWidth="4"
                    filter="url(#jackpotWheelShadow)"
                  />

                  <path
                    d={arcPath(
                      startAngle + 0.4,
                      Math.max(
                        startAngle + 0.6,
                        endAngle - 0.4
                      )
                    )}
                    fill="none"
                    stroke="rgba(255,255,255,.10)"
                    strokeWidth="1"
                  />

                  <circle
                    cx={avatarPoint.x}
                    cy={avatarPoint.y}
                    r={sweep >= 28 ? 20 : 16}
                    fill="#0a0d14"
                    fillOpacity="0.88"
                    stroke="#f1e8ff"
                    strokeOpacity="0.82"
                    strokeWidth="2.5"
                  />

                  <text
                    x={avatarPoint.x}
                    y={avatarPoint.y + 5}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={sweep >= 28 ? 14 : 11}
                    fontWeight="950"
                  >
                    {initials}
                  </text>

                  {showText && (
                    <g>
                      <text
                        x={labelPoint.x}
                        y={labelPoint.y - 3}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                        fontWeight="900"
                      >
                        {String(
                          player.username || ""
                        ).slice(0, 11)}
                      </text>

                      <text
                        x={labelPoint.x}
                        y={labelPoint.y + 11}
                        textAnchor="middle"
                        fill="#b7f5bc"
                        fontSize="8"
                        fontWeight="900"
                      >
                        {Number(
                          player.odds || 0
                        ).toFixed(2)}
                        %
                      </text>
                    </g>
                  )}
                </g>
              );
            }
          )
        )}

        <circle
          cx={center}
          cy={center}
          r={innerRadius - 8}
          fill="#0b0e15"
          stroke="#9d6cff"
          strokeWidth="4"
        />

        <circle
          cx={center}
          cy={center}
          r={innerRadius - 20}
          fill="url(#jackpotWheelHub)"
          stroke="rgba(232,211,255,.42)"
          strokeWidth="1.5"
        />

        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          fill="#f7f2ff"
          fontSize="19"
          fontWeight="950"
        >
          {hasEntries
            ? `$${(
                numericTotal / 100
              ).toFixed(2)}`
            : "EMPTY"}
        </text>

        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          fill="#9891a5"
          fontSize="8"
          fontWeight="900"
          letterSpacing="1.4"
        >
          {hasEntries
            ? "TOTAL JACKPOT"
            : "WAITING FOR ENTRIES"}
        </text>
      </svg>


      <style>{`
        /* GAME SIDEBAR — full navigation and matching homepage proportions */
        .casex-d4-game-sidebar{
          width:236px !important;
          left:0 !important;
          top:74px !important;
          bottom:0 !important;
          padding:18px 14px 16px !important;
          box-sizing:border-box !important;
          overflow-y:auto !important;
          overflow-x:hidden !important;
          display:flex !important;
          flex-direction:column !important;
        }

        .casex-d4-game-sidebar.is-collapsed{
          width:72px !important;
          padding-left:10px !important;
          padding-right:10px !important;
        }

        .casex-d4-game-sidebar-head{
          min-height:48px !important;
          padding:6px 8px 18px !important;
        }

        .casex-d4-game-sidebar-label{
          margin:10px 8px 7px !important;
          color:#636676 !important;
          font-size:8px !important;
          font-weight:950 !important;
          letter-spacing:.18em !important;
        }

        .casex-d4-game-sidebar-promo{
          margin:12px 3px 12px !important;
          padding:12px 10px !important;
          border:1px solid rgba(124,102,167,.2) !important;
          border-radius:11px !important;
          background:linear-gradient(145deg,rgba(36,24,61,.75),rgba(14,13,20,.8)) !important;
          display:flex !important;
          align-items:flex-start !important;
          gap:9px !important;
        }

        .casex-d4-game-promo-icon{
          width:27px !important;
          height:27px !important;
          flex:0 0 27px !important;
          border-radius:8px !important;
          display:grid !important;
          place-items:center !important;
          background:rgba(128,74,225,.18) !important;
          color:#b98cff !important;
          font-size:14px !important;
        }

        .casex-d4-game-sidebar-promo strong{
          display:block !important;
          color:#c39dff !important;
          font-size:7px !important;
          letter-spacing:.13em !important;
        }

        .casex-d4-game-sidebar-promo small{
          display:block !important;
          margin-top:4px !important;
          color:#757888 !important;
          font-size:7px !important;
          line-height:1.4 !important;
        }

        /* The game content starts after the full sidebar instead of sitting under it. */
        .casex-d4-original-game-stage.sidebar-open .original-games-overlay{
          left:236px !important;
          right:0 !important;
          width:auto !important;
        }

        .casex-d4-original-game-stage.sidebar-open .original-games-game-tabs{
          left:256px !important;
        }

        .casex-d4-original-game-stage.sidebar-collapsed .original-games-overlay{
          left:72px !important;
          right:0 !important;
          width:auto !important;
        }

        .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
          left:92px !important;
        }

        @media(max-width:700px){
          .casex-d4-game-sidebar{
            top:68px !important;
            width:184px !important;
          }

          .casex-d4-game-sidebar.is-collapsed{
            width:64px !important;
          }

          .casex-d4-original-game-stage.sidebar-open .original-games-overlay{
            left:184px !important;
          }

          .casex-d4-original-game-stage.sidebar-open .original-games-game-tabs{
            left:204px !important;
          }

          .casex-d4-original-game-stage.sidebar-collapsed .original-games-overlay{
            left:64px !important;
          }

          .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
            left:84px !important;
          }
        }

        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-sidebar-promo{
          width:42px !important;
          margin-left:auto !important;
          margin-right:auto !important;
          padding:6px !important;
          justify-content:center !important;
        }

        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-sidebar-promo > div{
          display:none !important;
        }
      `}</style>
    </div>
  );
}


function ColorDicingGame({ authUser, balance, openAuth, onBalanceChange }) {
  const colors = [
    { id: "red", name: "Red", hex: "#ef4444" },
    { id: "orange", name: "Orange", hex: "#f97316" },
    { id: "yellow", name: "Yellow", hex: "#eab308" },
    { id: "green", name: "Green", hex: "#22c55e" },
    { id: "blue", name: "Blue", hex: "#3b82f6" },
    { id: "purple", name: "Purple", hex: "#a855f7" },
  ];

  const [selectedColor, setSelectedColor] = useState("red");
  const [betAmount, setBetAmount] = useState("10.00");
  const [dice, setDice] = useState([
    "red",
    "blue",
    "green",
    "purple",
  ]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [recentBets, setRecentBets] = useState([]);
  const [viewingBet, setViewingBet] = useState(null);
  const rollTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const soundIntervalRef = useRef(null);

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  };

  // Pleasant dice-roll sound: short rounded impacts with a soft table body.
  // Avoids sustained noise, which can sound like cans or a shaker.
  const playDiceImpact = (intensity = 1, pitch = 1) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low, rounded body of the die hitting a table.
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = "sine";
    body.frequency.setValueAtTime(185 * pitch, now);
    body.frequency.exponentialRampToValueAtTime(88 * pitch, now + 0.075);
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.115 * intensity, now + 0.003);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    body.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    body.start(now);
    body.stop(now + 0.095);

    // Tiny, heavily filtered click = the hard edge of a die collision.
    const length = Math.floor(ctx.sampleRate * 0.026);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const envelope = Math.pow(1 - i / length, 8);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const clickGain = ctx.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400 * pitch, now);
    filter.Q.value = 1.8;
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(0.055 * intensity, now + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);
    source.connect(filter);
    filter.connect(clickGain);
    clickGain.connect(ctx.destination);
    source.start(now);
  };

  const playDiceTick = (pitch = 1) => {
    // A real-looking tumble has irregular collisions rather than one continuous rattle.
    playDiceImpact(0.46, pitch * (0.94 + Math.random() * 0.08));
    window.setTimeout(() => {
      playDiceImpact(0.31, pitch * (0.9 + Math.random() * 0.18));
    }, 27 + Math.random() * 20);
    if (Math.random() > 0.5) {
      window.setTimeout(() => {
        playDiceImpact(0.22, pitch * (0.92 + Math.random() * 0.14));
      }, 58 + Math.random() * 24);
    }
  };

  const playDiceLand = (matches = 0) => {
    // Four dice settle naturally, with each impact slightly different.
    [0, 34, 69, 103].forEach((delay, index) => {
      window.setTimeout(() => {
        playDiceImpact(0.52 + index * 0.07, 0.9 + Math.random() * 0.16);
      }, delay);
    });

    // Soft musical resolution for a win, kept deliberately subtle.
    if (matches === 1 || matches >= 4) {
      window.setTimeout(() => {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = matches >= 4 ? [392, 494, 587] : [330, 415];
        notes.forEach((frequency, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = index * 0.055;
          osc.type = "sine";
          osc.frequency.setValueAtTime(frequency, now + delay);
          gain.gain.setValueAtTime(0.0001, now + delay);
          gain.gain.exponentialRampToValueAtTime(matches >= 4 ? 0.022 : 0.016, now + delay + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.16);
        });
      }, 145);
    }
  };

  const colorById = (id) =>
    colors.find((color) => color.id === id) || colors[0];

  const formatMoney = (cents) =>
    `$${(Number(cents || 0) / 100).toFixed(2)}`;

  const resultFromGame = (game) => {
    const matches = Number(game?.matches ?? 0);
    const profitCents = Number(game?.profitCents || 0);
    const payoutCents = Number(game?.payoutCents || 0);

    if (matches === 0) {
      return {
        type: "loss",
        matches,
        title: "You lose",
        message: "No dice matched your selected color. Your locked bet was lost.",
      };
    }

    if (matches === 1) {
      return {
        type: "win",
        matches,
        multiplier: 1,
        title: "You win ×1",
        message: `+$${(profitCents / 100).toFixed(2)} profit · ${formatMoney(payoutCents)} returned.`,
      };
    }

    if (matches === 2 || matches === 3) {
      return {
        type: "reroll",
        matches,
        title: "Reroll",
        message: `${matches} dice matched. Your bet remains locked — reroll for free.`,
      };
    }

    return {
      type: "win",
      matches,
      multiplier: 3,
      title: "You win ×3",
      message: `+$${(profitCents / 100).toFixed(2)} profit · ${formatMoney(payoutCents)} returned.`,
    };
  };

  const animateToServerDice = async (serverPromise) => {
    let settled = false;
    let serverResponse = null;
    let serverError = null;

    serverPromise
      .then((response) => {
        serverResponse = response;
        settled = true;
      })
      .catch((error) => {
        serverError = error;
        settled = true;
      });

    let ticks = 0;

    if (soundIntervalRef.current) {
      window.clearInterval(soundIntervalRef.current);
    }
    soundIntervalRef.current = window.setInterval(() => {
      playDiceTick(0.92 + Math.random() * 0.28);
    }, 105);

    while (ticks < 15 || !settled) {
      setDice(
        Array.from(
          { length: 4 },
          () => colors[Math.floor(Math.random() * colors.length)].id
        )
      );

      ticks += 1;

      await new Promise((resolve) => {
        rollTimerRef.current = window.setTimeout(
          resolve,
          58 + Math.min(ticks, 15) * 10
        );
      });
    }

    if (soundIntervalRef.current) {
      window.clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }

    if (serverError) {
      throw serverError;
    }

    return serverResponse;
  };

  const rememberCompletedBet = (game) => {
    if (!game || !["won", "lost"].includes(String(game.status))) {
      return;
    }

    const betCents = Number(game.betCents || 0);
    const payoutCents = Number(game.payoutCents || 0);
    const multiplier =
      betCents > 0
        ? payoutCents / betCents
        : 0;

    const entry = {
      gameId: Number(game.gameId || 0),
      betCents,
      payoutCents,
      profitCents: Number(game.profitCents || 0),
      multiplier,
      matches: Number(game.matches || 0),
      status: String(game.status),
      selectedColor: String(game.selectedColor || selectedColor),
      dice: Array.isArray(game.dice) ? [...game.dice] : [],
      rollNumber: Number(game.rollNumber || 1),
      createdAt: game.createdAt || new Date().toISOString(),
      completedAt: game.completedAt || new Date().toISOString(),
    };

    setRecentBets((current) => [
      entry,
      ...current.filter(
        (bet) => Number(bet.gameId) !== Number(entry.gameId)
      ),
    ].slice(0, 20));
  };

  const applyGameResponse = (data) => {
    const game = data?.game;

    if (!game) {
      throw new Error("COLOR_DICING_GAME_MISSING");
    }

    rememberCompletedBet(game);

    if (Array.isArray(game.dice) && game.dice.length === 4) {
      setDice(game.dice);
    }

    setSelectedColor(game.selectedColor);
    setBetAmount((Number(game.betCents) / 100).toFixed(2));

    if (Number.isFinite(Number(data?.newBalanceCents))) {
      onBalanceChange?.(Number(data.newBalanceCents) / 100);
    }

    const nextResult = resultFromGame(game);
    setResult(nextResult);
    playDiceLand(Number(game.matches || 0));

    if (game.status === "active") {
      setGameId(Number(game.gameId));
      setGameStatus("active");
    } else {
      setGameId(null);
      setGameStatus(game.status);
    }

    return game;
  };

  useEffect(() => {
    let cancelled = false;

    const loadActiveGame = async () => {
      if (!authUser) {
        setLoadingGame(false);
        setGameId(null);
        setGameStatus(null);
        return;
      }

      setLoadingGame(true);
      setErrorMessage("");

      try {
        const response = await apiFetch(`${API}/api/color-dicing/active`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 401) return;
          throw new Error(data?.error || "COLOR_DICING_ACTIVE_GAME_FAILED");
        }

        if (cancelled) return;

        if (Number.isFinite(Number(data?.balanceCents))) {
          onBalanceChange?.(Number(data.balanceCents) / 100);
        }

        if (data?.game) {
          const game = data.game;
          setSelectedColor(game.selectedColor);
          setBetAmount((Number(game.betCents) / 100).toFixed(2));
          setDice(Array.isArray(game.dice) ? game.dice : []);
          setGameId(Number(game.gameId));
          setGameStatus("active");
          setResult(resultFromGame(game));
        } else {
          setGameId(null);
          setGameStatus(null);
          setResult(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Color Dicing active-game load failed:", error);
          setErrorMessage("Unable to load your active game. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingGame(false);
      }
    };

    loadActiveGame();

    return () => {
      cancelled = true;
      if (rollTimerRef.current) {
        window.clearTimeout(rollTimerRef.current);
      }
      if (soundIntervalRef.current) {
        window.clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    };
  }, [authUser?.id]);

  const submitRoll = async (isReroll = false) => {
    if (rolling || loadingGame) return;

    if (!authUser) {
      openAuth("login");
      return;
    }

    if (isReroll && !gameId) {
      setErrorMessage("There is no active game to reroll.");
      return;
    }

    const numericBet = Number(betAmount);

    if (
      !isReroll &&
      (!Number.isFinite(numericBet) || numericBet < 0.10 || numericBet > 100)
    ) {
      setResult({
        type: "error",
        title: "Invalid bet",
        message: "Bet must be between $0.10 and $100.00.",
      });
      return;
    }

    setRolling(true);
    setErrorMessage("");

    try {
      const serverPromise = apiFetch(
        `${API}/api/color-dicing/${isReroll ? "reroll" : "roll"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isReroll
              ? { gameId, selectedColor }
              : {
                  selectedColor,
                  betAmount: numericBet.toFixed(2),
                }
          ),
        }
      ).then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const error = new Error(
            data?.error || "COLOR_DICING_ROLL_FAILED"
          );
          error.status = response.status;
          throw error;
        }

        return data;
      });

      const data = await animateToServerDice(serverPromise);
      applyGameResponse(data);
    } catch (error) {
      console.error("Color Dicing roll failed:", error);

      if (error?.status === 401) {
        openAuth("login");
      } else if (error?.message === "INSUFFICIENT_BALANCE") {
        setErrorMessage("You don't have enough balance for this bet.");
      } else if (error?.message === "ACTIVE_GAME_EXISTS") {
        setErrorMessage("You already have an active Color Dicing game.");
      } else if (error?.message === "GAME_NOT_FOUND") {
        setErrorMessage("That game is no longer active. Refreshing your game state...");
      } else {
        setErrorMessage("The roll could not be completed. Please try again.");
      }
    } finally {
      setRolling(false);
    }
  };

  const submitDemoRoll = async () => {
    if (rolling || loadingGame) return;

    setRolling(true);
    setErrorMessage("");
    setResult(null);

    try {
      const demoDice = Array.from(
        { length: 4 },
        () => colors[Math.floor(Math.random() * colors.length)].id
      );

      const demoMatches = demoDice.filter(
        (colorId) => colorId === selectedColor
      ).length;

      // Reuse the existing rolling animation, but keep the demo entirely
      // client-side. No wallet, game, transaction, or admin record is touched.
      const data = await animateToServerDice(
        new Promise((resolve) => {
          window.setTimeout(() => {
            resolve({
              game: {
                dice: demoDice,
                selectedColor,
                matches: demoMatches,
                status: demoMatches === 2 || demoMatches === 3 ? "active" : demoMatches === 0 ? "lost" : "won",
                betCents: Math.round(Math.max(0, Number(betAmount) || 0) * 100),
                payoutCents:
                  demoMatches === 1
                    ? Math.round(Math.max(0, Number(betAmount) || 0) * 100 * 2)
                    : demoMatches >= 4
                      ? Math.round(Math.max(0, Number(betAmount) || 0) * 100 * 4)
                      : 0,
                profitCents:
                  demoMatches === 1
                    ? Math.round(Math.max(0, Number(betAmount) || 0) * 100)
                    : demoMatches >= 4
                      ? Math.round(Math.max(0, Number(betAmount) || 0) * 100 * 3)
                      : 0,
              },
            });
          }, 260);
        })
      );

      const game = data?.game;

      if (!game) {
        throw new Error("DEMO_ROLL_FAILED");
      }

      setDice(game.dice);
      setSelectedColor(game.selectedColor);
      const demoProfit = Number(game.profitCents || 0);
      let demoResult;

      if (demoMatches === 0) {
        demoResult = {
          type: "loss",
          matches: 0,
          title: "Demo: You lose",
          message: "No dice matched your selected color. No real bet was placed.",
        };
      } else if (demoMatches === 1) {
        demoResult = {
          type: "win",
          matches: 1,
          multiplier: 1,
          title: "Demo: You win ×1",
          message: `A 1-match result would return ${formatMoney(game.payoutCents)} on a ${formatMoney(game.betCents)} bet. No real balance changed.`,
        };
      } else if (demoMatches === 2 || demoMatches === 3) {
        demoResult = {
          type: "reroll",
          matches: demoMatches,
          title: "Demo: Reroll",
          message: `${demoMatches} dice matched. In a real game, your bet would stay locked for a free reroll.`,
        };
      } else {
        demoResult = {
          type: "win",
          matches: 4,
          multiplier: 3,
          title: "Demo: You win ×3",
          message: `A 4-match result would return ${formatMoney(game.payoutCents)} on a ${formatMoney(game.betCents)} bet. No real balance changed.`,
        };
      }

      setResult({
        ...demoResult,
        demo: true,
        demoProfit,
      });
      playDiceLand(Number(game.matches || 0));
    } catch (error) {
      console.error("Color Dicing demo roll failed:", error);
      setErrorMessage("The demo roll could not be completed. Please try again.");
    } finally {
      setRolling(false);
    }
  };

  const rollDice = () => submitRoll(false);
  const rerollDice = () => submitRoll(true);

  const selected = colorById(selectedColor);
  const numericBet = Number(betAmount);
  const potentialOneMatch =
    Number.isFinite(numericBet) && numericBet > 0 ? numericBet * 2 : 0;
  const potentialFourMatch =
    Number.isFinite(numericBet) && numericBet > 0 ? numericBet * 4 : 0;
  const betLocked = gameStatus === "active";
  const actionIsReroll = betLocked && result?.type === "reroll";

  return (
    <section className="color-dicing-page">
      <div className="color-dicing-shell">
        <div className="color-dicing-header">
          <div>
            <div className="eyebrow">CASEX ORIGINAL</div>
            <h1>Color Dicing</h1>
            <p>
              Pick a color and roll four dice. Match your color to win.
            </p>
          </div>

          <div className="color-dicing-live">
            <span></span>
            LIVE
          </div>
        </div>

        <div className="color-dicing-layout">
          <div className="color-dicing-board">
            <div className="color-dicing-board-top">
              <div>
                <span className="color-dicing-label">YOUR COLOR</span>
                <strong style={{ color: selected.hex }}>
                  {selected.name}
                </strong>
              </div>

              <div className="color-dicing-bet-display">
                <span>{betLocked ? "BET LOCKED" : "BET"}</span>
                <strong>
                  ${Number.isFinite(numericBet) ? numericBet.toFixed(2) : "0.00"}
                </strong>
              </div>
            </div>

            <div className={`color-dice-row ${rolling ? "rolling" : ""} ${result?.type === "win" && !rolling ? "landed-win" : ""} ${result?.type === "loss" && !rolling ? "landed-loss" : ""}`}>
              {dice.map((colorId, index) => {
                const color = colorById(colorId);

                return (
                  <div
                    key={index}
                    className="color-die"
                    style={{
                      "--die-color": color.hex,
                    }}
                  >
                    <div className="color-die-face">
                      <span className="color-die-dot"></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="color-dicing-match">
              {result?.matches != null ? (
                <>
                  <span>MATCHES</span>
                  <strong>{result.matches}/4</strong>
                </>
              ) : (
                <>
                  <span>SELECT A COLOR</span>
                  <strong>ROLL 4 DICE</strong>
                </>
              )}
            </div>

            {result && (
              <div className={`color-dicing-result ${result.type}`}>
                {result.demo && <span className="color-dicing-demo-badge">DEMO RESULT</span>}
                <strong>{result.title}</strong>
                <span>{result.message}</span>
              </div>
            )}

            {errorMessage && (
              <div className="color-dicing-result error">
                <strong>Something went wrong</strong>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="color-dicing-actions">
              <button
                type="button"
                className="color-dicing-roll"
                onClick={actionIsReroll ? rerollDice : rollDice}
                disabled={rolling || loadingGame || (betLocked && !actionIsReroll)}
              >
                {rolling
                  ? "ROLLING..."
                  : loadingGame
                  ? "LOADING..."
                  : actionIsReroll
                  ? "REROLL DICE"
                  : "ROLL DICE"}
              </button>

              <button
                type="button"
                className="color-dicing-demo-roll"
                onClick={submitDemoRoll}
                disabled={rolling || loadingGame}
              >
                {rolling ? "DEMO ROLL..." : "DEMO ROLL"}
              </button>
            </div>

            {betLocked && (
              <div className="color-dicing-demo-note">
                🔒 Your {formatMoney(Number(betAmount) * 100)} bet is locked.
                Rerolls are free and do not change the wager.
              </div>
            )}
          </div>

          <aside className="color-dicing-sidebar">
            <div className="color-dicing-card">
              <div className="eyebrow">CHOOSE YOUR COLOR</div>

              <div className="color-dicing-colors">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={`color-dicing-color ${
                      selectedColor === color.id ? "active" : ""
                    }`}
                    onClick={() => {
                      if (!rolling && (!betLocked || actionIsReroll)) {
                        setSelectedColor(color.id);

                        // Keep the reroll state active while changing color.
                        // Only clear the result when starting a fresh game.
                        if (!betLocked) {
                          setResult(null);
                        }

                        setErrorMessage("");
                      }
                    }}
                    disabled={
                      rolling ||
                      loadingGame ||
                      (betLocked && !actionIsReroll)
                    }
                  >
                    <span
                      className="color-dicing-color-dot"
                      style={{ background: color.hex }}
                    ></span>
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="color-dicing-card">
              <div className="eyebrow">BET AMOUNT</div>

              <div className="color-dicing-bet-main-row">
                <div className="color-dicing-input-wrap">
                  <span>$</span>
                  <input
                    type="number"
                    min="0.10"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    value={betAmount}
                    onChange={(event) => {
                      if (betLocked) return;
                      setBetAmount(event.target.value);
                      setResult(null);
                      setErrorMessage("");
                    }}
                    disabled={rolling || loadingGame || betLocked}
                  />
                </div>

                <div className="color-dicing-bet-shortcuts">
                  <button
                    type="button"
                    disabled={rolling || loadingGame || betLocked}
                    onClick={() => {
                      const cents = Math.round(Number(betAmount) * 100);
                      if (Number.isFinite(cents) && cents > 0) {
                        const next = Math.max(10, Math.floor(cents / 2));
                        setBetAmount((next / 100).toFixed(2));
                        setResult(null);
                        setErrorMessage("");
                      }
                    }}
                  >
                    1/2
                  </button>

                  <button
                    type="button"
                    disabled={rolling || loadingGame || betLocked}
                    onClick={() => {
                      const cents = Math.round(Number(betAmount) * 100);
                      if (Number.isFinite(cents) && cents > 0) {
                        const next = Math.min(10000, cents * 2);
                        setBetAmount((next / 100).toFixed(2));
                        setResult(null);
                        setErrorMessage("");
                      }
                    }}
                  >
                    2X
                  </button>

                  <button
                    type="button"
                    disabled={rolling || loadingGame || betLocked}
                    onClick={() => {
                      const balanceCents = Math.max(
                        0,
                        Math.floor(Number(balance || 0) * 100)
                      );
                      const maxCents = Math.min(10000, balanceCents);

                      if (maxCents >= 10) {
                        setBetAmount((maxCents / 100).toFixed(2));
                        setResult(null);
                        setErrorMessage("");
                      }
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

            <div className="color-dicing-card">
              <div className="eyebrow">PAYOUT RULES</div>

              <div className="color-dicing-rules">
                <div>
                  <span>0 matching</span>
                  <strong className="loss">LOSE</strong>
                </div>
                <div>
                  <span>1 matching</span>
                  <strong>×1 PROFIT</strong>
                </div>
                <div>
                  <span>2 matching</span>
                  <strong className="reroll">REROLL</strong>
                </div>
                <div>
                  <span>3 matching</span>
                  <strong className="reroll">REROLL</strong>
                </div>
                <div>
                  <span>4 matching</span>
                  <strong className="win">×3 PROFIT</strong>
                </div>
              </div>

              <div className="color-dicing-example">
                <span>Example with your current bet</span>
                <div>
                  <strong>1 match → +${numericBet.toFixed(2)} profit</strong>
                  <strong>4 matches → +${(numericBet * 3).toFixed(2)} profit</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section className="casex-color-dicing-my-bets" aria-label="Color Dicing bet history">
        <div className="casex-color-dicing-my-bets-head">
          <div className="casex-color-dicing-my-bets-tab active">My Bets</div>
          <span>YOUR COLOR DICING</span>
        </div>

        <div className="casex-color-dicing-my-bets-table-wrap">
          {recentBets.length ? (
            <div className="casex-color-dicing-my-bets-table">
              <div className="casex-color-dicing-my-bets-row casex-color-dicing-my-bets-head-row">
                <span>GAME</span>
                <span>BET AMOUNT</span>
                <span>MULTIPLIER</span>
                <span>PAYOUT</span>
                <span>RESULT</span>
              </div>

              {recentBets.map((betEntry) => (
                <div
                  className="casex-color-dicing-my-bets-row"
                  key={`${betEntry.gameId}-${betEntry.completedAt}`}
                >
                  <span className="casex-color-dicing-my-bets-game">
                    <b>🎲</b>
                    Color Dicing
                  </span>

                  <span>
                    ${(Number(betEntry.betCents || 0) / 100).toFixed(2)}
                  </span>

                  <span
                    className={`casex-color-dicing-my-bets-multiplier ${
                      Number(betEntry.payoutCents || 0) > 0 ? "win" : "loss"
                    }`}
                  >
                    {Number(betEntry.multiplier || 0).toFixed(2)}×
                  </span>

                  <span
                    className={`casex-color-dicing-my-bets-payout ${
                      Number(betEntry.payoutCents || 0) > 0 ? "win" : ""
                    }`}
                  >
                    ${(Number(betEntry.payoutCents || 0) / 100).toFixed(2)}
                  </span>

                  <span>
                    <button
                      type="button"
                      className="casex-color-dicing-view-result"
                      onClick={() => setViewingBet(betEntry)}
                    >
                      View Result
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="casex-color-dicing-my-bets-empty">
              Your completed Color Dicing bets will appear here.
            </div>
          )}
        </div>
      </section>

      {viewingBet && (
        <div
          className="casex-color-dicing-result-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Color Dicing bet result"
          onClick={() => setViewingBet(null)}
        >
          <div
            className="casex-color-dicing-result-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="casex-color-dicing-result-modal-head">
              <div>
                <div className="eyebrow">BET RESULT</div>
                <h2>
                  {viewingBet.status === "won" ? "Color Match" : "No Match"}
                </h2>
              </div>

              <button
                type="button"
                className="casex-color-dicing-result-modal-close"
                onClick={() => setViewingBet(null)}
                aria-label="Close result"
              >
                ×
              </button>
            </div>

            <div className="casex-color-dicing-result-meta">
              <div>
                <span>Selected Color</span>
                <strong>{colorById(viewingBet.selectedColor).name}</strong>
              </div>
              <div>
                <span>Matches</span>
                <strong>{viewingBet.matches}/4</strong>
              </div>
              <div>
                <span>Bet</span>
                <strong>${(Number(viewingBet.betCents || 0) / 100).toFixed(2)}</strong>
              </div>
              <div>
                <span>Payout</span>
                <strong className={Number(viewingBet.payoutCents || 0) > 0 ? "win" : "loss"}>
                  ${(Number(viewingBet.payoutCents || 0) / 100).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="casex-color-dicing-result-dice">
              {Array.isArray(viewingBet.dice) && viewingBet.dice.length
                ? viewingBet.dice.map((colorId, index) => {
                    const dieColor = colorById(colorId);
                    return (
                      <div
                        key={`${colorId}-${index}`}
                        className="casex-color-dicing-result-die"
                        style={{ "--result-die-color": dieColor.hex }}
                      >
                        <span></span>
                        <small>{dieColor.name}</small>
                      </div>
                    );
                  })
                : null}
            </div>

            <div
              className={`casex-color-dicing-result-status ${
                Number(viewingBet.payoutCents || 0) > 0 ? "win" : "loss"
              }`}
            >
              <strong>
                {Number(viewingBet.payoutCents || 0) > 0 ? "WON" : "LOST"}
              </strong>
              <span>
                {Number(viewingBet.payoutCents || 0) > 0
                  ? `${Number(viewingBet.multiplier || 0).toFixed(2)}× payout`
                  : "No payout"}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



function getCasexStoredCase(caseId) {
  if (
    typeof window === "undefined" ||
    !caseId ||
    !window.sessionStorage
  ) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(
      `CaseX_case_snapshot_${String(caseId)}`
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      Number(parsed.id) !== Number(caseId)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveCasexCaseSnapshot(caseData) {
  if (
    typeof window === "undefined" ||
    !window.sessionStorage ||
    !caseData?.id
  ) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      `CaseX_case_snapshot_${String(caseData.id)}`,
      JSON.stringify(caseData)
    );
  } catch {
    // Ignore unavailable/full session storage.
  }
}

function getCasexRouteState() {
  if (typeof window === "undefined") {
    return {
      page: "home",
      game: null,
      tab: "marketplace",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const page = String(params.get("page") || "home").toLowerCase();
  const game = params.get("game") || null;
  const requestedTab = String(params.get("tab") || "marketplace").toLowerCase();
  const caseId = params.get("case") || null;
  const allowedTabs = new Set([
    "marketplace",
    "cases",
    "inventory",
    "deposit",
    "withdraw",
    "home",
  ]);

  return {
    page,
    game,
    caseId,
    tab: allowedTabs.has(requestedTab) ? requestedTab : "marketplace",
  };
}

function App() {
  useScrollReveal();

  // Restore the active CASEX surface from the URL before React renders.
  // This makes refreshes keep the user on the page they were viewing.
  const initialRoute = getCasexRouteState();

  const [balance, setBalance] = useState(100);

  const [authUser, setAuthUser] = useState(null);
  const [cases, setCases] = useState(fallbackCases);
  const [inventory, setInventory] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [liveActivity, setLiveActivity] = useState([]);
  const [liveActivityLoading, setLiveActivityLoading] = useState(true);
  const [homeTrendingItems, setHomeTrendingItems] = useState([]);
  const [homeTrendingLoading, setHomeTrendingLoading] = useState(true);

  const [jackpotData, setJackpotData] = useState(null);
  const [jackpotLoading, setJackpotLoading] = useState(true);
  const [jackpotNow, setJackpotNow] = useState(Date.now());
  const [jackpotEntryOpen, setJackpotEntryOpen] = useState(false);
  const [jackpotEntryMode, setJackpotEntryMode] = useState("balance");
  const [jackpotAmount, setJackpotAmount] = useState("");
  const [jackpotEntryLoading, setJackpotEntryLoading] = useState(false);
  const [jackpotEntryError, setJackpotEntryError] = useState("");
  const [jackpotSelectedInventoryIds, setJackpotSelectedInventoryIds] = useState(
    () => new Set()
  );

  const jackpotPotCents = Number(jackpotData?.round?.totalCents || 0);
  const jackpotPlayers = Array.isArray(jackpotData?.players)
    ? jackpotData.players
    : [];
  const jackpotMyPlayer = jackpotPlayers.find(
    (player) => Number(player.userId) === Number(authUser?.id)
  );
  const jackpotMyContributionCents = Number(
    jackpotMyPlayer?.contributionCents || 0
  );
  const jackpotMyOdds = Number(jackpotMyPlayer?.odds || 0);

  const jackpotTimeLeft = useMemo(() => {
    const end = new Date(
      jackpotData?.round?.endsAt || 0
    ).getTime();

    let total = Math.max(
      0,
      Math.floor((end - jackpotNow) / 1000)
    );

    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    };
  }, [jackpotData?.round?.endsAt, jackpotNow]);

  const jackpotAvailableInventory = inventory.filter(
    (item) =>
      String(item.status || "owned").toLowerCase() === "owned"
  );

  const jackpotSelectedItems = jackpotAvailableInventory.filter(
    (item) => jackpotSelectedInventoryIds.has(Number(item.id))
  );

  const jackpotSelectedValueCents = jackpotSelectedItems.reduce(
    (total, item) =>
      total + Math.max(0, Number(item.value_cents || 0)),
    0
  );

  const openJackpotEntry = (mode = "balance") => {
    if (!authUser) {
      openAuth("login");
      return;
    }

    setJackpotEntryMode(mode);
    setJackpotAmount("");
    setJackpotEntryError("");
    setJackpotSelectedInventoryIds(new Set());
    setJackpotEntryOpen(true);
  };

  const closeJackpotEntry = () => {
    if (jackpotEntryLoading) return;

    setJackpotEntryOpen(false);
    setJackpotEntryError("");
    setJackpotAmount("");
    setJackpotSelectedInventoryIds(new Set());
  };

  const toggleJackpotInventoryItem = (itemId) => {
    const numericId = Number(itemId);

    setJackpotSelectedInventoryIds((current) => {
      const next = new Set(current);

      if (next.has(numericId)) {
        next.delete(numericId);
      } else {
        next.add(numericId);
      }

      return next;
    });
  };

  const loadJackpot = async () => {
    try {
      const response = await apiFetch(`${API}/api/jackpot`);

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Jackpot server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load jackpot"
        );
      }

      setJackpotData(data);
    } catch (error) {
      console.error("Jackpot load failed:", error);
    } finally {
      setJackpotLoading(false);
    }
  };

  const enterJackpotWithBalance = async () => {
    if (!authUser || jackpotEntryLoading) return;

    const numericAmount = Number(jackpotAmount);
    const amountCents = Number.isFinite(numericAmount)
      ? Math.round(numericAmount * 100)
      : 0;

    if (!Number.isInteger(amountCents) || amountCents < 10) {
      setJackpotEntryError(
        "Minimum jackpot contribution is $0.10."
      );
      return;
    }

    if (amountCents > Math.round(Number(balance) * 100)) {
      setJackpotEntryError(
        "You do not have enough CASEX balance for this contribution."
      );
      return;
    }

    setJackpotEntryLoading(true);
    setJackpotEntryError("");

    try {
      const response = await apiFetch(
        `${API}/api/jackpot/enter/balance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amountCents }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to enter the jackpot"
        );
      }

      setBalance(
        Number(data.newBalanceCents || 0) / 100
      );

      await Promise.all([
        loadJackpot(),
        loadTransactions(),
      ]);

      closeJackpotEntry();
    } catch (error) {
      console.error("Jackpot balance entry failed:", error);
      setJackpotEntryError(error.message);
    } finally {
      setJackpotEntryLoading(false);
    }
  };

  const enterJackpotWithBrainrots = async () => {
    if (!authUser || jackpotEntryLoading) return;

    const inventoryIds = Array.from(
      jackpotSelectedInventoryIds
    );

    if (!inventoryIds.length) {
      setJackpotEntryError(
        "Select at least one Brainrot."
      );
      return;
    }

    if (jackpotSelectedValueCents < 10) {
      setJackpotEntryError(
        "The selected Brainrots must be worth at least $0.10."
      );
      return;
    }

    setJackpotEntryLoading(true);
    setJackpotEntryError("");

    try {
      const response = await apiFetch(
        `${API}/api/jackpot/enter/brainrots`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inventoryIds }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to enter the selected Brainrots"
        );
      }

      await Promise.all([
        loadJackpot(),
        loadInventory(),
      ]);

      closeJackpotEntry();
    } catch (error) {
      console.error("Jackpot Brainrot entry failed:", error);
      setJackpotEntryError(error.message);
    } finally {
      setJackpotEntryLoading(false);
    }
  };

  useEffect(() => {
    void loadJackpot();

    const refreshTimer = window.setInterval(() => {
      void loadJackpot();
    }, 5000);

    const clockTimer = window.setInterval(() => {
      setJackpotNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, []);
  const liveActivityRequestRef = useRef(false);
  const liveActivityInitializedRef = useRef(false);
  const [liveActivityEnteringId, setLiveActivityEnteringId] = useState(null);
  const caseRewardsCacheRef = useRef(new Map());
  const [transactions, setTransactions] = useState([]);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletNotification, setWalletNotification] = useState(null);
  const walletNotificationTimerRef = useRef(null);
  const walletNotificationSeenRef = useRef(new Set());
  const [walletAmount, setWalletAmount] = useState("");
  const [walletAction, setWalletAction] = useState("deposit");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletTab, setWalletTab] = useState("wallet");
  const [depositCurrency, setDepositCurrency] = useState("USDTTRC20");
  const [depositMinimums, setDepositMinimums] = useState({});
  const [depositMinimumLoading, setDepositMinimumLoading] = useState(false);
  const [withdrawCurrency, setWithdrawCurrency] = useState("USDTTRC20");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [cryptoPayment, setCryptoPayment] = useState(null);
  const [brainrotDeposit, setBrainrotDeposit] = useState(null);
  const [brainrotDepositLoading, setBrainrotDepositLoading] = useState(false);
  const [selected, setSelected] = useState(() =>
    initialRoute.page === "case"
      ? getCasexStoredCase(initialRoute.caseId)
      : null
  );
  const [caseRestorePending, setCaseRestorePending] = useState(
    () =>
      initialRoute.page === "case" &&
      !!initialRoute.caseId &&
      !getCasexStoredCase(initialRoute.caseId)
  );
  const [casesPageOpen, setCasesPageOpen] = useState(
    () => initialRoute.page === "cases"
  );
  const [colorDicingOpen, setColorDicingOpen] = useState(false);
  const [gamePortalOpen, setGamePortalOpen] = useState(
    () => initialRoute.page === "games"
  );
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [d4SidebarOpen, setD4SidebarOpen] = useState(true);
  const [d4SidebarSection, setD4SidebarSection] = useState(() => {
    if (initialRoute.page === "games") return "games";
    if (initialRoute.page === "original") return "originals";
    if (initialRoute.page === "jackpot") return "jackpot";
    if (initialRoute.page === "cases") return "cases";
    if (initialRoute.page === "dicing") return "originals";
    return "home";
  });

  // Keep the global sidebar state available to every full-screen surface,
  // including Game Portal and Original Games, even when the homepage <main>
  // is hidden.
  useEffect(() => {
    document.body.classList.toggle("casex-global-sidebar-open", d4SidebarOpen);
    document.body.classList.toggle("casex-global-sidebar-closed", !d4SidebarOpen);

    return () => {
      document.body.classList.remove("casex-global-sidebar-open");
      document.body.classList.remove("casex-global-sidebar-closed");
    };
  }, [d4SidebarOpen]);
  const [originalsMenuOpen, setOriginalsMenuOpen] = useState(false);
  const [originalGameOpen, setOriginalGameOpen] = useState(() => {
    if (initialRoute.page === "dicing") return "dicing";
    if (initialRoute.page === "original") return initialRoute.game || "towers";
    return null;
  });
  const [jackpotPageOpen, setJackpotPageOpen] = useState(
    () => initialRoute.page === "jackpot"
  );
  const [gamePortalGame, setGamePortalGame] = useState(
    () => initialRoute.game
  );
  const [gamePortalTab, setGamePortalTab] = useState(
    () => initialRoute.tab
  );
  const gamePortalReturnGameRef = useRef(null);
  const [casesSearch, setCasesSearch] = useState("");
  const [casesGameFilter, setCasesGameFilter] = useState("all");
  const [casesTagFilter, setCasesTagFilter] = useState("All");
  const [casesSort, setCasesSort] = useState("featured");
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState(null);
  const [wonInventoryId, setWonInventoryId] = useState(null);
  const [reelItems, setReelItems] = useState([]);
  const [reelWinningReward, setReelWinningReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [reelTarget, setReelTarget] = useState(null);
  const [reelAnimating, setReelAnimating] = useState(false);

  const [inventoryFilter, setInventoryFilter] = useState("All");
  const [inventorySort, setInventorySort] = useState("newest");
  const [sellConfirmItem, setSellConfirmItem] = useState(null);
  const [sellLoadingId, setSellLoadingId] = useState(null);
  const [withdrawConfirmItem, setWithdrawConfirmItem] = useState(null);
  const [withdrawLoadingId, setWithdrawLoadingId] = useState(null);
  const [withdrawResult, setWithdrawResult] = useState(null);
  const [itemWithdrawalHistory, setItemWithdrawalHistory] = useState([]);
  const [itemWithdrawalHistoryLoading, setItemWithdrawalHistoryLoading] = useState(false);
  const [withdrawalHistoryOpen, setWithdrawalHistoryOpen] = useState(false);
  const [inventorySelectMode, setInventorySelectMode] = useState(false);
  const [selectedInventoryIds, setSelectedInventoryIds] = useState(
    () => new Set()
  );
  const [bulkSellConfirm, setBulkSellConfirm] = useState(false);
  const [bulkSellLoading, setBulkSellLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountStatsOpen, setAccountStatsOpen] = useState(false);
  const [creatorDashboardOpen, setCreatorDashboardOpen] = useState(false);
  const [creatorDashboard, setCreatorDashboard] = useState(null);
  const [creatorDashboardLoading, setCreatorDashboardLoading] = useState(false);
  const [creatorDashboardError, setCreatorDashboardError] = useState("");
  const [creatorDashboardAvailable, setCreatorDashboardAvailable] = useState(false);
  const [creatorUserSort, setCreatorUserSort] = useState("volume-desc");
  const [creatorUserSortOpen, setCreatorUserSortOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("profile");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsProfile, setSettingsProfile] = useState({
    username: "",
    email: "",
    currentPassword: "",
  });
  const [settingsPassword, setSettingsPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

const [authOpen, setAuthOpen] = useState(false);
const [authMode, setAuthMode] = useState("login");
const [authLoading, setAuthLoading] = useState(false);
const [authError, setAuthError] = useState("");
const [authSuccess, setAuthSuccess] = useState("");

const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

const [resetPasswordToken, setResetPasswordToken] = useState("");

const [resetPasswordForm, setResetPasswordForm] = useState({
  password: "",
  confirmPassword: "",
});

const [authForm, setAuthForm] = useState({
  username: "",
  email: "",
  identifier: "",
  password: "",
  creatorCode: "",
});

  const reelTrackRef = useRef(null);
  const reelWindowRef = useRef(null);
  const profileRef = useRef(null);
  const gameMenuRef = useRef(null);
  const originalsMenuRef = useRef(null);

  // Case-opening sound engine. Sounds are generated with Web Audio so no
  // external audio files are required and browser autoplay rules are easier
  // to satisfy when the context is primed from the user's pointer action.
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("CaseX_sound_enabled");
      return saved === null ? true : saved !== "false";
    } catch {
      return true;
    }
  });
  const audioContextRef = useRef(null);
  const soundGainRef = useRef(null);
  const soundTimerRef = useRef(null);

  // Keep the current full-screen surface encoded in the URL so a browser
  // refresh restores the same place instead of returning to the homepage.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let page = "home";
    let game = null;
    let tab = null;

    if (selected?.id) {
      page = "case";
      game = gamePortalReturnGameRef.current || selected?.game_slug || initialRoute.game;
    } else if (caseRestorePending && initialRoute.page === "case") {
      // Keep the case URL intact while the case data is being restored.
      return;
    } else if (gamePortalOpen) {
      page = "games";
      game = gamePortalGame;
      tab = gamePortalTab || "marketplace";
    } else if (originalGameOpen) {
      page = originalGameOpen === "dicing" ? "dicing" : "original";
      game = originalGameOpen === "dicing" ? null : originalGameOpen;
    } else if (jackpotPageOpen) {
      page = "jackpot";
    } else if (casesPageOpen) {
      page = "cases";
    } else if (colorDicingOpen) {
      page = "dicing";
    }

    const params = new URLSearchParams();
    if (page !== "home") params.set("page", page);
    if (game) params.set("game", game);
    if (page === "case" && selected?.id) {
      params.set("case", String(selected.id));
    }
    if (tab && page === "games") params.set("tab", tab);

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [
    selected,
    caseRestorePending,
    gamePortalOpen,
    gamePortalGame,
    gamePortalTab,
    originalGameOpen,
    jackpotPageOpen,
    casesPageOpen,
    colorDicingOpen,
  ]);

  // Restore the exact case page after a browser refresh.
  //
  // A session snapshot is used immediately so the browser never renders the
  // homepage/original-games surface while the case API request is in flight.
  // The API request still runs in the background to refresh the case data.
  useEffect(() => {
    if (
      initialRoute.page !== "case" ||
      !initialRoute.caseId
    ) {
      return;
    }

    let cancelled = false;

    const restoreCase = async () => {
      try {
        const response = await apiFetch(
          `${API}/api/cases/${encodeURIComponent(initialRoute.caseId)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Failed to restore case"
          );
        }

        const rewards = Array.isArray(data.items)
          ? data.items.map((item) => ({
              ...item,
              id: Number(item.id),
              value_cents: Number(
                item.value_cents ?? item.valueCents ?? 0
              ),
              valueCents: Number(
                item.value_cents ?? item.valueCents ?? 0
              ),
              image_url:
                item.image_url ??
                item.imageUrl ??
                "",
              imageUrl:
                item.image_url ??
                item.imageUrl ??
                "",
            }))
          : [];

        const restoredCase = {
          ...(data.case || {}),
          id: Number(
            data.case?.id ?? initialRoute.caseId
          ),
          price:
            Number(data.case?.price_cents ?? 0) / 100,
          price_cents: Number(
            data.case?.price_cents ?? 0
          ),
          image_url:
            data.case?.image_url ??
            data.case?.imageUrl ??
            "",
          imageUrl:
            data.case?.image_url ??
            data.case?.imageUrl ??
            "",
          items: rewards,
        };

        if (cancelled) return;

        gamePortalReturnGameRef.current =
          initialRoute.game ||
          data.case?.game_slug ||
          "steal-a-brainrot";

        // Refresh the cached snapshot for the next refresh, but do not run
        // another page transition here. The case page is already visible.
        saveCasexCaseSnapshot(restoredCase);
        setSelected(restoredCase);
        setCasesPageOpen(false);
        setGamePortalOpen(false);
        setGamePortalGame(null);
        setGamePortalTab("marketplace");
        setCaseRestorePending(false);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Case refresh restore failed:",
          error
        );

        // If a snapshot exists, keep showing it rather than flashing the
        // homepage. Only fall back to Cases when there is nothing usable.
        const cachedCase = getCasexStoredCase(initialRoute.caseId);

        if (cachedCase) {
          gamePortalReturnGameRef.current =
            initialRoute.game ||
            cachedCase.game_slug ||
            "steal-a-brainrot";
          setSelected(cachedCase);
          setCaseRestorePending(false);
          return;
        }

        setCaseRestorePending(false);
        setSelected(null);
        setCasesPageOpen(true);
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      }
    };

    restoreCase();

    return () => {
      cancelled = true;
    };
  }, [initialRoute.page, initialRoute.caseId, initialRoute.game]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "CaseX_sound_enabled",
        String(soundEnabled),
      );
    } catch {
      // Ignore unavailable localStorage.
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!authUser) {
      setDepositMinimums({});
      setDepositMinimumLoading(false);
      return;
    }

    let cancelled = false;

    const loadDepositMinimums = async () => {
      setDepositMinimumLoading(true);

      try {
        const response = await walletFetch(
          `${API}/api/payments/nowpayments/minimums`,
          {},
          20000
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load deposit minimums."
          );
        }

        const minimumMap = {};

        for (const currency of data.currencies || []) {
          if (
            currency?.code &&
            Number.isFinite(
              Number(currency.minimumUsd)
            )
          ) {
            minimumMap[currency.code] =
              Number(currency.minimumUsd);
          }
        }

        if (!cancelled) {
          setDepositMinimums(minimumMap);

          const availableOptions =
            CRYPTO_DEPOSIT_OPTIONS
              .map((option) => ({
                ...option,
                minimumUsd:
                  minimumMap[option.code] ??
                  null,
              }))
              .filter(
                (option) =>
                  Number.isFinite(
                    option.minimumUsd
                  )
              )
              .sort(
                (a, b) =>
                  a.minimumUsd -
                  b.minimumUsd
              );

          if (availableOptions.length) {
            const currentMinimum =
              minimumMap[depositCurrency];

            const currentStillValid =
              Number.isFinite(
                currentMinimum
              );

            if (
              !currentStillValid ||
              currentMinimum > 1
            ) {
              setDepositCurrency(
                availableOptions[0].code
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Failed to load deposit minimums:",
          error
        );
      } finally {
        if (!cancelled) {
          setDepositMinimumLoading(false);
        }
      }
    };

    void loadDepositMinimums();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (!settingsOpen || !authUser) return;

    setSettingsProfile({
      username: authUser.username || "",
      email: authUser.email || "",
      currentPassword: "",
    });
    setSettingsPassword({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setSettingsError("");
    setSettingsSuccess("");
  }, [settingsOpen, authUser]);

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return null;

      const context = new AudioContextClass();
      const gain = context.createGain();
      gain.gain.value = 0.72;
      gain.connect(context.destination);

      audioContextRef.current = context;
      soundGainRef.current = gain;
    }

    return audioContextRef.current;
  };

  const primeAudio = () => {
    if (!soundEnabled) return;

    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      void context.resume();
    }

    // Tiny audible confirmation so the browser considers the audio context
    // active from the exact user interaction that starts the case.
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.055);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    oscillator.connect(gain);
    gain.connect(soundGainRef.current || context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.065);
  };

  const playTone = ({
    frequency,
    duration = 0.08,
    volume = 0.08,
    type = "sine",
    delay = 0,
    slideTo = null,
  }) => {
    if (!soundEnabled) return;

    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    if (slideTo && slideTo > 0) {
      oscillator.frequency.exponentialRampToValueAtTime(
        slideTo,
        now + duration
      );
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume),
      now + 0.008
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(soundGainRef.current || context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  };

  const playCaseOpenSound = () => {
    if (!soundEnabled) return;

    playTone({
      frequency: 180,
      duration: 0.22,
      volume: 0.13,
      type: "sawtooth",
      slideTo: 70,
    });
    playTone({
      frequency: 420,
      duration: 0.16,
      volume: 0.07,
      type: "triangle",
      delay: 0.04,
      slideTo: 210,
    });
    playTone({
      frequency: 620,
      duration: 0.18,
      volume: 0.045,
      type: "sine",
      delay: 0.1,
      slideTo: 330,
    });
  };

  const playReelTick = (progress = 0) => {
    if (!soundEnabled) return;

    const pitch = 920 - progress * 230;
    playTone({
      frequency: pitch,
      duration: 0.035,
      volume: 0.035 + progress * 0.012,
      type: "square",
    });
  };

  const playRevealSound = (rarity) => {
    if (!soundEnabled) return;

    const tier = String(rarity || "Common");

    if (tier === "Secret") {
      [
        [330, 0],
        [494, 0.09],
        [659, 0.18],
        [988, 0.29],
        [1318, 0.41],
      ].forEach(([frequency, delay]) =>
        playTone({
          frequency,
          duration: 0.22,
          volume: 0.11,
          type: "sine",
          delay,
        })
      );
      return;
    }

    if (tier === "Legendary") {
      [
        [294, 0],
        [440, 0.1],
        [587, 0.2],
        [880, 0.34],
      ].forEach(([frequency, delay]) =>
        playTone({
          frequency,
          duration: 0.24,
          volume: 0.095,
          type: "triangle",
          delay,
        })
      );
      return;
    }

    if (tier === "Epic") {
      [392, 523, 659].forEach((frequency, index) =>
        playTone({
          frequency,
          duration: 0.18,
          volume: 0.08,
          type: "triangle",
          delay: index * 0.085,
        })
      );
      return;
    }

    if (tier === "Rare") {
      [440, 554].forEach((frequency, index) =>
        playTone({
          frequency,
          duration: 0.13,
          volume: 0.065,
          type: "sine",
          delay: index * 0.085,
        })
      );
      return;
    }

    playTone({
      frequency: 360,
      duration: 0.12,
      volume: 0.06,
      type: "sine",
      slideTo: 460,
    });
  };

  const scheduleReelTick = (startedAt) => {
    if (!soundEnabled) return;

    const elapsed = Date.now() - startedAt;
    if (elapsed >= 5250) {
      soundTimerRef.current = null;
      return;
    }

    const progress = Math.min(1, elapsed / 5250);
    playReelTick(progress);

    const interval = Math.round(
      78 + Math.pow(progress, 2.15) * 330
    );

    soundTimerRef.current = window.setTimeout(
      () => scheduleReelTick(startedAt),
      interval
    );
  };

  const startReelSound = () => {
    if (!soundEnabled) return;

    stopReelSound();
    scheduleReelTick(Date.now());
  };

  const stopReelSound = () => {
    if (soundTimerRef.current) {
      window.clearTimeout(soundTimerRef.current);
      soundTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopReelSound();

      const context = audioContextRef.current;
      if (context && context.state !== "closed") {
        void context.close();
      }
    };
  }, []);

  const loadInventory = async () => {
    if (!authUser) {
      setInventory([]);
      return;
    }

    const response = await apiFetch(`${API}/api/me/inventory`);

    if (!response.ok) {
      throw new Error("Failed to load inventory");
    }

    const data = await response.json();
    setInventory(data.inventory || []);
  };

  const loadUser = async () => {
    if (!authUser) return;

    const response = await apiFetch(`${API}/api/auth/me`);

    if (!response.ok) {
      throw new Error("Failed to load account");
    }

    const data = await response.json();

    setAuthUser(data.user);

    if (data.user?.balance_cents != null) {
      setBalance(Number(data.user.balance_cents) / 100);
    }
  };

  const loadTransactions = async () => {
    if (!authUser) {
      setTransactions([]);
      return;
    }

    const response = await apiFetch(`${API}/api/me/transactions`);

    if (!response.ok) {
      throw new Error("Failed to load transactions");
    }

    const data = await response.json();
    setTransactions(data.transactions || []);
  };

  const loadItemWithdrawalHistory = async () => {
    if (!authUser) {
      setItemWithdrawalHistory([]);
      return;
    }

    setItemWithdrawalHistoryLoading(true);

    try {
      const response = await apiFetch(
        `${API}/api/me/item-withdrawals`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load item withdrawal history"
        );
      }

      setItemWithdrawalHistory(
        data.withdrawals || []
      );
    } catch (error) {
      console.error(
        "Item withdrawal history load failed:",
        error
      );
    } finally {
      setItemWithdrawalHistoryLoading(false);
    }
  };

  const loadCreatorDashboard = async () => {
    if (!authUser) {
      setCreatorDashboard(null);
      setCreatorDashboardAvailable(false);
      setCreatorDashboardError("");
      return;
    }

    setCreatorDashboardLoading(true);
    setCreatorDashboardError("");

    try {
      const response = await apiFetch(
        `${API}/api/auth/creator/dashboard`
      );

      if (response.status === 404) {
        setCreatorDashboard(null);
        setCreatorDashboardAvailable(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load creator dashboard"
        );
      }

      setCreatorDashboard(data);
      setCreatorDashboardAvailable(true);
    } catch (error) {
      console.error(
        "Creator dashboard load failed:",
        error
      );
      setCreatorDashboard(null);
      setCreatorDashboardAvailable(false);
      setCreatorDashboardError(error.message);
    } finally {
      setCreatorDashboardLoading(false);
    }
  };

  const loadLiveActivity = async () => {
    if (liveActivityRequestRef.current) {
      return;
    }

    liveActivityRequestRef.current = true;

    try {
      const response = await apiFetch(
        `${API}/api/users/activity/recent?limit=12`
      );

      if (!response.ok) {
        throw new Error("Failed to load live activity");
      }

      const data = await response.json();
      const nextActivity = Array.isArray(data.activity) ? data.activity : [];
      const previousTopId = Array.isArray(liveActivity) && liveActivity.length
        ? liveActivity[0]?.id
        : null;
      const nextTopId = nextActivity.length ? nextActivity[0]?.id : null;

      setLiveActivity(nextActivity);

      if (liveActivityInitializedRef.current && nextTopId && nextTopId !== previousTopId) {
        setLiveActivityEnteringId(nextTopId);
        window.setTimeout(() => {
          setLiveActivityEnteringId((current) =>
            current === nextTopId ? null : current
          );
        }, 900);
      }

      liveActivityInitializedRef.current = true;
    } catch (error) {
      console.error("Live activity load failed:", error);
    } finally {
      liveActivityRequestRef.current = false;
      setLiveActivityLoading(false);
    }
  };

  const loadHomeTrending = async () => {
    try {
      setHomeTrendingLoading(true);
      const response = await apiFetch(`${API}/api/marketplace?game=steal-a-brainrot`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load marketplace highlights");
      }

      const data = await response.json();
      const listings = Array.isArray(data.listings) ? data.listings : [];
      const unique = [];
      const seenNames = new Set();

      [...listings]
        .filter((item) => Number(item.stock ?? 0) > 0)
        .sort((a, b) => Number(b.priceCents || 0) - Number(a.priceCents || 0))
        .forEach((item) => {
          const name = String(item.name || "").trim().toLowerCase();
          if (!name || seenNames.has(name) || unique.length >= 4) return;
          seenNames.add(name);
          unique.push(item);
        });

      setHomeTrendingItems(unique);
    } catch (error) {
      console.error("Homepage marketplace highlights failed:", error);
      setHomeTrendingItems([]);
    } finally {
      setHomeTrendingLoading(false);
    }
  };

  const loadCases = async () => {
    const response = await apiFetch(`${API}/api/cases`);

    if (!response.ok) {
      throw new Error("Failed to load cases");
    }

    const data = await response.json();

    const activeCases = (data.cases || [])
      .filter((item) => item.active !== false)
      .map((item) => ({
        ...item,
        id: Number(item.id),
      }));

    if (activeCases.length) {
      setCases(activeCases);
    }
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("CaseX_recent_wins") || "[]"
      );

      if (Array.isArray(saved)) {
        setRecentWins(saved.slice(0, 6));
      }
    } catch {
      // Ignore malformed local demo data.
    }

    loadCases().catch((error) =>
      console.error("Initial case load failed:", error)
    );

    loadLiveActivity();
    loadHomeTrending();

    apiFetch(`${API}/api/auth/me`)
      .then(async (response) => {
        if (response.status === 401) return null;

        if (!response.ok) {
          throw new Error("Failed to load account");
        }

        return response.json();
      })
      .then(async (data) => {
        if (!data?.user) return;

        setAuthUser(data.user);
        setBalance(Number(data.user.balance_cents || 0) / 100);
      })
      .catch((error) =>
        console.error("Initial account load failed:", error)
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadLiveActivity();
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authUser) return;

    Promise.all([
      loadInventory(),
      loadTransactions(),
      loadItemWithdrawalHistory(),
      loadCreatorDashboard(),
    ]).catch((error) =>
      console.error("Account data refresh failed:", error)
    );
  }, [authUser?.id]);

  useEffect(() => {
  const params = new URLSearchParams(
    window.location.search
  );

  const token = params.get("token");

  if (!token) return;

  setResetPasswordToken(token);
  setResetPasswordForm({
    password: "",
    confirmPassword: "",
  });
  setAuthMode("reset");
  setAuthError("");
  setAuthSuccess("");
  setAuthOpen(true);
}, []);

  useEffect(() => {
    const handleProfileOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleProfileOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleProfileOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const handleGameMenuOutsideClick = (event) => {
      const insideGames =
        gameMenuRef.current &&
        gameMenuRef.current.contains(event.target);
      const insideOriginals =
        originalsMenuRef.current &&
        originalsMenuRef.current.contains(event.target);

      if (!insideGames) setGameMenuOpen(false);
      if (!insideOriginals) setOriginalsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleGameMenuOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleGameMenuOutsideClick);
    };
  }, []);

const openAuth = (mode = "login") => {
  setAuthMode(mode);
  setAuthError("");
  setAuthSuccess("");

  setForgotPasswordEmail("");

  setResetPasswordToken("");

  setResetPasswordForm({
    password: "",
    confirmPassword: "",
  });

  setAuthForm({
    username: "",
    email: "",
    identifier: "",
    password: "",
    creatorCode: "",
  });

  setAuthOpen(true);
  setProfileOpen(false);
};

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint =
        authMode === "login"
          ? "login"
          : "register";

      const body =
        authMode === "login"
          ? {
              identifier: authForm.identifier,
              password: authForm.password,
            }
          : {
              username: authForm.username,
              email: authForm.email,
              password: authForm.password,
              creatorCode: authForm.creatorCode,
            };

      const response = await apiFetch(
        `${API}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.replaceAll("_", " ").toLowerCase() ||
            "Authentication failed"
        );
      }

      setAuthUser(data.user);
      setBalance(
        Number(data.user.balance_cents || 0) / 100
      );

      setAuthOpen(false);
      setAuthError("");

      await Promise.all([
        loadInventory(),
        loadTransactions(),
        loadItemWithdrawalHistory(),
        loadCreatorDashboard(),
      ]);
    } catch (error) {
      console.error("Authentication failed:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (authLoading) return;

    const email = String(
      forgotPasswordEmail || ""
    ).trim();

    if (!email) {
      setAuthError("Enter your account email.");
      setAuthSuccess("");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthError("Enter a valid email address.");
      setAuthSuccess("");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.replaceAll("_", " ").toLowerCase() ||
            "Failed to request password reset"
        );
      }

      setAuthSuccess(
        "If an account with that email exists, a password reset link has been sent."
      );
    } catch (error) {
      console.error(
        "Forgot password request failed:",
        error
      );

      setAuthError(
        error.message ||
          "Failed to request password reset."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (authLoading) return;

    const password = String(
      resetPasswordForm.password || ""
    );

    const confirmPassword = String(
      resetPasswordForm.confirmPassword || ""
    );

    if (!resetPasswordToken) {
      setAuthError(
        "This password reset link is invalid or has expired."
      );
      setAuthSuccess("");
      return;
    }

    if (password.length < 8) {
      setAuthError(
        "Your new password must be at least 8 characters."
      );
      setAuthSuccess("");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError(
        "Your new passwords do not match."
      );
      setAuthSuccess("");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: resetPasswordToken,
            newPassword: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.replaceAll("_", " ").toLowerCase() ||
            "Failed to reset password"
        );
      }

      setResetPasswordForm({
        password: "",
        confirmPassword: "",
      });

      setResetPasswordToken("");

      setAuthMode("login");

      setAuthForm({
        username: "",
        email: "",
        identifier: "",
        password: "",
        creatorCode: "",
      });

      setAuthSuccess(
        "Password reset successfully. You can now sign in with your new password."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    } catch (error) {
      console.error(
        "Password reset failed:",
        error
      );

      setAuthError(
        error.message ||
          "Failed to reset password."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch(`${API}/api/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthUser(null);
      setInventory([]);
      setTransactions([]);
      setItemWithdrawalHistory([]);
      setWithdrawalHistoryOpen(false);
      setBalance(0);
      setProfileOpen(false);
      setWalletOpen(false);
      setCryptoPayment(null);
      setSelected(null);
      setResult(null);
      setWonInventoryId(null);
      setReelItems([]);
      setReelTarget(null);
      setCreatorDashboardOpen(false);
      setCreatorDashboard(null);
      setCreatorDashboardAvailable(false);
      setCreatorDashboardError("");
      setCreatorUserSort("volume-desc");
    }
  };

  const openSettings = (tab = "profile") => {
    if (!authUser) {
      openAuth("login");
      return;
    }

    setProfileOpen(false);
    setSettingsTab(tab);
    setSettingsError("");
    setSettingsSuccess("");
    setSettingsOpen(true);
  };

  const handleSettingsProfileSave = async (event) => {
    event.preventDefault();
    if (!authUser || settingsLoading) return;

    const username = String(settingsProfile.username || "").trim();
    const email = String(settingsProfile.email || "").trim();
    const currentPassword = String(settingsProfile.currentPassword || "");

    if (username.length < 3 || username.length > 24) {
      setSettingsError("Username must be between 3 and 24 characters.");
      setSettingsSuccess("");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setSettingsError(
        "Username can only contain letters, numbers and underscores.",
      );
      setSettingsSuccess("");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSettingsError("Enter a valid email address.");
      setSettingsSuccess("");
      return;
    }

    const needsPassword =
      username.toLowerCase() !== String(authUser.username || "").toLowerCase() ||
      email.toLowerCase() !== String(authUser.email || "").toLowerCase();

    if (needsPassword && currentPassword.length < 1) {
      setSettingsError("Enter your current password to change account details.");
      setSettingsSuccess("");
      return;
    }

    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");

    try {
      const response = await apiFetch(`${API}/api/auth/me/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          currentPassword: needsPassword ? currentPassword : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.replaceAll("_", " ").toLowerCase() ||
            "Failed to update account details",
        );
      }

      setAuthUser(data.user);
      setSettingsProfile({
        username: data.user?.username || username,
        email: data.user?.email || email,
        currentPassword: "",
      });
      setSettingsSuccess("Account details updated successfully.");
    } catch (error) {
      console.error("Profile settings update failed:", error);
      setSettingsError(error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingsPasswordSave = async (event) => {
    event.preventDefault();
    if (!authUser || settingsLoading) return;

    const currentPassword = String(settingsPassword.currentPassword || "");
    const newPassword = String(settingsPassword.newPassword || "");
    const confirmPassword = String(settingsPassword.confirmPassword || "");

    if (!currentPassword) {
      setSettingsError("Enter your current password.");
      setSettingsSuccess("");
      return;
    }

    if (newPassword.length < 8) {
      setSettingsError("Your new password must be at least 8 characters.");
      setSettingsSuccess("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSettingsError("Your new passwords do not match.");
      setSettingsSuccess("");
      return;
    }

    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");

    try {
      const response = await apiFetch(`${API}/api/auth/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.replaceAll("_", " ").toLowerCase() ||
            "Failed to change password",
        );
      }

      setSettingsPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSettingsSuccess("Password changed successfully.");
    } catch (error) {
      console.error("Password change failed:", error);
      setSettingsError(error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogoutOtherSessions = async () => {
    if (!authUser || settingsLoading) return;

    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");

    try {
      const response = await apiFetch(
        `${API}/api/auth/me/logout-other-sessions`,
        { method: "POST" },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.replaceAll("_", " ").toLowerCase() ||
            "Failed to sign out other sessions",
        );
      }

      const closed = Number(data.sessionsClosed || 0);
      setSettingsSuccess(
        `${closed} other session${closed === 1 ? "" : "s"} signed out.`,
      );
    } catch (error) {
      console.error("Logout other sessions failed:", error);
      setSettingsError(error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const decoratedCases = useMemo(
    () =>
      cases.map((item) => ({
        ...item,
        price: Number(item.price_cents) / 100,
        ...(caseMeta[item.id] || {
          accent: "violet",
          icon: "🎁",
          tag: "CASE",
        }),
        description:
          caseDescriptions[item.id] ||
          "Open the case and discover its configured rewards.",
      })),
    [cases]
  );

  const allCaseTags = useMemo(() => [
    "All",
    ...Array.from(new Set(decoratedCases.map((item) => String(item.tag || "").trim()).filter(Boolean))),
  ], [decoratedCases]);

  const visibleCases = useMemo(() => {
    const query = casesSearch.trim().toLowerCase();
    const filtered = decoratedCases.filter((item) => {
      const matchesQuery = !query || [item.name, item.description, item.tag].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesTag = casesTagFilter === "All" || String(item.tag || "") === casesTagFilter;
      const matchesGame = casesGameFilter === "all" || String(item.game_slug || "steal-a-brainrot") === casesGameFilter;
      return matchesQuery && matchesTag && matchesGame;
    });
    return [...filtered].sort((a, b) => {
      if (casesSort === "price-low") return Number(a.price || 0) - Number(b.price || 0);
      if (casesSort === "price-high") return Number(b.price || 0) - Number(a.price || 0);
      if (casesSort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      const af = a.featured === true || a.featured === 1 || a.featured === "true" ? 0 : 1;
      const bf = b.featured === true || b.featured === 1 || b.featured === "true" ? 0 : 1;
      return af - bf || Number(a.featured_order || 999999) - Number(b.featured_order || 999999) || Number(a.id || 0) - Number(b.id || 0);
    });
  }, [decoratedCases, casesSearch, casesTagFilter, casesGameFilter, casesSort]);

  const featuredCases = useMemo(
    () =>
      decoratedCases
        .filter((item) => item.featured === true || item.featured === 1 || item.featured === "true")
        .sort((a, b) => {
          const aOrder = Number.isFinite(Number(a.featured_order))
            ? Number(a.featured_order)
            : Number.MAX_SAFE_INTEGER;
          const bOrder = Number.isFinite(Number(b.featured_order))
            ? Number(b.featured_order)
            : Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder || Number(a.id) - Number(b.id);
        }),
    [decoratedCases]
  );

  const previewCase = async (c) => {
    if (opening || previewLoading) return;

    setPreviewLoading(true);
    setResult(null);
    setWonInventoryId(null);
    setReelItems([]);
    setReelWinningReward(null);
    setReelTarget(null);
    setReelAnimating(false);

    try {
      const response = await apiFetch(
        `${API}/api/cases/${c.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load case"
        );
      }

      const rewards = data.items || [];

      caseRewardsCacheRef.current.set(
        Number(c.id),
        rewards
      );

      const openedCase = {
        ...c,
        ...(data.case || {}),
        id: Number(data.case?.id ?? c.id),
        image_url:
          data.case?.image_url ||
          c.image_url ||
          c.imageUrl ||
          "",
        imageUrl:
          data.case?.image_url ||
          c.image_url ||
          c.imageUrl ||
          "",
        items: rewards,
      };

      saveCasexCaseSnapshot(openedCase);
      setSelected(openedCase);
    } catch (error) {
      console.error("Case preview failed:", error);
      alert(error.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const buildPendingReel = (rewardPool) => {
    const pool = (rewardPool || []).map((item) => ({
      id: Number(item.id),
      name: item.name,
      rarity: item.rarity,
      valueCents: Number(
        item.value_cents ??
          item.valueCents ??
          0
      ),
      imageUrl: item.image_url ?? item.imageUrl ?? "",
      cls: rarityClass(item.rarity),
    }));

    const fallbackPool = [
      { id: 1, name: "Common Drop", rarity: "Common", valueCents: 100, cls: "common" },
      { id: 2, name: "Rare Drop", rarity: "Rare", valueCents: 300, cls: "rare" },
      { id: 3, name: "Epic Drop", rarity: "Epic", valueCents: 1000, cls: "epic" },
      { id: 4, name: "Legendary Drop", rarity: "Legendary", valueCents: 5000, cls: "legendary" },
      { id: 5, name: "Secret Drop", rarity: "Secret", valueCents: 25000, cls: "secret" },
    ];

    const source = pool.length ? pool : fallbackPool;
    const winnerIndex = 120;
    const itemsAfterWinner = 50;
    const items = [];

    for (let index = 0; index < winnerIndex; index += 1) {
      const item = source[Math.floor(Math.random() * source.length)];
      items.push({
        ...item,
        key: `pending-${index}-${item.id}-${Math.random().toString(36).slice(2)}`,
        winning: false,
      });
    }

    items.push({
      id: 0,
      name: "Revealing...",
      rarity: "Common",
      valueCents: 0,
      cls: "common",
      key: "winning-item",
      winning: true,
    });

    for (let index = 0; index < itemsAfterWinner; index += 1) {
      const item = source[Math.floor(Math.random() * source.length)];
      items.push({
        ...item,
        key: `pending-after-${index}-${item.id}-${Math.random().toString(36).slice(2)}`,
        winning: false,
      });
    }

    return items;
  };

  const buildReel = (reward, rewardPool) => {
    const pool = (rewardPool || []).map((item) => ({
      id: Number(item.id),
      name: item.name,
      rarity: item.rarity,
      valueCents: Number(
        item.value_cents ??
          item.valueCents ??
          0
      ),
      imageUrl: item.image_url ?? item.imageUrl ?? "",
      cls: rarityClass(item.rarity),
    }));

    const fallbackPool = [
      {
        id: 1,
        name: "Common Drop",
        rarity: "Common",
        valueCents: 100,
        cls: "common",
      },
      {
        id: 2,
        name: "Rare Drop",
        rarity: "Rare",
        valueCents: 300,
        cls: "rare",
      },
      {
        id: 3,
        name: "Epic Drop",
        rarity: "Epic",
        valueCents: 1000,
        cls: "epic",
      },
      {
        id: 4,
        name: "Legendary Drop",
        rarity: "Legendary",
        valueCents: 5000,
        cls: "legendary",
      },
      {
        id: 5,
        name: "Secret Drop",
        rarity: "Secret",
        valueCents: 25000,
        cls: "secret",
      },
    ];

    const source = pool.length
      ? pool
      : fallbackPool;

    const winnerIndex = 120;
    const itemsAfterWinner = 50;
    const items = [];

    for (
      let index = 0;
      index < winnerIndex;
      index += 1
    ) {
      const item =
        source[
          Math.floor(
            Math.random() * source.length
          )
        ];

      items.push({
        ...item,
        key: `reel-${index}-${item.id}-${Math.random()
          .toString(36)
          .slice(2)}`,
        winning: false,
      });
    }

    items.push({
      id: Number(reward.id),
      name: reward.name,
      rarity: reward.rarity,
      valueCents: Number(
        reward.valueCents || reward.value_cents || 0
      ),
      imageUrl: reward.image_url ?? reward.imageUrl ?? "",
      cls: rarityClass(reward.rarity),
      key: "winning-item",
      winning: true,
    });

    for (
      let index = 0;
      index < itemsAfterWinner;
      index += 1
    ) {
      const item =
        source[
          Math.floor(
            Math.random() * source.length
          )
        ];

      items.push({
        ...item,
        key: `after-${index}-${item.id}-${Math.random()
          .toString(36)
          .slice(2)}`,
        winning: false,
      });
    }

    return items;
  };

  useEffect(() => {
    if (!opening || !reelItems.length) {
      setReelTarget(null);
      setReelAnimating(false);
      return;
    }

    const track = reelTrackRef.current;
    const windowElement =
      reelWindowRef.current;

    if (!track || !windowElement) return;

    const winner = track.querySelector(
      '.reel-item[data-winning="true"]'
    );

    if (!winner) return;

    setReelAnimating(false);
    setReelTarget("0px");

    requestAnimationFrame(() => {
      const targetX =
        windowElement.clientWidth / 2 -
        (winner.offsetLeft +
          winner.offsetWidth / 2);

      setReelTarget(`${targetX}px`);

      requestAnimationFrame(() => {
        setReelAnimating(true);
      });
    });
  }, [opening, reelItems]);


  const dismissWalletNotification = () => {
    if (walletNotificationTimerRef.current) {
      window.clearTimeout(walletNotificationTimerRef.current);
      walletNotificationTimerRef.current = null;
    }

    setWalletNotification(null);
  };

  const showWalletNotification = ({
    tone = "info",
    icon = "↑",
    title,
    message,
    duration = 6500,
  }) => {
    if (!title || !message) return;

    if (walletNotificationTimerRef.current) {
      window.clearTimeout(walletNotificationTimerRef.current);
    }

    setWalletNotification({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tone,
      icon,
      title,
      message,
    });

    walletNotificationTimerRef.current = window.setTimeout(() => {
      setWalletNotification(null);
      walletNotificationTimerRef.current = null;
    }, duration);
  };

  const walletNotificationSeen = (key) => {
    if (!key) return false;

    if (walletNotificationSeenRef.current.has(key)) {
      return true;
    }

    walletNotificationSeenRef.current.add(key);

    try {
      window.sessionStorage.setItem(
        `CaseX_wallet_event_${key}`,
        "1"
      );
    } catch {
      // Ignore unavailable sessionStorage.
    }

    return false;
  };

  const restoreWalletNotificationSeen = (key) => {
    if (!key) return false;

    if (walletNotificationSeenRef.current.has(key)) {
      return true;
    }

    try {
      if (
        window.sessionStorage.getItem(
          `CaseX_wallet_event_${key}`
        ) === "1"
      ) {
        walletNotificationSeenRef.current.add(key);
        return true;
      }
    } catch {
      // Ignore unavailable sessionStorage.
    }

    return false;
  };

  const formatWalletNotificationAmount = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      return "";
    }

    return `$${value.toFixed(2)}`;
  };

  const getDepositNotificationAmount = (data, payment = cryptoPayment) => {
    const candidates = [
      {
        value: data?.amount_cents,
        divisor: 100,
      },
      {
        value: data?.amountCents,
        divisor: 100,
      },
      {
        value: data?.price_amount,
        divisor: 1,
      },
      {
        value: data?.priceAmount,
        divisor: 1,
      },
      {
        value: data?.amount,
        divisor: 1,
      },
      {
        value: payment?.amountCents,
        divisor: 100,
      },
      {
        value: payment?.priceAmount,
        divisor: 1,
      },
      {
        value: payment?.price_amount,
        divisor: 1,
      },
    ];

    for (const candidate of candidates) {
      const value = Number(candidate.value);

      if (!Number.isFinite(value) || value <= 0) {
        continue;
      }

      return formatWalletNotificationAmount(
        value / candidate.divisor
      );
    }

    return "";
  };

  useEffect(() => {
    return () => {
      if (walletNotificationTimerRef.current) {
        window.clearTimeout(
          walletNotificationTimerRef.current
        );
      }
    };
  }, []);

const switchDepositCurrency = async (nextCurrency) => {
    if (
      !nextCurrency ||
      nextCurrency === depositCurrency ||
      walletLoading
    ) {
      return;
    }

    setWalletLoading(true);

    try {
      const response = await walletFetch(
        `${API}/api/me/wallet/deposit-address?payCurrency=${encodeURIComponent(
          nextCurrency
        )}`,
        {},
        25000
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to load the deposit address."
        );
      }

      if (!data.payAddress) {
        throw new Error("No deposit address was returned.");
      }

      setDepositCurrency(nextCurrency);

      setCryptoPayment({
        paymentId: data.providerPaymentId || null,
        requestId: data.requestId || data.request?.id || null,
        payAddress: data.payAddress,
        payCurrency: data.payCurrency || nextCurrency,
        network: data.network,
        minimumUsd: data.minimumUsd,
        status: "waiting",
      });
    } catch (error) {
      console.error("Deposit currency switch failed:", error);
      alert(error.message);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWalletAction = async () => {
    const amount =
      walletAction === "withdraw"
        ? Number(walletAmount)
        : null;

    if (
      walletAction === "withdraw" &&
      (!Number.isFinite(amount) || amount <= 0)
    ) {
      alert("Enter a valid withdrawal amount.");
      return;
    }

    if (walletAction === "withdraw" && !String(withdrawAddress || "").trim()) {
      alert("Enter the crypto wallet address for the withdrawal.");
      return;
    }

    setWalletLoading(true);

    try {
const response =
  walletAction === "deposit"
    ? await walletFetch(
        `${API}/api/me/wallet/deposit-address?payCurrency=${encodeURIComponent(
          depositCurrency
        )}`,
        {},
        25000
      )
    : await walletFetch(
        `${API}/api/me/wallet/withdraw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amountCents: Math.round(amount * 100),
            payCurrency: withdrawCurrency,
            withdrawalAddress: String(withdrawAddress || "").trim(),
          }),
        }
      );

      const data = await response.json();

if (!response.ok) {
  throw new Error(
    data.message ||
      data.error ||
      `Failed to ${walletAction}`
  );
}

if (walletAction === "withdraw") {
  setBalance(
    Number(data.newBalanceCents || 0) / 100
  );
  setTransactions(data.transactions || []);

  showWalletNotification({
    tone: "pending",
    icon: "↓",
    title: "Withdrawal Pending",
    message: `Your ${formatWalletNotificationAmount(amount)} withdrawal has been submitted and is being processed.`,
  });
} else {
  await loadTransactions();
}

setWalletAmount("");

      if (walletAction === "withdraw") {
        setWithdrawAddress("");
      }

if (walletAction === "deposit" && data.payAddress) {
  setCryptoPayment({
    paymentId: data.providerPaymentId || null,
    requestId: data.requestId || data.request?.id || null,
    payAddress: data.payAddress,
    payCurrency: data.payCurrency,
    network: data.network,
    minimumUsd: data.minimumUsd,
    status: "waiting",
  });
}

else {
  await loadTransactions();
}
    } catch (error) {
      console.error(`Wallet ${walletAction} failed:`, error);
      alert(error.message);
    } finally {
      setWalletLoading(false);
    }
  };

  const copyCryptoAddress = async () => {
    if (!cryptoPayment?.payAddress) return;
    try {
      await navigator.clipboard.writeText(cryptoPayment.payAddress);
      alert("Deposit address copied.");
    } catch {
      alert("Unable to copy the address automatically.");
    }
  };

  const closeCryptoPayment = () => {
    setCryptoPayment(null);
  };

  const createBrainrotDeposit = async () => {
    if (brainrotDepositLoading) return;
    if (!authUser) { openAuth("login"); return; }
    setBrainrotDepositLoading(true);
    try {
      const response = await apiFetch(`${API}/api/me/brainrot-deposits`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Failed to create Brainrot deposit.");
      setBrainrotDeposit({ ...(data.deposit || {}), discordUrl: data.discordUrl || "https://discord.gg/6t9bzvnndd" });
    } catch (error) { alert(error.message); } finally { setBrainrotDepositLoading(false); }
  };

  const closeBrainrotDeposit = () => setBrainrotDeposit(null);

useEffect(() => {
  if (!cryptoPayment?.payAddress) return;

  let stopped = false;
  let timer = null;
  let lastStatus = "waiting";
  let detectedShown = false;
  let creditedShown = false;

  const paymentKey =
    cryptoPayment.requestId ||
    cryptoPayment.paymentId ||
    cryptoPayment.payAddress;

  const checkPayment = async () => {
    try {
      const response = await apiFetch(
        `${API}/api/me/wallet/deposit-status?payAddress=${encodeURIComponent(
          cryptoPayment.payAddress
        )}`
      );

      if (!response.ok || stopped) return;

      const data = await response.json();

      if (!data.found || stopped) return;

      const status = String(
        data.status || "waiting"
      ).toLowerCase();

      const detectedStatuses = new Set([
        "pending",
        "confirming",
        "confirmed",
        "sending",
        "partially_paid",
        "finished",
        "completed",
      ]);

      const failureStatuses = new Set([
        "failed",
        "expired",
        "refunded",
        "payment_mismatch",
      ]);

      const detectedTransition =
        !detectedShown &&
        status !== "completed" &&
        detectedStatuses.has(status) &&
        !detectedStatuses.has(lastStatus);

      if (
        detectedTransition &&
        !restoreWalletNotificationSeen(
          `${paymentKey}:detected`
        )
      ) {
        const currency = String(
          cryptoPayment.payCurrency || "crypto"
        ).toUpperCase();

        const amountText =
          getDepositNotificationAmount(
            data,
            cryptoPayment
          );

        showWalletNotification({
          tone: "pending",
          icon: "↑",
          title: "Deposit Detected",
          message: amountText
            ? `Your ${amountText} ${currency} deposit has been detected and is being processed.`
            : `Your ${currency} deposit has been detected and is being processed.`,
        });

        walletNotificationSeen(
          `${paymentKey}:detected`
        );
        detectedShown = true;
      } else if (detectedStatuses.has(status)) {
        detectedShown = true;
      }

      setCryptoPayment((current) =>
        current
          ? {
              ...current,
              requestId:
                data.requestId ||
                current.requestId ||
                null,
              status,
              amountCents:
                data.amount_cents ??
                data.amountCents ??
                current.amountCents ??
                null,
              priceAmount:
                data.price_amount ??
                data.priceAmount ??
                current.priceAmount ??
                null,
            }
          : current
      );

      if (
        status === "completed" &&
        !creditedShown &&
        !restoreWalletNotificationSeen(
          `${paymentKey}:credited`
        )
      ) {
        const meResponse = await apiFetch(
          `${API}/api/auth/me`
        );

        if (meResponse.ok) {
          const meData = await meResponse.json();

          if (meData.user) {
            setAuthUser(meData.user);
            setBalance(
              Number(
                meData.user.balance_cents || 0
              ) / 100
            );
          }
        }

        await loadTransactions();

        const amountText =
          getDepositNotificationAmount(
            data,
            cryptoPayment
          );

        showWalletNotification({
          tone: "success",
          icon: "✓",
          title: "Deposit Credited",
          message: amountText
            ? `${amountText} has been added to your wallet balance.`
            : "Your deposit has been added to your wallet balance.",
        });

        walletNotificationSeen(
          `${paymentKey}:credited`
        );
        creditedShown = true;

        if (timer) {
          window.clearInterval(timer);
        }
      }

      if (status === "payment_mismatch") {
        showWalletNotification({
          tone: "error",
          icon: "!",
          title: "Deposit Not Credited",
          message:
            "The received amount did not meet the minimum deposit requirement, so your wallet was not credited.",
        });

        alert(
          `Deposit was not credited because the amount received is below the minimum deposit of $${Number(
            data.minimumUsd ||
              cryptoPayment.minimumUsd ||
              0
          ).toFixed(2)}.`
        );

        if (timer) {
          window.clearInterval(timer);
        }

        return;
      }

      if (failureStatuses.has(status)) {
        if (status !== "payment_mismatch") {
          showWalletNotification({
            tone: "error",
            icon: "!",
            title: "Deposit Failed",
            message: `Your deposit could not be completed (${status.replaceAll(
              "_",
              " "
            )}).`,
          });
        }

        if (timer) {
          window.clearInterval(timer);
        }
      }

      lastStatus = status;
    } catch (error) {
      console.error(
        "Crypto payment status check failed:",
        error
      );
    }
  };

  checkPayment();
  timer = window.setInterval(
    checkPayment,
    4000
  );

  return () => {
    stopped = true;

    if (timer) {
      window.clearInterval(timer);
    }
  };
}, [cryptoPayment?.payAddress]);


  const withdrawItem = async (item) => {
    if (!item || withdrawLoadingId) return;

    setWithdrawLoadingId(item.id);

    try {
      const response = await apiFetch(
        `${API}/api/me/inventory/${item.id}/withdraw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to create withdrawal"
        );
      }

      await Promise.all([
        loadInventory(),
        loadItemWithdrawalHistory(),
      ]);

      setWithdrawConfirmItem(null);
      setWithdrawResult(data.withdrawal || null);
    } catch (error) {
      console.error("Withdraw item failed:", error);
      alert(error.message);
    } finally {
      setWithdrawLoadingId(null);
    }
  };

  const sellItem = async (item) => {
    if (!item || sellLoadingId) return;

    setSellLoadingId(item.id);

    try {
      const url = `${API}/api/me/inventory/${item.id}/sell`;

      console.log(
        "Selling inventory item:",
        item.id
      );

      console.log("Sale URL:", url);

      const response = await apiFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseText =
        await response.text();

      console.log(
        "Sale response status:",
        response.status
      );

      console.log(
        "Sale response:",
        responseText
      );

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to sell item"
        );
      }

      setBalance(
        Number(data.newBalanceCents) / 100
      );

      await loadInventory();
      await loadTransactions();

      setSellConfirmItem(null);

      if (
        Number(item.id) ===
        Number(wonInventoryId)
      ) {
        setSelected(null);
        setResult(null);
        setWonInventoryId(null);
        setReelItems([]);
        setReelTarget(null);
      }
    } catch (error) {
      console.error(
        "Sell item failed:",
        error
      );

      alert(error.message);
    } finally {
      setSellLoadingId(null);
    }
  };

  const openCase = async (c = selected) => {
    if (!authUser) {
      openAuth("login");
      return;
    }

    if (
      !c ||
      opening ||
      balance < c.price
    ) {
      return;
    }

    setResult(null);
    setReelWinningReward(null);
    setOpening(true);
    setReelTarget(null);
    setReelAnimating(false);

    primeAudio();
    playCaseOpenSound();
    startReelSound();

    const openingStartedAt = Date.now();

    try {
      const rewardPool = Array.isArray(c.items)
        ? c.items
        : caseRewardsCacheRef.current.get(Number(c.id)) || [];

      if (!rewardPool.length) {
        throw new Error(
          "Case rewards are still loading. Please open the case again in a moment."
        );
      }

      /*
       * Start the visual reel immediately. The server still
       * selects the real reward; the center slot is replaced
       * with the server-selected reward when /open responds.
       */
      setReelItems(buildPendingReel(rewardPool));

      const response = await apiFetch(
        `${API}/api/cases/${c.id}/open`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to open case"
        );
      }

      setBalance(
        Number(data.newBalanceCents) / 100
      );

      setWonInventoryId(
        data.inventoryId ?? null
      );

      const rewardPoolMatch = rewardPool.find(
        (item) => Number(item.id) === Number(data.reward?.id)
      );

      const resolvedRewardImage =
        data.reward?.image_url ||
        data.reward?.imageUrl ||
        rewardPoolMatch?.image_url ||
        rewardPoolMatch?.imageUrl ||
        "";

      const resolvedReward = {
        ...data.reward,
        valueCents: Number(
          data.reward?.valueCents ||
            data.reward?.value_cents ||
            0
        ),
        image_url: resolvedRewardImage,
        imageUrl: resolvedRewardImage,
      };

      const newWin = {
        inventoryId:
          data.inventoryId ?? null,
        id: resolvedReward.id,
        name: resolvedReward.name,
        rarity: resolvedReward.rarity,
        valueCents: resolvedReward.valueCents,
        image_url: resolvedRewardImage,
        imageUrl: resolvedRewardImage,
        wonAt: new Date().toISOString(),
      };

      setRecentWins((current) => {
        const next = [
          newWin,
          ...current.filter(
            (item) =>
              item.inventoryId !==
              newWin.inventoryId
          ),
        ].slice(0, 6);

        localStorage.setItem(
          "CaseX_recent_wins",
          JSON.stringify(next)
        );

        return next;
      });

      /*
       * Keep the reel DOM stable while it is moving. Only the
       * data displayed in the winning slot changes, so the CSS
       * animation does not restart when the API responds.
       */
      setReelWinningReward(resolvedReward);

      const elapsed = Date.now() - openingStartedAt;
      const revealDelay = Math.max(0, 5800 - elapsed);

      window.setTimeout(() => {
        setResult(resolvedReward);
        setOpening(false);
        setReelWinningReward(null);
        setReelTarget(null);
        setReelAnimating(false);
      }, revealDelay);

      void Promise.all([
        loadInventory(),
        loadLiveActivity(),
      ]).catch((refreshError) => {
        console.error(
          "Post-opening account refresh failed:",
          refreshError
        );
      });
    } catch (error) {
      console.error(
        "Case opening failed:",
        error
      );

      setOpening(false);
      setReelItems([]);
      setReelWinningReward(null);
      setReelTarget(null);
      setReelAnimating(false);

      alert(error.message);
    }
  };

  const sellWonItem = async () => {
    if (!wonInventoryId || !result) {
      return;
    }

    try {
      const response = await apiFetch(
        `${API}/api/me/inventory/${wonInventoryId}/sell`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to sell item"
        );
      }

      setBalance(
        Number(data.newBalanceCents) / 100
      );

      await loadInventory();
      await loadTransactions();

      setSelected(null);
      setResult(null);
      setWonInventoryId(null);
      setReelItems([]);
      setReelTarget(null);
    } catch (error) {
      console.error(
        "Sell item failed:",
        error
      );

      alert(error.message);
    }
  };

  const openJackpotPage = () => {
    setOriginalGameOpen(null);
    if (opening) return;

    setGameMenuOpen(false);
    setOriginalsMenuOpen(false);
    setProfileOpen(false);
    setColorDicingOpen(false);
    setCasesPageOpen(false);
    setGamePortalOpen(false);
    setGamePortalGame(null);
    setGamePortalTab("marketplace");
    setSelected(null);
    setResult(null);
    setWonInventoryId(null);
    setReelItems([]);
    setReelWinningReward(null);
    setReelTarget(null);
    setReelAnimating(false);
    setJackpotPageOpen(true);

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  const closeJackpotPage = () => {
    if (opening || jackpotEntryLoading) return;

    setJackpotPageOpen(false);
    setJackpotEntryOpen(false);
    setJackpotEntryError("");
    setJackpotAmount("");
    setJackpotSelectedInventoryIds(new Set());

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  const openColorDicing = () => {
    if (opening) return;
    setOriginalGameOpen("dicing");
    setGameMenuOpen(false);
    setOriginalsMenuOpen(false);
    setJackpotPageOpen(false);
    setGamePortalOpen(false);
    setGamePortalGame(null);
    setGamePortalTab("marketplace");
    if (selected) closeCasePage();
    if (casesPageOpen) closeCasesPage();
    setProfileOpen(false);
    setColorDicingOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  const closeColorDicing = () => {
    setColorDicingOpen(false);
    setOriginalGameOpen(null);
  };

  const openMines = () => {
    openOriginalGame("mines");
  };

  const runSmoothPageTransition = (update) => {
    if (
      typeof document !== "undefined" &&
      typeof document.startViewTransition === "function"
    ) {
      document.startViewTransition(() => {
        update();
      });
      return;
    }

    update();
  };

  const openOriginalGame = (gameSlug = "towers") => {
    if (opening) return;

    setOriginalGameOpen(gameSlug);
    setGameMenuOpen(false);
    setOriginalsMenuOpen(false);
    setJackpotPageOpen(false);
    setProfileOpen(false);
    setColorDicingOpen(false);
    setGamePortalOpen(false);
    setGamePortalGame(null);
    setGamePortalTab("marketplace");
    setCasesPageOpen(false);
    setSelected(null);
    setResult(null);

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  };

  const closeOriginalGame = () => {
    if (opening) return;
    setOriginalGameOpen(null);
  };

  const openGamePortal = (gameSlug = null, tab = "marketplace") => {
    setOriginalGameOpen(null);
    if (opening) return;
    setGameMenuOpen(false);
    setOriginalsMenuOpen(false);
    setJackpotPageOpen(false);
    setProfileOpen(false);
    setColorDicingOpen(false);
    setCasesPageOpen(false);
    setSelected(null);
    setResult(null);
    setGamePortalGame(gameSlug);
    setGamePortalTab(tab);
    setGamePortalOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeGamePortal = () => {
    if (opening) return;
    setGamePortalOpen(false);
    setGamePortalGame(null);
    setGamePortalTab("marketplace");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeAllOverlaysForNavigation = () => {
    setOriginalGameOpen(null);
    if (opening) return false;
    stopReelSound();
    setJackpotPageOpen(false);
    setGameMenuOpen(false);
    setOriginalsMenuOpen(false);
    setGamePortalOpen(false);
    setGamePortalGame(null);
    setGamePortalTab("marketplace");
    setColorDicingOpen(false);
    setCasesPageOpen(false);
    setSelected(null);
    setResult(null);
    setWonInventoryId(null);
    setReelItems([]);
    setReelWinningReward(null);
    setReelTarget(null);
    setReelAnimating(false);
    return true;
  };

  const openCaseFromGamePortal = async (gameCase) => {
    if (opening || !gameCase?.id) return;

    gamePortalReturnGameRef.current =
      gamePortalGame ||
      gameCase.game_slug ||
      "steal-a-brainrot";

    setResult(null);
    setWonInventoryId(null);
    setReelItems([]);
    setReelWinningReward(null);
    setReelTarget(null);
    setReelAnimating(false);

    try {
      const response = await apiFetch(`${API}/api/cases/${gameCase.id}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load case"
        );
      }

      const rewards = Array.isArray(data.items)
        ? data.items.map((item) => ({
            ...item,
            id: Number(item.id),
            value_cents: Number(
              item.value_cents ?? item.valueCents ?? 0
            ),
            valueCents: Number(
              item.value_cents ?? item.valueCents ?? 0
            ),
            image_url:
              item.image_url ??
              item.imageUrl ??
              "",
            imageUrl:
              item.image_url ??
              item.imageUrl ??
              "",
          }))
        : [];

      const normalizedCase = {
        ...gameCase,
        ...(data.case || {}),
        price:
          Number(
            data.case?.price_cents ??
              gameCase.price_cents ??
              0
          ) / 100,
        price_cents: Number(
          data.case?.price_cents ??
            gameCase.price_cents ??
            0
        ),
        image_url:
          data.case?.image_url ??
          gameCase.image_url ??
          gameCase.imageUrl ??
          "",
        items: rewards,
      };

      /*
       * The browser View Transition API captures the old portal UI,
       * applies both state changes in one update, and then crossfades
       * directly into the existing CaseX case page.
       */
      saveCasexCaseSnapshot(normalizedCase);

      runSmoothPageTransition(() => {
        setSelected(normalizedCase);
        setGamePortalOpen(false);
        setGamePortalGame(null);
        setGamePortalTab("marketplace");

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      });
    } catch (error) {
      console.error(
        "Game portal case preview failed:",
        error
      );
      alert(
        error?.message ||
          "Failed to load this case."
      );
    }
  };

  const openCasesPage = () => {
    setColorDicingOpen(false);
    setJackpotPageOpen(false);
    if (opening) return;
    setSelected(null);
    setResult(null);
    setWonInventoryId(null);
    setReelItems([]);
    setReelWinningReward(null);
    setReelTarget(null);
    setReelAnimating(false);
    setCasesPageOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeCasesPage = () => {
    if (opening) return;
    setCasesPageOpen(false);
    setSelected(null);
    setResult(null);
    setWonInventoryId(null);
    setReelItems([]);
    setReelWinningReward(null);
    setReelTarget(null);
    setReelAnimating(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeCasePage = () => {
    if (opening) return;

    stopReelSound();

    const returnGame = gamePortalReturnGameRef.current;

    runSmoothPageTransition(() => {
      setSelected(null);
      setResult(null);
      setWonInventoryId(null);
      setReelItems([]);
      setReelWinningReward(null);
      setReelTarget(null);
      setReelAnimating(false);

      if (returnGame) {
        setGamePortalGame(returnGame);
        setGamePortalTab("cases");
        setGamePortalOpen(true);
        gamePortalReturnGameRef.current = null;
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });
  };

  const activeItems = selected?.items || [];

  const inventoryValue =
    inventory.reduce(
      (total, item) =>
        total +
        Number(
          item.value_cents || 0
        ),
      0
    );

  const totalDepositedCents = transactions.reduce(
    (total, tx) =>
      total +
      (tx.type === "deposit"
        ? Math.abs(Number(tx.amount_cents || 0))
        : 0),
    0
  );

  const totalWithdrawnCents = transactions.reduce(
    (total, tx) =>
      total +
      (tx.type === "withdrawal"
        ? Math.abs(Number(tx.amount_cents || 0))
        : 0),
    0
  );

  const walletQuickAmounts = [1, 5, 10, 25, 50, 100];

  const accountStats = useMemo(() => {
    const caseOpenTransactions = transactions.filter(
      (tx) => String(tx.type || "").toLowerCase() === "case_open"
    );

    const saleTransactions = transactions.filter(
      (tx) => String(tx.type || "").toLowerCase() === "item_sale"
    );

    const totalSpentCents = caseOpenTransactions.reduce(
      (total, tx) => total + Math.abs(Number(tx.amount_cents || 0)),
      0
    );

    const totalSalesCents = saleTransactions.reduce(
      (total, tx) => total + Math.max(0, Number(tx.amount_cents || 0)),
      0
    );

    const currentInventoryValueCents = inventory.reduce(
      (total, item) =>
        total + Math.max(0, Number(item.value_cents || 0)),
      0
    );

    const biggestSoldWinCents = saleTransactions.reduce(
      (max, tx) => Math.max(max, Math.max(0, Number(tx.amount_cents || 0))),
      0
    );

    const biggestCurrentWinCents = inventory.reduce(
      (max, item) =>
        Math.max(max, Math.max(0, Number(item.value_cents || 0))),
      0
    );

    const createdAt = authUser?.created_at
      ? new Date(authUser.created_at)
      : null;

    const accountAgeDays =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - createdAt.getTime()) /
                86400000
            )
          )
        : null;

    const withdrawalCounts = itemWithdrawalHistory.reduce(
      (counts, withdrawal) => {
        const status = String(
          withdrawal.status || "pending"
        ).toLowerCase();

        if (status === "completed") {
          counts.delivered += 1;
        } else if (status === "cancelled") {
          counts.cancelled += 1;
        } else {
          counts.pending += 1;
        }

        return counts;
      },
      { pending: 0, delivered: 0, cancelled: 0 }
    );

    const pendingWithdrawalValueCents = itemWithdrawalHistory.reduce(
      (total, withdrawal) =>
        String(withdrawal.status || "pending").toLowerCase() === "pending"
          ? total + Math.max(0, Number(withdrawal.value_cents || 0))
          : total,
      0
    );

    return {
      casesOpened: caseOpenTransactions.length,
      totalSpentCents,
      totalSalesCents,
      currentInventoryValueCents,
      totalRewardsValueCents:
        totalSalesCents + currentInventoryValueCents,
      biggestWinCents: Math.max(
        biggestSoldWinCents,
        biggestCurrentWinCents
      ),
      itemsOwned: inventory.length,
      accountAgeDays,
      withdrawalCounts,
      pendingWithdrawalValueCents,
    };
  }, [
    transactions,
    inventory,
    itemWithdrawalHistory,
    authUser?.created_at,
  ]);

  const inventoryFilters = [
    "All",
    "Common",
    "Rare",
    "Epic",
    "Legendary",
    "Secret",
  ];

  const visibleInventory = [
    ...inventory,
  ]
    .filter(
      (item) =>
        String(item.status || "owned").toLowerCase() === "owned" &&
        (inventoryFilter === "All" ||
          item.rarity === inventoryFilter)
    )
    .sort((a, b) => {
      if (
        inventorySort ===
        "value-high"
      ) {
        return (
          Number(
            b.value_cents || 0
          ) -
          Number(
            a.value_cents || 0
          )
        );
      }

      if (
        inventorySort ===
        "value-low"
      ) {
        return (
          Number(
            a.value_cents || 0
          ) -
          Number(
            b.value_cents || 0
          )
        );
      }

      if (
        inventorySort === "rarity"
      ) {
        const order = {
          Secret: 5,
          Legendary: 4,
          Epic: 3,
          Rare: 2,
          Common: 1,
        };

        return (
          (order[b.rarity] || 0) -
          (order[a.rarity] || 0)
        );
      }

      return (
        Number(b.id || 0) -
        Number(a.id || 0)
      );
    });

  const selectedInventoryItems =
    inventory.filter(
      (item) =>
        String(item.status || "owned").toLowerCase() ===
          "owned" &&
        selectedInventoryIds.has(
          Number(item.id)
        )
    );

  const selectedInventoryValue =
    selectedInventoryItems.reduce(
      (total, item) =>
        total +
        Number(
          item.value_cents || 0
        ),
      0
    );

  const toggleInventorySelection = (
    itemId
  ) => {
    const numericId = Number(itemId);

    setSelectedInventoryIds(
      (current) => {
        const next = new Set(current);

        if (next.has(numericId)) {
          next.delete(numericId);
        } else {
          next.add(numericId);
        }

        return next;
      }
    );
  };

  const selectAllVisibleInventory = () => {
    setSelectedInventoryIds(
      (current) => {
        const next = new Set(
          current
        );

        visibleInventory.forEach(
          (item) => {
            if (
              String(item.status || "owned").toLowerCase() ===
              "owned"
            ) {
              next.add(Number(item.id));
            }
          }
        );

        return next;
      }
    );
  };

  const clearInventorySelection = () => {
    setSelectedInventoryIds(
      new Set()
    );
  };

  const sellSelectedInventory =
    async () => {
      if (
        !selectedInventoryItems.length ||
        bulkSellLoading
      ) {
        return;
      }

      setBulkSellLoading(true);

      try {
        const response =
          await apiFetch(
            `${API}/api/me/inventory/bulk-sell`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                inventoryIds:
                  selectedInventoryItems.map(
                    (item) => item.id
                  ),
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to sell selected items"
          );
        }

        setBalance(
          Number(
            data.newBalanceCents
          ) / 100
        );

        await loadInventory();
        await loadTransactions();

        setSelectedInventoryIds(
          new Set()
        );

        setInventorySelectMode(
          false
        );

        setBulkSellConfirm(
          false
        );
      } catch (error) {
        console.error(
          "Bulk sell failed:",
          error
        );

        alert(error.message);

        await loadInventory();
        await loadTransactions();
      } finally {
        setBulkSellLoading(false);
      }
    };

  const sortedCreatorUsers = useMemo(() => {
    const users = Array.isArray(creatorDashboard?.referredUsers)
      ? [...creatorDashboard.referredUsers]
      : [];

    return users.sort((a, b) => {
      if (creatorUserSort === "volume-asc") {
        return Number(a.volumeCents || 0) - Number(b.volumeCents || 0);
      }

      if (creatorUserSort === "cases-desc") {
        return (
          Number(b.caseOpens || 0) - Number(a.caseOpens || 0)
        ) || (
          Number(b.volumeCents || 0) - Number(a.volumeCents || 0)
        );
      }

      if (creatorUserSort === "newest") {
        return (
          new Date(b.joinedAt || 0).getTime() -
          new Date(a.joinedAt || 0).getTime()
        ) || (
          Number(b.volumeCents || 0) - Number(a.volumeCents || 0)
        );
      }

      return (
        Number(b.volumeCents || 0) - Number(a.volumeCents || 0)
      ) || (
        Number(b.caseOpens || 0) - Number(a.caseOpens || 0)
      );
    });
  }, [creatorDashboard?.referredUsers, creatorUserSort]);

  return (
    <div className="app">
      <style>{`
        /* CASEX WALLET — exact centering for Deposit / Withdraw / History */
        .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium{
          display:grid !important;
          grid-template-columns:repeat(3,minmax(0,1fr)) !important;
          align-items:stretch !important;
          width:100% !important;
        }

        .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button{
          position:relative !important;
          width:100% !important;
          min-width:0 !important;
          min-height:56px !important;
          height:56px !important;
          margin:0 !important;
          padding:0 10px !important;
          display:grid !important;
          place-items:center !important;
          align-content:center !important;
          justify-items:center !important;
          text-align:center !important;
        }

        .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button > span{
          display:block !important;
          width:100% !important;
          margin:0 !important;
          padding:0 !important;
          line-height:1 !important;
          text-align:center !important;
          font-size:12px !important;
          font-weight:850 !important;
        }

        .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button > small{
          display:none !important;
        }

        .wallet-modal-backdrop .wallet-premium-header-compact{
          min-height:28px !important;
          align-items:center !important;
          margin-bottom:14px !important;
        }

        .wallet-modal-backdrop .wallet-premium-header-compact .eyebrow{
          margin:0 !important;
        }

        /* Remove the inner outline around the generated deposit selector. */
        .wallet-modal-backdrop .casex-clean-select-live{
          outline:0 !important;
        }

        .wallet-modal-backdrop .casex-clean-select-live select,
        .wallet-modal-backdrop .casex-clean-select-live select:focus,
        .wallet-modal-backdrop .casex-clean-select-live select:focus-visible{
          border:0 !important;
          outline:0 !important;
          box-shadow:none !important;
          background:transparent !important;
        }
      `}</style>

        <style>{`
          .color-dicing-page-wrap{
            position:relative;
            min-height:calc(100vh - 76px);
            padding:30px 22px 80px;
            background:
              radial-gradient(circle at 50% 0%, rgba(139,92,246,.14), transparent 42%),
              #080a10;
          }
          .color-dicing-back{
            display:inline-flex;
            align-items:center;
            min-height:40px;
            padding:0 14px;
            margin:0 auto 18px;
            border:1px solid rgba(255,255,255,.10);
            border-radius:10px;
            background:rgba(255,255,255,.035);
            color:#d9d4e6;
            font:800 12px/1 inherit;
            cursor:pointer;
          }
          .color-dicing-back:hover{
            border-color:rgba(176,132,255,.45);
            background:rgba(176,132,255,.08);
          }
          .color-dicing-page{
            width:min(1180px,100%);
            margin:0 auto;
          }
          .color-dicing-shell{
            border:1px solid rgba(255,255,255,.08);
            border-radius:22px;
            background:linear-gradient(145deg,rgba(20,23,33,.96),rgba(10,12,18,.98));
            box-shadow:0 28px 80px rgba(0,0,0,.42);
            overflow:hidden;
          }
          .color-dicing-header{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:20px;
            padding:30px 32px;
            border-bottom:1px solid rgba(255,255,255,.07);
          }
          .color-dicing-header h1{
            margin:5px 0 7px;
            font-size:clamp(30px,4vw,48px);
            line-height:1;
          }
          .color-dicing-header p{
            margin:0;
            color:#9793a5;
            font-size:14px;
          }
          .color-dicing-live{
            display:inline-flex;
            align-items:center;
            gap:7px;
            padding:8px 11px;
            border:1px solid rgba(74,222,128,.22);
            border-radius:999px;
            color:#9af0b3;
            background:rgba(74,222,128,.06);
            font-size:10px;
            font-weight:900;
            letter-spacing:1.2px;
          }
          .color-dicing-live span{
            width:7px;
            height:7px;
            border-radius:50%;
            background:#4ade80;
            box-shadow:0 0 12px rgba(74,222,128,.8);
          }
          .color-dicing-layout{
            display:grid;
            grid-template-columns:minmax(0,1.55fr) minmax(290px,.75fr);
            gap:18px;
            padding:18px;
          }
          .color-dicing-board{
            min-width:0;
            padding:24px;
            border:1px solid rgba(255,255,255,.07);
            border-radius:18px;
            background:rgba(7,9,14,.72);
            text-align:center;
          }
          .color-dicing-board-top{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:15px;
            text-align:left;
          }
          .color-dicing-board-top > div{
            display:flex;
            flex-direction:column;
            gap:5px;
          }
          .color-dicing-label,
          .color-dicing-bet-display span{
            color:#777286;
            font-size:9px;
            font-weight:900;
            letter-spacing:1.4px;
          }
          .color-dicing-board-top strong{
            font-size:17px;
          }
          .color-dicing-bet-display{
            text-align:right;
          }
          .color-dicing-bet-display strong{
            color:#fff;
          }
          .color-dice-row{
            display:grid;
            grid-template-columns:repeat(4,minmax(80px,1fr));
            gap:16px;
            max-width:760px;
            margin:48px auto 30px;
          }
          .color-die{
            aspect-ratio:1;
            padding:8px;
            border-radius:19px;
            background:
              radial-gradient(circle at 30% 22%,rgba(255,255,255,.32),transparent 24%),
              linear-gradient(145deg,var(--die-color),rgba(0,0,0,.52));
            box-shadow:
              0 16px 30px rgba(0,0,0,.38),
              0 0 28px color-mix(in srgb,var(--die-color) 28%,transparent);
            transform:translateY(0) rotate(0deg);
          }
          .color-die-face{
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            border:1px solid rgba(255,255,255,.30);
            border-radius:13px;
            background:rgba(255,255,255,.07);
            box-shadow:inset 0 0 22px rgba(0,0,0,.20);
          }
          .color-die-dot{
            width:25%;
            aspect-ratio:1;
            border-radius:50%;
            background:rgba(255,255,255,.88);
            box-shadow:0 3px 12px rgba(0,0,0,.32);
          }
          .color-dice-row.rolling .color-die{
            animation:colorDiceShake .12s linear infinite alternate;
          }
          @keyframes colorDiceShake{
            from{transform:translateY(-4px) rotate(-3deg) scale(.97)}
            to{transform:translateY(4px) rotate(3deg) scale(1.03)}
          }
          .color-dice-row.rolling .color-die:nth-child(1){animation-delay:-.02s}
          .color-dice-row.rolling .color-die:nth-child(2){animation-delay:-.07s}
          .color-dice-row.rolling .color-die:nth-child(3){animation-delay:-.11s}
          .color-dice-row.rolling .color-die:nth-child(4){animation-delay:-.16s}
          .color-dice-row.landed-win .color-die{
            animation:colorDiceWin .48s cubic-bezier(.2,.9,.25,1) both;
          }
          .color-dice-row.landed-win .color-die:nth-child(2){animation-delay:.05s}
          .color-dice-row.landed-win .color-die:nth-child(3){animation-delay:.1s}
          .color-dice-row.landed-win .color-die:nth-child(4){animation-delay:.15s}
          .color-dice-row.landed-loss .color-die{
            animation:colorDiceLoss .34s ease both;
          }
          @keyframes colorDiceWin{
            0%{transform:translateY(8px) scale(.94) rotate(-4deg)}
            55%{transform:translateY(-10px) scale(1.06) rotate(3deg)}
            100%{transform:translateY(0) scale(1) rotate(0)}
          }
          @keyframes colorDiceLoss{
            0%,100%{transform:translateX(0)}
            25%{transform:translateX(-5px)}
            75%{transform:translateX(5px)}
          }
          @media(prefers-reduced-motion:reduce){
            .color-dice-row.rolling .color-die,
            .color-dice-row.landed-win .color-die,
            .color-dice-row.landed-loss .color-die{animation:none}
          }
          .color-dicing-match{
            display:flex;
            flex-direction:column;
            gap:4px;
            margin-bottom:18px;
          }
          .color-dicing-match span{
            color:#777286;
            font-size:9px;
            font-weight:900;
            letter-spacing:1.5px;
          }
          .color-dicing-match strong{
            color:#f4efff;
            font-size:17px;
          }

          .mines-page-wrap{
            position:relative;
            min-height:calc(100vh - 76px);
            padding:10px 0 34px;
            background:
              radial-gradient(circle at 50% 5%,#171229 0%,#090a10 40%,#07080c 100%);
          }
          .mines-back{
            display:block;
            width:min(1120px,90vw);
            margin:0 auto 10px;
            border:1px solid #2d2f3a;
            background:#11121a;
            color:#d9dae2;
            border-radius:11px;
            padding:10px 15px;
            font-weight:700;
          }
          .mines-shell{width:min(1120px,90vw);margin:0 auto}
          .mines-header{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:18px 4px 17px;border-bottom:1px solid #242530}
          .mines-header h1{margin:0;font-size:34px;line-height:1;letter-spacing:-2px}
          .mines-header p{margin:8px 0 0;color:#858895;font-size:11px}
          .mines-live{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(74,222,128,.25);border-radius:999px;background:rgba(74,222,128,.06);color:#63e89d;font-size:10px;font-weight:900;letter-spacing:1px}
          .mines-live span{width:7px;height:7px;border-radius:50%;background:#44df8c;box-shadow:0 0 12px #44df8c}
          .mines-layout{display:grid;grid-template-columns:280px minmax(0,1fr);gap:18px;padding-top:14px}
          .mines-controls-card,.mines-board,.mines-stats-bar,.mines-recent-card{border:1px solid #242630;border-radius:18px;background:linear-gradient(160deg,#11121a,#090a0f);box-shadow:0 22px 60px #0005}
          .mines-controls-card{padding:18px;align-self:start}
          .mines-control-block + .mines-control-block{margin-top:13px}
          .mines-grid-options{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
          .mines-grid-options button{height:40px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.025);color:#aaa6b4;font-size:11px;font-weight:900;cursor:pointer}
          .mines-grid-options button.active{border-color:#a56cff;background:rgba(157,108,255,.12);color:#fff;box-shadow:0 0 0 1px rgba(157,108,255,.2),0 0 25px rgba(126,78,222,.12)}
          .mines-grid-options button:disabled{cursor:not-allowed;opacity:.62}
          .mines-select-wrap{position:relative;margin-top:10px}
          .mines-select{width:100%;height:42px;padding:0 12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:#141620;color:#fff;outline:none;font:800 13px/1 inherit;display:flex;align-items:center;justify-content:space-between;text-align:left;cursor:pointer}
          .mines-select:hover:not(:disabled),.mines-select.open{border-color:rgba(176,132,255,.42);box-shadow:0 0 0 1px rgba(157,108,255,.1)}
          .mines-select:disabled{cursor:not-allowed;opacity:.62}
          .mines-select-arrow{color:#8e879c;font-size:16px;line-height:1;transform:translateY(-1px)}
          .mines-select.open .mines-select-arrow{transform:rotate(180deg) translateY(1px)}
          .mines-options-menu{position:absolute;z-index:40;top:calc(100% + 6px);left:0;right:0;max-height:240px;overflow-y:auto;padding:5px;border:1px solid rgba(176,132,255,.22);border-radius:10px;background:linear-gradient(180deg,#171925,#10111a);box-shadow:0 18px 40px rgba(0,0,0,.5)}
          .mines-option{display:flex;width:100%;min-height:34px;align-items:center;justify-content:flex-start;padding:0 10px;border:1px solid transparent;border-radius:7px;background:transparent;color:#a6a1af;font:800 12px/1 inherit;cursor:pointer;text-align:left}
          .mines-option:hover,.mines-option.active{background:rgba(157,108,255,.11);border-color:rgba(176,132,255,.16);color:#fff}
          .mines-input-wrap{display:flex;align-items:center;gap:6px;height:42px;margin-top:10px;padding:0 12px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(0,0,0,.18)}
          .mines-input-wrap span{color:#777286;font-size:14px;font-weight:900}
          .mines-input-wrap input{width:100%;border:0;outline:0;background:transparent;color:#fff;font:800 14px/1 inherit}
          .mines-quick-bets{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:8px}
          .mines-quick-bets button{min-height:31px;border:1px solid rgba(255,255,255,.07);border-radius:7px;background:rgba(255,255,255,.025);color:#8f899b;font-size:9px;font-weight:800}
          .mines-quick-bets button:hover:not(:disabled){color:#fff;border-color:rgba(176,132,255,.3)}
          .mines-odds-box{margin-top:12px;padding:10px 11px;border:1px solid rgba(157,108,255,.14);border-radius:10px;background:rgba(157,108,255,.045);display:grid;grid-template-columns:1fr 1fr;gap:8px}
          .mines-odds-box div{display:flex;flex-direction:column;gap:3px}
          .mines-odds-box span{color:#6f6a79;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.7px}
          .mines-odds-box strong{color:#c9b5ff;font-size:11px;font-weight:950}
          .mines-odds-note{width:100%;max-width:520px;text-align:center;color:#706b7c;font-size:9px;line-height:1.4}
          .mines-odds-note strong{color:#a98cff;font-weight:900}
          .mines-start-button{width:100%;height:46px;margin-top:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#9d6cff,#7042d2);color:#fff;font-size:12px;font-weight:950;letter-spacing:1px;box-shadow:0 12px 30px rgba(126,78,222,.25)}
          .mines-main-column{min-width:0;display:flex;flex-direction:column;gap:14px}
          .mines-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:14px;aspect-ratio:1/1;max-width:520px;margin:0 auto;width:100%;background:radial-gradient(circle at 50% 0,#151229,#0a0b11 55%,#08090d)}
          .mines-board{position:relative}
          .mines-result-overlay{position:absolute;left:50%;top:50%;z-index:5;transform:translate(-50%,-50%);min-width:132px;padding:14px 18px 13px;border:2px solid #1dff35;border-radius:10px;background:rgba(9,24,19,.94);box-shadow:0 0 0 1px rgba(29,255,53,.14),0 0 28px rgba(29,255,53,.2),0 18px 40px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;pointer-events:none;backdrop-filter:blur(4px)}
          .mines-result-overlay::after{content:"";position:absolute;left:50%;top:58%;width:34px;height:3px;transform:translate(-50%,-50%);background:#1e3b40;border-radius:99px}
          .mines-result-overlay strong{color:#18ff35;font-size:25px;line-height:1;font-weight:950;letter-spacing:-.7px}
          .mines-result-overlay span{margin-top:8px;color:#1dff35;font-size:12px;font-weight:950;letter-spacing:.2px}

          .mines-board-3{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
          .mines-board-7{grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
          .mines-tile{min-width:0;border:1px solid rgba(154,133,204,.34);border-radius:10px;background:linear-gradient(145deg,#1b1e31,#10131f);color:#c7c1d6;font-size:28px;font-weight:900;box-shadow:inset 0 0 25px rgba(157,108,255,.04),0 7px 16px #0005;transition:.16s ease;cursor:pointer}
          .mines-tile:hover:not(:disabled){transform:translateY(-2px);border-color:rgba(177,133,255,.72);box-shadow:inset 0 0 30px rgba(157,108,255,.1),0 10px 24px #0007}
          .mines-tile.revealed{color:#9f7cff;background:linear-gradient(145deg,#24194a,#141021);border-color:rgba(168,124,255,.6);box-shadow:inset 0 0 30px rgba(157,108,255,.18),0 0 22px rgba(157,108,255,.08)}
          .mines-tile.mine{color:#ff7b7b;background:linear-gradient(145deg,#401b2b,#1b1018);border-color:rgba(255,100,120,.6);box-shadow:inset 0 0 30px rgba(255,87,112,.18),0 0 22px rgba(255,87,112,.08)}
          .mines-tile.is-revealing{transform:scale(.96);opacity:.7}
          .mines-board.is-active .mines-tile:not(:disabled):hover{transform:translateY(-2px) scale(1.015)}
          .mines-cashout-button{background:linear-gradient(135deg,#22c55e,#159447);box-shadow:0 12px 30px rgba(34,197,94,.16)}
          .mines-error{margin-top:10px;padding:9px 10px;border:1px solid rgba(248,113,113,.24);border-radius:9px;background:rgba(248,113,113,.05);color:#ff8b8b;font-size:9px;line-height:1.4}
          .mines-recent-table-wrap{overflow:auto}
          .mines-recent-table{width:100%;border-collapse:collapse;min-width:650px}
          .mines-recent-table th,.mines-recent-table td{padding:11px 10px;border-bottom:1px solid #1e2029;text-align:left;font-size:10px;white-space:nowrap}
          .mines-recent-table th{color:#777283;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.7px}
          .mines-recent-table td{color:#d2ceda}
          .mines-history-multiplier{color:#b895ff !important;font-weight:900}
          .mines-history-win{color:#4ade80 !important;font-weight:900}
          .mines-history-loss{color:#ff7b7b !important;font-weight:900}
          .mines-tile:disabled{cursor:default}
          .mines-board-7 .mines-tile{font-size:20px;border-radius:9px}
          .mines-board{min-height:0}
          .mines-main-column{align-items:center}
          .mines-stats-bar{width:100%;max-width:520px}
          .mines-stats-bar{display:grid;grid-template-columns:repeat(3,1fr);padding:16px 8px}
          .mines-stats-bar > div{text-align:center;padding:2px 16px;border-right:1px solid #252732}
          .mines-stats-bar > div:last-child{border-right:0}
          .mines-stats-bar span{display:block;color:#7f7a8a;font-size:10px;font-weight:700}
          .mines-stats-bar strong{display:block;margin-top:5px;color:#fff;font-size:21px;font-weight:950}
          .mines-stats-bar > div:nth-child(2) strong{color:#a57cff}
          .mines-recent-card{margin-top:16px;padding:18px}
          .mines-card-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding-bottom:16px;border-bottom:1px solid #20222b}
          .mines-card-heading h2{margin:0;font-size:24px;letter-spacing:-.8px}
          .mines-card-muted{color:#6d6878;font-size:10px}
          .mines-recent-empty{min-height:160px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;text-align:center}
          .mines-recent-empty span{color:#8d6eff;font-size:26px}
          .mines-recent-empty strong{font-size:13px}
          .mines-recent-empty small{color:#6d6878;font-size:10px}
          @media(max-width:900px){
            .mines-layout{grid-template-columns:1fr}
            .mines-controls-card{order:2}
            .mines-main-column{order:1}
          }
          @media(max-width:600px){
            .mines-page-wrap{padding:12px 0 50px}
            .mines-shell{width:calc(100% - 20px)}
            .mines-header{padding:18px 2px}
            .mines-header h1{font-size:34px}
            .mines-live{display:none}
            .mines-board{gap:6px;padding:10px}
            .mines-board-3{gap:8px}
            .mines-board-7{gap:4px}
            .mines-tile{font-size:21px;border-radius:8px}
            .mines-board-7 .mines-tile{font-size:15px;border-radius:6px}
            .mines-stats-bar strong{font-size:17px}
            .mines-card-heading{align-items:flex-start;flex-direction:column}
          }
          .color-dicing-result{
            display:flex;
            flex-direction:column;
            gap:4px;
            width:min(560px,100%);
            margin:0 auto 16px;
            padding:13px 16px;
            border:1px solid rgba(255,255,255,.08);
            border-radius:12px;
            background:rgba(255,255,255,.025);
          }
          .color-dicing-result strong{font-size:14px}
          .color-dicing-result span{font-size:11px;color:#918c9f}
          .color-dicing-result.win{border-color:rgba(74,222,128,.28)}
          .color-dicing-result.win strong{color:#74e99a}
          .color-dicing-result.loss{border-color:rgba(239,68,68,.25)}
          .color-dicing-result.loss strong{color:#fb7777}
          .color-dicing-result.reroll{border-color:rgba(250,204,21,.25)}
          .color-dicing-result.reroll strong{color:#f7d65d}
          .color-dicing-result.error{border-color:rgba(248,113,113,.25)}
          .color-dicing-result.error strong{color:#fb8787}
          .color-dicing-actions{\n            width:min(560px,100%);\n            display:grid;\n            grid-template-columns:1fr auto;\n            gap:10px;\n            margin:0 auto;\n          }\n          .color-dicing-demo-roll{\n            height:50px;\n            padding:0 18px;\n            border:1px solid rgba(255,255,255,.12);\n            border-radius:12px;\n            background:rgba(255,255,255,.045);\n            color:#c9c3d3;\n            font-size:11px;\n            font-weight:950;\n            letter-spacing:1px;\n            cursor:pointer;\n            transition:.2s ease;\n          }\n          .color-dicing-demo-roll:hover:not(:disabled){\n            border-color:rgba(168,124,255,.42);\n            background:rgba(157,108,255,.10);\n            color:#fff;\n            transform:translateY(-1px);\n          }\n          .color-dicing-demo-roll:disabled{\n            opacity:.58;\n            cursor:not-allowed;\n          }\n          .color-dicing-demo-badge{\n            display:block;\n            margin-bottom:5px;\n            color:#a98cff;\n            font-size:9px;\n            font-weight:950;\n            letter-spacing:1.3px;\n          }\n          @media (max-width:700px){\n            .color-dicing-actions{\n              grid-template-columns:1fr;\n            }\n          }\n          .color-dicing-roll{
            width:min(560px,100%);
            height:50px;
            border:0;
            border-radius:12px;
            background:linear-gradient(135deg,#9d6cff,#7042d2);
            color:#fff;
            font-size:12px;
            font-weight:950;
            letter-spacing:1.2px;
            cursor:pointer;
            box-shadow:0 12px 30px rgba(126,78,222,.25);
          }
          .color-dicing-roll:hover:not(:disabled){
            filter:brightness(1.08);
            transform:translateY(-1px);
          }
          .color-dicing-roll:disabled{
            opacity:.58;
            cursor:not-allowed;
          }
          .color-dicing-demo-note{
            max-width:560px;
            margin:12px auto 0;
            color:#666172;
            font-size:10px;
            line-height:1.5;
          }
          .color-dicing-sidebar{
            display:flex;
            flex-direction:column;
            gap:18px;
          }
          .color-dicing-bet-main-row{
            grid-template-columns:minmax(0,1fr) 126px;
          }
          .color-dicing-card{
            padding:20px;
            border:1px solid rgba(255,255,255,.07);
            border-radius:17px;
            background:rgba(255,255,255,.025);
          }
          .color-dicing-colors{
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:8px;
            margin-top:13px;
          }
          .color-dicing-color{
            display:flex;
            align-items:center;
            gap:9px;
            min-height:42px;
            padding:0 10px;
            border:1px solid rgba(255,255,255,.07);
            border-radius:10px;
            background:rgba(255,255,255,.025);
            color:#aaa5b5;
            font-size:11px;
            font-weight:800;
            cursor:pointer;
          }
          .color-dicing-color:hover:not(:disabled){
            border-color:rgba(255,255,255,.16);
          }
          .color-dicing-color.active{
            border-color:rgba(255,255,255,.28);
            background:rgba(255,255,255,.07);
            color:#fff;
            box-shadow:inset 0 0 0 1px rgba(255,255,255,.03);
          }
          .color-dicing-color-dot{
            width:13px;
            height:13px;
            flex-shrink:0;
            border-radius:50%;
            box-shadow:0 0 12px color-mix(in srgb,currentColor 35%,transparent);
          }
          .color-dicing-input-wrap{
            display:flex;
            align-items:center;
            gap:6px;
            height:46px;
            margin-top:13px;
            padding:0 12px;
            border:1px solid rgba(255,255,255,.09);
            border-radius:10px;
            background:rgba(0,0,0,.18);
          }
          .color-dicing-input-wrap span{
            color:#777286;
            font-size:14px;
            font-weight:900;
          }
          .color-dicing-input-wrap input{
            width:100%;
            border:0;
            outline:0;
            background:transparent;
            color:#fff;
            font:800 14px/1 inherit;
          }
          .color-dicing-bet-main-row{
            display:grid;
            grid-template-columns:minmax(0,1fr) 132px;
            gap:6px;
            margin-top:13px;
            align-items:stretch;
          }
          .color-dicing-bet-main-row .color-dicing-input-wrap{
            margin-top:0;
          }
          .color-dicing-bet-shortcuts{
            display:grid;
            grid-template-columns:repeat(3,1fr);
            min-width:0;
            height:46px;
            border:1px solid rgba(255,255,255,.09);
            border-radius:10px;
            overflow:hidden;
            background:rgba(255,255,255,.025);
          }
          .color-dicing-bet-shortcuts button{
            min-width:0;
            height:100%;
            padding:0;
            border:0;
            border-right:1px solid rgba(255,255,255,.07);
            background:transparent;
            color:#8f899b;
            font-size:9px;
            font-weight:850;
            line-height:1;
            text-align:center;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
          }
          .color-dicing-bet-shortcuts button:last-child{
            border-right:0;
          }
          .color-dicing-bet-shortcuts button:hover:not(:disabled){
            color:#fff;
            background:rgba(157,108,255,.12);
          }
          .color-dicing-bet-shortcuts button:disabled{
            opacity:.55;
            cursor:default;
          }
          .color-dicing-rules{
            display:flex;
            flex-direction:column;
            gap:7px;
            margin-top:13px;
          }
          .color-dicing-rules > div{
            display:flex;
            align-items:center;
            justify-content:space-between;
            min-height:32px;
            padding:0 10px;
            border-radius:8px;
            background:rgba(255,255,255,.025);
          }
          .color-dicing-rules span{
            color:#9993a5;
            font-size:10px;
            font-weight:700;
          }
          .color-dicing-rules strong{
            color:#d9c6ff;
            font-size:10px;
            letter-spacing:.6px;
          }
          .color-dicing-rules strong.loss{color:#f87171}
          .color-dicing-rules strong.reroll{color:#facc15}
          .color-dicing-rules strong.win{color:#6ee7a0}
          .color-dicing-example{
            margin-top:12px;
            padding-top:12px;
            border-top:1px solid rgba(255,255,255,.06);
          }
          .color-dicing-example > span{
            color:#6f6979;
            font-size:9px;
          }
          .color-dicing-example > div{
            display:flex;
            justify-content:space-between;
            gap:8px;
            margin-top:6px;
          }
          .color-dicing-example strong{
            color:#aaa3b7;
            font-size:9px;
          }
          @media(max-width:850px){
            .color-dicing-layout{grid-template-columns:1fr}
          }
          @media(max-width:600px){
            .color-dicing-page-wrap{padding:18px 10px 55px}
            .color-dicing-header{padding:22px 18px;align-items:flex-start}
            .color-dicing-header p{font-size:12px}
            .color-dicing-live{display:none}
            .color-dicing-layout{padding:10px}
            .color-dicing-board{padding:16px 12px}
            .color-dice-row{gap:7px;margin:34px auto 24px}
            .color-die{padding:5px;border-radius:12px}
            .color-die-face{border-radius:8px}
            .color-dicing-colors{grid-template-columns:repeat(3,1fr)}
            .color-dicing-color{justify-content:center;padding:0 5px}
            .color-dicing-color-dot{width:11px}
            .color-dicing-color span:last-child{font-size:9px}
            .color-dicing-example > div{flex-direction:column}
          }
        `}</style>
      {walletNotification && (
        <div
          className={`wallet-event-toast ${walletNotification.tone}`}
          role="status"
          aria-live="polite"
        >
          <div
            className="wallet-event-toast-icon"
            aria-hidden="true"
          >
            {walletNotification.icon}
          </div>

          <div className="wallet-event-toast-copy">
            <strong>{walletNotification.title}</strong>
            <span>{walletNotification.message}</span>
          </div>

          <button
            type="button"
            className="wallet-event-toast-close"
            onClick={dismissWalletNotification}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        /* ============================================================
           CASEX DESIGN 4 — FUTURISTIC GRID DASHBOARD
           Scoped to the current home app. Gameplay logic untouched.
           ============================================================ */
        .casex-design4-nav{
          position:relative;
          z-index:1200;
        }
        .casex-design4-nav .nav-actions .balance-button{display:none !important}
        .casex-design4-nav > nav{padding-right:188px;}
        .casex-d4-balance-center{
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
          display:flex;
          align-items:center;
          gap:10px;
          min-width:172px;
          height:46px;
          padding:0 13px;
          border:1px solid rgba(157,113,241,.42);
          border-radius:12px;
          background:linear-gradient(180deg,rgba(21,18,35,.96),rgba(9,10,16,.96));
          color:#fff;
          box-shadow:0 8px 24px rgba(53,26,104,.22), inset 0 1px 0 rgba(255,255,255,.035);
          cursor:pointer;
        }
        .casex-d4-balance-icon{font-size:15px;line-height:1}
        .casex-d4-balance-copy{display:flex;flex-direction:column;align-items:flex-start;line-height:1.05}
        .casex-d4-balance-copy small{color:#777a88;font-size:7px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
        .casex-d4-balance-copy strong{font-size:14px;font-weight:950;letter-spacing:-.02em}
        .casex-d4-balance-plus{margin-left:auto;color:#b98bff;font-size:16px;font-weight:900}
        .casex-design4-main{
          position:relative;
          min-height:100vh;
          padding-left:236px !important;
          background:
            radial-gradient(circle at 75% 7%,rgba(127,75,221,.14),transparent 23%),
            radial-gradient(circle at 16% 80%,rgba(56,77,156,.08),transparent 23%),
            linear-gradient(180deg,#05060a 0%,#070812 47%,#05060a 100%) !important;
        }
        .casex-design4-main::before{
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          background-image:
            linear-gradient(rgba(163,123,238,.028) 1px,transparent 1px),
            linear-gradient(90deg,rgba(163,123,238,.028) 1px,transparent 1px);
          background-size:54px 54px;
          mask-image:linear-gradient(to bottom,rgba(0,0,0,.85),transparent 94%);
        }
        .casex-d4-sidebar{
          position:fixed;
          left:0;
          top:74px;
          bottom:0;
          width:236px;
          padding:18px 14px 16px;
          box-sizing:border-box;
          border-right:1px solid rgba(92,84,125,.2);
          background:linear-gradient(180deg,rgba(10,11,17,.98),rgba(7,8,13,.98));
          box-shadow:12px 0 32px rgba(0,0,0,.12);
          z-index:1100;
          overflow:auto;
        }
        .casex-d4-sidebar-head{display:flex;align-items:center;gap:10px;padding:6px 8px 18px}
        .casex-d4-sidebar-logo{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#7548df,#a471ff);box-shadow:0 10px 25px rgba(118,67,218,.22);font-size:17px;font-weight:950}
        .casex-d4-sidebar-head strong{display:block;color:#f6f3fa;font-size:13px;letter-spacing:.02em}
        .casex-d4-sidebar-head small{display:block;margin-top:2px;color:#6f7180;font-size:7px;font-weight:900;letter-spacing:.18em}
        .casex-d4-side-label{margin:10px 8px 7px;color:#636676;font-size:7px;font-weight:950;letter-spacing:.18em}
        .casex-d4-side-link,.casex-d4-side-game{
          width:100%;
          border:0;
          border-radius:9px;
          background:transparent;
          color:#a2a5b3;
          display:flex;
          align-items:center;
          text-align:left;
          cursor:pointer;
          transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease;
        }
        .casex-d4-side-link{gap:10px;padding:10px 11px;font-size:10px;font-weight:800}
        .casex-d4-side-link span{width:17px;display:inline-grid;place-items:center;color:#777b8c;font-size:12px}
        .casex-d4-side-link:hover,.casex-d4-side-link.active{background:linear-gradient(90deg,rgba(115,67,204,.28),rgba(75,40,130,.12));color:#fff}
        .casex-d4-side-link.active{box-shadow:inset 2px 0 0 #a66eff}
        .casex-d4-side-game{gap:9px;padding:7px 8px;color:#c9c6d2;font-size:9px;font-weight:800}
        .casex-d4-side-game:hover{background:rgba(255,255,255,.035);color:#fff;transform:translateX(2px)}
        .casex-d4-side-game-icon{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;font-size:14px;background:linear-gradient(145deg,#171b29,#0e1018);border:1px solid rgba(124,112,170,.23)}
        .casex-d4-side-game.dicing .casex-d4-side-game-icon{background:linear-gradient(145deg,rgba(59,79,145,.8),rgba(26,38,82,.65))}
        .casex-d4-side-game.mines .casex-d4-side-game-icon{background:linear-gradient(145deg,rgba(99,40,52,.8),rgba(45,15,28,.65))}
        .casex-d4-side-game.towers .casex-d4-side-game-icon{background:linear-gradient(145deg,rgba(45,59,148,.8),rgba(31,24,86,.65))}
        .casex-d4-side-game.plinko .casex-d4-side-game-icon{background:linear-gradient(145deg,rgba(100,39,133,.82),rgba(51,22,83,.65))}
        .casex-d4-side-game.chicken .casex-d4-side-game-icon{background:linear-gradient(145deg,rgba(126,77,28,.82),rgba(67,39,15,.64))}
        .casex-d4-side-game.coinflip .casex-d4-side-game-icon{background:linear-gradient(145deg,rgba(25,103,91,.82),rgba(10,57,50,.64))}
        .casex-d4-sidebar-spacer{min-height:18px}
        .casex-d4-sidebar-promo{margin:12px 3px 0;padding:12px 10px;border:1px solid rgba(124,102,167,.2);border-radius:11px;background:linear-gradient(145deg,rgba(36,24,61,.75),rgba(14,13,20,.8));display:flex;align-items:flex-start;gap:9px}
        .casex-d4-promo-icon{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:rgba(128,74,225,.18);color:#b98cff;font-size:14px}
        .casex-d4-sidebar-promo strong{display:block;color:#c39dff;font-size:7px;letter-spacing:.13em}
        .casex-d4-sidebar-promo small{display:block;margin-top:4px;color:#757888;font-size:7px;line-height:1.4}
        .casex-d4-content{position:relative;z-index:2;min-width:0;padding:26px 28px 48px}
        .casex-d4-content .hero{
          min-height:292px !important;
          margin:0 0 26px !important;
          padding:34px 34px 30px !important;
          grid-template-columns:1fr !important;
          max-width:none !important;
          border:1px solid rgba(110,93,149,.28) !important;
          border-radius:17px !important;
          background:
            radial-gradient(circle at 76% 30%,rgba(113,67,210,.17),transparent 27%),
            linear-gradient(145deg,#0d1019,#080a10 68%,#0b0913) !important;
          box-shadow:0 24px 70px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.025);
          overflow:hidden;
        }
        .casex-d4-content .hero::before{
          content:"";position:absolute;inset:0;pointer-events:none;opacity:.7;
          background-image:linear-gradient(rgba(151,118,226,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(151,118,226,.05) 1px,transparent 1px);
          background-size:38px 38px;
          mask-image:linear-gradient(90deg,rgba(0,0,0,.85),transparent 100%);
        }
        .casex-d4-content .hero::after{
          content:"";position:absolute;right:-90px;top:-140px;width:620px;height:520px;border-radius:50%;border:1px solid rgba(163,118,255,.12);box-shadow:0 0 0 30px rgba(129,71,221,.025),0 0 0 70px rgba(129,71,221,.016);pointer-events:none;
        }
        .casex-d4-content .hero-case{display:none !important}
        .casex-d4-content .hero-copy{position:relative;z-index:3;max-width:760px}
        .casex-d4-content .hero h1{font-size:clamp(46px,5vw,76px) !important;line-height:.93 !important;letter-spacing:-.055em !important;margin:12px 0 14px !important}
        .casex-d4-content .hero h1 span{color:#a772ff !important}
        .casex-d4-content .hero p{font-size:12px !important;color:#86899a !important;max-width:640px !important;line-height:1.55}
        .casex-d4-content .hero-cta{margin-top:18px !important;display:inline-flex !important}
        .casex-d4-content .hero-stats,.casex-d4-content .hero-trust-strip{display:none !important}

        .casex-game-hub{
          width:100% !important;
          max-width:none !important;
          margin:0 0 28px !important;
          padding:0 !important;
        }
        .casex-hub-heading{display:none !important}
        .casex-hub-heading h2,.casex-all-games-heading h2{font-size:28px !important;letter-spacing:-.045em !important;margin-top:6px !important}
        .casex-hub-heading .home-section-link,.casex-featured-games{display:none !important}
        .casex-all-games-heading{margin:0 0 14px !important}
        .casex-all-games-heading > div{display:flex;align-items:flex-end;justify-content:space-between}
        .casex-all-games{display:grid !important;grid-template-columns:repeat(6,minmax(0,1fr)) !important;gap:10px !important}
        .casex-all-games .casex-mini-game{
          position:relative !important;min-height:238px !important;padding:14px 11px 11px !important;border-radius:13px !important;border:1px solid rgba(103,94,131,.33) !important;background:linear-gradient(165deg,#11131b,#090b11) !important;overflow:hidden !important;text-align:left !important;box-shadow:0 14px 35px rgba(0,0,0,.18) !important;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease !important;
        }
        .casex-all-games .casex-mini-game::before{content:"";position:absolute;inset:0;opacity:.95;pointer-events:none;background:radial-gradient(circle at 50% 4%,rgba(132,78,255,.18),transparent 40%),linear-gradient(145deg,rgba(255,255,255,.02),transparent 35%,rgba(0,0,0,.1));}
        .casex-all-games .casex-mini-game::after{content:"";position:absolute;right:-20px;bottom:-25px;width:105px;height:105px;border-radius:50%;filter:blur(18px);opacity:.42;pointer-events:none;}
        .casex-all-games .casex-mini-game:hover{transform:translateY(-3px);border-color:rgba(150,105,232,.58) !important;box-shadow:0 22px 52px rgba(61,30,115,.25) !important}
        .casex-all-games .casex-mini-icon{position:relative;z-index:2;width:70px !important;height:70px !important;border-radius:15px !important;display:grid !important;place-items:center !important;font-size:34px !important;background:linear-gradient(145deg,#1a1e2f,#0d111a) !important;border:1px solid rgba(132,114,182,.26) !important;box-shadow:0 16px 38px rgba(0,0,0,.2) !important}
        .casex-all-games .casex-mini-game strong{position:relative;z-index:2;margin-top:14px !important;font-size:14px !important;font-weight:950 !important;letter-spacing:-.02em !important}
        .casex-all-games .casex-mini-game small{position:relative;z-index:2;margin-top:5px !important;color:#7d8190 !important;font-size:8px !important;line-height:1.35 !important}
        .casex-all-games .casex-mini-game b{position:relative;z-index:2;margin-top:auto !important;align-self:stretch !important;display:flex !important;justify-content:center !important;align-items:center !important;min-height:31px !important;border-radius:8px !important;border:1px solid rgba(145,95,240,.42) !important;background:linear-gradient(100deg,#3c2082,#7443c8) !important;color:#fff !important;font-size:8px !important;font-weight:950 !important;letter-spacing:.02em}
        .casex-all-games .dicing::after{background:radial-gradient(circle,rgba(41,113,255,.58),transparent 68%)}
        .casex-all-games .mines::after{background:radial-gradient(circle,rgba(229,59,97,.58),transparent 68%)}
        .casex-all-games .towers::after{background:radial-gradient(circle,rgba(78,112,255,.6),transparent 68%)}
        .casex-all-games .plinko::after{background:radial-gradient(circle,rgba(183,53,255,.58),transparent 68%)}
        .casex-all-games .chicken::after{background:radial-gradient(circle,rgba(255,158,37,.62),transparent 68%)}
        .casex-all-games .coinflip::after{background:radial-gradient(circle,rgba(38,187,160,.62),transparent 68%)}

        .casex-d4-content #cases{
          width:100% !important;
          max-width:none !important;
          margin:28px 0 0 !important;
          padding:24px !important;
          border:1px solid rgba(92,83,122,.22) !important;
          border-radius:17px !important;
          background:linear-gradient(160deg,rgba(14,16,24,.92),rgba(8,9,14,.84)) !important;
        }
        .casex-d4-content #cases .case-grid{grid-template-columns:repeat(4,minmax(0,1fr)) !important;gap:11px !important}
        .casex-d4-content #cases .section-head h2{font-size:28px !important}
        .casex-d4-content #cases .case-card{border-radius:13px !important}
        .casex-d4-content #cases .case-card-topline .tag{font-size:7px !important}

        .casex-d4-content > section:not(.casex-game-hub):not(.home-feature-zone):not(#cases){
          position:relative;
          z-index:2;
        }
        .casex-d4-content .home-feature-zone{margin-top:28px !important}

        @media(max-width:1200px){
          .casex-all-games{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
          .casex-all-games .casex-mini-game{min-height:210px !important}
        }
        @media(max-width:900px){
          .casex-d4-sidebar{width:210px}
          .casex-design4-main{padding-left:210px !important}
          .casex-d4-content{padding:22px 18px 42px}
          .casex-d4-balance-center{min-width:150px}
        }
        @media(max-width:700px){
          .casex-d4-sidebar{position:sticky;top:74px;bottom:auto;width:100%;height:auto;border-right:0;border-bottom:1px solid rgba(92,84,125,.22);padding:9px 10px;display:flex;gap:7px;overflow:auto;flex-wrap:nowrap}
          .casex-d4-sidebar-head,.casex-d4-side-label,.casex-d4-sidebar-spacer,.casex-d4-sidebar-promo{display:none}
          .casex-d4-side-link,.casex-d4-side-game{width:auto;flex:0 0 auto;white-space:nowrap}
          .casex-d4-side-link{padding:8px 10px}
          .casex-d4-side-game{padding:6px 8px}
          .casex-d4-side-game-icon{width:24px;height:24px;font-size:12px}
          .casex-design4-main{padding-left:0 !important}
          .casex-d4-content{padding:14px 11px 34px}
          .casex-d4-balance-center{position:relative;left:auto;top:auto;transform:none;margin:auto;height:40px;min-width:138px}
          .casex-d4-content .hero{min-height:260px !important;padding:27px 22px !important}
          .casex-d4-content .hero h1{font-size:48px !important}
          .casex-all-games{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
          .casex-d4-content #cases .case-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
        }
      `}</style>

<style>{`
        /* ============================================================
           CASEX DESIGN 4 — VISUAL CORRECTION / PREMIUM SHUFFLE-LIKE PASS
           Layout-only / presentation-only overrides. Game logic untouched.
           ============================================================ */
        .casex-design4-nav{
          position:sticky !important;
          top:0 !important;
          min-height:74px !important;
          padding:0 28px !important;
          background:rgba(5,6,10,.96) !important;
          border-bottom:1px solid rgba(113,96,155,.18) !important;
          backdrop-filter:blur(18px) !important;
          box-sizing:border-box !important;
        }
        .casex-design4-nav .brand{position:relative;z-index:5;flex:0 0 auto}
        .casex-design4-nav > nav{
          position:absolute !important;
          left:50% !important;
          top:50% !important;
          transform:translate(-50%,-50%) !important;
          padding:0 !important;
          display:flex !important;
          align-items:center !important;
          gap:8px !important;
          z-index:4 !important;
        }
        .casex-design4-nav > nav > .color-dicing-nav-link,
        .casex-design4-nav > nav > .nav-game-selector{display:none !important}
        .casex-design4-nav > nav > .nav-link-button{display:none !important}
        .casex-d4-balance-center{
          position:absolute !important;
          left:50% !important;
          top:50% !important;
          transform:translate(-50%,-50%) !important;
          z-index:20 !important;
          min-width:178px !important;
          width:178px !important;
          height:46px !important;
          border-radius:12px !important;
          background:linear-gradient(180deg,#171324,#0d0d15) !important;
          border:1px solid rgba(161,116,240,.56) !important;
          box-shadow:0 0 0 1px rgba(110,74,187,.08),0 14px 32px rgba(55,28,110,.28),inset 0 1px 0 rgba(255,255,255,.04) !important;
        }
        .casex-design4-nav .nav-actions{position:relative;z-index:8;margin-left:auto !important}

        .casex-design4-main{
          padding-left:214px !important;
          background:
            radial-gradient(900px 500px at 70% 10%,rgba(113,66,214,.12),transparent 67%),
            radial-gradient(650px 420px at 22% 58%,rgba(44,75,156,.08),transparent 65%),
            linear-gradient(180deg,#07080e 0%,#06070b 52%,#05060a 100%) !important;
        }
        .casex-design4-main::before{background-size:46px 46px;opacity:.72}

        .casex-d4-sidebar{
          top:74px !important;
          width:214px !important;
          padding:20px 12px 18px !important;
          background:linear-gradient(180deg,#090a10,#07080c) !important;
          border-right:1px solid rgba(103,94,136,.20) !important;
          box-shadow:10px 0 40px rgba(0,0,0,.18) !important;
        }
        .casex-d4-sidebar-head{padding:6px 8px 20px !important}
        .casex-d4-sidebar-logo{width:36px !important;height:36px !important;border-radius:11px !important}
        .casex-d4-side-label{margin:13px 8px 8px !important;color:#55596a !important;font-size:7px !important}
        .casex-d4-side-link{padding:10px 11px !important;border-radius:10px !important;font-size:10px !important}
        .casex-d4-side-game{padding:8px 8px !important;border-radius:10px !important;font-size:9px !important}
        .casex-d4-side-game-icon{width:32px !important;height:32px !important;border-radius:10px !important;font-size:15px !important}
        .casex-d4-sidebar-promo{margin-top:auto !important}

        .casex-d4-content{
          padding:24px 30px 64px !important;
          max-width:1500px !important;
          margin:0 auto !important;
        }
        .casex-d4-content .hero{
          position:relative !important;
          min-height:340px !important;
          margin:0 0 30px !important;
          padding:34px 38px !important;
          display:block !important;
          border-radius:20px !important;
          border:1px solid rgba(127,106,178,.30) !important;
          background:
            radial-gradient(680px 360px at 84% 52%,rgba(130,74,234,.22),transparent 64%),
            radial-gradient(480px 320px at 12% 100%,rgba(44,79,152,.15),transparent 68%),
            linear-gradient(145deg,#10111a,#090b11 64%,#0c0914) !important;
          box-shadow:0 28px 80px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.035) !important;
          overflow:hidden !important;
        }
        .casex-d4-content .hero::before{
          content:"" !important;
          position:absolute !important;
          inset:0 !important;
          pointer-events:none !important;
          opacity:.58 !important;
          background-image:linear-gradient(rgba(156,119,230,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(156,119,230,.055) 1px,transparent 1px) !important;
          background-size:42px 42px !important;
          mask-image:linear-gradient(90deg,#000 0%,rgba(0,0,0,.6) 62%,transparent 100%) !important;
        }
        .casex-d4-content .hero::after{
          content:"" !important;
          position:absolute !important;
          width:560px !important;
          height:560px !important;
          right:-60px !important;
          top:-160px !important;
          border-radius:50% !important;
          border:1px solid rgba(165,116,255,.12) !important;
          box-shadow:0 0 0 42px rgba(126,73,228,.028),0 0 0 90px rgba(126,73,228,.018) !important;
          pointer-events:none !important;
        }
        .casex-d4-content .hero-copy{
          position:relative !important;
          z-index:5 !important;
          width:54% !important;
          max-width:670px !important;
          margin:0 !important;
          transform:none !important;
        }
        .casex-d4-content .hero .eyebrow{font-size:9px !important;letter-spacing:.16em !important}
        .casex-d4-content .hero h1{
          margin:12px 0 14px !important;
          font-size:clamp(54px,5.2vw,82px) !important;
          line-height:.91 !important;
          max-width:640px !important;
          position:relative !important;
          z-index:6 !important;
        }
        .casex-d4-content .hero h1 span{color:#a875ff !important;text-shadow:0 0 34px rgba(153,92,255,.16)}
        .casex-d4-content .hero p{font-size:12px !important;max-width:530px !important;color:#8b8e9e !important}
        .casex-d4-content .hero-cta{margin-top:20px !important;min-height:40px !important;padding:0 15px !important}
        .casex-d4-content .hero-stats,.casex-d4-content .hero-trust-strip{display:none !important}

        .casex-d4-content .hero-case{
          display:block !important;
          position:absolute !important;
          top:0 !important;
          right:-8px !important;
          width:49% !important;
          height:100% !important;
          z-index:3 !important;
          opacity:.92 !important;
          transform:scale(.82) !important;
          transform-origin:center right !important;
        }
        .casex-d4-content .hero-case-aura{opacity:.68 !important}
        .casex-d4-content .hero-case-box{filter:drop-shadow(0 30px 50px rgba(0,0,0,.52)) !important}
        .casex-d4-content .hero-live-wins{display:none !important}
        .casex-d4-content .rarity-card{display:none !important}

        .casex-game-hub{
          margin:0 0 28px !important;
          padding:0 !important;
        }
        .casex-hub-heading{display:none !important}
        .casex-all-games-heading{
          margin:0 0 16px !important;
          padding:0 2px !important;
        }
        .casex-all-games-heading > div{
          display:block !important;
        }
        .casex-all-games-heading .eyebrow{font-size:9px !important;letter-spacing:.17em !important;color:#a979ff !important}
        .casex-all-games-heading h2{
          margin:7px 0 0 !important;
          font-size:34px !important;
          line-height:1 !important;
          letter-spacing:-.045em !important;
        }
        .casex-all-games{
          display:grid !important;
          grid-template-columns:repeat(6,minmax(0,1fr)) !important;
          gap:12px !important;
        }
        .casex-all-games .casex-mini-game{
          min-height:250px !important;
          padding:12px !important;
          border-radius:16px !important;
          border:1px solid rgba(104,95,132,.36) !important;
          background:linear-gradient(165deg,#11131c,#090b11) !important;
          box-shadow:0 20px 48px rgba(0,0,0,.22) !important;
        }
        .casex-all-games .casex-mini-game::before{
          background:
            radial-gradient(circle at 50% 7%,rgba(141,92,255,.20),transparent 42%),
            linear-gradient(180deg,rgba(255,255,255,.018),transparent 38%,rgba(0,0,0,.18)) !important;
        }
        .casex-all-games .casex-mini-game::after{width:150px !important;height:150px !important;right:-35px !important;bottom:-45px !important;filter:blur(22px) !important;opacity:.5 !important}
        .casex-all-games .casex-mini-icon{
          width:96px !important;
          height:96px !important;
          border-radius:22px !important;
          font-size:48px !important;
          margin:0 auto !important;
          background:linear-gradient(145deg,#1c2030,#10131d) !important;
          border:1px solid rgba(142,123,199,.30) !important;
          box-shadow:0 22px 42px rgba(0,0,0,.30) !important;
        }
        .casex-all-games .casex-mini-game strong{
          display:block !important;
          margin:16px 0 0 !important;
          text-align:center !important;
          font-size:14px !important;
        }
        .casex-all-games .casex-mini-game small{
          display:block !important;
          margin:6px auto 0 !important;
          text-align:center !important;
          font-size:8px !important;
          min-height:22px !important;
        }
        .casex-all-games .casex-mini-game b{
          margin-top:12px !important;
          min-height:34px !important;
          border-radius:9px !important;
          font-size:8px !important;
          background:linear-gradient(100deg,#4a2698,#844be1) !important;
        }

        .casex-d4-content #cases{
          margin-top:34px !important;
          padding:24px !important;
          border-radius:18px !important;
          background:linear-gradient(160deg,#0e1018,#08090e) !important;
          border-color:rgba(102,93,133,.28) !important;
        }

        @media(max-width:1200px){
          .casex-all-games{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
          .casex-d4-content .hero-copy{width:62% !important}
          .casex-d4-content .hero-case{width:46% !important;transform:scale(.72) !important}
        }
        @media(max-width:900px){
          .casex-design4-main{padding-left:190px !important}
          .casex-d4-sidebar{width:190px !important}
          .casex-d4-content{padding:20px 18px 48px !important}
          .casex-d4-content .hero{padding:30px !important}
          .casex-d4-content .hero-copy{width:100% !important;max-width:600px !important}
          .casex-d4-content .hero-case{opacity:.45 !important;right:-110px !important;transform:scale(.66) !important}
        }
        /* ============================================================
           CASEX DESIGN 4 — SIDEBAR TOGGLE + HEADER SPACING
           ============================================================ */
        .casex-design4-nav{
          margin-top:-76px !important;
          min-height:74px !important;
          height:74px !important;
        }

        .casex-d4-menu-toggle{
          width:40px !important;
          height:40px !important;
          flex:0 0 40px !important;
          display:flex !important;
          flex-direction:column !important;
          align-items:center !important;
          justify-content:center !important;
          gap:5px !important;
          padding:0 !important;
          margin-right:10px !important;
          border:1px solid rgba(126,106,170,.28) !important;
          border-radius:10px !important;
          background:rgba(15,16,24,.86) !important;
          color:#d8d0e8 !important;
          cursor:pointer !important;
          z-index:30 !important;
          transition:border-color .18s ease,background .18s ease,transform .18s ease !important;
        }
        .casex-d4-menu-toggle:hover{
          border-color:rgba(163,120,242,.62) !important;
          background:rgba(27,22,39,.96) !important;
        }
        .casex-d4-menu-toggle span{
          display:block !important;
          width:18px !important;
          height:2px !important;
          border-radius:999px !important;
          background:#d8d0e8 !important;
          transition:transform .2s ease,opacity .2s ease !important;
        }
        .casex-d4-menu-toggle.is-open span:nth-child(1){transform:translateY(7px) rotate(45deg) !important;}
        .casex-d4-menu-toggle.is-open span:nth-child(2){opacity:0 !important;}
        .casex-d4-menu-toggle.is-open span:nth-child(3){transform:translateY(-7px) rotate(-45deg) !important;}

        .casex-d4-sidebar{
          transition:transform .24s cubic-bezier(.2,.75,.2,1),opacity .18s ease !important;
        }
        .casex-d4-sidebar-closed{
          padding-left:0 !important;
        }
        .casex-d4-sidebar-closed .casex-d4-sidebar{
          transform:translateX(-102%) !important;
          opacity:.98 !important;
          pointer-events:none !important;
        }
        .casex-d4-sidebar-open .casex-d4-sidebar{
          transform:translateX(0) !important;
          pointer-events:auto !important;
        }

        .casex-d4-side-label{
          font-size:8px !important;
          line-height:1.2 !important;
        }
        .casex-d4-side-link{
          min-height:42px !important;
          padding:10px 12px !important;
          font-size:12px !important;
        }
        .casex-d4-side-game{
          min-height:44px !important;
          padding:8px 10px !important;
          font-size:11px !important;
        }
        .casex-d4-side-game-icon{
          width:34px !important;
          height:34px !important;
          font-size:16px !important;
        }

        @media(max-width:700px){
          .casex-design4-nav{padding:0 14px !important}
          .casex-d4-balance-center{min-width:150px !important;width:150px !important}
          .casex-d4-sidebar{position:sticky !important;top:74px !important;width:100% !important;height:auto !important;border-right:0 !important;border-bottom:1px solid rgba(92,84,125,.22) !important}
          .casex-design4-main{padding-left:0 !important}
          .casex-d4-content{padding:14px 12px 32px !important}
          .casex-d4-content .hero{min-height:300px !important;padding:26px 22px !important}
          .casex-d4-content .hero h1{font-size:52px !important}
          .casex-d4-content .hero-case{display:none !important}
          .casex-all-games{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
        }
        @media(max-width:700px){
          .casex-design4-nav{margin-top:-68px !important;min-height:68px !important;height:68px !important;}
          .casex-d4-menu-toggle{width:36px !important;height:36px !important;flex-basis:36px !important;margin-right:8px !important;}
          .casex-d4-menu-toggle span{width:16px !important;}
          .casex-d4-sidebar{
            top:68px !important;
            transform:translateX(0) !important;
          }
          .casex-d4-sidebar-closed .casex-d4-sidebar{
            transform:translateX(-102%) !important;
          }
          .casex-d4-sidebar-closed .casex-d4-content{
            width:100% !important;
          }
        }

        `}</style>

      <style>{`
        /* ============================================================
           CASEX DESIGN 4 — PERSISTENT GAME SIDEBAR
           Visible above OriginalGames overlay; collapse to icon rail.
           ============================================================ */
        .casex-design4-nav .casex-d4-menu-toggle{
          position:relative !important;
          z-index:5000 !important;
        }
        .casex-design4-nav .brand-mark{
          width:38px !important;
          height:38px !important;
          border-radius:11px !important;
          font-size:19px !important;
        }
        .casex-design4-nav .brand{
          font-size:16px !important;
        }
        .casex-d4-game-sidebar{
          position:fixed !important;
          left:0 !important;
          top:76px !important;
          bottom:0 !important;
          width:214px !important;
          padding:18px 12px 14px !important;
          box-sizing:border-box !important;
          display:flex !important;
          flex-direction:column !important;
          background:linear-gradient(180deg,#090a10,#07080d 72%,#06070b) !important;
          border-right:1px solid rgba(103,94,136,.24) !important;
          box-shadow:14px 0 40px rgba(0,0,0,.28) !important;
          z-index:2600 !important;
          overflow:auto !important;
          transition:width .22s cubic-bezier(.2,.75,.2,1),padding .22s ease !important;
          scrollbar-width:thin;
        }
        .casex-d4-game-sidebar.is-collapsed{
          width:72px !important;
          padding-left:10px !important;
          padding-right:10px !important;
        }
        .casex-d4-game-sidebar-head{
          display:flex !important;
          align-items:center !important;
          gap:10px !important;
          padding:3px 6px 20px !important;
          min-height:48px !important;
        }
        .casex-d4-game-sidebar-logo{
          width:42px !important;
          height:42px !important;
          flex:0 0 42px !important;
          display:grid !important;
          place-items:center !important;
          border-radius:12px !important;
          background:linear-gradient(145deg,#7548df,#a471ff) !important;
          box-shadow:0 10px 26px rgba(118,67,218,.24) !important;
          color:#fff !important;
          font-size:20px !important;
          font-weight:950 !important;
        }
        .casex-d4-game-sidebar-brand strong{display:block;color:#f6f3fa;font-size:15px;font-weight:950}
        .casex-d4-game-sidebar-brand small{display:block;margin-top:2px;color:#737687;font-size:7px;font-weight:900;letter-spacing:.18em}
        .casex-d4-game-sidebar-label{
          margin:3px 8px 8px !important;
          color:#676a7a !important;
          font-size:8px !important;
          font-weight:950 !important;
          letter-spacing:.16em !important;
        }
        .casex-d4-game-side-item,.casex-d4-game-sidebar-back{
          width:100% !important;
          min-height:46px !important;
          display:flex !important;
          align-items:center !important;
          gap:10px !important;
          padding:7px 8px !important;
          margin:1px 0 !important;
          border:1px solid transparent !important;
          border-radius:10px !important;
          background:transparent !important;
          color:#c6c4d0 !important;
          font:inherit !important;
          font-size:12px !important;
          font-weight:850 !important;
          text-align:left !important;
          cursor:pointer !important;
          transition:background .16s ease,border-color .16s ease,color .16s ease,transform .16s ease !important;
        }
        .casex-d4-game-side-item:hover,.casex-d4-game-side-item.active,.casex-d4-game-sidebar-back:hover{
          background:linear-gradient(90deg,rgba(113,63,199,.24),rgba(82,48,137,.10)) !important;
          border-color:rgba(146,102,221,.22) !important;
          color:#fff !important;
        }
        .casex-d4-game-side-item.active{box-shadow:inset 2px 0 0 #a66eff !important}
        .casex-d4-game-side-icon{
          width:34px !important;
          height:34px !important;
          flex:0 0 34px !important;
          display:grid !important;
          place-items:center !important;
          border-radius:10px !important;
          background:linear-gradient(145deg,#171b29,#0d1018) !important;
          border:1px solid rgba(124,112,170,.26) !important;
          font-size:16px !important;
        }
        .casex-d4-game-side-copy{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .casex-d4-game-sidebar-spacer{flex:1 1 auto;min-height:18px}
        .casex-d4-game-sidebar-back{color:#999cab !important}
        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-sidebar-head{justify-content:center;padding-left:0 !important;padding-right:0 !important}
        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-sidebar-brand,
        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-sidebar-label,
        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-side-copy{display:none !important}
        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-side-item,
        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-sidebar-back{
          justify-content:center !important;
          padding-left:0 !important;
          padding-right:0 !important;
        }
        .casex-d4-game-sidebar.is-collapsed .casex-d4-game-sidebar-spacer{min-height:8px}
        @media(max-width:700px){
          .casex-d4-game-sidebar{top:68px !important;width:184px !important}
          .casex-d4-game-sidebar.is-collapsed{width:64px !important}
          .casex-d4-game-sidebar-logo{width:38px !important;height:38px !important;flex-basis:38px !important}
          .casex-design4-nav .brand-mark{width:34px !important;height:34px !important;font-size:17px !important}
        }
      `}</style>

      <style>{`
        /* ============================================================
           CASEX DESIGN 4 — GAME CONTENT OFFSET FOR SIDEBAR
           Keep the game content beside the fixed sidebar instead of
           letting the sidebar sit on top of the game.
           ============================================================ */
        .casex-d4-original-game-stage{
          position:relative !important;
          z-index:1200 !important;
        }
        .casex-d4-original-game-stage .original-games-overlay{
          transition:left .22s cubic-bezier(.2,.75,.2,1),width .22s cubic-bezier(.2,.75,.2,1) !important;
        }
        .casex-d4-original-game-stage.sidebar-open .original-games-overlay{
          left:214px !important;
          right:0 !important;
          width:auto !important;
        }
        .casex-d4-original-game-stage.sidebar-collapsed .original-games-overlay{
          left:72px !important;
          right:0 !important;
          width:auto !important;
        }
        .casex-d4-original-game-stage.sidebar-open .original-games-game-tabs{
          left:234px !important;
        }
        .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
          left:92px !important;
        }
        /* Do not let the game canvas create a competing horizontal scroll. */
        .casex-d4-original-game-stage .original-games-page{
          max-width:100% !important;
          overflow-x:hidden !important;
        }
        @media(max-width:700px){
          .casex-d4-original-game-stage.sidebar-open .original-games-overlay{
            left:184px !important;
          }
          .casex-d4-original-game-stage.sidebar-collapsed .original-games-overlay{
            left:64px !important;
          }
          .casex-d4-original-game-stage.sidebar-open .original-games-game-tabs{
            left:204px !important;
          }
          .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
            left:84px !important;
          }
        }
      `}</style>


      <style>{`
        /* ============================================================
           CASEX DESIGN 4 — SINGLE PAGE SCROLL FOR ORIGINAL GAMES
           The game overlay was independently scrollable, which made
           the fixed sidebar appear detached from the page. Let the
           document own the scroll so the sidebar stays anchored to
           the main CASEX header while the game content moves naturally.
           ============================================================ */
        .original-games-overlay{
          position:absolute !important;
          inset:0 auto auto 0 !important;
          width:100% !important;
          min-height:100vh !important;
          height:auto !important;
          overflow:visible !important;
        }

        /* Keep the game navigation tabs attached to the viewport. */
        .original-games-overlay .original-games-game-tabs{
          position:fixed !important;
          top:86px !important;
          z-index:999999 !important;
        }

        /* ============================================================
           CASEX DESIGN 4 — KEEP THE HOME HERO VISUAL INSIDE THE CARD
           ============================================================ */
        .casex-d4-content .hero{
          overflow:hidden !important;
        }
        .casex-d4-content .hero-case{
          right:10px !important;
          top:4px !important;
          width:46% !important;
          height:96% !important;
          transform:scale(.76) !important;
          transform-origin:center right !important;
        }

        @media(max-width:1200px){
          .casex-d4-content .hero-case{
            right:2px !important;
            width:44% !important;
            transform:scale(.70) !important;
          }
        }

        @media(max-width:900px){
          .casex-d4-content .hero-case{
            right:-32px !important;
            width:48% !important;
            transform:scale(.62) !important;
          }
        }

        @media(max-width:700px){
          .casex-d4-content .hero-case{
            display:none !important;
          }
        }
      `}</style>

      <style>{`
        /* ============================================================
           CASEX DESIGN 4 — LOCK THE TOP NAV TO THE VIEWPORT
           Keep the hamburger/logo/balance bar fixed while the page
           scrolls. Content is offset so the nav never gets displaced.
           ============================================================ */
        .casex-design4-nav{
          position:fixed !important;
          top:0 !important;
          left:0 !important;
          right:0 !important;
          width:100% !important;
          margin-top:0 !important;
          min-height:74px !important;
          height:74px !important;
          box-sizing:border-box !important;
          z-index:5000 !important;
        }

        .casex-design4-main{
          padding-top:74px !important;
        }

        .casex-design4-nav .casex-d4-menu-toggle,
        .casex-design4-nav .brand,
        .casex-design4-nav nav,
        .casex-design4-nav .nav-actions{
          position:relative !important;
          z-index:2 !important;
        }

        /* The fixed game sidebar begins immediately below the fixed nav. */
        .casex-d4-game-sidebar{
          top:74px !important;
        }

        @media(max-width:700px){
          .casex-design4-nav{
            min-height:68px !important;
            height:68px !important;
          }
          .casex-design4-main{
            padding-top:68px !important;
          }
          .casex-d4-game-sidebar{
            top:68px !important;
          }
        }
      `}</style>

      <style>{`/* CASEX Design 4 — content spacing when the sidebar is OPEN */
        /* The sidebar is fixed at 214px. Move the ENTIRE homepage content
           to the right only while the sidebar is open, without changing
           the homepage sizing or layout when the sidebar is closed. */
        @media(min-width:901px){
          .casex-d4-sidebar-open .casex-d4-content{
            position:relative !important;
            left:60px !important;
          }
        }

        @media(min-width:701px) and (max-width:900px){
          .casex-d4-sidebar-open .casex-d4-content{
            position:relative !important;
            left:28px !important;
          }
        }


        /* Remove the inner rectangle around the selected deposit currency. */
        .wallet-modal-backdrop .casex-clean-select-live,
        .wallet-modal-backdrop .casex-clean-select-live > select,
        .wallet-modal-backdrop .casex-clean-select-live > select:hover,
        .wallet-modal-backdrop .casex-clean-select-live > select:active,
        .wallet-modal-backdrop .casex-clean-select-live > select:focus,
        .wallet-modal-backdrop .casex-clean-select-live > select:focus-visible{
          border:0 !important;
          outline:none !important;
          box-shadow:none !important;
          background-color:transparent !important;
        }

        /* Keep the outer CASEX field border only. */
        .wallet-modal-backdrop .casex-clean-select-live{
          border:1px solid #30343d !important;
        }

        /* Initial deposit selector — one clean, clickable dropdown arrow. */
        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div{
          position:relative !important;
          overflow:hidden !important;
        }

        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div::before{
          content:"" !important;
          display:block !important;
          position:absolute !important;
          right:13px !important;
          top:50% !important;
          width:7px !important;
          height:7px !important;
          margin-top:-5px !important;
          border-right:1.5px solid #9da2ad !important;
          border-bottom:1.5px solid #9da2ad !important;
          transform:rotate(45deg) !important;
          pointer-events:none !important;
          z-index:2 !important;
        }

        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div::after{
          content:none !important;
          display:none !important;
        }

        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow{
          position:relative !important;
          z-index:1 !important;
          width:100% !important;
          height:100% !important;
          border:0 !important;
          outline:0 !important;
          box-shadow:none !important;
          appearance:none !important;
          -webkit-appearance:none !important;
          -moz-appearance:none !important;
          background:transparent !important;
          background-image:none !important;
          padding-right:36px !important;
          color:inherit !important;
          cursor:pointer !important;
        }

        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow::-ms-expand{
          display:none !important;
        }

        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow:focus,
        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow:focus-visible{
          border:0 !important;
          outline:0 !important;
          box-shadow:none !important;
        }
      `}</style>

      <style>{`
        /* CASEX WALLET — V37 selector retained, arrow rendering cleaned up */
        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div{
          position:relative !important;
          overflow:hidden !important;
          padding:0 !important;
          background-color:#1e222a !important;
          background-repeat:no-repeat !important;
          background-position:right 12px center !important;
          background-size:14px 14px !important;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath d='M3.25 5.25 7 9l3.75-3.75' fill='none' stroke='%239da2ad' stroke-width='1.45' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
        }

        /* Kill every pseudo-arrow from the old selector CSS. */
        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div::before,
        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div::after{
          content:none !important;
          display:none !important;
        }

        /* The real SELECT is the only interactive layer and spans the whole
           field, including the visual arrow area. */
        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow{
          display:block !important;
          width:100% !important;
          height:100% !important;
          min-width:0 !important;
          box-sizing:border-box !important;
          margin:0 !important;
          padding:0 40px 0 13px !important;
          border:0 !important;
          outline:0 !important;
          box-shadow:none !important;
          appearance:none !important;
          -webkit-appearance:none !important;
          -moz-appearance:none !important;
          background:transparent !important;
          background-image:none !important;
          background-color:transparent !important;
          cursor:pointer !important;
          color:#f3f4f8 !important;
          color-scheme:dark !important;
        }

        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow::-ms-expand{
          display:none !important;
        }

        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow:focus,
        .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div > select.casex-wallet-native-hidden-arrow:focus-visible{
          border:0 !important;
          outline:0 !important;
          box-shadow:none !important;
        }
      `}</style>

      <header className={`nav casex-design4-nav ${originalGameOpen ? "casex-d4-game-nav" : ""}`}>
        <button
          type="button"
          className={`casex-d4-menu-toggle ${d4SidebarOpen ? "is-open" : ""}`}
          onClick={() => setD4SidebarOpen((current) => !current)}
          aria-label={d4SidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={d4SidebarOpen}
        >
          <span></span><span></span><span></span>
        </button>

        <button
          type="button"
          className="brand"
          onClick={() => {
            if (opening) return;
            if (!closeAllOverlaysForNavigation()) return;

            requestAnimationFrame(() => {
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
              });
            });
          }}
          aria-label="Go to CASEX home"
        >
          <div className="brand-mark">
            ✦
          </div>

          <span>
            CASE<span>X</span>
          </span>
        </button>

        <nav>
          <button
            type="button"
            className="nav-link-button"
            onClick={() => {
              if (opening) return;
              if (!closeAllOverlaysForNavigation()) return;

              requestAnimationFrame(() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              });
            }}
          >
            Home
          </button>


          <button
            type="button"
            className="nav-link-button color-dicing-nav-link"
            onClick={openColorDicing}
          >
            Color Dicing
          </button>

          

 <div
            className="nav-game-selector"
            ref={gameMenuRef}
          >
            <button
              type="button"
              className={`nav-link-button nav-game-button ${
                gameMenuOpen ? "active" : ""
              }`}
              onClick={() => {
                if (opening) return;
                setProfileOpen(false);
                setOriginalsMenuOpen(false);
                setGameMenuOpen((current) => !current);
              }}
              aria-label="Open games"
              aria-expanded={gameMenuOpen}
            >
              Games
              <span className="nav-game-chevron">▾</span>
            </button>

            {gameMenuOpen && (
              <div
                className="nav-game-dropdown"
                role="menu"
                aria-label="Games"
              >
                <div className="nav-game-dropdown-title">GAMES</div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setGameMenuOpen(false);
                    openGamePortal("steal-a-brainrot", "marketplace");
                  }}
                >
                  <span className="nav-game-dropdown-icon brainrot">🧠</span>
                  <span>
                    <strong>Steal a Brainrot</strong>
                    <small>Live · Marketplace · Cases</small>
                  </span>
                  <b>→</b>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setGameMenuOpen(false);
                    openGamePortal("donutsmp", "marketplace");
                  }}
                >
                  <span className="nav-game-dropdown-icon donutsmp">🍩</span>
                  <span>
                    <strong>DonutSMP</strong>
                    <small>Live · Marketplace · Cases</small>
                  </span>
                  <b>→</b>
                </button>
              </div>
            )}
          </div>

          <div
            className="nav-game-selector"
            ref={originalsMenuRef}
          >
            <button
              type="button"
              className={`nav-link-button nav-game-button ${
                originalsMenuOpen ? "active" : ""
              }`}
              onClick={() => {
                if (opening) return;
                setProfileOpen(false);
                setGameMenuOpen(false);
                setOriginalsMenuOpen((current) => !current);
              }}
              aria-label="Open Originals"
              aria-expanded={originalsMenuOpen}
            >
              Originals
              <span className="nav-game-chevron">▾</span>
            </button>

            {originalsMenuOpen && (
              <div
                className="nav-game-dropdown nav-originals-dropdown"
                role="menu"
                aria-label="Originals"
              >
                <div className="nav-game-dropdown-title">ORIGINALS</div>

                <button type="button" role="menuitem" className="nav-original-game" onClick={() => openOriginalGame("towers")}>
                  <span className="nav-game-dropdown-icon towers">🎯</span>
                  <span><strong>Towers</strong><small>Play now</small></span>
                  <b>→</b>
                </button>

                <button type="button" role="menuitem" className="nav-original-game" onClick={() => openOriginalGame("plinko")}>
                  <span className="nav-game-dropdown-icon plinko">🔺</span>
                  <span><strong>Plinko</strong><small>Play now</small></span>
                  <b>→</b>
                </button>

                <button type="button" role="menuitem" className="nav-original-game" onClick={() => openOriginalGame("chicken")}>
                  <span className="nav-game-dropdown-icon chicken-road">🛣️</span>
                  <span><strong>Chicken Road</strong><small>Play now</small></span>
                  <b>→</b>
                </button>

                <button type="button" role="menuitem" className="nav-original-game" onClick={() => openOriginalGame("coinflip")}>
                  <span className="nav-game-dropdown-icon coinflip">🪙</span>
                  <span><strong>Coinflip</strong><small>Play now</small></span>
                  <b>→</b>
                </button>

                <button type="button" role="menuitem" className="nav-original-game" onClick={() => openOriginalGame("mines")}>
                  <span className="nav-game-dropdown-icon mines">💣</span>
                  <span><strong>Mines</strong><small>Play now</small></span>
                  <b>→</b>
                </button>
              </div>
            )}
          </div>


          

          
        </nav>

        <button
          type="button"
          className="casex-d4-balance-center"
          onClick={() => {
            if (authUser) {
              setWalletOpen(true);
              setWalletTab("wallet");
              setWalletAction("deposit");
            } else {
              openAuth("login");
            }
          }}
          aria-label={authUser ? "Open wallet" : "Sign in"}
        >
          <span className="casex-d4-balance-icon">💰</span>
          <span className="casex-d4-balance-copy">
            <small>Balance</small>
            <strong>{authUser ? `$${balance.toFixed(2)}` : "Sign in"}</strong>
          </span>
          <span className="casex-d4-balance-plus">+</span>
        </button>

<div className="nav-actions">
  <a
  href="https://discord.gg/6t9bzvnndd"
  target="_blank"
  rel="noopener noreferrer"
  className="discord-nav-button"
>
<span className="discord-nav-icon">
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M19.54 5.06A16.91 16.91 0 0 0 15.38 3.8l-.51 1.04a15.4 15.4 0 0 0-5.74 0L8.62 3.8a16.91 16.91 0 0 0-4.16 1.26C1.82 9.26 1.11 13.37 1.47 17.42a16.82 16.82 0 0 0 5.14 2.58l1.25-1.72c-.69-.25-1.35-.56-1.97-.92l.48-.37c3.8 1.76 8.01 1.76 11.76 0l.49.37c-.63.36-1.29.67-1.98.92l1.25 1.72a16.82 16.82 0 0 0 5.14-2.58c.42-4.7-.72-8.77-3.49-12.36zM8.24 15.07c-1.12 0-2.04-1.03-2.04-2.3s.9-2.3 2.04-2.3 2.06 1.03 2.04 2.3c0 1.27-.9 2.3-2.04 2.3zm7.52 0c-1.12 0-2.04-1.03-2.04-2.3s.9-2.3 2.04-2.3 2.06 1.03 2.04 2.3c0 1.27-.9 2.3-2.04 2.3z"
    />
  </svg>
</span>
<span>Discord</span>
</a>

  {authUser && (
    <button
      className="balance balance-button"
      onClick={() => {
        setWalletOpen(true);
        setWalletTab("wallet");
        setWalletAction("deposit");
      }}
    >
      💰 ${balance.toFixed(2)}{" "}
      <span>+</span>
    </button>
  )}

  <div
    className="profile-menu"
    ref={profileRef}
  >
            <button
              className={`avatar-button ${
                profileOpen
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setProfileOpen(
                  (current) =>
                    !current
                )
              }
              aria-label="Open account menu"
              aria-expanded={
                profileOpen
              }
            >
              <span className="avatar-icon">
                👤
              </span>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                {authUser ? (
                  <>
                    <div className="profile-header">
                      <div className="profile-avatar">
                        👤
                      </div>

                      <div>
                        <strong>
                          {
                            authUser.username
                          }
                        </strong>

                        <span>
                          {
                            authUser.email
                          }
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider"></div>

                    <button
                      type="button"
                      className="profile-item profile-button"
                      onClick={() => {
                        setProfileOpen(false);
                        setAccountStatsOpen(true);
                      }}
                    >
                      <span className="profile-item-icon">
                        📊
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Profile & stats
                        </strong>

                        <small>
                          Your CaseX performance
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </button>

                    {creatorDashboardAvailable && (
                      <button
                        type="button"
                        className="profile-item profile-button"
                        onClick={() => {
                          setProfileOpen(false);
                          setAccountStatsOpen(false);
                          setCreatorDashboardError("");
                          setCreatorDashboardOpen(true);
                          void loadCreatorDashboard();
                        }}
                      >
                        <span className="profile-item-icon">
                          🧑‍💻
                        </span>

                        <span className="profile-item-content">
                          <strong>
                            Creator Dashboard
                          </strong>

                          <small>
                            Track your referral volume
                          </small>
                        </span>

                        <span className="profile-arrow">
                          →
                        </span>
                      </button>
                    )}

                    <a
                      href="#inventory"
                      className="profile-item"
                      onClick={() =>
                        setProfileOpen(
                          false
                        )
                      }
                    >
                      <span className="profile-item-icon">
                        🎒
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Inventory
                        </strong>

                        <small>
                          {
                            inventory.length
                          }{" "}
                          {inventory.length ===
                          1
                            ? "item"
                            : "items"}
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </a>

                    <button
                      type="button"
                      className="profile-item profile-button"
                      onClick={() => {
                        setProfileOpen(
                          false
                        );
                        setWalletOpen(
                          true
                        );
                        setWalletTab(
                          "wallet"
                        );
                        setWalletAction(
                          "deposit"
                        );
                      }}
                    >
                      <span className="profile-item-icon">
                        💰
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Wallet
                        </strong>

                        <small>
                          $
                          {balance.toFixed(
                            2
                          )}
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </button>

                    <button
                      type="button"
                      className="profile-item profile-button"
                      onClick={() => {
                        setProfileOpen(
                          false
                        );
                        setWalletOpen(
                          true
                        );
                        setWalletTab(
                          "history"
                        );
                      }}
                    >
                      <span className="profile-item-icon">
                        📜
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Transaction
                          History
                        </strong>

                        <small>
                          {
                            transactions.length
                          }{" "}
                          {transactions.length ===
                          1
                            ? "transaction"
                            : "transactions"}
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </button>

                    <div className="profile-divider"></div>

                    <button
                      type="button"
                      className="profile-item profile-button"
                      onClick={() => openSettings("profile")}
                    >
                      <span className="profile-item-icon">
                        ⚙️
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Settings
                        </strong>

                        <small>
                          Account settings
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </button>

                    <button
                      type="button"
                      className="profile-item profile-button"
                      onClick={
                        handleLogout
                      }
                    >
                      <span className="profile-item-icon">
                        ↪
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Sign out
                        </strong>

                        <small>
                          End this session
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="profile-header">
                      <div className="profile-avatar">
                        👤
                      </div>

                      <div>
                        <strong>
                          Guest
                        </strong>

                        <span>
                          Sign in to save
                          your progress
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider"></div>

                    <button
                      type="button"
                      className="profile-item profile-button"
                      onClick={() =>
                        openAuth(
                          "login"
                        )
                      }
                    >
                      <span className="profile-item-icon">
                        ↪
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Sign in
                        </strong>

                        <small>
                          Access your
                          account
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </button>

                    <button
                      type="button"
                      className="profile-item profile-button"
                      onClick={() =>
                        openAuth(
                          "register"
                        )
                      }
                    >
                      <span className="profile-item-icon">
                        ＋
                      </span>

                      <span className="profile-item-content">
                        <strong>
                          Create account
                        </strong>

                        <small>
                          Start with
                          $100.00 demo
                          balance
                        </small>
                      </span>

                      <span className="profile-arrow">
                        →
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {originalGameOpen && (
        <div
          className={`casex-d4-original-game-stage ${
            d4SidebarOpen ? "sidebar-open" : "sidebar-collapsed"
          }`}
        >
          {originalGameOpen === "dicing" ? (
            <div className="original-games-overlay casex-d4-dicing-overlay">
              <div className="original-games-game-tabs casex-d4-dicing-tabs">
                <button type="button" className="active" onClick={openColorDicing}>
                  <span>🎲</span>
                  <strong>Color Dicing</strong>
                </button>
                <button type="button" onClick={() => openOriginalGame("mines")}>
                  <span>💣</span>
                  <strong>Mines</strong>
                </button>
                <button type="button" onClick={() => openOriginalGame("towers")}>
                  <span>🎯</span>
                  <strong>Towers</strong>
                </button>
                <button type="button" onClick={() => openOriginalGame("plinko")}>
                  <span>🔺</span>
                  <strong>Plinko</strong>
                </button>
                <button type="button" onClick={() => openOriginalGame("chicken")}>
                  <span>🐔</span>
                  <strong>Chicken Road</strong>
                </button>
                <button type="button" onClick={() => openOriginalGame("coinflip")}>
                  <span>🪙</span>
                  <strong>Coinflip</strong>
                </button>
              </div>

              <div className="casex-d4-dicing-content">
                <ColorDicingGame
                  authUser={authUser}
                  balance={balance}
                  openAuth={openAuth}
                  onBalanceChange={setBalance}
                />
              </div>
            </div>
          ) : (
            <OriginalGames
              game={originalGameOpen}
              authUser={authUser}
              balance={balance}
              onBalanceChange={setBalance}
              onClose={closeOriginalGame}
              openAuth={openAuth}
              soundEnabled={soundEnabled}
              onOpenColorDicing={openColorDicing}
            />
          )}
        </div>
      )}

      <style>{`
        /* ============================================================
           CASEX ORIGINAL GAMES — ONE SHARED RIGHT-SIDE SCROLLBAR
           The fixed game stage is the only vertical scroll owner.
           Color Dicing and every Original Game therefore use the same
           page scrollbar instead of each game creating its own.
           ============================================================ */
        .casex-d4-original-game-stage .original-games-overlay{
          position:relative !important;
          inset:auto !important;
          top:auto !important;
          right:auto !important;
          bottom:auto !important;
          left:auto !important;
          width:100% !important;
          min-width:0 !important;
          min-height:100% !important;
          height:auto !important;
          margin:0 !important;
          padding:0 !important;
          overflow:visible !important;
          box-sizing:border-box !important;
          background:transparent !important;
        }

        .casex-d4-original-game-stage{
          overflow-y:auto !important;
          overflow-x:hidden !important;
          scrollbar-width:thin !important;
          scrollbar-color:rgba(157,108,255,.48) transparent !important;
        }

        .casex-d4-original-game-stage::-webkit-scrollbar{
          width:8px !important;
        }

        .casex-d4-original-game-stage::-webkit-scrollbar-track{
          background:transparent !important;
        }

        .casex-d4-original-game-stage::-webkit-scrollbar-thumb{
          background:linear-gradient(180deg,rgba(157,108,255,.62),rgba(112,66,210,.48)) !important;
          border:2px solid transparent !important;
          background-clip:padding-box !important;
          border-radius:999px !important;
        }

        .casex-d4-original-game-stage::-webkit-scrollbar-thumb:hover{
          background:linear-gradient(180deg,rgba(173,122,255,.78),rgba(125,75,226,.66)) !important;
          border:2px solid transparent !important;
          background-clip:padding-box !important;
        }

        /* No Originals child gets its own page-sized scrollbar. */
        .casex-d4-original-game-stage .original-games-page,
        .casex-d4-original-game-stage .original-games-shell{
          overflow:visible !important;
        }
      `}</style>

      <GamePortal
        open={gamePortalOpen}
        initialGame={gamePortalGame}
        initialTab={gamePortalTab}
        authUser={authUser}
        balance={balance}
        inventory={inventory}
        onClose={closeGamePortal}
        onOpenCase={openCaseFromGamePortal}
        onRefreshInventory={loadInventory}
        onBalanceChange={setBalance}
        openAuth={openAuth}
      />

      {/* GLOBAL CASEX SIDEBAR
          This lives outside the homepage <main> so it remains mounted on
          Game Portal, Original Games, Color Dicing, Marketplace, Cases,
          Inventory and every other full-screen surface. */}
      <aside
        className={`casex-d4-sidebar casex-d4-global-sidebar ${
          d4SidebarOpen ? "is-open" : "is-closed"
        } ${originalGameOpen ? "is-original-game" : ""}`}
        aria-label="CASEX navigation"
      >
        {d4SidebarOpen && (
          <div className="casex-d4-sidebar-head">
            <div className="casex-d4-sidebar-logo">✦</div>
            <div>
              <strong>CASEX</strong>
              <small>PLAY HUB</small>
            </div>
          </div>
        )}

        <div className="casex-d4-side-label">PLAY</div>

        <button
          type="button"
          className={`casex-d4-side-link ${gamePortalOpen ? "active" : ""}`}
          onClick={() => {
            if (opening) return;
            closeOriginalGame();
            setD4SidebarSection("games");
            openGamePortal(null, "marketplace");
          }}
        >
          <span>◫</span> Games
        </button>

        <div className="casex-d4-side-label">MAIN</div>

        <button
          type="button"
          className={`casex-d4-side-link ${d4SidebarSection === "home" && !gamePortalOpen && !originalGameOpen ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            closeOriginalGame();
            setD4SidebarSection("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span>⌂</span> Home
        </button>

        <button
          type="button"
          className={`casex-d4-side-link ${d4SidebarSection === "originals" && !originalGameOpen ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            closeOriginalGame();
            setD4SidebarSection("originals");
            window.setTimeout(() => {
              document.getElementById("original-games")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 40);
          }}
        >
          <span>◈</span> Originals
        </button>

        <button
          type="button"
          className={`casex-d4-side-link ${d4SidebarSection === "marketplace" && !gamePortalOpen ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            closeOriginalGame();
            setD4SidebarSection("marketplace");
            window.setTimeout(() => {
              const marketplaceSection = document.getElementById("marketplace");
              if (!marketplaceSection) return;

              // The topbar is fixed, so scroll the Marketplace section slightly
              // below it instead of placing the section underneath the header.
              const nav = document.querySelector(".casex-design4-nav");
              const navHeight = nav?.getBoundingClientRect?.().height || 74;
              const topGap = 16;
              const targetTop =
                marketplaceSection.getBoundingClientRect().top +
                window.scrollY -
                navHeight -
                topGap;

              window.scrollTo({
                top: Math.max(0, targetTop),
                left: 0,
                behavior: "smooth",
              });
            }, 40);
          }}
        >
          <span>◉</span> Marketplace
        </button>

        <button
          type="button"
          className={`casex-d4-side-link ${d4SidebarSection === "cases" && !gamePortalOpen ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            closeOriginalGame();
            setD4SidebarSection("cases");
            window.setTimeout(() => {
              document.getElementById("cases")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 40);
          }}
        >
          <span>▣</span> Cases
        </button>

        <button
          type="button"
          className={`casex-d4-side-link ${
            d4SidebarSection === "inventory" &&
            gamePortalOpen &&
            gamePortalGame === "steal-a-brainrot" &&
            gamePortalTab === "inventory"
              ? "active"
              : ""
          }`}
          onClick={() => {
            if (opening) return;
            closeOriginalGame();
            setD4SidebarSection("inventory");
            openGamePortal("steal-a-brainrot", "inventory");
          }}
        >
          <span>▤</span> Inventory
        </button>

        <div className="casex-d4-side-label">ORIGINAL GAMES</div>

        <button
          type="button"
          className={`casex-d4-side-game dicing ${originalGameOpen === "dicing" ? "active" : ""}`}
          onClick={openColorDicing}
        >
          <span className="casex-d4-side-game-icon">🎲</span><span>Color Dicing</span>
        </button>

        <button
          type="button"
          className={`casex-d4-side-game mines ${originalGameOpen === "mines" ? "active" : ""}`}
          onClick={openMines}
        >
          <span className="casex-d4-side-game-icon">💣</span><span>Mines</span>
        </button>

        <button
          type="button"
          className={`casex-d4-side-game towers ${originalGameOpen === "towers" ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            openOriginalGame("towers");
          }}
        >
          <span className="casex-d4-side-game-icon">🎯</span><span>Towers</span>
        </button>

        <button
          type="button"
          className={`casex-d4-side-game plinko ${originalGameOpen === "plinko" ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            openOriginalGame("plinko");
          }}
        >
          <span className="casex-d4-side-game-icon">🔺</span><span>Plinko</span>
        </button>

        <button
          type="button"
          className={`casex-d4-side-game chicken ${originalGameOpen === "chicken" ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            openOriginalGame("chicken");
          }}
        >
          <span className="casex-d4-side-game-icon">🐔</span><span>Chicken Road</span>
        </button>

        <button
          type="button"
          className={`casex-d4-side-game coinflip ${originalGameOpen === "coinflip" ? "active" : ""}`}
          onClick={() => {
            closeGamePortal();
            openOriginalGame("coinflip");
          }}
        >
          <span className="casex-d4-side-game-icon">🪙</span><span>Coinflip</span>
        </button>

        <div className="casex-d4-sidebar-spacer"></div>

        <div className="casex-d4-sidebar-promo">
          <span className="casex-d4-promo-icon">ϟ</span>
          <div><strong>DAILY REWARDS</strong><small>Play more. Earn more.</small></div>
        </div>
      </aside>

      <style>{`
        /* ============================================================
           CASEX GLOBAL SIDEBAR — ALWAYS MOUNTED + FIXED
           The sidebar is outside <main>, so hiding a page/overlay can
           never remove the navigation.
           ============================================================ */
        .casex-d4-global-sidebar{
          position:fixed !important;
          left:0 !important;
          top:74px !important;
          bottom:0 !important;
          width:236px !important;
          height:auto !important;
          margin:0 !important;
          box-sizing:border-box !important;
          overflow-y:auto !important;
          overflow-x:hidden !important;
          z-index:11000 !important;
          transform:translateX(0) !important;
          opacity:1 !important;
          pointer-events:auto !important;
          display:flex !important;
          flex-direction:column !important;
        }

        .casex-d4-global-sidebar.is-closed{
          width:64px !important;
          transform:translateX(-102%) !important;
          pointer-events:none !important;
        }

        .casex-d4-global-sidebar.is-open{
          transform:translateX(0) !important;
          pointer-events:auto !important;
        }

        /* Game Portal is a full-screen overlay. Reserve the fixed sidebar
           so its content never renders underneath the navigation. */
        /* ============================================================
           CASEX — INSTANT CASE REFRESH RESTORE
           Never expose the homepage while a cold case restore is loading.
           ============================================================ */
        .casex-case-restore-screen{
          position:fixed !important;
          inset:0 !important;
          z-index:4000 !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          padding-left:236px !important;
          box-sizing:border-box !important;
          background:#08090d !important;
        }

        .casex-case-restore-card{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:12px;
          color:#8f879e;
          font-size:12px;
          font-weight:700;
        }

        .casex-case-restore-spinner{
          width:28px;
          height:28px;
          border:2px solid rgba(157,111,255,.18);
          border-top-color:#9d6fff;
          border-radius:50%;
          animation:casexCaseRestoreSpin .72s linear infinite;
        }

        @keyframes casexCaseRestoreSpin{
          to{transform:rotate(360deg)}
        }

        @media(max-width:700px){
          .casex-case-restore-screen{
            padding-left:184px !important;
          }
        }

        body.casex-global-sidebar-open .game-portal-overlay{
          padding-left:236px !important;
          box-sizing:border-box !important;
        }

        body.casex-global-sidebar-closed .game-portal-overlay{
          padding-left:64px !important;
          box-sizing:border-box !important;
        }

        /* Keep Original Games and Color Dicing aligned with the same
           fixed navigation width. */
        body.casex-global-sidebar-open .casex-d4-original-game-stage{
          margin-left:0 !important;
        }

        /* All Cases is a fixed full-screen page, so the normal main
           padding cannot reserve space for the fixed global sidebar.
           Shift the fixed Cases surface itself so the sidebar never
           covers its controls or case cards. */
        @media(min-width:701px){
          body.casex-global-sidebar-open .all-cases-page{
            left:236px !important;
            right:0 !important;
            width:auto !important;
          }
        }

        @media(max-width:700px){
          body.casex-global-sidebar-open .all-cases-page{
            left:184px !important;
            right:0 !important;
            width:auto !important;
          }
        }

        @media(max-width:700px){
          .casex-d4-global-sidebar{
            position:fixed !important;
            top:68px !important;
            bottom:0 !important;
            width:184px !important;
            height:auto !important;
          }

          .casex-d4-global-sidebar.is-closed{
            width:64px !important;
          }

          body.casex-global-sidebar-open .game-portal-overlay{
            padding-left:184px !important;
          }

          body.casex-global-sidebar-closed .game-portal-overlay{
            padding-left:64px !important;
          }
        }
      `}</style>

      <main
        id="home"
        className={`homepage-redesign casex-design4-main ${jackpotPageOpen ? "jackpot-page-root" : ""} ${d4SidebarOpen ? "casex-d4-sidebar-open" : "casex-d4-sidebar-closed"}`}
        style={{
          display:
            originalGameOpen ||
            colorDicingOpen ||
            (caseRestorePending && !selected)
              ? "none"
              : undefined,
        }}
      >
        <div className="casex-d4-content">
        <section className="hero">
          <div className="hero-glow"></div>

          <div className="hero-copy">
            <div className="eyebrow">
              ⚡ THE NEXT GENERATION CASE PLATFORM
            </div>

            <h1>
              Original games.
              <br />
              <span>Built different.</span>
            </h1>

            <p>
              Fast, fair originals built for quick games.
              Pick a game, place your bet and play.
            </p>

            <a
              className="primary hero-cta"
              href="#original-games"
            >
              <span>Explore Games</span>
              <span>→</span>
            </a>

            <div className="stats hero-stats">
              <div>
                <strong>{decoratedCases.length}</strong>
                <small>Active cases</small>
              </div>

              <div>
                <strong>5</strong>
                <small>Rarity tiers</small>
              </div>

              <div>
                <strong>24/7</strong>
                <small>Instant results</small>
              </div>
            </div>

            <div className="hero-trust-strip">
              <div>
                <span className="hero-trust-icon">✓</span>
                <span>
                  <b>Provably fair</b>
                  <small>Server-side results</small>
                </span>
              </div>

              <div>
                <span className="hero-trust-icon">⚡</span>
                <span>
                  <b>Instant reveals</b>
                  <small>Fast case openings</small>
                </span>
              </div>

              <div>
                <span className="hero-trust-icon">◆</span>
                <span>
                  <b>Real rewards</b>
                  <small>Track every item</small>
                </span>
              </div>
            </div>
          </div>

          <div className="hero-case">
            <div className="hero-case-aura"></div>
            <div className="orbit orbit-a"></div>
            <div className="orbit orbit-b"></div>

            <div className="hero-case-platform">
              <div className="hero-case-platform-ring"></div>
            </div>

            <div className="hero-case-box">
              <div className="hero-case-top">
                <span>CaseX</span>
              </div>

              <div className="hero-case-front">
                <span className="hero-case-emblem">★</span>
                <span className="hero-case-lock"></span>
              </div>

              <div className="hero-case-side"></div>
              <div className="hero-case-base"></div>
            </div>

            <div className="rarity-card">
              <span>TOP DROP</span>
              <b>LEGENDARY</b>
              <em>2.7% CHANCE</em>
            </div>

            <div className="hero-live-wins">
              <div className="hero-live-wins-head">
                <span><i></i> LIVE WINS</span>
                <small>Updating</small>
              </div>
              {(liveActivity.slice(0, 3)).map((item, index) => (
                <div className="hero-live-win" key={`hero-live-${item.id}-${index}`}>
                  <span className="hero-live-win-art">
                    <ItemArt rarity={item.rarity} imageUrl={item.image_url || item.imageUrl} compact />
                  </span>
                  <div>
                    <strong>{item.username || "Player"}</strong>
                    <small>won {item.itemName || "Rare Item"}</small>
                  </div>
                  <b>${(Number(item.valueCents || 0) / 100).toFixed(2)}</b>
                </div>
              ))}
              {!liveActivity.length && (
                <div className="hero-live-empty">Waiting for the next big win...</div>
              )}
            </div>
          </div>
        </section>

        <section className="casex-brainrot-deposit-promo" aria-label="Deposit Brainrots">
          <div className="casex-brainrot-deposit-copy">
            <div className="casex-brainrot-deposit-kicker">STEAL A BRAINROT</div>
            <h2>Got Brainrots? Turn them into CaseX balance.</h2>
            <p>Check accepted Brainrots, see their current deposit value, and submit your items through Discord.</p>
            <button type="button" className="casex-brainrot-deposit-cta" onClick={() => openGamePortal("steal-a-brainrot", "deposit")}>
              <span>Deposit Brainrots</span>
              <span>→</span>
            </button>
          </div>

          <div className="casex-brainrot-deposit-art" aria-hidden="true">
            <div className="casex-brainrot-deposit-glow"></div>
            <img src="/steal-a-brainrot-logo.png" alt="" draggable="false" />
          </div>
        </section>

        <section id="original-games" className="casex-game-hub section">
          <div className="casex-hub-heading">
            <div>
              <div className="eyebrow">⚡ FEATURED GAMES</div>
              <h2>Jump into what's hot.</h2>
            </div>
            <button
              type="button"
              className="home-section-link casex-hub-link"
              onClick={() => openGamePortal("steal-a-brainrot", "marketplace")}
            >
              Explore games →
            </button>
          </div>

          <div className="casex-featured-games">
            <button
              type="button"
              className="casex-feature-card sab"
              onClick={() => openGamePortal("steal-a-brainrot", "marketplace")}
            >
              <div className="casex-feature-art">
                <div className="casex-feature-glow"></div>
                <img src="/steal-a-brainrot-logo.png" alt="Steal a Brainrot" draggable="false" />
              </div>
              <div className="casex-feature-copy">
                <strong>STEAL A BRAINROT</strong>
                <span>Trade. Steal. Collect.</span>
                <b>Play Now →</b>
              </div>
            </button>

            <button
              type="button"
              className="casex-feature-card donut"
              onClick={() => openGamePortal("donutsmp", "marketplace")}
            >
              <div className="casex-feature-art">
                <div className="casex-feature-glow"></div>
                <img src="/donutsmp-logo-transparent.png" alt="DonutSMP" draggable="false" />
              </div>
              <div className="casex-feature-copy">
                <strong>DONUTSMP</strong>
                <span>Play. Earn. Upgrade.</span>
                <b>Play Now →</b>
              </div>
            </button>

            <button
              type="button"
              className="casex-feature-card mines"
              onClick={openMines}
            >
              <div className="casex-feature-art">
                <div className="casex-feature-icon">💣</div>
                <div className="casex-feature-glow"></div>
              </div>
              <div className="casex-feature-copy">
                <strong>MINES</strong>
                <span>Find the safe tiles.</span>
                <b>Play Now →</b>
              </div>
            </button>
          </div>

          <div className="casex-all-games-heading">
            <div>
              <div className="eyebrow">🎮 ORIGINAL GAMES</div>
              <h2>Built different.</h2>
            </div>
          </div>

          <div className="casex-all-games">
            <button type="button" className="casex-mini-game dicing" onClick={openColorDicing}>
              <span className="casex-mini-icon">🎲</span>
              <strong>Color Dicing</strong>
              <small>Roll and win</small>
              <b>Play Now</b>
            </button>

            <button type="button" className="casex-mini-game mines" onClick={openMines}>
              <span className="casex-mini-icon">💣</span>
              <strong>Mines</strong>
              <small>Find the safe tiles</small>
              <b>Play Now</b>
            </button>

            <button type="button" className="casex-mini-game towers" onClick={() => openOriginalGame("towers")}>
              <span className="casex-mini-icon">🎯</span>
              <strong>Towers</strong>
              <small>Climb higher</small>
              <b>Play Now</b>
            </button>

            <button type="button" className="casex-mini-game plinko" onClick={() => openOriginalGame("plinko")}>
              <span className="casex-mini-icon">🔺</span>
              <strong>Plinko</strong>
              <small>Drop and hope</small>
              <b>Play Now</b>
            </button>

            <button type="button" className="casex-mini-game chicken" onClick={() => openOriginalGame("chicken")}>
              <span className="casex-mini-icon">🐔</span>
              <strong>Chicken Road</strong>
              <small>Cross. Risk. Win.</small>
              <b>Play Now</b>
            </button>

            <button type="button" className="casex-mini-game coinflip" onClick={() => openOriginalGame("coinflip")}>
              <span className="casex-mini-icon">🪙</span>
              <strong>Coinflip</strong>
              <small>Pick your side</small>
              <b>Play Now</b>
            </button>
          </div>
        </section>

        <section id="marketplace" className="home-feature-zone section">
          <div className="home-feature-heading">
            <div>
              <div className="eyebrow">FEATURED NOW</div>
              <h2>See what everyone is chasing.</h2>
              <p>Live jackpot action and the items currently standing out in the marketplace.</p>
            </div>
          </div>

          <div className="home-feature-grid">
            <section className="home-trending-items home-trending-feature">
              <div className="home-section-heading compact">
                <div>
                  <div className="eyebrow">TRENDING ITEMS</div>
                  <h2>Popular right now</h2>
                </div>
                <button type="button" className="home-section-link" onClick={() => openGamePortal("steal-a-brainrot", "marketplace")}>View Marketplace →</button>
              </div>

              {homeTrendingLoading ? (
                <div className="home-trending-empty">Loading marketplace highlights...</div>
              ) : homeTrendingItems.length ? (
                <div className="home-trending-grid home-trending-grid-feature">
                  {homeTrendingItems.map((item) => (
                    <button type="button" className="home-trending-card home-trending-card-feature" key={item.id} onClick={() => openGamePortal("steal-a-brainrot", "marketplace")}>
                      <div className="home-trending-art">
                        <ItemArt rarity={item.rarity} imageUrl={item.imageUrl || item.image_url} />
                      </div>
                      <div className="home-trending-card-copy">
                        <strong>{item.name || "Featured Item"}</strong>
                        <small>{item.rarity || "Common"}</small>
                        <span>${(Number(item.priceCents || 0) / 100).toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="home-trending-empty">No marketplace highlights available right now.</div>
              )}
            </section>
          </div>
        </section>

<section
          id="cases"
          className="section"
        >
          <div className="section-head">
            <div>
              <div className="eyebrow">
                CHOOSE YOUR FATE
              </div>

              <h2>
                Featured Cases
              </h2>
            </div>

            <button
              type="button"
              className="view-all-cases-button"
              onClick={openCasesPage}
            >
              View all cases
              <span>→</span>
            </button>
          </div>

          <div className="case-grid">
            {featuredCases.slice(0, 4).map(
              (c) => (
                <article
                  className={`case-card ${c.accent}`}
                  key={c.id}
                  onClick={() =>
                    previewCase(c)
                  }
                >
                  <div className="case-card-topline">
                    <div className="tag">
                      {c.tag}
                    </div>

                    <span className="case-status">
                      LIVE
                    </span>
                  </div>

                  <div
                    className="case-art-wrap"
                    style={{
                      position: "relative",
                      height: "180px",
                      minHeight: "180px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div className="case-art-glow"></div>
                    {c.image_url ? (
                      <img
                        className="case-card-custom-image"
                        style={{
                          position: "relative",
                          zIndex: 1,
                          width: "auto",
                          height: "auto",
                          maxWidth: "92%",
                          maxHeight: "92%",
                          objectFit: "contain",
                          objectPosition: "center",
                          display: "block",
                          flex: "0 0 auto",
                        }}
                        src={c.image_url}
                        alt={`${c.name} case artwork`}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <CaseArt
                        caseId={c.id}
                        accent={c.accent}
                      />
                    )}
                  </div>

                  <div className="case-card-info">
                    <div>
                      <h3>
                        {c.name}
                      </h3>

                      <p>
                        {c.description}
                      </p>
                    </div>

                    <div className="case-price">
                      <small>
                        OPEN
                      </small>

                      <strong>
                        $
                        {c.price.toFixed(
                          2
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="drops">
                    <span className="drop-common">
                      Common
                    </span>

                    <span className="drop-rare">
                      Rare
                    </span>

                    <span className="drop-epic">
                      Epic
                    </span>

                    <span className="drop-legendary">
                      Legendary
                    </span>

                    <span className="drop-secret">
                      Secret
                    </span>
                  </div>

                  <button
                    className="case-view-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      previewCase(c);
                    }}
                    disabled={
                      loading ||
                      opening ||
                      previewLoading
                    }
                  >
                    <span>
                      {previewLoading
                        ? "Loading..."
                        : "View case"}
                    </span>

                    <b>
                      →
                    </b>
                  </button>
                </article>
              )
            )}
          </div>
        </section>

        {casesPageOpen && (
          <div className="all-cases-page">
            <div className="all-cases-page-inner">
              <div className="all-cases-topbar">
                <button
                  type="button"
                  className="back-button all-cases-back"
                  onClick={closeCasesPage}
                >
                  ← Back to home
                </button>

                <div className="all-cases-heading">
                  <div className="eyebrow">
                    CHOOSE YOUR FATE
                  </div>
                  <h1>All Cases</h1>
                  <p>
                    Browse every available case and find your next big drop.
                  </p>
                </div>

                <div className="all-cases-count">
                  <strong>{visibleCases.length}</strong>
                  <span>{visibleCases.length === 1 ? "CASE" : "CASES"} FOUND</span>
                </div>
              </div>

              <div className="all-cases-toolbar">
                <label className="all-cases-search">
                  <span aria-hidden="true">⌕</span>
                  <input type="search" value={casesSearch} onChange={(event) => setCasesSearch(event.target.value)} placeholder="Search cases..." aria-label="Search cases" />
                  {casesSearch && <button type="button" onClick={() => setCasesSearch("")} aria-label="Clear search">×</button>}
                </label>
                <div className="all-cases-filter-row">
                  <div className="all-cases-tag-filters">
                    {allCaseTags.slice(0, 6).map((tag) => (
                      <button key={tag} type="button" className={casesTagFilter === tag ? "active" : ""} onClick={() => setCasesTagFilter(tag)}>{tag}</button>
                    ))}
                  </div>
                  <select className="all-cases-sort all-cases-game-filter" value={casesGameFilter} onChange={(event) => setCasesGameFilter(event.target.value)} aria-label="Filter cases by game">
                    <option value="all">All games</option>
                    <option value="steal-a-brainrot">Steal a Brainrot</option>
                    <option value="donutsmp">DonutSMP</option>
                  </select>
                  <select className="all-cases-sort" value={casesSort} onChange={(event) => setCasesSort(event.target.value)} aria-label="Sort cases">
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to high</option>
                    <option value="price-high">Price: High to low</option>
                    <option value="name">Name: A–Z</option>
                  </select>
                </div>
              </div>

              <div className="case-grid all-cases-grid">
                {visibleCases.map((c) => (
                  <article
                    className={`case-card ${c.accent}`}
                    key={c.id}
                    onClick={() => previewCase(c)}
                  >
                    <div className="case-card-topline">
                      <div className="tag">
                        {c.tag}
                      </div>

                      <span className="case-status">
                        LIVE
                      </span>
                    </div>

                    <div
                      className="case-art-wrap"
                      style={{
                        position: "relative",
                        height: "190px",
                        minHeight: "190px",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        padding: "8px 16px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div className="case-art-glow"></div>
                      {c.image_url ? (
                        <img
                          className="case-card-custom-image"
                          style={{
                            position: "relative",
                            zIndex: 1,
                            width: "auto",
                            height: "auto",
                            maxWidth: "82%",
                            maxHeight: "82%",
                            objectFit: "contain",
                            objectPosition: "center",
                            display: "block",
                            flex: "0 0 auto",
                            transform: "none",
                          }}
                          src={c.image_url}
                          alt={`${c.name} case artwork`}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <CaseArt
                          caseId={c.id}
                          accent={c.accent}
                        />
                      )}
                    </div>

                    <div className="case-card-info">
                      <div>
                        <h3>{c.name}</h3>
                        <p>{c.description}</p>
                      </div>

                      <div className="case-price">
                        <small>OPEN</small>
                        <strong>${c.price.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="drops">
                      <span className="drop-common">Common</span>
                      <span className="drop-rare">Rare</span>
                      <span className="drop-epic">Epic</span>
                      <span className="drop-legendary">Legendary</span>
                      <span className="drop-secret">Secret</span>
                    </div>

                    <button
                      type="button"
                      className="case-view-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        previewCase(c);
                      }}
                      disabled={
                        loading ||
                        opening ||
                        previewLoading
                      }
                    >
                      <span>
                        {previewLoading ? "Loading..." : "View case"}
                      </span>
                      <b>→</b>
                    </button>
                  </article>
                ))}
              </div>

              {visibleCases.length === 0 && (
                <div className="all-cases-empty">
                  <div>⌕</div>
                  <h3>No cases found</h3>
                  <p>Try a different search or filter.</p>
                  <button type="button" className="secondary-button" onClick={() => { setCasesSearch(""); setCasesTagFilter("All"); setCasesSort("featured"); }}>Clear filters</button>
                </div>
              )}
            </div>
          </div>
        )}

        <section className="section live-activity-section">
          <div className="recent-wins live-activity-panel">
            <div className="recent-wins-head">
              <div>
                <div className="eyebrow">
                  LIVE ACTIVITY
                </div>

                <h3>
                  Recent winners
                </h3>
              </div>

              <span className="live-activity-status">
                <i></i>
                Updating live
              </span>
            </div>

            {liveActivityLoading && !liveActivity.length ? (
              <div className="live-activity-loading">
                Loading recent wins...
              </div>
            ) : liveActivity.length ? (
              <div className="recent-wins-grid live-activity-grid">
                {liveActivity.slice(0, 6).map((item, index) => {
                  const isOriginal = item.type === "original";
                  const status = String(item.status || "").toLowerCase();
                  const payoutCents = Number(item.payoutCents ?? item.valueCents ?? 0);
                  const betCents = Number(item.betCents || 0);
                  const isWin = status === "won" || status === "cashed_out" || payoutCents > 0;
                  const gameLabel = item.gameLabel || item.game || "Original Game";
                  const resultTitle = isOriginal
                    ? (status === "cashed_out"
                      ? `${item.username || "Player"} cashed out ${gameLabel}`
                      : isWin
                        ? `${item.username || "Player"} won ${gameLabel}`
                        : `${item.username || "Player"} lost on ${gameLabel}`)
                    : `${item.username || "Player"} won ${item.itemName}`;
                  const resultSubtitle = isOriginal
                    ? `${status === "cashed_out" ? "Cashed out" : status === "won" ? "Won" : "Lost"} · Bet $${(betCents / 100).toFixed(2)}${Number.isFinite(Number(item.multiplier)) && Number(item.multiplier) > 0 ? ` · ${Number(item.multiplier).toFixed(2)}x` : ""}`
                    : `${item.rarity} · ${item.caseName}`;
                  const displayCents = isOriginal ? payoutCents : Number(item.valueCents || 0);

                  return (
                    <div
                      className={`recent-win ${isOriginal ? "original-game" : rarityClass(item.rarity)}${
                        liveActivityEnteringId === item.id ? " live-activity-entering" : ""
                      }`}
                      key={`${item.id}-${item.userId}-${index}`}
                    >
                      <span className="recent-win-icon">
                        {isOriginal ? (
                          <span
                            aria-hidden="true"
                            style={{ fontSize: 18, lineHeight: 1 }}
                          >
                            {item.icon || "🎮"}
                          </span>
                        ) : (
                          <ItemArt rarity={item.rarity} imageUrl={item.image_url || item.imageUrl} compact />
                        )}
                      </span>

                      <div>
                        <strong>{resultTitle}</strong>
                        <small>{resultSubtitle}</small>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                        {liveActivityEnteringId === item.id && (
                          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: "#ffffff", background: "#a57cff", borderRadius: 999, padding: "3px 7px", boxShadow: "0 0 18px rgba(165,124,255,.35)" }}>NEW</span>
                        )}
                        <b style={{ color: isOriginal && !isWin ? "#ff8b9d" : undefined }}>
                          {isOriginal && !isWin ? "-$" : "$"}{(displayCents / 100).toFixed(2)}
                        </b>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="live-activity-empty">
                No recent activity has been recorded yet. Be the first to play.
              </div>
            )}
          </div>

        </section>

        <section
          id="inventory"
          className="section inventory-section"
        >
          <div className="section-head inventory-heading">
            <div>
              <div className="eyebrow">
                YOUR ITEMS
              </div>

              <h2>
                Inventory
              </h2>

              <p className="inventory-subtitle">
                {inventory.length} item
                {inventory.length ===
                1
                  ? ""
                  : "s"}{" "}
                in your collection
              </p>
            </div>

            <div className="inventory-total">
              <span>
                Total value
              </span>

              <strong>
                $
                {(
                  inventoryValue /
                  100
                ).toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="inventory-toolbar">
            <div className="inventory-filters">
              {inventoryFilters.map(
                (filter) => (
                  <button
                    key={filter}
                    className={
                      inventoryFilter ===
                      filter
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setInventoryFilter(
                        filter
                      )
                    }
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            <div className="inventory-actions">
              <button
                type="button"
                className={`inventory-withdrawal-history-toggle ${
                  withdrawalHistoryOpen
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setWithdrawalHistoryOpen(
                    (current) => !current
                  )
                }
              >
                Withdrawal history
                {itemWithdrawalHistory.length > 0 && (
                  <span className="inventory-withdrawal-history-count">
                    {itemWithdrawalHistory.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`inventory-select-toggle ${
                  inventorySelectMode
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setInventorySelectMode(
                    (current) =>
                      !current
                  );

                  clearInventorySelection();
                }}
              >
                {inventorySelectMode
                  ? "Done"
                  : "Select items"}
              </button>

              <select
                value={
                  inventorySort
                }
                onChange={(event) =>
                  setInventorySort(
                    event.target.value
                  )
                }
              >
                <option value="newest">
                  Newest
                </option>

                <option value="value-high">
                  Highest value
                </option>

                <option value="value-low">
                  Lowest value
                </option>

                <option value="rarity">
                  Rarest first
                </option>
              </select>
            </div>
          </div>

          {withdrawalHistoryOpen && (
            <div className="inventory-withdrawal-history-panel">
              <div className="inventory-withdrawal-history-head">
                <div>
                  <div className="eyebrow">
                    ITEM DELIVERY
                  </div>
                  <h3>Withdrawal history</h3>
                  <p>
                    Track your manual in-game item deliveries.
                  </p>
                </div>

                <button
                  type="button"
                  className="inventory-withdrawal-history-refresh"
                  onClick={loadItemWithdrawalHistory}
                  disabled={itemWithdrawalHistoryLoading}
                >
                  {itemWithdrawalHistoryLoading
                    ? "Loading..."
                    : "Refresh"}
                </button>
              </div>

              {itemWithdrawalHistoryLoading &&
              !itemWithdrawalHistory.length ? (
                <div className="inventory-withdrawal-history-empty">
                  Loading withdrawal history...
                </div>
              ) : itemWithdrawalHistory.length === 0 ? (
                <div className="inventory-withdrawal-history-empty">
                  <strong>No item withdrawals yet</strong>
                  <span>
                    Your manual-delivery withdrawal requests will appear here.
                  </span>
                </div>
              ) : (
                <div className="inventory-withdrawal-history-list">
                  {itemWithdrawalHistory.map((withdrawal) => {
                    const status = String(
                      withdrawal.status || "pending"
                    ).toLowerCase();

                    const statusLabel =
                      status === "completed"
                        ? "Delivered"
                        : status === "cancelled"
                        ? "Cancelled"
                        : "Pending";

                    const statusClass =
                      status === "completed"
                        ? "delivered"
                        : status === "cancelled"
                        ? "cancelled"
                        : "pending";

                    const withdrawalDate =
                      withdrawal.created_at
                        ? new Date(
                            withdrawal.created_at
                          )
                        : null;

                    const formattedDate =
                      withdrawalDate &&
                      !Number.isNaN(
                        withdrawalDate.getTime()
                      )
                        ? withdrawalDate.toLocaleDateString(
                            undefined,
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Date unavailable";

                    const formattedTime =
                      withdrawalDate &&
                      !Number.isNaN(
                        withdrawalDate.getTime()
                      )
                        ? withdrawalDate.toLocaleTimeString(
                            undefined,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "";

                    const reference =
                      withdrawal.reference ||
                      `WD-${withdrawal.id}`;

                    return (
                      <div
                        className="inventory-withdrawal-history-row"
                        key={withdrawal.id}
                      >
                        <div className="inventory-withdrawal-history-art">
                          <ItemArt
                            rarity={
                              withdrawal.rarity
                            }
                            imageUrl={
                              withdrawal.image_url
                            }
                            compact
                          />
                        </div>

                        <div className="inventory-withdrawal-history-info">
                          <div className="inventory-withdrawal-history-topline">
                            <strong>
                              {withdrawal.item_name}
                            </strong>
                            <span
                              className={`inventory-withdrawal-history-status ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="inventory-withdrawal-history-meta">
                            <span>{reference}</span>
                            <span>
                              {withdrawal.rarity}
                            </span>
                            <span>
                              ${
                                (Number(
                                  withdrawal.value_cents ||
                                    0
                                ) / 100).toFixed(
                                  2
                                )
                              }
                            </span>
                            <span>
                              {formattedDate}
                              {formattedTime
                                ? ` · ${formattedTime}`
                                : ""}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="inventory-withdrawal-history-copy"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                reference
                              );
                            } catch {
                              alert(
                                `Your Withdrawal Code is ${reference}`
                              );
                            }
                          }}
                        >
                          Copy Code
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {inventorySelectMode &&
            inventory.length > 0 && (
              <div className="inventory-bulk-bar">
                <div className="inventory-bulk-info">
                  <strong>
                    {
                      selectedInventoryItems.length
                    }{" "}
                    item
                    {selectedInventoryItems.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    selected
                  </strong>

                  <span>
                    $
                    {(
                      selectedInventoryValue /
                      100
                    ).toFixed(2)}{" "}
                    total
                  </span>
                </div>

                <div className="inventory-bulk-actions">
                  <button
                    type="button"
                    className="inventory-bulk-secondary"
                    onClick={
                      selectAllVisibleInventory
                    }
                  >
                    Select all
                  </button>

                  <button
                    type="button"
                    className="inventory-bulk-secondary"
                    onClick={
                      clearInventorySelection
                    }
                    disabled={
                      !selectedInventoryItems.length
                    }
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    className="inventory-bulk-sell"
                    onClick={() =>
                      setBulkSellConfirm(
                        true
                      )
                    }
                    disabled={
                      !selectedInventoryItems.length ||
                      bulkSellLoading
                    }
                  >
                    Sell selected · $
                    {(
                      selectedInventoryValue /
                      100
                    ).toFixed(2)}
                  </button>

                  <button
                    type="button"
                    className="inventory-sell-all"
                    onClick={() => {
                      setSelectedInventoryIds(
                        new Set(
                          inventory.map(
                            (item) =>
                              Number(
                                item.id
                              )
                          )
                        )
                      );

                      setBulkSellConfirm(
                        true
                      );
                    }}
                    disabled={
                      !inventory.length ||
                      bulkSellLoading
                    }
                  >
                    Sell all · $
                    {(
                      inventoryValue /
                      100
                    ).toFixed(2)}
                  </button>
                </div>
              </div>
            )}

          {inventory.length === 0 ? (
            <div className="inventory-empty">
              <div>
                🎒
              </div>

              <h3>
                Your inventory is empty
              </h3>

              <p>
                Open a case and your
                rewards will appear here.
              </p>

              <a
                className="primary"
                href="#cases"
              >
                Browse Cases
              </a>
            </div>
          ) : visibleInventory.length ===
            0 ? (
            <div className="inventory-empty inventory-filter-empty">
              <div>
                🔎
              </div>

              <h3>
                No items in this rarity
              </h3>

              <p>
                Try another filter to
                see more of your
                collection.
              </p>

              <button
                className="secondary-button"
                onClick={() =>
                  setInventoryFilter(
                    "All"
                  )
                }
              >
                Show all items
              </button>
            </div>
          ) : (
            <div className="inventory-grid">
              {visibleInventory.map(
                (item) => {
                  const isWithdrawalPending =
                    String(item.status || "owned").toLowerCase() ===
                    "withdrawal_pending";

                  return (
                    <div
                      className={`inventory-card ${rarityClass(
                        item.rarity
                      )} ${
                        isWithdrawalPending
                          ? "inventory-card-withdrawal-pending"
                          : ""
                      } ${
                        selectedInventoryIds.has(
                          Number(item.id)
                        )
                          ? "inventory-card-selected"
                          : ""
                      } ${
                        Number(item.id) === Number(wonInventoryId)
                          ? "inventory-card-new"
                          : ""
                      }`}
                      key={item.id}
                      onClick={() => {
                        if (
                          inventorySelectMode &&
                          !isWithdrawalPending
                        ) {
                          toggleInventorySelection(
                            item.id
                          );
                        }
                      }}
                    >
                    {inventorySelectMode &&
                      !isWithdrawalPending && (
                      <button
                        type="button"
                        className={`inventory-select-check ${
                          selectedInventoryIds.has(
                            Number(
                              item.id
                            )
                          )
                            ? "selected"
                            : ""
                        }`}
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          toggleInventorySelection(
                            item.id
                          );
                        }}
                        aria-label={
                          selectedInventoryIds.has(
                            Number(
                              item.id
                            )
                          )
                            ? `Deselect ${item.name}`
                            : `Select ${item.name}`
                        }
                      >
                        {selectedInventoryIds.has(
                          Number(
                            item.id
                          )
                        )
                          ? "✓"
                          : ""}
                      </button>
                    )}

                    <div className="inventory-card-top">
                      <span className="inventory-rarity">
                        {item.rarity}
                      </span>

                      <span className="inventory-card-gem">
                        {item.rarity ===
                        "Secret"
                          ? "☄"
                          : item.rarity ===
                            "Legendary"
                          ? "👑"
                          : "◆"}
                      </span>
                    </div>

                    <div className="inventory-art">
                      <ItemArt
                        rarity={
                          item.rarity
                        }
                        imageUrl={
                          item.image_url || item.imageUrl
                        }
                      />
                    </div>

                    <div className="inventory-card-name">
                      {item.name}
                    </div>

                    <div className="inventory-card-value">
                      $
                      {(
                        Number(
                          item.value_cents ||
                            0
                        ) / 100
                      ).toFixed(2)}
                    </div>

                    {!inventorySelectMode &&
                      (isWithdrawalPending ? (
                        <div className="inventory-withdraw-pending">
                          <span className="inventory-withdraw-pending-dot" />
                          <span>Withdrawal pending</span>
                        </div>
                      ) : (
                        <div className="inventory-action-row">
                          <button
                            className="inventory-sell"
                            onClick={() =>
                              setSellConfirmItem(
                                item
                              )
                            }
                            disabled={
                              sellLoadingId ===
                              item.id ||
                              withdrawLoadingId ===
                              item.id
                            }
                          >
                            <span>
                              {sellLoadingId ===
                              item.id
                                ? "Selling..."
                                : "Sell item"}
                            </span>

                            <span>
                              $
                              {(
                                Number(
                                  item.value_cents ||
                                    0
                                ) / 100
                              ).toFixed(2)}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="inventory-withdraw"
                            onClick={() =>
                              setWithdrawConfirmItem(
                                item
                              )
                            }
                            disabled={
                              sellLoadingId ===
                              item.id ||
                              withdrawLoadingId ===
                              item.id
                            }
                          >
                            <span>
                              {withdrawLoadingId ===
                              item.id
                                ? "..."
                                : "Withdraw"}
                            </span>
                          </button>
                        </div>
                      ))}

                    {inventorySelectMode && (
                      <div className="inventory-select-label">
                        {isWithdrawalPending
                          ? "Withdrawal pending"
                          : selectedInventoryIds.has(
                              Number(
                                item.id
                              )
                            )
                          ? "Selected"
                          : "Select item"}
                      </div>
                    )}
                  </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section
          id="how"
          className="how section"
        >
          <div className="section-head centered">
            <div>
              <div className="eyebrow">
                SIMPLE BY DESIGN
              </div>

              <h2>
                How it works
              </h2>
            </div>
          </div>

          <div className="steps">
            <div>
              <i>01</i>

              <h3>
                Choose a case
              </h3>

              <p>
                Pick the case that matches
                the kind of rewards you want.
              </p>
            </div>

            <div>
              <i>02</i>

              <h3>
                Open it
              </h3>

              <p>
                The backend selects your
                reward and the reveal animation
                starts.
              </p>
            </div>

            <div>
              <i>03</i>

              <h3>
                Get your reward
              </h3>

              <p>
                Your reward is selected from
                the case's configured probability
                table.
              </p>
            </div>
          </div>
        </section>

        <section
          id="wallet"
          className="section wallet-section"
        >
          <div className="wallet-dashboard wallet-dashboard-simple wallet-dashboard-premium">
            <div>
              <div className="eyebrow">
                WALLET
              </div>

              <h2>
                Your balance
              </h2>

              <div className="wallet-big-balance">
                $
                {balance.toFixed(2)}
              </div>

              <p>
                Balance is read from the
                server. The browser never
                writes the wallet balance
                directly.
              </p>

              <button
                className="primary wallet-manage-button"
                onClick={() => {
                  if (!authUser) {
                    openAuth("login");
                    return;
                  }

                  setWalletOpen(true);
                  setWalletTab(
                    "wallet"
                  );
                  setWalletAction(
                    "deposit"
                  );
                }}
              >
                Manage wallet →
              </button>
            </div>

            <div className="wallet-quick-stats wallet-quick-stats-premium">
              <div>
                <span>
                  Inventory value
                </span>

                <strong>
                  $
                  {(
                    inventoryValue /
                    100
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Items owned
                </span>

                <strong>
                  {inventory.length}
                </strong>
              </div>

              <div>
                <span>
                  Transactions
                </span>

                <strong>
                  {transactions.length}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="section faq"
        >
          <div className="eyebrow">
            QUESTIONS
          </div>

          <h2>
            FAQ
          </h2>

          <details open>
            <summary>
              How are rewards selected?
            </summary>

            <p>
              The backend uses weighted
              probabilities stored with
              each case. The browser
              animation does not determine
              the result.
            </p>
          </details>

          <details>
            <summary>
              Can I add real payments?
            </summary>

            <p>
              Yes. Connect a payment
              provider on the backend,
              credit the user's wallet only
              after a verified webhook, and
              never trust client-side balance
              changes.
            </p>
          </details>

          <details>
            <summary>
              Can I add accounts and
              inventory?
            </summary>

            <p>
              Yes. The database already
              stores users, wallets, cases,
              items, openings, inventory and
              transaction history.
            </p>
          </details>
        </section>
        </div>
      </main>

      {!originalGameOpen && !colorDicingOpen && (
        <footer>
          <div className="brand">
            <div className="brand-mark">
              ✦
            </div>

            <span>
              CASE<span>X</span>
            </span>
          </div>

        </footer>
      )}

      {bulkSellConfirm && (
        <div
          className="sell-confirm-backdrop"
          onClick={() =>
            !bulkSellLoading &&
            setBulkSellConfirm(false)
          }
        >
          <div
            className="sell-confirm-modal bulk-sell-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close"
              onClick={() =>
                !bulkSellLoading &&
                setBulkSellConfirm(
                  false
                )
              }
            >
              ×
            </button>

            <div className="eyebrow">
              SELL INVENTORY
            </div>

            <div className="bulk-sell-icon">
              ↻
            </div>

            <h2>
              Sell{" "}
              {selectedInventoryItems.length ===
              inventory.length
                ? "your entire inventory"
                : "selected items"}
            </h2>

            <div className="bulk-sell-summary">
              <strong>
                {
                  selectedInventoryItems.length
                }
              </strong>

              <span>
                items
              </span>

              <b>
                $
                {(
                  selectedInventoryValue /
                  100
                ).toFixed(2)}
              </b>

              <small>
                Total sale value
              </small>
            </div>

            <p>
              These items will be permanently
              removed from your inventory and
              the sale value will be credited
              to your server-controlled wallet.
            </p>

            <div className="sell-confirm-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setBulkSellConfirm(
                    false
                  )
                }
                disabled={
                  bulkSellLoading
                }
              >
                Cancel
              </button>

              <button
                className="primary"
                onClick={
                  sellSelectedInventory
                }
                disabled={
                  bulkSellLoading ||
                  !selectedInventoryItems.length
                }
              >
                {bulkSellLoading
                  ? "Selling..."
                  : `Sell for $${(
                      selectedInventoryValue /
                      100
                    ).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {withdrawConfirmItem && (
        <div
          className="sell-confirm-backdrop"
          onClick={() =>
            !withdrawLoadingId &&
            setWithdrawConfirmItem(null)
          }
        >
          <div
            className={`sell-confirm-modal ${rarityClass(
              withdrawConfirmItem.rarity
            )}`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close"
              onClick={() =>
                !withdrawLoadingId &&
                setWithdrawConfirmItem(null)
              }
              disabled={!!withdrawLoadingId}
            >
              ×
            </button>

            <div className="eyebrow">
              WITHDRAW ITEM
            </div>

            <div className="sell-confirm-art">
              <ItemArt
                rarity={
                  withdrawConfirmItem.rarity
                }
                imageUrl={
                  withdrawConfirmItem.image_url ||
                  withdrawConfirmItem.imageUrl
                }
                large
              />
            </div>

            <h2>
              {withdrawConfirmItem.name}
            </h2>

            <span className="sell-confirm-rarity">
              {withdrawConfirmItem.rarity}
            </span>

            <div className="sell-confirm-value">
              $
              {(
                Number(
                  withdrawConfirmItem.value_cents ||
                    0
                ) / 100
              ).toFixed(2)}
            </div>

            <p>
            <p>
  Withdraw this item for manual
  in-game delivery? Your item will
  be locked while the withdrawal is
  pending. After confirming, open a
  Discord ticket and provide your
  withdrawal code.
</p>
            </p>

            <div className="sell-confirm-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setWithdrawConfirmItem(null)
                }
                disabled={!!withdrawLoadingId}
              >
                Cancel
              </button>

              <button
                className="primary"
                onClick={() =>
                  withdrawItem(
                    withdrawConfirmItem
                  )
                }
                disabled={!!withdrawLoadingId}
              >
                {withdrawLoadingId
                  ? "Creating..."
                  : "Confirm withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {withdrawResult && (
        <div
          className="sell-confirm-backdrop"
          onClick={() =>
            setWithdrawResult(null)
          }
        >
          <div
            className="sell-confirm-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close"
              onClick={() =>
                setWithdrawResult(null)
              }
            >
              ×
            </button>

            <div className="eyebrow">
              WITHDRAWAL CREATED
            </div>

            <h2>
              Withdrawal request created
            </h2>

            <div
              style={{
                margin: "14px 0",
                padding: "14px 16px",
                borderRadius: "12px",
                border:
                  "1px solid rgba(176,132,255,.35)",
                background:
                  "rgba(176,132,255,.08)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  opacity: 0.65,
                  marginBottom: "6px",
                }}
              >
                Withdrawal Code
              </div>

              <strong
                style={{
                  fontSize: "28px",
                  letterSpacing: ".04em",
                }}
              >
              {withdrawResult.reference}
              </strong>
            </div>

            <p>
              Open a ticket in our Discord and
              send this Withdrawal Code so we can
              manually deliver your item in-game.
            </p>

            <div className="sell-confirm-actions">
              <button
                className="secondary-button"
                onClick={async () => {
                const reference =
  withdrawResult.reference;

                  try {
                    await navigator.clipboard.writeText(
                      reference
                    );
                  } catch {
                    alert(
                      `Your Withdrawal Code is ${reference}`
                    );
                  }
                }}
              >
                Copy Code
              </button>

<button
  className="primary"
  onClick={() => {
    window.open(
      "https://discord.gg/6t9bzvnndd",
      "_blank",
      "noopener,noreferrer"
    );
  }}
>
  Open Discord
</button>
            </div>

            <button
              className="secondary-button"
              style={{
                width: "100%",
                marginTop: "10px",
              }}
              onClick={() =>
                setWithdrawResult(null)
              }
            >
              Done
            </button>
          </div>
        </div>
      )}

      {sellConfirmItem && (
        <div
          className="sell-confirm-backdrop"
          onClick={() =>
            !sellLoadingId &&
            setSellConfirmItem(null)
          }
        >
          <div
            className={`sell-confirm-modal ${rarityClass(
              sellConfirmItem.rarity
            )}`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close"
              onClick={() =>
                !sellLoadingId &&
                setSellConfirmItem(null)
              }
            >
              ×
            </button>

            <div className="eyebrow">
              SELL ITEM
            </div>

            <div className="sell-confirm-art">
              <ItemArt
                rarity={
                  sellConfirmItem.rarity
                }
                imageUrl={
                  sellConfirmItem.image_url || sellConfirmItem.imageUrl
                }
                large
              />
            </div>

            <h2>
              {sellConfirmItem.name}
            </h2>

            <span className="sell-confirm-rarity">
              {sellConfirmItem.rarity}
            </span>

            <div className="sell-confirm-value">
              $
              {(
                Number(
                  sellConfirmItem.value_cents ||
                    0
                ) / 100
              ).toFixed(2)}
            </div>

            <p>
              This will permanently remove
              the item from your inventory
              and credit the server-controlled
              wallet.
            </p>

            <div className="sell-confirm-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setSellConfirmItem(
                    null
                  )
                }
                disabled={
                  !!sellLoadingId
                }
              >
                Cancel
              </button>

              <button
                className="primary"
                onClick={() =>
                  sellItem(
                    sellConfirmItem
                  )
                }
                disabled={
                  !!sellLoadingId
                }
              >
                {sellLoadingId
                  ? "Selling..."
                  : `Sell for $${(
                      Number(
                        sellConfirmItem.value_cents ||
                          0
                      ) / 100
                    ).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {walletOpen && (
        <div
          className="wallet-modal-backdrop"
          onClick={() =>
            !walletLoading &&
            setWalletOpen(false)
          }
        >
          <div
            className="wallet-modal wallet-modal-premium"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close"
              onClick={() =>
                !walletLoading &&
                setWalletOpen(false)
              }
              aria-label="Close wallet"
            >
              ×
            </button>

            <div className="wallet-premium-header wallet-premium-header-compact">
              <div>
                <div className="eyebrow">
                  WALLET
                </div>
              </div>

              <div className="wallet-status-pill">
                <span></span>
                Available
              </div>
            </div>

            <div className="wallet-hero-card">
              <div className="wallet-hero-glow"></div>

              <div className="wallet-hero-label">
                AVAILABLE BALANCE
              </div>

              <div className="wallet-modal-balance">
                ${balance.toFixed(2)}
              </div>

              <div className="wallet-hero-meta">
                <span>Ready to use</span>
                <span>
                  {inventory.length} items in inventory
                </span>
              </div>
            </div>


            <div className="wallet-tabs wallet-tabs-premium">
              <button
                className={
                  walletTab === "wallet"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setWalletTab("wallet");
                  setWalletAction("deposit");
                  setCryptoPayment(null);
                  setBrainrotDeposit(null);
                  setWalletAmount("");
                }}
              >
                <span>Deposit</span>
                <small>Add funds</small>
              </button>

              <button
                className={
                  walletTab === "withdraw"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setWalletTab("withdraw");
                  setWalletAction("withdraw");
                }}
              >
                <span>Withdraw</span>
                <small>Cash out</small>
              </button>

              <button
                className={
                  walletTab === "history"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setWalletTab("history")
                }
              >
                <span>History</span>
                <small>
                  {transactions.length} entries
                </small>
              </button>
            </div>

            {brainrotDeposit && (
              <div className="brainrot-deposit-backdrop" onClick={closeBrainrotDeposit}>
                <div className="brainrot-deposit-modal" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="close" onClick={closeBrainrotDeposit} aria-label="Close Brainrot deposit">×</button>
                  <div className="eyebrow">BRAINROT DEPOSIT</div>
                  <h2>Deposit your Brainrots</h2>
                  <p>Create a deposit request, open a ticket in our Discord, and send the Brainrots to us in-game. Staff will verify them and manually credit your CASEX balance.</p>
                  <div className="brainrot-deposit-code"><span>DEPOSIT CODE</span><strong>{brainrotDeposit.deposit_code}</strong></div>
                  <div className="brainrot-deposit-steps"><div><b>1</b><span>Open a ticket in our Discord</span></div><div><b>2</b><span>Send us the Brainrots in-game</span></div><div><b>3</b><span>Send staff your deposit code</span></div></div>
                  <div className="brainrot-deposit-note"><span>!</span><p>Your CASEX balance is only credited after staff confirms what was received.</p></div>
                  <div className="brainrot-deposit-actions">
                    <button type="button" className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(String(brainrotDeposit.deposit_code || "")); } catch {} }}>Copy Code</button>
                    <button type="button" className="primary" onClick={() => window.open(brainrotDeposit.discordUrl || "https://discord.gg/6t9bzvnndd", "_blank", "noopener,noreferrer")}>Open Discord</button>
                  </div>
                  <button type="button" className="secondary-button brainrot-deposit-done" onClick={closeBrainrotDeposit}>Done</button>
                </div>
              </div>
            )}

            {walletTab !== "history" ? (
              <>
                {walletAction === "deposit" && cryptoPayment ? (
                  <div className="casex-clean-crypto-deposit">
                    <div className="casex-clean-crypto-row">
                      <span className="casex-clean-label">Currency</span>
                      <div className="casex-clean-select casex-clean-select-live">
                        <span className="casex-clean-coin">
                          {String(cryptoPayment.payCurrency || "crypto").slice(0, 1).toUpperCase()}
                        </span>
                        <select
                          value={depositCurrency}
                          onChange={(event) => switchDepositCurrency(event.target.value)}
                          disabled={walletLoading}
                          aria-label="Choose deposit cryptocurrency"
                        >
                          {CRYPTO_DEPOSIT_OPTIONS.map((option) => (
                            <option key={option.code} value={option.code}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span className="casex-clean-balance">
                          {cryptoPayment.network || ""}
                        </span>
                      </div>
                    </div>

                    <div className="casex-clean-crypto-row">
                      <span className="casex-clean-label">Deposit address</span>
                      <div className="casex-clean-address">
                        <code>{cryptoPayment.payAddress || ""}</code>
                        <button
                          type="button"
                          className="casex-clean-icon-btn"
                          onClick={copyCryptoAddress}
                          aria-label="Copy deposit address"
                          title="Copy address"
                        >
                          ⧉
                        </button>
                      </div>
                    </div>

                    <div className="casex-clean-warning" role="alert">
                      <span>!</span>
                      <strong>
                        Send {String(cryptoPayment.payCurrency || "crypto").toUpperCase()} on {cryptoPayment.network || "the selected network"} only.
                      </strong>
                    </div>

                    <div className="casex-clean-qr">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(cryptoPayment.payAddress || "")}`}
                        alt="Crypto deposit QR code"
                        width="220"
                        height="220"
                      />
                    </div>

                    <div className="casex-clean-deposit-meta">
                      <div>
                        <span>Minimum deposit</span>
                        <strong>${Number(cryptoPayment.minimumUsd || 0).toFixed(2)}</strong>
                      </div>

                      <div className={
                        cryptoPayment.status === "completed"
                          ? "casex-clean-status success"
                          : cryptoPayment.status === "failed" || cryptoPayment.status === "expired"
                            ? "casex-clean-status error"
                            : "casex-clean-status"
                      }>
                        <span className="casex-clean-status-dot"></span>
                        <strong>
                          {cryptoPayment.status === "completed"
                            ? "Payment confirmed"
                            : cryptoPayment.status === "failed"
                              ? "Payment failed"
                              : cryptoPayment.status === "expired"
                                ? "Payment expired"
                                : "Waiting for payment"}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="casex-clean-history-link"
                      onClick={() => setWalletTab("history")}
                    >
                      Deposit history →
                    </button>
                  </div>
                ) : (
                  <>
                    {walletAction === "deposit" && (
                      <label className="wallet-input-wrap wallet-input-premium" style={{ marginBottom: 12 }}>
                        <span>Crypto network</span>
                        <div>
                          <select className="casex-wallet-native-hidden-arrow" value={depositCurrency} onChange={(event) => setDepositCurrency(event.target.value)} disabled={walletLoading} style={{ width: "100%", background: "transparent", border: 0, outline: 0, color: "inherit", font: "inherit", cursor: walletLoading ? "not-allowed" : "pointer" }}>
                            {CRYPTO_DEPOSIT_OPTIONS.map((option) => (
                              <option key={option.code} value={option.code}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </label>
                    )}

                    <div className="wallet-action-heading">
                      <div>
                        <strong>{walletTab === "withdraw" ? "Withdraw funds" : "Add money to your wallet"}</strong>
                        <span>{walletTab === "withdraw" ? "Choose a crypto network, wallet address and amount to withdraw." : "Choose a crypto network to get your reusable deposit address."}</span>
                      </div>
                      {walletTab === "withdraw" && (
                        <b className="wallet-withdraw-available">Available: ${balance.toFixed(2)}</b>
                      )}
                    </div>

                    {walletTab === "withdraw" && (
                      <>
                        <label className="wallet-input-wrap wallet-input-premium" style={{ marginBottom: 12 }}>
                          <span>Crypto network</span>
                          <div>
                            <select
                              value={withdrawCurrency}
                              onChange={(event) => setWithdrawCurrency(event.target.value)}
                              disabled={walletLoading}
                              style={{ width: "100%", background: "transparent", border: 0, outline: 0, color: "inherit", font: "inherit", cursor: walletLoading ? "not-allowed" : "pointer" }}
                            >
                              {CRYPTO_DEPOSIT_OPTIONS.map((option) => (
                                <option key={option.code} value={option.code}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </label>

<label className="wallet-input-wrap wallet-input-premium wallet-address-field" style={{ marginBottom: 12 }}>
                          <span>Withdrawal wallet address</span>
                          <div>
                            <input
                              type="text"
                              value={withdrawAddress}
                              onChange={(event) => setWithdrawAddress(event.target.value)}
                              placeholder="Enter your receiving wallet address"
                              disabled={walletLoading}
                              autoComplete="off"
                              spellCheck="false"
                            />
                          </div>
                        </label>

                        {/* Withdrawal network safety warning: remains inside the withdrawal-only block. */}
                        <div className="wallet-withdraw-network-warning">
                          <span className="wallet-withdraw-warning-icon">!</span>

                          <div>
                          <strong>
  Send{" "}
  {CRYPTO_DEPOSIT_OPTIONS.find(
    (option) => option.code === withdrawCurrency
  )?.label?.split(" · ")[0] ||
    String(withdrawCurrency || "crypto").toUpperCase()}{" "}
  only
</strong>

<p>
  Only send{" "}
  {CRYPTO_DEPOSIT_OPTIONS.find(
    (option) => option.code === withdrawCurrency
  )?.label?.split(" · ")[0] ||
    String(withdrawCurrency || "crypto").toUpperCase()}{" "}
  on the{" "}
  {CRYPTO_DEPOSIT_OPTIONS.find(
    (option) => option.code === withdrawCurrency
  )?.label?.split(" · ")[1] || "matching network"}{" "}
  network to this address. Using the wrong network or asset may result in permanent loss.
</p>
                          </div>
                        </div>
                      </>
                    )}

{walletTab === "withdraw" && (
  <div className="wallet-quick-amounts">
    {walletQuickAmounts.map((amount) => {
      const exceedsBalance =
        walletTab === "withdraw" && amount > balance;

      return (
        <button
          key={amount}
          type="button"
          className={Number(walletAmount) === amount ? "active" : ""}
          onClick={() => setWalletAmount(String(amount))}
          disabled={walletLoading || exceedsBalance}
        >
          ${amount}
        </button>
      );
    })}

    <button
      type="button"
      className="wallet-max-button"
      onClick={() => setWalletAmount(balance.toFixed(2))}
      disabled={walletLoading || balance <= 0}
    >
      Max ${balance.toFixed(2)}
    </button>
  </div>
)}

{walletTab === "withdraw" && (
<label className="wallet-input-wrap wallet-input-premium wallet-amount-field">
  <span>Amount</span>
    <div>
      <span>$</span>
      <input
        type="number"
        min="1"
        step="0.01"
        value={walletAmount}
        onChange={(event) => setWalletAmount(event.target.value)}
        placeholder="0.00"
        disabled={walletLoading}
      />
    </div>
  </label>
)}

                    {walletAction === "deposit" && (
                      <div
                        className="wallet-action-note"
                        style={{ marginTop: 10 }}
                      >
                        <span className="wallet-note-icon">
                          i
                        </span>

                        <p>
                          {depositMinimumLoading
                            ? "Checking minimum deposit..."
                            : Number.isFinite(
                                Number(
                                  depositMinimums[
                                    depositCurrency
                                  ]
                                )
                              )
                            ? `Minimum deposit for ${
                                CRYPTO_DEPOSIT_OPTIONS.find(
                                  (option) =>
                                    option.code ===
                                    depositCurrency
                                )?.label ||
                                depositCurrency
                              }: $${Number(
                                depositMinimums[
                                  depositCurrency
                                ]
                              ).toFixed(2)}`
                            : "Minimum deposit is determined by the payment provider."}
                        </p>
                      </div>
                    )}

                    {walletTab === "withdraw" && Number(walletAmount || 0) > balance && (
                      <div className="wallet-inline-warning">The amount is greater than your available balance.</div>
                    )}

<button
  className="primary wide wallet-primary-action"
  onClick={handleWalletAction}
  disabled={
    walletLoading ||
    (walletTab === "withdraw" &&
      (
        !Number.isFinite(Number(walletAmount)) ||
        Number(walletAmount) <= 0 ||
        Number(walletAmount) > balance ||
        !String(withdrawAddress || "").trim()
      ))
  }
>
  {walletLoading
    ? "Processing..."
    : walletTab === "withdraw"
      ? `Withdraw${Number(walletAmount) > 0 ? ` $${Number(walletAmount).toFixed(2)}` : ""}`
      : "Create crypto deposit"}
  <span>→</span>
</button>

                  </>
                )}

                {/* Keep the Brainrot deposit option available on both the
                    normal deposit screen and the generated crypto-address
                    screen. Creating a crypto address must not hide it. */}
                {walletTab === "wallet" && (
                  <div className="brainrot-deposit-card">
                    <div className="brainrot-deposit-card-icon">◇</div>
                    <div className="brainrot-deposit-card-copy">
                      <strong>Deposit Brainrots</strong>
                      <span>Send your Brainrots through Discord and receive CASEX balance after manual verification.</span>
                    </div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={createBrainrotDeposit}
                      disabled={brainrotDepositLoading}
                    >
                      {brainrotDepositLoading ? "Creating..." : "Deposit Brainrots"}
                    </button>
                  </div>
                )}
              </>
) : (
              <div className="wallet-history wallet-history-full wallet-history-premium">
                {(() => {
                  const walletHistory = transactions.filter(
                    (tx) =>
                      tx.type === "deposit" ||
                      tx.type === "withdrawal" ||
                      tx.type === "withdrawal_pending" ||
                      tx.type === "withdrawal_rejected" ||
                      tx.type === "brainrot_deposit"
                  );

                  return (
                    <>
                      <div className="wallet-history-header">
                        <div>
                          <div className="eyebrow">
                            ACTIVITY
                          </div>

                          <h3>Deposit &amp; Withdrawal History</h3>
                        </div>

                        <span>
                          {walletHistory.length}{" "}
                          {walletHistory.length === 1
                            ? "entry"
                            : "entries"}
                        </span>
                      </div>

                      {walletHistory.length === 0 ? (
                        <div className="wallet-history-empty wallet-history-empty-premium">
                          <div>◌</div>
                          <strong>No deposit or withdrawal history</strong>
                          <span>
                            Your wallet deposits and withdrawals will appear here.
                          </span>
                        </div>
                      ) : (
                        <div className="wallet-history-list">
                          {walletHistory.map((tx) => {
                            const amount = Number(
                              tx.amount_cents || 0
                            );

                            const positive =
                              tx.type === "deposit" ||
                              tx.type === "brainrot_deposit";

                            const pending =
                              tx.type === "withdrawal_pending";

                            const rejected =
                              tx.type === "withdrawal_rejected";

                            const label = tx.type === "brainrot_deposit"
                              ? "Brainrot deposit"
                              : positive
                              ? "Deposit"
                              : pending
                              ? "Withdrawal pending"
                              : rejected
                              ? "Withdrawal rejected"
                              : "Withdrawal";

                            const icon = positive
                              ? "↑"
                              : "↓";

                            const txDate = tx.created_at
                              ? new Date(tx.created_at)
                              : null;

                            const formattedDate =
                              txDate &&
                              !Number.isNaN(
                                txDate.getTime()
                              )
                                ? txDate.toLocaleDateString(
                                    undefined,
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "";

                            const formattedTime =
                              txDate &&
                              !Number.isNaN(
                                txDate.getTime()
                              )
                                ? txDate.toLocaleTimeString(
                                    undefined,
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    }
                                  )
                                : "";

                            return (
                              <div
                                className="wallet-history-row wallet-history-row-premium"
                                key={tx.id}
                              >
                                <div
                                  className={`wallet-history-icon ${
                                    positive
                                      ? "positive"
                                      : "negative"
                                  }`}
                                >
                                  {icon}
                                </div>

 <div className="wallet-history-info">
  <div className="wallet-history-title-row">
    <strong>{label}</strong>

    <span
      className={`wallet-history-status ${
        positive
          ? "completed"
          : pending
          ? "pending"
          : rejected
          ? "rejected"
          : "completed"
      }`}
    >
      {positive
        ? "Completed"
        : pending
        ? "Pending"
        : rejected
        ? "Rejected"
        : "Completed"}
    </span>
  </div>

  <small>
    {formattedDate || "Date unavailable"}
    {formattedTime ? ` · ${formattedTime}` : ""}
  </small>
</div>

                                <div
                                  className={`wallet-history-amount ${
                                    positive
                                      ? "positive"
                                      : "negative"
                                  }`}
                                >
                                  {positive || rejected ? "+" : "-"}$
                                  {(
                                    Math.abs(amount) / 100
                                  ).toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {caseRestorePending && !selected && (
        <div className="casex-case-restore-screen">
          <div className="casex-case-restore-card">
            <div className="casex-case-restore-spinner"></div>
            <span>Loading case...</span>
          </div>
        </div>
      )}

      {selected && (
        <div
          className={`case-page ${
            opening
              ? "case-page-opening"
              : ""
          } ${selected?.game_theme === "blue" ? "game-blue" : ""}`}
        >
          {!opening &&
            !result && (
              <div className="case-page-topbar">
                <button
                  className="back-button"
                  onClick={
                    closeCasePage
                  }
                >
                  ← Back to cases
                </button>

                <div className="case-page-balance">
                  💰 $
                  {balance.toFixed(
                    2
                  )}
                </div>
              </div>
            )}

          {opening ? (
            <div className="fullscreen-opening">
              <div className="fullscreen-opening-inner">
                <div className="opening-topline">
                  <div className="eyebrow">
                    OPENING CASE
                  </div>

                  <div className="opening-topline-actions">
                    <span className="opening-live">
                      <i></i> LIVE
                    </span>

                    <button
                      type="button"
                      className={`opening-sound-toggle ${
                        soundEnabled ? "active" : ""
                      }`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        if (!soundEnabled) return;
                        primeAudio();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSoundEnabled((current) => !current);
                      }}
                      aria-label={
                        soundEnabled
                          ? "Mute opening sounds"
                          : "Enable opening sounds"
                      }
                    >
                      {soundEnabled ? "🔊" : "🔇"}
                      <span>Sound</span>
                    </button>
                  </div>
                </div>

                <div className="opening-ambient" aria-hidden="true">
                  <span className="opening-ambient-ring ring-a"></span>
                  <span className="opening-ambient-ring ring-b"></span>
                  <span className="opening-ambient-orb orb-a"></span>
                  <span className="opening-ambient-orb orb-b"></span>
                </div>

                <div className="opening-case-art">
                  <div className="opening-case-art-glow"></div>

                  {selected.image_url ? (
                    <img
                      className="opening-case-custom-image"
                      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                      src={selected.image_url}
                      alt={`${selected.name} case artwork`}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <CaseArt
                      caseId={selected.id}
                      accent={selected.accent || "violet"}
                    />
                  )}
                </div>

                <h1>
                  {selected.name}
                </h1>

                <p className="opening-status">
                  Opening your case
                  <span className="opening-dots"></span>
                </p>

                <div className="opening-progress">
                  <span></span>
                </div>

                <div className="opening-stage-row" aria-hidden="true">
                  <span className="active">ROLLING</span>
                  <i></i>
                  <span>LOCKING IN</span>
                  <i></i>
                  <span>REVEAL</span>
                </div>

                <div
                  className="reel-window fullscreen-reel"
                  ref={
                    reelWindowRef
                  }
                >
                  <div className="reel-pointer"></div>

                  <div
                    className={`reel-track ${
                      reelAnimating
                        ? "reel-animating"
                        : ""
                    }`}
                    ref={
                      reelTrackRef
                    }
                    style={
                      reelTarget
                        ? {
                            "--reel-target":
                              reelTarget,
                          }
                        : undefined
                    }
                  >
                    {reelItems.map(
                      (
                        item,
                        index
                      ) => {
                        const displayItem =
                          item.winning &&
                          reelWinningReward
                            ? {
                                ...item,
                                id: Number(
                                  reelWinningReward.id
                                ),
                                name:
                                  reelWinningReward.name,
                                rarity:
                                  reelWinningReward.rarity,
                                valueCents: Number(
                                  reelWinningReward.valueCents ||
                                    0
                                ),
                                imageUrl:
                                  reelWinningReward.image_url ||
                                  reelWinningReward.imageUrl ||
                                  item.imageUrl ||
                                  item.image_url ||
                                  "",
                                image_url:
                                  reelWinningReward.image_url ||
                                  reelWinningReward.imageUrl ||
                                  item.imageUrl ||
                                  item.image_url ||
                                  "",
                                cls: rarityClass(
                                  reelWinningReward.rarity
                                ),
                              }
                            : item;

                        return (
                          <div
                            className={`reel-item ${displayItem.cls}`}
                            data-winning={
                              displayItem.winning
                                ? "true"
                                : "false"
                            }
                            key={`${displayItem.key}-${index}`}
                          >
                            <span className="reel-gem">
                              <ItemArt
                                rarity={
                                  displayItem.rarity
                                }
                                imageUrl={
                                  displayItem.imageUrl ||
                                  displayItem.image_url
                                }
                                compact
                              />
                            </span>

                            <strong>
                              {displayItem.name}
                            </strong>

                            <small>
                              $
                              {(
                                Number(
                                  displayItem.valueCents ||
                                    0
                                ) / 100
                              ).toFixed(2)}
                            </small>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : result ? (
            <div
              className={`fullscreen-result rarity-${rarityClass(
                result.rarity
              )}${
                [
                  "Legendary",
                  "Secret",
                ].includes(
                  result.rarity
                )
                  ? " rare-event"
                  : ""
              }`}
            >
              <div className="result-atmosphere"></div>

              <div
                className="rarity-particles"
                aria-hidden="true"
              >
                {Array.from(
                  {
                    length: 18,
                  },
                  (_, index) => (
                    <span
                      key={index}
                      style={{
                        "--particle-index":
                          index,
                      }}
                    ></span>
                  )
                )}
              </div>

              <div className="result-eyebrow">
                <span className="result-check">
                  ✓
                </span>

                REWARD UNLOCKED
              </div>

              <div className="result-art-stage">
                <div className="result-art-ring"></div>

                <div className="result-art-ring ring-two"></div>

                <ItemArt
                  rarity={
                    result.rarity
                  }
                  imageUrl={
                    result.image_url || result.imageUrl
                  }
                  large
                />
              </div>

              <div className="result-copy">
                <div
                  className={`result-rarity-pill ${rarityClass(
                    result.rarity
                  )}`}
                >
                  {result.rarity}
                </div>

                <h1>
                  {result.name}
                </h1>

                <div className="result-value">
                  $
                  {(
                    Number(
                      result.valueCents ||
                        0
                    ) / 100
                  ).toFixed(2)}
                </div>

                <p className="result-added">
                  <span>
                    ✓
                  </span>{" "}
                  Added to your
                  inventory
                </p>
              </div>

              <div className="result-actions result-actions-two-row">
                <button
                  className="primary result-open-again"
                  onPointerDown={primeAudio}
                  onClick={() => {
                    setResult(null);
                    setReelItems(
                      []
                    );
                    setReelTarget(
                      null
                    );
                    setWonInventoryId(
                      null
                    );

                    setTimeout(
                      () =>
                        openCase(
                          selected
                        ),
                      50
                    );
                  }}
                  disabled={
                    balance <
                    selected.price
                  }
                >
                  <svg
                    className="result-button-icon result-refresh-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20 11a8 8 0 0 0-14.8-4L3 9" />
                    <path d="M3 4v5h5" />
                    <path d="M4 13a8 8 0 0 0 14.8 4L21 15" />
                    <path d="M21 20v-5h-5" />
                  </svg>

                  <span>
                    {balance <
                    selected.price
                      ? "Insufficient balance"
                      : `Open Again · $${selected.price.toFixed(
                          2
                        )}`}
                  </span>
                </button>

                <div className="result-secondary-row">
                  <button
                    className="secondary-button result-action result-action-sell"
                    onClick={() =>
setSellConfirmItem({
  id: wonInventoryId,
  name: result.name,
  rarity: result.rarity,
  value_cents: Number(
    result.valueCents || 0
  ),
  image_url:
    result.image_url ||
    result.imageUrl ||
    "",
  imageUrl:
    result.image_url ||
    result.imageUrl ||
    "",
})
                    }
                    disabled={
                      !wonInventoryId
                    }
                  >
                    <svg
                      className="result-button-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M20.6 13.2 13.2 20.6a2 2 0 0 1-2.8 0L3.4 13.6a2 2 0 0 1 0-2.8L10.8 3.4a2 2 0 0 1 2.8 0l7 7a2 2 0 0 1 0 2.8Z" />
                      <circle
                        cx="9"
                        cy="9"
                        r="1.7"
                      />
                    </svg>

                    <span>
                      Sell Item · $
                      {(
                        Number(
                          result.valueCents ||
                            0
                        ) / 100
                      ).toFixed(2)}
                    </span>
                  </button>

                  <button
                    className="result-back-button"
                    onClick={
                      closeCasePage
                    }
                  >
                    <svg
                      className="result-button-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M19 12H5" />
                      <path d="m12 19-7-7 7-7" />
                    </svg>

                    <span>
                      Back to Cases
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="case-detail-page packdraw-inspired-page">
              <button
                type="button"
                onClick={closeCasePage}
                className="packdraw-back-button"
                aria-label="Back to cases"
                style={{
                  position: "relative",
                  zIndex: 5,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "18px",
                  padding: "10px 14px",
                  border: "1px solid rgba(123, 88, 185, 0.55)",
                  borderRadius: "11px",
                  background: "rgba(15, 14, 24, 0.88)",
                  color: "#f3efff",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 10px 30px rgba(0,0,0,.22)",
                }}
              >
                <span aria-hidden="true">←</span>
                <span>Back to Cases</span>
              </button>

              <div className="packdraw-case-shell">
                <section className="packdraw-hero">
                  <div className="packdraw-art-panel">
                    <div className="packdraw-art-grid"></div>

                    <div className="packdraw-art-glow"></div>

                    <div className="packdraw-art-label">
                      CASE
                    </div>

                   {selected.image_url ? (
  <img
    src={selected.image_url}
    alt={`${selected.name} case artwork`}
    draggable="false"
    style={{
      display: "block",
      width: "auto",
      height: "auto",
      maxWidth: "72%",
      maxHeight: "72%",
      objectFit: "contain",
      objectPosition: "center",
      margin: "0 auto",
      position: "relative",
      zIndex: 2,
    }}
    onError={(event) => {
      event.currentTarget.style.display = "none";
    }}
  />
) : (
  <CaseArt
    caseId={selected.id}
    accent={selected.accent || "violet"}
  />
)}
                  </div>

                  <div className="packdraw-info">
                    <div className="eyebrow">
                      CASE PREVIEW
                    </div>

                    <h1>
                      {selected.name}
                    </h1>

                    <p className="packdraw-description">
                      {selected.description ||
                        "Open the case and discover your reward."}
                    </p>

                    <div className="packdraw-price-row">
                      <div>
                        <small>
                          OPENING PRICE
                        </small>

                        <strong>
                          $
                          {selected.price.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div className="packdraw-live">
                        <span></span>{" "}
                        LIVE
                      </div>
                    </div>

                    <div className="packdraw-stats">
                      <span>
                        <b>
                          {
                            activeItems.length
                          }
                        </b>{" "}
                        rewards
                      </span>

                      <span>
                        <b>
                          5
                        </b>{" "}
                        rarity tiers
                      </span>
                    </div>

                    <button
                      className="primary packdraw-open-button"
                      onPointerDown={primeAudio}
                      onClick={() =>
                        openCase(
                          selected
                        )
                      }
                      disabled={
                        balance <
                        selected.price
                      }
                    >
                      {balance <
                      selected.price
                        ? "Insufficient balance"
                        : `Open Case · $${selected.price.toFixed(
                            2
                          )}`}
                    </button>

                    <div className="packdraw-balance">
                      Balance{" "}
                      <b>
                        $
                        {balance.toFixed(
                          2
                        )}
                      </b>
                    </div>
                  </div>
                </section>

                <section className="packdraw-rewards">
                  <div className="packdraw-rewards-header">
                    <div>
                      <div className="eyebrow">
                        WHAT'S INSIDE
                      </div>

                      <h2>
                        Possible rewards
                      </h2>
                    </div>

                    <span>
                      {
                        activeItems.length
                      }{" "}
                      items · Actual odds
                    </span>
                  </div>

                  <div className="packdraw-reward-grid">
                    {activeItems.map(
                      (item) => (
                        <div
                          className={`packdraw-reward-card ${rarityClass(
                            item.rarity
                          )}`}
                          key={`${item.id}-${item.name}`}
                        >
                          <div className="packdraw-reward-rarity">
                            <span className="packdraw-rarity-dot"></span>

                            {item.rarity}
                          </div>

                          <div className="packdraw-reward-art">
                            <ItemArt
                              rarity={
                                item.rarity
                              }
                              imageUrl={
                                item.image_url || item.imageUrl
                              }
                              compact
                            />
                          </div>

                          <div className="packdraw-reward-name">
                            <strong>
                              {item.name}
                            </strong>

                            <small>
                              $
                              {(
                                Number(
                                  item.value_cents ||
                                    0
                                ) / 100
                              ).toFixed(2)}
                            </small>
                          </div>

                          <div className="packdraw-reward-odds">
                            <span>
                              ODDS
                            </span>

                            <b>
                              {Number(
                                item.probability ||
                                  0
                              ).toFixed(2)}
                              %
                            </b>
                          </div>

                          <div className="packdraw-odds-track">
                            <span
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Number(
                                      item.probability ||
                                        0
                                    )
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      )}

      {accountStatsOpen && authUser && (
        <div
          className="account-stats-backdrop"
          onClick={() => setAccountStatsOpen(false)}
        >
          <div
            className="account-stats-modal account-profile-page account-profile-split"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="account-stats-close"
              onClick={() => setAccountStatsOpen(false)}
              aria-label="Close profile statistics"
            >
              ×
            </button>

            <aside className="account-profile-sidebar">
              <div className="account-profile-sidebar-eyebrow">
                YOUR ACCOUNT
              </div>

              <div className="account-profile-sidebar-user">
                <div className="account-profile-sidebar-avatar">
                  👤
                </div>

                <div className="account-profile-sidebar-user-copy">
                  <h2>{authUser.username}</h2>
                  <p>{authUser.email}</p>
                  <span>
                    Member since{" "}
                    {authUser.created_at
                      ? new Date(authUser.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="account-profile-sidebar-balance">
                <span>AVAILABLE BALANCE</span>
                <strong>${balance.toFixed(2)}</strong>
              </div>

              <button
                type="button"
                className="account-profile-add-funds"
                onClick={() => {
                  setAccountStatsOpen(false);
                  setWalletOpen(true);
                  setWalletTab("wallet");
                  setWalletAction("deposit");
                }}
              >
                <span>＋</span>
                Add Funds
              </button>

              <div className="account-profile-sidebar-divider"></div>

              <nav className="account-profile-sidebar-nav">
                <button
                  type="button"
                  className="active"
                  onClick={() => setAccountStatsOpen(false)}
                >
                  <span>⌂</span>
                  <strong>Overview</strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountStatsOpen(false);
                    setWalletOpen(true);
                    setWalletTab("wallet");
                    setWalletAction("deposit");
                  }}
                >
                  <span>▣</span>
                  <strong>Wallet</strong>
                  <b>›</b>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountStatsOpen(false);
                    document
                      .getElementById("inventory")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span>▢</span>
                  <strong>Inventory</strong>
                  <b>›</b>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountStatsOpen(false);
                    setWithdrawalHistoryOpen(true);
                    document
                      .getElementById("inventory")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span>◇</span>
                  <strong>Item Withdrawals</strong>
                  <b>›</b>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountStatsOpen(false);
                    setWalletOpen(true);
                    setWalletTab("history");
                  }}
                >
                  <span>⇄</span>
                  <strong>Transactions</strong>
                  <b>›</b>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountStatsOpen(false);
                    openSettings("profile");
                  }}
                >
                  <span>⚙</span>
                  <strong>Settings</strong>
                  <b>›</b>
                </button>
              </nav>

              <button
                type="button"
                className="account-profile-logout"
                onClick={handleLogout}
              >
                <span>↪</span>
                Log out
              </button>
            </aside>

            <div className="account-profile-main">
              <section className="account-profile-overview-panel">
                <div className="account-profile-overview-head">
                  <div>
                    <span className="eyebrow">ACCOUNT OVERVIEW</span>
                    <h3>Your stats</h3>
                  </div>

                  <span className="account-profile-status">
                    ACTIVE ACCOUNT
                  </span>
                </div>

                <div className="account-profile-overview-grid">
                  <div className="account-profile-overview-stat highlight">
                    <span>Biggest Win</span>
                    <strong>
                      ${(accountStats.biggestWinCents / 100).toFixed(2)}
                    </strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Cases Opened</span>
                    <strong>{accountStats.casesOpened}</strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Total Spent</span>
                    <strong>
                      ${(accountStats.totalSpentCents / 100).toFixed(2)}
                    </strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Rewards Value</span>
                    <strong>
                      ${(accountStats.totalRewardsValueCents / 100).toFixed(2)}
                    </strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Inventory Value</span>
                    <strong>
                      ${(accountStats.currentInventoryValueCents / 100).toFixed(2)}
                    </strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Items Owned</span>
                    <strong>{accountStats.itemsOwned}</strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Total Transactions</span>
                    <strong>{transactions.length}</strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Account Status</span>
                    <strong className="account-profile-active-value">
                      ● Active
                    </strong>
                  </div>
                </div>
              </section>

              <div className="account-profile-split-panels account-profile-single-panel">
              <section className="account-profile-recent account-profile-recent-full">
                  <div className="account-profile-section-title compact">
                    <div>
                      <span className="eyebrow">ACTIVITY</span>
                      <h3>Recent withdrawals</h3>
                    </div>

                    <button
                      type="button"
                      className="account-profile-view-button"
                      onClick={() => {
                        setAccountStatsOpen(false);
                        setWithdrawalHistoryOpen(true);
                        document
                          .getElementById("inventory")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      View all →
                    </button>
                  </div>

                  <div className="account-profile-recent-list">
                    {itemWithdrawalHistory.length > 0 ? (
                      itemWithdrawalHistory.slice(0, 5).map((withdrawal) => {
                        const status = String(
                          withdrawal.status || "pending"
                        ).toLowerCase();

                        const statusClass =
                          status === "completed"
                            ? "delivered"
                            : status === "cancelled"
                              ? "cancelled"
                              : "pending";

                        const statusLabel =
                          status === "completed"
                            ? "Delivered"
                            : status === "cancelled"
                              ? "Cancelled"
                              : "Pending";

                        const createdLabel = withdrawal.created_at
                          ? new Date(
                              withdrawal.created_at
                            ).toLocaleString(undefined, {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—";

                        return (
                          <div
                            className="account-profile-recent-row"
                            key={withdrawal.id}
                          >
                            <ItemArt
                              rarity={withdrawal.rarity}
                              imageUrl={withdrawal.image_url}
                              compact
                            />

                            <div>
                              <strong>
                                {withdrawal.item_name}
                              </strong>
                              <span>
                                WD-{withdrawal.id} ·{" "}
                                {withdrawal.rarity}
                              </span>
                            </div>

                            <span
                              className={`account-profile-recent-status ${statusClass}`}
                            >
                              {statusLabel}
                            </span>

                            <b>
                              $
                              {(
                                Number(withdrawal.value_cents || 0) /
                                100
                              ).toFixed(2)}
                            </b>

                            <time>{createdLabel}</time>
                          </div>
                        );
                      })
                    ) : (
                      <div className="account-profile-recent-empty">
                        No item withdrawals yet.
                      </div>
                    )}
                  </div>

                  {itemWithdrawalHistory.length > 0 && (
                    <button
                      type="button"
                      className="account-profile-all-withdrawals"
                      onClick={() => {
                        setAccountStatsOpen(false);
                        setWithdrawalHistoryOpen(true);
                        document
                          .getElementById("inventory")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      View all withdrawals
                    </button>
                  )}
                </section>
              </div>

              <section className="account-profile-bottom-summary">
                <div>
                  <span>Member Since</span>
                  <strong>
                    {authUser.created_at
                      ? new Date(authUser.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Total Deposited</span>
                  <strong>
                    ${(totalDepositedCents / 100).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Total Withdrawn</span>
                  <strong>
                    ${(totalWithdrawnCents / 100).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Net Spent</span>
                  <strong>
                    ${(accountStats.totalSpentCents / 100).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>Last Active</span>
                  <strong>Just now</strong>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      {creatorDashboardOpen && authUser && creatorDashboard && (
        <div
          className="account-stats-backdrop"
          onClick={() => !creatorDashboardLoading && setCreatorDashboardOpen(false)}
        >
          <div
            className="account-stats-modal account-profile-page"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="account-stats-close"
              type="button"
              onClick={() =>
                !creatorDashboardLoading &&
                setCreatorDashboardOpen(false)
              }
              aria-label="Close creator dashboard"
            >
              ×
            </button>

            <div className="account-profile-main">
              <section className="account-profile-overview-panel">
                <div className="account-profile-overview-head">
                  <div>
                    <span className="eyebrow">
                      CREATOR CENTER
                    </span>
                    <h3>Creator Dashboard</h3>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void loadCreatorDashboard()}
                    disabled={creatorDashboardLoading}
                  >
                    {creatorDashboardLoading
                      ? "Refreshing..."
                      : "Refresh"}
                  </button>
                </div>

                {creatorDashboardError && (
                  <div className="settings-message settings-message-error">
                    {creatorDashboardError}
                  </div>
                )}

                <div className="account-profile-overview-grid">
                  <div className="account-profile-overview-stat highlight">
                    <span>Creator Code</span>
                    <strong>
                      {creatorDashboard.creator?.code || "—"}
                    </strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Referred Users</span>
                    <strong>
                      {Number(
                        creatorDashboard.stats?.referredUsers || 0
                      )}
                    </strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Cases Opened</span>
                    <strong>
                      {Number(
                        creatorDashboard.stats?.totalCaseOpens || 0
                      )}
                    </strong>
                  </div>

                  <div className="account-profile-overview-stat">
                    <span>Total Volume</span>
                    <strong>
                      $
                      {Number(
                        creatorDashboard.stats?.volumeUsd || 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="account-profile-recent account-profile-recent-full">
                <div className="account-profile-recent-head">
                  <div>
                    <span className="eyebrow">
                      REFERRAL PERFORMANCE
                    </span>
                    <h3>Your creator traffic</h3>
                  </div>
                </div>

                <div
                  className="account-profile-bottom-summary"
                  style={{
                    marginTop: "18px",
                  }}
                >
                  <div>
                    <span>Volume per referred user</span>
                    <strong>
                      $
                      {Number(
                        creatorDashboard.stats?.referredUsers || 0
                      ) > 0
                        ? (
                            Number(
                              creatorDashboard.stats?.volumeUsd || 0
                            ) /
                            Number(
                              creatorDashboard.stats?.referredUsers || 1
                            )
                          ).toFixed(2)
                        : "0.00"}
                    </strong>
                  </div>

                  <div>
                    <span>Average case value</span>
                    <strong>
                      $
                      {Number(
                        creatorDashboard.stats?.totalCaseOpens || 0
                      ) > 0
                        ? (
                            Number(
                              creatorDashboard.stats?.volumeUsd || 0
                            ) /
                            Number(
                              creatorDashboard.stats?.totalCaseOpens || 1
                            )
                          ).toFixed(2)
                        : "0.00"}
                    </strong>
                  </div>

                  <div>
                    <span>Dashboard status</span>
                    <strong className="account-profile-active-value">
                      ● Live
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    border: "1px solid var(--border, rgba(255,255,255,.08))",
                    borderRadius: "14px",
                    overflow: "visible",
                    position: "relative",
                    zIndex: 20,
                    background: "rgba(255,255,255,.015)",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 18px",
                      borderBottom: "1px solid var(--border, rgba(255,255,255,.08))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span
                        className="eyebrow"
                        style={{ display: "block", marginBottom: "4px" }}
                      >
                        REFERRED USERS
                      </span>
                      <h3 style={{ margin: 0 }}>
                        Your referral activity
                      </h3>
                    </div>

                    <div className="creator-dashboard-sort">
                      <span className="creator-dashboard-sort-label">
                        Sort
                      </span>

                      <div className="creator-dashboard-sort-menu">
                        <button
                          type="button"
                          className={`creator-dashboard-sort-trigger${
                            creatorUserSortOpen ? " is-open" : ""
                          }`}
                          onClick={() =>
                            setCreatorUserSortOpen((current) => !current)
                          }
                          aria-haspopup="listbox"
                          aria-expanded={creatorUserSortOpen}
                        >
                          <span>
                            {{
                              "volume-desc": "Highest volume",
                              "volume-asc": "Lowest volume",
                              "cases-desc": "Most cases",
                              newest: "Newest users",
                            }[creatorUserSort] || "Highest volume"}
                          </span>
                          <span
                            className={`creator-dashboard-sort-chevron${
                              creatorUserSortOpen ? " is-open" : ""
                            }`}
                            aria-hidden="true"
                          >
                            ˅
                          </span>
                        </button>

                        {creatorUserSortOpen && (
                          <div
                            className="creator-dashboard-sort-options"
                            role="listbox"
                            aria-label="Sort referred users"
                          >
                            {[
                              ["volume-desc", "Highest volume"],
                              ["volume-asc", "Lowest volume"],
                              ["cases-desc", "Most cases"],
                              ["newest", "Newest users"],
                            ].map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`creator-dashboard-sort-option${
                                  creatorUserSort === value ? " active" : ""
                                }`}
                                onClick={() => {
                                  setCreatorUserSort(value);
                                  setCreatorUserSortOpen(false);
                                }}
                              >
                                <span>{label}</span>
                                {creatorUserSort === value && (
                                  <span aria-hidden="true">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {Array.isArray(creatorDashboard.referredUsers) &&
                  creatorDashboard.referredUsers.length ? (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          minWidth: "620px",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "13px 18px",
                                color: "var(--muted, #9696a8)",
                                fontSize: "12px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".06em",
                                borderBottom:
                                  "1px solid var(--border, rgba(255,255,255,.08))",
                              }}
                            >
                              Username
                            </th>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "13px 18px",
                                color: "var(--muted, #9696a8)",
                                fontSize: "12px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".06em",
                                borderBottom:
                                  "1px solid var(--border, rgba(255,255,255,.08))",
                              }}
                            >
                              Joined
                            </th>
                            <th
                              style={{
                                textAlign: "right",
                                padding: "13px 18px",
                                color: "var(--muted, #9696a8)",
                                fontSize: "12px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".06em",
                                borderBottom:
                                  "1px solid var(--border, rgba(255,255,255,.08))",
                              }}
                            >
                              Cases Opened
                            </th>
                            <th
                              style={{
                                textAlign: "right",
                                padding: "13px 18px",
                                color: "var(--muted, #9696a8)",
                                fontSize: "12px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".06em",
                                borderBottom:
                                  "1px solid var(--border, rgba(255,255,255,.08))",
                              }}
                            >
                              Volume
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {sortedCreatorUsers.map((user, index) => (
                            <tr key={user.id}>
                              <td
                                style={{
                                  padding: "15px 18px",
                                  borderBottom:
                                    index ===
                                    sortedCreatorUsers.length - 1
                                      ? "none"
                                      : "1px solid var(--border, rgba(255,255,255,.06))",
                                  fontWeight: 700,
                                  color: "var(--text, #f6f7fb)",
                                }}
                              >
                                {user.username || "—"}
                              </td>

                              <td
                                style={{
                                  padding: "15px 18px",
                                  borderBottom:
                                    index ===
                                    sortedCreatorUsers.length - 1
                                      ? "none"
                                      : "1px solid var(--border, rgba(255,255,255,.06))",
                                  color: "var(--muted, #9696a8)",
                                }}
                              >
                                {formatCreatorDate(user.joinedAt)}
                              </td>

                              <td
                                style={{
                                  padding: "15px 18px",
                                  textAlign: "right",
                                  borderBottom:
                                    index ===
                                    sortedCreatorUsers.length - 1
                                      ? "none"
                                      : "1px solid var(--border, rgba(255,255,255,.06))",
                                  color: "var(--text, #f6f7fb)",
                                  fontWeight: 700,
                                }}
                              >
                                {Number(user.caseOpens || 0)}
                              </td>

                              <td
                                style={{
                                  padding: "15px 18px",
                                  textAlign: "right",
                                  borderBottom:
                                    index ===
                                    sortedCreatorUsers.length - 1
                                      ? "none"
                                      : "1px solid var(--border, rgba(255,255,255,.06))",
                                  color: "var(--accent, #b084ff)",
                                  fontWeight: 800,
                                }}
                              >
                                $
                                {Number(
                                  user.volumeUsd ||
                                    Number(user.volumeCents || 0) / 100
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "24px 18px",
                        color: "var(--muted, #9696a8)",
                      }}
                    >
                      No referred users yet.
                    </div>
                  )}
                </div>

                <p
                  style={{
                    marginTop: "18px",
                    color: "var(--muted, #9696a8)",
                    lineHeight: 1.6,
                  }}
                >
                  Volume is calculated from case openings made by users
                  who registered with your creator code.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && authUser && (
        <div
          className="settings-modal-backdrop"
          onClick={() => !settingsLoading && setSettingsOpen(false)}
        >
          <div
            className="settings-modal settings-modal-large"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="settings-close"
              type="button"
              onClick={() => !settingsLoading && setSettingsOpen(false)}
              aria-label="Close settings"
            >
              ×
            </button>

            <div className="eyebrow">ACCOUNT SETTINGS</div>
            <h2>Settings</h2>
            <p className="settings-subtitle">
              Manage your account details, password, sound preference and active sessions.
            </p>

            <div className="settings-tabs">
              <button
                type="button"
                className={settingsTab === "profile" ? "active" : ""}
                onClick={() => {
                  setSettingsTab("profile");
                  setSettingsError("");
                  setSettingsSuccess("");
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className={settingsTab === "security" ? "active" : ""}
                onClick={() => {
                  setSettingsTab("security");
                  setSettingsError("");
                  setSettingsSuccess("");
                }}
              >
                Security
              </button>
              <button
                type="button"
                className={settingsTab === "preferences" ? "active" : ""}
                onClick={() => {
                  setSettingsTab("preferences");
                  setSettingsError("");
                  setSettingsSuccess("");
                }}
              >
                Preferences
              </button>
            </div>

            {settingsError && (
              <div className="settings-message settings-message-error">
                {settingsError}
              </div>
            )}

            {settingsSuccess && (
              <div className="settings-message settings-message-success">
                {settingsSuccess}
              </div>
            )}

            {settingsTab === "profile" && (
              <form onSubmit={handleSettingsProfileSave}>
                <div className="settings-profile-card">
                  <div className="settings-profile-avatar">👤</div>
                  <div>
                    <strong>{authUser.username}</strong>
                    <span>{authUser.email}</span>
                  </div>
                </div>

                <label className="settings-field">
                  <span>Username</span>
                  <input
                    value={settingsProfile.username}
                    onChange={(event) =>
                      setSettingsProfile((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    maxLength={24}
                    autoComplete="username"
                    disabled={settingsLoading}
                  />
                </label>

                <label className="settings-field">
                  <span>Email address</span>
                  <input
                    type="email"
                    value={settingsProfile.email}
                    onChange={(event) =>
                      setSettingsProfile((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    disabled={settingsLoading}
                  />
                </label>

                <label className="settings-field">
                  <span>Current password</span>
                  <input
                    type="password"
                    value={settingsProfile.currentPassword}
                    onChange={(event) =>
                      setSettingsProfile((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    placeholder="Required when changing account details"
                    disabled={settingsLoading}
                  />
                </label>

                <button
                  className="primary settings-save-button"
                  type="submit"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? "Saving..." : "Save profile"}
                </button>
              </form>
            )}

            {settingsTab === "security" && (
              <div>
                <form onSubmit={handleSettingsPasswordSave}>
                  <div className="settings-section-heading">
                    <strong>Change password</strong>
                    <span>Choose a new password for your CaseX account.</span>
                  </div>

                  <label className="settings-field">
                    <span>Current password</span>
                    <input
                      type="password"
                      value={settingsPassword.currentPassword}
                      onChange={(event) =>
                        setSettingsPassword((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      autoComplete="current-password"
                      disabled={settingsLoading}
                    />
                  </label>

                  <label className="settings-field">
                    <span>New password</span>
                    <input
                      type="password"
                      value={settingsPassword.newPassword}
                      onChange={(event) =>
                        setSettingsPassword((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="At least 8 characters"
                      disabled={settingsLoading}
                    />
                  </label>

                  <label className="settings-field">
                    <span>Confirm new password</span>
                    <input
                      type="password"
                      value={settingsPassword.confirmPassword}
                      onChange={(event) =>
                        setSettingsPassword((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      autoComplete="new-password"
                      minLength={8}
                      disabled={settingsLoading}
                    />
                  </label>

                  <button
                    className="primary settings-save-button"
                    type="submit"
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? "Updating..." : "Change password"}
                  </button>
                </form>

                <div className="settings-section settings-section-danger">
                  <div>
                    <strong>Active sessions</strong>
                    <span>
                      Sign out every other browser session while keeping this device signed in.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="secondary-button settings-inline-button"
                    onClick={handleLogoutOtherSessions}
                    disabled={settingsLoading}
                  >
                    {settingsLoading ? "Working..." : "Sign out others"}
                  </button>
                </div>
              </div>
            )}

            {settingsTab === "preferences" && (
              <div>
                <div className="settings-section">
                  <div>
                    <strong>Case opening sound</strong>
                    <span>
                      Play reel ticks and rarity reveal sounds while opening cases.
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${soundEnabled ? "active" : ""}`}
                    onClick={() => setSoundEnabled((current) => !current)}
                    aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
                  >
                    <span></span>
                  </button>
                </div>

                <div className="settings-section settings-info">
                  <div>
                    <strong>Account created</strong>
                    <span>
                      {authUser.created_at
                        ? new Date(authUser.created_at).toLocaleString()
                        : "Unavailable"}
                    </span>
                  </div>
                </div>

                <div className="settings-section settings-info">
                  <div>
                    <strong>Wallet & inventory</strong>
                    <span>
                      These are server-controlled and remain tied to your account session.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="primary settings-done"
                  onClick={() => setSettingsOpen(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {authOpen && (
        <div
          className="auth-modal-backdrop"
          onClick={() =>
            !authLoading &&
            setAuthOpen(false)
          }
        >
          <div
            className="auth-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="auth-close"
              onClick={() =>
                !authLoading &&
                setAuthOpen(false)
              }
              aria-label="Close"
            >
              ×
            </button>

            <div className="eyebrow">
              {authMode === "reset"
                ? "PASSWORD RESET"
                : authMode === "forgot"
                ? "ACCOUNT RECOVERY"
                : authMode === "login"
                ? "WELCOME BACK"
                : "JOIN CaseX"}
            </div>

            <h2>
              {authMode === "reset"
                ? "Choose a new password"
                : authMode === "forgot"
                ? "Forgot your password?"
                : authMode === "login"
                ? "Sign in to your account"
                : "Create your account"}
            </h2>

            <p className="auth-subtitle">
              {authMode === "reset"
                ? "Enter a new password for your account."
                : authMode === "forgot"
                ? "Enter your email and we'll send you a link to reset your password."
                : authMode === "login"
                ? "Your wallet, inventory and history are tied to your account."
                : "Create an account to save your wallet, inventory and case history."}
            </p>

            {authMode === "forgot" ? (
              <form
                onSubmit={handleForgotPassword}
                className="auth-form"
              >
                <label>
                  <span>Email</span>

                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(event) =>
                      setForgotPasswordEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>

                {authError && (
                  <div className="auth-error">
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div className="auth-success">
                    {authSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary auth-submit"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Sending..."
                    : "Send reset link"}
                </button>
              </form>
            ) : authMode === "reset" ? (
              <form
                onSubmit={handleResetPassword}
                className="auth-form"
              >
                <label>
                  <span>New password</span>

                  <input
                    type="password"
                    value={resetPasswordForm.password}
                    onChange={(event) =>
                      setResetPasswordForm(
                        (current) => ({
                          ...current,
                          password:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>

                <label>
                  <span>Confirm new password</span>

                  <input
                    type="password"
                    value={
                      resetPasswordForm.confirmPassword
                    }
                    onChange={(event) =>
                      setResetPasswordForm(
                        (current) => ({
                          ...current,
                          confirmPassword:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>

                {authError && (
                  <div className="auth-error">
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div className="auth-success">
                    {authSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary auth-submit"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Resetting..."
                    : "Reset password"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleAuthSubmit}
                className="auth-form"
              >
                {authMode === "register" ? (
                  <>
                    <label>
                      <span>Username</span>

                      <input
                        type="text"
                        value={authForm.username}
                        onChange={(event) =>
                          setAuthForm(
                            (current) => ({
                              ...current,
                              username:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="e.g. User123"
                        autoComplete="username"
                        required
                      />
                    </label>

                    <label>
                      <span>Email</span>

                      <input
                        type="email"
                        value={authForm.email}
                        onChange={(event) =>
                          setAuthForm(
                            (current) => ({
                              ...current,
                              email:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </label>

                    <label>
                      <span>
                        Creator Code{" "}
                        <small>(optional)</small>
                      </span>

                      <input
                        type="text"
                        value={authForm.creatorCode}
                        onChange={(event) =>
                          setAuthForm(
                            (current) => ({
                              ...current,
                              creatorCode:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="e.g. SIKE"
                        autoComplete="off"
                      />
                    </label>
                  </>
                ) : (
                  <label>
                    <span>Username or email</span>

                    <input
                      type="text"
                      value={authForm.identifier}
                      onChange={(event) =>
                        setAuthForm(
                          (current) => ({
                            ...current,
                            identifier:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Username or email"
                      autoComplete="username"
                      required
                    />
                  </label>
                )}

                <label>
                  <span>Password</span>

                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) =>
                      setAuthForm(
                        (current) => ({
                          ...current,
                          password:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="At least 8 characters"
                    autoComplete={
                      authMode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    minLength={8}
                    required
                  />
                </label>

                {authError && (
                  <div className="auth-error">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary auth-submit"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Please wait..."
                    : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
                </button>

                {authMode === "login" && (
                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={() => {
                      setAuthMode("forgot");
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </form>
            )}

            <div className="auth-switch">
              {authMode === "login" ? (
                <>
                  Don't have an account?

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                  >
                    Create one
                  </button>
                </>
              ) : authMode === "register" ? (
                <>
                  Already have an account?

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                  >
                    ← Back to sign in
                  </button>
                </>
              )}
            </div>

            {authMode !== "reset" && (
              <p className="auth-demo-note">
                Demo environment: new accounts start with a
                $100.00 server-side wallet balance.
              </p>
            )}
          </div>
        </div>
      )}

<style>{`
  /* ============================================================
     CASEX DESIGN 4 — MARKETPLACE SIDEBAR + FULL-WIDTH ROW
     ============================================================ */
  .casex-d4-side-link.marketplace-link{
    display:flex !important;
  }

  .casex-d4-content .home-feature-zone{
    width:100% !important;
    max-width:none !important;
    margin:34px 0 34px !important;
    padding:0 !important;
  }

  .casex-d4-content .home-feature-heading{
    width:100% !important;
    margin-bottom:18px !important;
  }

  .casex-d4-content .home-feature-grid{
    width:100% !important;
    max-width:none !important;
    display:block !important;
  }

  .casex-d4-content .home-trending-feature{
    width:100% !important;
    max-width:none !important;
    min-width:0 !important;
    padding:22px !important;
    box-sizing:border-box !important;
    border:1px solid rgba(108,94,144,.24) !important;
    border-radius:18px !important;
    background:
      radial-gradient(700px 260px at 8% 0%,rgba(120,72,222,.11),transparent 60%),
      linear-gradient(160deg,rgba(14,16,25,.96),rgba(8,9,14,.94)) !important;
    box-shadow:0 20px 55px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.025) !important;
  }

  .casex-d4-content .home-trending-feature .home-section-heading{
    width:100% !important;
    display:flex !important;
    align-items:flex-end !important;
    justify-content:space-between !important;
    gap:20px !important;
    margin-bottom:18px !important;
  }

  .casex-d4-content .home-trending-grid-feature{
    width:100% !important;
    display:grid !important;
    grid-template-columns:repeat(6,minmax(0,1fr)) !important;
    gap:12px !important;
    align-items:stretch !important;
  }

  .casex-d4-content .home-trending-card-feature{
    width:100% !important;
    min-width:0 !important;
    min-height:245px !important;
    padding:10px !important;
    box-sizing:border-box !important;
    display:flex !important;
    flex-direction:column !important;
    align-items:stretch !important;
    border-radius:13px !important;
  }

  .casex-d4-content .home-trending-card-feature .home-trending-art{
    flex:1 1 auto !important;
    min-height:165px !important;
    display:grid !important;
    place-items:center !important;
    overflow:hidden !important;
  }

  .casex-d4-content .home-trending-card-feature .home-trending-card-copy{
    padding:10px 4px 4px !important;
  }

  .casex-d4-content .home-trending-card-feature .home-trending-card-copy strong,
  .casex-d4-content .home-trending-card-feature .home-trending-card-copy small,
  .casex-d4-content .home-trending-card-feature .home-trending-card-copy span{
    display:block !important;
  }

  .casex-d4-content .home-section-link{
    flex:0 0 auto !important;
    white-space:nowrap !important;
  }

  @media(max-width:1200px){
    .casex-d4-content .home-trending-grid-feature{
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
    }
  }

  @media(max-width:900px){
    .casex-d4-content .home-trending-grid-feature{
      grid-template-columns:repeat(3,minmax(0,1fr)) !important;
    }
  }

  @media(max-width:700px){
    .casex-d4-content .home-trending-feature{
      padding:16px !important;
    }
    .casex-d4-content .home-trending-feature .home-section-heading{
      align-items:flex-start !important;
      flex-direction:column !important;
    }
    .casex-d4-content .home-trending-grid-feature{
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    }
  }
`}</style>

<style>{`
  /* ============================================================
     CASEX DESIGN 4 — HOMEPAGE CATEGORY SPACING PASS
     Give major homepage sections room to breathe.
     ============================================================ */
  .casex-d4-content > .casex-game-hub.section{
    margin-bottom:64px !important;
  }
  .casex-d4-content > .home-feature-zone.section{
    margin-top:0 !important;
    margin-bottom:64px !important;
  }
  .casex-d4-content > #cases.section{
    margin-top:64px !important;
    margin-bottom:64px !important;
  }
  .casex-d4-content > section + section{
    margin-top:56px !important;
  }
  @media(max-width:900px){
    .casex-d4-content > .casex-game-hub.section{margin-bottom:52px !important}
    .casex-d4-content > section + section{margin-top:46px !important}
    .casex-d4-content > #cases.section{margin-top:52px !important;margin-bottom:52px !important}
  }
`}</style>


<style>{`
  /* ============================================================
     CASEX DESIGN 4 — FINAL HOMEPAGE SPACING + ANCHOR OFFSET
     Keep section headings visible below the fixed top navigation.
     ============================================================ */

  /* When the sidebar scrolls to Originals, don't hide the
     "ORIGINAL GAMES / Built different." heading behind the
     fixed CASEX top bar. */
  .casex-d4-content #original-games{
    scroll-margin-top:108px !important;
  }

  /* Give each major category more breathing room. */
  .casex-d4-content #original-games{
    margin-bottom:78px !important;
  }

  .casex-d4-content #marketplace{
    margin-top:0 !important;
    margin-bottom:82px !important;
  }

  .casex-d4-content #cases{
    margin-top:0 !important;
    margin-bottom:78px !important;
  }

  /* Keep the transition between the hero and the Originals
     section comfortable too. */
  .casex-d4-content .hero + #original-games{
    margin-top:34px !important;
  }

  /* Slightly smaller spacing on medium screens. */
  @media(max-width:900px){
    .casex-d4-content #original-games{
      scroll-margin-top:92px !important;
      margin-bottom:62px !important;
    }

    .casex-d4-content #marketplace{
      margin-bottom:66px !important;
    }

    .casex-d4-content #cases{
      margin-bottom:62px !important;
    }
  }

  @media(max-width:700px){
    .casex-d4-content #original-games{
      scroll-margin-top:82px !important;
      margin-bottom:48px !important;
    }

    .casex-d4-content #marketplace{
      margin-bottom:52px !important;
    }

    .casex-d4-content #cases{
      margin-bottom:48px !important;
    }
  }
`}</style>


<style>{`
  /* ============================================================
     CASEX DESIGN 4 — TOP BAR BRAND / SHUFFLE-STYLE POSITION
     Push the CASEX mark forward from the hamburger and enlarge
     the complete brand lockup.
     ============================================================ */

  @media(min-width:1101px){
    .casex-design4-nav .brand{
      margin-left:236px !important;
      gap:14px !important;
    }

    .casex-design4-nav .brand .brand-mark{
      width:46px !important;
      height:46px !important;
      min-width:46px !important;
      border-radius:12px !important;
      font-size:22px !important;
      box-shadow:0 10px 28px rgba(118,67,218,.28) !important;
    }

    .casex-design4-nav .brand > span{
      font-size:20px !important;
      line-height:1 !important;
      font-weight:900 !important;
      letter-spacing:-.02em !important;
    }
  }

  @media(min-width:901px) and (max-width:1100px){
    .casex-design4-nav .brand{
      margin-left:150px !important;
      gap:13px !important;
    }

    .casex-design4-nav .brand .brand-mark{
      width:44px !important;
      height:44px !important;
      min-width:44px !important;
      font-size:21px !important;
    }

    .casex-design4-nav .brand > span{
      font-size:19px !important;
    }
  }

  @media(min-width:701px) and (max-width:900px){
    .casex-design4-nav .brand{
      margin-left:78px !important;
      gap:11px !important;
    }

    .casex-design4-nav .brand .brand-mark{
      width:42px !important;
      height:42px !important;
      min-width:42px !important;
      font-size:20px !important;
    }

    .casex-design4-nav .brand > span{
      font-size:18px !important;
    }
  }

  @media(max-width:700px){
    .casex-design4-nav .brand{
      margin-left:0 !important;
      gap:9px !important;
    }

    .casex-design4-nav .brand .brand-mark{
      width:40px !important;
      height:40px !important;
      min-width:40px !important;
      font-size:19px !important;
    }

    .casex-design4-nav .brand > span{
      font-size:17px !important;
    }
  }
`}</style>


<style>{`
  /* ============================================================
     CASEX WALLET — SHUFFLE-STYLE DEPOSIT MODAL
     Visual redesign only: existing wallet/deposit/withdraw/history
     handlers and backend calls remain unchanged.
     ============================================================ */

  .wallet-modal-backdrop{
    position:fixed !important;
    inset:0 !important;
    z-index:5000 !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    padding:22px !important;
    background:rgba(0,0,0,.72) !important;
    backdrop-filter:blur(10px) !important;
    -webkit-backdrop-filter:blur(10px) !important;
  }

  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium{
    position:relative !important;
    width:min(560px,100%) !important;
    max-width:560px !important;
    max-height:min(720px,calc(100vh - 44px)) !important;
    overflow-y:auto !important;
    overflow-x:hidden !important;
    margin:0 !important;
    padding:24px 28px 26px !important;
    border:1px solid rgba(135,105,211,.34) !important;
    border-radius:18px !important;
    background:
      radial-gradient(420px 220px at 100% 0%,rgba(128,73,220,.12),transparent 66%),
      linear-gradient(180deg,#12141b 0%,#111319 100%) !important;
    box-shadow:
      0 35px 100px rgba(0,0,0,.62),
      0 0 0 1px rgba(255,255,255,.02) inset !important;
  }

  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium::-webkit-scrollbar{
    width:6px;
  }

  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium::-webkit-scrollbar-thumb{
    background:rgba(145,111,232,.28);
    border-radius:999px;
  }

  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium > .close{
    position:absolute !important;
    top:18px !important;
    right:18px !important;
    width:34px !important;
    height:34px !important;
    padding:0 !important;
    border:0 !important;
    background:transparent !important;
    color:#b9bdc8 !important;
    font-size:28px !important;
    line-height:1 !important;
    z-index:3 !important;
  }

  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium > .close:hover{
    color:#fff !important;
    background:rgba(255,255,255,.04) !important;
  }

  .wallet-modal-backdrop .wallet-premium-header{
    display:flex !important;
    align-items:flex-start !important;
    justify-content:space-between !important;
    gap:20px !important;
    margin:0 38px 20px 0 !important;
    padding:0 !important;
  }

  .wallet-modal-backdrop .wallet-premium-header .eyebrow{
    margin-bottom:5px !important;
    font-size:10px !important;
    letter-spacing:1.4px !important;
  }

  .wallet-modal-backdrop .wallet-premium-header h2{
    margin:0 !important;
    font-size:29px !important;
    line-height:1.05 !important;
    letter-spacing:-1px !important;
    font-weight:950 !important;
  }

  .wallet-modal-backdrop .wallet-premium-header p{
    margin:7px 0 0 !important;
    color:#858a96 !important;
    font-size:11px !important;
    line-height:1.45 !important;
    max-width:390px !important;
  }

  .wallet-modal-backdrop .wallet-status-pill{
    flex:0 0 auto !important;
    margin-top:2px !important;
    padding:7px 10px !important;
    border:1px solid rgba(80,221,166,.25) !important;
    border-radius:999px !important;
    background:rgba(61,194,147,.07) !important;
    color:#7ee6b4 !important;
    font-size:9px !important;
  }

  /* Shuffle uses the transaction tabs as the main navigation.
     Keep CASEX's three existing functional tabs, but give them
     the same compact underlined treatment. */
  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium{
    position:relative !important;
    display:grid !important;
    grid-template-columns:repeat(3,minmax(0,1fr)) !important;
    gap:0 !important;
    margin:2px 0 20px !important;
    padding:0 !important;
    border-bottom:1px solid #424652 !important;
    background:transparent !important;
    border-radius:0 !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button{
    position:relative !important;
    min-height:52px !important;
    padding:0 8px 11px !important;
    border:0 !important;
    border-radius:0 !important;
    background:transparent !important;
    color:#8e929d !important;
    box-shadow:none !important;
    font-size:13px !important;
    font-weight:850 !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button span{
    display:block !important;
    font-size:13px !important;
    font-weight:900 !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button small{
    display:none !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button::after{
    content:"" !important;
    position:absolute !important;
    left:14% !important;
    right:14% !important;
    bottom:-1px !important;
    height:2px !important;
    border-radius:999px 999px 0 0 !important;
    background:transparent !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button.active{
    color:#a87cff !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button.active::after{
    background:#9b63ff !important;
    box-shadow:0 0 14px rgba(155,99,255,.35) !important;
  }

  /* Hide the old oversized balance hero in the transaction modal.
     The compact modal should feel like Shuffle's wallet sheet. */
  .wallet-modal-backdrop .wallet-hero-card{
    display:none !important;
  }

  .wallet-modal-backdrop .wallet-action-heading{
    margin:4px 0 14px !important;
  }

  .wallet-modal-backdrop .wallet-action-heading strong{
    display:block !important;
    font-size:17px !important;
    margin-bottom:4px !important;
  }

  .wallet-modal-backdrop .wallet-action-heading span{
    display:block !important;
    color:#7f8490 !important;
    font-size:10px !important;
    line-height:1.45 !important;
  }

  /* Compact form fields like Shuffle's currency/address rows. */
  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium{
    margin-bottom:12px !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > span{
    margin-bottom:6px !important;
    color:#b5b9c2 !important;
    font-size:10px !important;
    font-weight:850 !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div{
    min-height:47px !important;
    border:1px solid #2f3440 !important;
    border-radius:9px !important;
    background:#1e222a !important;
    padding:0 13px !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium select,
  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium input{
    color:#f3f4f8 !important;
    font-size:12px !important;
    font-weight:750 !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium select option{
    background:#1b1e25 !important;
    color:#f3f4f8 !important;
  }

  /* Primary action matches the full-width purple Shuffle action. */
  .wallet-modal-backdrop .wallet-primary-action{
    width:100% !important;
    min-height:49px !important;
    margin-top:13px !important;
    border-radius:9px !important;
    font-size:12px !important;
    font-weight:900 !important;
  }

  .wallet-modal-backdrop .wallet-primary-action span{
    margin-left:auto !important;
    font-size:16px !important;
  }

  .wallet-modal-backdrop .wallet-action-note{
    margin-top:12px !important;
    border:1px solid #292e38 !important;
    border-radius:9px !important;
    background:#171a21 !important;
    padding:10px 11px !important;
  }

  .wallet-modal-backdrop .wallet-action-note p{
    color:#777d89 !important;
    font-size:9px !important;
    line-height:1.4 !important;
  }

  /* Brainrot deposit becomes a secondary compact row. */
  .wallet-modal-backdrop .brainrot-deposit-card{
    display:grid !important;
    grid-template-columns:auto minmax(0,1fr) auto !important;
    align-items:center !important;
    gap:12px !important;
    margin-top:12px !important;
    padding:12px !important;
    border:1px solid #303542 !important;
    border-radius:10px !important;
    background:#171a21 !important;
  }

  .wallet-modal-backdrop .brainrot-deposit-card-copy strong{
    font-size:11px !important;
  }

  .wallet-modal-backdrop .brainrot-deposit-card-copy span{
    color:#7f8490 !important;
    font-size:9px !important;
    line-height:1.35 !important;
  }

  .wallet-modal-backdrop .brainrot-deposit-card .secondary-button{
    min-height:38px !important;
    padding:0 13px !important;
    border-radius:8px !important;
    white-space:nowrap !important;
  }

  /* Generated crypto-payment state: compact address / QR presentation. */
  .wallet-modal-backdrop .wallet-qr-frame{
    margin:12px auto 14px !important;
    padding:10px !important;
    border-radius:9px !important;
  }

  .wallet-modal-backdrop .wallet-qr-frame img{
    width:190px !important;
    height:190px !important;
  }

  .wallet-modal-backdrop .wallet-crypto-network-warning,
  .wallet-modal-backdrop .wallet-withdraw-network-warning{
    border-radius:9px !important;
    padding:10px 11px !important;
  }

  .wallet-modal-backdrop .wallet-crypto-network-warning strong,
  .wallet-modal-backdrop .wallet-withdraw-network-warning strong{
    font-size:10px !important;
  }

  .wallet-modal-backdrop .wallet-crypto-network-warning p,
  .wallet-modal-backdrop .wallet-withdraw-network-warning p{
    font-size:9px !important;
    line-height:1.4 !important;
  }

  /* History keeps its existing data/logic, just uses the compact
     transaction-sheet dimensions. */
  .wallet-modal-backdrop .wallet-history-full{
    margin-top:2px !important;
  }

  .wallet-modal-backdrop .wallet-history-header{
    padding-bottom:12px !important;
    margin-bottom:9px !important;
    border-bottom:1px solid #353a45 !important;
  }

  .wallet-modal-backdrop .wallet-history-header h3{
    font-size:16px !important;
  }

  @media(max-width:700px){
    .wallet-modal-backdrop{
      align-items:flex-end !important;
      padding:10px !important;
    }

    .wallet-modal-backdrop .wallet-modal.wallet-modal-premium{
      width:100% !important;
      max-height:calc(100vh - 20px) !important;
      padding:20px 18px 20px !important;
      border-radius:16px 16px 12px 12px !important;
    }

    .wallet-modal-backdrop .wallet-premium-header{
      margin-right:34px !important;
    }

    .wallet-modal-backdrop .wallet-premium-header h2{
      font-size:25px !important;
    }

    .wallet-modal-backdrop .brainrot-deposit-card{
      grid-template-columns:auto minmax(0,1fr) !important;
    }

    .wallet-modal-backdrop .brainrot-deposit-card .secondary-button{
      grid-column:1 / -1 !important;
      width:100% !important;
    }
  }
`}</style>


<style>{`
  /* ============================================================
     CASEX WALLET — GRAPHITE / PURPLE PALETTE REFINEMENT
     Keep the existing wallet logic untouched.
     ============================================================ */

  .wallet-modal-backdrop{
    background:
      radial-gradient(520px 340px at 50% 32%,rgba(121,78,214,.10),transparent 72%),
      rgba(2,3,7,.76) !important;
    backdrop-filter:blur(12px) saturate(.9) !important;
    -webkit-backdrop-filter:blur(12px) saturate(.9) !important;
  }

  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium{
    border:1px solid rgba(118,124,141,.28) !important;
    background:
      radial-gradient(500px 210px at 100% 0%,rgba(128,76,224,.095),transparent 68%),
      linear-gradient(180deg,#111318 0%,#0f1116 100%) !important;
    box-shadow:
      0 40px 110px rgba(0,0,0,.68),
      0 0 0 1px rgba(255,255,255,.018) inset !important;
  }

  .wallet-modal-backdrop .wallet-premium-header .eyebrow{
    color:#a66cff !important;
  }

  .wallet-modal-backdrop .wallet-premium-header h2{
    color:#f4f5f8 !important;
  }

  .wallet-modal-backdrop .wallet-premium-header p{
    color:#858a96 !important;
  }

  .wallet-modal-backdrop .wallet-status-pill{
    color:#70e0aa !important;
    border-color:rgba(78,220,163,.28) !important;
    background:rgba(62,195,143,.055) !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium{
    border-bottom-color:#343841 !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button{
    color:#858a95 !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button:hover{
    color:#d4d6dd !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button.active{
    color:#aa72ff !important;
  }

  .wallet-modal-backdrop .wallet-tabs.wallet-tabs-premium button.active::after{
    background:#9d61ff !important;
    box-shadow:0 0 16px rgba(157,97,255,.28) !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > span{
    color:#a6abb6 !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div{
    border-color:#30343d !important;
    background:#20232a !important;
    box-shadow:0 1px 0 rgba(255,255,255,.015) inset !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium > div:focus-within{
    border-color:rgba(155,98,255,.74) !important;
    box-shadow:
      0 0 0 2px rgba(155,98,255,.10),
      0 1px 0 rgba(255,255,255,.015) inset !important;
  }

  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium select,
  .wallet-modal-backdrop .wallet-input-wrap.wallet-input-premium input{
    color:#f0f2f6 !important;
  }

  .wallet-modal-backdrop .wallet-action-heading strong{
    color:#f1f2f5 !important;
  }

  .wallet-modal-backdrop .wallet-action-heading span{
    color:#7c828e !important;
  }

  .wallet-modal-backdrop .wallet-action-note{
    border-color:#2d323c !important;
    background:#171a20 !important;
  }

  .wallet-modal-backdrop .wallet-action-note p{
    color:#7d838e !important;
  }

  .wallet-modal-backdrop .wallet-primary-action{
    color:#fff !important;
    background:
      linear-gradient(90deg,#7138d1 0%,#9659ef 50%,#b06fff 100%) !important;
    border:1px solid rgba(188,145,255,.42) !important;
    box-shadow:
      0 12px 28px rgba(118,57,211,.22),
      0 1px 0 rgba(255,255,255,.18) inset !important;
  }

  .wallet-modal-backdrop .wallet-primary-action:hover{
    filter:brightness(1.05) !important;
  }

  .wallet-modal-backdrop .wallet-primary-action:disabled{
    opacity:.58 !important;
    filter:none !important;
    box-shadow:none !important;
  }

  .wallet-modal-backdrop .brainrot-deposit-card{
    border-color:#30343d !important;
    background:#171a20 !important;
  }

  .wallet-modal-backdrop .brainrot-deposit-card-copy strong{
    color:#eceef2 !important;
  }

  .wallet-modal-backdrop .brainrot-deposit-card-copy span{
    color:#7d838e !important;
  }

  .wallet-modal-backdrop .wallet-crypto-network-warning,
  .wallet-modal-backdrop .wallet-withdraw-network-warning{
    border-color:rgba(239,130,93,.20) !important;
    background:rgba(159,64,38,.085) !important;
  }

  .wallet-modal-backdrop .wallet-crypto-network-warning strong,
  .wallet-modal-backdrop .wallet-withdraw-network-warning strong{
    color:#ff9b78 !important;
  }

  .wallet-modal-backdrop .wallet-crypto-network-warning p,
  .wallet-modal-backdrop .wallet-withdraw-network-warning p{
    color:#a98b83 !important;
  }

  .wallet-modal-backdrop .wallet-hero-card{
    border-color:#30343d !important;
  }

  .wallet-modal-backdrop .wallet-modal-balance{
    color:#f2f3f6 !important;
  }

  .wallet-modal-backdrop .wallet-history-header{
    border-bottom-color:#343841 !important;
  }

  .wallet-modal-backdrop .wallet-history-header h3{
    color:#f0f1f4 !important;
  }

  .wallet-modal-backdrop .wallet-inline-warning{
    border-color:rgba(255,171,90,.25) !important;
    background:rgba(184,111,31,.08) !important;
    color:#f4bd73 !important;
  }

  /* QR / crypto payment surface */
  .wallet-modal-backdrop .wallet-qr-frame{
    background:#ffffff !important;
    box-shadow:0 12px 30px rgba(0,0,0,.30) !important;
  }

  /* Close button */
  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium > .close{
    color:#9ba0aa !important;
  }

  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium > .close:hover{
    color:#f4f5f7 !important;
    background:#1a1d23 !important;
  }
`}</style>


<style>{`
  /* ============================================================
     CASEX WALLET — CLEAN SHUFFLE-LIKE CRYPTO DEPOSIT
     ============================================================ */
  .wallet-modal-backdrop .casex-clean-crypto-deposit{
    width:100% !important;
    padding:4px 0 0 !important;
    color:#f3f4f7 !important;
  }

  .wallet-modal-backdrop .casex-clean-crypto-row{
    margin-bottom:14px !important;
  }

  .wallet-modal-backdrop .casex-clean-label{
    display:block !important;
    margin:0 0 6px !important;
    color:#8b909a !important;
    font-size:10px !important;
    line-height:1 !important;
    font-weight:850 !important;
  }

  .wallet-modal-backdrop .casex-clean-select,
  .wallet-modal-backdrop .casex-clean-address{
    min-height:48px !important;
    width:100% !important;
    box-sizing:border-box !important;
    display:flex !important;
    align-items:center !important;
    gap:10px !important;
    border:1px solid #30343d !important;
    border-radius:9px !important;
    background:#20232a !important;
    padding:0 12px !important;
  }

  .wallet-modal-backdrop .casex-clean-select strong{
    color:#f1f3f6 !important;
    font-size:12px !important;
    font-weight:800 !important;
  }

  .wallet-modal-backdrop .casex-clean-balance{
    position:absolute !important;
    left:50% !important;
    top:50% !important;
    transform:translate(-50%,-50%) !important;
    margin:0 !important;
    color:#f1f3f6 !important;
    font-size:12px !important;
    font-weight:800 !important;
    line-height:1 !important;
    pointer-events:none !important;
    white-space:nowrap !important;
    z-index:1 !important;
  }

  .wallet-modal-backdrop .casex-clean-coin{
    width:28px !important;
    height:28px !important;
    flex:0 0 28px !important;
    display:grid !important;
    place-items:center !important;
    border-radius:50% !important;
    background:#2a2e37 !important;
    color:#fff !important;
    font-size:11px !important;
    font-weight:900 !important;
  }

  .wallet-modal-backdrop .casex-clean-address{
    background:#191c22 !important;
  }

  .wallet-modal-backdrop .casex-clean-address code{
    min-width:0 !important;
    flex:1 1 auto !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
    white-space:nowrap !important;
    color:#e8eaf0 !important;
    font-size:11px !important;
    font-weight:650 !important;
  }

  .wallet-modal-backdrop .casex-clean-icon-btn{
    width:32px !important;
    height:32px !important;
    flex:0 0 32px !important;
    border:0 !important;
    border-radius:7px !important;
    background:#2b2f38 !important;
    color:#d8dbe1 !important;
    cursor:pointer !important;
    font-size:15px !important;
  }

  .wallet-modal-backdrop .casex-clean-icon-btn:hover{
    background:#343945 !important;
    color:#fff !important;
  }

  .wallet-modal-backdrop .casex-clean-warning{
    display:flex !important;
    align-items:center !important;
    gap:8px !important;
    margin:2px 0 14px !important;
    padding:9px 11px !important;
    border:1px solid rgba(235,122,83,.18) !important;
    border-radius:8px !important;
    background:rgba(130,56,35,.07) !important;
    color:#e8a18a !important;
  }

  .wallet-modal-backdrop .casex-clean-warning span{
    display:grid !important;
    place-items:center !important;
    width:18px !important;
    height:18px !important;
    flex:0 0 18px !important;
    border:1px solid rgba(239,132,96,.35) !important;
    border-radius:50% !important;
    color:#ff9c79 !important;
    font-size:10px !important;
    font-weight:900 !important;
  }

  .wallet-modal-backdrop .casex-clean-warning strong{
    color:#d99782 !important;
    font-size:9px !important;
    line-height:1.35 !important;
    font-weight:750 !important;
  }

  .wallet-modal-backdrop .casex-clean-qr{
    width:204px !important;
    height:204px !important;
    margin:4px auto 15px !important;
    display:grid !important;
    place-items:center !important;
    padding:7px !important;
    box-sizing:border-box !important;
    border-radius:10px !important;
    background:#fff !important;
  }

  .wallet-modal-backdrop .casex-clean-qr img{
    width:190px !important;
    height:190px !important;
    display:block !important;
  }

  .wallet-modal-backdrop .casex-clean-deposit-meta{
    display:grid !important;
    grid-template-columns:1fr auto !important;
    align-items:center !important;
    gap:12px !important;
    padding:12px 0 !important;
    border-top:1px solid #2b3039 !important;
    border-bottom:1px solid #2b3039 !important;
  }

  .wallet-modal-backdrop .casex-clean-deposit-meta > div:first-child span{
    display:block !important;
    margin-bottom:4px !important;
    color:#838894 !important;
    font-size:9px !important;
    font-weight:800 !important;
    text-transform:uppercase !important;
    letter-spacing:.7px !important;
  }

  .wallet-modal-backdrop .casex-clean-deposit-meta > div:first-child strong{
    display:block !important;
    color:#f0f2f5 !important;
    font-size:17px !important;
    font-weight:900 !important;
  }

  .wallet-modal-backdrop .casex-clean-status{
    display:flex !important;
    align-items:center !important;
    justify-content:flex-end !important;
    gap:7px !important;
    color:#969ba5 !important;
    font-size:10px !important;
    white-space:nowrap !important;
  }

  .wallet-modal-backdrop .casex-clean-status-dot{
    width:7px !important;
    height:7px !important;
    border-radius:50% !important;
    background:#a66cff !important;
    box-shadow:0 0 8px rgba(166,108,255,.45) !important;
  }

  .wallet-modal-backdrop .casex-clean-status.success{
    color:#65dca4 !important;
  }

  .wallet-modal-backdrop .casex-clean-status.success .casex-clean-status-dot{
    background:#5de0a0 !important;
    box-shadow:0 0 8px rgba(93,224,160,.35) !important;
  }

  .wallet-modal-backdrop .casex-clean-status.error{
    color:#e98979 !important;
  }

  .wallet-modal-backdrop .casex-clean-status.error .casex-clean-status-dot{
    background:#e98979 !important;
    box-shadow:none !important;
  }

  .wallet-modal-backdrop .casex-clean-history-link{
    display:block !important;
    width:fit-content !important;
    margin:13px auto 0 !important;
    border:0 !important;
    background:none !important;
    color:#e9eaee !important;
    font-size:11px !important;
    font-weight:800 !important;
    text-decoration:underline !important;
    text-underline-offset:3px !important;
    cursor:pointer !important;
    padding:4px 6px !important;
  }

  .wallet-modal-backdrop .casex-clean-history-link:hover{
    color:#ae75ff !important;
  }

  /* Make the modal itself closer to Shuffle's restrained palette. */
  .wallet-modal-backdrop .wallet-modal.wallet-modal-premium{
    width:min(540px,100%) !important;
    max-width:540px !important;
    border-color:#30343c !important;
    background:#111318 !important;
  }

  .wallet-modal-backdrop .wallet-premium-header{
    margin-bottom:16px !important;
  }

  @media(max-width:700px){
    .wallet-modal-backdrop .casex-clean-qr{
      width:184px !important;
      height:184px !important;
    }

    .wallet-modal-backdrop .casex-clean-qr img{
      width:170px !important;
      height:170px !important;
    }

    .wallet-modal-backdrop .casex-clean-deposit-meta{
      grid-template-columns:1fr !important;
    }

    .wallet-modal-backdrop .casex-clean-status{
      justify-content:flex-start !important;
    }
  }
`}</style>




<style>{`
  /* CASEX WALLET — live crypto switcher
     One visual chevron + a full-size native select overlay so the arrow is clickable. */
  .wallet-modal-backdrop .casex-clean-select-live{
    position:relative !important;
    overflow:hidden !important;
    padding-right:0 !important;
  }

  .wallet-modal-backdrop .casex-clean-select-live::before{
    content:"" !important;
    display:block !important;
    position:absolute !important;
    right:12px !important;
    top:50% !important;
    width:7px !important;
    height:7px !important;
    margin-top:-5px !important;
    border-right:1.5px solid #9da2ad !important;
    border-bottom:1.5px solid #9da2ad !important;
    transform:rotate(45deg) !important;
    pointer-events:none !important;
    z-index:3 !important;
  }

  .wallet-modal-backdrop .casex-clean-select-live::after{
    content:none !important;
    display:none !important;
  }

  .wallet-modal-backdrop .casex-clean-select-live select{
    position:absolute !important;
    inset:0 !important;
    z-index:2 !important;
    width:100% !important;
    height:100% !important;
    min-width:0 !important;
    border:0 !important;
    outline:0 !important;
    box-shadow:none !important;
    appearance:none !important;
    -webkit-appearance:none !important;
    -moz-appearance:none !important;
    background:transparent !important;
    background-image:none !important;
    color:transparent !important;
    font-size:12px !important;
    cursor:pointer !important;
    opacity:0 !important;
  }

  .wallet-modal-backdrop .casex-clean-select-live select option{
    background:#1d2027 !important;
    color:#f1f3f6 !important;
    font-weight:700 !important;
  }

  .wallet-modal-backdrop .casex-clean-select-live select:disabled{
    cursor:not-allowed !important;
  }

  .wallet-modal-backdrop .casex-clean-select-live:focus-within{
    border-color:#30343d !important;
    box-shadow:none !important;
  }

        /* CASEX WALLET — make the deposit address easier to read */
        .wallet-modal-backdrop .casex-clean-address code{
          color:#f5f6f8 !important;
          font-size:12px !important;
          font-weight:850 !important;
          letter-spacing:.01em !important;
          text-shadow:0 0 8px rgba(255,255,255,.04) !important;
        }

        .wallet-modal-backdrop .casex-clean-address{
          background:#1b1e24 !important;
          border-color:#383d47 !important;
        }
`}</style>

      <style>{`
        /* ============================================================
           CASEX ORIGINAL GAMES — MATCH THE HOMEPAGE LAYOUT
           The game page now uses the same sidebar proportions,
           content gutters, header alignment and spacing as Home.
           ============================================================ */

        /* ----- Global header: same left-aligned brand treatment as Home ----- */
        .casex-d4-game-nav .brand{
          margin-left:236px !important;
          gap:14px !important;
        }

        .casex-d4-game-nav .brand .brand-mark{
          width:38px !important;
          height:38px !important;
          min-width:38px !important;
          border-radius:10px !important;
          font-size:17px !important;
        }

        .casex-d4-game-nav .brand > span{
          font-size:20px !important;
          line-height:1 !important;
          font-weight:900 !important;
          letter-spacing:-.02em !important;
        }

        /* ----- Game sidebar: copy the homepage sidebar geometry ----- */
        .casex-d4-game-sidebar{
          left:0 !important;
          top:74px !important;
          bottom:0 !important;
          width:236px !important;
          padding:18px 14px 16px !important;
          border-right:1px solid rgba(92,84,125,.20) !important;
          background:linear-gradient(180deg,rgba(10,11,17,.98),rgba(7,8,13,.98)) !important;
          box-shadow:12px 0 32px rgba(0,0,0,.12) !important;
          box-sizing:border-box !important;
          overflow-y:auto !important;
          overflow-x:hidden !important;
        }

        .casex-d4-game-sidebar.is-collapsed{
          width:72px !important;
          padding-left:10px !important;
          padding-right:10px !important;
        }

        .casex-d4-game-sidebar-head{
          align-items:center !important;
          gap:10px !important;
          padding:6px 8px 18px !important;
          min-height:0 !important;
        }

        .casex-d4-game-sidebar-logo{
          width:34px !important;
          height:34px !important;
          flex:0 0 34px !important;
          border-radius:10px !important;
          font-size:17px !important;
        }

        .casex-d4-game-sidebar-brand strong{
          font-size:13px !important;
          letter-spacing:.02em !important;
        }

        .casex-d4-game-sidebar-brand small{
          font-size:7px !important;
          letter-spacing:.18em !important;
        }

        .casex-d4-game-sidebar-label{
          margin:10px 8px 7px !important;
          font-size:7px !important;
          letter-spacing:.18em !important;
        }

        .casex-d4-game-side-item,
        .casex-d4-game-sidebar-back{
          min-height:0 !important;
          padding:10px 11px !important;
          margin:0 !important;
          gap:10px !important;
          border:0 !important;
          border-radius:9px !important;
          font-size:10px !important;
          font-weight:800 !important;
        }

        .casex-d4-game-side-icon{
          width:28px !important;
          height:28px !important;
          flex:0 0 28px !important;
          border-radius:9px !important;
          font-size:14px !important;
        }

        /* ----- The game viewport sits beside the sidebar just like Home content ----- */
        .casex-d4-original-game-stage{
          position:fixed !important;
          top:74px !important;
          left:236px !important;
          right:0 !important;
          bottom:0 !important;
          width:auto !important;
          height:auto !important;
          margin:0 !important;
          padding:0 !important;
          overflow-y:auto !important;
          overflow-x:hidden !important;
          background:
            radial-gradient(circle at 75% 7%,rgba(127,75,221,.14),transparent 23%),
            radial-gradient(circle at 16% 80%,rgba(56,77,156,.08),transparent 23%),
            linear-gradient(180deg,#05060a 0%,#070812 47%,#05060a 100%) !important;
          z-index:1200 !important;
        }

        .casex-d4-original-game-stage.sidebar-collapsed{
          left:72px !important;
        }

        /* Kill the older full-viewport/fixed overlay geometry so the game
           actually fills the available content column. */
        .casex-d4-original-game-stage .original-games-overlay{
          position:relative !important;
          inset:auto !important;
          left:auto !important;
          right:auto !important;
          top:auto !important;
          bottom:auto !important;
          width:100% !important;
          max-width:none !important;
          min-width:0 !important;
          min-height:100% !important;
          height:auto !important;
          margin:0 !important;
          overflow:visible !important;
          background:
            radial-gradient(circle at 75% 7%,rgba(127,75,221,.08),transparent 25%),
            linear-gradient(180deg,#05060a 0%,#070812 50%,#05060a 100%) !important;
        }

        .casex-d4-original-game-stage .original-games-page{
          width:100% !important;
          max-width:none !important;
          min-width:0 !important;
          margin:0 !important;
          min-height:100% !important;
          background:transparent !important;
          overflow:visible !important;
        }

        .casex-d4-original-game-stage .original-games-shell{
          width:calc(100% - 56px) !important;
          max-width:none !important;
          min-width:0 !important;
          margin:0 28px !important;
          padding:34px 0 56px !important;
          box-sizing:border-box !important;
        }

        /* Keep the game switcher in the same content gutter as homepage sections. */
        .casex-d4-original-game-stage .original-games-game-tabs{
          position:fixed !important;
          left:258px !important;
          top:84px !important;
          z-index:999999 !important;
          pointer-events:auto !important;
        }

        .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
          left:94px !important;
        }

        /* The content/header spacing should feel like the Home page. */
        .casex-d4-original-game-stage .original-games-heading{
          margin-bottom:24px !important;
        }

        .casex-d4-original-game-stage .original-games-heading h1{
          font-size:52px !important;
          letter-spacing:-2.6px !important;
        }

        /* Preserve the special Towers visual, but keep it within the same
           content column rather than bleeding across the viewport. */
        .casex-d4-original-game-stage .original-games-towers-page{
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          margin:0 !important;
          overflow-x:hidden !important;
        }

        .casex-d4-original-game-stage .original-games-towers-page .original-games-shell{
          width:calc(100% - 56px) !important;
          max-width:none !important;
          margin:0 28px !important;
        }

        @media(max-width:700px){
          .casex-d4-game-nav .brand{
            margin-left:0 !important;
          }

          .casex-d4-game-sidebar{
            top:68px !important;
            width:100% !important;
            max-width:236px !important;
          }

          .casex-d4-game-sidebar.is-collapsed{
            width:64px !important;
          }

          .casex-d4-original-game-stage{
            top:68px !important;
            left:236px !important;
          }

          .casex-d4-original-game-stage.sidebar-collapsed{
            left:64px !important;
          }

          .casex-d4-original-game-stage .original-games-shell{
            width:calc(100% - 32px) !important;
            margin:0 16px !important;
            padding:24px 0 42px !important;
          }

          .casex-d4-original-game-stage .original-games-game-tabs{
            left:246px !important;
            top:76px !important;
          }

          .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
            left:74px !important;
          }
        }
      


        /* ============================================================
           ORIGINAL GAME SIDEBAR — EXACT HOMEPAGE SIDEBAR
           Reuse the homepage .casex-d4-sidebar styles instead of a
           second, visually different sidebar implementation.
           ============================================================ */

        .casex-d4-game-shared-sidebar{
          position:fixed !important;
          left:0 !important;
          top:74px !important;
          bottom:0 !important;
          width:214px !important;
          box-sizing:border-box !important;
          z-index:2600 !important;
          transform:translateX(0) !important;
          opacity:1 !important;
          pointer-events:auto !important;
        }

        .casex-d4-game-shared-sidebar.game-sidebar-visible{
          transform:translateX(0) !important;
          opacity:1 !important;
          pointer-events:auto !important;
        }

        .casex-d4-game-shared-sidebar.game-sidebar-collapsed{
          transform:translateX(-102%) !important;
          opacity:.98 !important;
          pointer-events:none !important;
        }

        /* Match the homepage active treatment for the currently-open game. */
        .casex-d4-game-shared-sidebar .casex-d4-side-game.active{
          background:linear-gradient(
            90deg,
            rgba(115,67,204,.28),
            rgba(75,40,130,.12)
          ) !important;
          color:#fff !important;
          box-shadow:inset 2px 0 0 #a66eff !important;
        }

        /* On a game page, the content begins after the SAME sidebar width. */
        .casex-d4-original-game-stage{
          position:relative !important;
          margin-left:214px !important;
          width:calc(100% - 214px) !important;
          max-width:none !important;
          box-sizing:border-box !important;
        }

        .casex-d4-original-game-stage.sidebar-collapsed{
          margin-left:0 !important;
          width:100% !important;
        }

        @media(max-width:700px){
          .casex-d4-game-shared-sidebar{
            top:68px !important;
            width:100% !important;
            max-width:236px !important;
          }

          .casex-d4-original-game-stage{
            margin-left:0 !important;
            width:100% !important;
          }

          .casex-d4-game-shared-sidebar.game-sidebar-collapsed{
            transform:translateX(-102%) !important;
          }
        }
      
      `}</style>

      <style>{`
        /* ============================================================
           CASEX ORIGINAL GAMES — SINGLE SOURCE OF PAGE POSITIONING

           The sidebar is fixed independently. The React wrapper around
           OriginalGames must not contribute any width or margin.
           The actual Originals overlay is the ONLY content-column offset.
           ============================================================ */

        /* 1. Remove the wrapper from layout entirely. */
        .casex-d4-original-game-stage{
          display:contents !important;
        }

        /* 2. Position the actual Originals viewport beside the homepage
              sidebar. This is the ONE horizontal offset. */
        .casex-d4-original-game-stage .original-games-overlay{
          position:fixed !important;
          top:74px !important;
          right:0 !important;
          bottom:0 !important;
          left:214px !important;
          inset:74px 0 0 214px !important;
          width:auto !important;
          height:auto !important;
          min-height:0 !important;
          max-width:none !important;
          margin:0 !important;
          padding:0 !important;
          overflow-x:hidden !important;
          overflow-y:auto !important;
          box-sizing:border-box !important;
          z-index:1200 !important;

          background:
            radial-gradient(circle at 18% 10%,rgba(133,77,239,.12),transparent 27%),
            radial-gradient(circle at 82% 14%,rgba(63,86,210,.06),transparent 29%),
            linear-gradient(180deg,#06070c 0%,#090a11 54%,#05060a 100%) !important;
        }

        /* These older selectors previously added another 214/236px shift.
           Force them back to the canonical position. */
        .casex-d4-original-game-stage.sidebar-open .original-games-overlay,
        .casex-d4-original-game-stage.sidebar-collapsed .original-games-overlay{
          left:214px !important;
          right:0 !important;
          width:auto !important;
          margin:0 !important;
        }

        /* When the sidebar is collapsed, the content can use the full screen. */
        .casex-d4-original-game-stage.sidebar-collapsed .original-games-overlay{
          left:0 !important;
          inset:74px 0 0 0 !important;
        }

        /* 3. Keep the actual game page itself at 100% of the viewport
              created by the overlay. */
        .casex-d4-original-game-stage .original-games-page{
          position:relative !important;
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          min-height:100% !important;
          height:auto !important;
          margin:0 !important;
          padding:0 !important;
          overflow:visible !important;
          background:transparent !important;
          box-sizing:border-box !important;
        }

        /* 4. Use the same broad content gutter as the redesigned Home page.
              Do NOT add a second sidebar offset here. */
        .casex-d4-original-game-stage .original-games-shell{
          width:min(1440px,calc(100% - 48px)) !important;
          max-width:1440px !important;
          min-width:0 !important;
          margin:0 auto !important;
          padding:48px 0 80px !important;
          box-sizing:border-box !important;
        }

        /* Towers uses the same shell as the other original games. */
        .casex-d4-original-game-stage .original-games-towers-page{
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          margin:0 !important;
          overflow-x:hidden !important;
          background:transparent !important;
        }

        .casex-d4-original-game-stage .original-games-towers-page .original-games-shell{
          width:min(1440px,calc(100% - 48px)) !important;
          max-width:1440px !important;
          margin:0 auto !important;
        }

        /* 5. Game tabs are positioned ONCE under the global header.
              They no longer inherit the stage's old offset. */
        .casex-d4-original-game-stage .original-games-game-tabs{
          position:fixed !important;
          top:86px !important;
          left:238px !important;
          right:auto !important;
          margin:0 !important;
          z-index:999999 !important;
          pointer-events:auto !important;
        }

        .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
          left:24px !important;
        }

        /* Remove the legacy horizontal offset rules at every specificity
           level used by the previous sidebar implementation. */
        .casex-d4-original-game-stage.sidebar-open .original-games-game-tabs{
          left:238px !important;
        }

        /* Prevent any game-specific wrapper from reintroducing a second
           horizontal content column. */
        .casex-d4-original-game-stage .original-games-layout,
        .casex-d4-original-game-stage .coinflip-layout{
          width:100% !important;
          max-width:100% !important;
          min-width:0 !important;
          box-sizing:border-box !important;
        }

        @media(max-width:700px){
          .casex-d4-original-game-stage .original-games-overlay,
          .casex-d4-original-game-stage.sidebar-open .original-games-overlay,
          .casex-d4-original-game-stage.sidebar-collapsed .original-games-overlay{
            top:68px !important;
            left:0 !important;
            right:0 !important;
            bottom:0 !important;
            inset:68px 0 0 0 !important;
          }

          .casex-d4-original-game-stage .original-games-shell,
          .casex-d4-original-game-stage .original-games-towers-page .original-games-shell{
            width:calc(100% - 24px) !important;
            max-width:none !important;
            margin:0 12px !important;
            padding:44px 0 60px !important;
          }

          .casex-d4-original-game-stage .original-games-game-tabs,
          .casex-d4-original-game-stage.sidebar-open .original-games-game-tabs,
          .casex-d4-original-game-stage.sidebar-collapsed .original-games-game-tabs{
            left:12px !important;
            top:76px !important;
          }
        }
      /* ============================================================
         CASEX ORIGINAL GAMES — COLOR DICING SHARED FRAME
         Uses the latest homepage-matched game sidebar already present
         in this main.jsx. No second sidebar or old integration is added.
         ============================================================ */

      .casex-d4-original-game-stage .casex-d4-dicing-overlay{
        /* Match Mines/Towers/Plinko/Chicken/Coinflip: the game overlay
           itself owns the vertical scroll. The wrapper is display:contents. */
        position:fixed !important;
        top:74px !important;
        right:0 !important;
        bottom:0 !important;
        left:214px !important;
        inset:74px 0 0 214px !important;
        width:auto !important;
        max-width:none !important;
        min-width:0 !important;
        min-height:0 !important;
        height:auto !important;
        margin:0 !important;
        padding:0 !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        scrollbar-width:thin !important;
        scrollbar-color:rgba(157,108,255,.48) transparent !important;
        background:transparent !important;
        box-sizing:border-box !important;
      }

      .casex-d4-original-game-stage .casex-d4-dicing-overlay::-webkit-scrollbar{
        width:8px !important;
      }

      .casex-d4-original-game-stage .casex-d4-dicing-overlay::-webkit-scrollbar-track{
        background:transparent !important;
      }

      .casex-d4-original-game-stage .casex-d4-dicing-overlay::-webkit-scrollbar-thumb{
        background:linear-gradient(180deg,rgba(157,108,255,.62),rgba(112,66,210,.48)) !important;
        border:2px solid transparent !important;
        background-clip:padding-box !important;
        border-radius:999px !important;
      }

      .casex-d4-original-game-stage .casex-d4-dicing-overlay::-webkit-scrollbar-thumb:hover{
        background:linear-gradient(180deg,rgba(173,122,255,.78),rgba(125,75,226,.66)) !important;
        border:2px solid transparent !important;
        background-clip:padding-box !important;
      }

      /* Collapsed sidebar = full-width game viewport, same as every other
         Original Game. */
      .casex-d4-original-game-stage.sidebar-collapsed .casex-d4-dicing-overlay{
        left:0 !important;
        inset:74px 0 0 0 !important;
      }

      .casex-d4-dicing-tabs{
        position:fixed !important;
        top:86px !important;
        left:256px !important;
        right:auto !important;
        z-index:999999 !important;
        margin:0 !important;
        pointer-events:auto !important;
      }

      .casex-d4-original-game-stage.sidebar-collapsed .casex-d4-dicing-tabs{
        left:24px !important;
      }

      .casex-d4-dicing-content{
        width:100% !important;
        min-width:0 !important;
        box-sizing:border-box !important;
        padding:48px 24px 80px !important;
      }

      .casex-d4-dicing-content .color-dicing-page-wrap{
        width:100% !important;
        min-height:0 !important;
        margin:0 !important;
        padding:0 !important;
        background:transparent !important;
        box-sizing:border-box !important;
      }

      .casex-d4-dicing-content .color-dicing-back{
        display:none !important;
      }

      .casex-d4-dicing-content .color-dicing-page{
        width:min(1180px,100%) !important;
        max-width:1180px !important;
        margin:0 auto !important;
        padding:0 !important;
        box-sizing:border-box !important;
      }

      .casex-d4-dicing-content .color-dicing-shell{
        width:100% !important;
        max-width:none !important;
        box-sizing:border-box !important;
      }

      @media(max-width:700px){
        .casex-d4-dicing-tabs{
          left:204px !important;
          top:76px !important;
        }

        .casex-d4-original-game-stage.sidebar-collapsed .casex-d4-dicing-tabs{
          left:12px !important;
        }

        .casex-d4-dicing-overlay,
        .casex-d4-original-game-stage.sidebar-open .casex-d4-dicing-overlay,
        .casex-d4-original-game-stage.sidebar-collapsed .casex-d4-dicing-overlay{
          top:68px !important;
          left:0 !important;
          right:0 !important;
          bottom:0 !important;
          inset:68px 0 0 0 !important;
        }

        .casex-d4-dicing-content{
          padding:44px 12px 60px !important;
        }

        .casex-d4-dicing-content .color-dicing-page{
          width:100% !important;
          max-width:none !important;
        }
      }

        /* ============================================================
           CASEX COLOR DICING — MY BETS + NO HOMEPAGE UNDERFLOW
           ============================================================ */

        .casex-color-dicing-my-bets{
          width:min(1180px,calc(100% - 48px));
          max-width:1180px;
          margin:34px auto 0;
          box-sizing:border-box;
          border:1px solid rgba(133,101,190,.22);
          border-radius:16px;
          background:
            linear-gradient(180deg,rgba(19,21,32,.96),rgba(7,9,14,.98));
          box-shadow:0 18px 60px rgba(0,0,0,.24);
          overflow:hidden;
        }

        .casex-color-dicing-my-bets-head{
          min-height:62px;
          padding:10px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          border-bottom:1px solid rgba(255,255,255,.055);
          box-sizing:border-box;
        }

        .casex-color-dicing-my-bets-tab{
          min-height:42px;
          padding:0 20px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:10px;
          color:#fff;
          background:rgba(37,42,58,.94);
          font-size:14px;
          font-weight:950;
        }

        .casex-color-dicing-my-bets-head > span{
          color:#707486;
          font-size:8px;
          font-weight:950;
          letter-spacing:1.5px;
        }

        .casex-color-dicing-my-bets-table-wrap{
          width:100%;
          overflow-x:auto;
        }

        .casex-color-dicing-my-bets-table{
          min-width:760px;
        }

        .casex-color-dicing-my-bets-row{
          display:grid;
          grid-template-columns:1.4fr 1.05fr 1fr 1fr 1.15fr;
          align-items:center;
          min-height:62px;
          padding:0 24px;
          gap:18px;
          box-sizing:border-box;
          color:#9ca0b0;
          font-size:10px;
          font-weight:800;
          border-bottom:1px solid rgba(255,255,255,.045);
        }

        .casex-color-dicing-my-bets-row:last-child{
          border-bottom:0;
        }

        .casex-color-dicing-my-bets-head-row{
          min-height:44px;
          color:#6f7382;
          font-size:8px;
          font-weight:950;
          letter-spacing:.7px;
          text-transform:uppercase;
        }

        .casex-color-dicing-my-bets-game{
          display:flex;
          align-items:center;
          gap:10px;
          color:#ece9f4;
          font-size:11px;
          font-weight:950;
        }

        .casex-color-dicing-my-bets-game b{
          width:30px;
          height:30px;
          display:grid;
          place-items:center;
          flex:0 0 30px;
          border-radius:8px;
          background:rgba(126,75,220,.16);
          font-size:14px;
        }

        .casex-color-dicing-my-bets-multiplier{
          font-size:11px;
          font-weight:1000;
        }

        .casex-color-dicing-my-bets-multiplier.win,
        .casex-color-dicing-my-bets-payout.win{
          color:#59e8ab;
        }

        .casex-color-dicing-my-bets-multiplier.loss{
          color:#ff6d86;
        }

        .casex-color-dicing-my-bets-payout{
          color:#8f95a7;
          font-size:11px;
          font-weight:950;
        }

        .casex-color-dicing-view-result{
          min-width:104px;
          min-height:36px;
          padding:0 15px;
          border:1px solid rgba(157,111,255,.38);
          border-radius:9px;
          background:linear-gradient(
            100deg,
            rgba(111,58,211,.25),
            rgba(164,106,255,.18)
          );
          color:#d8c8ff;
          font-size:10px;
          font-weight:1000;
          cursor:pointer;
        }

        .casex-color-dicing-view-result:hover{
          border-color:rgba(178,139,255,.72);
          background:linear-gradient(
            100deg,
            rgba(117,65,212,.42),
            rgba(164,106,255,.32)
          );
          color:#fff;
        }

        .casex-color-dicing-my-bets-empty{
          min-height:140px;
          display:grid;
          place-items:center;
          padding:28px;
          color:#75798b;
          font-size:11px;
          font-weight:800;
          text-align:center;
        }

        .casex-color-dicing-result-modal-backdrop{
          position:fixed;
          inset:0;
          z-index:1800;
          display:grid;
          place-items:center;
          padding:28px;
          background:rgba(2,3,8,.78);
          backdrop-filter:blur(12px);
        }

        .casex-color-dicing-result-modal{
          width:min(680px,100%);
          max-height:min(780px,calc(100vh - 56px));
          overflow:auto;
          position:relative;
          padding:24px;
          border:1px solid rgba(136,103,196,.36);
          border-radius:16px;
          background:
            linear-gradient(180deg,rgba(20,22,32,.98),rgba(7,9,14,.99));
          box-shadow:0 28px 90px rgba(0,0,0,.48);
          box-sizing:border-box;
        }

        .casex-color-dicing-result-modal-head{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:16px;
          margin-bottom:22px;
        }

        .casex-color-dicing-result-modal-head h2{
          margin:5px 0 0;
          color:#fff;
          font-size:28px;
          font-weight:1000;
          letter-spacing:-.8px;
        }

        .casex-color-dicing-result-modal-close{
          width:38px;
          height:38px;
          border:1px solid rgba(255,255,255,.09);
          border-radius:10px;
          background:rgba(255,255,255,.03);
          color:#a7aab7;
          font-size:24px;
          line-height:1;
          cursor:pointer;
        }

        .casex-color-dicing-result-meta{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:10px;
          margin-bottom:20px;
        }

        .casex-color-dicing-result-meta > div{
          min-height:70px;
          padding:12px;
          border:1px solid rgba(255,255,255,.055);
          border-radius:10px;
          background:rgba(255,255,255,.025);
          display:flex;
          flex-direction:column;
          justify-content:center;
          gap:4px;
          box-sizing:border-box;
        }

        .casex-color-dicing-result-meta span{
          color:#73788a;
          font-size:8px;
          font-weight:900;
          letter-spacing:1px;
          text-transform:uppercase;
        }

        .casex-color-dicing-result-meta strong{
          color:#fff;
          font-size:13px;
          font-weight:950;
        }

        .casex-color-dicing-result-meta strong.win{
          color:#59e8ab;
        }

        .casex-color-dicing-result-meta strong.loss{
          color:#ff6d86;
        }

        .casex-color-dicing-result-dice{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:10px;
          margin-bottom:20px;
        }

        .casex-color-dicing-result-die{
          min-height:100px;
          border:1px solid rgba(255,255,255,.07);
          border-radius:12px;
          background:linear-gradient(
            145deg,
            color-mix(in srgb,var(--result-die-color) 18%,#11141d),
            #0b0d14
          );
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:8px;
        }

        .casex-color-dicing-result-die > span{
          width:30px;
          height:30px;
          border-radius:50%;
          background:var(--result-die-color);
          box-shadow:
            0 0 0 7px color-mix(in srgb,var(--result-die-color) 14%,transparent),
            0 10px 24px color-mix(in srgb,var(--result-die-color) 18%,transparent);
        }

        .casex-color-dicing-result-die small{
          color:#8f94a4;
          font-size:8px;
          font-weight:900;
          text-transform:uppercase;
        }

        .casex-color-dicing-result-status{
          min-height:58px;
          padding:0 16px;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:15px;
          box-sizing:border-box;
        }

        .casex-color-dicing-result-status.win{
          background:rgba(36,190,133,.08);
          color:#59e8ab;
        }

        .casex-color-dicing-result-status.loss{
          background:rgba(255,72,107,.08);
          color:#ff6d86;
        }

        .casex-color-dicing-result-status strong{
          font-size:12px;
          font-weight:1000;
          letter-spacing:1px;
        }

        .casex-color-dicing-result-status span{
          font-size:10px;
          font-weight:850;
        }

        @media(max-width:900px){
          .casex-color-dicing-my-bets{
            width:calc(100% - 24px);
            margin-top:26px;
          }
        }

        @media(max-width:600px){
          .casex-color-dicing-my-bets-head{
            min-height:54px;
            padding:8px 10px;
          }

          .casex-color-dicing-my-bets-tab{
            min-height:38px;
            padding:0 16px;
            font-size:13px;
          }

          .casex-color-dicing-my-bets-row{
            min-height:54px;
            padding:0 14px;
            gap:12px;
            font-size:10px;
          }

          .casex-color-dicing-my-bets-head-row{
            min-height:40px;
            font-size:8px;
          }

          .casex-color-dicing-view-result{
            min-width:88px;
            min-height:32px;
            padding:0 12px;
            font-size:9px;
          }

          .casex-color-dicing-result-modal-backdrop{
            padding:14px;
          }

          .casex-color-dicing-result-meta{
            grid-template-columns:repeat(2,1fr);
          }

          .casex-color-dicing-result-dice{
            grid-template-columns:repeat(2,1fr);
          }
        }
      `}</style>

      <style>{`
        /* ============================================================
           CASEX COLOR DICING — SIDEBAR BRAND FIX
           Keep the real sidebar CASEX header when the sidebar is open.
           When the sidebar is closed, its header must not peek into the
           Color Dicing game-switcher area.
           ============================================================ */
        /* The sidebar brand belongs to the real sidebar. Keep it visible
           whenever the sidebar is open, including on Original Games. */
        .casex-d4-global-sidebar.is-open .casex-d4-sidebar-head,
        body.casex-global-sidebar-open .casex-d4-global-sidebar .casex-d4-sidebar-head{
          display:flex !important;
          visibility:visible !important;
        }

        /* When the sidebar is closed, remove the sidebar brand completely.
           The body state is used as an additional guard so the old sidebar
           header cannot leak into the game-switcher / Color Dicing area. */
        .casex-d4-global-sidebar.is-closed .casex-d4-sidebar-head,
        body.casex-global-sidebar-closed .casex-d4-global-sidebar .casex-d4-sidebar-head{
          display:none !important;
          visibility:hidden !important;
          width:0 !important;
          height:0 !important;
          min-height:0 !important;
          margin:0 !important;
          padding:0 !important;
          overflow:hidden !important;
        }

        /* ============================================================
           CASEX COLOR DICING — FINAL SIDEBAR ALIGNMENT
           Match the same broad content gutter used by the other
           Original Games instead of centering inside a narrow 1180px
           canvas. This keeps Dicing close to the open sidebar.
           ============================================================ */
        .casex-d4-dicing-content .color-dicing-page{
          width:min(1440px,calc(100% - 48px)) !important;
          max-width:1440px !important;
          margin:0 auto !important;
        }

        @media(max-width:700px){
          .casex-d4-dicing-content .color-dicing-page{
            width:100% !important;
            max-width:none !important;
          }
        }
      `}</style>


      <style>{`
        /* ============================================================
           ORIGINAL GAMES — USE THE EXACT HOME SIDEBAR BRAND
           This is the existing CASEX / PLAY HUB header from the global
           sidebar. Keep it in the first position, with the same spacing
           as the Home page. No extra CASEX logo is created for Originals.
           ============================================================ */
        .casex-d4-global-sidebar.is-original-game.is-open .casex-d4-sidebar-head{
          display:flex !important;
          position:relative !important;
          order:0 !important;
          align-items:center !important;
          gap:10px !important;
          margin:0 !important;
          padding:6px 8px 20px !important;
          min-height:48px !important;
          visibility:visible !important;
          opacity:1 !important;
        }

        .casex-d4-global-sidebar.is-original-game.is-open .casex-d4-sidebar-logo{
          width:36px !important;
          height:36px !important;
          flex:0 0 36px !important;
          border-radius:11px !important;
        }

        .casex-d4-global-sidebar.is-original-game.is-open .casex-d4-sidebar-head + .casex-d4-side-label{
          margin-top:13px !important;
        }

        /* Keep the Originals sidebar brand at the top, with the same clean
           breathing room used on Home before the navigation begins. */
        .casex-d4-global-sidebar.is-original-game.is-open{
          padding-top:26px !important;
        }

        /* Do not create or expose any replacement brand in the game tab area. */
        .casex-d4-original-game-stage .casex-d4-dicing-tabs .casex-d4-sidebar-head,
        .casex-d4-original-game-stage .original-games-game-tabs .casex-d4-sidebar-head{
          display:none !important;
        }
      `}</style>
      <style>{`
        /* ============================================================
           CASEX HOMEPAGE — BRAINROT DEPOSIT PROMO
           Promotes the existing Steal a Brainrot deposit flow.
           ============================================================ */
        .casex-brainrot-deposit-promo{position:relative !important;min-height:132px !important;margin:28px 0 34px !important;padding:20px 26px !important;display:flex !important;align-items:center !important;justify-content:space-between !important;gap:28px !important;overflow:hidden !important;box-sizing:border-box !important;border:1px solid rgba(157,116,255,.26) !important;border-radius:20px !important;background:radial-gradient(circle at 86% 50%,rgba(157,116,255,.18),transparent 27%),radial-gradient(circle at 18% 100%,rgba(84,55,156,.12),transparent 34%),linear-gradient(145deg,#11131d,#090b11 68%,#0c0913) !important;box-shadow:0 20px 55px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.025) !important;}
        .casex-brainrot-deposit-promo::before{content:"" !important;position:absolute !important;inset:0 !important;pointer-events:none !important;background-image:linear-gradient(rgba(156,119,230,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(156,119,230,.035) 1px,transparent 1px) !important;background-size:34px 34px !important;mask-image:linear-gradient(90deg,#000 0%,rgba(0,0,0,.7) 62%,transparent 100%) !important;}
        .casex-brainrot-deposit-copy{position:relative !important;z-index:2 !important;min-width:0 !important;max-width:760px !important;}
        .casex-brainrot-deposit-kicker{color:#a77bff !important;font-size:9px !important;font-weight:900 !important;letter-spacing:1.6px !important;text-transform:uppercase !important;}
        .casex-brainrot-deposit-promo h2{margin:5px 0 5px !important;color:#f5f6fa !important;font-size:24px !important;line-height:1.08 !important;letter-spacing:-.8px !important;}
        .casex-brainrot-deposit-promo p{margin:0 !important;max-width:670px !important;color:#858997 !important;font-size:11px !important;line-height:1.6 !important;}
        .casex-brainrot-deposit-cta{position:relative !important;z-index:2 !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:9px !important;min-height:38px !important;margin-top:12px !important;padding:9px 13px !important;border:0 !important;border-radius:10px !important;background:linear-gradient(135deg,#9d6cff,#7042d2) !important;color:#fff !important;font-size:10px !important;font-weight:900 !important;cursor:pointer !important;box-shadow:0 12px 28px rgba(112,66,210,.24) !important;transition:transform .18s ease,box-shadow .18s ease,filter .18s ease !important;}
        .casex-brainrot-deposit-cta:hover{transform:translateY(-1px) !important;box-shadow:0 16px 34px rgba(112,66,210,.34) !important;filter:brightness(1.04) !important;}
        .casex-brainrot-deposit-art{position:relative !important;z-index:2 !important;flex:0 0 205px !important;width:205px !important;height:100px !important;display:flex !important;align-items:center !important;justify-content:center !important;}
        .casex-brainrot-deposit-art img{position:relative !important;z-index:2 !important;width:182px !important;height:96px !important;object-fit:contain !important;filter:drop-shadow(0 18px 24px rgba(0,0,0,.42)) !important;transform:translateY(1px) rotate(-2deg) !important;}
        .casex-brainrot-deposit-glow{position:absolute !important;left:50% !important;top:50% !important;width:180px !important;height:70px !important;transform:translate(-50%,-50%) !important;border-radius:50% !important;background:#8b5cf6 !important;opacity:.18 !important;filter:blur(32px) !important;}
        @media(max-width:900px){.casex-brainrot-deposit-promo{min-height:148px !important;margin:24px 0 30px !important;padding:18px 20px !important}.casex-brainrot-deposit-promo h2{font-size:22px !important}.casex-brainrot-deposit-art{flex-basis:165px !important;width:165px !important}.casex-brainrot-deposit-art img{width:148px !important;height:82px !important}}
        @media(max-width:700px){.casex-brainrot-deposit-promo{min-height:0 !important;margin:20px 0 26px !important;padding:18px !important;flex-direction:column !important;align-items:flex-start !important;gap:10px !important}.casex-brainrot-deposit-promo h2{font-size:21px !important}.casex-brainrot-deposit-promo p{font-size:10px !important}.casex-brainrot-deposit-art{width:100% !important;height:84px !important;flex:0 0 auto !important}.casex-brainrot-deposit-art img{width:150px !important;height:78px !important}}
      `}</style>


    </div>
  );
}

const root = createRoot(
  document.getElementById("root")
);

const isAdmin =
  window.location.pathname ===
    "/admin" ||
  window.location.hash ===
    "#admin";

if (isAdmin) {
  root.render(<Admin />);
} else {
  root.render(<App />);
}
