import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const apiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });


function SmartItemImage({ src, alt = "", className = "" }) {
  const resolved = String(src || "").trim();

  return (
    <img
      className={className}
      src={resolved}
      alt={alt}
      draggable="false"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
      style={{
        objectFit: "contain",
        objectPosition: "center",
        display: "block",
      }}
    />
  );
}


const FALLBACK_GAMES = [
  {
    slug: "steal-a-brainrot",
    name: "Steal a Brainrot",
    shortName: "Brainrot",
    theme: "purple",
    description: "Brainrots · Marketplace · Cases · Trading",
    logoUrl: null,
  },
  {
    slug: "donutsmp",
    name: "DonutSMP",
    shortName: "DonutSMP",
    theme: "blue",
    description: "Items · Spawners · Gear · Marketplace · Cases",
    logoUrl: "/donutsmp-logo.png",
  },
];

function money(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

const rarityClass = (rarity) => String(rarity || "Common").toLowerCase();

function ItemArt({ rarity = "Common", imageUrl = "", compact = false }) {
  const resolved = String(imageUrl || "").trim();
  const className = `item-art-svg${compact ? " compact" : ""} item-art-image`;

  if (resolved) {
    return (
      <img
        className={className}
        src={resolved}
        alt=""
        aria-hidden="true"
        draggable="false"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
        style={{ objectFit: "contain", display: "block" }}
      />
    );
  }

  return (
    <span
      className={`item-art-fallback rarity-${rarityClass(rarity)}`}
      aria-hidden="true"
    >
      ◆
    </span>
  );
}

function GameLogo({ game, size = "medium" }) {
  const forcedLogo = game?.slug === "steal-a-brainrot" ? "/game-steal-a-brainrot-logo.png" : null;
  const logoUrl = forcedLogo || game?.logoUrl;

  if (logoUrl) {
    return (
      <img
        className={`game-portal-logo game-portal-logo-${size} ${game?.slug === "steal-a-brainrot" ? "game-portal-logo-brainrot" : ""}`}
        src={logoUrl}
        alt={`${game?.name || "Game"} logo`}
        draggable="false"
      />
    );
  }

  return (
    <div
      className={`game-portal-logo game-portal-logo-${size} brainrot-logo`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 82 82" focusable="false">
        <defs>
          <linearGradient id="sabLogoBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b083ff" />
            <stop offset="55%" stopColor="#7d4ded" />
            <stop offset="100%" stopColor="#5730bf" />
          </linearGradient>
          <linearGradient id="sabLogoFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d9d5ff" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="79" height="79" rx="20" fill="url(#sabLogoBg)" />
        <path d="M23 34c0-7 5.5-12 12.5-12h11C53.5 22 59 27 59 34v16c0 6.5-5.5 10-12 10H35c-6.5 0-12-3.5-12-10V34Z" fill="url(#sabLogoFace)" opacity=".98" />
        <rect x="28" y="37" width="8" height="9" rx="3" fill="#17131f" />
        <rect x="46" y="37" width="8" height="9" rx="3" fill="#17131f" />
        <path d="M31 51c4 4 16 4 20 0" fill="none" stroke="#17131f" strokeWidth="4" strokeLinecap="round" />
        <path d="M18 29c2-7 8-13 15-15" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".2" />
      </svg>
    </div>
  );
}

function GameHubCard({ game, active, onSelect }) {
  const comingSoon = game.slug === "donutsmp";

  return (
    <button
      type="button"
      className={`game-hub-card ${game.theme === "blue" ? "blue" : "purple"} ${active ? "selected" : ""} ${comingSoon ? "game-hub-card-coming-soon" : ""}`}
      onClick={() => {
        if (comingSoon) return;
        onSelect(game.slug);
      }}
      disabled={comingSoon}
      aria-disabled={comingSoon}
    >
      <div className="game-hub-card-glow" />
      {comingSoon && <div className="game-hub-card-coming-overlay" aria-hidden="true" />}
      <div className="game-hub-card-top">
        <div className={comingSoon ? "game-hub-card-coming-logo" : ""}>
          <GameLogo game={game} size="large" />
        </div>
        <span className="game-hub-card-arrow">{comingSoon ? "🔒" : "→"}</span>
      </div>
      <div className="game-hub-card-copy">
        <span className="game-portal-kicker">{comingSoon ? "COMING SOON" : "SUPPORTED GAME"}</span>
        <h3>{game.name}</h3>
        <p>{game.description}</p>
      </div>
      <div className="game-hub-card-footer">
        {comingSoon ? (
          <span className="game-hub-coming-badge">Coming Soon</span>
        ) : (
          <>
            <span>Marketplace</span>
            <span>Cases</span>
            <span>Inventory</span>
          </>
        )}
      </div>
    </button>
  );
}

export default function GamePortal({
  open,
  initialGame = null,
  initialTab = null,
  authUser,
  balance,
  inventory = [],
  onClose,
  onOpenCase,
  onRefreshInventory,
  onBalanceChange,
  openAuth,
}) {
  const [games, setGames] = useState(FALLBACK_GAMES);
  const [selectedSlug, setSelectedSlug] = useState(initialGame === "donutsmp" ? null : initialGame);
  const [tab, setTab] = useState("marketplace");
  const [marketplace, setMarketplace] = useState([]);
  const [gameCases, setGameCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState(null);
  const [purchaseConfirmItem, setPurchaseConfirmItem] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [cancellingWithdrawalId, setCancellingWithdrawalId] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [caseDetailsLoading, setCaseDetailsLoading] = useState(false);
  const [caseDetailsError, setCaseDetailsError] = useState("");
  const [caseOpening, setCaseOpening] = useState(false);
  const [caseOpeningReward, setCaseOpeningReward] = useState(null);
  const [caseOpeningError, setCaseOpeningError] = useState("");
  const [reelItems, setReelItems] = useState([]);
  const [reelWinningReward, setReelWinningReward] = useState(null);
  const [reelTarget, setReelTarget] = useState(null);
  const [reelAnimating, setReelAnimating] = useState(false);
  const [openingPhase, setOpeningPhase] = useState("rolling");
  const [wonInventoryId, setWonInventoryId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundTimerRef = useRef(null);
  const soundGestureRef = useRef(false);
  const audioContextRef = useRef(null);
  const audioMasterRef = useRef(null);
  const [portalInventory, setPortalInventory] = useState(inventory);
  const [brainrotDepositItems, setBrainrotDepositItems] = useState([]);
  const [brainrotDepositItemsLoading, setBrainrotDepositItemsLoading] = useState(false);
  const [brainrotDepositSearch, setBrainrotDepositSearch] = useState("");
  const [selectedBrainrotDepositItemId, setSelectedBrainrotDepositItemId] = useState(null);
  const reelTrackRef = useRef(null);
  const reelWindowRef = useRef(null);
  const portalScrollTopRef = useRef(0);

  const selectedGame = useMemo(
    () => games.find((game) => game.slug === selectedSlug) || null,
    [games, selectedSlug]
  );

  useEffect(() => {
    setPortalInventory(inventory);
  }, [inventory]);

  // Keep the underlying page from jumping while an inventory action
  // confirmation is open. The portal itself remains scrollable.
  useEffect(() => {
    if (!actionItem || !actionType) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [actionItem, actionType]);

  // Lock page scrolling whenever a case preview is active, and completely
  // lock ALL scrolling while the fullscreen case-opening/reveal experience
  // is active. The Case Preview itself remains the only scrollable area.
  useEffect(() => {
    const openingActive =
      Boolean(caseOpening) ||
      Boolean(caseOpeningReward) ||
      Boolean(caseOpeningError);

    const previewActive =
      Boolean(caseDetails) ||
      Boolean(caseDetailsLoading) ||
      Boolean(caseDetailsError);

    if (!openingActive && !previewActive) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const overlay = document.querySelector(".game-portal-overlay");

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverscrollBehavior: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      overlayOverflow: overlay?.style.overflow || "",
      overlayOverscrollBehavior: overlay?.style.overscrollBehavior || "",
      overlayTouchAction: overlay?.style.touchAction || "",
      overlayScrollTop: overlay?.scrollTop ?? 0,
    };

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    const preventDocumentScroll = (event) => {
      if (!openingActive) return;
      event.preventDefault();
    };

    const preventScrollKeys = (event) => {
      if (!openingActive) return;

      const blockedKeys = new Set([
        " ",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ]);

      if (blockedKeys.has(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", preventDocumentScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", preventDocumentScroll, { passive: false, capture: true });
    window.addEventListener("keydown", preventScrollKeys, { capture: true });

    if (openingActive) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    if (overlay) {
      overlay.style.overscrollBehavior = "contain";
      overlay.style.touchAction = "auto";

      if (openingActive) {
        overlay.style.overflow = "hidden";
        overlay.style.touchAction = "none";
        overlay.scrollTop = 0;
      } else {
        overlay.style.overflow = "auto";
      }
    }

    return () => {
      window.removeEventListener("wheel", preventDocumentScroll, { capture: true });
      window.removeEventListener("touchmove", preventDocumentScroll, { capture: true });
      window.removeEventListener("keydown", preventScrollKeys, { capture: true });

      html.style.overflow = previous.htmlOverflow;
      html.style.overscrollBehavior = previous.htmlOverscrollBehavior;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscrollBehavior;

      if (overlay) {
        overlay.style.overflow = previous.overlayOverflow;
        overlay.style.overscrollBehavior = previous.overlayOverscrollBehavior;
        overlay.style.touchAction = previous.overlayTouchAction;
      }
    };
  }, [
    caseDetails,
    caseDetailsLoading,
    caseDetailsError,
    caseOpening,
    caseOpeningReward,
    caseOpeningError,
  ]);

  const selectedInventory = useMemo(() => {
    const owned = portalInventory.filter(
      (item) => String(item.status || "owned").toLowerCase() === "owned"
    );

    if (!selectedSlug) return owned;

    return owned.filter(
      (item) => String(item.game_slug || "steal-a-brainrot") === selectedSlug
    );
  }, [portalInventory, selectedSlug]);

  useEffect(() => {
    if (!open || selectedSlug !== "steal-a-brainrot") {
      setBrainrotDepositItems([]);
      setBrainrotDepositSearch("");
      setSelectedBrainrotDepositItemId(null);
      return undefined;
    }

    let cancelled = false;

    const loadBrainrotDepositItems = async () => {
      setBrainrotDepositItemsLoading(true);

      try {
        const response = await apiFetch(
          `${API}/api/brainrot-deposit-items?game=steal-a-brainrot`,
          { cache: "no-store" }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load accepted Brainrots."
          );
        }

        if (cancelled) return;

        const nextItems = Array.isArray(data.items) ? data.items : [];
        setBrainrotDepositItems(nextItems);
        setSelectedBrainrotDepositItemId((current) => {
          if (
            current &&
            nextItems.some(
              (item) => Number(item.id) === Number(current)
            )
          ) {
            return current;
          }

          return nextItems[0] ? Number(nextItems[0].id) : null;
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Accepted Brainrot catalog load failed:",
            error
          );
          setBrainrotDepositItems([]);
          setSelectedBrainrotDepositItemId(null);
        }
      } finally {
        if (!cancelled) {
          setBrainrotDepositItemsLoading(false);
        }
      }
    };

    void loadBrainrotDepositItems();

    return () => {
      cancelled = true;
    };
  }, [open, selectedSlug]);

  const filteredBrainrotDepositItems = useMemo(() => {
    const query = brainrotDepositSearch.trim().toLowerCase();

    if (!query) return brainrotDepositItems;

    return brainrotDepositItems.filter((item) =>
      [item.name, item.rarity].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [brainrotDepositItems, brainrotDepositSearch]);

  const selectedBrainrotDepositItem = useMemo(() => {
    if (!filteredBrainrotDepositItems.length) return null;

    return (
      filteredBrainrotDepositItems.find(
        (item) =>
          Number(item.id) === Number(selectedBrainrotDepositItemId)
      ) || filteredBrainrotDepositItems[0]
    );
  }, [
    filteredBrainrotDepositItems,
    selectedBrainrotDepositItemId,
  ]);

  useEffect(() => {
    if (!filteredBrainrotDepositItems.length) {
      setSelectedBrainrotDepositItemId(null);
      return;
    }

    if (
      !filteredBrainrotDepositItems.some(
        (item) =>
          Number(item.id) === Number(selectedBrainrotDepositItemId)
      )
    ) {
      setSelectedBrainrotDepositItemId(
        Number(filteredBrainrotDepositItems[0].id)
      );
    }
  }, [
    filteredBrainrotDepositItems,
    selectedBrainrotDepositItemId,
  ]);

  useEffect(() => {
    if (!open || tab !== "deposit" || selectedSlug !== "steal-a-brainrot") {
      return undefined;
    }

    const overlay = document.querySelector(".game-portal-overlay");
    if (overlay) {
      overlay.scrollTop = 0;
    }

    return undefined;
  }, [open, tab, selectedSlug]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadGames = async () => {
      try {
        const response = await apiFetch(`${API}/api/games`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(data.games) && data.games.length) {
          if (cancelled) return;
          setGames(data.games);
          if (initialGame && initialGame !== "donutsmp") {
            const exists = data.games.some((game) => game.slug === initialGame);
            if (exists) setSelectedSlug(initialGame);
          }
        }
      } catch (error) {
        console.error("Game catalog load failed:", error);
      }
    };

    setMessage("");
    setSearch("");
    setCaseDetails(null);
    setCaseDetailsError("");
    setCaseOpening(false);
    setCaseOpeningReward(null);
    setCaseOpeningError("");
    setWonInventoryId(null);
    setReelItems([]);
    setReelTarget(null);
    setReelAnimating(false);
    stopReelSound();
    const launchGame = initialGame === "donutsmp" ? null : initialGame;
    const requestedTab = String(initialTab || "").toLowerCase();
    const allowedTabs = new Set([
      "marketplace",
      "cases",
      "inventory",
      "deposit",
      "withdraw",
      "home",
    ]);
    const nextTab =
      launchGame && allowedTabs.has(requestedTab)
        ? requestedTab
        : launchGame
          ? "marketplace"
          : "home";

    setTab(nextTab);
    setSelectedSlug(launchGame || null);
    void loadGames();

    return () => {
      cancelled = true;
    };
  }, [open, initialGame, initialTab]);

  useEffect(() => {
    if (!open || !selectedSlug) return;

    let cancelled = false;

    const loadGameData = async () => {
      setLoading(true);
      setMessage("");

      try {
        const query = `?game=${encodeURIComponent(selectedSlug)}`;
        const [marketResponse, caseResponse] = await Promise.all([
          apiFetch(`${API}/api/marketplace${query}`, { cache: "no-store" }),
          apiFetch(`${API}/api/cases${query}`, { cache: "no-store" }),
        ]);

        const [marketData, caseData] = await Promise.all([
          marketResponse.json().catch(() => ({})),
          caseResponse.json().catch(() => ({})),
        ]);

        if (!cancelled) {
          setMarketplace(marketResponse.ok && Array.isArray(marketData.listings) ? marketData.listings : []);
          setGameCases(caseResponse.ok && Array.isArray(caseData.cases) ? caseData.cases : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Game data load failed:", error);
          setMarketplace([]);
          setGameCases([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadGameData();

    return () => {
      cancelled = true;
    };
  }, [open, selectedSlug]);

  const loadWithdrawals = async () => {
    if (!authUser) {
      setWithdrawals([]);
      return;
    }

    setWithdrawalsLoading(true);

    try {
      const response = await apiFetch(`${API}/api/me/item-withdrawals`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "WITHDRAWAL_HISTORY_FAILED");
      }

      setWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : []);
    } catch (error) {
      console.error("Game portal withdrawal history failed:", error);
      setWithdrawals([]);
      setMessage("Unable to load withdrawal history right now.");
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !authUser) {
      setWithdrawals([]);
      return;
    }

    void loadWithdrawals();
  }, [open, authUser?.id]);

  const buildReel = (reward, rewardPool) => {
    const pool = (rewardPool || []).map((item) => ({
      id: Number(item.id),
      name: item.name,
      rarity: item.rarity,
      valueCents: Number(item.value_cents ?? item.valueCents ?? 0),
      imageUrl: item.image_url ?? item.imageUrl ?? "",
      cls: rarityClass(item.rarity),
    }));

    const fallbackPool = [
      { id: 1, name: "Common Drop", rarity: "Common", valueCents: 100, imageUrl: "", cls: "common" },
      { id: 2, name: "Rare Drop", rarity: "Rare", valueCents: 300, imageUrl: "", cls: "rare" },
      { id: 3, name: "Epic Drop", rarity: "Epic", valueCents: 1000, imageUrl: "", cls: "epic" },
      { id: 4, name: "Legendary Drop", rarity: "Legendary", valueCents: 5000, imageUrl: "", cls: "legendary" },
      { id: 5, name: "Secret Drop", rarity: "Secret", valueCents: 25000, imageUrl: "", cls: "secret" },
    ];

    const source = pool.length ? pool : fallbackPool;
    const winnerIndex = 120;
    const itemsAfterWinner = 50;
    const items = [];

    for (let index = 0; index < winnerIndex; index += 1) {
      const item = source[Math.floor(Math.random() * source.length)];
      items.push({
        ...item,
        key: `reel-${index}-${item.id}-${Math.random().toString(36).slice(2)}`,
        winning: false,
      });
    }

    items.push({
      id: Number(reward.id),
      name: reward.name,
      rarity: reward.rarity,
      valueCents: Number(reward.valueCents ?? reward.value_cents ?? 0),
      imageUrl: reward.image_url ?? reward.imageUrl ?? "",
      cls: rarityClass(reward.rarity),
      key: "winning-item",
      winning: true,
    });

    for (let index = 0; index < itemsAfterWinner; index += 1) {
      const item = source[Math.floor(Math.random() * source.length)];
      items.push({
        ...item,
        key: `after-${index}-${item.id}-${Math.random().toString(36).slice(2)}`,
        winning: false,
      });
    }

    return items;
  };

  useEffect(() => {
    if (!caseOpening || !reelItems.length) {
      setReelTarget(null);
      setReelAnimating(false);
      return undefined;
    }

    const track = reelTrackRef.current;
    const windowElement = reelWindowRef.current;
    if (!track || !windowElement) return undefined;

    const winner = track.querySelector('.reel-item[data-winning="true"]');
    if (!winner) return undefined;

    setReelAnimating(false);
    setReelTarget("0px");

    requestAnimationFrame(() => {
      const targetX =
        windowElement.clientWidth / 2 -
        (winner.offsetLeft + winner.offsetWidth / 2);

      setReelTarget(`${targetX}px`);

      requestAnimationFrame(() => {
        setReelAnimating(true);
      });
    });

    return undefined;
  }, [caseOpening, reelItems]);

  useEffect(() => {
    if (!caseOpening) {
      setOpeningPhase("rolling");
      return undefined;
    }

    setOpeningPhase("rolling");

    const lockTimer = window.setTimeout(() => {
      setOpeningPhase("locking");
    }, 4300);

    const revealTimer = window.setTimeout(() => {
      setOpeningPhase("revealing");
    }, 5250);

    return () => {
      window.clearTimeout(lockTimer);
      window.clearTimeout(revealTimer);
    };
  }, [caseOpening]);

  /*
   * CaseX opening audio
   *
   * This intentionally uses small Web Audio synth sounds rather than the
   * original embedded audio clips. The old clips were too loud/sharp in the
   * multi-game portal. These are short, playful arcade-style tones with a
   * deliberately low master level.
   */

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();

      const master = audioContextRef.current.createGain();
      master.gain.value = 0.30;
      master.connect(audioContextRef.current.destination);
      audioMasterRef.current = master;
    }

    return audioContextRef.current;
  };

  const resumeAudio = () => {
    const context = getAudioContext();
    if (!context) return null;

    if (context.state === "suspended") {
      void context.resume().catch(() => {});
    }

    return context;
  };

  const playTone = ({
    frequency,
    duration = 0.08,
    delay = 0,
    type = "sine",
    volume = 0.08,
    slideTo = null,
  }) => {
    if (!soundEnabled) return;

    const context = resumeAudio();
    const master = audioMasterRef.current;
    if (!context || !master) return;

    const startTime = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    if (slideTo != null) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, slideTo),
        startTime + Math.max(0.025, duration)
      );
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume),
      startTime + 0.008
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + Math.max(0.025, duration)
    );

    oscillator.connect(gain);
    gain.connect(master);

    oscillator.start(startTime);
    oscillator.stop(startTime + Math.max(0.035, duration) + 0.015);
  };

  const primeAudio = () => {
    if (!soundEnabled) return;
    soundGestureRef.current = true;
    resumeAudio();
  };

  // No sound when the case starts. The reel tick sound is the only
  // sound played during the opening animation.
  const playCaseOpenSound = () => {};

  const playReelTick = () => {
    if (!soundEnabled) return;

    // Very quiet, soft tick so the reel has rhythm without sounding harsh.
    playTone({
      frequency: 1100,
      duration: 0.025,
      type: "square",
      volume: 0.18,
      slideTo: 760,
    });
  };

  // No landing/reveal sound. The reward appears silently.
  const playRevealSound = () => {};

  const scheduleReelTick = (startedAt) => {
    if (!soundEnabled) return;

    const elapsed = Date.now() - startedAt;

    if (elapsed >= 5250) {
      soundTimerRef.current = null;
      return;
    }

    const progress = Math.min(1, elapsed / 5250);
    playReelTick();

    const interval = Math.round(92 + Math.pow(progress, 2.2) * 290);

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

      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
        audioMasterRef.current = null;
      }
    };
  }, []);

  const runCasePageTransition = (update) => {
    try {
      if (
        typeof document !== "undefined" &&
        typeof document.startViewTransition === "function"
      ) {
        document.startViewTransition(() => {
          update();
        });
        return;
      }
    } catch (error) {
      console.warn("Case page transition unavailable:", error);
    }

    update();
  };

  const openCaseDetails = async (gameCase) => {
    if (!gameCase?.id) return;

    // A case preview is a full-page view inside the Game Portal, not a modal.
    // Always start it at the top so clicking "View Case" from a deeply
    // scrolled case list never leaves the preview halfway down the page.
    const overlay = document.querySelector(".game-portal-overlay");
    if (overlay) {
      overlay.scrollTop = 0;
    }

    setCaseDetailsLoading(true);
    setCaseDetailsError("");
    setCaseDetails(null);

    try {
      const response = await apiFetch(`${API}/api/cases/${gameCase.id}`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "CASE_DETAILS_FAILED");
      }

      runCasePageTransition(() => {
        setCaseDetails({
          ...data.case,
          items: Array.isArray(data.items) ? data.items : [],
        });
      });
    } catch (error) {
      console.error("Case details load failed:", error);
      setCaseDetailsError("Unable to load this case right now.");
    } finally {
      setCaseDetailsLoading(false);
    }
  };

  const handleCaseOpen = async () => {
    if (!caseDetails || caseDetailsLoading || caseOpening) return;

    if (!authUser) {
      openAuth?.("login");
      return;
    }

    const priceCents = Number(caseDetails.price_cents || 0);
    if (Number(balance || 0) * 100 < priceCents) {
      setCaseOpeningError("Insufficient balance.");
      return;
    }

    const rewardPool = Array.isArray(caseDetails.items) ? caseDetails.items : [];
    if (!rewardPool.length) {
      setCaseOpeningError("Case rewards are still loading. Please try again in a moment.");
      return;
    }

    setCaseOpeningReward(null);
    setCaseOpeningError("");
    setWonInventoryId(null);
    setReelItems([]);
    setReelTarget(null);
    setReelAnimating(false);
    setOpeningPhase("rolling");
    setCaseOpening(true);

    // Start the original opening audio sequence once. The Open Case click is
    // already a direct user gesture, so do not play the opening sound twice.
    playCaseOpenSound();
    startReelSound();

    try {
      const response = await apiFetch(`${API}/api/cases/${caseDetails.id}/open`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to open case");
      }

      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }

      setWonInventoryId(data.inventoryId ?? null);

      const rewardPoolMatch = rewardPool.find(
        (item) => Number(item.id) === Number(data.reward?.id)
      );

      const rewardImage =
        data.reward?.image_url ||
        data.reward?.imageUrl ||
        rewardPoolMatch?.image_url ||
        rewardPoolMatch?.imageUrl ||
        "";

      const resolvedReward = data.reward
        ? {
            ...data.reward,
            valueCents: Number(
              data.reward.valueCents ??
                data.reward.value_cents ??
                rewardPoolMatch?.value_cents ??
                0
            ),
            image_url: rewardImage,
            imageUrl: rewardImage,
            inventoryId: data.inventoryId ?? null,
          }
        : null;

      if (!resolvedReward) {
        throw new Error("The server did not return a reward.");
      }

      // Build the real reel around the real server-selected result.
      setReelItems(buildReel(resolvedReward, rewardPool));

      // Keep the unified multi-game inventory immediately in sync.
      setPortalInventory((current) => [
        {
          id: resolvedReward.inventoryId,
          status: "owned",
          created_at: new Date().toISOString(),
          item_id: resolvedReward.id,
          name: resolvedReward.name,
          rarity: resolvedReward.rarity,
          value_cents: resolvedReward.valueCents,
          image_url: resolvedReward.image_url,
          game_slug: selectedSlug,
          game_name: selectedGame?.name,
          game_theme: selectedGame?.theme,
        },
        ...current.filter(
          (item) => Number(item.id) !== Number(resolvedReward.inventoryId)
        ),
      ]);

      // Preserve the original 5.8 second opening -> reward handoff.
      window.setTimeout(() => {
        stopReelSound();
        setCaseOpening(false);
        setCaseOpeningReward(resolvedReward);
        setReelTarget(null);
        setReelAnimating(false);
        setReelItems([]);
        playRevealSound(resolvedReward.rarity);
      }, 5800);
    } catch (error) {
      console.error("Game portal case opening failed:", error);

      stopReelSound();
      setCaseOpening(false);
      setCaseOpeningReward(null);
      setReelItems([]);
      setReelTarget(null);
      setReelAnimating(false);
      setWonInventoryId(null);
      setOpeningPhase("rolling");
      setCaseOpeningError(error?.message || "Unable to open this case.");
    }
  };

  const cancelWithdrawal = async (withdrawal) => {
    if (!withdrawal?.id || cancellingWithdrawalId) return;

    const status = String(withdrawal.status || "").toLowerCase();
    if (status !== "pending") return;

    setCancellingWithdrawalId(Number(withdrawal.id));

    try {
      const response = await apiFetch(`${API}/api/me/withdrawals/${withdrawal.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "WITHDRAWAL_CANCEL_FAILED");
      }

      await loadWithdrawals();
      setPortalInventory((current) => {
        const alreadyOwned = current.some(
          (item) => Number(item.id) === Number(withdrawal.inventory_id)
        );
        if (alreadyOwned) return current;
        return [
          {
            id: withdrawal.inventory_id,
            status: "owned",
            created_at: withdrawal.created_at || new Date().toISOString(),
            item_id: withdrawal.item_id,
            name: withdrawal.item_name,
            rarity: withdrawal.rarity,
            value_cents: withdrawal.value_cents,
            image_url: withdrawal.image_url,
            game_slug: withdrawal.game_slug,
            game_name: withdrawal.game_name,
            game_theme: withdrawal.game_theme,
          },
          ...current,
        ];
      });
      setMessage(`${withdrawal.item_name || "Item"} withdrawal cancelled.`);
    } catch (error) {
      console.error("Withdrawal cancellation failed:", error);
      setMessage(error?.message || "Unable to cancel withdrawal.");
    } finally {
      setCancellingWithdrawalId(null);
    }
  };

  const filteredMarketplace = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return marketplace;
    return marketplace.filter((item) =>
      [item.name, item.rarity].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [marketplace, search]);

  const selectGame = (slug) => {
    // DonutSMP is intentionally held back for launch. Keep it visible in the
    // game hub, but prevent navigation into its marketplace/cases/inventory.
    if (slug === "donutsmp") return;

    setSelectedSlug(slug);
    setTab("marketplace");
    setSearch("");
    setMessage("");
  };

  const requestBuyItem = (listing) => {
    if (!authUser) {
      openAuth?.("login");
      return;
    }

    if (buyingId || Number(balance || 0) * 100 < Number(listing.priceCents || 0)) {
      return;
    }

    setPurchaseConfirmItem(listing);
    setMessage("");
  };

  const closePurchaseConfirmation = () => {
    if (buyingId) return;
    setPurchaseConfirmItem(null);
  };

  const confirmPurchase = async () => {
    if (!purchaseConfirmItem || buyingId) return;

    const listing = purchaseConfirmItem;
    setPurchaseConfirmItem(null);
    await buyItem(listing);
  };

  const buyItem = async (listing) => {
    if (!authUser) {
      openAuth?.("login");
      return;
    }

    if (buyingId || Number(balance || 0) * 100 < Number(listing.priceCents || 0)) {
      return;
    }

    setBuyingId(Number(listing.id));
    setMessage("");

    try {
      const response = await apiFetch(`${API}/api/marketplace/${listing.id}/buy`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }

      setMarketplace((current) =>
        current
          .map((item) =>
            Number(item.id) === Number(listing.id)
              ? { ...item, stock: Number(data.remainingStock ?? item.stock - 1) }
              : item
          )
          .filter((item) => Number(item.stock) > 0)
      );

      await onRefreshInventory?.();
      setMessage(`${listing.name} added to your inventory.`);
    } catch (error) {
      console.error("Marketplace purchase failed:", error);
      setMessage(error.message || "Purchase failed.");
    } finally {
      setBuyingId(null);
    }
  };

  const openInventoryAction = (item, type) => {
    if (!authUser || String(item?.status || "owned").toLowerCase() !== "owned") return;

    const overlay = document.querySelector(".game-portal-overlay");
    if (overlay) {
      portalScrollTopRef.current = overlay.scrollTop;
    }

    setActionItem(item);
    setActionType(type);
    setMessage("");
  };

  const closeInventoryAction = () => {
    if (actionLoading) return;

    setActionItem(null);
    setActionType(null);

    requestAnimationFrame(() => {
      const overlay = document.querySelector(".game-portal-overlay");
      if (overlay) {
        overlay.scrollTop = portalScrollTopRef.current;
      }
    });
  };

  const confirmInventoryAction = async () => {
    if (!actionItem || !actionType || actionLoading) return;

    setActionLoading(true);
    setMessage("");

    try {
      const endpoint =
        actionType === "sell"
          ? `${API}/api/me/inventory/${actionItem.id}/sell`
          : `${API}/api/me/inventory/${actionItem.id}/withdraw`;

      const response = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            (actionType === "sell"
              ? "Failed to sell item"
              : "Failed to create withdrawal")
        );
      }

      const completedActionType = actionType;
      const completedItem = actionItem;

      // Close the modal as soon as the server confirms the transaction so
      // the portal never appears frozen while the remaining UI refreshes.
      setActionItem(null);
      setActionType(null);

      if (completedActionType === "sell" && data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }

      // If the sold item came from the freshly-opened case result, close the
      // reward screen after the server confirms the sale instead of leaving
      // the user stuck on a result whose inventory item no longer exists.
      if (completedActionType === "sell" && caseOpeningReward) {
        setCaseOpeningReward(null);
        setCaseOpeningError("");
        setCaseDetails(null);
        setWonInventoryId(null);
        setReelItems([]);
        setReelTarget(null);
        setReelAnimating(false);
        setTab("cases");
        requestAnimationFrame(() => {
          const overlay = document.querySelector(".game-portal-overlay");
          if (overlay) overlay.scrollTop = 0;
        });
      }

      // Keep the Game Portal self-contained. Do not navigate the user back
      // to the legacy inventory page after a sell/withdraw action.
      setPortalInventory((current) =>
        current.filter((item) => Number(item.id) !== Number(completedItem.id))
      );

      requestAnimationFrame(() => {
        const overlay = document.querySelector(".game-portal-overlay");
        if (overlay) {
          overlay.scrollTop = portalScrollTopRef.current;
        }
      });

      if (completedActionType === "withdraw") {
        await loadWithdrawals();
        setTab("withdraw");
      }

      setMessage(
        completedActionType === "sell"
          ? `${completedItem.name} sold for ${money(completedItem.value_cents)}.`
          : `${completedItem.name} withdrawal request created.`
      );
    } catch (error) {
      console.error(`Inventory ${actionType} failed:`, error);
      setMessage(error?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={`game-portal-overlay ${selectedGame?.theme === "blue" ? "game-portal-theme-blue" : "game-portal-theme-purple"}`}>
      <div className="game-portal-shell">
        <style>{`
          .game-hub-card-coming-soon {
            position: relative;
            cursor: not-allowed !important;
            opacity: .82;
            overflow: hidden;
          }
          .game-hub-card-coming-soon .game-hub-card-glow {
            opacity: .22;
          }
          .game-hub-card-coming-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            background: rgba(5, 7, 12, .38);
            backdrop-filter: blur(2.5px);
            -webkit-backdrop-filter: blur(2.5px);
          }
          .game-hub-card-coming-soon > *:not(.game-hub-card-coming-overlay) {
            position: relative;
            z-index: 2;
          }
          .game-hub-card-coming-logo {
            opacity: .55;
            filter: grayscale(.35) saturate(.55) blur(.4px);
          }
          .game-hub-card-coming-soon .game-hub-card-arrow {
            color: #777b88;
            background: rgba(255,255,255,.025);
          }
          .game-hub-card-coming-soon .game-portal-kicker {
            color: #9b8abf;
          }
          .game-hub-card-coming-soon h3,
          .game-hub-card-coming-soon p {
            opacity: .68;
          }
          .game-hub-coming-badge {
            display: inline-flex;
            align-items: center;
            min-height: 26px;
            padding: 0 10px;
            border: 1px solid rgba(157,108,255,.24);
            border-radius: 999px;
            background: rgba(157,108,255,.07);
            color: #a895c9;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .7px;
            text-transform: uppercase;
          }
          .game-hub-card-coming-soon:disabled {
            pointer-events: none;
          }
        `}</style>
        <div className="game-portal-header">
          <div className="game-portal-brand-line">
            <button type="button" className="game-portal-back" onClick={() => {
              if (selectedSlug) {
                setSelectedSlug(null);
                setTab("home");
                return;
              }
              onClose?.();
            }}>
              ←
            </button>
            <div>
              <div className="game-portal-kicker">CASEX GAMES</div>
              <h1>{selectedGame ? selectedGame.name : "Choose Your Game"}</h1>
              <p>
                {selectedGame
                  ? "One balance. One inventory. Everything for this game in one place."
                  : "Choose a game to browse items, cases and your inventory."}
              </p>
            </div>
          </div>
          <div className="game-portal-balance-card">
            <span>CASEX BALANCE</span>
            <strong>{money(Number(balance || 0) * 100)}</strong>
          </div>
        </div>

        {!selectedGame ? (
          <div className="game-hub-layout">
            <div className="game-hub-hero">
              <div className="game-portal-kicker">ONE PLATFORM</div>
              <h2>All your games.</h2>
              <p>Buy items, open cases and manage your game inventory without leaving CaseX.</p>
            </div>
            <div className="game-hub-grid">
              {games.map((game) => (
                <GameHubCard
                  key={game.slug}
                  game={game}
                  active={false}
                  onSelect={selectGame}
                />
              ))}
              <div className="game-hub-card coming-soon">
                <div className="game-hub-card-top"><div className="coming-soon-icon">＋</div><span className="game-hub-card-arrow">→</span></div>
                <div className="game-hub-card-copy"><span className="game-portal-kicker">NEXT UP</span><h3>More Games</h3><p>More supported economies will be added here.</p></div>
                <div className="game-hub-card-footer"><span>Coming Soon</span></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!caseDetails && !caseDetailsLoading && !caseDetailsError ? (
              <div className="game-portal-gamebar">
                <div className="game-portal-game-identity">
                  <GameLogo game={selectedGame} size="medium" />
                  <div>
                    <strong>{selectedGame.name}</strong>
                    <span>{selectedGame.description}</span>
                  </div>
                </div>
                <div className="game-portal-game-switcher">
                  {games.map((game) => (
                    <button
                      key={game.slug}
                      type="button"
                      className={game.slug === selectedSlug ? "active" : ""}
                      onClick={() => selectGame(game.slug)}
                    >
                      {game.shortName}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!caseDetails && !caseDetailsLoading && !caseDetailsError ? (
              <>
                <div className="game-portal-tabs">
                  {[
                    ["marketplace", "Marketplace"],
                    ["cases", "Cases"],
                    ["inventory", "Inventory"],
                    ["deposit", "Deposit"],
                    ["withdraw", "Withdraw"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" className={tab === value ? "active" : ""} onClick={() => setTab(value)}>
                      {label}
                    </button>
                  ))}
                </div>

                {message && <div className="game-portal-message">{message}</div>}
              </>
            ) : null}

            {(caseDetails || caseDetailsLoading || caseDetailsError) ? (
              <section className="game-portal-case-detail">
                <button
                  type="button"
                  className="game-portal-case-detail-back"
                  onClick={() => {
                    if (caseDetailsLoading) return;
                    runCasePageTransition(() => {
                      setCaseDetails(null);
                      setCaseDetailsError("");
                    });
                    requestAnimationFrame(() => {
                      const overlay = document.querySelector(".game-portal-overlay");
                      if (overlay) overlay.scrollTop = 0;
                    });
                  }}
                  disabled={caseDetailsLoading}
                >
                  <span aria-hidden="true">←</span>
                  <span>Back to Cases</span>
                </button>

                {caseDetailsLoading ? (
                  <div className="game-portal-case-detail-loading">
                    <span className="game-portal-kicker">CASE PREVIEW</span>
                    <strong>Loading case...</strong>
                  </div>
                ) : caseDetailsError ? (
                  <div className="game-portal-case-detail-loading error">
                    <span className="game-portal-kicker">CASE PREVIEW</span>
                    <strong>{caseDetailsError}</strong>
                  </div>
                ) : (
                  <>
                    <div className="game-portal-case-detail-hero">
                      <div className="game-portal-case-detail-art">
                        <div className="game-portal-case-detail-art-glow" />
                        <span className="game-portal-case-detail-art-label">CASE</span>
                        {caseDetails.image_url ? (
                          <img
                            src={caseDetails.image_url}
                            alt={`${caseDetails.name} case artwork`}
                            draggable="false"
                          />
                        ) : (
                          <span className="game-portal-case-detail-fallback">🎁</span>
                        )}
                      </div>

                      <div className="game-portal-case-detail-info">
                        <span className="game-portal-kicker">CASE PREVIEW</span>
                        <h2>{caseDetails.name}</h2>
                        <p>
                          {caseDetails.description ||
                            "Open the case and discover your reward."}
                        </p>

                        <div className="game-portal-case-detail-price">
                          <div>
                            <span>OPENING PRICE</span>
                            <strong>{money(caseDetails.price_cents)}</strong>
                          </div>
                          <div className="game-portal-case-detail-live">
                            <span />
                            LIVE
                          </div>
                        </div>

                        <div className="game-portal-case-detail-stats">
                          <span>
                            <b>{caseDetails.items.length}</b> rewards
                          </span>
                          <span>
                            <b>
                              {new Set(
                                caseDetails.items.map((item) =>
                                  String(item.rarity || "Common").toLowerCase()
                                )
                              ).size}
                            </b>{" "}
                            rarity tiers
                          </span>
                          <span>
                            <b>Instant</b> delivery
                          </span>
                        </div>

                        <button
                          type="button"
                          className="game-portal-case-detail-open"
                          onClick={handleCaseOpen}
                          disabled={
                            !authUser ||
                            Number(balance || 0) <
                              Number(caseDetails.price_cents || 0) / 100
                          }
                        >
                          {!authUser
                            ? "Sign in to open"
                            : Number(balance || 0) >=
                              Number(caseDetails.price_cents || 0) / 100
                            ? `Open Case · ${money(caseDetails.price_cents)}`
                            : "Insufficient balance"}
                        </button>

                        <div className="game-portal-case-detail-balance">
                          Balance <b>{money(Number(balance || 0) * 100)}</b>
                        </div>
                      </div>
                    </div>

                    <div className="game-portal-case-detail-rewards">
                      <div className="game-portal-case-detail-rewards-head">
                        <div>
                          <span className="game-portal-kicker">WHAT'S INSIDE</span>
                          <h3>Possible rewards</h3>
                        </div>
                        <span>{caseDetails.items.length} items · Actual odds</span>
                      </div>

                      <div className="game-portal-case-detail-reward-grid">
                        {caseDetails.items.map((item) => {
                          const rarity = String(item.rarity || "Common");
                          const rarityClass = rarity.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                          const probability = Number(item.probability || 0);

                          return (
                            <article
                              className={`game-portal-case-detail-reward ${rarityClass}`}
                              key={item.id}
                            >
                              <div className="game-portal-case-detail-reward-rarity">
                                <span />
                                {rarity}
                              </div>

                              <div className="game-portal-case-detail-reward-art">
                                {item.image_url ? (
                                  <SmartItemImage
                                    src={item.image_url}
                                    alt=""
                                  />
                                ) : (
                                  <span>◇</span>
                                )}
                              </div>

                              <strong>{item.name}</strong>
                              <span className="game-portal-case-detail-reward-value">
                                {money(item.value_cents)}
                              </span>

                              <div className="game-portal-case-detail-odds">
                                <span>ODDS</span>
                                <b>{probability.toFixed(2)}%</b>
                              </div>

                              <div className="game-portal-case-detail-odds-bar">
                                <span style={{ width: `${Math.max(0, Math.min(100, probability))}%` }} />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </section>
            ) : null}

            {tab === "marketplace" && (
              <section className="game-portal-section">
                <div className="game-portal-section-head">
                  <div><span className="game-portal-kicker">SHOP</span><h2>Buy {selectedGame.name} items</h2><p>Purchase available stock directly with your CaseX balance.</p></div>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search items..." />
                </div>
                {loading ? <div className="game-portal-empty">Loading marketplace...</div> : filteredMarketplace.length === 0 ? <div className="game-portal-empty"><strong>No items listed yet.</strong><span>Marketplace stock will appear here once you add listings from Admin.</span></div> : (
                  <div className="game-portal-item-grid">
                    {filteredMarketplace.map((item) => {
                      const canAfford = Number(balance || 0) * 100 >= Number(item.priceCents || 0);
                      return (
                        <article className="game-portal-item-card" key={item.id}>
                          <div className="game-portal-item-art">
                            {item.imageUrl ? <SmartItemImage src={item.imageUrl} alt="" /> : <span>◇</span>}
                          </div>
                          <span className="game-portal-item-rarity">{item.rarity}</span>
                          <h3>{item.name}</h3>
                          <div className="game-portal-item-meta"><span>Value {money(item.valueCents)}</span><span>Stock {item.stock}</span></div>
                          <div className="game-portal-item-buy"><strong>{money(item.priceCents)}</strong><button type="button" disabled={buyingId === Number(item.id) || !canAfford} onClick={() => requestBuyItem(item)}>{buyingId === Number(item.id) ? "Buying..." : canAfford ? "Buy Now" : "Insufficient balance"}</button></div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === "cases" && (
              <section className="game-portal-section">
                <div className="game-portal-section-head"><div><span className="game-portal-kicker">CASES</span><h2>{selectedGame.name} Cases</h2><p>Open cases using the same CaseX balance you use everywhere else.</p></div></div>
                {loading ? <div className="game-portal-empty">Loading cases...</div> : gameCases.length === 0 ? <div className="game-portal-empty"><strong>No cases configured for this game yet.</strong><span>Create a case in Admin and assign it to {selectedGame.name}.</span></div> : (
                  <div className="game-portal-case-grid">
                    {gameCases.map((gameCase) => (
                      <article className="game-portal-case-card" key={gameCase.id}>
                        <div className="game-portal-case-art">{gameCase.image_url ? <img src={gameCase.image_url} alt="" draggable="false" /> : <span>🎁</span>}</div>
                        <div className="game-portal-case-copy"><h3>{gameCase.name}</h3><strong>{money(gameCase.price_cents)}</strong></div>
                        <button type="button" onClick={() => openCaseDetails(gameCase)}>View Case →</button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "inventory" && (
              <section className="game-portal-section">
                <div className="game-portal-section-head"><div><span className="game-portal-kicker">INVENTORY</span><h2>Your {selectedGame.name} items</h2><p>Your CaseX inventory stays unified, with this game filtered here.</p></div><strong className="game-portal-count">{selectedInventory.length} items</strong></div>
                {selectedInventory.length === 0 ? (
                  <div className="game-portal-empty">
                    <strong>No {selectedGame.name} items yet.</strong>
                    <span>Buy an item, win one from a case, or deposit one through Discord.</span>
                  </div>
                ) : (
                  <div className="game-portal-inventory-grid">
                    {selectedInventory.map((item) => {
                      return (
                        <article className="game-portal-inventory-card" key={item.id}>
                          <div className="game-portal-inventory-art-wrap">
                            <div className="game-portal-item-art game-portal-inventory-art">
                              {item.image_url ? <img className="game-portal-inventory-image" src={item.image_url} alt="" draggable="false" /> : <span>◇</span>}
                            </div>
                          </div>
                          <strong>{item.name}</strong>
                          <span>{item.rarity}</span>
                          <b>{money(item.value_cents)}</b>
                          <div className="game-portal-inventory-actions">
                              <button
                                type="button"
                                className="game-portal-inventory-sell"
                                onClick={() => openInventoryAction(item, "sell")}
                                disabled={actionLoading}
                              >
                                Sell
                                <span>{money(item.value_cents)}</span>
                              </button>
                              <button
                                type="button"
                                className="game-portal-inventory-withdraw"
                                onClick={() => openInventoryAction(item, "withdraw")}
                                disabled={actionLoading}
                              >
                                Withdraw
                              </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === "deposit" && (
              <section className="game-portal-section game-portal-brainrot-deposit-section">
                <div className="game-portal-brainrot-deposit-head">
                  <div>
                    <span className="game-portal-kicker">DEPOSIT CATALOG</span>
                    <h2>Deposit Brainrots</h2>
                    <p>
                      Find your Brainrot to see the current CASEX deposit value,
                      then open a Discord ticket to send it to us.
                    </p>
                  </div>

                  <div className="game-portal-brainrot-deposit-count">
                    <strong>{brainrotDepositItems.length}</strong>
                    <span>accepted Brainrots</span>
                  </div>
                </div>

                <div className="game-portal-brainrot-deposit-layout">
                  <div className="game-portal-brainrot-deposit-browser">
                    <div className="game-portal-brainrot-deposit-browser-head">
                      <div>
                        <span className="game-portal-kicker">ACCEPTED ITEMS</span>
                        <h3>Find your Brainrot</h3>
                      </div>

                      <div className="game-portal-brainrot-deposit-search">
                        <span>⌕</span>
                        <input
                          value={brainrotDepositSearch}
                          onChange={(event) =>
                            setBrainrotDepositSearch(event.target.value)
                          }
                          placeholder="Search Brainrots..."
                        />
                        {brainrotDepositSearch && (
                          <button
                            type="button"
                            onClick={() => setBrainrotDepositSearch("")}
                            aria-label="Clear search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {brainrotDepositItemsLoading ? (
                      <div className="game-portal-brainrot-deposit-empty">
                        Loading accepted Brainrots...
                      </div>
                    ) : filteredBrainrotDepositItems.length === 0 ? (
                      <div className="game-portal-brainrot-deposit-empty">
                        <strong>No Brainrots found.</strong>
                        <span>Try searching for a different name.</span>
                      </div>
                    ) : (
                      <div className="game-portal-brainrot-deposit-list">
                        {filteredBrainrotDepositItems.map((item) => {
                          const isActive =
                            Number(item.id) ===
                            Number(selectedBrainrotDepositItem?.id);

                          return (
                            <button
                              type="button"
                              key={item.id}
                              className={`game-portal-brainrot-deposit-list-item${isActive ? " active" : ""}`}
                              onClick={() =>
                                setSelectedBrainrotDepositItemId(Number(item.id))
                              }
                            >
                              <span className="game-portal-brainrot-deposit-list-art">
                                {item.image_url ? (
                                  <SmartItemImage
                                    src={item.image_url}
                                    alt=""
                                  />
                                ) : (
                                  <span>◇</span>
                                )}
                              </span>

                              <span className="game-portal-brainrot-deposit-list-copy">
                                <strong>{item.name}</strong>
                                <small>{item.rarity}</small>
                              </span>

                              <span className="game-portal-brainrot-deposit-list-value">
                                {money(item.value_cents)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <aside className="game-portal-brainrot-deposit-detail">
                    {selectedBrainrotDepositItem ? (
                      <>
                        <div className="game-portal-brainrot-deposit-detail-kicker">
                          CURRENT DEPOSIT VALUE
                        </div>

                        <div
                          className={`game-portal-brainrot-deposit-detail-rarity ${rarityClass(selectedBrainrotDepositItem.rarity)}`}
                        >
                          <span></span>
                          {selectedBrainrotDepositItem.rarity}
                        </div>

                        <div className="game-portal-brainrot-deposit-detail-art">
                          <div className="game-portal-brainrot-deposit-detail-art-glow"></div>
                          {selectedBrainrotDepositItem.image_url ? (
                            <img
                              src={selectedBrainrotDepositItem.image_url}
                              alt={selectedBrainrotDepositItem.name}
                              draggable="false"
                            />
                          ) : (
                            <span>◇</span>
                          )}
                        </div>

                        <h3>{selectedBrainrotDepositItem.name}</h3>

                        <div className="game-portal-brainrot-deposit-detail-value">
                          <span>VALUED AT</span>
                          <strong>
                            {money(selectedBrainrotDepositItem.value_cents)}
                          </strong>
                        </div>

                        <div className="game-portal-brainrot-deposit-note">
                          <strong>How deposits work</strong>
                          <span>
                            These are reference values for accepted Brainrots.
                            Final credit is confirmed by staff after the in-game
                            transfer is verified.
                          </span>
                        </div>

                        <button
                          type="button"
                          className="game-portal-brainrot-deposit-discord"
                          onClick={() =>
                            window.open(
                              "https://discord.gg/7hsugeanWk",
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          Open Discord Ticket →
                        </button>
                      </>
                    ) : (
                      <div className="game-portal-brainrot-deposit-detail-empty">
                        <strong>Select a Brainrot</strong>
                        <span>
                          Choose an item from the list to see its deposit value.
                        </span>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            )}

            {tab === "withdraw" && (
              <section className="game-portal-section">
                <div className="game-portal-withdraw-head">
                  <div>
                    <span className="game-portal-kicker">ITEM DELIVERY</span>
                    <h2>Your {selectedGame.name} withdrawals</h2>
                    <p>Pending withdrawals stay here until delivery is completed. You can cancel a pending request at any time.</p>
                  </div>
                  <button type="button" className="game-portal-history-refresh" onClick={() => void loadWithdrawals()} disabled={withdrawalsLoading}>
                    {withdrawalsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {withdrawalsLoading && withdrawals.length === 0 ? (
                  <div className="game-portal-empty">Loading withdrawals...</div>
                ) : (
                  (() => {
                    const gameWithdrawals = withdrawals.filter(
                      (withdrawal) => String(withdrawal.game_slug || "steal-a-brainrot") === selectedSlug
                    );

                    if (!gameWithdrawals.length) {
                      return (
                        <div className="game-portal-empty">
                          <strong>No {selectedGame.name} withdrawals yet.</strong>
                          <span>When you withdraw an item, the request and cancellation option will appear here.</span>
                        </div>
                      );
                    }

                    return (
                      <div className="game-portal-withdrawal-list">
                        {gameWithdrawals.map((withdrawal) => {
                          const status = String(withdrawal.status || "pending").toLowerCase();
                          const pending = status === "pending";
                          const label = pending ? "Pending" : status === "completed" ? "Delivered" : "Cancelled";
                          const date = withdrawal.created_at ? new Date(withdrawal.created_at) : null;

                          return (
                            <article className={`game-portal-withdrawal-row ${status}`} key={withdrawal.id}>
                              <div className="game-portal-withdrawal-art">
                                {withdrawal.image_url ? <img src={withdrawal.image_url} alt="" draggable="false" /> : <span>◇</span>}
                              </div>
                              <div className="game-portal-withdrawal-info">
                                <div className="game-portal-withdrawal-title">
                                  <strong>{withdrawal.item_name || "Item"}</strong>
                                  <span className={`game-portal-withdrawal-status ${status}`}>{label}</span>
                                </div>
                                <div className="game-portal-withdrawal-meta">
                                  <span>{withdrawal.reference || withdrawal.withdrawal_code || "—"}</span>
                                  <span>{withdrawal.rarity || "Item"}</span>
                                  <span>{money(withdrawal.value_cents)}</span>
                                  <span>{date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Date unavailable"}</span>
                                </div>
                              </div>
                              {pending ? (
                                <button
                                  type="button"
                                  className="game-portal-withdrawal-cancel"
                                  onClick={() => void cancelWithdrawal(withdrawal)}
                                  disabled={cancellingWithdrawalId === Number(withdrawal.id)}
                                >
                                  {cancellingWithdrawalId === Number(withdrawal.id) ? "Cancelling..." : "Cancel"}
                                </button>
                              ) : (
                                <span className="game-portal-withdrawal-closed">Closed</span>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </section>
            )}
          </>
        )}
      </div>

      {(caseOpening || caseOpeningReward || caseOpeningError) && (
        <>
          {caseOpening ? (
            <div className={`fullscreen-opening opening-phase-${openingPhase}`}>
              <div className="fullscreen-opening-inner">
                <div className="opening-topline">
                  <div className="eyebrow">OPENING CASE</div>
                  <div className="opening-topline-actions">
                    <span className="opening-live"><i></i> LIVE</span>

                    <button
                      type="button"
                      className={`opening-sound-toggle ${soundEnabled ? "active" : ""}`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        if (soundEnabled) primeAudio();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        const next = !soundEnabled;
                        setSoundEnabled(next);

                        if (!next) {
                          stopReelSound();
                        } else {
                          if (caseOpening) startReelSound();
                        }
                      }}
                      aria-label={soundEnabled ? "Mute opening sounds" : "Enable opening sounds"}
                      title={soundEnabled ? "Mute opening sounds" : "Enable opening sounds"}
                    >
                      <span aria-hidden="true">
                        {soundEnabled ? "🔊" : "🔇"}
                      </span>
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
                  <div className="opening-case-art-halo" aria-hidden="true"></div>

                  {caseDetails?.image_url ? (
                    <img
                      className="opening-case-custom-image"
                      src={caseDetails.image_url}
                      alt={`${caseDetails.name} case artwork`}
                      draggable="false"
                    />
                  ) : (
                    <span className="fullscreen-case-icon" aria-hidden="true">🎁</span>
                  )}
                </div>

                <h1>{caseDetails?.name || "Case"}</h1>

                <p className="opening-status">
                  Opening your case
                  <span className="opening-dots"></span>
                </p>

                <div className="opening-meta">
                  <span><i></i> Provably Fair</span>
                </div>

                <div className="opening-progress">
                  <span></span>
                </div>

                <div className="opening-stage-row" aria-hidden="true">
                  <span className={openingPhase === "rolling" ? "active" : "done"}>ROLLING</span>
                  <i></i>
                  <span
                    className={
                      openingPhase === "locking"
                        ? "active"
                        : openingPhase === "revealing"
                          ? "done"
                          : ""
                    }
                  >
                    LOCKING IN
                  </span>
                  <i></i>
                  <span className={openingPhase === "revealing" ? "active" : ""}>REVEAL</span>
                </div>

                <div className="reel-window fullscreen-reel" ref={reelWindowRef}>
                  <div className="reel-pointer"></div>

                  <div
                    className={`reel-track ${reelAnimating ? "reel-animating" : ""}`}
                    ref={reelTrackRef}
                    style={reelTarget ? { "--reel-target": reelTarget } : undefined}
                  >
                    {reelItems.map((item, index) => (
                      <div
                        className={`reel-item ${item.cls}`}
                        data-winning={item.winning ? "true" : "false"}
                        key={`${item.key}-${index}`}
                      >
                        <span className="reel-gem">
                          <ItemArt
                            rarity={item.rarity}
                            imageUrl={item.imageUrl}
                            compact
                          />
                        </span>
                        <strong>{item.name}</strong>
                        <small>{money(item.valueCents)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : caseOpeningError ? (
            <div className="game-portal-case-opening-backdrop">
              <div className="game-portal-case-opening-modal">
                <span className="game-portal-kicker">CASE OPENING</span>
                <h2>Unable to open case</h2>
                <p className="game-portal-opening-copy">{caseOpeningError}</p>
                <div className="game-portal-case-modal-actions">
                  <button
                    type="button"
                    className="game-portal-action-cancel"
                    onClick={() => setCaseOpeningError("")}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : caseOpeningReward ? (
            <div className={`fullscreen-result rarity-${rarityClass(caseOpeningReward.rarity)}`}>
              <div className="result-atmosphere"></div>

              <div className="rarity-particles" aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => (
                  <span key={index} style={{ "--particle-index": index }}></span>
                ))}
              </div>

              <div className="result-eyebrow">
                <span className="result-check">✓</span>
                REWARD UNLOCKED
              </div>

              <div className="result-art-stage">
                <div className="result-art-ring"></div>
                <div className="result-art-ring ring-two"></div>

                {caseOpeningReward.imageUrl ? (
                  <img
                    src={caseOpeningReward.imageUrl}
                    alt={caseOpeningReward.name || "Reward"}
                    className="result-item-image"
                    draggable="false"
                  />
                ) : (
                  <ItemArt rarity={caseOpeningReward.rarity} />
                )}
              </div>

              <div className="result-copy">
                <div className={`result-rarity-pill ${rarityClass(caseOpeningReward.rarity)}`}>
                  {caseOpeningReward.rarity}
                </div>

                <h1>{caseOpeningReward.name}</h1>

                <div className="result-value">
                  {money(caseOpeningReward.valueCents)}
                </div>

                <p className="result-added">
                  <span>✓</span> Added to your inventory
                </p>
              </div>

              <div className="result-actions result-actions-two-row">
                <button
                  type="button"
                  className="primary result-open-again"
                  onPointerDown={primeAudio}
                  onClick={() => {
                    setCaseOpeningReward(null);
                    setCaseOpeningError("");
                    setReelItems([]);
                    setReelTarget(null);
                    setReelAnimating(false);

                    window.setTimeout(() => {
                      void handleCaseOpen();
                    }, 50);
                  }}
                  disabled={Number(balance || 0) * 100 < Number(caseDetails?.price_cents || 0)}
                >
                  <svg className="result-button-icon result-refresh-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 11a8 8 0 0 0-14.8-4L3 9" />
                    <path d="M3 4v5h5" />
                    <path d="M4 13a8 8 0 0 0 14.8 4L21 15" />
                    <path d="M21 20v-5h-5" />
                  </svg>
                  <span>
                    {Number(balance || 0) * 100 < Number(caseDetails?.price_cents || 0)
                      ? "Insufficient balance"
                      : `Open Again · ${money(caseDetails?.price_cents)}`}
                  </span>
                </button>

                <div className="result-secondary-row">
                  <button
                    type="button"
                    className="secondary-button result-action result-action-sell"
                    onClick={() => {
                      setActionItem({
                        id: wonInventoryId,
                        name: caseOpeningReward.name,
                        rarity: caseOpeningReward.rarity,
                        value_cents: Number(caseOpeningReward.valueCents || 0),
                        image_url: caseOpeningReward.imageUrl || caseOpeningReward.image_url || "",
                        status: "owned",
                      });
                      setActionType("sell");
                    }}
                    disabled={!wonInventoryId || actionLoading}
                  >
                    <svg className="result-button-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.6 13.2 13.2 20.6a2 2 0 0 1-2.8 0L3.4 13.6a2 2 0 0 1 0-2.8L10.8 3.4a2 2 0 0 1 2.8 0l7 7a2 2 0 0 1 0 2.8Z" />
                      <circle cx="9" cy="9" r="1.7" />
                    </svg>
                    <span>Sell Item · {money(caseOpeningReward.valueCents)}</span>
                  </button>

                  <button
                    type="button"
                    className="result-back-button"
                    onClick={() => {
                      setCaseOpeningReward(null);
                      setCaseOpeningError("");
                      setCaseDetails(null);
                      setReelItems([]);
                      setReelTarget(null);
                      setReelAnimating(false);
                      setWonInventoryId(null);

                      requestAnimationFrame(() => {
                        const overlay = document.querySelector(".game-portal-overlay");
                        if (overlay) overlay.scrollTop = 0;
                      });
                    }}
                  >
                    <svg className="result-button-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 12H5" />
                      <path d="m12 19-7-7 7-7" />
                    </svg>
                    <span>Back to Cases</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {purchaseConfirmItem && typeof document !== "undefined"
        ? createPortal(
            <div className="game-portal-purchase-confirm-backdrop" onClick={closePurchaseConfirmation}>
              <div className="game-portal-purchase-confirm-modal" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="game-portal-purchase-confirm-close"
                  onClick={closePurchaseConfirmation}
                  disabled={Boolean(buyingId)}
                  aria-label="Close purchase confirmation"
                >
                  ×
                </button>

                <div className="game-portal-kicker">CONFIRM PURCHASE</div>

                <div className="game-portal-purchase-confirm-art">
                  {purchaseConfirmItem.imageUrl ? (
                    <img
                      src={purchaseConfirmItem.imageUrl}
                      alt=""
                      draggable="false"
                    />
                  ) : (
                    <span>◇</span>
                  )}
                </div>

                <h2>Buy {purchaseConfirmItem.name}?</h2>
                <p>
                  You are about to purchase this item from the Steal a Brainrot marketplace.
                </p>

                <div className="game-portal-purchase-confirm-summary">
                  <div>
                    <span>PRICE</span>
                    <strong>{money(purchaseConfirmItem.priceCents)}</strong>
                  </div>
                  <div>
                    <span>REMAINING STOCK</span>
                    <strong>{purchaseConfirmItem.stock}</strong>
                  </div>
                </div>

                <div className="game-portal-purchase-confirm-actions">
                  <button
                    type="button"
                    className="game-portal-action-cancel"
                    onClick={closePurchaseConfirmation}
                    disabled={Boolean(buyingId)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="game-portal-action-confirm"
                    onClick={() => void confirmPurchase()}
                    disabled={Boolean(buyingId)}
                  >
                    {buyingId ? "Processing..." : `Confirm Purchase · ${money(purchaseConfirmItem.priceCents)}`}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {actionItem && actionType && typeof document !== "undefined"
        ? createPortal(
            <div className="game-portal-action-modal-backdrop" onClick={closeInventoryAction}>
              <div className="game-portal-action-modal" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="game-portal-action-modal-close"
                  onClick={closeInventoryAction}
                  disabled={actionLoading}
                >
                  ×
                </button>
                <div className="game-portal-kicker">
                  {actionType === "sell" ? "SELL ITEM" : "WITHDRAW ITEM"}
                </div>
                <div className="game-portal-action-modal-art">
                  {actionItem.image_url ? (
                    <img src={actionItem.image_url} alt="" draggable="false" />
                  ) : (
                    <span>◇</span>
                  )}
                </div>
                <h2>
                  {actionType === "sell"
                    ? `Sell ${actionItem.name}?`
                    : `Withdraw ${actionItem.name}?`}
                </h2>
                <p>
                  {actionType === "sell"
                    ? `Your item will be removed from your inventory and ${money(actionItem.value_cents)} will be credited to your CaseX balance.`
                    : "Your item will be marked as withdrawal pending and staff will arrange the manual in-game delivery."}
                </p>
                <div className="game-portal-action-modal-value">
                  <span>{actionType === "sell" ? "SALE VALUE" : "ITEM VALUE"}</span>
                  <strong>{money(actionItem.value_cents)}</strong>
                </div>
                <div className="game-portal-action-modal-actions">
                  <button
                    type="button"
                    className="game-portal-action-cancel"
                    onClick={closeInventoryAction}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="game-portal-action-confirm"
                    onClick={confirmInventoryAction}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Processing..."
                      : actionType === "sell"
                        ? "Sell Item"
                        : "Confirm Withdrawal"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
