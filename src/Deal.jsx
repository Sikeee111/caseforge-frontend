import React, { useEffect, useMemo, useRef, useState } from "react";
import "./deal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const MIN_BET_CENTS = 10;
// Deal no longer has a fixed $100 maximum. The practical maximum is the
// per-item bet that produces the configured 80% maximum win chance.
const MAX_BET_CENTS = Number.MAX_SAFE_INTEGER;
const PAGE_SIZE = 48;
const DEAL_HOUSE_EDGE = 0.06;
const DEAL_RTP = 1 - DEAL_HOUSE_EDGE;
const MAX_DEAL_PROBABILITY = 0.80;
const MIN_DEAL_PROBABILITY = 0.01;
const DEAL_SPIN_DURATION_MS = 8500;

function money(cents, decimals = 2) {
  const value = Number(cents || 0) / 100;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function parseAmountCents(value) {
  const text = String(value ?? "")
    .trim()
    .replace(/^\$/, "")
    .replace(/,/g, "");

  if (!/^\d*(?:\.\d{0,2})?$/.test(text) || text === "" || text === ".") {
    return null;
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;

  const cents = Math.round(parsed * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function getMaxBetForItem(itemPriceCents) {
  if (!itemPriceCents || itemPriceCents <= 0) return 0;
  return Math.min(
    MAX_BET_CENTS,
    Math.ceil((Number(itemPriceCents) * MAX_DEAL_PROBABILITY) / DEAL_RTP)
  );
}

function getMinBetForItem(itemPriceCents) {
  if (!Number.isFinite(itemPriceCents) || itemPriceCents <= 0) return MIN_BET_CENTS;
  return Math.max(
    MIN_BET_CENTS,
    Math.ceil((Number(itemPriceCents) * MIN_DEAL_PROBABILITY) / DEAL_RTP)
  );
}

function clampBetCents(cents, itemPriceCents) {
  const min = getMinBetForItem(itemPriceCents);
  const max = getMaxBetForItem(itemPriceCents);
  if (max < min) return min;
  return Math.max(min, Math.min(max, Number(cents || min)));
}

function getProbability(betCents, itemPriceCents) {
  if (!itemPriceCents || itemPriceCents <= 0) return 0;
  const effectiveBet = clampBetCents(betCents, itemPriceCents);
  return Math.min(MAX_DEAL_PROBABILITY, (effectiveBet / itemPriceCents) * DEAL_RTP);
}

function rarityClass(rarity) {
  return String(rarity || "Common").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

function SmartItemImage({ src, alt = "", className = "" }) {
  const resolved = String(src || "").trim();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <div className={`${className} deal-item-image-fallback`} aria-hidden="true">
        ◆
      </div>
    );
  }

  return (
    <img
      className={className}
      src={resolved}
      alt={alt}
      draggable="false"
      onError={() => setFailed(true)}
    />
  );
}

function DealRing({ probability, spinning, spinTargetAngle, result }) {
  const pct = Math.max(0, Math.min(MAX_DEAL_PROBABILITY, probability)) * 100;
  // 0deg = absolute North (12 o'clock). The green segment grows clockwise.
  const endAngle = pct * 3.6;

  const ringRef = useRef(null);
  const frameRef = useRef(null);
  const lastTargetRef = useRef(null);

  const resultAngle = Number(result?.landingAngleDeg);
  const resolvedResultAngle =
    Number.isFinite(resultAngle)
      ? ((resultAngle % 360) + 360) % 360
      : 0;

  const targetAngle = Number(spinTargetAngle);
  const resolvedTargetAngle =
    Number.isFinite(targetAngle)
      ? ((targetAngle % 360) + 360) % 360
      : null;

  const setPointerAngle = (angle) => {
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.setProperty("--deal-pointer-angle", `${angle}deg`);
  };

  useEffect(() => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    // Before the server has returned the result, keep the pointer locked at
    // absolute North. This includes changing odds and the request itself.
    if (!spinning || resolvedTargetAngle == null) {
      setPointerAngle(result ? resolvedResultAngle : 0);
      if (!spinning) lastTargetRef.current = null;
      return undefined;
    }

    if (lastTargetRef.current === resolvedTargetAngle) {
      return undefined;
    }

    lastTargetRef.current = resolvedTargetAngle;
    setPointerAngle(0);

    const startedAt = performance.now();
    const totalRotation = 1080 + resolvedTargetAngle; // 3 full clockwise turns.
    const duration = DEAL_SPIN_DURATION_MS;

    const animate = (now) => {
      const linear = Math.min(1, Math.max(0, (now - startedAt) / duration));

      // Smooth physical-style deceleration: fast at first, very slow near
      // the landing point so the pointer is easy to follow.
      const eased = 1 - Math.pow(1 - linear, 3.4);
      const angle = totalRotation * eased;

      setPointerAngle(angle);

      if (linear < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
        setPointerAngle(resolvedTargetAngle);
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [spinning, resolvedTargetAngle]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const displayAngle = spinning && resolvedTargetAngle != null
    ? undefined
    : result
      ? resolvedResultAngle
      : 0;

  const status = result
    ? result.won
      ? "YOU WON"
      : "YOU LOST"
    : spinning
      ? "DEALING..."
      : "WIN CHANCE";

  return (
    <div
      ref={ringRef}
      className={`deal-ring ${spinning ? "is-spinning" : ""} ${result?.won ? "is-win" : ""} ${result && !result.won ? "is-loss" : ""}`}
      style={{
        "--deal-prob": `${pct}%`,
        "--deal-end-angle": `${endAngle}deg`,
        "--deal-pointer-angle": `${displayAngle == null ? 0 : displayAngle}deg`,
      }}
    >
      <div className="deal-ring-track" />
      <div className="deal-ring-progress" />
      <span className="deal-ring-pointer" aria-hidden="true" />

      <div className="deal-ring-center">
        <span className="deal-ring-brand">CASEX</span>
        <strong>{pct.toFixed(2)}%</strong>
        <small className={result?.won ? "win" : result ? "loss" : spinning ? "rolling" : "ready"}>
          {status}
        </small>
      </div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="deal-confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={index}
          style={{
            "--x": `${((index * 41) % 140) - 70}px`,
            "--y": `${40 + ((index * 17) % 95)}px`,
            "--r": `${(index * 37) % 260 - 130}deg`,
            "--d": `${(index % 7) * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function Deal({
  open,
  authUser,
  balance,
  onClose,
  onBalanceChange,
  onRefreshInventory,
  openAuth,
}) {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [winPopup, setWinPopup] = useState(null);
  const [betHistory, setBetHistory] = useState([]);
  const [betHistoryLoading, setBetHistoryLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("price_asc");
  const [minPrice, setMinPrice] = useState("0.10");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("0.10");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [catalogMaxPriceCents, setCatalogMaxPriceCents] = useState(0);

  const [betInput, setBetInput] = useState("10.00");
  const [loadingItems, setLoadingItems] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [spinTargetAngle, setSpinTargetAngle] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [soundOn, setSoundOn] = useState(() => {
    try {
      const saved = window.localStorage.getItem("CaseX_deal_sound");
      return saved === null ? true : saved !== "false";
    } catch {
      return true;
    }
  });
  const audioContextRef = useRef(null);
  const spinSoundTimerRef = useRef(null);
  const dealNoiseBufferRef = useRef(null);
  const wheelNoiseSourceRef = useRef(null);
  const wheelNoiseGainRef = useRef(null);
  const wheelNoiseFilterRef = useRef(null);
  const wheelSoundEndTimerRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem("CaseX_deal_sound", String(soundOn));
    } catch {
      // Ignore unavailable localStorage.
    }
  }, [soundOn]);

  useEffect(() => {
    return () => {
      if (spinSoundTimerRef.current) {
        window.cancelAnimationFrame(spinSoundTimerRef.current);
        spinSoundTimerRef.current = null;
      }
      if (wheelSoundEndTimerRef.current) {
        window.clearTimeout(wheelSoundEndTimerRef.current);
        wheelSoundEndTimerRef.current = null;
      }
      try {
        wheelNoiseSourceRef.current?.stop();
      } catch {}
      wheelNoiseSourceRef.current = null;
      wheelNoiseGainRef.current = null;
      wheelNoiseFilterRef.current = null;

      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      if (ctx && ctx.state !== "closed") {
        void ctx.close().catch(() => {});
      }
    };
  }, []);

  const selectedItem = useMemo(
    () => items.find((item) => Number(item.itemId) === Number(selectedItemId)) || items[0] || null,
    [items, selectedItemId]
  );

  const itemPriceCents = Number(selectedItem?.priceCents || 0);
  const parsedBetCents = parseAmountCents(betInput);
  const betCents = clampBetCents(parsedBetCents ?? getMinBetForItem(itemPriceCents), itemPriceCents || MAX_BET_CENTS);
  const probability = getProbability(betCents, itemPriceCents);
  const multiplier = betCents > 0 ? itemPriceCents / betCents : 0;
  const minBetForItem = getMinBetForItem(itemPriceCents);
  const maxBetForItem = getMaxBetForItem(itemPriceCents);
  const firstItemNumber = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItemNumber = Math.min(page * PAGE_SIZE, totalItems);

  const loadDealBetHistory = async () => {
    if (!authUser) {
      setBetHistory([]);
      setBetHistoryLoading(false);
      return;
    }

    setBetHistoryLoading(true);

    try {
      const response = await fetch(`${API}/api/deal/bets`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to load bet history.");
      }

      setBetHistory(Array.isArray(data.bets) ? data.bets : []);
    } catch (historyError) {
      console.error("Deal bet history load failed:", historyError);
      setBetHistory([]);
    } finally {
      setBetHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;

    void loadDealBetHistory();
    return undefined;
  }, [open, authUser?.id]);

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    let ignore = false;

    const loadItems = async () => {
      setLoadingItems(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort,
        });

        if (appliedSearch) params.set("search", appliedSearch);
        if (appliedMinPrice) params.set("minPrice", appliedMinPrice);
        if (appliedMaxPrice) params.set("maxPrice", appliedMaxPrice);

        const response = await fetch(`${API}/api/deal/items?${params.toString()}`, {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to load Deal items.");
        }

        if (ignore) return;

        const nextItems = Array.isArray(data.items) ? data.items : [];
        setItems(nextItems);
        setTotalItems(Number(data.pagination?.total || 0));
        setPageCount(Math.max(1, Number(data.pagination?.pageCount || 1)));

        const nextMax = Number(data.priceRangeCents?.max || 0);
        if (nextMax > 0) {
          setCatalogMaxPriceCents(nextMax);
          setMaxPrice((current) => current || (nextMax / 100).toFixed(2));
        }

        if (!nextItems.some((item) => Number(item.itemId) === Number(selectedItemId))) {
          setSelectedItemId(nextItems[0]?.itemId ?? null);
        }
      } catch (loadError) {
        if (loadError?.name === "AbortError") return;
        console.error("Deal item load failed:", loadError);
        if (!ignore) setError(loadError?.message || "Failed to load Deal items.");
      } finally {
        if (!ignore) setLoadingItems(false);
      }
    };

    void loadItems();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [open, page, sort, appliedSearch, appliedMinPrice, appliedMaxPrice]);

  useEffect(() => {
    if (!selectedItem) return;
    const current = parseAmountCents(betInput);
    const normalized = clampBetCents(current ?? getMinBetForItem(Number(selectedItem.priceCents)), Number(selectedItem.priceCents));

    if (current !== normalized) {
      setBetInput((normalized / 100).toFixed(2));
    }
  }, [selectedItem?.itemId, selectedItem?.priceCents]);

  useEffect(() => {
    setPage(1);
  }, [sort, appliedSearch, appliedMinPrice, appliedMaxPrice]);

  if (!open) return null;

  const setBetCents = (nextCents) => {
    const normalized = clampBetCents(nextCents, itemPriceCents || MAX_BET_CENTS);
    setBetInput((normalized / 100).toFixed(2));
    setResult(null);
    setWinPopup(null);
    setSpinTargetAngle(null);
    setError("");
  };

  const selectItem = (item) => {
    setSelectedItemId(item.itemId);
    const current = parseAmountCents(betInput) ?? getMinBetForItem(Number(item.priceCents));
    setBetInput((clampBetCents(current, Number(item.priceCents)) / 100).toFixed(2));
    setResult(null);
    setWinPopup(null);
    setSpinTargetAngle(null);
    setError("");
  };

  const resetDeal = () => {
    setBetCents(minBetForItem || MIN_BET_CENTS);
    setWinPopup(null);
    setResult(null);
    setSpinTargetAngle(null);
    setError("");
  };

  const applyFilters = () => {
    const min = parseAmountCents(minPrice);
    const max = parseAmountCents(maxPrice);

    if (min != null && max != null && min > max) {
      setError("Minimum item price cannot be higher than the maximum.");
      return;
    }

    setAppliedSearch(search.trim());
    setAppliedMinPrice((min ?? MIN_BET_CENTS) / 100);
    setAppliedMaxPrice(max == null ? "" : (max / 100).toFixed(2));
    setPage(1);
  };

  const adjustFilter = (field, factor) => {
    const setter = field === "min" ? setMinPrice : setMaxPrice;
    const raw = field === "min" ? minPrice : maxPrice;
    const current = parseAmountCents(raw);
    const fallback = field === "min" ? MIN_BET_CENTS : (catalogMaxPriceCents || MAX_BET_CENTS);
    const next = Math.max(0, Math.round((current ?? fallback) * factor));
    setter((next / 100).toFixed(2));
  };

  const getDealAudioContext = () => {
    if (!soundOn || typeof window === "undefined") return null;

    const AudioContextCtor =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextCtor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    return ctx;
  };

  const getDealNoiseBuffer = (ctx) => {
    if (!ctx || !ctx.createBuffer) return null;

    if (!dealNoiseBufferRef.current) {
      const length = Math.max(1, Math.floor(ctx.sampleRate * 0.08));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let index = 0; index < length; index += 1) {
        const envelope = 1 - index / length;
        data[index] = (Math.random() * 2 - 1) * envelope;
      }

      dealNoiseBufferRef.current = buffer;
    }

    return dealNoiseBufferRef.current;
  };

  const stopActiveWheelNoise = () => {
    const source = wheelNoiseSourceRef.current;
    const gain = wheelNoiseGainRef.current;
    const ctx = audioContextRef.current;

    if (wheelSoundEndTimerRef.current) {
      window.clearTimeout(wheelSoundEndTimerRef.current);
      wheelSoundEndTimerRef.current = null;
    }

    if (ctx && gain) {
      const now = ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value || 0.0001), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      } catch {}
    }

    if (source) {
      try {
        source.stop((ctx?.currentTime || 0) + 0.08);
      } catch {}
    }

    wheelNoiseSourceRef.current = null;
    wheelNoiseGainRef.current = null;
    wheelNoiseFilterRef.current = null;
  };

  const playDealWheelTick = (strength = 1) => {
    const ctx = getDealAudioContext();
    if (!ctx) return;

    const start = ctx.currentTime;
    const s = Math.max(0, Math.min(1, strength));

    // Softer mechanical click: a tiny wooden/plastic tick instead of the
    // harsh square-wave chirp used by the previous version.
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = "triangle";
    body.frequency.setValueAtTime(720 + s * 180, start);
    body.frequency.exponentialRampToValueAtTime(290, start + 0.045);
    bodyGain.gain.setValueAtTime(0.0001, start);
    bodyGain.gain.exponentialRampToValueAtTime(0.011 + s * 0.010, start + 0.002);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.055);
    body.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    body.start(start);
    body.stop(start + 0.06);

    // Very short filtered noise gives the click a physical edge without a
    // piercing high-frequency pop.
    const noiseBuffer = getDealNoiseBuffer(ctx);
    if (noiseBuffer) {
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = noiseBuffer;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1100 + s * 500, start);
      filter.Q.setValueAtTime(0.75, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.009 + s * 0.008, start + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(start);
      source.stop(start + 0.04);
    }
  };

  const playDealResultSound = (won) => {
    if (!soundOn) return;
    const ctx = getDealAudioContext();
    if (!ctx) return;

    const playTone = (frequency, duration, volume, delay = 0, type = "sine") => {
      const start = ctx.currentTime + delay;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.025);
    };

    if (won) {
      playTone(523.25, 0.12, 0.026);
      playTone(659.25, 0.14, 0.028, 0.055);
      playTone(783.99, 0.18, 0.03, 0.11);
      playTone(1046.5, 0.3, 0.034, 0.18);
    } else {
      playTone(280, 0.14, 0.022, 0, "triangle");
      playTone(208, 0.24, 0.024, 0.08, "triangle");
    }
  };

  const stopDealSpinSound = (won = false, playResult = true) => {
    if (spinSoundTimerRef.current) {
      window.cancelAnimationFrame(spinSoundTimerRef.current);
      spinSoundTimerRef.current = null;
    }

    stopActiveWheelNoise();

    if (!soundOn || !playResult) return;
    playDealResultSound(won);
  };

  const startDealSpinSound = (targetAngle) => {
    if (!soundOn || typeof window === "undefined") return;

    const ctx = getDealAudioContext();
    if (!ctx) return;

    stopActiveWheelNoise();

    const target = Math.max(0, Math.min(359.999999, Number(targetAngle) || 0));
    const totalRotation = 1080 + target;
    const duration = DEAL_SPIN_DURATION_MS;

    // A low mechanical wheel bed with enough volume to sit under the clicks
    // without becoming a harsh or intrusive hum.
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const length = Math.max(1, Math.floor(ctx.sampleRate * ((duration / 1000) + 0.25)));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      // Smooth, low-frequency noise rather than broadband hiss.
      const t = i / ctx.sampleRate;
      const wobble = 0.72 + 0.28 * Math.sin(t * 7.0);
      data[i] = (Math.random() * 2 - 1) * wobble;
    }

    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(0.7, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.0075, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0048, now + (duration / 1000) * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);

    wheelNoiseSourceRef.current = source;
    wheelNoiseGainRef.current = gain;
    wheelNoiseFilterRef.current = filter;
    wheelSoundEndTimerRef.current = window.setTimeout(() => stopActiveWheelNoise(), duration + 60);

    if (spinSoundTimerRef.current) {
      window.cancelAnimationFrame(spinSoundTimerRef.current);
      spinSoundTimerRef.current = null;
    }

    const startedAt = performance.now();
    let lastAngle = 0;
    let nextTickAngle = 24;

    const scheduleTick = (frameTime) => {
      const linear = Math.min(1, Math.max(0, (frameTime - startedAt) / duration));
      const eased = 1 - Math.pow(1 - linear, 3.4);
      const angle = totalRotation * eased;
      const delta = angle - lastAngle;
      lastAngle = angle;

      if (delta > 0 && angle >= nextTickAngle) {
        let ticks = 0;
        // Sparse, velocity-matched clicks. The threshold is fixed in degrees,
        // so the clicks naturally become farther apart as the pointer slows.
        while (angle >= nextTickAngle && ticks < 3) {
          const velocityFactor = Math.max(0.18, Math.min(1, delta / 3.2));
          const strength = 0.15 + velocityFactor * 0.65;
          playDealWheelTick(strength);
          nextTickAngle += 24;
          ticks += 1;
        }
      }

      if (linear < 1) {
        spinSoundTimerRef.current = window.requestAnimationFrame(scheduleTick);
      } else {
        spinSoundTimerRef.current = null;
        stopActiveWheelNoise();
      }
    };

    spinSoundTimerRef.current = window.requestAnimationFrame(scheduleTick);
  };

  const toggleSound = () => {
    setSoundOn((current) => !current);
  };

  const submitSpin = async (demo = false) => {
    if (spinning || submitting || !selectedItem) return;

    if (!demo && !authUser) {
      openAuth?.();
      return;
    }

    const currentBetCents = parseAmountCents(betInput);
    if (currentBetCents == null) {
      setError("Enter a valid bet amount.");
      return;
    }

    const normalizedBet = clampBetCents(currentBetCents, itemPriceCents);
    if (normalizedBet !== currentBetCents) {
      setBetInput((normalizedBet / 100).toFixed(2));
    }

    if (itemPriceCents < MIN_BET_CENTS) {
      setError("This item is below the $0.10 minimum value.");
      return;
    }

    // Keep the pointer locked at North while the server processes the bet.
    // The actual spin begins only after the server has accepted the wager
    // and returned the authoritative result.
    setSubmitting(true);
    setSpinning(false);
    setSpinTargetAngle(null);
    setResult(null);
    setWinPopup(null);
    setError("");

    // Prime audio from the click gesture. The actual wheel sound begins
    // only after the server confirms the bet and returns the roll.
    getDealAudioContext();

    try {
      const response = await fetch(`${API}/api/deal/${demo ? "demo" : "spin"}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: Number(selectedItem.itemId),
          betCents: normalizedBet,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Deal spin failed.");
      }

      const serverRoll = Number(data.landingAngleDeg);
      const targetAngle = Number.isFinite(serverRoll)
        ? ((serverRoll % 360) + 360) % 360
        : Math.max(
            0,
            Math.min(
              359.999999,
              Number(data.roll || 0) * 360
            )
          );

      // The server has now accepted the bet and committed the wallet debit.
      // Update the visible balance BEFORE the wheel starts moving so the UI
      // reflects the real wallet state at the exact start of the spin.
      if (!demo && data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }

      setSubmitting(false);
      setSpinTargetAngle(targetAngle);
      setSpinning(true);
      startDealSpinSound(targetAngle);

      window.setTimeout(async () => {
        setResult({
          ...data,
          landingAngleDeg: targetAngle,
        });
        if (data.won) {
          setWinPopup({
            item: data.item || selectedItem,
            betCents: Number(data.betCents || normalizedBet),
            probabilityPct: Number(data.probabilityPct || probability * 100),
            multiplier: Number(data.multiplier || multiplier),
          });
        }
        setSpinning(false);
        setSubmitting(false);
        stopDealSpinSound(Boolean(data.won));

        if (!demo) {
          if (data.won) {
            await onRefreshInventory?.().catch(() => {});
          }
          void loadDealBetHistory();
        }
      }, DEAL_SPIN_DURATION_MS);
    } catch (spinError) {
      console.error("Deal spin failed:", spinError);
      stopDealSpinSound(false, false);
        setSpinTargetAngle(null);
      setSpinning(false);
      setSubmitting(false);
      setError(spinError?.message || "Deal spin failed. Please try again.");
    }
  };

  return (
    <div className="casex-deal-page">
      <div className="casex-deal-shell">
        <header className="deal-header">
          <div className="deal-header-brand">
            <button type="button" className="deal-back" onClick={onClose} disabled={spinning || submitting}>
              ←
            </button>
            <div>
              <span className="deal-kicker">CASEX GAME</span>
              <h1>Deal</h1>
              <p>Pick an item, choose your price, and deal for the win.</p>
            </div>
          </div>
          <div className="deal-balance-card">
            <span>CASEX BALANCE</span>
            <strong>{money(Number(balance || 0) * 100)}</strong>
          </div>
        </header>

        {error && <div className="deal-message error">{error}</div>}

        <section className="deal-stage-card">
          <div className="deal-control-card">
            <div className="deal-control-title">Price</div>
            <div className="deal-price-input-wrap">
              <span>$</span>
              <input
                value={betInput}
                inputMode="decimal"
                onChange={(event) => {
                  const next = event.target.value.replace(/[^0-9.]/g, "");
                  if ((next.match(/\./g) || []).length > 1) return;
                  setBetInput(next);
                  setResult(null);
                  setWinPopup(null);
                  setError("");
                }}
                onBlur={() => {
                  const current = parseAmountCents(betInput);
                  const normalized = clampBetCents(current ?? getMinBetForItem(itemPriceCents), itemPriceCents || MAX_BET_CENTS);
                  setBetInput((normalized / 100).toFixed(2));
                }}
                disabled={!selectedItem || spinning}
              />
              <button
                type="button"
                onClick={() => setBetCents(maxBetForItem)}
                disabled={!selectedItem || spinning || !maxBetForItem}
                aria-label="Set maximum bet for 80% win chance"
                title="Set max bet (80% win chance)"
              >
                max
              </button>
            </div>

            <div className="deal-control-label-row">
              <span>Outcome</span>
              <strong>{(probability * 100).toFixed(2)}%</strong>
            </div>

            <div
              className="deal-range-wrap"
              style={{ "--deal-outcome-pct": `${Math.min(100, (probability / MAX_DEAL_PROBABILITY) * 100).toFixed(2)}%` }}
            >
              <div className="deal-outcome-bar" aria-hidden="true">
                <div className="deal-outcome-track" />
                <div className="deal-outcome-fill" />
                <div className="deal-outcome-knob" />
              </div>
              <input
                className="deal-outcome-range-input"
                type="range"
                min={Math.max(MIN_BET_CENTS, minBetForItem)}
                max={Math.max(Math.max(MIN_BET_CENTS, minBetForItem), maxBetForItem || MIN_BET_CENTS)}
                step="1"
                value={betCents}
                onChange={(event) => setBetCents(Number(event.target.value))}
                disabled={!selectedItem || spinning || maxBetForItem < minBetForItem}
                aria-label={`Outcome chance ${(probability * 100).toFixed(2)} percent`}
              />
            </div>

            <div className="deal-quick-buttons">
              <button type="button" onClick={() => setBetCents(minBetForItem)} disabled={!selectedItem || spinning}>min</button>
              <button type="button" onClick={() => setBetCents(clampBetCents(Math.ceil(itemPriceCents * 0.10 / DEAL_RTP), itemPriceCents))} disabled={!selectedItem || spinning}>10%</button>
              <button type="button" onClick={() => setBetCents(clampBetCents(Math.ceil(itemPriceCents * 0.25 / DEAL_RTP), itemPriceCents))} disabled={!selectedItem || spinning}>25%</button>
              <button type="button" onClick={() => setBetCents(clampBetCents(Math.ceil(itemPriceCents * 0.50 / DEAL_RTP), itemPriceCents))} disabled={!selectedItem || spinning}>50%</button>
              <button type="button" onClick={() => setBetCents(maxBetForItem)} disabled={!selectedItem || spinning || !maxBetForItem}>max</button>
            </div>

            <button type="button" className="deal-reset" onClick={resetDeal} disabled={spinning}>
              Reset
            </button>
          </div>

          <div className="deal-spinner-card">
            {result?.won && <Confetti />}
            <div className="deal-spinner-toolbar">
              <div className="deal-spinner-logo">✦ <span>CASEX</span></div>
              <button
                type="button"
                className="deal-sound-button"
                onClick={toggleSound}
                aria-label={soundOn ? "Mute Deal sounds" : "Enable Deal sounds"}
                title={soundOn ? "Mute Deal sounds" : "Enable Deal sounds"}
              >
                {soundOn ? "🔊" : "🔇"}
              </button>
            </div>
            <DealRing
              probability={probability}
              spinning={spinning}
              spinTargetAngle={spinTargetAngle}
              result={result}
            />
            <div className="deal-spin-actions">
              <button type="button" className="deal-spin-button" onClick={() => submitSpin(false)} disabled={spinning || submitting || !selectedItem}>
                {submitting ? "STARTING..." : spinning ? "DEALING..." : `Deal for ${money(betCents)}`}
              </button>
              <button type="button" className="deal-demo-button" onClick={() => submitSpin(true)} disabled={spinning || submitting || !selectedItem}>
                ↻ Demo
              </button>
            </div>
          </div>

          <div className="deal-result-card">
            <button
              type="button"
              className="deal-result-eye"
              onClick={() => selectedItem && setPreviewItem(selectedItem)}
              disabled={!selectedItem}
              aria-label={selectedItem ? `Preview ${selectedItem.name}` : "No item selected"}
              title={selectedItem ? "Preview item" : "No item selected"}
            >
              ◉
            </button>
            {selectedItem ? (
              <>
                <div className="deal-result-image">
                  <SmartItemImage src={selectedItem.imageUrl} alt="" />
                </div>
                <div className="deal-result-name">{selectedItem.name}</div>
                {result && (
                  <div className={`deal-result-status ${result.won ? "win" : "loss"}`}>
                    {result.won ? "Item added to your inventory" : "No item won this round"}
                  </div>
                )}
                <div className="deal-result-bottom">
                  <strong>{money(selectedItem.priceCents)}</strong>
                  <b>x{multiplier.toFixed(2)}</b>
                </div>
              </>
            ) : (
              <div className="deal-result-empty">Select an item below.</div>
            )}
          </div>
        </section>

        <section className="deal-browser">
          <div className="deal-browser-controls">
            <div className="deal-search-wrap">
              <span>⌕</span>
              <input
                value={search}
                placeholder="Search"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
              />
            </div>

            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="price_asc">Price Low to High</option>
              <option value="price_desc">Price High to Low</option>
              <option value="name_asc">Name A to Z</option>
              <option value="name_desc">Name Z to A</option>
            </select>

            <div className="deal-filter-group">
              <span>min</span>
              <input
                value={minPrice}
                placeholder="$0.10"
                inputMode="decimal"
                onChange={(event) => setMinPrice(event.target.value.replace(/[^0-9.]/g, ""))}
              />
              <button type="button" onClick={() => adjustFilter("min", 0.5)}>1/2x</button>
              <button type="button" onClick={() => adjustFilter("min", 2)}>2x</button>
            </div>

            <div className="deal-filter-group">
              <span>max</span>
              <input
                value={maxPrice}
                placeholder={catalogMaxPriceCents ? money(catalogMaxPriceCents) : "$—"}
                inputMode="decimal"
                onChange={(event) => setMaxPrice(event.target.value.replace(/[^0-9.]/g, ""))}
              />
              <button type="button" onClick={() => adjustFilter("max", 0.5)}>1/2x</button>
              <button type="button" onClick={() => adjustFilter("max", 2)}>2x</button>
            </div>

            <button type="button" className="deal-filter-apply" onClick={applyFilters} disabled={loadingItems}>
              Apply
            </button>
          </div>

          <div className="deal-browser-meta">
            <span>
              Showing {firstItemNumber}-{lastItemNumber} of {totalItems.toLocaleString()}
            </span>
            <div className="deal-pagination">
              <button
                type="button"
                disabled={page <= 1 || loadingItems}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount || loadingItems}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              >
                Next
              </button>
            </div>
          </div>

          {loadingItems ? (
            <div className="deal-empty-state">
              <div className="deal-spinner-loader" />
              <strong>Loading items</strong>
              <span>Finding available Deal items...</span>
            </div>
          ) : items.length ? (
            <div className="deal-item-grid">
              {items.map((item) => {
                const active = Number(item.itemId) === Number(selectedItemId);
                return (
                  <article
                    key={item.itemId}
                    className={`deal-item-card ${active ? "selected" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectItem(item);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="deal-item-eye"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewItem(item);
                      }}
                      aria-label={`Preview ${item.name}`}
                      title="Preview item"
                    >
                      ◉
                    </button>
                    <div className="deal-item-art">
                      <SmartItemImage src={item.imageUrl} alt="" />
                    </div>
                    <div className={`deal-item-rarity rarity-${rarityClass(item.rarity)}`}>
                      {item.rarity || "Common"}
                    </div>
                    <div className="deal-item-copy">
                      <strong>{item.name}</strong>
                      <span>Value {money(item.priceCents)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="deal-empty-state">
              <strong>No Deal items found</strong>
              <span>Try a different search or price range.</span>
            </div>
          )}
        </section>

        <section className="deal-bet-history" aria-label="Your Deal bet history">
          <div className="deal-bet-history-head">
            <div>
              <span className="deal-bet-history-kicker">YOUR ACTIVITY</span>
              <h2>Your Bet History</h2>
              <p>Your recent Deal bets appear here automatically.</p>
            </div>
            {authUser && (
              <button
                type="button"
                className="deal-bet-history-refresh"
                onClick={loadDealBetHistory}
                disabled={betHistoryLoading}
              >
                {betHistoryLoading ? "Refreshing..." : "Refresh"}
              </button>
            )}
          </div>

          {!authUser ? (
            <div className="deal-bet-history-empty">
              <strong>Sign in to view your bets.</strong>
              <span>Your completed Deal rounds will appear here.</span>
              <button type="button" onClick={() => openAuth?.()}>Log in</button>
            </div>
          ) : betHistoryLoading && !betHistory.length ? (
            <div className="deal-bet-history-empty">
              <strong>Loading bet history...</strong>
              <span>Fetching your latest Deal rounds.</span>
            </div>
          ) : betHistory.length ? (
            <div className="deal-bet-history-table-wrap">
              <div className="deal-bet-history-table">
                <div className="deal-bet-history-row deal-bet-history-head-row">
                  <span>ITEM</span>
                  <span>BET</span>
                  <span>CHANCE</span>
                  <span>MULTIPLIER</span>
                  <span>RESULT</span>
                  <span>DATE</span>
                </div>
                {betHistory.map((bet) => {
                  const chance = Number(bet.probabilityPct || 0);
                  const multiplierValue = Number(bet.multiplier || 0);
                  const won = Boolean(bet.won);
                  const createdAt = bet.createdAt ? new Date(bet.createdAt) : null;
                  const dateLabel = createdAt && !Number.isNaN(createdAt.getTime())
                    ? createdAt.toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <div className="deal-bet-history-row" key={bet.id}>
                      <span className="deal-history-item-cell">
                        <div className="deal-history-item-art">
                          <SmartItemImage src={bet.imageUrl} alt="" />
                        </div>
                        <div>
                          <strong>{bet.name || "Deal item"}</strong>
                          <small>{bet.rarity || "Common"}</small>
                        </div>
                      </span>
                      <span>{money(bet.betCents)}</span>
                      <span>{chance.toFixed(2)}%</span>
                      <span className="deal-history-multiplier">x{multiplierValue.toFixed(2)}</span>
                      <span className={won ? "deal-history-result won" : "deal-history-result lost"}>
                        {won ? "WON" : "LOST"}
                      </span>
                      <span className="deal-history-date">{dateLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="deal-bet-history-empty">
              <strong>No bets yet.</strong>
              <span>Your completed Deal rounds will appear here.</span>
            </div>
          )}
        </section>

        {previewItem && (
          <div
            className="deal-preview-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPreviewItem(null);
            }}
          >
            <div className="deal-preview-modal" role="dialog" aria-modal="true" aria-label={`Preview ${previewItem.name}`}>
              <button
                type="button"
                className="deal-preview-close"
                onClick={() => setPreviewItem(null)}
                aria-label="Close item preview"
              >
                ×
              </button>
              <div className="deal-preview-image">
                <SmartItemImage src={previewItem.imageUrl} alt="" />
              </div>
              <div className={`deal-item-rarity rarity-${rarityClass(previewItem.rarity)}`}>
                {previewItem.rarity || "Common"}
              </div>
              <h3>{previewItem.name}</h3>
              <div className="deal-preview-stats">
                <div><span>Deposit value</span><strong>{money(previewItem.priceCents)}</strong></div>
                <div><span>Max bet</span><strong>{money(previewItem.maxBetCents)}</strong></div>
                <div><span>RTP</span><strong>94.00%</strong></div>
              </div>
              <button
                type="button"
                className="deal-preview-select"
                onClick={() => {
                  selectItem(previewItem);
                  setPreviewItem(null);
                }}
              >
                Select Item
              </button>
            </div>
          </div>
        )}

        {winPopup && (
          <div
            className="deal-win-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setWinPopup(null);
            }}
          >
            <div className="deal-win-modal" role="dialog" aria-modal="true" aria-label="Deal win">
              <div className="deal-win-sparkles" aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => (
                  <span
                    key={index}
                    style={{
                      "--x": `${((index * 43) % 260) - 130}px`,
                      "--y": `${45 + ((index * 19) % 150)}px`,
                      "--r": `${(index * 29) % 260 - 130}deg`,
                      "--d": `${(index % 6) * 55}ms`,
                    }}
                  />
                ))}
              </div>
              <div className="deal-win-badge">✦ DEAL COMPLETE</div>
              <h2>YOU WON!</h2>
              <p className="deal-win-subtitle">The item has been added to your inventory.</p>
              <div className="deal-win-image">
                <SmartItemImage src={winPopup.item?.imageUrl} alt="" />
              </div>
              <div className="deal-win-name">{winPopup.item?.name}</div>
              <div className="deal-win-value">
                <span>DEPOSIT VALUE</span>
                <strong>{money(winPopup.item?.priceCents)}</strong>
              </div>
              <div className="deal-win-stats">
                <div><span>BET</span><strong>{money(winPopup.betCents)}</strong></div>
                <div><span>CHANCE</span><strong>{Number(winPopup.probabilityPct || 0).toFixed(2)}%</strong></div>
                <div><span>MULTIPLIER</span><strong>x{Number(winPopup.multiplier || 0).toFixed(2)}</strong></div>
              </div>
              <button type="button" className="deal-win-continue" onClick={() => setWinPopup(null)}>Continue</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}