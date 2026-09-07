import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import Admin from "./admin.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const apiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    credentials: "include",
  });

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
    </div>
  );
}


function ColorDicingGame({ authUser, openAuth, onBalanceChange }) {
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

  const applyGameResponse = (data) => {
    const game = data?.game;

    if (!game) {
      throw new Error("COLOR_DICING_GAME_MISSING");
    }

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

    if (!isReroll && (!Number.isFinite(numericBet) || numericBet <= 0)) {
      setResult({
        type: "error",
        title: "Invalid bet",
        message: "Enter a valid bet amount.",
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

              <div className="color-dicing-input-wrap">
                <span>$</span>
                <input
                  type="number"
                  min="0.01"
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

              <div className="color-dicing-quick-bets">
                {[1, 5, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      if (!betLocked) setBetAmount(amount.toFixed(2));
                    }}
                    disabled={rolling || loadingGame || betLocked}
                  >
                    ${amount}
                  </button>
                ))}
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
    </section>
  );
}

function App() {
  useScrollReveal();
  const [balance, setBalance] = useState(100);

  const [authUser, setAuthUser] = useState(null);
  const [cases, setCases] = useState(fallbackCases);
  const [inventory, setInventory] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [liveActivity, setLiveActivity] = useState([]);
  const [liveActivityLoading, setLiveActivityLoading] = useState(true);

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
  const [selected, setSelected] = useState(null);
  const [casesPageOpen, setCasesPageOpen] = useState(false);
  const [colorDicingOpen, setColorDicingOpen] = useState(false);
  const [casesSearch, setCasesSearch] = useState("");
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
        const response = await apiFetch(
          `${API}/api/payments/nowpayments/minimums`
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
      return matchesQuery && matchesTag;
    });
    return [...filtered].sort((a, b) => {
      if (casesSort === "price-low") return Number(a.price || 0) - Number(b.price || 0);
      if (casesSort === "price-high") return Number(b.price || 0) - Number(a.price || 0);
      if (casesSort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      const af = a.featured === true || a.featured === 1 || a.featured === "true" ? 0 : 1;
      const bf = b.featured === true || b.featured === 1 || b.featured === "true" ? 0 : 1;
      return af - bf || Number(a.featured_order || 999999) - Number(b.featured_order || 999999) || Number(a.id || 0) - Number(b.id || 0);
    });
  }, [decoratedCases, casesSearch, casesTagFilter, casesSort]);

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

      setSelected({
        ...c,
        ...(data.case || {}),
        image_url: data.case?.image_url || c.image_url || c.imageUrl || "",
        items: rewards,
      });
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
    ? await apiFetch(
        `${API}/api/me/wallet/deposit-address?payCurrency=${encodeURIComponent(
          depositCurrency
        )}`
      )
    : await apiFetch(
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
      setBrainrotDeposit({ ...(data.deposit || {}), discordUrl: data.discordUrl || "https://discord.gg/7hsugeanWk" });
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

  const openColorDicing = () => {
    if (opening) return;
    if (selected) closeCasePage();
    if (casesPageOpen) closeCasesPage();
    setProfileOpen(false);
    setColorDicingOpen(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const closeColorDicing = () => {
    setColorDicingOpen(false);
  };

  const openCasesPage = () => {
    setColorDicingOpen(false);
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
    setSelected(null);
    setResult(null);
    setWonInventoryId(null);
    setReelItems([]);
    setReelWinningReward(null);
    setReelTarget(null);
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
          .color-dicing-quick-bets{
            display:grid;
            grid-template-columns:repeat(5,1fr);
            gap:5px;
            margin-top:8px;
          }
          .color-dicing-quick-bets button{
            min-height:31px;
            border:1px solid rgba(255,255,255,.07);
            border-radius:7px;
            background:rgba(255,255,255,.025);
            color:#8f899b;
            font-size:9px;
            font-weight:800;
            cursor:pointer;
          }
          .color-dicing-quick-bets button:hover{
            color:#fff;
            border-color:rgba(176,132,255,.30);
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
      <header className="nav">
        <div className="brand">
          <div className="brand-mark">
            ✦
          </div>

          <span>
            CASE<span>X</span>
          </span>
        </div>

        <nav>
          <button
            type="button"
            className="nav-link-button"
            onClick={() => {
              if (opening) return;
              if (colorDicingOpen) closeColorDicing();

              if (colorDicingOpen) {
                closeColorDicing();
              }

              if (casesPageOpen) {
                closeCasesPage();
              }

              if (selected) {
                closeCasePage();
              }

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
            className="nav-link-button"
            onClick={() => {
              if (opening) return;
              if (colorDicingOpen) closeColorDicing();

              if (casesPageOpen) {
                closeCasesPage();
              }

              if (selected) {
                closeCasePage();
              }

              requestAnimationFrame(() => {
                document
                  .getElementById("jackpot")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              });
            }}
          >
            Jackpot
          </button>

          <button
            type="button"
            className="nav-link-button color-dicing-nav-link"
            onClick={openColorDicing}
          >
            Color Dicing
          </button>

          <button
            type="button"
            className="nav-link-button"
            onClick={() => {
              if (opening) return;
              if (colorDicingOpen) closeColorDicing();

              if (casesPageOpen) {
                closeCasesPage();
              }

              if (selected) {
                closeCasePage();
              }

              requestAnimationFrame(() => {
                document
                  .getElementById("cases")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              });
            }}
          >
            Cases
          </button>

          <button
            type="button"
            className="nav-link-button"
            onClick={() => {
              if (opening) return;
              if (colorDicingOpen) closeColorDicing();
              if (casesPageOpen) closeCasesPage();
              if (selected) closeCasePage();
              requestAnimationFrame(() => {
                document
                  .getElementById("inventory")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
          >
            Inventory
          </button>

          <button
            type="button"
            className="nav-link-button"
            onClick={() => {
              if (opening) return;
              if (colorDicingOpen) closeColorDicing();
              if (casesPageOpen) closeCasesPage();
              if (selected) closeCasePage();
              requestAnimationFrame(() => {
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
          >
            How it works
          </button>

          <button
            type="button"
            className="nav-link-button"
            onClick={() => {
              if (opening) return;
              if (colorDicingOpen) closeColorDicing();
              if (casesPageOpen) closeCasesPage();
              if (selected) closeCasePage();
              requestAnimationFrame(() => {
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
          >
            FAQ
          </button>
        </nav>

<div className="nav-actions">
  <a
  href="https://discord.gg/7hsugeanWk"
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

      {colorDicingOpen && (
        <div className="color-dicing-page-wrap">
          <button
            type="button"
            className="color-dicing-back"
            onClick={closeColorDicing}
          >
            ← Back to CASEX
          </button>

          <ColorDicingGame
            authUser={authUser}
            openAuth={openAuth}
            onBalanceChange={setBalance}
          />
        </div>
      )}

      <main id="home" style={{ display: colorDicingOpen ? "none" : undefined }}>
        <section className="hero">
          <div className="hero-glow"></div>

          <div className="hero-copy">
            <div className="eyebrow">
              ⚡ THE NEXT GENERATION CASE PLATFORM
            </div>

            <h1>
              Open cases.
              <br />
              <span>Chase the rare.</span>
            </h1>

            <p>
              Pick a case, reveal a random reward,
              and build your collection. Fast, simple
              and transparent.
            </p>

            <a
              className="primary hero-cta"
              href="#cases"
            >
              <span>Explore Cases</span>
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
          </div>
        </section>

        {/* =========================================================
           DAILY JACKPOT — LIVE
           ========================================================= */}
        <section id="jackpot" className="section jackpot-live-section">
          <style>{`
            .jackpot-live-section{
              padding:36px 0 54px;
            }
            .jackpot-live-shell{
              max-width:1120px;
              margin:0 auto;
              border:1px solid rgba(126,82,190,.42);
              border-radius:24px;
              overflow:hidden;
              background:
                radial-gradient(circle at 78% 0%, rgba(144,91,255,.16), transparent 34%),
                linear-gradient(135deg,#101019,#08090f 74%);
              box-shadow:0 24px 90px rgba(39,16,70,.26), inset 0 1px 0 rgba(255,255,255,.035);
            }
            .jackpot-live-header{
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:24px;
              padding:28px 30px 24px;
              border-bottom:1px solid rgba(255,255,255,.055);
            }
            .jackpot-live-kicker{
              display:flex;
              align-items:center;
              gap:8px;
              color:#9e7bcd;
              font-size:9px;
              font-weight:900;
              letter-spacing:.14em;
            }
            .jackpot-live-dot{
              width:7px;
              height:7px;
              border-radius:50%;
              background:#7de4ad;
              box-shadow:0 0 14px rgba(125,228,173,.75);
            }
            .jackpot-live-title{
              margin:10px 0 6px;
              color:#f6f2fb;
              font-size:38px;
              line-height:1;
              letter-spacing:-.04em;
            }
            .jackpot-live-subtitle{
              margin:0;
              max-width:720px;
              color:#858896;
              font-size:12px;
              font-weight:600;
              line-height:1.55;
            }
            .jackpot-live-countdown{
              min-width:210px;
              padding:14px 16px;
              border:1px solid rgba(134,91,188,.45);
              border-radius:14px;
              background:rgba(23,16,34,.72);
              text-align:right;
            }
            .jackpot-live-countdown small{
              display:block;
              color:#747684;
              font-size:8px;
              font-weight:900;
              letter-spacing:.13em;
            }
            .jackpot-live-countdown strong{
              display:block;
              margin-top:7px;
              color:#c5a0ff;
              font-size:21px;
              letter-spacing:.02em;
            }
            .jackpot-live-main{
              display:grid;
              grid-template-columns:278px minmax(0,1fr);
              min-height:525px;
            }
            .jackpot-live-sidebar{
              padding:22px 16px 22px 18px;
              border-right:1px solid rgba(255,255,255,.055);
              background:rgba(6,7,12,.42);
            }
            .jackpot-live-sidebar-head{
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:12px;
              margin-bottom:14px;
            }
            .jackpot-live-sidebar-head strong{
              color:#f3eef9;
              font-size:12px;
              letter-spacing:.06em;
            }
            .jackpot-live-sidebar-head span{
              color:#6f7180;
              font-size:9px;
              font-weight:800;
            }
            .jackpot-live-player-list{
              display:flex;
              flex-direction:column;
              gap:8px;
              max-height:470px;
              overflow:auto;
              padding-right:3px;
            }
            .jackpot-live-player{
              display:grid;
              grid-template-columns:34px minmax(0,1fr) auto;
              align-items:center;
              gap:10px;
              padding:10px 10px;
              border:1px solid rgba(255,255,255,.05);
              border-radius:12px;
              background:rgba(23,25,35,.7);
            }
            .jackpot-live-player.me{
              border-color:rgba(164,117,239,.48);
              background:linear-gradient(135deg,rgba(86,49,126,.32),rgba(22,23,32,.76));
              box-shadow:inset 0 0 0 1px rgba(184,143,255,.05);
            }
            .jackpot-live-avatar{
              width:34px;
              height:34px;
              display:grid;
              place-items:center;
              border-radius:10px;
              background:linear-gradient(145deg,#8251dc,#302041);
              color:#fff;
              font-size:13px;
              font-weight:900;
            }
            .jackpot-live-player-copy{
              min-width:0;
            }
            .jackpot-live-player-copy strong{
              display:block;
              overflow:hidden;
              color:#ece8f3;
              font-size:11px;
              font-weight:800;
              text-overflow:ellipsis;
              white-space:nowrap;
            }
            .jackpot-live-player-copy span{
              display:block;
              margin-top:3px;
              color:#696d7a;
              font-size:8px;
              font-weight:800;
            }
            .jackpot-live-player-odds{
              text-align:right;
            }
            .jackpot-live-player-odds strong{
              display:block;
              color:#8fe28f;
              font-size:11px;
              font-weight:900;
            }
            .jackpot-live-player-odds span{
              display:block;
              margin-top:3px;
              color:#737684;
              font-size:8px;
              font-weight:800;
            }
            .jackpot-live-stage{
              min-width:0;
              position:relative;
              display:flex;
              flex-direction:column;
              align-items:center;
              justify-content:center;
              padding:24px 28px 26px;
              overflow:hidden;
            }
            .jackpot-live-stage:before{
              content:"";
              position:absolute;
              inset:0;
              background:
                radial-gradient(circle at 50% 48%,rgba(140,85,255,.12),transparent 26%),
                radial-gradient(circle at 50% 100%,rgba(86,46,140,.13),transparent 42%);
              pointer-events:none;
            }
            .jackpot-live-pot-label{
              position:relative;
              z-index:2;
              color:#7e7f8d;
              font-size:9px;
              font-weight:900;
              letter-spacing:.16em;
            }
            .jackpot-live-pot{
              position:relative;
              z-index:2;
              margin-top:5px;
              color:#f3c85b;
              font-size:40px;
              line-height:1;
              font-weight:950;
              letter-spacing:-.045em;
              text-shadow:0 0 24px rgba(243,200,91,.16);
            }
            .jackpot-live-wheel-wrap{
              position:relative;
              z-index:2;
              width:min(100%,500px);
              height:auto;
              min-height:410px;
              margin-top:16px;
              display:flex;
              align-items:center;
              justify-content:center;
              overflow:visible;
            }
            .jackpot-live-pointer{
              position:absolute;
              z-index:8;
              top:14px;
              left:50%;
              width:0;
              height:0;
              transform:translateX(-50%);
              border-left:12px solid transparent;
              border-right:12px solid transparent;
              border-top:25px solid #f3cb63;
              filter:drop-shadow(0 0 10px rgba(243,203,99,.42));
            }
            .jackpot-wheel-modern{
              position:relative;
              width:min(100%,460px);
              aspect-ratio:1/1;
              display:grid;
              place-items:center;
              isolation:isolate;
              filter:drop-shadow(0 28px 42px rgba(0,0,0,.38));
            }
            .jackpot-wheel-modern:before{
              content:"";
              position:absolute;
              inset:7%;
              border-radius:50%;
              border:1px solid rgba(211,186,255,.12);
              box-shadow:
                0 0 0 1px rgba(122,77,184,.08),
                0 0 42px rgba(126,72,220,.13),
                inset 0 0 34px rgba(0,0,0,.35);
              pointer-events:none;
              z-index:1;
            }
            .jackpot-wheel-modern-glow{
              position:absolute;
              width:84%;
              height:84%;
              border-radius:50%;
              background:
                radial-gradient(circle,rgba(150,91,255,.24),transparent 51%),
                radial-gradient(circle,rgba(103,72,184,.12),transparent 72%);
              filter:blur(30px);
              pointer-events:none;
            }
            .jackpot-wheel-modern-svg{
              position:relative;
              z-index:3;
              width:100%;
              height:100%;
              overflow:visible;
            }
            .jackpot-wheel-modern.empty .jackpot-wheel-modern-svg{
              opacity:.88;
            }
            .jackpot-live-wheel-label{
              display:none;
            }
            .jackpot-live-actions{
              position:relative;
              z-index:3;
              display:grid;
              grid-template-columns:1.15fr 1fr;
              gap:10px;
              width:min(100%,540px);
              margin-top:14px;
            }
            .jackpot-live-action{
              min-height:50px;
              border:1px solid rgba(155,111,216,.50);
              border-radius:13px;
              background:linear-gradient(100deg,#3a234f,#21172e);
              color:#eee9f5;
              font-size:12px;
              font-weight:900;
              cursor:pointer;
              transition:transform .16s ease,filter .16s ease,border-color .16s ease;
            }
            .jackpot-live-action.primary{
              border-color:#a57aef;
              background:linear-gradient(100deg,#7543d8,#a36dfc);
              box-shadow:0 14px 34px rgba(121,72,220,.24);
            }
            .jackpot-live-action:hover{
              transform:translateY(-1px);
              filter:brightness(1.06);
            }
            .jackpot-live-my{
              position:relative;
              z-index:3;
              margin-top:12px;
              color:#777985;
              font-size:9px;
              font-weight:800;
              text-align:center;
            }
            .jackpot-live-my b{
              color:#b895ef;
            }
            .jackpot-live-empty{
              padding:30px 12px;
              text-align:center;
              color:#6e7180;
              font-size:10px;
              font-weight:700;
            }
            .jackpot-live-entry-backdrop{
              position:fixed;
              inset:0;
              z-index:2200;
              display:flex;
              align-items:center;
              justify-content:center;
              padding:20px;
              background:rgba(4,5,9,.76);
              backdrop-filter:blur(10px);
            }
            .jackpot-live-entry-modal{
              position:relative;
              width:min(100%,540px);
              max-height:min(86vh,760px);
              overflow:auto;
              padding:26px;
              border:1px solid rgba(151,104,221,.5);
              border-radius:20px;
              background:linear-gradient(145deg,#171320,#090a10);
              box-shadow:0 30px 100px rgba(0,0,0,.55);
            }
            .jackpot-live-entry-close{
              position:absolute;
              top:14px;
              right:16px;
              width:34px;
              height:34px;
              border:1px solid rgba(255,255,255,.09);
              border-radius:10px;
              background:rgba(255,255,255,.025);
              color:#8b8c99;
              font-size:20px;
              cursor:pointer;
            }
            .jackpot-live-entry-close:hover{
              color:#fff;
              background:rgba(255,255,255,.06);
            }
            .jackpot-live-entry-modal h2{
              margin:8px 0 7px;
              color:#f5f1fa;
              font-size:28px;
            }
            .jackpot-live-entry-modal>p{
              margin:0;
              color:#828592;
              font-size:11px;
              line-height:1.55;
            }
            .jackpot-live-mode{
              display:grid;
              grid-template-columns:1.15fr 1fr;
              gap:8px;
              margin:20px 0 16px;
            }
            .jackpot-live-mode button{
              min-height:44px;
              border:1px solid rgba(255,255,255,.08);
              border-radius:11px;
              background:#11131b;
              color:#848795;
              font-size:10px;
              font-weight:900;
              cursor:pointer;
            }
            .jackpot-live-mode button.active{
              border-color:rgba(161,119,235,.6);
              background:rgba(108,68,158,.2);
              color:#d4b8ff;
            }
            .jackpot-live-field{
              display:block;
              margin-top:8px;
            }
            .jackpot-live-field span{
              display:block;
              margin-bottom:7px;
              color:#838592;
              font-size:9px;
              font-weight:900;
              letter-spacing:.08em;
            }
            .jackpot-live-field input{
              width:100%;
              height:48px;
              border:1px solid rgba(255,255,255,.09);
              border-radius:11px;
              padding:0 13px;
              background:#0d0f16;
              color:#f4f2f7;
              font-size:15px;
              font-weight:800;
              outline:none;
            }
            .jackpot-live-field input:focus{
              border-color:rgba(162,120,234,.65);
              box-shadow:0 0 0 3px rgba(142,90,229,.12);
            }
            .jackpot-live-selection-head{
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:10px;
              margin:12px 0 9px;
            }
            .jackpot-live-selection-head strong{
              color:#ebe7f2;
              font-size:10px;
            }
            .jackpot-live-selection-head span{
              color:#b895ef;
              font-size:10px;
              font-weight:900;
            }
            .jackpot-live-brainrot-list{
              display:grid;
              grid-template-columns:1.15fr 1fr;
              gap:8px;
              max-height:360px;
              overflow:auto;
            }
            .jackpot-live-brainrot{
              display:flex;
              align-items:center;
              gap:9px;
              padding:8px;
              border:1px solid rgba(255,255,255,.07);
              border-radius:11px;
              background:#10121a;
              cursor:pointer;
              text-align:left;
            }
            .jackpot-live-brainrot.selected{
              border-color:rgba(159,115,231,.62);
              background:rgba(88,52,134,.22);
            }
            .jackpot-live-brainrot-art{
              width:42px;
              height:42px;
              flex:0 0 42px;
              display:grid;
              place-items:center;
              border-radius:9px;
              border:1px solid rgba(255,255,255,.06);
              background:#0a0c12;
              overflow:hidden;
            }
            .jackpot-live-brainrot-copy{
              min-width:0;
            }
            .jackpot-live-brainrot-copy strong{
              display:block;
              overflow:hidden;
              color:#eeebf4;
              font-size:9px;
              font-weight:800;
              text-overflow:ellipsis;
              white-space:nowrap;
            }
            .jackpot-live-brainrot-copy span{
              display:block;
              margin-top:3px;
              color:#8fe28f;
              font-size:8px;
              font-weight:900;
            }
            .jackpot-live-error{
              margin-top:12px;
              padding:10px 11px;
              border:1px solid rgba(239,108,108,.26);
              border-radius:10px;
              background:rgba(130,32,38,.14);
              color:#ffaaa9;
              font-size:9px;
              font-weight:800;
            }
            .jackpot-live-submit{
              width:100%;
              min-height:50px;
              margin-top:14px;
              border:1px solid #aa7bf6;
              border-radius:11px;
              background:linear-gradient(100deg,#7442d6,#a36dfc);
              color:#fff;
              font-size:11px;
              font-weight:900;
              cursor:pointer;
            }
            .jackpot-live-submit:disabled{
              opacity:.55;
              cursor:not-allowed;
            }
            @media(max-width:900px){
              .jackpot-live-main{
                grid-template-columns:1fr;
              }
              .jackpot-live-sidebar{
                border-right:0;
                border-bottom:1px solid rgba(255,255,255,.055);
              }
              .jackpot-live-player-list{
                display:grid;
                grid-template-columns:1.15fr 1fr;
                max-height:280px;
              }
              .jackpot-live-stage{
                min-height:560px;
              }
            }
            @media(max-width:650px){
              .jackpot-live-header{
                flex-direction:column;
                align-items:flex-start;
                padding:22px 18px;
              }
              .jackpot-live-countdown{
                width:100%;
                min-width:0;
                text-align:left;
              }
              .jackpot-live-title{
                font-size:30px;
              }
              .jackpot-live-stage{
                padding:22px 14px 26px;
              }
              .jackpot-live-pot{
                font-size:34px;
              }
              .jackpot-live-wheel-wrap{
                min-height:320px;
              }
              .jackpot-wheel-modern{
                width:min(100%,380px);
              }
              .jackpot-live-actions{
                grid-template-columns:1fr;
                width:100%;
              }
              .jackpot-live-brainrot-list,
              .jackpot-live-player-list{
                grid-template-columns:1fr;
              }
            }
          `}</style>

          <div className="jackpot-live-shell">
            <div className="jackpot-live-header">
              <div>
                <div className="jackpot-live-kicker">
                  <i className="jackpot-live-dot"></i>
                  LIVE DAILY JACKPOT
                </div>
                <h2 className="jackpot-live-title">Daily Jackpot</h2>
                <p className="jackpot-live-subtitle">
                  Contribute from your CASEX balance or enter with Brainrots
                  from your inventory. Your share of the pot determines your odds.
                </p>
              </div>

              <div className="jackpot-live-countdown">
                <small>DRAW ENDS IN</small>
                <strong>
                  {jackpotData
                    ? `${String(jackpotTimeLeft.days).padStart(2, "0")}d ${String(
                        jackpotTimeLeft.hours
                      ).padStart(2, "0")}h ${String(
                        jackpotTimeLeft.minutes
                      ).padStart(2, "0")}m ${String(
                        jackpotTimeLeft.seconds
                      ).padStart(2, "0")}s`
                    : "Loading..."}
                </strong>
              </div>
            </div>

            <div className="jackpot-live-main">
              <aside className="jackpot-live-sidebar">
                <div className="jackpot-live-sidebar-head">
                  <strong>PLAYERS</strong>
                  <span>
                    {jackpotPlayers.length}{" "}
                    {jackpotPlayers.length === 1 ? "player" : "players"}
                  </span>
                </div>

                <div className="jackpot-live-player-list">
                  {jackpotLoading && !jackpotPlayers.length ? (
                    <div className="jackpot-live-empty">
                      Loading live players...
                    </div>
                  ) : jackpotPlayers.length ? (
                    jackpotPlayers.map((player) => {
                      const username = String(
                        player.username || "Player"
                      );
                      const isMe =
                        Number(player.userId) === Number(authUser?.id);

                      return (
                        <div
                          key={player.userId}
                          className={`jackpot-live-player ${
                            isMe ? "me" : ""
                          }`}
                        >
                          <div className="jackpot-live-avatar">
                            {username.charAt(0).toUpperCase()}
                          </div>

                          <div className="jackpot-live-player-copy">
                            <strong>{username}</strong>
                            <span>
                              ${(
                                Number(player.contributionCents || 0) /
                                100
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="jackpot-live-player-odds">
                            <strong>
                              {Number(player.odds || 0).toFixed(2)}%
                            </strong>
                            <span>
                              {Number(player.contributionCount || 0)}{" "}
                              {Number(player.contributionCount || 0) === 1
                                ? "entry"
                                : "entries"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="jackpot-live-empty">
                      No entries yet. Be the first player.
                    </div>
                  )}
                </div>
              </aside>

              <div className="jackpot-live-stage">
                <div className="jackpot-live-pot-label">
                  JACKPOT VALUE
                </div>

                <div className="jackpot-live-pot">
                  ${(jackpotPotCents / 100).toFixed(2)}
                </div>

                <div className="jackpot-live-wheel-wrap" aria-label="Jackpot wheel">
                  <div className="jackpot-live-pointer"></div>

                  <JackpotWheel
                    players={jackpotPlayers}
                    totalCents={jackpotPotCents}
                  />
                </div>

                <div className="jackpot-live-actions">
                  <button
                    type="button"
                    className="jackpot-live-action primary"
                    onClick={() => openJackpotEntry("balance")}
                  >
                    💰 Enter with CASEX balance
                  </button>

                  <button
                    type="button"
                    className="jackpot-live-action"
                    onClick={() => openJackpotEntry("brainrots")}
                  >
                    ◇ Enter with Brainrots
                  </button>
                </div>

                <div className="jackpot-live-my">
                  {authUser ? (
                    <>
                      Your contribution:{" "}
                      <b>${(jackpotMyContributionCents / 100).toFixed(2)}</b>
                      {" · "}
                      Your odds:{" "}
                      <b>{jackpotMyOdds.toFixed(2)}%</b>
                    </>
                  ) : (
                    <>
                      Sign in to enter the jackpot. Minimum contribution is{" "}
                      <b>$0.10</b>.
                    </>
                  )}
                </div>
              </div>
            </div>
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
                {liveActivity.slice(0, 6).map((item, index) => (
                  <div
                    className={`recent-win ${rarityClass(item.rarity)}${
                      liveActivityEnteringId === item.id ? " live-activity-entering" : ""
                    }`}
                    key={`${item.id}-${item.userId}-${index}`}
                  >
                    <span className="recent-win-icon">
                      <ItemArt rarity={item.rarity} imageUrl={item.image_url || item.imageUrl} compact />
                    </span>

                    <div>
                      <strong>
                        {item.username || "Player"} won {item.itemName}
                      </strong>

                      <small>
                        {item.rarity} · {item.caseName}

                      </small>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                      {liveActivityEnteringId === item.id && (
                        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: "#ffffff", background: "#a57cff", borderRadius: 999, padding: "3px 7px", boxShadow: "0 0 18px rgba(165,124,255,.35)" }}>NEW</span>
                      )}
                      <b>
                        ${(Number(item.valueCents || 0) / 100).toFixed(2)}
                      </b>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="live-activity-empty">
                No case openings have been recorded yet. Be the first to win.
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
      </main>

      <footer>
        <div className="brand">
          <div className="brand-mark">
            ✦
          </div>

          <span>
            CASE<span>X</span>
          </span>
        </div>

        <p>
          Demo interface — replace branding,
          assets, odds and legal copy before
          launch.
        </p>
      </footer>

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
      "https://discord.gg/7hsugeanWk",
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

            <div className="wallet-premium-header">
              <div>
                <div className="eyebrow">
                  WALLET
                </div>
                <h2>Manage your money</h2>
                <p>
                  Your balance, wallet activity and account funds in one place.
                </p>
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
                    <button type="button" className="primary" onClick={() => window.open(brainrotDeposit.discordUrl || "https://discord.gg/7hsugeanWk", "_blank", "noopener,noreferrer")}>Open Discord</button>
                  </div>
                  <button type="button" className="secondary-button brainrot-deposit-done" onClick={closeBrainrotDeposit}>Done</button>
                </div>
              </div>
            )}

            {walletTab !== "history" ? (
              <>
                {walletAction === "deposit" && cryptoPayment ? (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 18,
                      padding: 18,
                      background: "rgba(255,255,255,0.025)",
                    }}
                  >
                    <div className="eyebrow">CRYPTO DEPOSIT</div>
                    <h3 style={{ margin: "6px 0 4px" }}>Send your payment</h3>
<p style={{ margin: "0 0 14px", opacity: 0.72, lineHeight: 1.5 }}>
  Send any amount you want to this address. Your balance will be credited with the amount received.
</p>
                    <div className="wallet-qr-frame" style={{ display: "grid", placeItems: "center", padding: 14, borderRadius: 14, background: "#fff", width: "fit-content", margin: "0 auto 14px" }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(cryptoPayment.payAddress || "")}`}
                        alt="Crypto deposit QR code"
                        width="220"
                        height="220"
                        style={{ display: "block" }}
                      />
                    </div>
<div style={{ marginBottom: 12 }}>
  <small style={{ opacity: 0.62 }}>MINIMUM DEPOSIT</small>
  <strong style={{ display: "block", marginTop: 3, fontSize: 22 }}>
    ${Number(cryptoPayment.minimumUsd || 0).toFixed(2)} USD
  </strong>
</div>

<div className="wallet-crypto-network-warning" role="alert">
  <span className="wallet-crypto-network-warning-icon">!</span>

  <div>
    <strong>
      Send {String(cryptoPayment.payCurrency || "crypto").toUpperCase()} only
    </strong>

    <p>
      Only send {String(cryptoPayment.payCurrency || "the selected coin").toUpperCase()} on the{" "}
      {cryptoPayment.network || "selected network"} network to this address.
      Sending another asset or using another network may result in permanent loss.
    </p>
  </div>
</div>

                    <div style={{ marginBottom: 12 }}>
                      <small style={{ opacity: 0.62 }}>DEPOSIT ADDRESS</small>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, padding: "10px 11px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <code style={{ flex: 1, overflowWrap: "anywhere", fontSize: 12 }}>
                          {truncateAddress(cryptoPayment.payAddress, 34)}
                        </code>
                        <button type="button" className="secondary" onClick={copyCryptoAddress}>Copy</button>
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: cryptoPayment.status === "completed" ? "rgba(60, 220, 150, 0.10)" : cryptoPayment.status === "failed" || cryptoPayment.status === "expired" ? "rgba(255, 80, 100, 0.10)" : "rgba(140, 100, 255, 0.10)" }}>
                      <strong>
                        {cryptoPayment.status === "completed" ? "Payment confirmed" : cryptoPayment.status === "failed" ? "Payment failed" : cryptoPayment.status === "expired" ? "Payment expired" : "Waiting for payment…"}
                      </strong>
                    </div>
                    <button type="button" className="primary wide" style={{ marginTop: 12 }} onClick={closeCryptoPayment}>
                      {cryptoPayment.status === "completed" ? "Done" : "Close"}
                    </button>
                  </div>
                ) : (
                  <>
                    {walletAction === "deposit" && (
                      <label className="wallet-input-wrap wallet-input-premium" style={{ marginBottom: 12 }}>
                        <span>Crypto network</span>
                        <div>
                          <select value={depositCurrency} onChange={(event) => setDepositCurrency(event.target.value)} disabled={walletLoading} style={{ width: "100%", background: "transparent", border: 0, outline: 0, color: "inherit", font: "inherit", cursor: walletLoading ? "not-allowed" : "pointer" }}>
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

                    {walletTab === "wallet" && (
                      <div className="brainrot-deposit-card">
                        <div className="brainrot-deposit-card-icon">◇</div>
                        <div className="brainrot-deposit-card-copy">
                          <strong>Deposit Brainrots</strong>
                          <span>Send your Brainrots through Discord and receive CASEX balance after manual verification.</span>
                        </div>
                        <button type="button" className="secondary-button" onClick={createBrainrotDeposit} disabled={brainrotDepositLoading}>
                          {brainrotDepositLoading ? "Creating..." : "Deposit Brainrots"}
                        </button>
                      </div>
                    )}

                    <div className="wallet-action-note">
                      <span className="wallet-note-icon">i</span>
                      <p>{walletTab === "withdraw" ? "Withdrawals will use your available wallet balance." : "Your balance is credited only after NOWPayments confirms the transaction."}</p>
                    </div>
                  </>
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

      {selected && (
        <div
          className={`case-page ${
            opening
              ? "case-page-opening"
              : ""
          }`}
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

      {jackpotEntryOpen && authUser && (
        <div
          className="jackpot-live-entry-backdrop"
          onClick={() => !jackpotEntryLoading && closeJackpotEntry()}
        >
          <div
            className="jackpot-live-entry-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="jackpot-live-entry-close"
              onClick={closeJackpotEntry}
              disabled={jackpotEntryLoading}
              aria-label="Close jackpot entry"
            >
              ×
            </button>

            <div className="eyebrow">DAILY JACKPOT</div>
            <h2>Enter the jackpot</h2>
            <p>
              Add any amount from $0.10 with no maximum, or contribute
              Brainrots directly from your inventory.
            </p>

            <div className="jackpot-live-mode">
              <button
                type="button"
                className={jackpotEntryMode === "balance" ? "active" : ""}
                onClick={() => {
                  if (jackpotEntryLoading) return;
                  setJackpotEntryMode("balance");
                  setJackpotEntryError("");
                  setJackpotSelectedInventoryIds(new Set());
                }}
              >
                💰 CASEX Balance
              </button>

              <button
                type="button"
                className={jackpotEntryMode === "brainrots" ? "active" : ""}
                onClick={() => {
                  if (jackpotEntryLoading) return;
                  setJackpotEntryMode("brainrots");
                  setJackpotEntryError("");
                  setJackpotAmount("");
                }}
              >
                ◇ Brainrots
              </button>
            </div>

            {jackpotEntryMode === "balance" ? (
              <>
                <label className="jackpot-live-field">
                  <span>CONTRIBUTION AMOUNT · MINIMUM $0.10 · NO MAXIMUM</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.10"
                    step="0.01"
                    value={jackpotAmount}
                    onChange={(event) => {
                      setJackpotAmount(event.target.value);
                      setJackpotEntryError("");
                    }}
                    placeholder="25.00"
                    disabled={jackpotEntryLoading}
                  />
                </label>

                <button
                  type="button"
                  className="jackpot-live-submit"
                  onClick={enterJackpotWithBalance}
                  disabled={jackpotEntryLoading}
                >
                  {jackpotEntryLoading ? "Entering..." : "Enter Jackpot"}
                </button>
              </>
            ) : (
              <>
                <div className="jackpot-live-selection-head">
                  <strong>Select Brainrots</strong>
                  <span>
                    ${(jackpotSelectedValueCents / 100).toFixed(2)}
                  </span>
                </div>

                <div className="jackpot-live-brainrot-list">
                  {jackpotAvailableInventory.length === 0 ? (
                    <div className="jackpot-live-empty">
                      You have no available Brainrots in your inventory.
                    </div>
                  ) : (
                    jackpotAvailableInventory.map((item) => {
                      const selectedItem = jackpotSelectedInventoryIds.has(
                        Number(item.id)
                      );

                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`jackpot-live-brainrot ${
                            selectedItem ? "selected" : ""
                          }`}
                          onClick={() =>
                            toggleJackpotInventoryItem(item.id)
                          }
                          disabled={jackpotEntryLoading}
                        >
                          <span className="jackpot-live-brainrot-art">
                            <ItemArt
                              rarity={item.rarity}
                              imageUrl={item.image_url || item.imageUrl}
                              compact
                            />
                          </span>

                          <span className="jackpot-live-brainrot-copy">
                            <strong>{item.name || "Brainrot"}</strong>
                            <span>
                              ${(Number(item.value_cents || 0) / 100).toFixed(2)}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  className="jackpot-live-submit"
                  onClick={enterJackpotWithBrainrots}
                  disabled={
                    jackpotEntryLoading ||
                    !jackpotSelectedInventoryIds.size
                  }
                >
                  {jackpotEntryLoading
                    ? "Adding Brainrots..."
                    : `Enter with $${(
                        jackpotSelectedValueCents /
                        100
                      ).toFixed(2)} in Brainrots`}
                </button>
              </>
            )}

            {jackpotEntryError && (
              <div className="jackpot-live-error">
                {jackpotEntryError}
              </div>
            )}
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