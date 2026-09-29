import React, { useEffect, useMemo, useRef, useState } from "react";
import "./original-games.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const CHICKEN_STEPS_CLIENT = 20;
const CHICKEN_VISIBLE_LANES = 8;

// Auto Bet pacing: keep several balls in flight without flooding the board.
// The visual ball animation lasts roughly 1.5–2.1s, so 500ms between
// authoritative wagers gives a natural 3–4 overlapping balls.
const PLINKO_AUTOBET_INTERVAL_MS = 500;

const apiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const parseAmountToCentsClient = (value) => {
  const raw = String(value ?? "").trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    return null;
  }

  const [whole, decimal = ""] = raw.split(".");
  const cents =
    Number(whole) * 100 +
    Number(decimal.padEnd(2, "0"));

  return Number.isSafeInteger(cents) && cents > 0
    ? cents
    : null;
};

const PLINKO_MIN_BET_CENTS = 1;
const PLINKO_MAX_BET_CENTS = 2500;

const COINFLIP_MIN_BET_CENTS = 10;
const COINFLIP_MAX_BET_CENTS = 10000;

const normalizeCoinflipBetInput = (value) => {
  let raw = String(value ?? "");

  // Let the user type naturally, including intermediate states such as
  // "", "0.", "0.1", "5", etc. Validation happens when the bet is placed.
  raw = raw.replace(/[^0-9.]/g, "");

  const firstDot = raw.indexOf(".");
  if (firstDot !== -1) {
    raw =
      raw.slice(0, firstDot + 1) +
      raw.slice(firstDot + 1).replace(/\./g, "");
  }

  if (raw.includes(".")) {
    const [whole, decimal] = raw.split(".");
    raw = `${whole || "0"}.${decimal.slice(0, 2)}`;
  } else {
    raw = raw.replace(/^0+(?=\d)/, "");
  }

  return raw;
};

const clampPlinkoBetInput = (value) => {
  const raw = String(value ?? "");
  if (raw === "") return "";

  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return "";

  const clamped = Math.min(25, Math.max(0.01, numeric));
  return clamped.toFixed(2).replace(/\.00$/, "");
};

const PLINKO_AUTOBET_CSS = `
/* =========================================================
   CASEX PLINKO — AUTOBET CONTROLS
   ========================================================= */
.plinko-auto-bet-card{
  margin:0;
}

.plinko-auto-controls{
  margin-top:14px;
  padding:14px;
  border:1px solid rgba(111,103,149,.20);
  border-radius:15px;
  background:linear-gradient(180deg,rgba(18,19,38,.86),rgba(9,11,20,.96));
  display:flex;
  flex-direction:column;
  gap:12px;
}

.plinko-auto-field,
.plinko-auto-rule{
  display:flex;
  flex-direction:column;
  gap:7px;
}

.plinko-auto-field label,
.plinko-auto-rule label{
  color:#d9d0f3;
  font-size:9px;
  font-weight:1000;
  letter-spacing:.9px;
}

.plinko-auto-field small{
  color:#686d80;
  font-size:8px;
  font-weight:700;
}

.plinko-auto-input-row,
.plinko-stop-input,
.plinko-percent-input{
  min-height:38px;
  height:38px;
  min-width:92px;
  display:flex;
  align-items:center;
  justify-content:stretch;
  border:1px solid rgba(93,91,126,.48);
  border-radius:10px;
  background:linear-gradient(180deg,#0a0c15 0%,#070911 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
  overflow:hidden;
  transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;
}

.plinko-percent-input:focus-within{
  border-color:rgba(151,92,255,.95);
  background:linear-gradient(180deg,#0d0b19 0%,#080911 100%);
  box-shadow:0 0 0 1px rgba(151,92,255,.18),0 0 16px rgba(126,76,222,.16),inset 0 1px 0 rgba(255,255,255,.035);
}

.plinko-auto-input-row input,
.plinko-stop-input input,
.plinko-percent-input input{
  width:100%;
  min-width:0;
  border:0;
  outline:0;
  background:transparent;
  color:#fff;
  font-size:11px;
  font-weight:900;
  padding:10px 11px;
}

.plinko-percent-input input{
  flex:1 1 auto;
  width:auto;
  min-width:0;
  padding:8px 6px 8px 11px;
  color:#f5f1ff;
  font-size:12px;
  font-weight:1000;
  line-height:1;
  text-align:left;
  appearance:textfield;
}

.plinko-percent-input input::-webkit-outer-spin-button,
.plinko-percent-input input::-webkit-inner-spin-button{
  margin:0;
  appearance:none;
}

.plinko-percent-input input:disabled{
  color:#777b8b;
}

.plinko-auto-input-row > span,
.plinko-stop-input > span,
.plinko-percent-input > span{
  flex:0 0 auto;
  padding:0 10px 0 4px;
  color:#b98aff;
  font-size:12px;
  font-weight:1000;
  line-height:1;
}

.plinko-auto-rule-row{
  display:grid;
  grid-template-columns:minmax(0,1fr) 78px;
  gap:7px;
  align-items:stretch;
}

.plinko-auto-toggle{
  display:grid;
  grid-template-columns:1fr 1fr;
  min-width:0;
  border:1px solid rgba(93,91,126,.36);
  border-radius:10px;
  overflow:hidden;
  background:#070911;
}

.plinko-auto-toggle button{
  min-width:0;
  border:0;
  border-right:1px solid rgba(93,91,126,.28);
  background:transparent;
  color:#85899a;
  font-size:9px;
  font-weight:950;
  padding:0 7px;
}

.plinko-auto-toggle button:last-child{
  border-right:0;
}

.plinko-auto-toggle button.active{
  background:rgba(126,76,222,.24);
  color:#fff;
}

.plinko-auto-toggle button:disabled,
.plinko-auto-field input:disabled,
.plinko-percent-input input:disabled,
.plinko-stop-input input:disabled{
  opacity:.48;
}

.plinko-auto-stop-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:9px;
}

.plinko-auto-start{
  width:100%;
  margin-top:2px;
}

.plinko-auto-start.stop{
  background:linear-gradient(135deg,#c03760,#8f2445);
}

.plinko-auto-remaining,
.plinko-auto-session{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:9px 11px;
  border-radius:9px;
  background:rgba(0,0,0,.18);
  border:1px solid rgba(255,255,255,.035);
}

.plinko-auto-remaining span,
.plinko-auto-session span{
  color:#727789;
  font-size:8px;
  font-weight:900;
  letter-spacing:.6px;
}

.plinko-auto-remaining strong,
.plinko-auto-session strong{
  color:#b98aff;
  font-size:11px;
  font-weight:1000;
}

.plinko-auto-session.positive strong{
  color:#5ee9b0;
}

.plinko-auto-session.negative strong{
  color:#ff5e7d;
}

@media(max-width:520px){
  .plinko-auto-rule-row,
  .plinko-auto-stop-grid{
    grid-template-columns:1fr;
  }
}

`;

const PLINKO_UNIFIED_LAYOUT_CSS = `
/* =========================================================
   CASEX PLINKO — REFERENCE TWO-COLUMN LAYOUT
   ========================================================= */
.plinko-experience-card{
  position:relative;
  display:grid !important;
  grid-template-columns:320px minmax(0,1fr) !important;
  grid-template-rows:minmax(0,1fr) auto !important;
  gap:18px !important;
  padding:22px !important;
  margin:0 !important;
  border:1px solid rgba(134,92,255,.36) !important;
  border-radius:18px !important;
  background:
    radial-gradient(circle at 78% 34%,rgba(124,66,255,.10),transparent 38%),
    linear-gradient(180deg,rgba(12,13,28,.99),rgba(6,8,17,.99)) !important;
  box-shadow:0 24px 70px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.025) !important;
  overflow:hidden;
}

/* Left column: title + tabs + controls */
.plinko-control-panel{
  grid-column:1 !important;
  grid-row:1 !important;
  display:flex !important;
  flex-direction:column !important;
  gap:12px !important;
  min-width:0 !important;
  width:auto !important;
  padding:0 !important;
  margin:0 !important;
  border:0 !important;
  background:transparent !important;
}

.plinko-unified-header{
  display:contents !important;
}

.plinko-unified-title{
  display:flex !important;
  flex-direction:column !important;
  align-items:flex-start !important;
  min-width:0 !important;
  margin:0 0 2px !important;
}

.plinko-unified-title .plinko-machine-eyebrow{
  display:block;
  margin:0 0 5px;
  color:#a97bf4;
  font-size:9px;
  font-weight:1000;
  letter-spacing:1.4px;
}

.plinko-unified-title-row{
  display:flex;
  align-items:center;
  gap:10px;
}

.plinko-unified-title h1{
  margin:0;
  color:#fff;
  font-size:34px;
  line-height:1;
  letter-spacing:-1.5px;
  font-weight:1000;
}

.plinko-unified-title p{
  margin:8px 0 0;
  color:#777c91;
  font-size:11px;
  font-weight:700;
}

/* Move Manual/Auto directly under the title, like the reference. */
.plinko-unified-mode-tabs{
  grid-column:1 !important;
  grid-row:1 !important;
  width:100%;
  display:grid;
  grid-template-columns:1fr 1fr;
  min-width:0;
  padding:3px;
  border:1px solid rgba(92,88,130,.34);
  border-radius:11px;
  background:#070912;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
}

.plinko-unified-mode-tabs button{
  min-height:40px;
  border:0;
  border-radius:8px;
  background:transparent;
  color:#73788a;
  font-size:10px;
  font-weight:1000;
  cursor:pointer;
}

.plinko-unified-mode-tabs button.active{
  color:#fff;
  background:linear-gradient(135deg,#7138dc,#a65aff);
  box-shadow:0 7px 18px rgba(132,72,241,.25),inset 0 1px 0 rgba(255,255,255,.12);
}

.plinko-unified-mode-tabs button:disabled{
  cursor:default;
}

/* The title and mode tabs are visually part of the left column. */
.plinko-control-panel > .plinko-unified-title,
.plinko-control-panel > .plinko-unified-mode-tabs{
  order:0;
}

.plinko-control-panel > .plinko-settings-panel{
  order:2;
}

.plinko-control-panel > .plinko-auto-bet-card{
  order:1;
}

/* Re-home the title and mode tabs visually using grid-area helpers. */
.plinko-unified-title{
  grid-column:1;
}

.plinko-unified-mode-tabs{
  grid-column:1;
}

.plinko-machine-panel{
  grid-column:2 !important;
  grid-row:1 !important;
  min-width:0 !important;
  width:auto !important;
  padding:0 !important;
  margin:0 !important;
  border:0 !important;
  background:transparent !important;
}

.plinko-machine-header{
  display:none !important;
}

.plinko-machine{
  position:relative;
  width:100% !important;
  height:100% !important;
  min-height:620px;
  margin:0 !important;
  padding:12px !important;
  border:1px solid rgba(89,88,126,.30) !important;
  border-radius:16px !important;
  background:linear-gradient(180deg,rgba(10,11,20,.88),rgba(5,7,13,.98)) !important;
  overflow:hidden;
}

.plinko-machine::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:radial-gradient(circle at 50% 45%,rgba(126,72,240,.075),transparent 45%);
}

.plinko-board{
  min-height:590px;
  height:100%;
  border-radius:14px !important;
}

.plinko-auto-bet-card,
.plinko-settings-panel{
  border-radius:14px !important;
}

/* Compact left-side control styling from the reference. */
.plinko-control-panel .original-games-control-card{
  padding:14px !important;
}

.plinko-control-panel .original-games-control-label{
  font-size:9px !important;
  letter-spacing:1px !important;
}

.plinko-control-panel .original-games-risk-tabs{
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
}

.plinko-control-panel .original-games-risk-tabs button{
  min-height:38px !important;
}

.plinko-control-panel .plinko-rows-control{
  padding:12px !important;
}

.plinko-control-panel .plinko-live-drops,
.plinko-control-panel .plinko-live-hint{
  display:none !important;
}

.plinko-control-note{
  display:none !important;
}

.plinko-manual-bet-card{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.plinko-bet-main-row{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:6px;
  align-items:stretch;
}

.plinko-bet-input-large{
  min-height:46px !important;
  border-radius:11px !important;
}

.plinko-bet-input-large input{
  font-size:14px !important;
  font-weight:1000 !important;
}

.plinko-bet-shortcuts{
  display:grid;
  grid-template-columns:repeat(3,auto);
  gap:2px;
  padding:2px;
  border:1px solid rgba(92,88,130,.34);
  border-radius:10px;
  background:#17192c;
}

.plinko-bet-shortcuts button{
  min-width:34px;
  border:0;
  border-radius:7px;
  background:transparent;
  color:#fff;
  font-size:9px;
  font-weight:1000;
  cursor:pointer;
}

.plinko-bet-shortcuts button:hover{
  background:rgba(132,72,241,.25);
}

.plinko-quick-bets{
  grid-template-columns:repeat(5,minmax(0,1fr)) !important;
  gap:5px !important;
}

.plinko-quick-bets button{
  min-height:32px !important;
  padding:0 4px !important;
}

.plinko-drop-button{
  min-height:44px !important;
  margin-top:1px;
}

.plinko-demo-note{
  color:#777c91;
  font-size:8px;
  font-weight:800;
  text-align:center;
}

.plinko-fast-mode{
  position:absolute;
  top:16px;
  right:18px;
  z-index:20;
  display:flex;
  align-items:center;
  gap:9px;
  color:#d8d9e7;
  font-size:10px;
  font-weight:1000;
  user-select:none;
}

.plinko-fast-toggle{
  position:relative;
  width:39px;
  height:22px;
  border:1px solid rgba(115,112,147,.42);
  border-radius:999px;
  background:#24263a;
  cursor:pointer;
  padding:0;
  box-shadow:inset 0 1px 2px rgba(0,0,0,.35);
}

.plinko-fast-toggle::after{
  content:"";
  position:absolute;
  top:3px;
  left:3px;
  width:14px;
  height:14px;
  border-radius:50%;
  background:#fff;
  box-shadow:0 2px 5px rgba(0,0,0,.35);
  transition:transform .18s ease;
}

.plinko-fast-toggle.active{
  background:linear-gradient(135deg,#7138dc,#a65aff);
  border-color:rgba(173,122,255,.65);
}

.plinko-fast-toggle.active::after{
  transform:translateX(17px);
}

/* Bottom history strip: full width like the reference. */
.plinko-bottom-history{
  grid-column:1 / -1;
  grid-row:2;
}

@media(max-width:1050px){
  .plinko-experience-card{
    grid-template-columns:290px minmax(0,1fr) !important;
    padding:18px !important;
  }
  .plinko-machine{
    min-height:560px;
  }
  .plinko-board{
    min-height:530px;
  }
}

@media(max-width:820px){
  .plinko-experience-card{
    grid-template-columns:1fr !important;
    grid-template-rows:auto auto !important;
  }
  .plinko-control-panel{
    grid-column:1 !important;
    grid-row:1 !important;
  }
  .plinko-machine-panel{
    grid-column:1 !important;
    grid-row:2 !important;
  }
  .plinko-machine{
    min-height:520px;
  }
  .plinko-board{
    min-height:490px;
  }
}
/* =========================================================
   CASEX ORIGINALS — POLISHED MY BETS RESULT MODAL
   Give Plinko result previews enough room to breathe and
   make the result card read like a premium game receipt.
========================================================= */

.original-game-result-modal.plinko{
  width:min(900px,calc(100vw - 44px)) !important;
  max-width:900px !important;
  max-height:calc(100vh - 90px) !important;
  overflow-y:auto !important;
  overflow-x:hidden !important;
  padding:28px !important;
  border-radius:22px !important;
  background:
    radial-gradient(
      circle at 50% 10%,
      rgba(132,72,241,.14),
      transparent 42%
    ),
    linear-gradient(
      180deg,
      #111320 0%,
      #0a0c15 100%
    ) !important;
  border:1px solid rgba(141,103,222,.32) !important;
  box-shadow:
    0 35px 110px rgba(0,0,0,.58),
    0 0 0 1px rgba(255,255,255,.018),
    inset 0 1px 0 rgba(255,255,255,.035) !important;
}

.original-game-result-modal.plinko .towers-result-modal-close{
  width:36px !important;
  height:36px !important;
  border-radius:10px !important;
  background:rgba(255,255,255,.045) !important;
  border:1px solid rgba(255,255,255,.08) !important;
  font-size:20px !important;
}

.original-game-result-modal.plinko .towers-result-modal-placed{
  min-height:34px !important;
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  flex-wrap:wrap !important;
  gap:6px !important;
  margin:0 38px 14px !important;
  color:#777d91 !important;
  font-size:9px !important;
}

.original-game-result-modal.plinko .towers-result-modal-placed strong{
  color:#9096aa !important;
  font-size:8px !important;
  font-weight:900 !important;
  letter-spacing:.7px !important;
  text-transform:uppercase !important;
}

.original-game-result-modal.plinko .towers-result-modal-user{
  padding:6px 9px !important;
  border-radius:8px !important;
  background:rgba(132,72,241,.10) !important;
  border:1px solid rgba(132,72,241,.20) !important;
  color:#dfd8ef !important;
  font-weight:1000 !important;
}

.original-game-result-modal.plinko .towers-result-modal-brand{
  width:max-content !important;
  margin:0 auto 18px !important;
  padding:7px 12px !important;
  border-radius:999px !important;
  background:rgba(255,255,255,.035) !important;
  border:1px solid rgba(255,255,255,.065) !important;
}

.original-game-result-modal.plinko .towers-result-modal-stats{
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:10px !important;
  margin-bottom:18px !important;
}

.original-game-result-modal.plinko .towers-result-modal-stats > div{
  min-width:0 !important;
  padding:13px 15px !important;
  border-radius:12px !important;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.045),
      rgba(255,255,255,.018)
    ) !important;
  border:1px solid rgba(255,255,255,.065) !important;
}

.original-game-result-modal.plinko .towers-result-modal-stats span{
  color:#73798c !important;
  font-size:8px !important;
  font-weight:900 !important;
  letter-spacing:1px !important;
}

.original-game-result-modal.plinko .towers-result-modal-stats strong{
  display:block !important;
  margin-top:5px !important;
  color:#f2f3f7 !important;
  font-size:15px !important;
  font-weight:1000 !important;
}

.original-game-result-modal.plinko .towers-result-modal-stats strong.win{
  color:#61e9b0 !important;
}

.original-game-result-modal.plinko .towers-result-modal-game{
  display:flex !important;
  flex-direction:column !important;
  gap:14px !important;
}

.original-game-result-modal.plinko .towers-result-modal-title{
  display:flex !important;
  align-items:center !important;
  justify-content:center !important;
  gap:9px !important;
  color:#e7dfff !important;
  font-size:14px !important;
  font-weight:1000 !important;
  letter-spacing:1.2px !important;
}

.original-game-result-modal.plinko .towers-result-modal-title span{
  color:#ab79ff !important;
}

.original-game-result-modal.plinko .original-result-plinko-board{
  min-height:430px !important;
  width:100% !important;
  box-sizing:border-box !important;
  padding:30px 34px 34px !important;
  border-radius:16px !important;
  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(132,72,241,.12),
      transparent 44%
    ),
    linear-gradient(
      160deg,
      #0e1019,
      #080a11
    ) !important;
  border:1px solid rgba(102,101,142,.34) !important;
  overflow:hidden !important;
}

.original-game-result-modal.plinko .original-result-plinko-peg-row{
  width:100% !important;
  min-height:11px !important;
  gap:clamp(11px,1.55vw,23px) !important;
}

.original-game-result-modal.plinko .original-result-plinko-peg{
  width:7px !important;
  height:7px !important;
  flex:0 0 7px !important;
  background:#b69be8 !important;
  box-shadow:0 0 11px rgba(182,155,232,.38) !important;
}

.original-game-result-modal.plinko .original-result-plinko-ball{
  width:34px !important;
  height:34px !important;
  font-size:23px !important;
  color:#fff !important;
  filter:
    drop-shadow(0 0 6px rgba(255,255,255,.9))
    drop-shadow(0 0 18px rgba(174,119,255,.65)) !important;
}

.original-game-result-modal.plinko .original-result-plinko-slots{
  width:100% !important;
  display:grid !important;
  grid-template-columns:
    repeat(
      var(--history-plinko-slots),
      minmax(36px,1fr)
    ) !important;
  gap:7px !important;
  margin:0 !important;
  padding:0 2px !important;
  box-sizing:border-box !important;
}

.original-game-result-modal.plinko .original-result-plinko-slot{
  min-width:0 !important;
  min-height:49px !important;
  padding:7px 3px !important;
  box-sizing:border-box !important;
  border-radius:9px !important;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.045),
      rgba(255,255,255,.018)
    ) !important;
  border:1px solid rgba(95,100,128,.28) !important;
}

.original-game-result-modal.plinko .original-result-plinko-slot strong{
  color:#d7d9e5 !important;
  font-size:9px !important;
  font-weight:1000 !important;
  white-space:nowrap !important;
}

.original-game-result-modal.plinko .original-result-plinko-slot small{
  margin-top:3px !important;
  color:#8f6ae1 !important;
  font-size:6px !important;
  font-weight:1000 !important;
  letter-spacing:.65px !important;
  white-space:nowrap !important;
}

.original-game-result-modal.plinko .original-result-plinko-slot.selected{
  transform:translateY(-2px) !important;
  border-color:rgba(177,118,255,.75) !important;
  background:
    linear-gradient(
      180deg,
      rgba(136,74,241,.30),
      rgba(80,45,154,.17)
    ) !important;
  box-shadow:
    0 0 0 1px rgba(177,118,255,.16),
    0 0 24px rgba(132,72,241,.24),
    inset 0 1px 0 rgba(255,255,255,.08) !important;
}

.original-game-result-modal.plinko .towers-result-modal-outcome{
  min-height:52px !important;
  padding:10px 14px !important;
  border-radius:12px !important;
  display:flex !important;
  align-items:center !important;
  justify-content:space-between !important;
  gap:12px !important;
}

.original-game-result-modal.plinko .towers-result-modal-outcome strong{
  font-size:11px !important;
  font-weight:1000 !important;
  letter-spacing:.65px !important;
}

.original-game-result-modal.plinko .towers-result-modal-outcome span{
  font-size:9px !important;
  font-weight:900 !important;
}

.original-game-result-modal.plinko .towers-result-modal-summary{
  margin-top:2px !important;
  padding:12px 14px !important;
  border-radius:11px !important;
}

@media(max-width:760px){
  .original-game-result-modal.plinko{
    width:calc(100vw - 22px) !important;
    max-height:calc(100vh - 35px) !important;
    padding:18px !important;
    border-radius:18px !important;
  }

  .original-game-result-modal.plinko .towers-result-modal-stats{
    grid-template-columns:1fr !important;
  }

  .original-game-result-modal.plinko .original-result-plinko-board{
    min-height:350px !important;
    padding:24px 18px 26px !important;
  }

  .original-game-result-modal.plinko .original-result-plinko-slots{
    overflow-x:auto !important;
    grid-template-columns:
      repeat(
        var(--history-plinko-slots),
        minmax(42px,42px)
      ) !important;
    padding-bottom:3px !important;
  }
}

@media(prefers-reduced-motion:reduce){
  .original-game-result-modal.plinko .original-result-plinko-slot.selected{
    transform:none !important;
  }
}
`;

// Towers sound effects.
// Replaced with short, smooth, purpose-built UI sounds.
// Levels are intentionally restrained to avoid the harsh/choppy feeling of the previous samples.
let towersAudioContext = null;
let towersAudioMaster = null;
const towersAudioBuffers = {};
const towersAudioLoads = {};

const TOWERS_SOUND_DATA = {
  safe: "data:audio/wav;base64," + [
    "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SgBrAIoApAC4AMgA0QDTANAAxQC1AJ8AhQBmAEQAIQD9/9j/tf+U/3f/Xv9K/zv/M/8w/zX/P/9Q/2X/gP+e/7//4/8GACkATABsAIkAoQC0AMIAygDMAMcAvACsAJYAfABeAD0AGgD4/9X/s/+U/3j/YP9O/0H/Of84/z3/SP9Z/27/if+m/8f/6f8LAC0ATgBsAIcAngCwALwAwwDEAL4AswCjAI0AcwBWADYAFADz/9L/sf+U/3r/Y/9S/0b/QP9A/0b/Uf9i/3f/kf+u/87/7/8PADAATwBsAIYAmwCrALcAvAC8ALYAqgCaAIQAawBOAC8ADwDv/8//sP+U/3v/Z/9X/0z/R/9I/07/Wv9r/4D/mf+2/9T/9P8TADMAUABsAIQAmACnALEAtQC0AK4AogCRAHwAYwBHACkACgDr/8z/r/+V/33/av9c/1L/Tv9Q/1f/Y/9z/4j/of+9/9r/+f8XADUAUQBrAIEAlACiAKsArgCsAKUAmQCIAHMAWwBAACMABQDn/8r/r/+V/4D/bv9h/1n/Vf9Y/1//a/98/5H/qf/D/+D//v8aADcAUgBqAH8AkACdAKQApwClAJ0AkQCAAGsAVAA5AB0AAADk/8j/rv+X/4L/cv9m/1//Xf9f/2f/c/+E/5j/sP/K/+b/AQAdADgAUgBpAHwAjACXAJ4AoACdAJUAiQB4AGQATAAzABgA/f/i/8f/rv+Y/4X/dv9r/2X/ZP9n/2//fP+M/6D/t//Q/+v/BQAgADoAUgBnAHkAiACSAJgAmQCVAI0AgABwAFwARgAtABMA+f/f/8b/r/+a/4j/ev9x/2z/a/9v/3f/hP+U/6f/vv/W/+//CAAiADoAUQBlAHYAgwCMAJEAkgCOAIUAeQBoAFUAPwAnAA4A9v/d/8X/r/+c/4z/f/92/3L/cv92/3//i/+b/67/xP/b//T/DAAkADsAUABjAHMAfwCHAIsAigCGAH0AcQBhAE4AOQAiAAoA8//b/8X/sP+e/4//hP98/3j/ef9+/4f/k/+j/7X/yv/h//j/DgAlADsATwBhAG8AegCBAIQAgwB+AHYAaQBaAEcAMwAdAAYA8P/a/8X/sv+h/5P/if+C/3//gP+F/47/mv+q/7z/0P/l//z/EQAnADsATgBeAGsAdQB7AH4AfAB3AG4AYgBTAEEALQAYAAMA7v/Z/8X/s/+k/5f/jf+I/4b/h/+N/5X/ov+x/8L/1f/q////EwAoADsATABbAGcAcAB1AHcAdQBwAGcAWwBMADsAKAAUAAAA7P/Y/8b/tf+n/5v/k/+O/4z/jv+U/53/qf+3/8j/2v/u/wEAFQAoADoASgBYAGMAawBvAHEAbgBpAGAAVABGADUAIwAQAP7/6v/Y/8b/t/+q/5//mP+U/5P/lf+b/6T/r/+9/87/3//y/wQAFgAoADkASABVAF8AZgBpAGoAZwBiAFkATQA/ADAAHwANAPv/6f/Y/8f/uf+t/6T/nf+a/5n/nP+i/6v/tv/D/9P/5P/1/wYAGAAoADgARgBRAFoAYABjAGQAYQBbAFIARwA6ACsAGgAJAPn/6P/Y/8n/vP+x/6j/ov+g/6D/o/+p/7H/vP/J/9j/6P/4/wgAGAAoADYAQwBNAFUAWwBdAF0AWgBUAEsAQQA0ACYAFgAGAPf/5//Y/8r/vv+1/63/qP+m/6b/qf+v/7j/wv/P/93/7P/7/woAGQAnADUAQABKAFEAVQBXAFcAUwBNAEUAOwAvACEAEwAEAPX/5//Z/8z/wf+4/7L/rf+s/63/sP+2/77/yP/U/+H/7//+/wsAGQAnADMAPQBGAEwAUABRAFAATQBHAD8ANQAqAB0ADwABAPT/5//a/87/xf+9/7f/s/+y/7P/tv+8/8T/zv/Z/+X/8v8AAAwAGQAlADAAOgBBAEcASgBLAEoARgBBADkAMAAlABkADAAAAPP/5//b/9H/yP/B/7z/uf+4/7n/vf/C/8r/0//e/+n/",
    "9f8BAA0AGQAkAC4ANgA9AEIARQBFAEQAQAA7ADMAKgAgABUACQD+//P/5//d/9P/y//F/8H/vv++/7//w//I/9D/2P/i/+3/+P8CAA4AGAAiACsAMwA5AD0APwA/AD4AOgA1AC4AJQAcABIABwD9//L/6P/f/9b/z//K/8b/xP/E/8X/yf/O/9X/3f/m//D/+v8EAA4AGAAgACgALwA0ADgAOQA5ADcANAAvACgAIQAYAA8ABQD8//L/6f/h/9n/0//O/8v/yf/K/8v/z//U/9r/4v/q//P//P8FAA4AFgAeACUAKwAvADIANAAzADIALgApACMAHAAUAAwAAwD7//L/6v/j/9z/1//T/9D/z//Q/9H/1f/Z/9//5v/t//X//v8FAA0AFQAcACIAJwArAC0ALgAuACwAKQAkAB8AGAARAAkAAQD7//P/7P/l/+D/2//Y/9b/1f/V/9f/2v/f/+T/6v/x//j///8GAA0AEwAZAB8AIwAmACgAKAAoACYAIwAfABoAFAAOAAcAAAD6//T/7f/o/+P/3//c/9v/2v/b/93/4P/k/+j/7v/0//r/AAAGAAwAEgAXABsAHwAhACMAIwAiACAAHgAaABYAEQALAAUAAAD6//X/7//r/+f/5P/h/+D/4P/h/+L/5f/o/+z/8f/2//z/AAAGAAsAEAAUABcAGgAcAB0AHQAdABsAGQAVABIADQAIAAQAAAD7//b/8v/u/+v/6P/m/+X/5f/m/+j/6v/t//D/9P/5//3/AQAFAAkADQARABQAFgAXABgAGAAXABYAFAARAA4ACgAGAAIA///7//f/9P/x/+7/7f/r/+v/6//r/+3/7//x//T/9//7//7/AQAEAAgACwANABAAEQASABMAEwASABEADwANAAoABwAEAAEA///8//n/9//0//L/8f/w//D/8P/x//L/8//1//j/+v/9////AQAEAAYACAAKAAsADQANAA4ADQANAAwACgAJAAcABQADAAAA///9//v/+f/4//f/9v/1//X/9f/2//f/+P/5//v//P/+/wAAAQACAAQABQAGAAcACAAIAAgACAAIAAcABgAFAAQAAgABAAAA///+//3//P/7//v/+v/6//r/+v/7//v//P/9//7//////wAAAAABAAIAAgADAAMAAwADAAMAAwADAAIAAgABAAEAAAAAAAAAAAAAAAAA////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  ].join(""),
  mine: "data:audio/wav;base64," + [
    "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HgAuAD4ATQBdAGwAfACLAJkAqAC3AMUA0wDhAO8A/QAKARcBJAExAT4BSgFWAWIBbgF6AYUBkQGcAaYBsQG7AcUBzwHZAeMB7AH1Af4BBwIPAhcCHwInAi8CNgI9AkQCSwJSAlgCXgJkAmkCbwJ0AnkCfgKCAocCiwKPApMClgKaAp0CoAKjAqUCpwKqAqwCrQKvArACsgKzArMCtAK1ArUCtQK1ArUCtQK0ArMCswKyArACrwKuAqwCqgKoAqYCpAKiAp8CnQKaApcClAKRAo4CiwKIAoQCgQJ9AnkCdQJxAm0CaQJlAmECXAJYAlMCTwJKAkYCQQI8AjcCMgItAikCJAIfAhkCFAIPAgoCBQIAAvsB9QHwAesB5gHhAdsB1gHRAcwBxwHCAb0BtwGyAa0BqAGjAZ8BmgGVAZABiwGHAYIBfQF5AXQBcAFsAWcBYwFfAVsBVwFTAU8BTAFIAUQBQQE9AToBNwE0ATABLQErASgBJQEiASABHgEbARkBFwEVARMBEQEQAQ4BDQELAQoBCQEIAQcBBgEFAQUBBAEEAQMBAwEDAQMBAwEEAQQBBAEFAQYBBgEHAQgBCQELAQwBDQEPARABEgEUARYBGAEaARwBHgEhASMBJgEoASsBLgEwATMBNgE5AT0BQAFDAUYBSgFNAVEBVAFYAVwBYAFjAWcBawFvAXMBdwF7AX8BhAGIAYwBkAGVAZkBnQGhAaYBqgGuAbMBtwG8AcABxAHJAc0B0QHWAdoB3gHjAecB6wHvAfMB9wH8AQACBAIIAgwCDwITAhcCGwIeAiICJQIpAiwCMAIzAjYCOQI8Aj8CQgJFAkcCSgJMAk8CUQJTAlUCVwJZAlsCXQJeAmACYQJiAmQCZQJlAmYCZwJnAmgCaAJoAmgCaAJoAmcCZwJmAmUCZAJjAmICYQJfAl0CXAJaAlgCVQJTAlECTgJLAkgCRQJCAj4COwI3AjMCMAIrAicCIwIeAhoCFQIQAgsCBQIAAvoB9QHvAekB4wHdAdYB0AHJAcMBvAG1Aa0BpgGfAZcBkAGIAYABeAFwAWgBXwFXAU4BRgE9ATQBKwEiARkBEAEGAf0A8wDqAOAA1gDNAMMAuQCvAKUAmgCQAIYAfABxAGcAXABSAEcAPAAyACcAHAASAAcA/f/y/+f/3f/S/8f/vP+x/6b/m/+R/4b/e/9w/2X/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iP2N/ZP9mf2e/aT9qv2v/bX9u/3B/cf9zf3T/dn93/3m/ez98v34/f/9Bf4L/hL+GP4f/iX+LP4y/jn+QP5G/k3+U/5a/mH+Z/5u/nX+e/6C/on+j/6W/p3+o/6q/rD+t/6+/sT+y/7R/tj+3v7l/uv+8v74/v7+Bf8L/xH/GP8e/yT/Kv8w/zb/PP9C/0j/Tv9U/1r/YP9l/2v/cP92/3z/gf+G/4z/kf+W/5v/oP+l/6r/r/+0/7n/vv/C/8f/y//Q/9T/2P/d/+H/5f/p/+3/8f/0//j//P///wIABQAJAAwADwASABUAGAAbAB4AIQAjACYAKAArAC0ALwAyADQANgA4ADkAOwA9AD8AQABCAEMARABGAEcASABJAEoASwBLAEwATQBNAE4ATgBPAE8ATwBPAE8ATwBPAE8ATwBOAE4ATgBNAE0ATABLAEsASgBJAEgARwBGAEUARABCAEEAQAA/AD0APAA6ADkANwA1ADMAMgAwAC4ALAAqACgAJgAkACIAIAAeABwAGQAXABUAEwAQAA4ACwAJAAcABAACAAAA/v/7//j/9v/z//H/7v/r/+n/5v/j/+H/3v/b/9n/1v/T/9H/zv/M/8n/xv/E/8H/vv+8/7n/t/+0/7H/r/+s/6r/p/+l/6L/oP+e/5v/mf+X/5T/kv+Q/47/jP+J/4f/hf+D/4H/f/99/3z/ev94/3b/df9z/3H/cP9u/23/a/9q/2n/Z/9m/2X/ZP9j/2L/Yf9g/1//Xv9e/13/XP9c/1v/W/9a/1r/Wv9a/1n/Wf9Z/1n/",
    "Wv9a/1r/Wv9b/1v/XP9c/13/Xf9e/1//YP9h/2L/Y/9k/2X/Z/9o/2n/a/9s/27/cP9x/3P/df93/3n/e/99/3//gf+E/4b/if+L/47/kP+T/5b/mP+b/57/of+k/6f/qv+t/7H/tP+3/7v/vv/C/8X/yf/N/9D/1P/Y/9z/4P/k/+j/7P/w//T/+P/8/wAABAAIAAwAEQAVABoAHgAjACcALAAwADUAOgA+AEMASABNAFEAVgBbAGAAZQBqAG8AdAB5AH0AggCHAIwAkQCWAJsAoAClAKoArwC0ALoAvwDEAMkAzgDTANgA3QDiAOYA6wDwAPUA+gD/AAQBCQEOARIBFwEcASEBJgEqAS8BNAE4AT0BQQFGAUoBTwFTAVgBXAFgAWQBaQFtAXEBdQF5AX0BgQGFAYkBjQGRAZQBmAGcAZ8BowGmAaoBrQGwAbMBtwG6Ab0BwAHDAcUByAHLAc4B0AHTAdUB2AHaAdwB3wHhAeMB5QHnAekB6gHsAe4B7wHxAfIB9AH1AfYB9wH4AfkB+gH7AfwB/QH9Af4B/gH/Af8B/wH/Af8B/wH/Af8B/wH/Af4B/gH9Af0B/AH7AfoB+gH5AfcB9gH1AfQB8wHxAfAB7gHsAesB6QHnAeUB4wHhAd8B3QHaAdgB1gHTAdEBzgHLAckBxgHDAcABvQG6AbcBtAGwAa0BqgGmAaMBnwGcAZgBlAGRAY0BiQGFAYEBfQF5AXUBcQFtAWgBZAFgAVsBVwFTAU4BSgFFAUABPAE3ATMBLgEpASQBIAEbARYBEQEMAQcBAgH9APgA8wDuAOkA5ADfANoA1QDQAMoAxQDAALsAtgCxAKwApgChAJwAlwCSAIwAhwCCAH0AeABzAG4AaABjAF4AWQBUAE8ASgBFAEAAOwA2ADEALAAnACIAHQAZABQADwAKAAUAAQD9//j/9P/v/+v/5v/i/93/2f/V/9D/zP/I/8T/wP+8/7f/s/+w/6z/qP+k/6D/nP+Z/5X/kv+O/4v/h/+E/4H/ff96/3f/dP9x/27/a/9o/2X/Y/9g/13/W/9Y/1b/U/9R/0//TP9K/0j/Rv9E/0L/QP8//z3/O/86/zj/N/81/zT/M/8x/zD/L/8u/y3/LP8r/yv/Kv8p/yj/KP8n/yf/J/8m/yb/Jv8m/yb/Jv8m/yb/Jv8m/yb/J/8n/yf/KP8p/yn/Kv8q/yv/LP8t/y7/L/8w/zH/Mv8z/zT/Nf83/zj/Of87/zz/Pv8//0H/Qv9E/0b/R/9J/0v/Tf9P/1D/Uv9U/1b/WP9a/1z/X/9h/2P/Zf9n/2n/bP9u/3D/cv91/3f/ef98/37/gf+D/4X/iP+K/43/j/+R/5T/lv+Z/5v/nv+g/6P/pf+o/6r/rP+v/7H/tP+2/7j/u/+9/8D/wv/E/8f/yf/L/83/0P/S/9T/1v/Y/9v/3f/f/+H/4//l/+f/6f/r/+3/7v/w//L/9P/1//f/+f/6//z//f///wAAAQACAAMABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEAARABIAEgATABMAEwAUABQAFAAUABUAFQAVABUAFAAUABQAFAATABMAEwASABEAEQAQAA8ADwAOAA0ADAALAAoACAAHAAYABQADAAIAAAAAAP7//P/7//n/9//1//P/8f/v/+3/6//o/+b/5P/h/9//3P/a/9f/1P/R/8//zP/J/8b/w//A/73/uv+3/7T/sP+t/6r/pv+j/6D/nP+Z/5X/kf+O/4r/hv+C/3//e/93/3P/b/9r/2f/Y/9f/1v/V/9T/0//Sv9G/0L/Pv85/zX/Mf8s/yj/JP8f/xv/Fv8S/w3/Cf8F/wD//P73/vP+7v7q/uX+4f7c/tj+0/7P/sr+xv7B/r3+uP60/rD+q/6n/qP+nv6a/pb+kf6N/on+hf6A/nz+eP50/nD+bP5o/mT+YP5c/lj+VP5Q/k3+Sf5F/kL+Pv46/jf+NP4w/i3+Kf4m/iP+IP4d/hr+F/4U/hH+Dv4M/gn+Bv4E/gH+//38/fr9+P32/fT98v3w/e797P3q/en95/3m/eT94/3i/eH94P3f/d793f3c/dv92/3a/dr92f3Z/dn92f3Z/dn92f3Z/dr92v3b/dv93P3d/d793/3g/eH94v3k/eX95/3o/er97P3u/fD98v30/fb9+f37/f79AP4D/gb+Cf4M/g/+Ev4V/hn+HP4g/iP+J/4r/i/+M/43/jv+QP5E/kj+Tf5S/lb+W/5g/mX+av5v/nT+ev5//oX+iv6Q/pX+m/6h/qf+rf6z/rn+wP7G/sz+0/7Z/uD+5/7t/vT++/4C/wn/EP8X/x//Jv8t/zX/PP9E/0v/U/9a/2L/av9x/3n/gf+J/5H/mf+h/6n/sf+5/8L/yv/S/9r/4//r//P//P8DAAwAFAAdACUALgA2AD8ARwBQAFgAYQBqAHIAewCDAIwAlQCdAKYArgC3AMAAyADRANkA4gDqAPMA+wAEAQwBFQEdASYBLgE2AT8BRwFPAVcBYAFoAXABeAGAAYgBkAGYAZ8BpwGvAbcBvgHGAc4B1QHcAeQB6wHyAfoBAQIIAg8CFgIdAiMCKgIxAjcCPgJEAksCUQJXAl0CYwJpAm8CdQJ7AoAChgKLApEClgKbAqACpQKqAq8CtAK5Ar0CwgLGAsoCzgLSAtYC2gLeAuIC5QLpAuwC7wLyAvUC+AL7Av4CAAMDAwUDBwMKAwwDDgMPAxEDEwMUAxYDFwMYAxkDGgMbAxwDHAMdAx0DHQMdAx0DHQMdAx0DHAMcAxsDGgMaAxkDGAMWAxUDFAMSAxADDwMNAwsDCQMHAwQDAgP/Av0C+gL3AvQC8QLuAusC5wLkAuAC3QLZAtUC0QLNAskCxQLAArwCtwKzAq4CqQKkAp8CmgKVApACigKFAn8CegJ0Am4CaAJjAl0CVgJQAkoCRAI9AjcCMAIqAiMCHAIWAg8CCAIBAvoB8wHsAeQB3QHWAc4BxwHAAbgBsAGpAaEBmQGSAYoBggF6AXIBagFiAVoBUgFKAUIBOgEyASoBIgEZAREBCQEBAfgA8ADoAN8A1wDPAMYAvgC2AK0ApQCdAJQAjACDAHsAcwBqAGIAWgBSAEkAQQA5ADAAKAAgABgAEAAIAAAA+P/w/+j/4P/Z/9H/yf/B/7n/sf+q/6L/mv+T/4v/hP98/3X/bv9m/1//",
    "WP9R/0r/Q/88/zX/Lv8n/yH/Gv8T/w3/Bv8A//r+8/7t/uf+4f7b/tX+z/7K/sT+vv65/rP+rv6p/qT+n/6a/pX+kP6L/ob+gv59/nn+dP5w/mz+aP5k/mD+XP5Y/lX+Uf5O/kr+R/5E/kH+Pv47/jj+Nf4z/jD+Lv4s/in+J/4l/iP+If4f/h7+HP4b/hn+GP4X/hb+Ff4U/hP+Ev4R/hH+EP4Q/hD+EP4Q/hD+EP4Q/hD+EP4R/hH+Ev4T/hT+FP4V/hb+GP4Z/hr+G/4d/h/+IP4i/iT+Jv4o/ir+LP4u/jD+M/41/jf+Ov49/j/+Qv5F/kj+S/5O/lH+VP5X/lv+Xv5i/mX+af5s/nD+dP53/nv+f/6D/of+i/6P/pP+mP6c/qD+pP6p/q3+sv62/rv+v/7E/sn+zf7S/tf+2/7g/uX+6v7v/vT++f79/gL/B/8M/xH/Fv8c/yH/Jv8r/zD/Nf86/z//RP9J/0//VP9Z/17/Y/9o/23/cv94/33/gv+H/4z/kf+W/5v/oP+l/6r/r/+0/7n/vv/D/8f/zP/R/9b/2//f/+T/6f/t//L/9v/7////AwAHAAwAEAAUABgAHQAhACUAKQAtADEANQA5ADwAQABEAEgASwBPAFIAVgBZAFwAYABjAGYAaQBsAG8AcgB1AHgAewB9AIAAggCFAIcAigCMAI4AkACSAJQAlgCYAJoAnACdAJ8AoQCiAKMApQCmAKcAqACpAKoAqwCsAK0ArgCuAK8ArwCwALAAsACwALEAsQCxALAAsACwALAArwCvAK4ArgCtAKwArACrAKoAqQCoAKcApQCkAKMAogCgAJ8AnQCbAJoAmACWAJQAkgCQAI4AjACKAIcAhQCDAIAAfgB7AHgAdgBzAHAAbgBrAGgAZQBiAF8AXABYAFUAUgBPAEsASABEAEEAPgA6ADYAMwAvACsAKAAkACAAHAAYABUAEQANAAkABQABAP7/+v/2//H/7f/p/+X/4f/d/9j/1P/Q/8z/x//D/7//uv+2/7L/rv+p/6X/of+c/5j/lP+P/4v/h/+C/37/ev92/3H/bf9p/2X/YP9c/1j/VP9Q/0z/R/9D/z//O/83/zP/L/8r/yf/JP8g/xz/GP8U/xH/Df8J/wb/Av///vv++P70/vH+7v7q/uf+5P7h/t7+2/7Y/tX+0v7P/sz+yf7H/sT+wf6//rz+uv64/rX+s/6x/q/+rf6r/qn+p/6l/qP+of6g/p7+nf6b/pr+mf6X/pb+lf6U/pP+kv6S/pH+kP6P/o/+jv6O/o7+jf6N/o3+jf6N/o3+jf6O/o7+jv6P/o/+kP6R/pL+kv6T/pT+lf6X/pj+mf6a/pz+nf6f/qH+ov6k/qb+qP6q/qz+rv6w/rP+tf63/rr+vP6//sL+xf7H/sr+zf7Q/tP+1/7a/t3+4f7k/uj+6/7v/vL+9v76/v7+Av8G/wr/Dv8S/xb/G/8f/yP/KP8s/zH/Nf86/z//Q/9I/03/Uv9X/1z/Yf9m/2v/cP91/3v/gP+F/4r/kP+V/5v/oP+m/6v/sf+2/7z/wv/H/83/0//Z/97/5P/q//D/9v/8/wEABgAMABIAGAAeACQAKgAwADYAPABCAEgATgBUAFoAYQBnAG0AcwB5AH8AhQCLAJEAlwCdAKMAqQCvALQAugDAAMYAzADSANgA3gDjAOkA7wD1APoAAAEGAQsBEQEWARwBIQEnASwBMQE3ATwBQQFHAUwBUQFWAVsBYAFlAWoBbwF0AXgBfQGCAYYBiwGQAZQBmAGdAaEBpQGqAa4BsgG2AboBvgHCAcUByQHNAdAB1AHXAdsB3gHhAeUB6AHrAe4B8QH0AfYB+QH8Af4BAQIDAgYCCAIKAgwCDgIQAhICFAIWAhgCGQIbAhwCHgIfAiACIQIjAiQCJQIlAiYCJwIoAigCKQIpAikCKgIqAioCKgIqAioCKQIpAikCKAIoAicCJgImAiUCJAIjAiICIQIgAh4CHQIbAhoCGAIXAhUCEwIRAg8CDQILAgkCBwIFAgICAAL9AfsB+AH1AfIB8AHtAeoB5wHkAeAB3QHaAdYB0wHQAcwByAHFAcEBvQG5AbYBsgGuAaoBpQGhAZ0BmQGUAZABjAGHAYMBfgF6AXUBcAFsAWcBYgFdAVgBUwFOAUkBRAE/AToBNQEwASoBJQEgARsBFQEQAQsBBQEAAfoA9QDvAOoA5ADfANkA0wDOAMgAwwC9ALcAsgCsAKYAoACbAJUAjwCJAIQAfgB4AHIAbQBnAGEAWwBWAFAASgBEAD8AOQAzAC4AKAAiAB0AFwARAAwABgABAPz/9v/x/+v/5v/g/9v/1f/Q/8v/xf/A/7v/tf+w/6v/pv+h/5z/lv+R/4z/h/+C/37/ef90/2//av9m/2H/XP9Y/1P/T/9K/0b/Qf89/zn/Nf8w/yz/KP8k/yD/HP8Y/xT/Ef8N/wn/Bv8C//7++/73/vT+8f7u/ur+5/7k/uH+3v7b/tj+1f7T/tD+zf7L/sj+xv7D/sH+v/69/rr+uP62/rT+sv6x/q/+rf6r/qr+qP6n/qX+pP6j/qH+oP6f/p7+nf6c/pv+mv6Z/pn+mP6X/pf+lv6W/pb+lf6V/pX+lf6V/pX+lf6V/pX+lf6W/pb+lv6X/pf+mP6Y/pn+mv6b/pv+nP6d/p7+n/6g/qH+o/6k/qX+pv6o/qn+q/6s/q7+r/6x/rP+tP62/rj+uv68/r7+wP7C/sT+xv7I/sr+zP7P/tH+0/7W/tj+2v7d/t/+4v7k/uf+6f7s/u/+8f70/vf++v78/v/+Av8F/wj/C/8N/xD/E/8W/xn/HP8f/yL/Jf8o/yv/L/8y/zX/OP87/z7/Qf9E/0f/S/9O/1H/VP9X/1r/Xv9h/2T/Z/9q/23/cf90/3f/ev99/4D/g/+H/4r/jf+Q/5P/lv+Z/5z/n/+i/6X/qP+r/67/sf+0/7f/uv+9/8D/wv/F/8j/y//O/9D/0//W/9j/2//e/+D/4//l/+j/6v/t/+//8f/0//b/+P/7//3///8AAAIABQAHAAkACwANAA8AEQASABQAFgAYABoAGwAdAB8AIAAiACMAJQAmACgAKQAqACwALQAuAC8AMAAxADIANAA0ADUANgA3ADgAOQA6ADoAOwA8ADwAPQA9AD4APgA+AD8APwA/AEAAQABAAEAAQABAAEAA",
    "QABAAEAAQABAAD8APwA/AD4APgA+AD0APQA8ADwAOwA6ADoAOQA4ADgANwA2ADUANAAzADIAMQAwAC8ALgAtACwAKwAqACkAJwAmACUAIwAiACEAHwAeABwAGwAZABgAFgAVABMAEgAQAA4ADQALAAkACAAGAAQAAgABAAAA/v/8//r/+f/3//X/8//x/+//7f/r/+n/6P/m/+T/4v/g/97/3P/a/9j/1v/U/9L/0P/O/8z/yv/I/8b/xP/C/8D/vv+8/7r/uf+3/7X/s/+x/6//rf+r/6n/qP+m/6T/ov+g/5//nf+b/5n/mP+W/5T/k/+R/4//jv+M/4r/if+H/4b/hP+D/4L/gP9//33/fP97/3r/eP93/3b/df90/3L/cf9w/2//bv9t/2z/a/9r/2r/af9o/2f/Z/9m/2X/Zf9k/2T/Y/9j/2L/Yv9i/2H/Yf9h/2D/YP9g/2D/YP9g/2D/YP9g/2D/YP9h/2H/Yf9i/2L/Yv9j/2P/ZP9k/2X/Zv9m/2f/aP9p/2n/av9r/2z/bf9u/2//cP9y/3P/dP91/3f/eP95/3v/fP9+/3//gf+D/4T/hv+I/4n/i/+N/4//kf+T/5X/l/+Z/5v/nf+f/6L/pP+m/6j/q/+t/7D/sv+0/7f/uf+8/7//wf/E/8b/yf/M/8//0f/U/9f/2v/d/+D/4//m/+n/7P/v//L/9f/4//v//v8AAAMABwAKAA0AEAATABcAGgAdACEAJAAnACsALgAxADUAOAA8AD8AQgBGAEkATQBQAFQAVwBbAF4AYgBlAGgAbABvAHMAdgB6AH0AgQCEAIgAiwCPAJIAlQCZAJwAoACjAKcAqgCtALEAtAC3ALsAvgDBAMUAyADLAM4A0gDVANgA2wDeAOEA5QDoAOsA7gDxAPQA9wD6AP0AAAECAQUBCAELAQ4BEAETARYBGAEbAR4BIAEjASUBKAEqASwBLwExATMBNgE4AToBPAE+AUABQgFEAUYBSAFKAUwBTQFPAVEBUgFUAVYBVwFZAVoBWwFdAV4BXwFhAWIBYwFkAWUBZgFnAWgBaQFpAWoBawFsAWwBbQFtAW4BbgFuAW8BbwFvAW8BbwFwAXABcAFvAW8BbwFvAW8BbgFuAW4BbQFtAWwBawFrAWoBaQFoAWcBZwFmAWUBYwFiAWEBYAFfAV0BXAFbAVkBWAFWAVQBUwFRAU8BTgFMAUoBSAFGAUQBQgFAAT4BOwE5ATcBNQEyATABLQErASgBJgEjASEBHgEbARgBFgETARABDQEKAQcBBAEBAf4A+wD3APQA8QDuAOoA5wDkAOAA3QDZANYA0gDPAMsAyADEAMAAvQC5ALUAsgCuAKoApgCiAJ4AmwCXAJMAjwCLAIcAgwB/AHsAdwBzAG8AagBmAGIAXgBaAFYAUgBOAEkARQBBAD0AOQA0ADAALAAoACQAHwAbABcAEwAOAAoABgACAP//+v/2//L/7v/q/+X/4f/d/9n/1f/R/8z/yP/E/8D/vP+4/7T/sP+s/6j/pP+g/5z/mP+U/5D/jP+I/4T/gf99/3n/df9x/27/av9m/2P/X/9c/1j/Vf9R/07/Sv9H/0P/QP89/zn/Nv8z/zD/Lf8p/yb/I/8g/x3/Gv8X/xX/Ev8P/wz/Cf8H/wT/Af///vz++v73/vX+8/7w/u7+7P7q/uf+5f7j/uH+3/7d/tv+2v7Y/tb+1P7T/tH+z/7O/sz+y/7J/sj+x/7G/sT+w/7C/sH+wP6//r7+vf68/rv+u/66/rn+uf64/rj+t/63/rf+tv62/rb+tv62/rb+tv62/rb+tv62/rf+t/63/rj+uP65/rn+uv66/rv+vP68/r3+vv6//sD+wf7C/sP+xP7F/sb+x/7I/sr+y/7M/s7+z/7R/tL+1P7V/tf+2f7a/tz+3v7g/uH+4/7l/uf+6f7r/u3+7/7x/vP+9v74/vr+/P7//gH/A/8F/wj/Cv8N/w//Ev8U/xf/Gf8c/x7/If8k/yb/Kf8s/y7/Mf80/zf/Of88/z//Qv9F/0j/S/9N/1D/U/9W/1n/XP9f/2L/Zf9o/2v/bv9x/3T/d/96/33/gP+D/4b/if+M/4//kv+V/5n/nP+f/6L/pf+o/6v/rv+x/7T/t/+6/73/wP/D/8b/yf/M/8//0v/V/9j/2//e/+D/4//m/+n/7P/v//H/9P/3//r//f///wEABAAGAAkADAAOABEAEwAWABkAGwAeACAAIwAlACcAKgAsAC4AMQAzADUANwA6ADwAPgBAAEIARABGAEgASgBMAE4AUABSAFQAVgBXAFkAWwBdAF4AYABhAGMAZABmAGcAaQBqAGwAbQBuAHAAcQByAHMAdAB1AHYAdwB5AHkAegB7AHwAfQB+AH8AfwCAAIEAgQCCAIIAgwCEAIQAhACFAIUAhgCGAIYAhgCGAIcAhwCHAIcAhwCHAIcAhwCHAIcAhgCGAIYAhgCGAIUAhQCEAIQAhACDAIMAggCCAIEAgACAAH8AfgB+AH0AfAB7AHoAegB5AHgAdwB2AHUAdABzAHIAcQBwAG4AbQBsAGsAagBoAGcAZgBkAGMAYgBgAF8AXgBcAFsAWQBYAFYAVQBTAFIAUABPAE0ASwBKAEgARwBFAEMAQgBAAD4APAA7ADkANwA2ADQAMgAwAC8ALQArACkAJwAmACQAIgAgAB4AHQAbABkAFwAVABMAEgAQAA4ADAAKAAkABwAFAAMAAQAAAP///f/7//n/+P/2//T/8v/x/+//7f/r/+r/6P/m/+X/4//h/+D/3v/d/9v/2f/Y/9b/1f/T/9L/0P/P/83/zP/K/8n/yP/G/8X/xP/C/8H/wP++/73/vP+7/7r/uP+3/7b/tf+0/7P/sv+x/7D/r/+u/63/rP+s/6v/qv+p/6j/qP+n/6b/pv+l/6T/pP+j/6P/ov+i/6H/of+h/6D/oP+g/5//n/+f/5//n/+f/57/nv+e/57/nv+e/57/n/+f/5//n/+f/6D/oP+g/6D/of+h/6L/ov+j/6P/pP+k/6X/pf+m/6f/p/+o/6n/qv+r/6v/rP+t/67/r/+w/7H/sv+z/7T/tf+2/7j/uf+6/7v/vP++/7//wP/C/8P/xf/G/8f/yf/K/8z/zf/P/9H/0v/U/9X/1//Z/9r/3P/e/+D/4f/j/+X/5//p/+v/7f/u//D/8v/0//b/",
    "+P/6//z//v8AAAEAAwAFAAcACgAMAA4AEAASABQAFgAYABsAHQAfACEAIwAlACgAKgAsAC4AMQAzADUANwA5ADwAPgBAAEIARQBHAEkASwBOAFAAUgBUAFcAWQBbAF0AXwBiAGQAZgBoAGoAbQBvAHEAcwB1AHcAeQB7AH4AgACCAIQAhgCIAIoAjACOAJAAkgCUAJYAmACaAJwAnQCfAKEAowClAKcAqACqAKwArgCvALEAswC0ALYAtwC5ALsAvAC+AL8AwQDCAMMAxQDGAMcAyQDKAMsAzADOAM8A0ADRANIA0wDUANUA1gDXANgA2QDaANsA3ADcAN0A3gDeAN8A4ADgAOEA4QDiAOIA4wDjAOQA5ADkAOUA5QDlAOUA5QDlAOUA5gDmAOYA5QDlAOUA5QDlAOUA5ADkAOQA4wDjAOMA4gDiAOEA4QDgAN8A3wDeAN0A3QDcANsA2gDZANgA1wDWANUA1ADTANIA0QDQAM8AzQDMAMsAygDIAMcAxQDEAMIAwQC/AL4AvAC7ALkAtwC1ALQAsgCwAK4ArACrAKkApwClAKMAoQCfAJ0AmgCYAJYAlACSAJAAjQCLAIkAhwCEAIIAfwB9AHsAeAB2AHMAcQBuAGwAaQBnAGQAYQBfAFwAWQBXAFQAUQBPAEwASQBGAEQAQQA+ADsAOAA2ADMAMAAtACoAJwAkACIAHwAcABkAFgATABAADQAKAAcABAABAP///P/5//b/8//w/+3/6v/n/+X/4v/f/9z/2f/W/9P/0P/N/8r/x//E/8H/vv+7/7j/tf+y/7D/rf+q/6f/pP+h/57/nP+Z/5b/k/+Q/47/i/+I/4b/g/+A/33/e/94/3b/c/9w/27/a/9p/2b/ZP9h/1//XP9a/1j/Vf9T/1H/Tv9M/0r/R/9F/0P/Qf8//z3/O/84/zb/NP8y/zD/L/8t/yv/Kf8n/yX/JP8i/yD/Hv8d/xv/Gv8Y/xb/Ff8T/xL/Ef8P/w7/Df8L/wr/Cf8I/wf/Bf8E/wP/Av8B/wD///7+/v7+/f78/vv++/76/vn++f74/vf+9/72/vb+9v71/vX+9f70/vT+9P70/vT+8/7z/vP+8/7z/vP+9P70/vT+9P70/vX+9f71/vb+9v73/vf++P74/vn++f76/vv++/78/v3+/v7+/v/+AP8B/wL/A/8E/wX/Bv8H/wn/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IgAjACQAJQAmACgAKQAqACsALAAtAC4AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcARwBIAEkASgBLAEwATABNAE4ATwBQAFAAUQBSAFIAUwBUAFQAVQBWAFYAVwBYAFgAWQBZAFoAWgBbAFsAXABcAF0AXQBeAF4AXwBfAF8AYABgAGAAYQBhAGEAYgBiAGIAYgBjAGMAYwBjAGMAYwBkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABkAGQAZABjAGMAYwBjAGMAYwBiAGIAYgBiAGEAYQBhAGAAYABgAF8AXwBfAF4AXgBdAF0AXABcAFwAWwBbAFoAWQBZAFgAWABXAFcAVgBVAFUAVABTAFMAUgBRAFEAUABPAE8ATgBNAEwATABLAEoASQBIAEcARwBGAEUARABDAEIAQQBAAEAAPwA+AD0APAA7ADoAOQA4ADcANgA1ADQAMwAyADEAMAAvAC4ALQAsACsAKQAoACcAJgAlACQAIwAiACEAIAAeAB0AHAAbABoAGQAYABYAFQAUABMAEgARAA8ADgANAAwACwAKAAgABwAGAAUABAADAAEAAAAAAP///v/8//v/+v/5//j/9//1//T/8//y//H/8P/u/+3/7P/r/+r/6f/o/+f/5f/k/+P/4v/h/+D/3//e/93/3P/b/9n/2P/X/9b/1f/U/9P/0v/R/9D/z//O/83/zP/L/8r/yf/I/8j/x//G/8X/xP/D/8L/wf/A/8D/v/++/73/vP+7/7v/",
    "uv+5/7j/uP+3/7b/tf+1/7T/s/+z/7L/sf+x/7D/r/+v/67/rv+t/6z/rP+r/6v/qv+q/6n/qf+o/6j/qP+n/6f/pv+m/6b/pf+l/6T/pP+k/6T/o/+j/6P/ov+i/6L/ov+i/6H/of+h/6H/of+h/6H/oP+g/6D/oP+g/6D/oP+g/6D/oP+g/6D/oP+g/6D/of+h/6H/of+h/6H/of+i/6L/ov+i/6P/o/+j/6P/pP+k/6T/pf+l/6X/pv+m/6b/p/+n/6j/qP+o/6n/qf+q/6r/q/+r/6z/rP+t/67/rv+v/6//sP+x/7H/sv+y/7P/tP+0/7X/tv+2/7f/uP+5/7n/uv+7/7z/vP+9/77/v//A/8D/wf/C/8P/xP/F/8X/xv/H/8j/yf/K/8v/zP/N/87/zv/P/9D/0f/S/9P/1P/V/9b/1//Y/9n/2v/b/9z/3f/e/9//4P/h/+L/4//k/+X/5v/n/+j/6f/q/+v/7f/u/+//8P/x//L/8//0//X/9v/3//j/+f/6//v//P/9////AAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABQAFQAWABcAGAAZABoAGwAcAB0AHgAfAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC0ALgAvADAAMQAyADMAMwA0ADUANgA3ADcAOAA5ADoAOwA7ADwAPQA+AD4APwBAAEAAQQBCAEIAQwBEAEQARQBGAEYARwBHAEgASQBJAEoASgBLAEsATABMAE0ATQBOAE4ATwBPAE8AUABQAFEAUQBRAFIAUgBSAFMAUwBTAFQAVABUAFUAVQBVAFUAVQBWAFYAVgBWAFYAVgBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVgBWAFYAVgBWAFYAVQBVAFUAVQBUAFQAVABUAFMAUwBTAFIAUgBSAFEAUQBRAFAAUABQAE8ATwBOAE4ATQBNAEwATABLAEsASgBKAEkASQBIAEgARwBHAEYARQBFAEQARABDAEIAQgBBAEAAQAA/AD4APgA9ADwAOwA7ADoAOQA5ADgANwA2ADUANQA0ADMAMgAyADEAMAAvAC4ALQAtACwAKwAqACkAKAAnACcAJgAlACQAIwAiACEAIAAgAB8AHgAdABwAGwAaABkAGAAXABYAFQAUABQAEwASABEAEAAPAA4ADQAMAAsACgAJAAgABwAGAAUABAADAAIAAQABAAAAAAD///7//f/8//v/+v/5//j/9//2//X/9P/z//L/8v/x//D/7//u/+3/7P/r/+r/6f/o/+j/5//m/+X/5P/j/+L/4f/h/+D/3//e/93/3P/c/9v/2v/Z/9j/2P/X/9b/1f/U/9T/0//S/9H/0f/Q/8//zv/O/83/zP/M/8v/yv/K/8n/yP/I/8f/xv/G/8X/xf/E/8P/w//C/8L/wf/B/8D/v/+//77/vv+9/73/vP+8/7z/u/+7/7r/uv+5/7n/uf+4/7j/t/+3/7f/tv+2/7b/tv+1/7X/tf+0/7T/tP+0/7P/s/+z/7P/s/+y/7L/sv+y/7L/sv+y/7H/sf+x/7H/sf+x/7H/sf+x/7H/sf+x/7H/sf+x/7H/sf+x/7H/sf+y/7L/sv+y/7L/sv+y/7L/s/+z/7P/s/+z/7T/tP+0/7T/tf+1/7X/tv+2/7b/tv+3/7f/t/+4/7j/uf+5/7n/uv+6/7v/u/+7/7z/vP+9/73/vv++/7//v//A/8D/wf/B/8L/wv/D/8P/xP/F/8X/xv/G/8f/yP/I/8n/yf/K/8v/y//M/83/zf/O/8//z//Q/9H/0f/S/9P/1P/U/9X/1v/X/9f/2P/Z/9r/2v/b/9z/3f/d/97/3//g/+H/4f/i/+P/5P/l/+X/5v/n/+j/6f/p/+r/6//s/+3/7v/u/+//8P/x//L/8//z//T/9f/2//f/+P/4//n/+v/7//z//f/+//7///8AAAAAAQACAAIAAwAEAAUABgAHAAgACAAJAAoACwAMAAwADQAOAA8AEAARABEAEgATABQAFQAVABYAFwAYABgAGQAaABsAHAAcAB0AHgAfAB8AIAAhACIAIgAjACQAJAAlACYAJgAnACgAKQApACoAKgArACwALAAtAC4ALgAvADAAMAAxADEAMgAyADMANAA0ADUANQA2ADYANwA3ADgAOAA5ADkAOgA6ADsAOwA8ADwAPAA9AD0APgA+AD4APwA/AEAAQABAAEEAQQBBAEIAQgBCAEIAQwBDAEMARABEAEQARABEAEUARQBFAEUARQBGAEYARgBGAEYARgBGAEcARwBHAEcARwBHAEcARwBHAEcARwBHAEcARwBHAEcARwBHAEcARwBHAEcARwBGAEYARgBGAEYARgBGAEUARQBFAEUARQBFAEQARABEAEQAQwBDAEMAQwBCAEIAQgBBAEEAQQBBAEAAQABAAD8APwA+AD4APgA9AD0APAA8ADwAOwA7ADoAOgA5ADkAOQA4ADgANwA3ADYANgA1ADUANAAzADMAMgAyADEAMQAwADAALwAuAC4ALQAtACwAKwArACoAKgApACgAKAAnACYAJgAlACQAJAAjACIAIgAhACAAIAAfAB4AHgAdABwAHAAbABoAGQAZABgAFwAXABYAFQAUABQAEwASABEAEQAQAA8ADwAOAA0ADAAMAAsACgAJAAkACAAHAAYABgAFAAQAAwADAAIAAQAAAAAAAAD///7//v/9//z/+//7//r/+f/4//j/9//2//b/9f/0//P/8//y//H/8P/w/+//7v/u/+3/7P/s/+v/6v/q/+n/6P/o/+f/5v/m/+X/5P/k/+P/4v/i/+H/4P/g/9//3//e/93/3f/c/9v/2//a/9r/2f/Z/9j/1//X/9b/1v/V/9X/1P/U/9P/0//S/9L/0f/R/9D/0P/P/8//zv/O/87/zf/N/8z/zP/M/8v/y//K/8r/yv/J/8n/yf/I/8j/yP/H/8f/x//G/8b/xv/F/8X/xf/F/8T/xP/E/8T/xP/D/8P/w//D/8P/wv/C/8L/wv/C/8L/wv/B/8H/wf/B/8H/wf/B/8H/wf/B/8H/wf/B/8H/wf/B/8H/wf/B/8H/wf/B/8H/wf/B/8H/wf/B/8H/wf/B/8L/wv/C/8L/wv/C/8L/",
    "w//D/8P/w//D/8T/xP/E/8T/xP/F/8X/xf/G/8b/xv/G/8f/x//H/8j/yP/I/8j/yf/J/8r/yv/K/8v/y//L/8z/zP/N/83/zf/O/87/z//P/8//0P/Q/9H/0f/S/9L/0//T/9T/1P/V/9X/1v/W/9f/1//Y/9j/2f/Z/9r/2v/b/9v/3P/d/93/3v/e/9//3//g/+H/4f/i/+L/4//k/+T/5f/l/+b/5//n/+j/6P/p/+r/6v/r/+z/7P/t/+3/7v/v/+//8P/x//H/8v/z//P/9P/1//X/9v/2//f/+P/4//n/+v/6//v//P/8//3//v/+////AAAAAAAAAQABAAIAAwADAAQABAAFAAYABgAHAAgACAAJAAoACgALAAsADAANAA0ADgAPAA8AEAAQABEAEgASABMAEwAUABUAFQAWABYAFwAYABgAGQAZABoAGgAbABwAHAAdAB0AHgAeAB8AHwAgACAAIQAhACIAIgAjACMAJAAkACUAJQAmACYAJwAnACcAKAAoACkAKQAqACoAKgArACsALAAsACwALQAtAC4ALgAuAC8ALwAvADAAMAAwADEAMQAxADEAMgAyADIAMwAzADMAMwA0ADQANAA0ADQANQA1ADUANQA1ADYANgA2ADYANgA2ADcANwA3ADcANwA3ADcANwA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA3ADcANwA3ADcANwA3ADcANgA2ADYANgA2ADYANgA1ADUANQA1ADUANAA0ADQANAAzADMAMwAzADIAMgAyADIAMQAxADEAMAAwADAAMAAvAC8ALwAuAC4ALgAtAC0ALAAsACwAKwArACsAKgAqACkAKQApACgAKAAnACcAJwAmACYAJQAlACQAJAAjACMAIwAiACIAIQAhACAAIAAfAB8AHgAeAB0AHQAcABwAGwAbABoAGgAZABkAGAAYABcAFwAWABUAFQAUABQAEwATABIAEgARABEAEAAPAA8ADgAOAA0ADQAMAAwACwAKAAoACQAJAAgACAAHAAYABgAFAAUABAAEAAMAAgACAAEAAQAAAAAAAAAAAP///v/+//3//f/8//z/+//6//r/+f/5//j/+P/3//f/9v/2//X/9P/0//P/8//y//L/8f/x//D/8P/v/+//7v/u/+3/7f/s/+z/6//r/+r/6v/p/+n/6P/o/+f/5//m/+b/5f/l/+X/5P/k/+P/4//i/+L/4f/h/+H/4P/g/9//3//f/97/3v/d/93/3f/c/9z/3P/b/9v/2//a/9r/2v/Z/9n/2f/Y/9j/2P/X/9f/1//W/9b/1v/W/9X/1f/V/9X/1P/U/9T/1P/T/9P/0//T/9P/0v/S/9L/0v/S/9H/0f/R/9H/0f/R/9H/0P/Q/9D/0P/Q/9D/0P/Q/9D/0P/P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//Q/9D/0P/Q/9D/0P/Q/9D/0P/Q/9H/0f/R/9H/0f/R/9H/0v/S/9L/0v/S/9P/0//T/9P/0//U/9T/1P/U/9T/1f/V/9X/1f/W/9b/1v/W/9f/1//X/9j/2P/Y/9j/2f/Z/9n/2v/a/9r/2//b/9v/3P/c/9z/3f/d/93/3v/e/9//3//f/+D/4P/g/+H/4f/i/+L/4v/j/+P/5P/k/+T/5f/l/+b/5v/n/+f/5//o/+j/6f/p/+r/6v/r/+v/6//s/+z/7f/t/+7/7v/v/+//8P/w//H/8f/x//L/8v/z//P/9P/0//X/9f/2//b/9//3//j/+P/5//n/+v/6//v/+//8//z//f/9//3//v/+//////8AAAAAAAAAAAEAAQACAAIAAwADAAQABAAFAAUABgAGAAcABwAHAAgACAAJAAkACgAKAAsACwAMAAwADQANAA0ADgAOAA8ADwAQABAAEAARABEAEgASABMAEwATABQAFAAVABUAFQAWABYAFwAXABcAGAAYABkAGQAZABoAGgAaABsAGwAbABwAHAAdAB0AHQAeAB4AHgAeAB8AHwAfACAAIAAgACEAIQAhACEAIgAiACIAIwAjACMAIwAkACQAJAAkACQAJQAlACUAJQAmACYAJgAmACYAJwAnACcAJwAnACcAKAAoACgAKAAoACgAKAApACkAKQApACkAKQApACkAKQApACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgApACkAKQApACkAKQApACkAKQApACgAKAAoACgAKAAoACgAJwAnACcAJwAnACcAJgAmACYAJgAmACUAJQAlACUAJQAkACQAJAAkACQAIwAjACMAIwAiACIAIgAiACEAIQAhACAAIAAgACAAHwAfAB8AHgAeAB4AHgAdAB0AHQAcABwAHAAbABsAGwAaABoAGgAZABkAGQAYABgAGAAXABcAFwAWABYAFQAVABUAFAAUABQAEwATABIAEgASABEAEQARABAAEAAPAA8ADwAOAA4ADQANAA0ADAAMAAsACwALAAoACgAJAAkACQAIAAgABwAHAAcABgAGAAUABQAFAAQABAADAAMAAwACAAIAAQABAAAAAAAAAAAAAAD////////+//7//f/9//3//P/8//v/+//7//r/+v/5//n/+f/4//j/+P/3//f/9v/2//b/9f/1//T/9P/0//P/8//z//L/8v/y//H/8f/w//D/8P/v/+//7//u/+7/7v/t/+3/7f/s/+z/7P/r/+v/6//r/+r/6v/q/+n/6f/p/+j/6P/o/+j/5//n/+f/5//m/+b/5v/l/+X/5f/l/+T/5P/k/+T/5P/j/+P/4//j/+L/4v/i/+L/4v/h/+H/4f/h/+H/4P/g/+D/4P/g/+D/3//f/9//3//f/9//3//e/97/3v/e/97/3v/e/97/3v/d/93/3f/d/93/3f/d/93/3f/d/93/3f/d/93/3P/c/9z/3P/c/9z/3P/c/9z/3P/c/9z/3P/c/9z/3P/c/9z/3P/c/9z/3P/c/93/3f/d/93/3f/d/93/3f/d/93/3f/d/93/3f/d/97/3v/e/97/3v/e/97/3v/e/9//",
    "3//f/9//3//f/9//4P/g/+D/4P/g/+D/4f/h/+H/4f/h/+H/4v/i/+L/4v/i/+P/4//j/+P/5P/k/+T/5P/k/+X/5f/l/+X/5v/m/+b/5v/n/+f/5//n/+j/6P/o/+j/6f/p/+n/6f/q/+r/6v/r/+v/6//r/+z/7P/s/+3/7f/t/+3/7v/u/+7/7//v/+//8P/w//D/8f/x//H/8v/y//L/8v/z//P/8//0//T/9P/1//X/9f/2//b/9v/3//f/9//4//j/+P/5//n/+f/6//r/+v/7//v/+//8//z//P/9//3//f/+//7//v////////8AAAAAAAAAAAAAAAABAAEAAQACAAIAAgADAAMAAwAEAAQABAAFAAUABQAGAAYABgAHAAcABwAIAAgACAAJAAkACQAJAAoACgAKAAsACwALAAwADAAMAAwADQANAA0ADgAOAA4ADgAPAA8ADwAQABAAEAAQABEAEQARABEAEgASABIAEgATABMAEwATABQAFAAUABQAFQAVABUAFQAVABYAFgAWABYAFgAXABcAFwAXABcAGAAYABgAGAAYABgAGQAZABkAGQAZABkAGgAaABoAGgAaABoAGwAbABsAGwAbABsAGwAbABsAHAAcABwAHAAcABwAHAAcABwAHAAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHAAcABwAHAAcABwAHAAcABwAHAAcABsAGwAbABsAGwAbABsAGwAaABoAGgAaABoAGgAaABkAGQAZABkAGQAZABkAGAAYABgAGAAYABgAFwAXABcAFwAXABYAFgAWABYAFgAVABUAFQAVABUAFAAUABQAFAAUABMAEwATABMAEgASABIAEgASABEAEQARABEAEAAQABAAEAAPAA8ADwAPAA4ADgAOAA4ADgANAA0ADQAMAAwADAAMAAsACwALAAsACgAKAAoACgAJAAkACQAJAAgACAAIAAgABwAHAAcABgAGAAYABgAFAAUABQAFAAQABAAEAAMAAwADAAMAAgACAAIAAgABAAEAAQAAAAAAAAAAAAAAAAAAAAAA///////////+//7//v/9//3//f/9//z//P/8//z/+//7//v/+//6//r/+v/6//n/+f/5//n/+P/4//j/+P/3//f/9//3//f/9v/2//b/9v/1//X/9f/1//T/9P/0//T/9P/z//P/8//z//P/8v/y//L/8v/y//H/8f/x//H/8f/w//D/8P/w//D/7//v/+//7//v/+//7v/u/+7/7v/u/+7/7f/t/+3/7f/t/+3/7f/s/+z/7P/s/+z/7P/s/+z/6//r/+v/6//r/+v/6//r/+v/6v/q/+r/6v/q/+r/6v/q/+r/6v/q/+n/6f/p/+n/6f/p/+n/6f/p/+n/6f/p/+n/6f/p/+n/6f/p/+n/6f/o/+j/6P/o/+j/6P/o/+j/6P/o/+j/6P/o/+j/6P/o/+j/6P/o/+j/6P/o/+j/6f/p/+n/6f/p/+n/6f/p/+n/6f/p/+n/6f/p/+n/6f/p/+n/6f/p/+r/6v/q/+r/6v/q/+r/6v/q/+r/6v/q/+v/6//r/+v/6//r/+v/6//r/+v/7P/s/+z/7P/s/+z/7P/s/+3/7f/t/+3/7f/t/+3/7v/u/+7/7v/u/+7/7v/v/+//7//v/+//7//w//D/8P/w//D/8P/x//H/8f/x//H/8f/y//L/8v/y//L/8v/z//P/8//z//P/9P/0//T/9P/0//T/9f/1//X/9f/1//b/9v/2//b/9v/3//f/9//3//f/+P/4//j/+P/4//n/+f/5//n/+v/6//r/+v/6//v/+//7//v/+//8//z//P/8//z//f/9//3//f/9//7//v/+//7//////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAAEAAQABAAIAAgACAAIAAgADAAMAAwADAAMABAAEAAQABAAEAAUABQAFAAUABQAGAAYABgAGAAYABgAHAAcABwAHAAcACAAIAAgACAAIAAgACQAJAAkACQAJAAkACgAKAAoACgAKAAoACwALAAsACwALAAsACwAMAAwADAAMAAwADAAMAA0ADQANAA0ADQANAA0ADQAOAA4ADgAOAA4ADgAOAA4ADwAPAA8ADwAPAA8ADwAPAA8ADwAQABAAEAAQABAAEAAQABAAEAAQABAAEAARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQARABEAEQAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAA8ADwAPAA8ADwAPAA8ADwAPAA8ADgAOAA4ADgAOAA4ADgAOAA4ADgANAA0ADQANAA0ADQANAA0ADQAMAAwADAAMAAwADAAMAAwACwALAAsACwALAAsACwAKAAoACgAKAAoACgAKAAoACQAJAAkACQAJAAkACQAIAAgACAAIAAgACAAIAAcABwAHAAcABwAHAAYABgAGAAYABgAGAAYABQAFAAUABQAFAAUABQAEAAQABAAEAAQABAADAAMAAwADAAMAAwADAAIAAgACAAIAAgACAAEAAQABAAEAAQABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////7//v/+//7//v/+//7//f/9//3//f/9//3//f/8//z//P/8//z//P/8//z/+//7//v/+//7//v/+//7//r/+v/6//r/+v/6//r/+v/5//n/+f/5//n/+f/5//n/+f/4//j/+P/4//j/+P/4//j/+P/3//f/9//3//f/9//3//f/9//3//f/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//T/9P/0//T/9P/0//T/",
    "9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//z//P/8//0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9P/0//T/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//X/9f/1//b/9v/2//b/9v/2//b/9v/2//b/9v/2//b/9v/3//f/9//3//f/9//3//f/9//3//f/9//3//j/+P/4//j/+P/4//j/+P/4//j/+P/5//n/+f/5//n/+f/5//n/+f/5//n/+v/6//r/+v/6//r/+v/6//r/+v/7//v/+//7//v/+//7//v/+//7//z//P/8//z//P/8//z//P/8//z//f/9//3//f/9//3//f/9//3//f/+//7//v/+//7//v/+//7//v/+////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAQABAAEAAQABAAEAAQACAAIAAgACAAIAAgACAAIAAgACAAIAAgADAAMAAwADAAMAAwADAAMAAwADAAMAAwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////////////////////////////////7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//7//v/+//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  ].join(""),
  cashout: "data:audio/wav;base64," + [
    "UklGRqxYAQBXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYhYAQAAAAEACQAbACYAFwAjAIsA5ACgADYAfAAWAQwBngDfALYByQG4APX/VwD0AAMBzQB3AM3/FP8W/+T/KgDc/lz9n/2r/mH+Wf0y/YX9RP0c/Qn+yf50/Ub7sPvo/jwBUgBI/vj99f69//kA5gJ9A0cCXgHGAc8C8gPABOoErAQ9BMADsQNIBL8ESwQiAywCQAKMAnEBEABGAG8AuP4F/T/94P0Z/Zj7gvq3+SH5vfm0+6L8x/pd+GT4IvoK+x/7DPyR/Sb+Iv7G/qf/JAAaAdYC5wOwA+ADlgVYB5cHDwfvBuwG5AaTB5kIqQhYB5cFygQfBSQFtQOWAZ0AvgDA/6b9Ev2M/bz7VfiW91j5aflA9zf2SPc/+An4Z/eK9hf21ff9+ov8O/w0/An93/2t/uv/jgFwA0cFPAYXBr0F/gUBB2EIbAnaCbgJ2AiXB+YGBwf1B/IIRAeDAuD/dQIJBSsCUf2L/E3+U/1r+rX5Sfr5+Nn2vPaF+G75ave09IP1HfnC+lf5Kfgx+Vr7Kv0B/uX9H/5CAH4D1AQ/AwgCPwThBzAJ6QfJBt0HuQlsCYoHVgcCCWEJTAdQBTQFWAXnA6cBmgBKAfQBfwAN/f/5X/mM+h37QvpQ+VP4HPY+9Fb15fe2+Br48ff398X3z/jE+7T+eP+9/ij/UwEUA0UDcgMPBTUHDwhqB3oG5QXMBdAGnQj+CDAHsQUxBokG5wTDA4cFrgdcBjwCXf/G/2EB+gB8/pX8A/zh+mP4AfZ09aL2Sff/9Yr0yPTk9XH2yPb29wj6d/ze/oEAvwCLAFcB4QK9BCoHlgglB/AEWAU6B0YHngWmBBYFuQWaBTsFSgWOBYMF/AScBDgF2AUGBdMDiwPsAu4A4f62/YT82vpL+aH3zvXh9Nn0MfSz8h7yyvPQ9p34Rvhm+P76Sf5mABMCtANGBIEEPQZiCDwIBwbVBCUG5AdGB28EbgIRA50ECQXGBNAEcgRKA3cD8QUTCJsHLAXVAjcCKgOkA5sBH/5n/CT80Pnc9VL0ZPWt9U70IfM/80/0LfU/9fz1Zfl4/kEBKwC5/lYA6QPdBl8I6AeQBSkEFwb+CM4IgAWxAoEClwNSBP8EyQVoBagDzgI/BOEFvQV5BZ4G2AYeBAsBgwDdAKf/nv3O++j5FPgy9hT0O/Nl9En1E/Si8r/z/faF+UX69Prw/IX/hQGzAuIDpgXOBnkGJgbrBlAHMAYNBU4F0AUhBcgDXwMwBFcEQQNyA6IFwwZ0BUwE5gRnBbIEHgTfA7IC9ABf/+f8Ifqv+WP6//c586HxhfS19jP1VvMQ9PD1WfdU+Yf8BP9j/4r/ewEmBOgF0AYEB1gGkQW0BXcGzAZXBm0FRQRSA0gD+ANfBDsEHQQjBHEEowX7BnwGaQRFA7QD1QOCAqgAif+H/kP8hPkJ+DL3bfWm893zXPWG9SH02PPn9W34wPmi+s78EAAcAjUCZQIWBD4GJQesBk0GpgabBswFFwWVBE0E4QQfBUwDfwE6A8oGBAe1Az0C1QRCBy4GAASxA98DXgJiAL//GP87/Jf4l/fN+Cv4mPTq8f7yjfUR9in11vUp+L/5RvrH++L+3AFHA5AD7wPcBMoFiAZWB2wHQwYiBeUEwwRkBGMEggQBBGcDrANgBI8EkAQKBVsF/QTLBDgFGAWSA8YBxwC1/8/9Ifw6++35uPem9XL0/PNI9Cv1wvWe9ZT1t/YT+ab7i/3A/gEA1AGnA5EE0gR1BbMGlQckB58FdwSsBIAFoQW6BJADHAN0A+MDCwRFBOcElwWlBfsERAQdBEAE9AMVA8gB0/+J/f37Gvuh+Zz3W/YE9n31c/TI8zH0Z/W39uv3VvkH+7T8aP41AMEB7wIVBEoFOAZ/BjsG+gX6BeoFggX0BJIESgTnA5cDhQOQA9oDmQQ1BfwEcwShBFkFZAVSBAoDPAJ1ASoAiP7b/Cv7jvkj+ND2nPXg9L703fT29FT1Tfau9zD51vqU/FD+EACpAdYC2gMCBecFHwYWBkMGXgbyBTgFsgRpBCYE5QO8A6wDxgMOBE4EagSWBOkEJgURBbgEPwSTA5oCbQEgAKb+Af1h++H5cfgX9//1QvXX9Ln09vSS9X32sPcd+bT6ZPwa/sX/UwG4AugD3ASPBQEGNgY0BgUGtQVQBeMEeQQeBNkDsAOmA7gD5AMiBGgEqwTgBPoE7gSyBEAElAOtAo8BQQDN/kD9qvsc+qb4W/dK9n/1BPXh9Bf1pPWD9qr3C/mY+j/87v2U/yABhQK3A64EZgXfBRoGHwb3BawFSwXgBHgEHQTWA6sDnQOsA9QDDgRSBJQEygTmBN0EqAQ9BJkDvAKoAWQA+v51/eX7XPrp+J73iva59Tj1C/U29bj1i/al9/v4ffob/MP9Zf/uAFMChwOBBD4FvAX+BQoG5wWiBUUF3QR3BBsE1AOmA5UDoAPEA/wDPQR+BLQE0gTNBJ0EOQSeA8oCwAGFACX/qP0f/Jv6Kvnf98n29PVr9Tb1V/XN9ZP2ovfs+GT6+fua/Tf/vQAhAlYDVAQWBZoF4gX0BdcFlwU/BdoEdQQaBNEDoQONA5UDtgPqAykEaASeBL4EvQSSBDUEogPXAtYBpQBO/9r9WPzY+mv5IPgI9y/2n/Vh9Xj14/Wd9qD33/hM+tj7c/0K/40A8AEnAygE7gR3BcUF3QXHBYwFOAXXBHMEGATPA5wDhQOKA6cD2AMVBFMEiQSqBKwEhgQwBKQD4gLrAcQAdf8J/o78FPuq+WD4Rvdp9tP1jfWa9fn1qfaf99P4Nvq5+0z93v5eAMAB+AL7A8YEVAWoBcYFtgWBBTEF0wRxBBcEzAOYA34DgAOZA8cDAQQ+BHQElgScBHoEKgSmA+0C/wHhAJv/OP7E/E775/mf+IP3ovYH9rn1vPUR9rX2oPfJ+CL6nPsn/bT+MACRAckCzwOdBDEFiwWvBaUFdAUpBc4EbwQVBMoDlAN4A3YDjAO3A+4DKgRfBIMEiwRuBCQEpwP2AhEC/ADA/2X++PyI+yT63fjA99z2O/bl9d/1KvbC9qL3wPgO+n/7A/2K/gMAYwGbAqQDdQQOBW0FlwWTBWgFIQXJBGwEEwTIA5ADcQNsA4ADpwPcAxYESwRwBHoEYQQdBKgD",
    "/wIiAhcB4/+Q/ir9v/tf+hn5/PcV9272EfYD9kP20fam97j4/fll++H8Yv7Z/zUBbgJ4A00E6wRPBX8FgAVbBRkFxARpBBEExQONA2sDYwN0A5gDygMDBDcEXARqBFUEFgSnAwYDMgIvAQQAuv5b/fb7mvpV+Tf4Tfei9j72J/Ze9uH2qvey+Oz5S/vA/Dv+rv8JAUECTQMmBMcEMQVnBW4FTQUQBb8EZgQPBMMDiQNmA1sDaAOJA7kD8AMjBEoEWQRIBA4EpgMNA0ECRwEkAOL+iv0r/NL6kPly+IX31fZr9kv2efbx9rD3rfjd+TP7ofwW/oT/3QAVAiID/gOkBBMFTgVaBT8FBgW5BGMEDQTBA4YDYANTA10DewOpA90DEAQ3BEgEOwQGBKQDEgNPAl0BQwAJ/7j9XvwK+8r5rPi99wn3mPZw9pT2A/e396r40Pkd+4L88f1c/7IA6gH4AtcDgAT1BDUFRwUxBfwEswRfBAsEvwODA1sDSwNSA24DmQPLA/0DJAQ4BC0E/QOiAxcDXAJyAWAALv/k/ZH8QfsD+uX49Pc898X2lvax9hX3v/en+MT5B/tl/M79NP+HAL8BzgKvA10E1gQcBTMFIgXyBKwEWwQIBLwDgANWA0QDSANhA4kDugPrAxIEJwQgBPQDnwMbA2cChgF8AFL/EP7C/Hb7Ovod+Sr4bvfy9rv2zvYp98j3pvi5+fT6Sfys/Q3/XgCVAaUCiAM6BLcEAgUeBRMF5wSlBFYEBQS6A30DUgM9Az8DVAN6A6kD2QMABBcEEgTrA5sDHgNyApkBlwB1/zn+8fyq+3H6VPlg+KH3H/fh9uv2PffT96b4r/nh+i/8i/3o/jYAawF8AmIDFgSYBOgECgUDBdwEngRSBAIEuAN6A00DNgM1A0gDawOYA8cD7wMGBAQE4QOXAyADfAKrAbEAlv9i/iD93fun+ov5lvjT90z3CPcK91L33veo+Kf50PoW/Gz9w/4OAEIBVAI7A/MDeQTOBPUE8wTQBJYETQT/A7UDdwNJAzADLAM9A10DiAO2A90D9gP3A9cDkgMiA4QCuwHJALb/if5N/Q/82/rA+cr4Bfh59y73KPdo9+r3qvif+b/6/vtN/aD+6f8aASwCFQPQA1oEswTfBOIExASOBEgE/AOzA3QDRQMqAyQDMgNQA3gDpQPMA+YD6QPNA40DIgOMAssB4QDV/6/+ef0//A/79fn/+Db4pvdV90f3fvf39634mfmx+uf7MP1+/sP/8wAFAu8CrQM7BJkEyQTRBLgEhQRCBPgDsANxA0EDJAMcAycDQwNpA5QDuwPWA9sDwwOHAyMDkwLZAfcA8//T/qP9bvxB+yn6Mvlo+NP3fPdn95X3Bfiy+JX5o/rS+xT9XP6e/8wA3gHKAooDHAR+BLMEwASrBHwEPAT0A60DbgM9Ax8DFAMdAzYDWwOEA6sDxgPNA7gDgQMiA5kC5gELAQ4A9v7M/Zz8c/tc+mX5mPgA+KP3h/et9xT4t/iR+Zf6vfv5/Dz+ev+mALgBpQJoA/0DYwSdBK8EngRzBDYE8AOqA2sDOgMZAw0DEwMqA0wDdAObA7YDvwOuA3sDIQOfAvMBHwEpABj/9P3J/KP7jvqX+cj4LPjK96f3xfcj+L74jvmL+qr73/wd/lf/gQCSAYACRQPdA0gEhwSdBJAEaQQwBOwDpwNoAzYDFAMFAwkDHgM+A2UDiwOnA7EDowN0AyADpAL+ATIBQwA5/xv+9fzT+8D6yPn4+Fn48vfI9973NPjF+I35gfqY+8f8//01/10AbQFcAiMDvgMtBHAEigSDBF8EKQToA6QDZgMzAxAD/wIAAxIDMQNWA3sDlwOkA5gDbQMeA6cCCQJEAVwAWf9B/iD9Afzw+vn5KPmF+Bn46ff490X4zviM+Xj6iPuv/OL9FP85AEgBOAIBA58DEgRZBHgEdARVBCIE4wOhA2MDLwMLA/gC+AIHAyQDSANsA4gDlgOMA2UDGwOrAhMCVAFzAHf/Zf5J/S78IPsp+lb5sfhA+Ar4EvhX+Nf4jflw+nj7mfzG/fT+FgAkARQC3wKAA/YDQgRlBGYESgQaBN4DnQNgAywDBgPyAu8C/QIXAzkDXQN6A4gDgQNeAxgDrQIcAmQBigCU/4n+cv1a/E77WfqF+dz4Z/gr+Cz4afjh+I75avpp+4P8q/3V/vX/AQHxAb0CYQPbAyoEUgRXBD8EEgTYA5kDXQMpAwID7ALnAvMCCwMsA04DawN7A3YDVgMVA68CJAJzAaAAsP+r/pn9hvx8+4f6s/kI+Y/4TfhH+H347PiR+WT6XPtv/JH9t/7U/98AzwGcAkMDvwMTBD8ESAQ0BAoE0wOWA1oDJQP+AuYC4ALpAv8CHgNAA1wDbQNqA00DEQOxAisCgQG0AMv/zP6//bD8qfu1+uD5M/m2+G/4YviQ+Pj4lPlf+lD7XPx4/Zn+tP+9AKwBewIkA6QD+wMrBDgEKAQCBM0DkQNWAyID+gLhAtgC3wL0AhEDMgNOA2ADXwNFAwwDsQIyAo4ByADl/+z+5P3Z/NX74voN+l353fiR+H74pfgE+Zn5W/pE+0n8YP19/pT/mwCLAVsCBQOJA+MDFwQoBBwE+QPHA40DUwMfA/YC2wLRAtYC6QIFAyQDQANSA1MDPAMIA7ICOAKaAdoA/v8K/wj+Af0A/A/7OfqI+QT5s/ia+Lr4Efme+Vn6Ovs4/En9Yf51/3sAagE6AucCbQPLAwMEGAQQBPADwQOJA1ADHAPyAtYCygLOAt4C+AIXAzMDRQNIAzQDAwOxAj0CpQHsABUAKP8r/ij9Kvw6+2T6svkq+dX4tvjP+B/5pPlX+jH7KPwz/Ub+V/9aAEkBGgLJAlIDswPvAwgEAwTnA7oDhANMAxgD7gLRAsQCxQLUAuwCCQMlAzgDPAMrA/0CsQJBAq8B/AAsAEX/Tf5O/VP8ZfuP+tv5Ufn3+NP45fgu+av5Vvoo+xn8Hv0t/jr/OwApAfsBqwI2A5sD2wP3A/YD3QOzA38DSAMVA+sCzQK9Ar0CygLhAv0CGAMrAzEDIgP4Aq8CRQK5AQwBQgBg/27+c/17/I/7uvoE+nf5Gfnv+Pv4Pfmy+Vb6IfsL/Ar9FP4e/xwACQHcAY0CGwODA8YD5wPpA9QDrAN6A0UDEgPnAsgCtwK1AsAC1QLwAgsDHwMlAxgD",
    "8gKuAkkCwgEbAVcAe/+O/pf9ovy4++P6Lfqe+Tz5DPkS+U35u/lX+hr7/vv3/Pz9Av///+oAvQFwAgADawOxA9YD3APJA6UDdQNBAw4D4wLEArECrgK3AssC5AL+AhIDGgMPA+wCqwJLAsoBKQFqAJX/rP67/cn84fsN+1X6w/le+Sr5Kfld+cT5WPoV+/L75fzl/ef+4v/MAJ4BUwLlAlMDnQPEA84DvwOdA3ADPQMLA+ACvwKsAqYCrgLAAtgC8gIGAw8DBgPlAqkCTgLSATYBfQCt/8r+3f3u/An8Nft9+un5gPlH+UH5bvnN+Vv6EPvm+9T8z/3N/sb/rgCAATYCygI6A4gDswPAA7QDlQNqAzkDCAPcArsCpgKfAqUCtgLNAuUC+gIDA/wC3wKmAk8C2QFDAZAAxf/n/v79E/0w/F37pPoP+qL5ZPlZ+YD52Ple+g373PvD/Ln9tP6q/5AAYwEZAq8CIgNyA6EDsgOpA40DZAM0AwQD2QK3AqECmQKdAqwCwgLZAu4C+ALzAtgCowJQAt8BTgGhANz/A/8e/jf9VvyE+8v6NPrE+YL5cfmR+eP5YvoK+9L7tPyl/Zv+jv90AEUB/AGUAgoDXQOQA6QDngOFA14DMAMAA9UCswKcApIClQKiArcCzgLiAu0C6QLRAp8CUQLkAVkBsQDy/x7/Pv5a/Xv8q/vy+lj65vmg+Yn5pPnv+Wf6CPvK+6X8kf2E/nT/VwApAeABegLyAkgDfgOVA5MDfANYAysD/QLSAq8ClwKMAo0CmQKsAsIC1gLiAuACygKbAlEC6QFjAcEABgA4/1z+fP2g/NH7GPt9+gj6vfmi+bf5+/lt+gf7wvuY/H/9bf5a/zwADAHEAV8C2gIzA2sDhgOHA3QDUQMmA/kCzgKrApIChgKGApACogK3AssC1wLWAsMClwJRAu4BbQHQABoAUf96/p39w/z2+z37ofop+tv5u/nK+Qj6c/oG+7v7i/xt/Vf+Qf8hAPEAqQFFAsICHQNZA3cDewNqA0oDIQP1AssCpwKOAoACfgKHApgCrALAAswCzQK7ApMCUALyAXYB3gAtAGn/lv69/eb8Gvxi+8X6S/r5+dT53fkW+nr6Bvu1+3/8XP1C/ij/BgDVAI4BKwKqAggDRwNoA28DYQNEAxwD8QLHAqQCiQJ6AncCfwKOAqICtQLCAsMCtAKOAk8C9QF+AesAPwCA/7L+3f0J/T78hvvo+mz6F/rt+fH5I/qB+gj7sPt0/Ev9Lf4R/+3/ugBzARECkgLzAjQDWQNjA1gDPAMXA+0CxAKgAoUCdQJwAnYChQKXAqoCtwK6AqwCiQJOAvgBhQH3AFEAl//N/vz9Kv1h/Kr7C/uN+jX6B/oG+jL6ivoJ+6z7avw8/Rr++v7U/6AAWQH4AXoC3QIiA0kDVgNOAzUDEQPpAsACnAKBAnACagJvAnsCjQKfAq0CsAKkAoQCTAL6AYwBAwFiAK3/5/4Z/kv9hPzN+y77rvpS+iD6GvpB+pL6DPuo+2D8Lf0H/uP+u/+GAD8B3wFiAsgCDwM5A0oDRAMtAwwD5AK8ApkCfQJrAmQCZwJzAoMClQKjAqcCnQJ/AkoC/AGSAQ4BcgDB/wD/Nv5r/ab88PtQ+876cPo6+i/6UPqc+g/7pftY/CD99P3O/qP/bQAlAcUBSwKzAvwCKQM9AzoDJgMGA+ACuQKVAnkCZgJdAl8CagJ6AosCmAKdApUCegJIAv0BmAEZAYEA1f8Z/1P+iv3H/BL8cvvu+o76VPpE+mD6pvoT+6P7UPwT/eP9uf6M/1QADAGtATMCnQLqAhkDMAMvAx4DAAPbArUCkQJ1AmECWAJYAmECcAKBAo4ClAKNAnQCRQL+AZ0BIwGQAOn/MP9u/qj96Pwz/JP7Dvur+m76Wvpw+rD6F/ui+0n8Bv3S/aX+df87APMAlAEcAogC1wIJAyIDJQMWA/oC1gKxAo4CcQJcAlICUQJZAmcCdwKFAosChQJuAkIC/wGiASwBnQD7/0f/iP7G/Qf9VPy0+y77yPqI+m/6gfq7+h37oftD/Pv8wv2R/l//JADaAHwBBQJzAsQC+QIVAxoDDQPzAtICrQKKAm0CWAJMAksCUQJeAm4CewKCAn0CaAI/Av8BpgE0AasADABd/6L+4/0m/XT81PtO++b6ovqF+pL6x/oi+6H7Pfzw/LP9fv5J/wwAwgBkAe4BXgKxAukCBwMPAwUD7QLNAqkChgJpAlMCRwJEAkoCVgJkAnECeQJ1AmICPAL/AaoBPAG3AB0Acv+7/v/9Rf2U/PT7bfsD+7z6m/qj+tP6Kfuh+zj85vyl/Wz+NP/2/6oATAHXAUgCngLYAvkCBAP8AuYCxwKlAoMCZQJPAkICPgJCAk0CWwJoAnACbQJcAjgC/wGtAUQBwwAtAIf/1P4b/mP9s/wU/Iv7IPvW+rH6tPrf+i/7o/s0/N38l/1b/iD/4P+TADUBwQEzAosCyALsAvkC8wLfAsICoQJ/AmICSwI9AjgCOwJFAlICXwJnAmUCVgI0Av4BsAFLAc4APACa/+v+Nf6A/dL8M/yq+zz78PrI+sb67Po3+6X7MPzU/Ir9Sv4M/8r/fAAeAasBHwJ4ArcC3gLtAuoC2AK9ApwCewJeAkcCOAIyAjQCPQJKAlYCXgJdAk8CLwL7AbEBTwHWAEkAq/8A/07+nP3w/FP8yvtc+w774/rd+v76Q/ur+zD8zvx+/Tj+9v6x/2AAAQGNAQICXgKgAsoC3gLfAtICugKdAn8CYwJMAj0CNgI3Aj0CRwJRAlYCUwJEAiQC8QGpAUoB1gBNALX/D/9i/rX9Dv10/O37gPsx+wP7+voW+1X7tvs0/Mv8c/0n/uD+lf9CAOEAbQHjAUEChwK1As0C0wLKArcCngKCAmgCUwJDAjsCOgI+AkUCTAJPAkoCOgIaAugBoQFFAdQAUAC9/x3/dv7O/Sv9lPwQ/KP7U/sk+xf7Lvto+8L7OfzI/Gr9F/7K/nz/JADBAE0BxAEkAm0CnwK8AsYCwgKzAp4ChQJtAlgCSQJAAj0CPwJDAkgCSQJCAjACEALeAZkBQAHTAFMAxf8q/4j+5f1H/bP8MfzF+3X7RPs0+0b7e/vO+z/8x/xi/Qn+tv5j/wgAowAuAaYBCAJTAokCqgK5AroCrwKdAocCcQJeAk4CRQJAAkACQgJEAkMC",
    "OgInAgYC1QGSATsB0QBWAM3/Nv+a/vv9Yf3R/FH85vuW+2P7UPtf+4772/tF/Mf8W/37/aP+S//u/4YAEAGIAesBOgJzApgCqwKwAqkCmwKIAnQCYgJTAkkCQwJBAkECQQI9AjMCHwL+Ac0BiwE2AdAAWADT/0L/qv4Q/nr97vxw/Af8tvuC+237d/uh++n7TPzH/FX97/2R/jX/1P9qAPMAawHPASACXAKFAp0CpgKjApkCiQJ3AmYCWAJNAkcCQwJBAj4COQItAhcC9QHFAYQBMgHOAFoA2f9N/7r+JP6S/Qn9jvwm/Nb7oPuI+4/7tPv3+1T8yfxQ/eT9gf4g/7z/TgDWAE4BtAEHAkYCcwKOApsCnQKVAokCeQJqAlwCUgJKAkUCQQI8AjQCJwIQAu0BvQF9AS0BzABcAN//V//I/jf+qf0k/av8Rfz0+777pPun+8j7Bvxd/Mv8TP3b/XL+DP+k/zQAugAyAZkB7QEvAl8CfwKQApUCkQKIAnsCbQJgAlYCTQJHAkECOwIxAiECCQLmAbYBdwEoAcoAXQDk/2D/1v5J/sD9Pf3H/GL8Evzb+7/7v/vc+xT8ZvzP/En90v1k/vn+jf8bAJ8AFgF+AdQBGQJMAm8ChAKNAo0ChgJ8AnACZAJZAlACSQJCAjkCLgIcAgMC3wGvAXEBJAHIAF4A6f9p/+P+W/7V/VX94vx//DD8+Pva+9f78Psk/HD80/xH/cr9V/7n/nj/AgCFAPwAZAG7AQICOAJfAngChAKIAoQCfAJyAmcCXQJTAksCQgI4AisCGAL+AdkBqQFrASABxgBfAO3/cv/v/mv+6f1t/fz8mvxM/BT89Pvv+wT8M/x6/Nf8Rv3E/Uv+1/5j/+z/bADhAEoBowHsASUCTwJrAnsCggKBAnwCcwJqAmACVgJNAkMCOAIpAhQC+QHUAaMBZgEcAcQAYADy/3n/+/57/vz9g/0V/bX8aPwv/A78BvwY/EP8hfzd/Eb9vv1A/sf+UP/V/1MAyAAwAYoB1QERAj4CXQJxAnsCfgJ7AnQCbAJjAlkCTwJEAjcCJwIRAvQBzgGeAWEBGAHCAGEA9f+A/wb/iv4O/pn9Lf3P/IL8Svwo/B78LPxT/JD84/xH/bn9Nv65/j3/wP87AK8AFwFyAb8B/QEtAk8CZwJ0AnkCeQJ1Am4CZQJcAlECRQI3AiUCDgLwAckBmQFdARQBwABhAPn/h/8Q/5j+IP6u/UX96Pyc/GT8Qfw1/ED8Y/yc/On8SP21/S3+q/4s/6v/JQCXAP8AWgGoAekBGwJBAlwCbAJ1AncCdQJvAmcCXgJTAkcCNwIkAgwC7QHFAZQBWAERAb8AYQD8/47/Gv+l/jH+wv1b/QH9tvx9/Fn8S/xU/HP8qPzx/Er9sv0l/p/+G/+X/w4AfwDnAEMBkgHVAQoCMwJQAmQCbwJ0AnQCcAJpAmACVQJIAjgCIwIKAuoBwQGQAVQBDgG9AGIA//+U/yT/sf5B/tX9cf0Y/c78lvxx/GL8aPyE/LT8+PxN/bD9Hv6T/gz/hf/6/2kA0AAsAXwBwQH4ASQCRAJbAmkCcQJzAnACawJiAlcCSQI4AiMCCALnAb4BjAFRAQsBuwBiAAAAmf8s/73+UP7n/YX9L/3m/K78ifx4/Hz8lPzB/AH9Uf2v/Rj+if79/nP/5v9TALkAFQFnAawB5gEVAjgCUgJjAm0CcQJwAmwCZAJZAksCOQIiAgcC5QG7AYkBTQEIAboAYgADAJ7/NP/J/l7++P2Z/UX9/fzG/KD8jvyP/KX8zvwJ/VX9rv0T/n/+8P5i/9L/PQCiAP8AUQGYAdQBBQIsAkgCXAJpAm8CcAJtAmUCWgJMAjoCIgIGAuMBuAGGAUoBBgG4AGMABQCj/zz/1P5s/gn+rP1a/RT93fy3/KP8ovy1/Nv8Ev1a/a79Dv52/uP+Uv/A/ykAjQDpADwBhAHCAfYBHwI+AlUCZAJsAm8CbQJnAlwCTQI6AiICBQLhAbYBgwFIAQQBtwBjAAgAqP9E/97+ef4Z/r/9bv0p/fP8zfy4/Lb8xvzo/Bz9X/2v/Qv+bv7X/kP/rv8VAHgA1AAnAXEBsAHmARECMwJNAl4CaQJuAm0CZwJdAk8COwIjAgQC4AG0AYEBRQECAbYAYwAKAKz/S//o/ob+KP7Q/YH9Pv0J/eL8zfzJ/Nb89vwm/WT9sf0I/mf+zP40/53/AgBjAL8AEgFdAZ4B1gEEAigCRAJYAmUCbAJtAmgCXwJQAjwCIwIEAt8BsgF/AUMBAAG1AGMADACw/1H/8f6S/jb+4f2U/VL9Hf33/OH82/zn/AP9MP1r/bP9Bf5h/sL+J/+M//D/TwCqAP4ASQGMAcUB9gEdAjsCUgJhAmoCbAJoAmACUQI9AiQCBALeAbEBfQFBAf4AtABkAA4AtP9X//r+nf5E/vH9pv1m/TL9DP31/O789/wR/Tr9cf21/QT+W/65/hr/ff/e/zwAlgDqADYBegG1AecBEQIyAksCXAJnAmsCaQJgAlICPgIlAgQC3gGwAXwBQAH9ALQAZAAQALj/Xf8C/6j+Uf4B/rj9ef1G/SD9CP0A/Qj9H/1F/Xj9uP0D/lf+sP4O/27/zf8qAIMA1gAjAWgBpQHZAQUCKAJEAlcCZAJpAmgCYQJTAj8CJQIFAt4BsAF7AT8B/ACzAGUAEgC8/2P/Cv+z/l/+Ef7K/Y39W/02/R79Ff0b/TD9U/2D/cD9Bv5W/qv+Bf9i/77/GABvAMIADgFTAZABxQHzARcCNAJJAlcCXgJeAlcCSgI3Ah0C/AHVAagBdAE5AfgAsQBlABQAwv9t/xj/xP50/in+5f2q/Xr9Vv0+/TX9Of1L/Wv9l/3P/RH+W/6s/gH/Wf+x/wgAXACsAPcAOwF5Aa4B3AECAiACNwJGAk4CTwJKAj4CKwISAvIBzAGfAWwBMgHzAK4AZAAXAMf/dv8k/9T+h/5A/v/9x/2Y/XX9Xv1T/Vb9Zv2C/av93/0c/mH+rf7+/lH/pf/5/0oAmADhACUBYgGYAcYB7QENAiUCNQI/AkECPQIxAh8CBwLoAcIBlgFkASwB7gCrAGMAGQDM/37/MP/j/pr+Vv4Y/uL9tf2T/Xz9cf1z/YD9mv2//e79J/5o/q/++/5K/5v/6/85AIQAzAAOAUsBgQGwAdgB+QETAiUCLwIzAjACJQIUAvwB",
    "3gG5AY4BXAElAekAqABiABoA0f+F/zv/8f6s/mr+L/78/dH9sP2a/Y79j/2a/bH90/3//TP+b/6y/vn+RP+R/93/KAByALgA+QA1AWsBmwHEAeYBAAIUAiACJQIiAhkCCQLyAdQBsAGFAVUBHwHkAKQAYQAbANX/jP9F///+vP5+/kb+Ff7s/cz9tv2r/ar9tP3J/ef9D/5A/nj+tv75/j//iP/R/xkAYACkAOQAIAFWAYYBsAHSAe4BAwIQAhcCFQINAv4B6AHKAacBfQFOARkB3wChAGAAHADY/5P/Tv8L/8z+kf5c/i3+Bv7n/dL9x/3F/c794P37/SD+Tf6A/rr++f47/3//xf8KAE8AkQDQAAsBQQFxAZwBvwHcAfIBAQIIAggCAQLzAd0BwQGeAXUBRwETAdoAngBfAB0A2/+Z/1f/F//b/qP+cP5E/h/+Av7t/eL94P3n/ff9EP4x/lr+if6//vn+N/94/7v//f8+AH8AvAD2ACwBXQGIAawBywHiAfIB+gH8AfUB6AHTAbgBlgFtAUABDQHVAJoAXQAdAN7/nv9f/yL/6f60/oT+Wv43/hv+B/78/fn9//0N/iT+Qv5n/pP+xP77/jX/cv+x//D/LwBtAKkA4wAYAUkBdAGaAbkB0QHiAewB7wHqAd0ByQGvAY0BZgE5AQcB0QCXAFsAHgDh/6P/Z/8t//b+xP6W/m/+Tv40/iH+Fv4T/hf+JP44/lP+df6d/sv+/f4z/2z/qP/k/yAAXQCXAM8ABAE1AWEBhwGnAcEB0wHeAeEB3QHSAb8BpQGEAV4BMgEBAc0AlQBbAB8A5f+p/3D/OP8E/9T+qP6C/mP+Sf43/iz+KP4s/jb+Sf5i/oH+p/7R/gH/NP9r/6T/3v8XAFIAigDBAPQAJAFPAXQBlAGtAb8BywHPAcwBwQGwAZgBeQFVASsB/QDLAJUAXgAlAOz/s/97/0b/E//k/rr+lf52/l3+Sv4//jr+Pf5H/lf+b/6M/rD+2P4F/zb/a/+h/9n/EABIAH8AtADlABMBPQFiAYEBmgGsAbgBvQG6AbEBoQGLAW4BTAEkAfgAyACVAGAAKgDz/7z/h/9T/yL/9f7L/qf+iP5w/l3+Uf5M/k7+V/5m/nz+l/65/t/+Cv85/2v/n//U/wkAPwB0AKcA1wAEASwBUAFuAYcBmQGlAasBqQGhAZMBfgFjAUMBHQHzAMYAlQBiAC4A+v/F/5H/X/8w/wT/3P65/pv+gv5w/mT+Xv5f/mf+df6J/qP+wv7n/g//PP9r/53/0P8DADcAagCbAMkA9AAcAT8BXAF1AYcBkwGZAZkBkgGEAXEBWAE5ARYB7gDDAJQAZAAyAAAAzf+b/2v/Pv8T/+z+yv6s/pT+gv52/nD+cP52/oP+lv6u/sz+7v4V/z//bP+c/83//v8vAGAAjwC8AOYADAEuAUsBYwF1AYIBiAGIAYIBdgFkAUwBMAEOAekAwACTAGUANQAEANX/pf93/0r/If/8/tr+vf6m/pT+h/6B/oD+hv6R/qL+uf7V/vX+Gv9C/23/mv/J//n/KABWAIQArwDYAP0AHgE6AVIBZAFwAXcBeAFzAWgBVwFBASYBBwHjALwAkgBmADgACgDc/67/gf9X/y//C//q/s7+t/6l/pj+kf6Q/pX+n/6v/sT+3v79/iD/Rv9v/5r/x//0/yEATgB5AKMAygDuAA4BKgFBAVMBXwFmAWgBZAFaAUoBNgEdAf8A3QC4AJAAZgA7AA4A4/+2/4z/Y/88/xn/+f7e/sf+tv6p/qL+oP6k/q3+vP7Q/uj+Bf8m/0r/cP+a/8T/8P8aAEUAbwCYAL0A4AD/ABoBMQFCAU8BVgFYAVUBTAE+ASsBEwH3ANcAtACPAGYAPQASAOn/vv+V/27/Sf8n/wj/7v7X/sb+uf6y/rD+s/67/sj+2/7y/g3/LP9O/3P/mv/C/+z/FAA+AGYAjQCxANIA8AALASEBMgE/AUYBSQFGAT4BMQEgAQoB7wDRALAAjABmAD8AFgDu/8b/n/95/1X/NP8X//3+5/7W/sn+wv6//sH+yf7V/ub++/4V/zL/Uv91/5r/wf/o/w8ANgBdAIIApQDFAOIA/AARASIBLwE3AToBOAExASUBFQEAAecAywCsAIoAZgBAABoA9P/N/6f/g/9h/0H/Jf8L//b+5f7Z/tH+zv7Q/tb+4f7x/gX/Hf84/1b/d/+b/7//5f8KADAAVAB4AJoAuQDVAO0AAgETASABKAErASkBIwEZAQoB9gDfAMUApwCHAGUAQQAdAPj/1P+w/43/bP9O/zL/Gv8F//T+6P7g/t3+3v7j/u7+/P4P/yX/Pv9b/3r/nP++/+L/BQApAEwAbgCPAK0AyADfAPQABAERARkBHAEbARYBDAH/AO0A1wC+AKIAhABkAEIAHwD9/9r/t/+W/3f/Wf8//yf/E/8D//f+7/7r/uv+8P76/gf/GP8t/0X/YP99/53/vv/g/wEAIwBFAGUAhAChALsA0gDmAPYAAgEKAQ4BDgEJAQAB9ADjAM8AuACeAIQAbwBkAFIAJQAUAFwAlQAwAKP/xP82AAMAbP+C/y0AFgDf/vf9PP7B/sP+if48/qf9FP1K/V7++v4Q/gT9yf1i/6//Q/+6/6gA/gBjAc8C+gP6AgcBjQHCBPAGvAVCA2ACpwKbAugCzANHA+gA0f4K/u39+f3G/Qz9D/wL+yj65vmB+jP7M/u2+qD6xPtO/Zf9t/2G/1QBRQE2AQQDHwWwBVwFQAU3BSQFAQb1B5sINQb/Av0BfAL3AXYAsf9w/zX+YvxE+3n6bPkA+Yz5o/mv+GL43fmo+zD8L/zQ/MH92/7OADUDuQTlBJ8ERAX4BkAI9AfQBqUGZgfUBvgEcgTLBLMC3/6J/Z7+9v0M+0X5n/ns+R75/Pe49vn1iPed+jH8/fsl/Df9VP5s//EA1QLoBN4G2weiBxcHCAecB28I0Ah9CIUHwAWTA/UBMAFIAYQBNf/4+QT3e/km/Jj5R/VF9QP4O/i09on3yfk++vD5qftA/+MBegE0AD8C2AY1CTUIIQfvB4cJdAoWCnkI7QYQBxsIGwcXA2n/LP9sAHz/I/wt+bH4Tfka+LD1VfU+9z34KPeH9hn4Nfr7+iT7ovzv/zcDUwRUA48CBgQMBzIJpAmzCWgJkAe8BYgGcghECE0GcwR1Avb/",
    "df60/tf+zfxe+Un3Qfcw9wD2R/V+9rr4G/pe+qH6cvva/GL/ogJYBLYDOQOSBKEFnwQSBG8GOgmdCEQFOgN+BO8GRAdeBdkDawMnAkL/N/zN+vr6j/o6+ND1RfXN9QH2PPaA99D5lPxV/0cBtwGRAUICiQMFBf8G+QcmBq0D/QP4BUgGBwWIBGsFXQZTBrQFHwVSBM4CdgAJ/oH8FPt++P71C/WC9G7zIPN99Hv2fPjc+ij9E/9zARkEXQX2BKIEyAWfB70HYwVcA9cDMQWiBfQFiAZOBu4FFAeLCIMHJAR5AQQBwAD8/f349vTe8xr0vfNG87rzWvSy9Mn2cvvp/8oBnQFfAacCSwVKB6oGiwQ5BHIFtwR4ArICgQVeB0YH6QY9B8YHTgc2BfwCvwKnA/cBW/yX9lz0x/Rv9Z/12PQm8z7zV/fd/IL/Av/C/rMAYAMYBS0G2Qb3BXoD0gGSAsQDjQOiA4wF6wafBSAELAX2BuUGnwUfBBACpP/N/Hj5RvcY98f2l/R48jvzb/Yw+VX6f/vv/dcA/AIQBOcEHgaUBn8FeQSzBMoEqAPTAq8DBQVIBd0ENwV8BqcGDwUsBL0EyAMMAFT8bvq5+FP2wvRd9PXz6vPi9LH1uPZb+iz/qQBP/3sAXAWvCHcHHQWyBO8EZQRMBHUFEwbWBKwDlwR2Bo8H1wdYB8kF4gObAq4BGgCb/aP6jffw9J/zh/Oz8+jzsPQZ9i34a/v0/qoAuQCQAckDgQWbBRMFOgWHBakEbgOVA3QEYwQwBLgFHwigCOIGfQWhBXgFbANnAFn+SP0o+3z3hvTe85b0A/X99Ob1M/iV+nH8a/5lADsCbgS8BWgEmwLxA9wGWQZfAnMA5wKUBSIF8gPnBIEGcgbJBToGTwbEAwYAhf7h/if9Xfh39HH0HfYF9s/0ePUI+AT6Bfv5/GgAhwPcBNAEpQThBA8FFgVRBQ0F0wPxAj0D3wNnBE8FNAYyBq8FjQVPBQQEEwJEACD+U/vw+KL3a/aX9Fzz0/ML9Sb2BPj5+p39LP94AA0CqAM5BZMG4QbPBVYEtwMnBM4E6ASJBHwEQQU9BnQGCwb0BVEGGQZNBCsBM/51/FT7nfkc97T0evOR80r0QvXD9g35p/vF/TH/fAA0AgYEOgWyBaEF3ATKA40DGAQuBM8DNwRzBUQGNAb9BTgGhgYpBu8EQANPAf7+kfxZ+jf4RvYI9bT0AvWM9Vz22vcV+of8r/6KAD8CmgNWBJ0EpgRmBCIENQQvBIEDyAIeA1sEQAVLBUoFzAU+BvUFBQWtA+0B4v+2/Wf7GPlB9x/2cfX+9Bn1F/a396H5wfvz/QQA7AFxA04EzARGBWoF6QRFBA4ECgTMA4sDuQNLBOkEbwXNBeYFsgUoBREEYQJmAGD+QvwE+un3RPYm9Y/0nfRa9Z/2R/hL+o38wv62AGgCywPCBEQFZwVHBfcElgQ/BAkEAgQxBI8EDQWTBQYGSAY9Bs4F7wSdA+MB1/+X/Uv7Hfk397/10fR/9M/0t/Uj9/X4BPsq/Tz/FgGfAsUDggTdBOUEsgRhBA0EzwO7A9oDLQSoBDoFxwUzBmAGNgahBZkEIwNNATP/9fy8+rT4A/fL9ST1GfWq9cj2Wfg8+kn8WP5AAOYBMQMWBJUEugSYBEkE6gOWA2IDXwOQA/MDdwQHBYcF2gXkBY8FzgSdAwYCHAD//dH7vfns94H2mvVJ9ZP1cfbP94/5jPuf/aD/agHmAv8DsgQCBQAFwgRkBAEEsgOKA5QD0gM5BLcENQWVBbwFkQUBBQQEnALZANP+qvyG+pD47/bE9Sb1IfW19dT2ZvhK+lr8bf5cAAsCYgNVBOIEFQX/BLoEYQQPBNkDzgP1A0oEvwQ/BbAF9QX0BZcF0ASdAwQCGwD9/c/7t/ng92z2efUZ9VL1HfZp9xr5CvsU/RD/3ABeAoMDRASnBLkEjwREBPMDtAOZA64D9ANiBOcEawXSBQIG4AVdBW0EEwNdAWP/Q/0k+y75h/dQ9qH1hvUA9gP3d/g++jL8LP4HAKYB8QLcA2YEmASEBEEE6wOaA2UDXAODA9kDUATVBE0FnQWrBWEFsQSXAxoCTABJ/jP8MPpp+AD3Efaw9eL1o/bh94L5Yvtc/Ur/CgGBAp4DWgS4BMUElgRFBOsDoQN6A4EDtwMWBI0EBQVkBZAFbwXwBAoEvgIYATD/Iv0T+yz5kfdi9rf1nPUU9hP3gvhE+jX8Lv4KAK0B/wLzA4gExAS6BH8ELgTgA6oDnAO8AwgEdQTuBFwFpAWsBV8FrwSXAx8CVgBZ/kf8Rvp++BD3Gfas9dH1gvaw90H5E/sD/er+pwAhAkQDCQRzBI4EbQQpBNsDmwN7A4cDwQMiBJoEFQV4BagFjwUbBUEEAgNpAY7/i/2E+6H5BfjP9hn28PVU9j33lvhB+h38A/7R/2gBsgKjAzcEdQRuBDYE6AOcA2cDWQN4A8IDLQSnBBcFZQV1BTUFlASPAysCeACP/o/8nvrh+Hr3hfYV9jL22Pb493r5Pvsf/fv+rgAhAkADBARtBIgEaAQjBNMDjgNoA2wDnAPzA2ME1gQ0BWMFTAXeBA0E2wJRAYX/kf2Y+8D5K/j69kT2F/Z09lT3o/hF+hf89v3B/1YBogKXAzEEdwR3BEYE/QOzA34DbAOGA8oDLgShBAwFVQVlBSYFiwSNAzMCigCr/rX8y/oS+av3svY69kz25fb292n5H/v1/Mj+dgDoAQkD0QNBBGQETAQPBMUDhANgA2QDkwPnA1QExQQjBVUFQwXbBBUE7wJyAbT/zP3e+wz6e/hI9432Vvan9nf3tvhH+gr83f2d/ywBdQJqAwYEUARVBCkE5AOcA2gDVQNtA60DDQR8BOUELwVDBQoFeASHAzoCoADR/uj8CPtW+fP3+fZ89oX2EvcW+Hv5I/vs/LX+XADJAekCsgMmBE4EOgQBBLkDegNUA1UDfwPPAzcEpAQABTIFIwXDBAYE7AJ9Acz/8f0O/EX6ufiI98n2i/bS9pb3x/hK+gH8yf2B/woBUgJHA+YDNQQ/BBgE1gORA10DSQNdA5kD9QNgBMYEEAUlBfIEaASBA0ECtQDy/hX9QPuU+TT4Ofe39rf2Ofcv+Ib5IPve/J3+PQCmAcUCkQMIBDUEJgTxA60DbwNJA0gDbgO5Ax0EhwThBBMFCAWuBPsD",
    "7AKKAeb/GP5A/ID6+PjI9wb3wfb+9rb32fhP+vn7tf1l/+kALgIkA8YDGQQoBAYEyQOGA1MDPgNPA4cD3gNFBKgE8QQIBdoEWAR7A0cCxwAS/0H9dfvR+XP4d/fw9uj2X/dI+JL5H/vQ/IX+HwCEAaICbwPqAxwEEgTiA6EDZAM+AzsDXgOlAwQEagTDBPYE7gSaBO8D6wKVAf//Pv5w/Lj6NvkG+EL39/Yq99b37PhU+vH7o/1K/8kADAICA6cD/gMSBPUDuwN7A0gDMgNAA3QDxwMqBIsE0wTsBMIERwR1A0wC2QAx/2v9qfsL+rH4tPcp9xn3hfdi+J75HvvE/G/+AQBjAYACTgPNAwME/gPSA5QDWgM0Ay4DTgORA+wDTwSlBNgE1ASFBOMD6gKgARUAYf6f/O/6cvlE+H33K/dW9/b3//ha+uv7kv0x/6oA6gHhAogD4wP7A+MDrQNwAz4DJwMyA2MDsQMRBG8EtgTQBKsENwRuA1AC6gBO/5T92/tE+u348Pdg90n3q/d8+Kv5Hvu4/Fr+5/9DAV8CLgOwA+oD6gPDA4gDTwMpAyIDPgN9A9QDNASIBLwEugRxBNcD6AKqASwAhP7M/CT7rPmA+Lb3X/eB9xb4E/lh+ub7gv0Z/40AygHAAmkDyAPlA9EDnwNlAzQDGwMlA1IDnAP4A1MEmgS1BJQEJgRmA1QC+gBq/7v9DPx8+ij5K/iX93n30feW+Lj5H/uu/Eb+zP8kAT4CDwOTA9ED1gOzA3wDRAMeAxUDLwNqA74DGgRtBKAEoQRdBMsD5gKzAUEApf73/Fj75Pm6+O/3k/es9zf4J/lp+uH7dP0C/3AAqgGgAksDrQPPA78DkQNZAykDEAMXA0EDiAPgAzgEfgSbBH0EFgReA1cCCAGE/+H9O/yx+mH5ZPjN96j39vew+Mb5Iful/DT+sv8GAR4C8AJ3A7kDwgOjA28DOgMUAwoDIQNYA6cDAQRRBIUEiARJBL4D4wK7AVUAxP4h/Yn7HPrz+Cb4xffW91f4O/lx+t77Zv3s/lQAiwGBAi4DkwO5A64DgwNOAx8DBQMKAzEDdAPIAx4EYwSBBGYEBQRWA1kCFgGd/wX+aPzl+pn5nPgC+Nf3HPjL+NX5JPuc/CL+mf/oAP8B0QJbA6EDrgOTA2MDLwMKA/4CEgNGA5ID6AM3BGoEbwQ1BLED3wLDAWgA4v5J/br7Ufor+V349/cA+Hf4UPl6+tv7Wf3X/jkAbQFiAhEDeQOjA5wDdQNCAxUD+wL+AiEDYAOyAwUESARnBFAE9QNOA1sCIgG1/yf+lPwY+8/50/g2+AX4Qfjm+OT5J/uV/BH+gf/MAOEBswI/A4kDmwOEA1YDJAP/AvMCBQM1A30D0AMdBFAEVwQiBKUD3ALJAXoA//5w/en7hvph+ZL4KPgq+Jf4ZfmD+tn7Tf3D/h8AUAFEAvQCXwONA4oDZwM3AwoD8ALxAhIDTgObA+wDLgROBDoE5QNFA1wCLgHM/0n+vvxJ+wT6Cflp+DL4ZvgB+fT5K/uO/AL+a/+xAMQBlgIkA3EDhwN0A0kDGgP1AucC9wIlA2kDuQMEBDcEQAQPBJgD1wLPAYoAG/+V/Rb8uPqX+cf4WPhT+Lf4e/mN+tj7Qv2w/gcANAEnAtgCRgN4A3kDWQMrAwAD5gLlAgMDPAOGA9QDFQQ1BCQE1AM8A1wCOQHi/2n+5/x5+zj6Pfmc+F/4i/gc+QT6MPuI/PP9Vf+WAKcBegIKA1oDcwNkAz0DDwPrAtwC6gIUA1YDowPrAx4EKQT7A4sD0wLVAZoANf+5/UL86vrL+fr4iPh8+Nf4kfmY+tj7OP2e/vD/GAEKArwCLQNiA2cDSwMgA/YC2wLaAvUCKgNxA70D/AMdBA8ExAMzA1wCQwH2/4f+D/2n+2v6cfnN+Iv4sPg3+RT6NfuE/OX9QP99AIsBXgLwAkMDYANUAzADBAPhAtIC3QIFA0MDjQPUAwYEEgToA34DzgLZAakATv/c/Wz8Gvv9+Sz5t/il+Pf4pvmj+tn7L/2M/tn//gDvAaECFANNA1UDPQMUA+wC0QLOAucCGQNdA6YD5AMGBPoDtAMqA1sCTAEJAKX+Nf3U+5z6o/n9+Lf41PhS+SX6O/uA/Nj9LP9kAHABQgLWAiwDTQNEAyMD+gLXAscC0QL1AjADeAO8A+4D/APWA3EDyALdAbcAZv/9/ZX8SPsv+l355fjN+Bf5vfmv+tr7J/18/sL/5ADTAYcC/AI4A0QDLwMJA+ICxwLDAtkCCANKA5ADzQPvA+YDpAMhA1oCVAEbAMH+Wv0A/Mv61Pkt+eL4+Pht+Tb6Qvt8/Mz9Gf9MAFYBKAK8AhUDOQM1AxcD7wLNArwCxALnAh8DYwOmA9cD5gPDA2QDwwLgAcQAff8d/r38dvtf+o75Evn0+Df50/m7+tz7H/1t/q3/ywC5AW0C5AIjAzMDIQP9AtcCvQK4AswC+AI3A3sDtgPYA9EDlAMXA1kCXAEtANz+ff0q/Pr6BPpc+Qz5HPmI+Uf6Sft6/MH9B/82ADwBDQKjAv8CJgMlAwoD5ALDArICuALYAg0DTwOQA8AD0AOxA1cDvQLjAdAAk/88/uT8ovuO+r35Pvkc+Vb56fnH+t/7Gf1f/pn/swCfAVMCzAIOAyEDEwPyAs0CswKtAr8C6QIkA2YDoAPCA70DhAMNA1cCYwE9APb+oP1T/Cf7M/qJ+Tb5P/mj+Vn6Uft4/Lf99v4fACMB9AGLAukCEwMVA/0C2gK5AqgCrQLKAvwCOwN6A6oDuwOfA0oDtwLlAdsAp/9a/gn9zPu8+uv5avlC+Xb5APrU+uL7E/1R/oX/mwCGAToCtQL6AhADBQPmAsMCqQKiArIC2QISA1IDiwOtA6oDdAMDA1QCagFNAA//wf16/FP7Yfq2+V/5Yvm++Wv6Wft3/K395v4KAAsB2wFzAtMCAAMGA/ACzwKwAp4CoQK8AuwCKANmA5UDpwONAz0DsALnAeYAu/92/i399vvo+hj6lflo+ZX5F/ri+ub7Dv1E/nP/hQBtASICngLlAv8C9wLbArkCoAKYAqYCywIBAz4DdQOYA5YDZQP5AlECbwFcACb/4P2h/H77jvri+Yj5hfnZ+X36Yvt2/KT91v73//QAwgFbAr0C7gL2AuQCxAKmApQClgKvAtwCFgNRA4ADkgN8AzAD",
    "qgLoAfAAzv+S/k/9HvwU+0T6v/mO+bT5Lfrv+ur7Cf04/mH/bwBWAQoCiALRAu4C6ALPAq8ClgKNApoCvALwAisDYQODA4QDVQPvAk4CdAFqAD3///3G/Kj7ufoN+rD5p/n0+Y/6a/t3/Jz9x/7j/90AqwFEAqgC2wLnAtcCugKcAooCiwKiAs0CBAM+A2sDfwNqAyMDowLoAfkA4P+s/nH9Rfw++3D66fmz+dP5RPr9+u/7Bv0t/lD/WgA+AfIBcgK9At0C2gLDAqUCjQKDAo4CrgLfAhgDTQNvA3EDRgPlAksCeQF3AFP/HP7q/ND75Po3+tf5yfkP+qL6dft3/JX9uf7Q/8cAkwEtApMCyQLXAsoCrwKTAoECgQKWAr4C8wIqA1cDawNZAxYDnALpAQEB8f/F/pH9a/xo+5r6EfrY+fH5W/oL+/T7A/0j/j//RQAoAdsBXAKqAswCzAK4ApsCgwJ5AoMCoQLPAgYDOQNbA18DNwPbAkcCfQGDAGf/Of4N/ff7Dvth+v756/kq+rX6f/t5/I/9rP6+/7EAfQEXAn8CtwLIAr4CpAKJAncCdgKJAq8C4gIYA0QDWANIAwkDlQLoAQkBAADd/rH9kPyQ+8P6Ofr8+RD6cvoa+/r7AP0Z/jD/MgASAcUBRgKXArsCvwKsApECegJwAngClALAAvUCJgNIA00DKAPRAkMCgAGPAHv/VP4u/R78NvuJ+iT6DPpF+sf6ift7/In9oP6s/50AZwEBAmoCpQK5ArECmgKAAm4CbAJ9AqEC0gIGAzEDRgM4A/0CjQLoARABDwD0/s/9tPy3++z6YPog+i76ifop+wD8//wQ/iH/HwD9AK8BMQKDAqsCsQKhAocCcQJmAm0ChwKxAuMCFAM1AzsDGQPGAj8CgwGaAI7/b/5P/UP8Xvux+kn6Lfpf+tr6lPt9/IT9lP6b/4kAUQHsAVYCkwKqAqQCjwJ2AmUCYgJyApMCwgL0Ah4DMwMnA/AChgLnARcBHgAL/+z91vzd+xP7h/pD+kz6oPo4+wf8/fwI/hP/DQDoAJoBHQJxApoCowKVAn4CaAJcAmICegKiAtMCAgMjAyoDCgO8AjsChgGkAKD/iP5u/Wf8hPvY+m76Tvp6+u76n/uA/H/9if6L/3UAPAHXAUICggKbApgChQJtAlwCWAJmAoYCsgLjAgwDIgMXA+MCfgLmAR0BLAAg/wj++PwC/Dr7rfpl+mn6t/pH+w78/fwA/gb//P/UAIUBCAJeAooClQKKAnQCXgJTAlgCbgKUAsMC8AIRAxkD/AKyAjYCiAGtALH/oP6N/Yr8qvv++pL6bvqU+gH7qvuD/Hv9f/58/2MAKAHCAS8CcAKMAosCegJkAlMCTgJbAnkCowLSAvoCEAMIA9cCdgLkASIBOQA0/yP+GP0m/F/70fqH+ob6zfpW+xb8/fz5/fn+6//AAHAB9AFMAnoChwJ+AmoCVQJKAk4CYgKGArMC3wIAAwgD7gKoAjECigG2AML/uP6q/az8z/sj+7X6jfqu+hT7tvuH/Hj9df5t/1EAFAGuARwCXwJ9An8CbwJaAkoCRQJRAmwClQLCAukC/wL4AsoCbgLiAScBRQBI/z3+OP1K/IT79vqp+qP65Ppm+x78/fzz/e3+2/+uAF0B4QE6AmoCegJzAmACTAJBAkQCVwJ5AqQCzwLuAvgC4AKdAiwCiwG+ANH/zv7H/c388vtH+9j6rfrI+if7wvuM/HX9bP5f/z8AAQGaAQkCTgJuAnICZQJRAkECPAJGAmAChgKyAtgC7gLpAr4CZwLgASwBUQBb/1b+Vv1s/Kj7GfvK+sD6+/p2+yb8/vzt/eH+y/+bAEkBzgEoAloCbAJnAlYCRAI4AjoCTAJsApUCvgLeAugC0gKTAiYCjAHGAOD/5P7i/e38Ffxr+/r6zPri+jv7zvuR/HP9Y/5S/y4A7QCGAfYBPAJfAmYCWwJJAjoCNQI/AlcCewKkAsgC3QLYAq4CWgLZASsBVwBp/23+dP2P/M/7Qvvx+uP6GPuL+zL8AP3l/dL+tf+BAC0BsgEPAkYCXQJeAlECQgI5AjsCTAJoAo0CsgLNAtQCvAJ+AhQCfwHBAOT/8v77/Q/9P/yZ+yr7+foK+1r74/ua/G/9Vf46/w8AywBkAdYBIQJLAlkCVQJKAj8CPAJFAloCegKdArsCywLBApYCQwLGAR8BVABx/4D+kf21/Pz7cvsh+w/7Pfum+0H8A/3d/b/+mv9hAAsBkQHxAS4CTAJUAk4CRQI+AkICUAJqAokCqAK+AsACpQJnAgACbwG5AOb///4S/jD9Z/zH+1n7Jvsy+3r7+fuk/G79SP4k//P/qgBCAbYBBgI2AksCTwJJAkICQQJKAl0CeQKWAq8CuQKsAoACLgK0ARMBUQB3/5H+rP3Z/Cb8oPtP+zr7YfvB+1L8CP3W/a7+gf9CAOoAcAHUARYCOwJJAkoCRgJDAkcCVQJrAoYCnwKvAq0CkAJRAuwBYAGyAOj/Cv8o/k/9jvzy+4f7U/ta+5r7D/yu/G39PP4P/9j/igAhAZcB7AEhAj0CRwJHAkUCRgJPAmACdwKQAqQCqQKYAmoCGQKiAQcBTQB9/6H+xv38/E/8zPt8+2P7hfvc+2L8Df3R/Z/+av8lAMoAUQG3Af4BKQI+AkUCRgJGAkwCWAJsAoIClwKiApsCewI8AtkBUgGqAOj/Ff89/m39s/wc/LP7fvuA+7n7Jfy6/G39Mv78/r7/bAACAXkB0QEMAi8CPwJFAkcCSgJTAmMCdgKLApkCmgKGAlYCBQKRAfwASgCD/7D+3/0c/Xb89vun+4z7qPv3+3P8FP3M/ZH+VP8KAKwAMwGbAeYBFwIzAkACRQJJAlACXAJtAn8CjwKVAosCaAIoAscBRAGiAOn/H/9Q/on91vxF/N37p/um+9j7O/zG/G/9Kv7q/qX/UADkAFwBuAH3ASACNgJBAkcCTQJXAmUCdgKGAo8CjAJ0AkIC8gGBAfEARgCH/77+9v07/Zv8H/zQ+7P7yvsS/IX8G/3J/YT+P//x/48AFQGAAc8BBQInAjkCRAJLAlMCXwJtAn0CiAKKAnsCVgIVArUBNgGbAOn/KP9i/qP9+Pxr/Ab8z/vK+/f7UfzT/HH9Iv7a/o//NQDHAEABngHjARACLQI9AkcCUAJaAmcCdQKBAoYCfgJjAjAC",
    "4AFyAeYAQgCL/8v+C/5Z/b/8R/z5+9r76/ss/Jf8I/3H/Xn+LP/Y/3MA+QBlAbgB8wEaAjICQQJMAlYCYQJuAnoCgQJ/AmwCRQIDAqUBKQGTAOn/MP9y/rz9GP2Q/C389vvu+xX8aPzg/HT9HP7M/nn/GwCrACQBhQHOAQECIwI4AkYCUQJcAmgCdAJ8An0CcgJUAh8CzwFjAdwAPgCP/9f+IP51/eH8bPwf/P/7DPxH/Kn8K/3G/W/+G//B/1gA3QBLAaEB4QENAisCPgJMAlgCYwJuAncCewJ0Al8CNALyAZUBHQGMAOj/N/+C/tT9Nv2z/FP8HPwR/DP8fvzt/Hn9F/6+/mX/AgCQAAoBbQG5AfEBGAIyAkUCUgJeAmkCcwJ4AnUCZgJFAg4CvwFVAdIAOgCS/+L+M/6P/QH9kPxF/CP8Lfxh/Lv8Nf3G/Wb+C/+r/z8AwwAxAYoBzgH/ASICOgJLAlkCZQJvAnUCdQJrAlICJQLiAYYBEQGFAOj/Pv+R/ur9U/3V/Hj8Qfwz/FD8lPz7/H79E/6y/lP/7P92APAAVQGkAeEBDQIsAkICUwJgAmoCcgJ0Am4CWwI3Av8BrwFIAcgANQCV/+z+Rf6p/SD9s/xp/Eb8TPx6/M38Pv3H/V7+/P6X/ycAqQAYAXQBvAHyARkCNQJKAloCZgJvAnMCcAJiAkYCFwLTAXcBBQF+AOf/RP+f/v/9b/32/Jv8ZPxV/G38q/wK/YP9EP6o/kH/1v9eANcAPQGQAdEBAQIlAj8CUgJgAmsCcQJwAmcCUQIrAvEBoQE7Ab8AMQCX//b+Vv7A/T391PyM/Gj8a/yU/N/8Sf3J/Vj+7v6D/xAAkAAAAV4BqQHkARACMAJIAloCZgJuAnACawJaAjsCCgLFAWoB+gB3AOb/Sv+s/hP+if0U/b38hvx1/In8wfwY/Yr9Dv6e/jH/wf9GAL4AJgF8AcAB9QEdAjsCUQJhAmsCcAJtAmECRwIfAuMBkwEuAbYALQCZ///+Zv7X/Vn99Pyu/In8ifyt/PL8U/3L/VP+4v5x//v/eQDpAEgBlwHVAQYCKgJFAlkCZgJuAm4CZgJSAjAC/QG3AV0B7wBwAOT/T/+4/ib+ov0y/d38p/yU/KX81/wn/ZH9Df6V/iL/rf8wAKcADwFoAbAB6QEVAjYCTwJgAmsCbgJqAlsCPwITAtYBhgEjAa4AKQCb/wf/df7t/XT9E/3O/Kn8p/zG/AX9X/3P/U7+1v5g/+b/YgDSADMBhAHHAfsBJAJCAlgCZgJtAmwCYQJLAiYC8QGqAVEB5QBqAOP/VP/D/jj+uv1O/fz8x/yz/MD87Pw2/Zj9Df6O/hX/m/8aAJAA+QBUAZ8B3AEMAjECTQJfAmoCbQJmAlUCNgIJAsoBegEYAaUAJQCd/w//hP4B/o79MP3t/Mj8w/ze/Bf9av3T/Uv+zP5R/9L/TAC8AB4BcgG4AfABHQI+AlYCZQJsAmoCXQJEAh0C5gGeAUUB3ABkAOL/WP/O/kn+0P1p/Rr95vzR/Nr8Av1F/aD9Dv6I/gj/iv8GAHsA5ABAAY8BzwEDAiwCSgJeAmkCawJjAk8CLwL/Ab8BbgENAZ0AIQCe/xb/kf4U/qb9TP0L/eb83/z2/Cr9dv3X/Uj+w/5C/8D/NwCmAAoBYAGpAeUBFQI6AlQCZAJrAmgCWQI+AhQC3AGTATsB0wBeAOD/XP/Y/ln+5f2D/Tf9BP3t/PT8F/1V/an9D/6C/v3+ef/z/2YAzwAtAX4BwgH6ASYCRgJcAmgCagJgAkoCJwL2AbQBZAEEAZYAHQCf/x3/nf4m/r39Z/0o/QP9+/wO/Tz9gv3d/Uf+u/40/67/IwCRAPYATgGaAdoBDQI1AlECYwJqAmUCVQI4AgwC0gGJATABygBYAN//YP/h/mj++v2c/VL9If0J/Q39LP1k/bL9Ef5+/vL+av/h/1EAuwAaAW4BtQHwAR8CQgJaAmYCZwJcAkUCHwLsAakBWAH5AI4AGgCg/yT/q/46/tf9hf1J/SX9G/0r/VT9lP3o/Ur+uP4r/5//EQB9AOAAOQGGAcgB/QEmAkQCVgJdAlgCRwIoAvwBwQF5ASIBvwBSAN//Z//w/n7+F/6//Xr9S/00/Tb9Uf2D/cn9IP6E/vH+Yv/S/z4ApAABAVQBmwHXAQcCKwJDAlACUQJGAi4CCALVAZQBRgHrAIUAFwCl/zH/wf5Y/vv9r/12/VT9Sf1W/Xr9s/3+/Vj+vP4n/5X/AABoAMgAHwFsAa4B5AEOAi0CQAJHAkICMAISAuYBrAFlARIBswBMAOD/b/8B/5f+OP7m/aX9ef1i/WL9ef2l/eT9Mv6O/vL+W//F/ysAjgDpADoBggG+Ae8BFAItAjoCOwIwAhgC8gHAAYABNAHdAHwAFACq/z7/1f50/h7+1/2i/YH9df1//Z790f0U/mb+wv4l/4v/8v9UALEABwFTAZUBzAH3ARcCKgIyAi0CGwL8AdABlwFSAQIBpwBGAOD/d/8Q/6/+Vv4K/s79pP2O/Y39n/3G/f79Rf6Y/vT+Vv+5/xoAeQDRACIBaQGmAdcB/QEXAiUCJgIbAgIC3QGrAWwBIwHPAHMAEQCt/0n/6P6O/j/+/f3M/az9oP2o/cL97/0r/nX+yf4k/4P/4/9BAJsA7wA6AX0BtAHgAQECFQIdAhgCBgLnAbsBgwFAAfIAnAA/AOD/fv8f/8T+c/4t/vX9zv25/bb9xf3m/Rj+WP6j/vf+Uf+u/woAZQC7AAoBUQGOAcAB5wECAhACEgIGAu4ByAGXAVkBEgHBAGoADQCw/1P/+f6m/l7+If7z/db9yf3P/eX9DP5B/oP+0P4j/3z/1v8vAIYA2AAjAWUBnQHKAesBAAIIAgQC8QHSAacBcAEuAeMAkQA5AN//hP8s/9n+jv5O/hv+9v3i/d796v0H/jL+av6u/vv+Tv+k//z/UgClAPMAOQF3AaoB0gHtAfwB/gHyAdoBtAGDAUcBAgG0AGEACgCz/1z/Cf++/nv+RP4Z/v798f31/Qf+Kf5Y/pP+1/4k/3b/yv8fAHIAwgAMAU4BhgG0AdYB7AH1AfAB3gG/AZQBXQEdAdQAhQAyAN7/if84/+z+p/5t/j7+Hf4J/gT+Dv4m/kv+ff66/v/+S/+c/+7/QACRAN0AIwFgAZQBvAHZAegB6gHfAcYBoQFxATYB",
    "8gCnAFgABgC0/2T/GP/T/pf+ZP4+/iT+GP4Z/in+Rf5u/qL+4P4l/3D/wP8PAGAArQD2ADcBcAGfAcEB2AHgAdwBygGrAYEBTAENAccAfAAtAN//kP9E//7+v/6K/l7+P/4s/ib+Lv5D/mT+kP7H/gb/TP+Y/+b/MwCAAMoADQFJAXwBpAHAAdAB0gHIAbABjQFfAScB5wCgAFUACAC7/3D/Kf/o/q/+f/5b/kL+Nv42/kP+Xf6C/rP+7P4t/3P/vv8JAFUAnwDjACIBWAGEAaYBuwHFAcEBsQGVAW4BPAECAcAAegAwAOX/m/9T/xH/1f6i/nn+Wv5I/kL+SP5b/nn+ov7V/hH/Uv+Z/+P/LAB0ALoA+gAzAWMBiQGlAbQBtwGuAZkBeAFNARkB3QCbAFUADADE/33/Ov/8/sb+mf51/l3+Uf5Q/lz+dP6W/sP++P41/3f/vf8EAEwAkQDSAA0BQQFrAYsBoAGqAacBmQF/AVsBLQH2ALkAdwAxAOv/pf9i/yP/6v66/pL+df5j/lz+Yf5y/o7+tP7k/hv/Wf+b/+D/JQBpAKsA5wAdAUsBcAGKAZkBnQGVAYIBZAE8AQwB1ACWAFQAEADM/4n/Sv8P/9z+sf6P/nf+a/5q/nT+iv6q/tP+Bf89/3v/vf8AAEMAhADCAPoAKgFTAXIBhgGQAY4BgQFqAUgBHQHrALIAdAAyAPH/r/9v/zT//v7Q/qr+jv59/nb+ev6J/qP+xv7y/ib/X/+d/97/HgBfAJwA1gAJATQBVwFxAYABhAF9AWwBUAEsAf4AygCQAFMAEwDT/5T/WP8h//H+yP6n/pH+hf6D/oz+n/69/uP+Ef9G/4D/vf/8/zsAeACyAOcAFQE8AVkBbQF3AXYBagFVATYBDgHfAKoAcAAzAPb/uP98/0T/Ev/m/sL+p/6W/o/+kv6f/rf+1/4A/zD/Zv+f/9z/GABVAI8AxQD1AB8BQAFYAWcBawFmAVYBPQEbAfEAwQCLAFEAFQDa/5//Z/8z/wX/3v6//qn+nf6b/qP+tP7P/vP+Hf9P/4T/vv/5/zMAbQCjANUAAQElAUIBVQFeAV4BVAFBASQBAAHUAKIAbAA0APr/wP+I/1T/JP/6/tj+v/6u/qf+qf61/sv+6P4O/zr/bP+i/9v/EwBMAIIAtQDjAAoBKQFBAU8BVAFPAUEBKgELAeQAtwCFAE8AGADg/6n/dP9D/xj/8/7W/sH+tf6y/rn+yf7h/gL/Kv9X/4n/v//2/ywAYgCVAMQA7QAQASsBPQFHAUcBPwEtARMB8QDJAJsAaQA0AP7/yP+T/2L/Nf8O/+7+1f7F/r7+wP7K/t7++f4c/0X/c/+l/9r/DgBDAHYApgDRAPYAFAEqATgBPQE5AS0BGAH7ANcArgB/AE0AGQDm/7L/gP9T/yr/B//r/tf+zP7J/s/+3f7z/hH/Nv9g/47/wP/z/yYAWACIALQA2wD8ABUBJwEwATEBKQEaAQIB4wC9AJMAZAAzAAEAz/+e/3D/Rv8h/wL/6/7c/tT+1f7f/vD+Cf8p/0//ev+o/9n/CgA8AGsAmADAAOMA/wAUASIBJwEkARkBBgHrAMoApAB5AEsAGwDr/7r/jP9h/zv/Gv8A/+3+4v7f/uP+8P4F/yD/Qv9o/5T/wf/x/yAATwB8AKUAyQDoAAABEQEaARwBFQEHAfEA1QCyAIsAYAAyAAQA1v+o/33/Vf8z/xb/AP/x/ur+6v7z/gP/Gf83/1r/gf+s/9n/BgA0AGEAigCwANAA6wD/AAwBEQEPAQUB9ADcAL4AmwBzAEgAHADv/8L/l/9v/0z/Lf8U/wL/9/70/vv+Ev88/2b/e/+w/z8AvgCbAEsAogBCATQBtgDcAI8BdgE1AEH/df/o/9j/jv81/5j+A/48/lf//v8h/yH+7/6JANAAUgCqAGkBfwGSAZoCUgPQAVL/SP/pAYkD0wHp/q79u/2X/fT9FP/3/i391vv3++X8Gf4h/6v/8v8kAGAAGgGCAsoDHgSvA10D+QOwBN4DowLgAvACBQEL//D+NP8R/j384/rr+UP57vkV/Fb97/sW+sf6QP3r/sH/YgGEA5UE3wSdBVsGdAbABo0HawfFBU8ENQQKBE0CzP/F/QD8bfrV+er5aPnx93f2ZPbl94D5Cvo5+tP7vP6hAHUBwQP0BqUHbgZiB2IKNQtMCQMIWAgeCE4GugOjAMT99vyK/ZD82Pmc9372sfU19Yr1pvZh+Gz66fuU/EX9vf4TAdEDNQbqB+wIAgmDCFcIvwi2CYEKbQgbA8f/mAFiA8b/Qvr3+GP6TvmJ9jv2e/cc9yf2a/e++k39+vzv+1T+XAM2BroFKAVuBnAIsQmRCRoInAa2BqYHfgZLAmz+Bf4o/yz+4PoS+N734fgz+Gj2xfZ1+UP7/foh+2L9DwBAAaMBJAM0Bv8IXAlhB20FjAUeB8MHtAZOBaYDjgCi/X79qP7y/bP72vk0+G72Efbj9wX6W/qY+Vz6Mv3a/xABRALOBKsH9ghzCFUHTQaMBcUFtgY6BpoDWQEjAcsAef6c/J/9AP/z/Dz4BfV69aT3ZPi190L4tvoH/Tb+gP9cAngGXgmCCZkIiAiNCGIHjQVJBM8DuQO2AxYDLgHq/qn9Hv3Y/B79cfwV+Ur1m/QO9mn22/W+9qz5O/05AOQCpwUTCH8JswlcCXIJMglkB1QFgwTQA0ICGwEuAV4BAAFvAEr/Yv3G+4b6SPgN9dXyM/Nw9RX3N/dd+Fr8LQG1BHIHmgkSCpEJDgqfCsgIAgWQAhMDgAT9A4kB/P/kAFACCgJtAH/+rPvS92H1qPVY9nL1xfNr8+717foQAPACOgTQBh4KcQouCG0Hggg6COsFnQOOAnICIgLvAC4AvwGDBHkEFQD4+sX4qfhf+GP3bvXC8j7yL/YH/GX/5//DAMADPAdrCY0K3gpJCd0FKAPcAhwDGQKIAecCxQPpAb3/8//CAKv/dP1D+/f46/Yy9cLzMfQ292z6yfvk/D4AIAV8CB0JtAi5CKgInQemBeYDNAOKAhcBUQApAe8BPQFWAG8ARgBm/mn7HPkF+In2WPQs9N72ZflL+vn7yf+YAwYGLwgfCoMKxAm2CHoG1QOUA6UE1wLV/g3+nQEdBFkCfv9o/qn9x/sF+lf5Kfhs9U7zCPSg9mf5Rvwf/3ABqgN7BloJDAsnCw0K",
    "GAjuBXsEyAP4AuQBHwG4ALUAjwFmAiYBCv6k+7z6pPl191v1zPRP9Y31NvbW+IP8Tf++AX0FigkWC9YJiAiSCFgIfQYTBBwDmANUA5oBXwDpAAUC0AEOACv+y/zt+l/4M/a69Cj0O/XJ9gL30/eC/BMDEwYTBUcF0wiHCysKWwdPBuYFKgRzAqACSQMRAjMA1ABDAz0Dhf/l+077ovub+SH2ffQB9Xb1n/V794z75P/UAooECAacB6kIAwkECQwIxQWmA64CKQK+AfIBYgIdAngBQgHxAJH/jv3A+8f5bPfY9cL1L/ZW9k73APpE/QUA8gI+BnII1AhZCL8H/wZMBrQFjASUAsEANwD5APYBKwJ4AYgA2f/h/t38O/pF+Hb3D/dG9mz17PWg+I/8FwCOAmMESQYlCC4JDwlGCGQHVQazBKgCDgGaAAUBfwG7AaYB1ABs/2L+mf3h+2P5mffe9kT2mfXN9Yz3c/qc/ZQAcQMMBu4HEwmTCTMJCgirBnMFRwTyAqoB+QADAUoBTgEDAYoArf8s/kL8QfpA+Kj29fXO9a71LPZK+Lr7D/+SAeUDcgaQCJEJlQn2CNQHbQYHBawDegLOAb0B0AGZATgB4ABGACX/k/2z+6/52vdY9jH13PTF9YX3lfkm/Gb/swJIBREHXAgZCQ0JTwghB7sFZwRbA4YC3wGXAbMB2gGqARcBMADf/hv9HPsl+V33+PVL9YP1ivZG+K36j/2QAFwDuwV/B4QIxghbCGoHKgbSBJgDoAIAArUBqwG8AbwBgAHlANr/YP6R/Jj6sPgY9wv2tvU09ob3kfkm/AT/4AF1BIUG5weICHEIvQedBkgF9APSAv8BhgFdAWcBfAFuARYBWAAr/5j9w/vc+SD4zPYX9iX2Bfet+Pn6sP2OAEoDoQVfB2QIqQhACE4HCAakBFkDTQKYAToBIgEvATQBBwGFAJv/RP6Z/MH68vhq92P2DPZ/9sH3vPlD/Bf/8AGJBKQGFQjICL8IFgj5Bp4FPAQDAxQCfAE1ASYBKAERAbkAAgDi/mD9m/vB+Q34uvb+9QD20vZr+Kv6Xv0/AAkDdwVTB3oI4wibCMQHjwY0BeUDzQIEApABYAFYAU0BFQGOAKP/T/6l/Mv69fhf90P20fUm9kn3KPma+2T+PwHmAxoGrgeJCKsIKwgyB/MFpAR1A4gC7QGgAYoBiAFwARsBagBQ/9P9Dvwt+mn4/PYe9vf1nPYI+B/6sfx9/zwCrgSaBtsHYwg+CIkHcwYvBfMD5wInArgBjgGOAY8BaAH1AB8A4f5I/Xj7ovkB+M/2O/Zn9lz3DPlS+/f9twBOA34FGAcACDUIyAfhBrEFbQRDA1gCvgFzAWMBbAFmASkBlQCb/z3+k/zG+gv5nvey9nT2+fZB+DP6o/xU/wACZwRRBpcHKggPCGQHUwYQBc8DugLtAXIBQAE8AUIBJwHIAAwA7P5w/br7+flj+DH3lfaw9pD3KPlX++r9nQAxA2QFCAf/B0MI5QcIB9sFkgRdA2ICtAFVATQBMgEoAe8AZgB9/zL+m/zd+iz5wPfP9oP29vYp+Aj6afwR/74BLgQpBoYHMwgyCJ0HnAZiBSEEBAMpAp0BWgFGAUEBIgHEAA8A+P6H/dn7GvqA+EP3lfaY9lz32fjy+nT9IQC4AvkEswbHBysI7AcqBxIG1wSoA6sC9wGPAWUBXQFQARkBlwC4/3j+6fwu+3n5Afj79pT25fb197P59/uL/i0BngOlBRYH3Af4B4AHmAZxBTwEJQNMAr4BdwFjAWABSQH3AFEAS//q/Uj8jvrx+Kf34fbG9mf3v/i1+hn9sv88An0EPwZjB9sHswcFB/4FzgSlA6kC8gGGAVoBVAFOASQBtADq/7/+RP2Z++z5cvhg9+T2GvcK+Kf5zftJ/tsARQNNBckGngfMB2UHiwZuBTwEJANEAq4BXwFGAUMBMgHtAFkAaP8c/o384fpJ+fz3K/f89oP3wPia+uj8cP/zATQEAAYyB74HqAcLBxAG5wS9A7sC+gGDAU0BQAE5ARQBrwD0/9v+cv3U+y/6tfic9w/3L/cF+If5lfv//YcA8AL/BIkGcwe3B2YHngaMBWEERwNiAsIBaQFIAUEBMAHyAGkAh/9L/sn8JvuR+T74Xvca94f3p/hm+p38Ff+QAdQDqgXuBo8HkAcJBx8GAQXcA9gCEgKTAVUBQwE7ARoBvwARAAn/r/0e/H/6A/ng90L3SPcC+Gf5W/uv/SoAjgKjBDoGNgeQB1MHnwabBXgEYAN3AtABcAFIAT4BLwH4AHwAqf9+/gv9cvvh+Yn4nfdE95f3m/g++l38w/41AXgDVgWqBl4HdQcCBygGFAX0A/ACJAKdAVcBQAE3ARsByQApADH/5/1j/Mz6Ufkm+Hf3aPcG+E/5Kftn/dX/MwJLBOwF+gZoB0EHnwapBY4EeAOMAt8BdgFHAToBLAH8AIsAyP+t/kn9u/su+tP43Pdx96v3k/gb+iH8df7dAB4DAwVkBisHVwf3Bi4GJgULBAcDNgKoAVsBPQEzARoB0QA+AFf/HP6m/Bf7nflr+K73ifcO+Dv5+/ok/YL/2QHzA58FvAY/BywHnAa1BaIEkAOhAu4BfgFIATYBKQH/AJgA5P/Y/oT9Afx6+h35HPif98L3j/j8+er7K/6HAMUCsAQdBvYGNgfrBjIGNgUiBB0DSQK0AV8BPAEvARkB2ABSAHn/T/7m/F/76Pmx+Of3rvca+Cz50frk/DL/ggGdA1EFfgYTBxQHlwa/BbYEpwO2Av4BhgFJATMBJgEBAaQA/f8C/7z9RfzE+mb5XPjP99z3j/jh+bb75P0zAG4CXQTWBcAGEwfbBjQGRAU3BDQDXALAAWQBOwEsARgB3gBjAJn/fv4j/ab7Mvr2+CD41Pco+CD5q/qo/Ob+LQFHAwMFPgblBvoGkAbGBccEvQPMAg4CjwFMATEBIwECAa8AEwAo//H9hvwM+675nPgA+Pj3kvjK+Yf7of3k/xgCCgSOBYgG7gbKBjQGUQVLBEoDbwLNAWoBOwEpARYB4gByALf/q/5d/er7evo7+Vr4/fc6+Bj5ifpv/Jz+2gDzArUE/QW2Bt4GhgbMBdcE0gPhAh8CmQFPAS8BIAECAbgAKABM/yP+xfxS+/X53fgz+Bf4mfi2+Vv7Yf2X/8UBuQNGBU8GyAa2BjEG",
    "WwVeBGADggLbAXEBPAEmARQB5gCAANL/1P6U/Sz8wfqA+ZX4J/hO+BP5a/o7/Ff+igCgAmgEuwWFBr8GegbPBeYE5gP2AjACpAFTAS4BHgEDAb8APABt/1P+Af2W+zv6Hfln+Dj4ovin+TP7Jf1M/3MBaAP+BBUGnwagBiwGZAVvBHQDlgLqAXkBPQEkARIB6QCMAOv//P7J/Wz8BvvE+dH4U/hl+BL5UvoK/BT+PABPAhsEeQVSBp8GawbRBfME+gMKA0ECsAFYAS4BGwECAcUATQCM/4D+Ov3Y+4D6Xvmc+Fv4r/ib+RD77PwF/yQBGQO1BNkFdAaIBiUGawV/BIkDqQL5AYEBQAEjARAB6wCXAAAAIP/8/an8SfsH+gz5gPh/+BT5O/rd+9X98v//Ac4DNgUeBn0GWwbQBf4EDAQeA1MCvAFeAS4BGQEBAcsAXACo/6r+cf0Y/MP6nvnR+ID4v/iT+fD6t/zA/tcAygJtBJ0FSAZtBhwGcAWOBJwDvAIIAosBQwEiAQ4B7ACgABUAQ/8r/uT8i/tJ+kj5r/ib+Bn5Kfq0+5n9qf+xAYID8wTpBVgGSAbNBQgFHQQyA2UCyQFkAS8BFwEBAc8AagDC/9L+pv1W/AX73fkI+af40fiO+dP6hvx//owAfQIlBGAFGgZRBhAGcwWbBK4DzwIYApUBRwEhAQwB7QCoACgAYv9Y/hz9yvuK+oT53/i5+CL5GvqP+2H9ZP9lATcDsASyBTIGMwbIBQ8FLQRFA3YC1gFsATEBFgH/ANMAdwDa//j+2P2R/EX7HPo/+c/45viM+br6WPxA/kMAMQLdAyIF6wUyBgMGdAWnBMAD4gIoAqABTAEhAQsB7gCvADkAgP+D/lL9CPzK+r/5EPnZ+C35Dvpt+yz9If8bAe0CbAR7BQsGHQbCBRUFOwRXA4gC5AF0ATQBFQH+ANYAgQDx/xv/B/7L/IT7W/p2+fn4/fiN+aX6LvwF/v7/5wGVA+QEuwUSBvMFcwWxBNED9QI4AqsBUQEiAQkB7gC1AEgAnP+r/ob9RPwJ+/v5Qfn7+Dv5BfpO+/r84P7TAKQCKQRDBeEFBAa5BRoFSQRpA5oC8gF8ATcBFAH9ANgAiwAEADv/NP4C/cH7mPqt+ST5FvmS+ZP6B/zN/br/ngFOA6UEiQXxBeIFcAW5BOADBgNIArcBVwEjAQgB7gC6AFYAtf/R/rf9fvxG+zb6c/ke+Uv5APoz+8v8o/6NAFwC5QMKBbcF6QWuBRwFVQR6A6sCAAKGATsBFAH8ANoAlAAXAFr/X/43/f371frk+VD5MfmZ+YT64/uY/Xn/VwEIA2YEVgXNBc4FawXABO8DGANYAsMBXgElAQcB7gC+AGMAzP/1/ub9tvyC+3D6pvlD+V75/vkb+6D8af5JABUCogPQBIsFzQWhBR0FXwSKA7wCDwKQAT8BFQH7ANsAmwAnAHf/iP5q/Tf8EPsc+n35T/mi+Xn6w/tm/Tr/EgHDAicEIwWoBbkFZQXFBPwDKQNpAs8BZgEoAQcB7QDCAG4A4v8X/xP+7Py9+6r62flp+XP5/vkH+3j8Mf4HAM8BYAOWBF4FrwWSBRwFaASZA80CHgKaAUUBFgH6ANwAoQA3AJH/rv6b/W/8S/tT+qr5bvmu+XD6pvs3/f7+zgB/AugD7gSCBaIFXAXJBAgEOQN5AtwBbgErAQcB7QDFAHgA9v82/z7+IP32++P6DPqR+Yr5Avr2+lP8/P3J/4wBHgNcBC8FjwWCBRkFcASnA90CLQKlAUsBFwH6AN0ApwBFAKr/0v7J/aX8hPuK+tn5jvm9+Wr6jPsL/cT+jQA8AqoDuQRaBYkFUgXLBBMESAOJAuoBdwEvAQcB7QDHAIEABwBT/2f+Uv0u/Bz7QPq6+aL5B/rn+jL8y/2M/0kB3AIhBAAFbgVwBRQFdgS0A+0COwKwAVEBGQH6AN0ArABRAMD/9P72/dn8vPvA+gf6sPnO+Wj6dvvj/I7+TQD6AWsDhAQxBW4FRgXLBBwEVwOYAvcBgAEzAQgB7ADJAIgAGABv/43+gf1k/FP7c/rj+b35EPrc+hP8nP1R/wkBnALnA9AETAVcBQ4FegTAA/wCSgK8AVgBHAH6AN0AsABcANX/FP8g/gz98/v2+jf60/nh+Wf6Yvu9/Fn+EAC5AS0DTgQHBVIFOAXKBCQEZAOnAgUCiQE4AQkB7ADLAI8AJwCI/7H+r/2Y/Ir7pvoN+tn5G/rT+vj7cP0Z/8oAXAKsA58EKAVGBQUFfgTLAwsDWQLIAWABHwH6AN4AswBmAOn/Mv9J/j39KPwr+2b6+Pn2+Wr6Ufua/Cj+1v96AfACFwTcBDUFKAXHBCsEcQO2AhICkwE+AQsB7ADMAJUANQCg/9T+2/3L/L/72fo4+vf5KPrN+t/7Rv3j/owAHgJyA24EAwUvBfwEfwTUAxkDaALUAWgBIwH7AN4AtgBvAPr/Tv9v/mz9XPxf+5b6HfoM+m/6Q/t6/Pn9nf88AbMC4QOwBBYFFwXDBDAEfQPFAiACngFEAQ0B7ADNAJoAQQC2//T+Bf78/PP7C/tj+hb6N/rK+sn7IP2v/lEA4AE4AzwE3QQWBfAEfwTdAyYDdgLgAXABJwH8AN4AuQB3AAoAaP+T/pn9j/yT+8X6Q/ok+nb6OPtd/M39Zv//AHcCqgODBPYEBAW8BDQEiAPTAi0CqAFKARAB7QDOAJ8ATADK/xP/Lf4s/Sf8PfuP+jf6SPrJ+rb7/Px//hgApAH+AgoEtgT8BOMEfgTkAzMDhALsAXkBLAH9AN4AuwB+ABkAgf+2/sT9wPzG+/T6avo++n/6L/tD/KT9Mf/FADsCdANWBNQE8AS1BDcEkgPgAjsCswFRARMB7gDPAKMAVgDd/y//VP5Z/Vn8b/u7+lj6WvrL+qb73PxQ/uH/aQHFAtcDjQTgBNUEewTqAz4DkQL5AYIBMQH/AN8AvQCFACYAmP/X/u798Pz4+yT7kfpZ+ov6Kfss/H39//6LAAECPQMnBLIE2gSrBDgEmgPtAkgCvgFZARcB7wDQAKYAYADu/0r/eP6F/Yn8n/vn+nr6b/rP+pn7vvwk/qz/LwGMAqQDZATDBMQEdgTvA0kDnwIFAowBNwECAd8AvgCKADMArf/1/hX+Hv0o/FP7ufp2+pj6JvsX/Fn9zv5UAMgBBwP5A44EwwSgBDgE",
    "ogP5AlUCygFhARsB8ADQAKkAaAD+/2P/m/6w/bj80PsT+536hfrV+o77ovz7/Xj/9gBUAnIDOwSlBLMEcATyA1MDqwISApYBPQEEAeAAwACPAD4Awf8T/zv+Sv1Y/IH74vqU+qj6JfsF/Df9of4eAI8B0QLKA2oEqwSUBDYEqAMEA2IC1QFpASAB8gDRAKwAbwAMAHv/u/7Z/eb8//s/+8H6nfre+oX7ifzU/Uf/vwAcAj8DEASGBKAEaQT1A1wDtwIeAqABRAEIAeEAwQCUAEgA0/8u/1/+df2H/K/7Cvuy+rn6Jvv1+xj9df7r/1gBnAKbA0QEkQSGBDMErgMPA24C4QFyASUB9ADSAK4AdgAZAJH/2v4A/hP9Lfxq++b6tvro+n/7c/yv/Rj/igDmAQwD5QNmBIsEYAT2A2QDwwIqAqoBSwELAeMAwgCXAFEA5P9I/4L+n/20/Nz7M/vS+sv6Kfvo+/z8TP65/yIBZwJsAx4EdgR3BC8EsgMYA3oC7AF6ASoB9gDTALAAfAAmAKX/+P4l/j79W/yW+wv70Pr0+nv7X/yN/ev+VgCwAdkCugNFBHYEVgT1A2oDzgI2ArQBUgEPAeQAwwCbAFoA8/9g/6L+x/3g/An8XPvy+uD6Lvve++L8Jf6J/+0AMgI8A/cDWgRnBCkEtQMhA4YC9wGEATAB+QDUALIAgQAxALn/E/9J/mj9h/zB+zD76/oC+3r7Tvxu/cD+JAB8AacCjgMiBF8ESgTzA3AD2AJCAr8BWQETAeYAxQCeAGEAAQB2/8H+7f0M/TX8hfsT+/X6NfvV+8r8AP5b/7oA/wENA9ADPQRVBCIEtwMpA5ECAwKNATYB/ADWALQAhgA7AMr/Lv9r/pD9s/zs+1b7B/sR+3r7P/xQ/Zf+9P9IAXUCYgMABEcEPQTwA3UD4gJNAskBYQEYAegAxgChAGgADgCM/9/+Ev41/WH8rfs1+wz7PvvP+7X83v0v/4gAzAHdAqgDHwRCBBoEtwMwA5sCDgKWATwBAAHXALYAigBEANv/Rv+M/rf93fwW/Hv7JPsi+337Mvw1/XD+xv8WAUQCNgPcAy4ELwTsA3kD6gJYAtQBagEdAesAxwCjAG4AGgCf//v+Nf5e/Yv81vtX+yT7SfvL+6L8vv0F/1gAmgGuAn8DAAQuBBAEtwM2A6UCGQKgAUMBAwHZALcAjgBNAOr/Xf+r/t39B/1A/KH7Qvs0+4H7KPwd/Uz+mf/kABICCQO2AxIEHgTmA3sD9AJlAuEBdQEmAfAAygClAHEAIQCt/xD/Uv6C/bT8//t9+0L7XPvQ+5f8pP3d/icAZAF4Ak4D2AMRBAEEtAM+A7UCLAKzAVQBEAHgALkAjQBNAO3/Z/+9/vj9Kv1p/Mz7avtU+5X7LPwQ/S7+bf+uANgB0AKEA+oDBQTbA34DAQN5AvkBiwE4AfwAzwClAHAAIQCx/xz/Z/6g/dn8Kfyn+2f7d/vd+5T8kP26/vj/LAE/AhgDqgPwA+0DrwNFA8UCQgLKAWgBHwHpAL0AjQBLAO//bv/M/hD+S/2Q/PX7kft1+6r7MvwG/RT+RP97AKABmAJRA8ID6QPOA34DDAOMAg8CoQFKAQgB1gCnAG8AIQC1/yb/ev67/fz8UfzP+4v7k/vs+5T8f/2a/sv/+AAHAuMCfAPNA9gDpwNKA9MCVgLgAX0BLwHzAMIAjgBLAPD/df/a/if+av21/B38uPuV+8D7O/z+/Pz9H/9LAGoBYQIfA5kDzAO+A3sDFQOcAiMCtgFcARYB3gCrAHAAIQC4/zD/i/7V/R39d/z2+6/7r/v8+5X8cf18/qL/xQDRAa4CTgOpA8ADnQNMA98CaAL1AZEBPwH/AMgAkABMAPL/e//n/jz+hv3X/EP83fu1+9f7Rfz5/Oj9/f4eADYBLALtAm8DrQOsA3YDGwOrAjcCywFvASQB5wCvAHEAIwC8/zn/m/7t/Tz9mvwc/NL7y/sN/Jn8Zf1i/nv/lgCdAXoCIAOEA6cDkANMA+kCeQIJAqUBUAELAc8AlABNAPX/gf/z/k/+of34/Gj8AfzV++77UPz3/Nf93f71/wUB+AG8AkUDjQOYA28DHwO4AkkC3wGCATMB8gC1AHQAJADA/0H/qv4D/ln9vfxA/PT75/sf/J78XP1L/lf/aQBrAUgC8gJeA4wDggNJA/AChwIcArgBYQEYAdgAmABQAPf/h//+/mH+uv0X/Yr8JPz1+wb8Xfz2/Mj9wf7O/9YAxgGMAhsDbAODA2UDIAPCAlkC8gGUAUMB/QC8AHgAJwDE/0n/uP4Y/nT93fxi/BX8A/wy/KX8Vv03/jb/PgA7ARcCxAI4A3ADcQNEA/YClAItAssBcgEmAeEAngBTAPv/jP8I/3H+0f00/av8RvwT/B78a/z3/Lv9qP6p/6kAlgFdAvACSgNsA1oDIAPLAmgCBAKmAVMBCQHEAH0AKwDJ/1H/xf4r/o79+/yD/DX8HvxG/K78Uf0l/hj/FgANAecBlwIRA1MDXwM9A/kCoAI9At0BhAE0AewApQBYAP//kv8S/4H+5/1Q/cr8Zvwx/Db8efz6/LH9kf6H/38AaAEuAsYCKANTA0wDHQPRAnUCFQK4AWMBFgHNAIMALwDN/1j/0f49/qb9GP2j/FX8Ovxa/Lf8T/0W/v3+8v/hALkBagLqAjUDSwM0A/oCqQJMAu4BlAFDAfcArQBdAAIAmP8b/4/++/1p/ej8hfxP/E78ifz//Kn9fP5o/1cAOwEBApwCBQM5Az0DGAPWAoECJALJAXMBIwHXAIkANADS/2D/3P5O/rz9M/3B/HP8VPxu/ML8Tv0J/uT+z/+3AIwBPgLDAhYDNgMqA/kCsAJZAv4BpQFSAQMBtQBjAAcAnv8k/53+Dv6C/QT9o/xr/Gb8mfwF/aT9a/5L/zIAEAHVAXIC4QIeAywDEgPYAooCMwLZAYMBMQHiAJEAOgDY/2f/5/5e/tH9Tf3d/JD8b/yD/M78T/3+/c7+r/+QAGEBFAKcAvYCHwMdA/YCtgJlAg0CtQFhARABvwBqAA0Apf8t/6r+IP6Y/R/9wPyH/H78qvwM/aD9W/4w/w8A6ACqAUkCvQICAxoDCQPZApMCQALpAZMBPwHtAJoAQQDe/27/8v5s/uX9Zf35/Kz8ifyX/Nv8Uf31/br+kf9rADgB6gF2AtUCBwMPA/IC",
    "uQJvAhwCxQFwAR0ByQByABQAq/82/7b+Mf6u/Tj92/yi/JX8u/wU/Z39Tf4Y/+//wQCAASECmQLlAgYD/wLYApkCTAL4AaIBTQH5AKMASADl/3b//P56/vf9fP0S/cb8ovys/Oj8Vf3u/aj+dv9IABABwQFPArQC7gL/AusCuwJ4AikC1AF/ASoB1AB7ABsAs/8//8L+QP7C/VD99fy7/Kz8zPwe/Z39Qv4D/9H/nABZAfkBdQLIAvEC8wLVAp4CVgIGArEBXAEGAa4AUADs/37/Bv+I/gn+kf0r/eD8uvzA/Pb8Wv3p/Zj+Xf8nAOoAmQEpApMC1ALtAuMCvAJ/AjUC4wGOATgB4ACFACMAuv9H/83+T/7V/Wb9Dv3U/MP83vwo/Z39Of7v/rT/eQAyAdIBUQKqAtoC5QLQAqECXwITAsABagETAbgAWQD0/4b/EP+V/hn+pf1C/fn80vzU/AT9YP3l/Yv+Rv8IAMYAcwEEAnICuQLbAtkCugKEAj8C8QGdAUYB7ACPACwAwv9Q/9j+Xf7n/Xv9Jf3s/Nn87/wy/Z/9Mf7e/pr/WAANAa0BLgKLAsMC1gLJAqICZwIfAs4BeQEgAcQAYwD9/4//Gv+h/in+uP1Y/RD96fzo/BP9aP3j/X/+Mf/s/6QATgHfAVECngLHAs4CtwKIAkkC/gGrAVQB+QCaADUAy/9Z/+P+a/73/Y/9O/0D/e78Af0+/aP9K/7O/oL/OQDqAIgBCwJsAqsCxgLBAqICbQIqAtwBhwEuAdAAbQAFAJf/I/+t/jj+yv1t/Sb9//z8/CH9b/3j/XX+Hv/R/4MAKgG7AS8CggKyAsECsgKLAlECCgK5AWIBBgGlAD8A1P9j/+3+eP4H/qL9UP0Z/QP9Ev1J/af9J/7B/mz/HADIAGQB6AFOApICtAK4AqACcgIzAukBlQE8Ad0AeAAPAKH/Lf+4/kb+2/2A/Tv9FP0P/TD9eP3j/W3+Df+5/2QACAGYAQ4CZgKcArICrAKMAlgCFQLGAXABEwGxAEoA3v9s//j+hf4X/rT9ZP0u/Rf9I/1V/az9JP61/lj/AQCoAEIBxgEvAngCogKtApwCdQI8AvUBowFJAeoAhAAZAKr/N//E/lP+7P2T/VD9KP0i/T/9gf3l/Wf+/v6i/0cA5wB2Ae4BSQKFAqMCpAKLAl0CHwLTAX4BIQG+AFUA6P92/wL/kf4l/sX9d/1C/Sr9NP1i/bL9Iv6r/kb/6f+KACABpQEQAl4CjgKgApgCdwJDAv8BsAFXAfYAkAAkALX/Qv/Q/mL+/f2n/Wb9QP04/VL9jv3r/WT+8v6O/ywAxgBSAckBJwJoAosCkgKBAlkCIALYAYUBKgHHAF8A8/+D/xL/o/48/uD9lf1h/Ur9Uf16/cP9Kv6p/jr/0/9rAPwAfAHnATcCawKDAoECZwI5AvsBsAFaAfwAmAAuAML/Uv/k/nr+Gv7I/Yn9Y/1a/XH9p/37/Wr+7v5+/xMApQAsAaAB/gFCAmoCdwJsAksCGALVAYcBLgHOAGgA/v+R/yT/uf5V/v39tv2E/Wz9cv2W/dj9Nv6r/jH/wP9PANkAVQG+ARACRwJkAmgCVQIuAvUBrwFdAQIBoAA4AM7/Yv/3/pH+Nf7m/ar9hv18/Y/9v/0M/nL+6/5x//3/hgAHAXkB1gEcAkgCWwJXAjwCDwLSAYgBMgHVAHEACQCf/zT/zf5t/hn+1f2l/Y79kf2x/e39Q/6u/ir/r/82ALkAMAGXAekBIwJFAk8CQwIiAu8BrQFfAQcBpwBCANr/cP8J/6f+Tv4D/sr9pv2c/az92P0e/nv+6v5n/+n/agDlAFMBsAH3AScCPwJBAi0CBQLOAYgBNgHbAHoAEwCs/0T/4P6E/jP+8v3F/a79sP3N/QP+Uf6z/iX/of8fAJoADQFxAcMBAAImAjYCLwIVAugBqwFhAQwBrwBLAOb/f/8a/7v+Zv4e/uf9xv27/cn98f0w/oX+6/5e/9j/UQDFADABigHSAQYCIwIqAhwC+wHIAYcBOQHhAIIAHQC4/1P/8v6Z/kz+Dv7j/c39zv3n/Rn+YP66/iL/lf8KAH4A7ABNAZ8B3QEHAhwCGwIHAt8BqAFiARABtgBUAPH/jP8q/87+fP43/gT+5P3Z/eb9Cf5D/pH+7v5Y/8j/OQCoAA4BZgGvAeUBBgITAgsC7wHCAYYBOwHnAIkAJwDE/2H/A/+t/mP+KP7//er96/0C/i/+cP7C/iL/i//5/2UAzQArAXsBuwHoAQICBwL4AdYBpAFiARQBvABdAPz/mf85/+D+kf5Q/h7+AP72/QH+Iv5X/p3+8/5U/7v/JACMAO0ARAGMAcQB6QH7AfkB4wG7AYQBPQHrAJEAMQDQ/2//E//A/nn+Qf4a/gb+B/4c/kX+gP7L/iP/g//p/04AsAAKAVkBmgHJAecB8QHoAcwBnwFiARcBwgBlAAUApf9I//H+pf5m/jj+G/4S/hz+Ov5q/qv++f5R/7H/EgBzAM8AIwFqAaQBzAHiAeYB1gG0AYEBPwHwAJgAOgDb/3z/I//S/o7+WP40/iH+If41/lr+kP7V/iX/fv/b/zkAlgDtADoBegGsAcwB2wHWAb8BlwFeARgBxgBtABAAs/9Z/wX/u/5+/lH+Nf4r/jP+Tv55/rT+/P5P/6j/AwBgALgACQFPAYgBsQHJAc8BwwGlAXcBOQHwAJ0AQwDp/47/OP/r/qj+c/5O/jn+N/5H/mn+mv7a/iX/eP/R/yoAgwDWACEBYAGSAbMBwwHBAa0BiQFVARQBxwB0ABsAw/9s/xv/1P6Y/mv+Tv5C/kf+Xv6G/rz+//5M/6D/+P9PAKQA8gA2AW4BmAGxAbkBsAGVAWsBMgHuAKAATAD2/5//Tf8C/8H+jP5n/lL+Tf5a/nj+pf7f/iX/dP/I/x0AcQDBAAoBRwF4AZoBqwGsAZwBewFLAQ8ByAB5ACUA0f9+/zH/6/6x/oT+Zv5Z/lz+b/6T/sX+A/9L/5r/7f9AAJEA3AAeAVUBfwGZAaMBnAGFAV8BKwHrAKIAUwABAK//YP8Y/9n+pf5//mn+Y/5t/of+sP7m/if/cP/A/xAAYQCuAPQAMAFgAYIBlAGXAYoBbQFBAQoBxwB9AC4A3/+Q/0X/Av/J/p3+fv5v/nD+gP6g/s7+B/9L/5X/4/8yAH8AyAAIAT0BZgGBAY0B",
    "iQF1AVMBIwHoAKQAWQALAL7/cv8t/+/+vf6X/oD+eP6A/pb+u/7t/in/bv+5/wUAUgCbAN4AGQFIAWoBfgGCAXgBXgE3AQQBxgCAADYA6/+f/1j/F//g/rT+lf6F/oT+kv6u/tf+DP9L/5H/2/8lAG8AtADyACYBTwFqAXcBdQFlAUYBGgHkAKQAXgAVAMv/g/9A/wX/1P6v/pf+jf6S/qb+x/70/iz/bf+z//z/RACKAMoAAwExAVMBaAFuAWYBUAEsAf0AxACDAD0A9v+u/2r/LP/2/sv+rP6b/pj+o/68/uH+Ev9M/47/0/8aAGAAogDeABEBOAFUAWIBYgFUATkBEQHfAKQAYgAdANj/k/9T/xr/6v7F/q3+ov6l/rX+0/78/jD/bP+u//L/NwB5ALcA7gAbAT0BUgFaAVQBQQEhAfYAwQCEAEMAAAC8/3v/P/8L/+H+wv6w/qv+tP7K/uz+GP9O/4v/zf8PAFIAkQDKAPsAIwE+AU0BTwFEASwBCAHZAKMAZQAkAOP/ov9k/y3///7b/sL+tv63/sX+3/4F/zX/bP+q/+r/KwBqAKYA2gAGAScBPQFGAUIBMgEVAe4AvQCFAEcABwDI/4r/Uf8f//b+1/7E/r7+xf7Y/vb+H/9R/4r/x/8GAEUAgQC4AOcADgEpATkBPQE0AR4B/gDTAKEAaAArAO3/r/91/0D/E//v/tf+yv7J/tT+7P4O/zr/bf+n/+P/IABcAJUAxwDyABMBKQEzATEBIwEKAeYAuQCFAEsADwDT/5n/Yv8y/wr/7P7Z/tH+1v7m/gH/J/9V/4n/wv/+/zkAcgCmANQA+gAVASYBKgEjAREB9ADNAJ4AaQAwAPb/vP+E/1L/Jv8D/+v+3f7b/uT++f4Y/0D/b/+k/93/FgBPAIUAtQDfAP8AFQEgASABFAH+AN0AtACEAE4AFgDe/6b/cv9E/x3/AP/s/uT+5v70/g3/L/9Z/4n/v//3/y4AZACWAMIA5gABARIBGAETAQMB6QDGAJsAagA0AP7/x/+T/2P/Of8X//7+8P7s/vT+Bv8h/0b/cv+j/9j/DQBDAHYApADMAOwAAgENAQ8BBQHxANQArgCCAFAAHADn/7P/gf9V/zT/Jf8s/zb/L/9J/7//JADp/4D/v/9JACkAof/G/4IAggBr/6/+Lv/7/1AAdACLAFoAIwCoAPQBqgK3AXcA3ADnAXsBLwCo/4P/vP4H/mv+r/71/H/6xPr9/XcA1/8w/lr+1/8cAccCAwW/BXwETAMvA3gDowNMAy8CmQDW/hn99Puy+537+foD+qf5u/pm/Pz8iv3c/zACmwLrAu0EBgdVB3wGnAWTBFED4gJ/A9sCT/8t+5H51/mH+bH4DPla+hD7e/vN/Ib+7//KAU0E7wX+BRwGXgdKCFQHRgViA3UBfP9N/qz9Z/wv+gn4aPeB+N/5VfqS+lT8cP+GAXkCwwTIBxQIPwZbBlcIBQjrBHkCwgGzAFz+nvvL+KP2Bfc4+T760/kV+oX7M/36/jQBuwNJBnwIbAnSCJAHegbEBRwF6gMIAqP/sfyz+bf3Gvfq93H59/gN9s/1Q/sIAY4BHwCjAmgHBwkvCOoIRQoQCWAGHAU8BRgExv+j+g35bvoi+in34PRK9VH3dPkC++n7Vv29AC0FiAesBswF5wf0CjILaQhoBVQE3wM7ASH99foL+1T6vvfm9ZX2K/jG+BL57fq6/pECNgSuA0ED6QTuB9gJyAkECZIHQgS4ALD/0v8e/hv73Pg/9/D1ZPY1+Vb8ev0y/Qv+lQCpAikDpwOcBRIIHglnCP0GaAW7A6QC9AG2/3H79Pct9x/3AfY09vH5df6m///9cv0GALkDbAUjBZAFXQd5CNQHngZSBrUGhgWIAdP8q/mn97L1X/TF9NL2wPnc/CL/uv+K/xgAUwEJA64FxwdsB34GDAiSCmgKfQczBHQBb/6x+j73NfWd9Pv09PXT9wP7KP6M/ygAYgE4Au0BEQK2A9sFxgeWCZAKLgotCXsHxwNL/l359fa09lj2BPUi9VD4UPzW/lkANgGZAKT/lwC7AocDJwNcBCQI1QseDMoI1gRKAuf/Rvx++Br2sfTq86j1cfoh//8AZABR/4//SgHhAqECvwFlA/AGVQhvB7sHEAnvB6wDmv5w+n73LPU38yPzvPaZ/EkAyv9T/kn/ugFwAwMETAOXAa8BsAXIClUMzAlvBkcELQL1/ov7wPja9fvydvJ69YT5HPxu/rIBewPiAc7/hACzAhQEWwVHBw0JQAo2Cl8IHgZcBEMBnPvr9Y7zcvTc9Yz22/eu+uH9/P+qAOgAnQEAAo0B+wFgBP8GQQgZCWcKpgpECPIDtf9v/OP4DfXO8/j1UPgS+Vz6Uv3F/3kA5ACCAXABZQFKAhADCQRfB1ELFQv6BmgEzgRgA7j9zPck9a707PTD9oD6wP2r/tn+MgDKAUkCKgL0AbUBPgJYBFEHjgkxCicJggbSAjH///vb+BX2m/Sr9EH2n/mL/ZD/l/8AAIIBgQIyAt4B/ALyBCgG8waICL4JmAjWBZIDdQFz/fD3MPTR8xv1Rfa+99D61f4qAfUAVwABAUwC4ALeAswDFwY+CFoJxgkxCXgHUgXrARX8h/ZX9Tj3JffS9Ej1S/or/zMAo/9/AKQBPgHaAIMC5wScBasF8wd5C8ULhwekAlIA0P44+732y/Sj9cz2q/fZ+Yv9rQCwAREBTQA8ALIAwwHAA7kFyAayB80I5QhtBw0F2wGZ/Wr52fbg9bb1nvbx+Jv7oP19/3UBaAKxAckAHgELAuMChAQcB/0IGAkLCFUG4AP7AP39nvoD9230JfQn9i355Pvc/Xn/EgEjAgACQwFZAcICoQTeBV8GHAePCJIJlwhRBdEAkPw7+bH2AvW99Cn2o/gQ++L8ZP78/2MBFQI+AlgCbALgAqEEQAf+CF4JPAmACBIG4gFO/aX5M/e69T31Dfb691T6t/zg/j4AvgDqADIBnwEYAtoCVAR0BnIIgwlnCTIIzwVNAlL+nPqc9+j17/UW92v4CfqF/FL//QAUAasAvwA2AccBugI+BAYGrQfMCNUIiAc3BT8Cu/71+sv3Cva99Z/2evjj+lP9c//hAF0BVwFzAaYB1gGQAjwERAbGB3gIbQhrBzAF9QFA/qH6uvcE9on1Lvbs93b6Hv1B/68AggHKAboB",
    "vwEyAiYDhwQ4BuAH6wjrCMIHewVCAoH+0vrN9931P/Xu9aj3Avp9/Kj+OgAdAXEBewGUAQkCBQOBBEQG7AcJCTQJMgj9BdACHf9v+1n4TvaN9Rf2r/fp+Uz8aP7w/8sAGQEdAS4BmgGPAgkEzwWFB7gIBAknCBoGEgN8/+L71fjI9v31efYA+C36hfyZ/hoA8AAzASgBJAF3AVECsgNmBREHRAiaCNAH2wXsAmz/4vve+NX2C/aG9g74QPqj/MX+VgA6AYgBfwF1AbsBgQLLA2oFBActCH8ItwfGBdsCW//N+7/4qPbN9Tr2uvfr+Vb8if4wAC0BkwGdAaEB7QG1Av0DmgU0B2EIuwj9BxUGLgOt/xT88fi+9sP1D/Zz94/57/sf/s3/1ABHAV0BawG+AYsC2QN/BScHaAjcCDoIbQafAysAmPxu+Sn3FfZE9ov3jfnY+/v9of+jABEBIgEnAW8BMgJ4AxoFyAYXCKEIHAhxBsIDagDp/Mj5g/do9ov2xPe8+QD8IP7F/8YAMAE6ATEBaAEUAkQD1AR2BsIHUgjbB0IGpwNgAOv80fmL92z2ifa+97b5APwq/t7/7gBlAXYBbgGdATwCXQPdBHMGuAdICNUHRAavA2sA9PzR+X33TPZX9n73bvm4++v9rf/QAFoBewF+AbIBUwJyA/EEiAbTB20ICAiEBvsDvABC/RP6qvdf9k72W/c2+XL7n/1j/40AHwFHAVABhwEoAkcDyQRnBsAHbgghCLgGRgQaAan9efoG+Kj2gfZ29zz5afuM/Uv/cgADASgBKgFYAe4BAgN8BBoGegc2CAAIsAZZBEMB4/26+kf44vav9pj3VPl7+5z9Xf+IABwBQAE8AV4B5AHnAlIE5QVBBwII1geWBk8ESQHy/cz6Vvjo9qv2i/dB+Wj7j/1b/5MAMwFfAV4BfgH8AfQCVATfBTgH+wfXB6IGZgRnARL+6Ppl+Of2l/Zl9w/5MPtZ/S3/cQAeAVcBXgGAAf0B8gJQBNoFOAcGCPAHywafBKsBWv4r+5z4Cvej9lv38vgG+yn9/P5FAPkANwFBAWIB3AHMAicEswUYB/MH8AfiBswE6gGk/nj74vhD98v2cPf2+P36Gf3s/jYA7AArATMBTgG+AaQC9gN9BeQGyAfVB9oG2QQKAtH+qvsT+Wv35vZ99/j4+foT/ej+OAD1ADcBPwFVAbsBlQLcA1sFvwaoB8AH1AbjBCEC8v7N+zH5f/fs9nX35fjf+vn80/4tAPMAPgFIAV4BvwGRAs8DSQWtBpsHvQfgBv4ESQIg//z7WPmZ9/T2bPfN+L761fyy/hIA4QAzAUIBWAG1AYECuQMwBZUGiwe7B+4GHQV3Alj/NvyM+cD3C/dx98L4qPq6/Jf+/f/RACkBOgFOAaYBagKbAw4FdAZxB60H8QYzBZwCiP9q/Lz55fch93f3u/iW+qT8g/7u/8gAJQE5AUsBnQFaAoMD8ARWBlgHoAf0BkYFwAK2/5v86vkI+Db3fPex+IL6jPxs/tv/vQAgATcBSAGVAUoCawPTBDgGQAeTB/YGWgXjAuT/zfwY+iz4S/eB96f4b/pz/FT+yf+xABoBNQFEAY0BOgJUA7YEGwYoB4YH+AZtBQUDEAD+/Eb6Ufhh94f3n/hc+lv8Pf62/6UAFAEyAUEBhQErAj0DmgT+BQ8HeAf5Bn4FJgM8AC/9dPp2+Hj3jveX+Er6RPwl/qP/mAAOAS8BPgF+AR0CJwN/BOEF9wZqB/kGjwVGA2cAX/2i+pv4j/eW95H4OPot/A7+kP+MAAgBLQE7AXcBDwISA2MExAXeBlsH+AafBWUDkQCP/dD6wPio9573i/gn+hb89v19/38AAQEqATkBcAECAv0CSQSnBcUGSwf3Bq0FgwO7AL79/vrm+MD3qPeF+Bf6//vf/Wn/cQD6ACYBNgFqAfUB6QIuBIsFrAY7B/QGuwWfA+QA7f0s+wz52vey94H4B/rp+8j9Vf9kAPIAIwEzAWQB6QHVAhUEbwWTBioH8QbHBbsDDAEb/lr7M/n09733fvj4+dP7sf1B/1YA6gAgATABXgHdAcEC+wNTBXkGGQftBtMF1gMzAUn+h/ta+Q/4yfd7+Or5vvua/S7/SADiABwBLgFZAdEBrwLiAzcFYAYIB+gG3QXwA1kBdv61+4H5KvjW93n43Pmp+4P9Gv85ANoAGAErAVMBxgGdAsoDHAVHBvYG4gbnBQkEfwGj/uL7qPlG+OP3ePjP+ZX7bf0F/yoA0QAUASgBTgG8AYsCsgMBBS0G4wbcBu8FIQSjAc/+D/zP+WL48vd4+MP5gftX/fH+GwDJABABJgFJAbEBegKaA+YEFAbRBtUG9wU4BMcB+/48/Pf5f/gB+Hn4uPlu+0D93f4MAL8ADAEjAUUBqAFpAoMDywT6Bb0GzQb+BU4E6QEl/2n8H/qc+BD4evit+Vv7Kv3J/v7/tgAHASABQAGeAVkCbQOxBOEFqgbFBgQGYwQLAlD/lfxH+rr4Ifh8+KP5SfsV/bT+7v+sAAIBHgE8AZUBSQJXA5cExwWWBrwGCQZ2BCwCef/B/G/62fgy+H/4mfk3+//8oP7e/6IA/QAbATgBjQE6AkEDfgSuBYIGsgYNBokETAKi/+38l/r4+ET4g/iR+SX76vyM/s7/mAD4ABgBNAGEASsCLANkBJQFbgaoBhAGmwRsAsr/GP2/+hf5VviI+In5FfvV/Hf+vv+NAPIAFQEwAXwBHQIXA0sEewVaBp0GEgatBIoC8v9D/ef6Nvlp+I34gfkE+8D8Y/6t/4IA7AASAS0BdQEQAgMDMwRiBUUGkgYUBr0EpwIYAG79D/tW+X34k/h7+fX6rPxP/p3/dwDmAA8BKQFtAQIC8AIbBEkFMAaGBhUGzATEAj4AmP03+3f5kfia+HX55fqY/Dr+jP9sAOAADAEmAWYB9QHcAgMEMAUbBnkGFQbaBN8CYwDC/WD7l/mm+KH4cPnX+oT8Jv57/2AA2gAJASMBYAHpAcoC6wMXBQYGbQYUBugE+gKIAOz9iPu4+bz4qvhs+cn6cfwS/mr/VQDTAAUBHwFZAd0BtwLUA/8E8AVfBhMG9AQUA6wAFf6w+9n50viy+Gj5u/pe/P79Wf9IAMwAAgEcAVMB0QGmAr0D5gTbBVEGEQYABS0DzwA9/tj7+/np+Lz4Zfmu+kv86v1I/zwA",
    "xQD+ABkBTQHGAZQCpwPOBMUFQwYOBgsFRQPyAGX+//sd+gD5xvhj+aL6OfzW/Tf/MAC+APoAFgFIAbsBgwKRA7YErwU1BgsGFQVcAxQBjf4n/D/6GPnR+GH5lvon/MP9Jf8jALYA9gATAUIBsQFzAnsDngSaBSYGBwYeBXMDNQG0/k/8Yfow+d34YPmL+hX8r/0U/xYArgDyABABPQGnAWMCZgOHBIQFFgYCBiYFiANVAdv+dvyD+kj56vhg+YH6BPyc/QL/CQCmAO4ADAE4AZ0BUwJRA28EbgUHBvwFLgWdA3UBAf+d/KX6Yvn3+GH5d/r0+4n98f78/54A6QAJATMBlAFEAj0DWARYBfcF9gU0BbADkwEn/8T8yPp7+QT5Yvlt+uP7dv3f/u//lQDlAAYBLgGLATYCKQNBBEIF5gXwBToFwwOxAUz/6/zr+pX5Evlk+WX60/tj/c3+4f+MAOAAAwEqAYIBJwIVAysELAXWBekFPwXVA88BcP8R/Q77r/kh+Wf5XfrE+1H9vP7T/4MA2wAAASUBegEZAgIDFAQWBcUF4QVEBecD6wGU/zj9MfvK+TH5avlV+rX7Pv2q/sX/egDWAP0AIQFyAQwC7wL+AwAFtAXZBUcF9wMHArj/Xv1U++X5Qflu+U76p/ss/Zj+t/9wANAA+gAdAWoB/wHdAugD6wSiBdAFSgUHBCIC2/+D/Xf7AfpR+XP5SPqZ+xr9h/6p/2cAywD2ABkBYwHyAcsC0wPVBJEFxwVMBRUEPAL9/6n9mvsc+mP5ePlD+ov7Cf11/pr/XQDFAPMAFQFcAeYBugK9A78EfwW9BU4FIwRVAh0Azv29+zn6dPl++T76fvv4/GT+i/9TAL8A7wASAVUB2gGoAqgDqgRtBbMFTwUxBG4CPgDy/eD7VfqG+YT5Ofpx++f8Uv59/0gAuQDsAA4BTgHPAZgClAOUBFsFqAVPBT0EhgJfABf+A/xy+pn5i/k2+mX71vxB/m7/PgCzAOgACgFIAcQBhwKAA38ESQWdBU4FSQSdAn8AO/4m/I/6rPmT+TL6WvvF/C/+X/8zAK0A5QAHAUIBuQF3AmsDagQ2BZIFTQVTBLMCngBe/kj8rPrA+Zz5MPpP+7X8Hv5Q/ygApgDhAAMBPAGuAWgCWANVBCQFhgVLBV0EyQK8AIL+a/zJ+tT5pfku+kT7pfwN/kH/HQCfAN0AAAE2AaQBWAJEA0AEEQV6BUkFZwTeAtoApP6O/Of66fmu+S36OvuW/Pz9Mv8SAJgA2QD8ADEBmwFKAjEDKwT/BG4FRgVvBPIC9wDH/rD8BPv++bj5LPow+4f86/0i/wYAkQDVAPkAKwGRATsCHwMXBOwEYQVDBXcEBQMUAen+0/wi+xP6w/ks+if7ePzb/RP//P+JANAA9gAmAYgBLQIMAwME2QRUBT8FfwQYAzABCv/1/ED7KfrO+Sz6H/tq/Mr9BP/w/4IAzADyACEBfwEfAvoC7gPGBEYFOgWFBCkDSwEr/xf9Xvs/+tr5LvoX+1z8uv31/uT/egDHAO8AHAF3ARIC6QLaA7QEOAU1BYsEOgNmAUz/Of19+1b65/kv+g/7Tvyq/eX+2P9yAMMA7AAYAW4BBQLXAscDoQQqBS8FkARLA4ABbP9b/Zv7bfrz+TL6CPtB/Jr91v7M/2oAvgDoABMBZwH4AcYCswOOBBwFKQWUBFoDmQGM/3z9ufuE+gH6NPoC+zT8iv3H/r//YgC5AOUADwFfAewBtQKgA3sEDgUjBZgEaQOyAav/nf3Y+5v6D/o4+vz6J/x6/bf+s/9ZALQA4QALAVcB4AGlAo0DaAT/BBwFmwR3A8oByf++/fb7s/od+jz69/ob/Gv9qP6m/1AArwDeAAYBUAHVAZUCegNWBPAEFAWeBIUD4QHn/9/9FfzL+iz6Qfry+hD8W/2Z/pr/RwCpANoAAgFJAckBhQJnA0ME4QQMBaAEkgP3AQQA//0z/OT6O/pG+u76BPxN/Yr+jf8+AKQA1wD+AEMBvgF2AlUDMATSBAQFoQSeAw0CIQAf/lL8/fpL+kv66vr5+z79e/6A/zUAngDTAPsAPAG0AWcCQwMeBMIE+wSiBKkDIwI+AD/+cfwV+1v6Uvrn+u/7L/1r/nP/LACYAM8A9wA2AakBWAIxAwsEswTyBKIEtAM3AloAX/6P/C/7bPpY+uT65fsh/Vz+Zv8iAJIAzADzADABnwFKAh8D+QOjBOkEogS+A0sCdQB+/q38SPt9+mD64vrb+xP9Tv5Z/xkAjADIAO8AKgGWATwCDgPnA5QE3wShBMcDXwKQAJ3+zPxi+4/6Z/rg+tL7Bv0//kz/DwCGAMQA7AAlAYwBLgL9AtUDhATVBKAE0ANxAqsAu/7q/Hv7ofpw+t/6yvv4/DD+P/8FAH8AwADoAB8BgwEhAuwCwwN0BMsEngTYA4MCxADa/gj9lfuz+nn63/rB++v8If4x//z/eQC8AOUAGgF7ARQC2wKxA2QEwASbBOADlQLeAPf+Jv2v+8X6gvrf+rr73/wT/iT/8f9yALcA4QAVAXIBBwLLAp8DVAS1BJgE5wOlAvYAFf9E/cn72PqM+t/6svvS/AX+F//n/2sAswDdABABagH7AbsCjgNEBKoElQTtA7UCDwEy/2L95Pvs+pb64Pqr+8b89/0J/93/ZACvANoACwFiAe8BrAJ8AzMEngSRBPIDxQImAU//gP3++//6ofri+qX7uvzp/fz+0v9dAKoA1gAGAVoB4wGcAmsDIwSTBI0E+APTAj0Ba/+d/Rj8E/us+uT6n/uv/Nv97/7H/1UApgDTAAIBUgHXAY0CWgMTBIcEiAT8A+ICVAGH/7r9M/wo+7j65vqZ+6T8zf3i/rz/TgChAM8A/QBLAcwBfgJJAwMEegSDBAAE7wJqAaL/1/1O/Dz7xPrp+pT7mfzA/dT+sf9GAJwAzAD5AEQBwQFwAjgD8wNuBH0EAwT8An8Bvf/0/Wj8UfvQ+u36kPuO/LL9x/6m/z4AlwDIAPUAPQG3AWECKAPjA2EEdwQGBAgDlAHY/xH+g/xm+9368fqM+4T8pf26/pv/NgCSAMUA8AA3AawBUwIXA9IDVQRxBAgEFAOoAfL/Lf6d/Hv76/r1+oj7e/yY/a3+kP8uAI0AwQDsADABogFGAgcDwgNIBGoECgQfA7sBCgBJ/rj8kfv4+vr6hftx/Iv9",
    "n/6F/yYAiAC9AOgAKgGZATgC9wKyAzsEYwQLBCkDzgEjAGX+0/ym+wb7//qC+2j8f/2S/nr/HgCCALoA5QAkAY8BKwLoAqIDLQRcBAwEMwPhATwAgf7t/Lz7FfsF+4D7YPxz/YX+bv8VAHwAtgDhAB4BhgEeAtgCkwMgBFQEDAQ9A/MBVACc/gj90vsk+wz7fvtX/Gf9eP5j/w0AdwCyAN0AGQF9ARICyQKDAxMETAQMBEUDBAJsALf+Iv3p+zP7E/t9+1D8W/1s/lf/BABxAK4A2QATAXQBBQK6AnMDBQRDBAsETQMUAoQA0v49/f/7Q/sa+3z7SPxP/V/+TP/8/2sAqgDWAA4BbAH5AasCYwP3AzsECgRVAyUCmgDt/lf9FfxS+yH7e/tB/ET9Uv5A//P/ZQCmANIACQFkAe4BnQJUA+oDMgQIBFwDNAKxAAf/cf0s/GP7Kvt7+zr8Of1G/jX/6v9fAKIAzgADAVwB4gGOAkQD3AMpBAYEYwNDAscAIf+M/UP8c/sy+3z7NPwu/Tj+KP/g/1cAnQDLAAABVwHaAYICNgPOAx0EAARkA04C2gA6/6j9XvyJ+0D7gPsv/CL9KP4X/9H/TQCYAMkA/wBUAdQBeQIpA78DEAT4A2QDVwLsAFP/xf16/KD7T/uF+yr8Fv0Y/gb/wv9DAJIAxwD+AFIBzwFwAh0DsQMEBPADZANgAv4AbP/h/ZX8t/td+4r7JvwK/Qj+9f60/zgAjADEAP0AUAHKAWcCEAOjA/cD6ANjA2gCDgGD//z9sPzN+237kPsj/AD9+f3l/qX/LQCFAMAA+wBOAcUBXgIEA5YD6gPgA2IDbwIeAZr/F/7L/OT7fPuX+yD89fzq/dT+lv8iAH4AvQD5AEsBwAFWAvkCiAPeA9gDYAN2Ai4Bsf8x/ub8+/uM+577Hvzs/Nz9xP6H/xYAdwC5APcASQG8AU4C7gJ7A9IDzwNeA3wCPAHH/0v+AP0S/Jz7pfsd/OP8zv20/nn/CwBvALUA9QBHAbcBRgLjAm8DxgPHA1wDggJKAdz/Zf4b/Sn8rfuu+x382/zA/aX+av8AAGcAsQDzAEQBswE/AtgCYgO6A74DWQOHAlgB8P9+/jT9QPy++7b7HfzT/LP9lf5b//T/XwCsAPAAQgGvATgCzgJWA64DtQNWA4sCZQEDAJb+Tv1X/M/7v/sd/Mz8p/2G/kz/6P9WAKcA7QA/AasBMQLEAkoDowOtA1MDkAJxARYArv5n/W784fvJ+x78xvyb/Xj+Pv/b/00AoQDqAD0BpwEqAroCPwOXA6QDUAOTAnwBKQDG/oD9hfzy+9P7IPzA/I/9af4v/8//RACcAOcAOgGjASQCsQI0A4wDmwNMA5cChwE7AN3+mf2c/AT83vsi/Lv8hP1b/iH/w/87AJYA4wA3AZ8BHQKoAikDgQOTA0gDmgKSAUwA8/6x/bP8Fvzp+yX8tvx6/U3+Ev+2/zIAkADgADQBmwEXAp8CHgN2A4oDRAOcApwBXQAJ/8n9yfwo/PT7Kfyy/HD9QP4E/6n/KACJANwAMQGXAREClwIUA2sDgQNAA54CpQFtAB7/4f3g/Dv8APwt/K78Zv0z/vb+nf8eAIIA1wAuAZMBDAKPAgoDYQN4AzsDoAKuAX0AM//4/ff8TfwM/DH8q/xd/Sb+6P6Q/xQAewDTACoBjwEGAocCAANWA3ADNwOhArYBjABH/w/+Df1g/Bn8Nvyp/FX9Gv7b/oP/CgB0AM4AJwGLAQECfwL2AkwDZwMyA6ICvgGbAFv/Jv4j/XP8Jfw8/Kf8Tf0O/s3+dv8AAG0AyQAjAYgB+wF4Au0CQwNfAy0DowLFAakAbv88/jn9hfwy/EL8pvxF/QL+wP5p//b/ZQDEAB8BhAH2AXEC5AI5A1YDKAOjAswBtgCB/1H+T/2Y/ED8SPyl/D799/2z/l3/6/9dAL4AGwGAAfEBagLbAi8DTgMjA6MC0wHDAJP/Z/5k/av8TfxP/KX8OP3s/ab+UP/g/1UAuQAXAXwB7AFjAtMCJgNGAx4DowLZAc8Apf98/nr9vvxb/Fb8pfwy/eH9mf5D/9X/TACzABMBeAHnAVwCygIdAz4DGAOjAt4B2wC2/5D+j/3R/Gn8Xvym/Cz91/2N/jf/yv9EAKwADgF0AeIBVgLCAhQDNgMTA6IC4wHmAMf/pP6k/eT8ePxm/Kf8J/3O/YD+Kv+//zsApgAKAXAB3QFPAroCDAMuAw4DoQLoAfEA1/+4/rj99vyG/G/8qfwj/cX9dP4e/7T/MgCfAAUBawHYAUkCswIDAyYDCQOgAu0B/ADm/8v+zf0J/ZX8ePyr/B/9vP1p/hH/qP8pAJgAAAFnAdQBQwKrAvsCHgMDA58C8QEGAfb/3v7h/Rz9pPyB/K78HP20/V7+Bf+d/x8AkQD6AGMBzwE9AqQC8wIXA/4CnQL1AQ8BAwDw/vX9L/2z/Ir8sfwZ/az9U/75/pH/FgCKAPUAXgHKATgCnQLrAg8D+AKcAvgBGAESAAL/CP5B/cL8lPy1/Bb9pP1I/u3+hv8MAIMA7wBZAcYBMgKWAuMCCAPzApoC+wEhAR8AFP8c/lT90fye/Ln8FP2d/T3+4f57/wIAewDqAFUBwQEsApAC3AIBA+0CmAL+ASkBLQAl/y/+Zv3h/Kn8vfwT/Zb9M/7W/m//+f9zAOQAUAG8AScCiQLVAvoC6AKWAgACMQE5ADb/Qf54/fD8s/zC/BL9kP0q/sr+ZP/v/2sA3QBLAbcBIgKDAs4C8wLjApMCAgI4AUYARv9U/ov9AP2+/Mf8Ef2L/SD+v/5Y/+X/YwDXAEYBsgEcAn0CxwLsAt0CkQIEAj8BUgBW/2b+nf0P/cr8zfwR/YX9F/60/k3/2/9aANAAQAGuARcCdgLAAuUC2AKPAgYCRgFdAGb/eP6u/R/91fzT/BH9gP0O/qn+Qv/R/1IAygA7AakBEgJxArkC3wLTAowCCAJMAWgAdf+J/sD9Lv3h/Nn8Ev18/Qb+nv43/8b/SQDDADUBpAENAmsCswLYAs4CiQIJAlIBcwCD/5r+0v0+/e384PwT/Xj9/v2U/iv/vP9AALwAMAGfAQgCZQKtAtICyQKHAgoCVwF9AJL/q/7j/U79+fzn/BT9dP32/Yr+IP+x/zcAtAAqAZoBAwJgAqcCzALEAoQCCwJdAYcAn/+7/vT9Xf0F/e78",
    "Fv1x/e/9gP4V/6f/LgCtACQBlQH+AVoCoQLGAr8CgQILAmIBkQCt/8v+Bf5t/RH99vwZ/W796P12/gv/nP8lAKUAHgGPAfkBVQKbAsACugJ+AgwCZgGaALr/2/4V/nz9Hf3+/Bv9bP3h/Wz+AP+S/xwAngAYAYoB9AFPApUCuwK1AnwCDAJrAaIAx//r/ib+jP0q/Qb9H/1q/dv9Y/71/of/EgCWABEBhQHvAUoCkAK1ArACeQIMAm8BqwDT//r+Nv6b/Tf9D/0i/Wj91f1a/uv+ff8JAI4ACwF/AekBRQKKArACqwJ2AgwCcwGzAN//CP9G/qv9RP0Y/Sb9Z/3Q/VL+4f5y/wAAhQAEAXkB5AFAAoUCqgKnAnMCDAJ2AbsA6v8X/1b+uv1Q/SH9Kv1m/cr9Sf7W/mj/9v99AP0AdAHfATsCgAKlAqICcAIMAnoBwgD1/yX/Zf7J/V39Kv0u/Wb9xv1B/s3+Xf/s/3UA9gBuAdoBNgJ7AqACngJtAgwCfQHJAAAAM/91/tj9av0z/TP9Zv3B/Tn+w/5T/+L/bADvAGgB1AEwAnUCmgKYAmkCCgJ+Ac8ACgBB/4X+6v17/UH9Pf1r/cL9Nv68/kv/2f9iAOUAXgHKASUCaQKOAo0CYAIFAn4B1AAUAE//l/79/Y79Uf1J/XP9xP00/rf+Q//Q/1kA2wBUAb8BGgJeAoMCgwJXAv8BfQHYAB0AXv+p/hD+oP1i/Vb9ev3H/TP+sv48/8f/TwDRAEoBtQEPAlICeAJ4Ak8C+gF8AdwAJgBr/7r+I/6z/XL9Y/2C/cv9Mv6t/jT/v/9GAMcAQAGrAQUCRwJsAm4CRgL0AXoB3wAvAHj/yv41/sX9gv1v/Yv9zv0x/qn+Lf+2/zwAvgA2AaEB+gE8AmICYwI+Au4BeAHiADcAhf/b/kf+1/2S/Xz9k/3S/TD+pf4n/67/MwC0ACwBlwHwATICVwJZAjUC6QF2AeUAPgCR/+r+Wf7p/aP9if2c/df9MP6h/iD/pf8qAKsAIgGNAeYBJwJMAk8CLALjAXQB5wBFAJz/+f5q/vv9s/2X/ab92/0x/p7+Gv+d/yEAoQAZAYMB3AEdAkICRQIkAt0BcQHpAEsAp/8I/3v+DP7D/aT9r/3g/TH+m/4U/5b/GACYAA8BegHSARMCOAI8AhwC1gFvAeoAUgCy/xb/i/4d/tP9sf25/eX9Mv6Y/g7/jv8PAI8ABgFwAcgBCQIuAjICEwLQAWwB6wBXALz/JP+b/i7+4/2//cL96/0z/pX+Cf+G/wcAhgD9AGcBvwH/ASQCKQILAsoBaQHsAFwAxf8x/6v+P/7z/cz9zP3x/TX+k/4D/3////98APMAXQG1AfYBGgIfAgMCxAFlAewAYQDO/z7/uv5P/gP+2v3X/ff9N/6R/v7+eP/3/3MA6gBUAawB7AERAhYC+gG9AWIB7ABlANf/Sv/J/l/+Ev7o/eH9/f05/o/++v5x/+7/awDhAEsBogHjAQgCDQLyAbcBXgHsAGkA3/9W/9j+b/4i/vX97P0E/jz+jv71/mr/5v9iANgAQgGZAdoB/gEEAuoBsQFaAewAbQDn/2H/5v5+/jH+A/72/Qv+P/6N/vH+ZP/e/1kAzwA5AZAB0QH1AfwB4wGqAVYB6wBwAO7/bP/0/o7+QP4R/gH+Ev5C/o3+7f5d/9b/UADGADABhwHIAe0B8wHbAaQBUgHqAHMA9f92/wH/nP5P/h7+DP4a/kX+jP7p/lf/z/9IAL0AJwF/Ab8B5AHrAdMBngFOAekAdQD7/4D/Dv+r/l7+LP4X/iH+Sf6M/ub+Uf/H/z8AtAAeAXYBtgHbAeMBywGXAUoB6AB4AAAAiv8a/7j+bP45/iL+Kf5O/o7+5f5N/8H/NwCrABQBawGsAdEB2gHFAZMBSQHqAHwABwCT/yT/xP53/kT+LP4x/lT+kf7l/kr/u/8vAKEACQFgAaABxwHRAb4BjwFHAesAgAANAJv/Lv/P/oP+Tv41/jn+Wf6U/uX+SP+2/ygAmAD+AFQBlQG8AcgBtwGKAUUB7ACEABQAo/84/9r+jv5Z/j/+Qf5f/pf+5v5G/7H/IQCPAPQASQGKAbIBvwGwAYYBQwHsAIcAGQCr/0L/5P6Z/mT+Sf5J/mX+m/7m/kT/rf8aAIYA6gA/AX8BqAG2AakBgQFBAe0AigAfALP/S//v/qT+bv5S/lH+a/6e/uf+Qv+o/xMAfgDgADQBdQGeAa0BogF8AT4B7QCNACUAu/9V//n+rv55/lz+Wf5x/qL+6f5B/6T/DQB1ANYAKQFqAZQBpAGaAXcBPAHtAJAAKgDC/13/A/+5/oP+Zf5h/nf+pv7q/j//oP8HAG0AzQAfAWABigGbAZMBcgE5Ae0AkwAvAMn/Zv8N/8P+jf5v/mr+fv6q/uv+Pv+d/wEAZQDDABUBVQGAAZMBjAFtATYB7QCVADMA0P9v/xf/zv6Y/nj+cv6E/q7+7f49/5n//P9eALoACwFLAXYBigGFAWcBNAHtAJcAOADX/3f/IP/Y/qL+gv56/or+sv7v/jz/lv/3/1YAsQABAUEBbAGBAX0BYgEwAewAmQA8AN3/f/8p/+H+rP6L/oL+kf62/vH+PP+T//H/TwCpAPgANwFjAXgBdgFdAS0B6wCaAEAA4/+H/zP/6/61/pT+iv6X/rv+8/48/5H/7P9IAKAA7gAtAVkBcAFvAVcBKgHqAJwARADp/47/O//1/r/+nf6S/p7+v/71/jv/jv/o/0IAmADlACQBUAFnAWcBUQEmAekAnQBHAO//lv9E//7+yP6m/pr+pP7E/vf+O/+M/+P/OwCQANwAGgFHAV4BYAFMASMB6ACeAEsA9P+d/0z/B//S/q/+ov6r/sn++v48/4r/3/81AIkA0wARAT0BVgFZAUYBHwHmAJ8ATgD5/6T/Vf8Q/9v+uP6q/rH+zf79/jz/iP/b/y8AgQDLAAgBNAFNAVEBQAEbAeUAoABRAP7/q/9d/xn/5P7B/rL+uP7S/v/+Pf+G/9f/KQB6AMIA/wArAUUBSgE6ARcB4wCgAFQAAgCx/2X/Iv/t/sr+uv6//tf+Av89/4T/0/8kAHMAugD2ACIBPAFDATUBEwHhAKAAVgAGALf/bP8q//b+0/7C/sX+3P4F/z7/g//Q/x4AbACyAO0AGgE0ATsBLwEPAd8AoQBYAAsAvf90/zP/",
    "//7b/sr+zP7h/gn/P/+C/83/GQBlAKoA5QARASwBNAEpAQsB3QChAFoADwDD/3v/O/8H/+T+0v7T/ub+DP9B/4H/yv8UAF4AowDcAAgBJAEtASMBBwHaAKAAXAATAMn/gv9D/xD/7P7Z/tn+7P4P/0L/gP/H/xAAWACbANQAAAEcASUBHQECAdgAoABeABYAzv+J/0v/GP/0/uH+4P7x/hP/Q/+A/8T/CwBSAJQAzAD4ABQBHgEXAf4A1QCfAGAAGgDU/4//Uv8g//z+6f7n/vb+Fv9F/3//wv8HAEwAjQDEAPAADAEXAREB+gDTAJ8AYQAdANn/lv9a/yj/BP/w/u3++/4a/0f/f/+//wMARwCGAL0A6AAEARABCwH1ANAAngBiACAA3f+c/2H/MP8M//j+9P4B/yP/Xv+x/wMAOwCFABcBgwE1AaMApQDlAHMAmP9y//L/x/+b/uL9d/5r//D/RACFAHAAQAC0ANYBTQIMAXn/jv9bANH/jf4+/oL+Vv5k/qj/1gD+/0v+Hv+dAggF9wOCAYMAjwAyACYAuAD8/5H9qftZ+wH8IP1F/hn/yf92ACkBQgLgAyQFMQU1BBMDqwI9AkAA8/1S/dn80fo3+QD6rPth/L38yP0+/9wAeAMQBxsJwAcnBU8EiQRhA/sAMP/v/eP7kPlf+AL45/fs+E/7hP3J/psA7AMRB08IPwj/BzwH4AXABKQDbwHx/U36IPjD9+H3aPcX97D4Avyh/lUAgANnB3kINwejB6MJEAl6BWYCAQFT/4T8j/nT9hb1M/Zk+ZT7YPzE/R0AXgJGBCIGxAfxCFwJPwh9BSkCSv9A/eD7sfqX+b34BPjI9+X4eftS/3YD8gQnAw4DngeACzwJTgTdAoIDKAHQ/Mz6ZfqU+IX2Fvck+tP88fyJ/J3/OwVsCOkH3gYzB9EHUAcxBaoBPf66/JD8+fof9230BPbg+S78ivyD/e0AIwX7BtYG0QcHCkMKagckBGACtACF/cj5rPfh98f4XfjP9nT2M/kr/qECcAWYB+kIDwicBj4HlQiMB44EkwFs/tH6aPgl+Gf4VffU9Zj2G/rl/WMAswLvBfwI/gniCA8HWwUDBKgD3wNbAlf+c/qo+Dv3yvQf9MP3Bf2j/7n/wgBbBD0IPAmFBxkG9wVRBT8D9wDs/9b/f/7M+gH3jPUJ9jr3TvnY/D4BVAVBCCcJlwf8BE8DvgIKA1YEvQT6AeD9zvvz+pH4dfWM9MH2pPqp/nYC6gU0CKMITAdmBXMECgTzAh0CaAINAqL/Zfyg+RD3DfXL9FP2UfkX/pkDTwdCCPAH9gcZCJkGOQPnAIwB7AKUAtUADP6p+UX1uPO99Pn1bPde+ysCnggXC2kJ4Qb1BbYFwgTNA6YDEAMGATX/hf7K/J34qfPe8Ezyo/ci/qgCJQX2B20KLAk6BV8DYgQXBWYElQMPA/IBAv8M+l71CfT79cz33/ch+Q3+fwQfCckKLAkABdwBwwKeBSQGuQM8ATEADP90/HX5L/dC9f7zo/UG+x4B9QRnB64JrgkBBg8CaQG4AlsDggN4A0cCz/8g/LD34vRJ9Rn3c/ih+oH/mgVTCUQJYQeyBWYEGgP9Ad0B3gIqA0sBgf4W/DT5l/WT8wv1zPjO/JgAsQR+CLAJ1AcGBtQF9gSAAg4B1gFjAgwB7P5r/Or4q/U89Bf0yPVb+54CMwbXBZMGugmaCvgG5wLNAUACSgJgAqcC/QA//AH3Q/Tl8+X0cfc2+x7/2gJ5BigJzAl8CD0G9AN8AocCfgO9A28C3f9T/Jz4R/aM9Rr1YvWF+E3+0QP8BjAImwgMCM4FTgOvAkkDGANcAmkCLwIm/6P5OfUT9Aj1qPZn+UL+EASsB9wHqwb9BYYFTQStAiwCBwN4A3UCcACE/TT67Pdd9nL0dvSY+V0BogVRBUQFrAfGCPsFewLJAaEChQILAl4CswHO/Yn4DvbA9i/3bfb199b9wQRBCF0IAgiwB8QFwAJIATcCnAOLA94Bcv/G/MT5Bveq9ZP1cfY5+fn92wKFBuYIjwkTCKIF+gM9A6wCbQKoAioCEgBA/Z76zvff9Kjzg/VL+Xz9FwKhBjAJ/QhOB3MF/QN2A+MDKQRVA6gB1P/l/VT7D/gQ9eLzcfUK+SL9BwHSBAgIcwlXCIUFHwOoApADRQTlA44CwgCC/nX7Afhs9dn0WPYl+ZD8YQBHBEwHewjqB1AGJgRMAgQC/AJlA5cCVwGg/5z8pPh09Yf0//UW+Qf9SAEGBU4H9QdVB7gFygOHAlUCvgLmAkkC8ADp/iD87fhR9lj1UPbs+ML8FQHPBFgHnghACCcGngNXAoMC2AJ5ArkBxwAA/xH8wvgt9g/13/Wf+Jr84wDSBLoH4AgfCE8GggQ1A4MCbwKTAlECQQEU/9H7Zfj99f70evXW9wH8yQC7BDUHSQgOCMEGCwWgA9oCwQL2ArgCcgEs/zz8DvlE9sb0PvWm92770//sA9MGEwjZB6gGDwWmA+oC4AIWA+0C7QHb/938h/ms9hv1XfWF9yb7cf9zA1wGuweXB2IGxwRvA7wCsALvAukCFAIpAE79DPow94r1qfWp9yX7V/9OAzkGnweBB0oGpQQ6A3QCXAKbAqUC7QEoAHH9SPp298v12PXB9yz7V/9TA0wGxQezB34GzARJA2UCMQJeAmQCtwEFAGH9Rvp398P1v/WY9/n6Kf84A1EG7Qf6B9cGKAWYA5wCTgJnAmICtAEHAGj9Svpt95/1ffU494f6tv7XAhIG2QcSCBEHdQXqA+gCkAKhApsC8QFLAK/9ivqW96T1U/Xh9g36Kf5NAp4FiAfnBwgHhAUGBAkDtALMAtQCPgKuACL+//r99+n1a/XG9sX5wv3aATAFLAeiB9gGYgXqA+4CnAK9AtgCYALyAIT+dPtz+E72rvXh9rj5mP2hAfcE/QZ/B74GSAXHA78CYgKCAqgCSAL7AK7+uPvB+Jf25PX89rr5iP2NAesEAAeSB9kGYAXQA7ICPwJPAnMCHQLjAK/+y/vc+Kz26fXs9pj5X/1qAdwEDQe6BxQHogUKBNkCTwJMAmUCEALfALb+2fvn+Kj2zPWz9kj5Bv0YAaEE9AbGB0AH4AVNBBYDfwJwAoQCMQIJAej+DfwQ+bn2uvV69u34lvylAD4ErgajBz0H9QVvBDoDoAKRAqkCYwJMATv/",
    "aPxl+fb20/Vn9rH4O/w9ANkDWwZqBxwH5gVpBDUDmgKNAq8CfQJ/AYn/x/zI+U33DPZ79p74Cfz6/5QDIQZBBwMH1wVZBB4DegJpApECbwKMAbL/CP0W+pb3Q/aV9pr47fvT/28DCAY6BwsH5AViBBoDZQJHAmsCUgKBAb7/Kf1B+r/3XfaX9oT4xvun/0wD+QVDBykHDgaKBDYDcAJAAlwCRAJ+Acr/Qv1f+tX3X/Z/9lL4gvtf/xAD1gU+B0AHOAa7BGEDjwJTAmgCUQKUAe7/b/2M+vb3Z/Zl9hf4MPsE/7wClwUdBz0HSwbZBIEDqQJnAnoCagK7ASQAs/3S+i/4hfZh9u736Pqs/mUCTwXtBiYHSAbiBIsDrgJoAnwCdwLaAVgA+f0g+3f4t/Zy9tv3t/po/h4CEwXEBhIHRAbkBIoDpgJZAmwCbwLlAXoAMf5k+7j46faI9tL3k/o0/ucB5wSrBg0HTQbxBJIDowJKAlkCYALkAY4AWP6X++v4DfeV9sL3avr9/bEBvgSYBhAHYQYMBakDrgJJAk8CWALnAaEAfP7E+xf5KveX9qj3N/q8/XABjAR9Bg8HcwYoBcQDwQJQAlACWgLzAb0Ap/74+0f5Svec9o73Afp2/SgBUQRYBgMHfAY8BdoD0AJXAlECXgIBAt0A2P4z/ID5c/er9nz30/k1/eIAFQQwBvIGfwZLBekD2QJXAkwCWwILAvgABf9s/Ln5n/e+9nD3q/n5/KIA3AMKBuQGhQZbBfsD5AJYAkcCVwIRAg8BLv+i/PD5yffQ9mT3gvm9/GAAowPkBdQGiQZsBQ4E8QJbAkMCVAIXAiUBVv/W/Cf69Pfk9lv3XPmD/B8AaQO8BcMGjQZ9BSEE/gJfAkACUAIcAjoBff8K/V36IPj59lP3OPlK/N//LwOTBbEGjwaMBTMECwNjAjwCTQIhAk4Bov89/ZP6TfgR9073FfkS/J7/8wJpBZ0GkAabBUYEGQNoAjoCSQIkAmABxv9v/cr6e/gq90r39fjc+1//uAI9BYcGkAapBVkEKANuAjcCRQInAnEB6f+f/f/6qfhE90n31/io+yD/fAIRBXAGjga2BWsENgN0AjYCQAIpAoEBCQDP/TX72Phg90r3u/h1++H+QALjBFgGiwbCBX0ERgN7AjQCPAIqApABKQD+/Wr7CPl+9033ovhD+6P+BAK0BD4GhgbNBY8EVQOCAjMCOAIrAp0BRwAr/p/7OPmd91L3ivgU+2f+yAGFBCMGgAbXBaEEZQOKAjMCNAIrAqoBZABY/tP7aPm991n3dPjm+iv+iwFUBAYGeQbhBbIEdQOTAjMCMAIrArUBgACD/gf8mfnf92H3Yfi6+vD9TwEjBOgFcAbpBcMEhQOcAjQCLAIqAr8BmgCt/jr8yvkB+Gz3T/iP+rb9EgHwA8gFZgbwBdMElgOmAjUCKQIpAskBswDV/mz8+/kl+Hj3QPhm+n391gC9A6gFWgb2BeMEpgOwAjcCJQIoAtEBywD9/p78LfpK+If3MvhA+kX9mgCKA4YFTgb7BfMEtwO7AjkCIgImAtgB4QAj/8/8Xvpw+Jb3J/ga+g/9XgBWA2MFPwb/BQIFyAPGAjwCHwIjAt8B9gBI///8j/qX+Kj3Hfj3+dn8IwAhAz4FMAYCBhAF2APSAkACHQIhAuUBCgFs/y79wfq++Lv3FvjW+aX86f/sAhkFHgYEBh0F6QPeAkQCGgIeAukBHQGP/1398vrn+ND3EPi2+XL8rv+2AvIEDAYEBioF+QPrAkkCGAIbAu4BLwGw/4r9I/sQ+eb3DfiZ+UH8dP+AAssE+AUDBjYFCgT3Ak4CFwIZAvEBPwHQ/7f9VPs6+f73C/h9+RH8Ov9JAqIE4wUBBkIFGgQFA1MCFQIWAvQBTwHv/+P9hftk+Rf4C/hj+eL7Av8TAngEzQX+BUwFKgQSA1oCFQITAvYBXQEMAA7+tfuP+TH4DfhL+bX7yf7cAU4EtQX6BVYFOgQgA2ACFAIPAvgBagEoADf+5fu6+U34Efg1+Yn7kv6lASMEnAX0BV8FSgQuA2gCFAIMAvkBdgFDAGD+Ffzm+Wn4F/gh+V/7W/5uAfYDggXtBWcFWQQ8A3ACFQIKAvkBggFdAIj+RPwS+of4HvgO+Tf7Jv43AckDZgXlBW4FaARLA3gCFgIHAvkBjAF2AK/+c/w/+qb4J/j++BD78f0AAZwDSgXbBXQFdgRZA4ECFwIEAvkBlQGOANT+ofxr+sf4Mvjv+Or6vf3JAG0DLAXRBXoFhARoA4oCGQIBAvkBngGkAPn+zvyY+uj4Pvjj+Mf6iv2SAD4DDQXFBX4FkgR3A5QCGwL/AfgBpQG5ABz/+/zF+gr5TPjY+KX6WP1cAA8D7QS3BYEFnwSGA54CHgL9AfYBrAHNAD7/J/3y+iz5XPjP+IT6J/0mAN8CzASpBYMFrASVA6gCIQL7AfUBsgHgAGD/Uv0e+1D5bfjH+GX6+Pzx/64CqQSZBYQFtwSjA7MCJQL5AfMBtwHyAID/ff1L+3X5f/jC+Ej6yfy8/30ChgSIBYQFwwSyA74CKQL4AfEBvAEDAZ//pv14+5r5kvi++C36nPyH/0wCYgR2BYMFzQTBA8oCLgL3AfABwAETAbz/z/2k+7/5p/i8+BP6cPxS/xsCPQRjBYEF1wTPA9UCNAL2Ae0BxAEiAdn/9/3R++X5vvi8+Pv5Rfwe/+kBFwROBX4F4QTdA+ICOQL2AesBxgEwAfX/H/79+wz61fi9+OX5HPzr/rcB8QM4BXoF6QTrA+4CPwL2AekByQE9AQ4ARf4o/DP67vjA+NH59Pu5/oUByQMhBXQF8QT5A/oCRgL2AecBygFIASgAa/5U/Fv6CPnF+L75zfuH/lMBoQMJBW4F+AQHBAcDTQL3AeUBzAFTAUAAj/5+/IP6IvnL+K35qPtW/iEBeAPwBGYF/gQUBBQDVQL4AeMBzQFeAVcAs/6p/Kv6PvnT+J35hPsm/u8ATgPWBF0FAwUhBCEDXQL5AeEBzQFnAW0A1f7T/NP6W/nc+I/5Yvv2/b0AJAO7BFMFCAUtBC4DZQL7Ad8BzQFvAYIA9/78/Pz6efnn+IP5QfvI/YsA+QKfBEgFCwU5BDsDbgL+Ad4BzQF3AZcAGP8l/ST7l/nz+Hn5Ivua/VkAzgKBBDsFDgVEBEgDdwIAAtwBzQF+AaoA",
    "N/9N/U37t/kA+XD5BPtu/SgAogJjBC4FDwVPBFUDgAIEAtsBzAGFAbwAVv91/Xb71/kP+Wn56PpC/fj/dgJEBCAFEAVaBGMDigIHAtoBywGKAc0AdP+c/Z779/kf+WT5zfoY/cf/SgIkBBAFEAVkBHADlAILAtkBygGPAd0Akf/C/cf7Gfox+WD5tPru/Jf/HQIDBP8EDgVtBHwDngIQAtgByQGUAewArP/o/e/7O/pD+V35nPrG/Gf/8AHhA+0EDAV2BIkDqQIVAtgByAGYAfoAx/8N/hj8XfpX+V35hvqf/Dj/wgG/A9oECQV+BJYDswIaAtgBxwGbAQcB4f8x/kD8gPps+V35cfp5/An/lQGbA8cEBQWFBKIDvgIfAtgBxQGeARQB+f9U/mf8pPqC+WD5XvpV/Nv+ZwF3A7IE/wSMBK4DygImAtkBxAGgASABEAB2/o/8x/qZ+WP5Tfox/K7+OgFTA5wE+QSSBLoD1QIsAtoBwwGiASoBJwCY/rb86/qx+Wn5PfoP/IH+DAEtA4UE8gSXBMYD4AIzAtsBwQGkATQBPQC5/t38EPvK+W/5Lvru+1X+3wAHA20E6QSbBNED7AI6At0BwAGlAT4BUgDZ/gP9NPvk+Xf5IfrP+yr+sQDhAlQE4ASfBNwD9wJBAt8BvwGmAUYBZQD4/in9Wfv++YD5Fvqx+//9hAC6AjoE1gSiBOcDAwNJAuEBvgGmAU4BeAAW/079fvsa+ov5DPqU+9b9VwCTAh8EygSkBPEDDwNRAuQBvQGmAVUBigAz/3P9o/s2+pf5BPp4+639KgBrAgQEvgSlBPoDGgNaAucBvAGnAVwBmwBQ/5f9x/tT+qT5/fle+4X9/v9DAucDsQSlBAQEJgNiAuoBvAGmAWEBrABr/7v97Ptw+rL59/lF+1/90v8aAsoDogSlBAwEMgNrAu4BuwGmAWcBuwCG/979EfyO+sL58/ku+zn9pv/xAawDkwSjBBQEPQN1AvIBuwGmAWsByQCg/wD+Nvyt+tL58fkY+xT9ev/IAY0DggShBBwESAN+AvcBuwGlAXAB1wC4/yL+W/zM+uT58PkE+/D8T/+fAW4DcQSeBCMEVAOIAvsBvAGlAXMB5ADQ/0P+f/zr+vb58Pnx+s78JP92AU0DXwSaBCkEXwOSAgECvAGkAXcB8ADn/2P+o/wL+wr68vnf+qz8+v5MAS0DSwSVBC8EaQObAgYCvQGjAXkB+wD9/4P+x/ws+x769PnO+oz80f4jAQsDNwSPBDQEdAOmAgwCvgGiAXwBBgESAKL+6/xM+zT6+fnA+mz8qP75AOkCIgSIBDgEfgOwAhICwAGiAX4BDwEmAMD+Dv1t+0r6/vmy+k78gP7QAMcCDASABDwEiAO6AhkCwQGhAYABGAE6AN7+Mf2O+2H6Bfqm+jH8WP6mAKQC9gN3BD8EkgPEAh8CwwGgAYEBIQFMAPr+U/2v+3n6Dfqb+hX8Mv59AIAC3gNuBEEEmwPPAiYCxgGgAYIBKQFeABb/df3R+5L6FvqS+vv7DP5UAFwCxgNjBEMEpAPZAi4CyAGgAYMBMAFvADH/l/3y+6v6IfqK+uL75/0rADgCrANYBEQErAPjAjUCywGfAYQBNgF/AEv/uP0U/MX6LPqD+sr7wv0CABMCkgNLBEQEtAPuAj0CzgGfAYQBPAGPAGX/2f01/OD6Ofp++rP7n/3b/+8BeAM+BEMEvAP4AkUC0gGfAYUBQgGdAH7/+f1X/Pv6Rvp6+p37fP2y/8kBXAMwBEEEwwMCA00C1gGfAYUBRwGrAJX/GP54/Bb7Vfp3+on7Wv2L/6QBQAMhBD8EyQMMA1YC2gGgAYUBSwG4AK3/N/6Z/DL7Zfp2+nb7Ov1j/34BJAMRBDwEzwMWA14C3gGgAYUBTwHEAMP/Vv66/E/7dfp2+mT7Gv09/1kBBgMABDgE1QMgA2cC4wGhAYUBUwHQANj/c/7b/Gz7h/p3+lT7+/wW/zMB6ALuAzME2gMpA3AC6AGiAYQBVgHbAO3/kf78/In7mfp5+kX73fzw/g0BygLcAy0E3gMyA3kC7QGjAYQBWQHlAAAArf4d/ab7rPp8+jf7wfzL/ucAqwLJAycE4gM7A4IC8wGlAYQBWwHuABMAyf49/cT7wPqB+ir7pfym/sEAiwK1AyAE5QNEA4sC+QGnAYQBXgH3ACUA5P5d/eL71fqH+h/7i/yC/pwAbAKgAxcE5wNNA5QC/wGpAYQBXwEAATcA/v58/QD86vqO+hX7cfxf/nYASwKKAw8E6QNVA54CBQKrAYQBYQEHAUcAGP+b/R78APuW+gz7Wfw8/lAAKwJ0AwUE6gNcA6cCDAKtAYQBYgEOAVcAMf+6/T38F/uf+gT7Qfwa/isACgJdA/oD6wNkA7ACEwKwAYQBZAEVAWcASf/Y/Vv8L/up+v76K/z5/QYA6AFFA+8D6gNrA7kCGgKzAYQBZQEbAXUAYf/2/Xn8Rvu0+vn6FvzZ/eL/xwEtA+ID6QNxA8ICIQK3AYQBZQEhAYMAeP8T/pj8X/vA+vX6Avy5/b7/pQEUA9UD6AN4A8sCKAK6AYUBZgEmAZAAjv8w/rb8ePvN+vL68Pua/Zn/gwH6AsgD5QN9A9QCMAK+AYUBZgEqAZ0Ao/9N/tT8kfvb+vD63vt8/Xb/YAHgArkD4gODA90CNwLCAYYBZwEvAagAuP9o/vL8q/vq+vD6zvtf/VL/PgHFAqkD3gOHA+UCPwLGAYcBZwEzAbMAzP+E/hD9xfv5+vD6vvtD/S//HAGqApkD2gOLA+4CRwLLAYgBaAE2Ab4A3/+f/i793/sK+/L6sPso/Q3/+QCOAogD1QOPA/YCTwLQAYoBaAE5AcgA8v+5/kz9+vsb+/X6o/sN/ev+1wByAncDzgOSA/4CVwLVAYsBaAE8AdEAAwDS/mn9Ffwt+/n6mPv0/Mn+tABVAmQDyAOVAwYDXwLaAY0BaAE+AdoAFADr/ob9MPw/+/76jfvc/Kj+kgA4AlEDwAOXAw0DaALhAZABaQFAAeAAIgAC/6L9S/xU+wf7h/vG/Ij+bQAXAjkDtAOXAxYDdALrAZYBawFBAeUALQAV/7z9Z/xr+xL7g/uz/Gn+SQD1ASADqAOXAx4DgAL2AZ0BbQFCAekAOAAo/9X9gvyC+x77gPuh/Ev+JQDTAQcDmgOVAyYDjAIAAqMBcAFEAewA",
    "QgA6/+79nfyZ+yv7fvuQ/C7+AgCxAe0CjAOTAywDlwILAqoBcwFFAfAATABL/wb+uPyw+zj7fvuA/BL+4f+PAdICfAOPAzIDoQIWArIBdwFHAfQAVQBc/x3+0vzH+0f7fvty/Pf9v/9uAbcCbAOLAzgDrAIgAroBewFJAfcAXgBs/zT+7Pzf+1X7gPtl/N39nf9MAZsCWwOGAzwDtgIrAsIBfwFLAfsAZgB8/0r+Bv32+2X7gvtY/MT9ff8qAX8CSQN/A0ADvwI2AsoBhAFNAf4AbgCL/2D+H/0O/HT7hvtO/Kz9Xf8JAWMCNwN4A0IDyAJAAtIBiQFQAQEBdgCZ/3X+OP0l/IX7ivtE/JX9Pv/oAEYCIwNwA0QD0AJKAtsBjgFTAQUBfQCn/4n+UP08/JX7j/s7/ID9IP/HACoCEANnA0YD2AJUAuQBlAFWAQgBhAC0/53+aP1U/Kb7lfsz/Gv9Av+nAA0C+wJeA0YD3wJeAuwBmgFaAQwBiwDB/7D+f/1r/Lj7nPst/Fj95f6HAO8B5gJTA0UD5gJoAvUBoAFdAQ8BkQDN/8L+lv2C/Mn7o/sn/Eb9yv5nANIB0AJIA0QD7AJxAv4BpgFhARMBmADZ/9T+rP2Y/Nv7q/sj/DT9r/5IALUBugI7A0ID8QJ7AgcCrQFmARcBngDk/+b+wv2v/O37tPsf/CT9lf4pAJcBowIvAz8D9gKDAhACtAFqARsBpADv//f+1/3F/AD8vvsd/BX9e/4LAHoBjAIhAzsD+gKMAhoCuwFvAR8BqgD5/wf/7P3b/BL8yPsb/Af9Y/7u/10BdAISAzcD/gKUAiMCwgF0ASMBsAADABf/Af7x/CX80/sa/Pr8TP7R/z8BXAIDAzEDAQOcAisCygF6ASgBtgANACb/Ff4H/Tj83vsa/O78Nf60/yIBRALzAisDAwOjAjQC0gF/ASwBvAAWADX/KP4c/Uv86fsb/OL8IP6Y/wUBLALjAiQDBAOqAj0C2QGFATEBwgAgAEP/O/4x/V389fsd/Nj8C/59/+kAEwLSAhwDBQOwAkUC4QGLATYByAApAFH/Tf5G/XD8Avwf/M/89/1i/8wA+gHAAhQDBQO2Ak4C6QGRATsBzQAxAF7/X/5a/YP8D/wi/Mf85P1I/7AA4AGuAgsDBAO7AlYC8QGYAUAB0wA6AGz/cf5u/Zb8HPwm/L/80v0v/5QAxwGcAgEDAwPAAl4C+QGfAUUB2QBDAHj/gv6C/an8Kfwr/Ln8wf0W/3gArgGIAvYCAQPEAmUCAQKlAUsB3wBLAIX/k/6V/bv8N/ww/LP8sf3+/l0AlAF1AusC/gLIAm0CCQKsAVEB5QBTAJH/o/6o/c78Rfw1/K78ov3n/kIAewFhAt8C+gLLAnQCEQKzAVcB6wBbAJz/s/67/eD8U/w8/Kr8lP3Q/igAYQFMAtMC9gLOAnoCGQK7AV0B8QBjAKj/wv7N/fL8YvxD/Kf8hv27/g4ARwE4AsYC8QLQAoECIQLCAWMB9wBrALP/0f7f/QX9cPxK/KX8ef2m/vX/LgEjArgC7ALRAocCKQLJAWoB/QByAL7/4P7x/Rb9f/xS/KP8bv2R/tz/FQENAqoC5QLSAowCMALRAXABBAF6AMj/7v4C/ij9jvxa/KL8Y/1+/sT/+wD4AZsC3gLSApECOALZAXcBCgGCANP//P4T/jr9nfxj/KL8Wf1r/qz/4gDiAYsC1wLSApYCPwLgAX4BEQGJAN3/Cv8j/kv9rPxs/KL8T/1Z/pT/ygDMAXsCzwLRApoCRgLoAYUBGAGRAOf/F/8z/lz9u/x1/KP8R/1I/n3/sQC2AWsCxgLPAp4CTQLvAYwBHgGZAPH/JP9D/m39yvx//KX8P/04/mf/mQCgAVoCvALNAqECUwL3AZQBJQGgAPr/Mf9T/n792fyJ/Kf8OP0o/lH/gACJAUkCsgLKAqQCWgL+AZsBLAGoAAMAPf9i/o796PyT/Kr8Mv0a/jz/aQBzATgCqALGAqcCYAIGAqMBNAGwAAwASf9x/p799vyd/K38LP0M/ij/UQBdASYCnALCAqgCZQINAqoBOwG3ABYAVf9//q79Bf2o/LH8KP3+/RT/OgBGARQCkQK+AqoCawIUArIBQgG/AB8AYf+N/r79FP2z/LX8I/3y/QD/IwAwAQEChQK4AqsCcAIcArkBSgHHACgAbP+b/s39I/2+/Lr8IP3m/e7+DQAaAe8BeAKzAqsCdAIjAsEBUQHPADEAd/+p/tz9Mf3J/L/8Hf3b/dz++P8DAdwBawKsAqsCeQIpAskBWQHXADoAg/+2/uv9QP3V/MX8G/3Q/cr+4//tAMkBXQKlAqoCfQIwAtABYQHfAEMAjf/D/vr9Tv3g/Mv8Gf3H/br+zv/XALUBTwKdAqgCgAI2AtgBaQHnAEwAmP/Q/gj+XP3s/NH8GP2+/ar+uf/CAKIBQAKVAqcCgwI8At8BcQHvAFUAo//d/hf+av33/Nf8GP21/Zr+pf+sAI4BMQKNAqQChgJCAucBeQH3AF4Arf/p/iT+eP0D/d78GP2u/Yz+kf+XAHoBIgKDAqECiAJIAvIBjgEdAZcA+/9K/5T+7f1x/Tn9U/29/Wj+N/8GALoAOgGAAZEBfAFRAR4B6ACvAGsAFwC0/0r/6v6r/qH+1/5K/+j/lQAyAZ8BywGwAVgB1gBAAK3/Jv+x/k3++v23/Y79jf3F/UL+Cv8PADwBagJyAy0EhARtBO0DGAMIAtcAnP9l/j79MvxP+6b6Tvpf+un68Pto/TT/JgEOA7kE/gXFBgQHwQYMBvYElAP2AS4AUP50/Lr6SvlL+N73F/j6+HP6X/yN/sgA4gK1BCcGKge5B9MHeAeoBmcFvwPFAZv/aP1f+7L5hvj19wT4pvjC+TX73vyf/l8ADwKeA/wEFwbZBi8HCAdUBiwFqwP2ATcAl/4z/R78Xfvs+sD6z/oU+4z7Ofwb/Sz+X/+fANMB3wKuAzQEcARrBDQE2QNmA94CPgKBAaEAof+K/m/9avyW+wj7z/rr+lb7Avzg/OP9Af8zAHYBwQIDBCYFDQaaBrUGTgZnBQ8EYgKGAKH+1Pw9+/D5/Phr+Eb4l/hk+a36aPx//s0AJgNUBSYHcQgaCRgJcQg4B4kFhANIAfj+r/yO+rr4VPd99lD22fYW+PH5RPzc/n8B+AMZBr4H1AhRCTYJiQhUB6gF",
    "mwNIAdf+cfxJ+oz4YPff9g/35fdG+Q77Ff0y/0MBLQPYBDEGJwesB7QHOgdBBtoEHwM2AUr/gP3++9r6H/rN+dr5O/ri+sP71fwN/l7/uQAJAjcDKgTRBCEFGQXDBC8EbwOVAq8BxQDa/+/+B/4q/WT8xPtb+zb7XfvO+4D8ZP1o/n3/lACmAaoCmgNsBBMFfwWfBWQFxgTIA3cC7ABG/6T9Jvzk+vL5XPkn+Vj57vnp+kH86v3Q/9IBzgOZBQoHAAhjCCsIXQcMBlIEUAIoAPv96fsR+pD4gvf+9hf30vcp+Qn7Tf3J/0gCmgSRBgsI8Qg7CegIAgibBscEoQJKAOj9o/un+Rv4IffO9ib3Ivio+Zb7wv0BAC4CJgTNBQ8H2gclCOoHKwfzBVUEbwJkAF7+hPz4+tb5K/n6+D355fng+hv8g/0F/4wABQJaA3YERgW7Bc4FgQXeBPgD4wK2AYUAYP9S/mL9lvz0+4L7R/tK+437EvzR/L/9zf7o//4AAgLpAqoDQgSqBN0E1gSOBAIEMQMhAt8AgP8a/sf8ovu9+ij67PkM+of6Vvt0/NP9Zf8TAcYCXwS/BcgGYAd4BwoHGwa8BAYDGQEV/xr9SPu++ZP43fet9wv4+Phn+kX8cP7AAAoDIQXcBhsIygjeCFkIRQe3BccDlwFI/wH96fom+dn3HfcB94n3qfhM+lD8jP7XAAkD/ASRBrEHTQhdCOEH4QZvBaIDmgF+/3H9m/sc+g75gfh3+Oz40vkU+5n8R/4CALIBPQONBIwFLgZnBjcGpAW6BIwDMwLHAGH/FP7y/Af8W/v1+tT6+/pk+wv86Pzt/Qz/NABVAV4CQQP0A3AEsQS3BIIEEwRvA5sCnQGBAFX/J/4K/RD8S/vI+pD6qvoV+8z7x/z6/Vb/yAA8Ap0D0gTEBWEGmQZkBsAFtQRTA7AB5/8V/lr80/qa+cX4ZviF+CX5PvrB+5f9of+6AcADiwX6BvMHYghACI0HVgavBLQChwBO/i38S/rK+MX3UPdz9y34cPko+zP9bf+uAc4DqQUeBxUIfghVCJwHYga9BMoCrQCM/or8y/ps+YT4H/hD+On4A/p8+zj9Gf/9AMYCVwSWBXEG3QbWBmEGhwVbBPICZQHP/0f+5/zB++b6Yfo0+mH64Pqo+6n81P0V/1oAkQGrApgDTgTEBPcE5QSQBP4DOANIAjkBGwD8/uj97/we/H/7Hfv9+iP7j/s9/CX9Pf52/78ACAI7A0cEGQWjBdoFtgU3BWEEPgPeAVUAvP4r/b37i/qr+S/5IfmH+Vz6lfsh/ef+yACmAmEE2gX1Bp0HxQdoB4kGNgWEA5ABe/9p/X773Pmi+OX3tPcT+P34Yvoq/Db+YgCJAoQEMQZyBzEIYggBCBUHsAXqA+QBwf+m/bf7F/rh+Cj4+PdS+C75e/oh/AL+/v/wAboDPQVgBhQHTQcMB1gGPwXWAzcCfQDI/jD90Pu9+gX6sfnD+Tf6AvsV/F39w/4yAJQB1ALiA64EMAVjBUYF3QQxBE0DPwIWAeT/t/6g/a386vth+xj7E/tT+9P7jfx5/Yr+tP/kAA0CHgMIBLsELQVWBTAFvAT9A/wCxwFuAAb/ov1Z/EH7bfrs+cn5Cvqu+q37+vyA/ikA2gF3A+MEBQbJBh4H/QZkBl0F9QNDAmMAdv6a/PL6m/mt+Dv4Tfjk+Pf5dftF/Uj/WgFZAyEFkgaTBxUIEgiIB34GAwUvAx8B9/7Z/O36VPkt+I33g/cQ+C35xvq//PP+OQFoA1UF3QbiB1MIKAhnByEGcQR6AmQAWP59/PT62Pk5+Rz5fflL+nH70/xR/s7/LQFbAkcD6QNABFIEJwTOA1MDxQItApQB/ABnANT/P/+l/gj+af3O/EP81PuQ+4b7w/tQ/C/9XP7I/1wB/gKNBOMF4AZnB2MHywahBfUD5QGa/z/9B/sl+cL3APfy9p739vjh+jX9wf9NAqYElwb7B7UIuwgSCM0GDQX9AswAq/7F/D77Lvqj+Zz5DPrc+vH7Kv1p/pT/lABgAfQBVAKKAqQCsAK8As0C5wIEAxoDGAPrAoACywHKAIf/Ev6H/Ar7wfnV+Gf4kPhe+c36zPw3/94BiQT7BvgITQrSCnMKLwkZB1sELgHW/Z36zPel9Vj0BfSz9FT2wvjG+xr/cwKHBRII3gnICsIK1gkhCNEFIwNXALH9aPut+Z34Rfie+JD59vqj/GX+DQB1AX4CGgNHAxIDkwLpATYBmQAuAAUAIgCAAAwBqgE8AqECvAJ4As0BvgBg/879M/y8+pf57fjd+Hn5wPqg/PX+jwEyBKAGmgjrCW0KCwrGCLMG/QPdAJv9ffrM98b1mfRi9CX10PY8+TP8b/+pApoFAgixCYgKewqVCfMHwQU2A48AB/7S+xn6+Ph7+J34S/lo+s77Vv3a/joAXgE6AsgCEAMfAwYD2AKnAn4CZQJZAlICRAIdAtABTgGQAJr/c/4x/e77zPrs+W/5b/n7+Rf7tvzB/g4BcQOxBZoH+QipCZAJqQj+BrAE7gHy/v77Vfkz98n1OfWQ9cb2vvhN+zb+NgEMBHkGSQhYCZYJBQm7B90FngM3AeH+zvws+xb6mvm1+VX6Xfum/Af+Wf95AFIB1QEDAucBlgErAcIAdgBZAHgA0wBfAQcCrwI4A4IDdAP9AhgCzAAz/2v9o/sK+tD4H/gX+Mf4Lfo2/Lr+hAFYBPIGEgl/ChILtQpoCUIHbgQqAb39dPqa93D1KfTg8530TvbL+Nv7OP+VAqoFMgj7CeIK2wrwCT8I9gVPA4kA5f2X+8/5qfgx+GT4K/lo+vH7m/08/68A2gGuAiYDSwMsA98CfAIaAsoBmAGGAY4BogGyAagBcgEDAVUAbP9T/iH99Pvv+jT64PkL+sD6/Puw/b3/+AEyBDUGzwfUCCYJtAiAB6AFOAN8AKj9+fqu+Pz2CPbq9aP2IvhE+tf8ov9iAt4E3wY9COAIwQjtB38GnwR/AlIAS/6T/Ev7hfpG+oP6KPsX/C/9TP5S/ycAwQAbATsBMQEPAe0A3gDyADIBmwEjArgCQQOhA78DhQPlAt4BegDS/gf9RPu3+Y/48vf+98D4NPpG/M/+mgFqBP4GFwl+Cg0LrgpiCUAHcwQ4AdX9lfrC9571WPQN9MT0a/bc+N77K/94An4F+Qe3CZcKjgqlCfoH",
    "uwUjA28A4P2q+/r57PiK+M/4pPnn+m78Dv6b//IA+gGlAvEC6QKhAjMCuAFMAQEB5QD3ADIBhAHXARICHgLmAWABigBv/yT+yPyA+3P6xfmU+fT56fpr/F7+nAD2AjQFHweGCEEJOAlkCNIGnwT6AR3/R/y5+az3UfbE9RP2NPcO+XT7L/4AAakD8gWqB7AI9wiBCGEHugW4A40Bbv+F/fn74/pQ+j36nPpW+038YP1x/mf/LwDCAB8BTwFhAWQBbAGGAbsBCwJxAt4CPgN5A3sDLwOKAowBPACx/gf9Zvv3+eb4Vfhh+BX5cfph/ML+YwENBIIGhwjoCX4KNQoNCRgHfgR3AUT+Lft2+F/2FvW59E71x/YC+cr73v74AdUENAflCMgJ0gkJCYsHgAUgA6QASP4+/K76tPlY+ZX5VPp3+9T8RP6e/8EAmQEaAkUCJgLUAWcB/ACsAIgAmgDhAFQB3QFjAskC9ALNAkkCZQEsALX+IP2Y+0b6Vfno+Bf56/ld+1b9r/81Aq8E4gaXCJ8J3QlDCdkHuQURAxoAF/1J+vL3R/Zt9XX1YPYV+Gv6Lv0cAPUCewV5B8cIUAkSCRsIigaLBE8CDQD3/TX86Pof+uD5IPrJ+sD74vwP/in/GgDVAFUBnwG+AcEBvAG9AdIB/QE/Ao0C1wIJAxAD1wJTAn8BXgAD/4P9A/yn+pb59fje+GL5gfow/FH+uQA3A5IFkQcDCb8JrwnNCCYH2wQcAiX/N/yV+Xn3FPaE9db1Affn+F37Kf4KAcADEQbKB80ICAmCCE4HkgV8A0IBGv8y/bH7svo++lL63vrE++L8FP43/ywA4wBQAXYBYQEkAdgAlABwAHkAuAAoAb4BYgL7AnEDrwOfAxwDCwKoAEj/o/1c+yD5//fN97r3F/j2+ST9EwAmAn4EpgdnCr4Lzgu1CkwICwX8AYX/p/yp+Db1cvR69Sv2+vZR+YT8Ov/TARAFfAcYBxoFAwUpBwUIaAWaAZ7/GP+U/rz+vv+H/5D96fuR+9/7Wfym/I/8Z/x2/OT8J/5kALQCIwS7BDgFTwYaB/QFCQRVA1kCcf+z/DD8f/zc+/P61Po9++77vP2qAD4CrQA6/vn9T//X/7H/oQBwAooDJwRZBX4Guwa9BrIGIwWMAdX9bfs/+Sf2RfMZ8ojyefSB+PX9EwPwBuoJ5wyuD5EQYQ4KCrsF5wHm/FP3VfTS86ryhvFs9Lz6uP88AhUFxgjSChMKagdaAwH/sPwu/O36/viu+H76UP2tAIoETQhRC+4MHwyxCMwDsP4Z+kf2KfMA8TTwuvDY8ij3Zv3nBDgM9g8uD7EOexFoElwMTAPk/Tz7p/Zq8fDvaPGD8gT0TPi0/u4DdQUmBQkHXgqICrQGjgJ1ALH/FP8s/gr93/wP/4QC9gMeAhUA2ABuAkMBVv23+cf4Zvnb+NP3iPkB/skBYAPxBOMHUQozCjQIYgaCBTEExgDF+8/3Bfe4+Gv6Ofti/NL9Gv5y/goBEQQ7BBAC6/8V/pT8Bv31/x4DDwRSA5YDlQUnB+sGAgZqBQYEOgCE+gz1YPEo8APyK/bM+ab7B/6kAmcHQwoWDWsR8hOBECMI8P9D+yn5+vaN9AD0d/XC9i/3jPi7/EoDCwlWC+MKNQn9BQ8BOfyX+Yn5H/sw/Wn+GP6u/UX/5QK6B+EMYg9ZDMAF6P9K+zP2v/FW8OvxTvT19YH3U/rp/tsEKwvjEBsVwhV2EYgKIgSy/v35Effv9cH02PJm8VrxlfMr+fMAcwd9CrsKxgkqCDQFXQGP/wABpwK8ARz/UPz3+Qn6TP5ZBH4HQgYfA2QAxv1K+hH32/Ym+qz9hP5k/Yj8s/xR/hgDdwrbD6cPaQpzA2P+z/xg/XX9qPzD/N38+vnk9fv15vp2ABAErgVdBQ0DIP/2+nz5AP2JA5IHNQajAiABAwLzA1gGtgdzBtoDygHF/pb4RPGo7cvvE/Uk+gn+tACxAQECqgTBCscQ8RKLEQUOWgeu/bD1ZvPs9Iv2g/f79833H/jr+WD9MgNaCpIOywwDB4MBBf6N+875APox/Gr+CP9i/oz+MgFTBQYJ8QtYDeUK/wPn+yn2OPMG8kfyLPTZ9jH4Yvgg++8BfAn2DukSMxVkEz4NBgYIAF37hvhQ93P1xPIg8nHzvvNZ9Db65wQTDRoO7gqDBzsEPgFxAC0CYwOFARH+ufvd+kP7kP08AWsE/gXHBZUDpv90+8T4LPhR+Xf7OP1C/Rr8t/tk/XkBnAdIDc0OqQvwBuMChf/s/Bb8O/1M/uH8vPmY9zz3BfjA+icAsgVABygE/P+w/SH9h/1K/9sCjwZFB4YEiwEkARADRAVMBgIG9AMq/534IfNy8CrxNvXc+dn7gfyo/6cEXwfiB8AKkxCKE40PmwdtAMb6Ffb/85D1/ffW9yr29/bj+qn+AwGBBCAK+A30C4IFev/1++T5F/ml+tv9EwDx/8r+DP/aAUQGqgpwDXIM/QaA/8z4/vO+8W3ypvRY9lD3yPhQ+/f+YQRhC5QRjRT6E3EQMApoAvv7vvhp9yD25PT5893yQPIl9Ez5awCRB6UMvw29CuUFIALTAEkB4AFtAeD/2v3Z+2r6zvoH/hwDRAfyB9EEBQAj/Br6hvnf+cv66fuL/Db8qfuO/PT/HwX8Ca4MmQw2ClMG/AGm/h39rvxt/Cn8SfsO+b322/YB+mX+IQJfBNQEagO6AE3+xf15/0cC1wQRBlMFQwONAXAB2QKYBEsFHATKAL/7U/aG8sTx5fOQ92L7Wv4cAIYB5gNdB/4KGw4eEKwPcQsnBKn8hvdR9U31gPbW9334o/hB+Tn76/4ABAwJ8wtSC5QHZQKH/WX6vPkR+x79vv5O/wb/Pf84Ab4Efwg/C9oLPQlzA0f8MPaw8vPxP/Nl9VX33/il+nv99AEHCIEOUBOlFAoSaQxuBfH+T/rM95P2ivUv9MjyNfKW85z30/2cBAEKjQzlC9wIFAUhAssAywAXAZkA5f6A/Kb6kPq7/IkAdwTPBnsGlANK/1P7EPnu+E368fvK/I786fsQ/Aj+9QHpBjsLTw1cDNAIFATc/0/9k/zR/NL8v/um+Xz3lvbg9037xP+fA3kF3gSEAuf/g/4Z/04B9AOpBaQFGAQPAswACwGMAicEawRkAjL+Cfmu9KDybPN49mn62/0aAGkBtALrBE0I",
    "IQzzDkwPdgztBjkAQvp/9lr1K/at98v4L/lq+YD6OP2AAUsG9gkTCx8J0QTG/8j7APp/+lz8Tf5o/5r/o/+JAOUCXwa3CVEL/wmkBVj/8Pg29CTylfKJ9Mv2rPhQ+on8LwB8BaILBhHnEy0T8Q52CJwBB/x8+LT2wvXF9IHzkfIQ8+H1EvudAcIHwQuoDLEKIgebA1YBlQCwAJMAd/9l/UD7R/pc+3D+bwK3BdcGSwW1AY39Y/om+b75O/ty/LL8LvzZ+9n8yf9GBAIJUgz5DMQKngYZAqn++Pyv/MT8LPyB+kf4q/bV9jv5Tf2kAbIEfwUlBLoBvv9T/60ACAMWBcEFvwS0AtQAKQD6AJUCqgP9AhoApPsV9w/0mPOn9Tr56/yp/zwBRAK6A0UGsQnsDH4OSg0vCSsD9/xD+P/1BvZa98T4hvm/+T/69vtK/7MD3Ac6CtAJtAYRAp/92PpY+q/7uP1Q//L/9f9CALMBcwS7ByAKOApcBwgCuPs99vzyXvLK8xr2Ufgj+gr84v44A80Ibw5vEl8TvhA+C3YEMf6o+Rr36fUh9Sz0NPMS88r01/jB/iEFNAqbDPkLEAlbBVACtABWAFUAvf8p/g78gfqW+rz8YQAmBHgGVAbHA9//Jvzi+YX5ifrf+5P8ZPzn+y78If7gAZMGtArJDBIM5giGBHoA2f3O/Kj8Wvwn+yD5Ifdc9qn3/fpb/0ADXgU+BXIDRgEPAHsARAJeBJQFNQVzA0EBzf/H//8AdALYAkgB1v2I+ez1V/RF9S341vv9/vwADAIEA8AEhge5ChQNSw22CsAFxP91+iT3NfYO94z4rfkd+lf6Q/ua/VMBhQW/CLkJ/AcoBK7/Kfyn+jj7DP31/hUAVQBYAAgB8QLPBYsIuwlTCDsEcf6d+F/0nvI881L1w/fg+b37Cf5+AU0GwQtuEMISxRGRDU4HtQBO+9j3IPZU9ab01/Nm80L0L/cz/F0CGAjNC5oMsgo6B7QDRAE4AAYAwP+x/t/8DvtY+oL7ff5OAnUFoAZQBQ8CMP4g+8L5Dfo4+zr8dvwV/O37A/3g/ycEqAjcC5wMsAriBpsCMv9K/aX8YPyT++f50/dk9qj2CvkG/VUBhwSwBdUE5AIwAb8AyAGgAycFZgUfBO0B6f8M/57/CAEeAr8Bd//M+wb4lvVk9Wj3vPoc/o8A4wGkArkDwAWUCEoLlQx3C8sHbwLt/MT40Pbw9j34nvli+pz6Bft4/Fb/LQPVBu0IkwjWBb4B1f1u+xn7b/xq/vv/oQCjANAA6wEiBM8GsQiNCM0F4wAk+zf2YPMD85X0Cvdy+Xr7gv1DAD4ENgkeDnkRARJGD+sJZwNi/QL5jfZ69fH0X/Th8yr0GvYY+rP/pQVWCoQM2QsDCV0FQQJwAM7/l//3/pD9xvuI+sv67fxoAP4DPAY1BuoDTADD/Hz66Pmg+rb7VPw8/O/7X/xX/vEBaQZaCmcM2Qv3CN0E7wAz/t38XfzL+4P6lvjL9jL2kPfb+ir/GQNyBbgFYgSQAnIBqwEEA5UEUQWeBK0CYADL/pb+oP8BAY8BcwCy/Sr6N/cH9gn3wvka/e7/pgF1Ah0DbQSsBlkJVgt6CywJxgR5/8f64Pce9/n3Z/l8+un6F/vW+9L9CQG2BJAHdQj1BpoDr/+g/GL7BvzN/aX/vgD8AOoAXAHWAiEFUAckCLAG4gKd/V74ofQ38wj0QPbX+CL7Jf1x/6gC9Qa6C7QPgRFFEBsMFAbG/5z6Tfe19Rr1vvRd9F30h/WD+FD9EwNeCL4LZgyCCh4HmwMNAcv/Y/8D/w3+gPwD+436y/ur/kgCRgVuBkYFSAKj/qj7Lvo8+iT7AfxE/A38GPxJ/RcALQR1CIYLUAyWCgsH8gKH/2z9dPzi++76TPln9zL2nPYF+fb8QAGRBAMGjgX9A3wC9wGoAgAEAwXeBF0DDgH2/vv9aP63/9sAywAV/yL8Dvkd9x73C/kW/B3/QAFQAs4CiwMfBXUHwAnZCtoJnQbjAQb9X/mw99/3Hvlq+iH7Ufud+8z8QP+YAtEFtAdyBxYFhgEi/hj86/tA/SX/ogA/ATMBNAH4Aa8DzQU+B+oGTwTT/6f6Svbj88rzhPUZ+KX60fzm/oMBGQV0CagNZRCLELkNiQhQApf8cPgk9j319fTE9LP0WfVx91X7mAAXBl8KTAyPC8YILwUMAhYAQ//s/lH+Hv2k+7P6IPs7/YkA6AMIBg0G8gORAC/95fon+qP6ivse/Cb8Dvyp/Kr+JAJiBh8KGAyhC/QIDgU0AVz+w/z1+y373vkW+If2Jvag9+r6MP8oA64FRAZJBbgDowKgAokDlgThBOMDzwF0/9D9g/1y/tL/jwDk/8L96vqJ+Kn3sPgx+zD+qwAZAqcCCAP6A8kFCAi9Cd0J2wf/A1X/NPus+A744Pg0+jT7kfuq+zv84/2qAOQDcgZNBw4GLAPK/y39MPzi/Jf+UwBZAYYBVQGFAZMCWgQLBpIGHgWfAeH8O/gA9fHz9vRO9wD6afyA/roAqANwB4oL2Q4nELIOmArUBNn++Png9nb1FPUI9Qz1bfXV9tL5X/62A4sIkQsNDCgK1QZaA70AV//L/mT+kP1I/B374vov/PD+VAIgBTgGKQVdAur+A/x1+lL6CPvO+yL8HPxd/Kv9bQBUBF4IRQsJDHAKFAcbA6v/YP0i/FP7Rvq5+A73G/a09i75Gf1gAcUEbgZIBv4EmgP1AksDJwSxBDIEgQIjAAf+Av1c/aP+4P8eAO3+nPwi+pv4vviI+kP97f+9AYkCxwI5A28EXgZUCE0JdQimBYMBP/0L+pf4zfjy+R/7v/vc+wf8+fwO//kB2ASVBnQGeARtAYf+1fzM/Bj+4P9AAcUBngFtAdsBHAO8BMwFVgXpAt/+SPp89oT0svSS9j754fsf/i8AmwLGBYUJDQ02DwIPIgwiBzwB2fv49+L1MPUt9VT1ovWU9sf4hPxqAXEGSwryCx4LYAjbBLoBs//B/ln+0P3V/Kn7/vqO+539uQDcA9QF1gXeA60Ab/0n+0v6mfph+/j7JvxF/A79Gf9zAnYG+AnSC2ML2AgWBUgBVv6E/Hj7ivo/+af3XfY79tn3Kvtn/2IDBwbYBiAGugSeA1oD1ANnBEoEDQPiAIj+5vyT/Hv95f7W/5H///2++9f5Nfkz+nP8Fv82AVkC",
    "qgLMAnID5gTOBk8IdgjBBmgDVf+3+4D5/Pi9+e76zfsT/BL8d/zV/TsAFwNpBUYGTQXhAgAAzv0L/cX9Yf/5AN8B7wGWAYMBLQJ8A8IEDAWkA3sARvw3+H/1yvQC9nL4Nvut/cT/3gF6BLwHMAvfDbgOFA0SCZcD+f1s+Zf2ZPU+9X/13PWP9iT4Ffta/z8EnAhEC5ELqAloBv4CXgDl/kj+5v06/Tj8V/tQ+6X8Qv9oAvsE+AX1BFECCP81/Jz6WPrt+qr7F/xE/Lv8Jv7cAJEEXAgOC8ALNgr6BhgDof8t/bf7uvqi+Tj4zvYj9vL2g/lr/aoBGQXoBvgG3gWHBLkDtQMbBDYEaQOUATX/JP0m/ID8y/0o/7H/9v4z/Tv7B/o8+tr7QP6KAAgCkwKZAs4CuANVBQ0H8wdJB+IESwGR/cL6ffmw+bT6uvs7/D78SfwD/cj+WQHxA5UFnAUBBHMBA/+h/bT98f6TAMsBLgLiAXsBlwFtAqADYQTZA6IBDP4K+s72RfW39bf3cvod/Vz/VwGGA0EGaQlODO8Nbg2HCr8FNAAw+6D3yvVR9ZH1CPao9tP3Efqe/SACrQYYCngLjArZB2sEWAFM/03+4/11/bL8z/tj+w78Cv7vANADmAWOBa4DpgCJ/Un7W/qM+kT76PtA/Jj8i/2d/9YCmwbdCY0LFgufCPYEMAEn/ij87fro+bD4UPdS9nT2OviU+8j/vgNyBmoH3gaRBWEE2APpAwwElAMmAvL/pf0W/M37u/w4/l3/dP9e/p/8G/uk+o37hf3L/5ABbAKGAnQC3QILBLIFDgdGB90F/gJz/0j8Vvrg+Yj6j/tH/G/8U/yP/K/9xv9VAn0EZQWzBLgCUQCA/u/9qv4kAI8BSgIzAq0BWAGmAY0CegOZA0kCfP/P+1b4HvbA9SX3p/lv/OT+6gDYAhoF2AeuCsoMOw1zC5AHZgIs/f74dPZ/9Zb1HfbG9rn3bPlE/DgAqQSNCNkK9goKCeAFjwL7/3/+3/2L/Qv9Svyt+9H7Jv2Y/3sCzgSoBakEJQID/0j8rvpX+tr6mfsm/Ij8Mv23/l0B3gRjCNoKbgvlCb0G6wJt/9r8Ovsf+gz5zfes9k72Vvf/+eT9FgKDBWUHmAeaBkAFQwTmA+EDmgOMAqIATv5W/G771fsv/a7+fP8n/939UPxb+5T7/fwN//gAJgJ3Ak4CUwIDA2QE7QXNBlIGTgQ2Afb9fftb+oH6Xfs2/JP8evxm/PP8dv6/ACADuQTsBK8DlwGT/3b+nf7E/zcBPgJ0Av0BYAEwAakBgAIDA3cCfwBh/fL5Qvcj9tP27fir+1H+fwBYAkAEiwYiCXALlgzUC/IIaQRB/6P6bPfb9Z/1HfbZ9rr3D/lJ+5z+twLJBscJ4AreCTkH6QPuAOz+7/2O/T/9tPwS/Nz7mfx7/iMBvQNOBTIFYgN/AIT9Vftg+oT6N/vw+3b8BP0e/jMARgPJBsQJQQu2CkcIsATvANb9tvtc+lH5N/gX92n20fbB+CP8SQAxBOcG8gd+BzgG7AQeBM4DjAPIAjYBBf/U/GT7M/sx/Mf9G/+E/9f+gv1M/O/7ufxn/k8AvgFYAkMCCgJGAkADtwT9BUsGKwW6Aqn/4fwl+7P6O/sS/J/8p/xw/Iv8eP1R/6YBsQOtBEIEsQK6AD7/1f6I/9gADgKWAlICmwEHAQUBlQE7Aj8CEQGk/oH7mPjb9s72Wvjk+qP9BQDuAaMDiAXFBwkKngu3C9cJHQZLAXv8sfh49sP1FfbZ9sD34/ij+lf99QDyBF8IUQpCClYISAUXApv/Kf6S/VX9AP17/Bj8XPyp/er/hgKWBEgFRQTdAeH+RPy0+lf61fqg+1H85/zA/Vj/6gEyBW0IoAoLC3kJXAaWAhb/b/yz+ov5ifiA96z2nfbe95/6ff6bAvoF3gcgCCwHxAWUBOQDfgPkAqQBs/92/aT73vpd+8v8bP51/3j/kP5Y/ZH8wfzw/an/OgEeAjsC7gHQAVgCjQP4BNoFjwXlAz4BZ/41/Cr7O/vq+5L8yfyV/Gf8z/wf/jIAbAIEBGcEgwPXATEAUP+A/4cAxgGUApcC8QEfAasA1QBiAbsBOAGH/+H8AfrX9xv3Avgs+uL8c/+EAS0DyQSkBrMIeAoyCz4KagcpA2n+N/pd9xX2FPbK9r730Pg++mj8ef8qA8QGWQkxChsJigZeA4YAmf6q/Vv9Lf3V/G38YPwm/eb+TgGdA/UEwQT+Aj4Aaf1R+2T6hvpB+xT8x/yI/cL+1AC9A/cGpgnnCkAK0AdFBIsAa/03+875yvjZ9wD3pPZS92n50PzkALMEWwdoCPsHrwZBBS8EhwPuAu4BRwAm/hz81vrG+tz7i/0L/7f/YP9g/mT9E/23/Rn/pgDFASUC6gGVAbQBigLhAxwFgwWmBJgC7/96/ef7cfvR+3b81fy+/HD8cfw5/eL+DgEIAx8E+QPKAjYBAgC2/1cAeAFxAsACSgJjAZcAUQCaAAsBBAEDAPn9W/v++LT38PeZ+R/8yf4MAcoCPgTEBYYHRAljCjIKRgi/BEsA6/uI+KP2Lva29q33w/gF+sP7Sv6OARgFEwiwCXoJkwenBKABRf/p/WT9Qf0W/cb8kfzr/Cf+MQCDAk0E1QTNA38Bq/4x/LT6Xvri+sH7mPxf/WD+BAB8AoUFcAhaCpUK8gjbBSECpP7z+yz6Bfkh+FP30PYP94f4W/su/y8DcwZKCIoIkgcTBrEEtQP7AhwCuwDO/rX8Evt3+hT7mvxa/pX/3v9F/03+o/3B/bP+FgBUAfYB6AGCAVABvgHWAi4EGAX6BKADWwHc/uP85Pva+1j8zvze/JL8Ufyf/Mv9t//YAXcDCgR6Ay4C2wAmAFYANwE6AsgClQK/AbwADwD6/08AjQAgALv+jPw2+on4J/g7+Wv7Dv5+AGUC1QMfBY8GIAhqCcoJsQj4BQUCsf3v+XP3dPar9pD3r/ji+Vr7Z/0wAHkDnwbRCG4JSwjTBdMCJgBZ/oD9Sf08/RL92fzr/K79R/9pAWwDigQ+BIcC7P8//Uj7bPqY+mL7VPwz/R/+cv96ATEEHwd7CXsKsQk7B7oDCwDs/LP6Svlb+Jz3DfcC9/P3LvqU/Y0BOgXHB8UIUQj1BmEFEgQcAzwCDwFh/1v9gftv+ob6t/t//SL/AgDw/zD/Xf4M/oT+",
    "nP/VAKsB2gGEASABLwHvATIDaATpBEkEkAI+AA3+lvwT/En8uvzt/Ln8WvxJ/Pj8gv6RAIYCuQPVA/4CwAHIAIsAEwH9AbQCxgIeAgkBDACR/6T/8v/u/yL/fP1g+4X5o/ge+dr6Uv3a//IBegOoBNEFIAdlCB8JtQjKBn0Dbf9++4T48va79nD3j/jF+Rf7yPwY/wICGwWsB/wIpgjKBgYEMAH//sH9VP1N/Uj9I/0S/Xf9mf5pAG8C8wNQBEMDDwFn/hb8t/pz+gf7/vv6/Oz9Dv+2AAwD0QVmCAEKBgpOCDwFkQEg/nL7q/mR+NP3SPcX96T3UPky/O//xwPiBp0IzwjNBzcGpARjA18CRgHQ//f9EPyq+kL6APuZ/Gv+yf9IAPD/Lv+X/pv+S/9XAEIBqgGCARYB4gBGAUkCjwN6BIEEcAOFAVj/jv2P/F38n/zd/Mv8dPwx/Hn8j/1b/2IBBQPFA4YDmgKWAQYBJgHMAYICyQJhAmgBSAB2/y7/U/94/yH/C/5b/JX6aPlX+YT6oPwW/1UBEANPBFYFZgZ/B1EIVggfB40E/gAq/eL5w/f89lL3T/iL+d36Y/xa/tsAswNZBiAIgwhjBx4FYwLx/0X+d/1F/Uz9Sv1G/YH9SP6y/34BHwPyA40D8AGT/yj9XvuS+rz6h/uP/J/9xP49AD0CtwQ/By0J2gnsCIAGIwOX/4T8QvrO+Or3X/cq94j3zfgs+3/+PQKjBf0H6Ah5CCIHeAXsA58CbAEOAGf+nPwX+1L6l/rS+5L9N/84AGUA8f9S/wL/Qf/2/8YATgFdAREBxwDkAJcBtwLOA1EE4wOHAp0Auv5Z/bD8m/y8/Lz8f/w0/Dv86/xX/joADwJOA6wDPQNqArUBfAHJAVICqwJ7ArcBnQCY//r+1/7w/tr+Pf4I/Yn7SvrX+Xr6HvxY/p4AhgLuA/gE4QXJBosHywcYBzQFPwK8/mH72viG92H3F/hB+Zb6DfzM/ff/fwINBRMHBQiZB+0FgQMCAQX/0P1U/Ub9V/1q/Zr9JP41/7YASQJgA4EDfAKLAD3+Nvz3+qv6Kvsd/Dz9cP7W/5sBzQMvBkAIZAkmCWsHhgQVAcj9G/s9+RX4cPcy93T3cvhk+kn9ygBIBBIHowjWCOkHWAaiBBIDrQFJAL/+E/2J+4j6aPo9+8b8gf7h/4sAfgAEAJD/dv/N/2QA6wAgAfsAtQCnABQB/QEWA+UD/gM0A7EB5/9Q/kP9y/yx/Kf8evw1/Bn8e/yK/S7/BwGYAnsDlAMXA24C/wH6AUUCjwKAAuwB7QDU//f+if54/nb+LP5p/UX8Ift6+rH63PvA/er/6AF5A5sEeAU6BuEGNAfZBoQFKQMUANj8GPpQ+Kv3Avj8+Eb6tvtV/UD/fQHdA/cFSgd2B2kGbgQRAur/X/6O/U79Wf17/a/9Gv7o/h4AiAG4AjcDuAJDATf/I/2T+9j69/q2+878Df5w/xQBDQM/BVIHwQgPCfwHpgV+Aib/K/zl+WT4ivc192D3LfjL+Uv8fv/rAvcFDQjfCHYIKgdzBbIDFAKRAAz/d/31+9P6Zvrb+hr8xP1Y/2kAygCYACgA2P/c/ywAlADVANAAnQB+ALgAZwFmAlkD1AOOA4QC+QBa/wj+M/3N/J38bvwu/AP8MPzv/En+BQC8AQQDmwOKAxUDmQJaAmMChwJ9AgwCMAEYABb/aP4e/g/+8v2G/cD81fsl+xX71vtY/Ur/QwHyAjQEGQXIBVQGpgZ+BpMFwQMnAS/+ZPtM+TP4HfjN+Pb5W/vo/Kj+qADTAuIEbAYNB5IGGQUGA90AGf/2/XP9Xv1//br9GP66/rL/5wAQAsYCsQK1AQMADP5R/Dz79/ps+2L8nv0E/5gAawJyBHMGCAi8CDsIeQa7A4IAYP3E+uP4v/c990r38vdR+Xz7Xf6hAcUEOgeYCL0I1gdFBnEEpAL2AF7/zv1V/CT7gvqn+pX7E/22/g8A1AD7ALUAUwAZACIAWACMAJcAegBbAHUA8wDMAcQCfQOiAw8D3QFdAOz+zv0Y/a78Zvwi/O/7+vt7/I79Gv/UAFoCXAO8A5cDMwPYAqsCnwKDAiECYgFbAEj/a/7o/bf9pP1y/f78WfzC+4/7Afwl/c/+qQBgAr4DuQRnBeMFKgYZBnYFEwTyAVT/pfxk+u/4bfjE+LX5APt8/CH+9f/uAeMDgwV0BnQGfQXLA8kB7f+J/r79dv2C/bv9Fv6e/mf/agB5AUQCeQLmAZgA2v4b/cr7K/tL+wj8Lf2Q/h4A3AHBA6sFTQdFCDkIAQe7BMYBpP7N+5X5G/hY9zr3vPfp+ND6Zv1zAJIDQQYPCLsITAgDBz8FVQN8AcL/Jf6r/HL7r/qU+jj7e/wQ/pH/pgAmASEB0AB4AEYAQgBUAFwASgAzAEAAmQBMATUCDAN/A1YDiQJFAdr/j/6R/eX8cPwY/Nr7z/sj/Pj8Tf7y/5UB5QKrA+MDtwNhAxMD2gKeAjgCiQGUAIH/hv7U/Xf9Vv1A/Qn9qfw//Av8TPwi/X7+JgDQAT0DUAQLBYMFwgW5BUIFMgR7AjwAxv2B+9H58Pjn+I/5rvoT/KP9WP8pAf4CngS/BR4GnQVXBJcCxAA7/zH+rP2R/br9Dv6J/jP/CwD6AMQBJQLjAfMAf//b/W78ivtX+837x/wZ/qL/UwEkA/kEmwa7BwYIRwd7BeEC4f/w/HP6o/iS9zn3jfeN+Dz6kvxo/20CNgVVB3cIgwiaBwUGGwQiAkEAif4A/bz74fqZ+v36A/x2/QH/TAAcAWIBPQHkAI0AVAA5ACkAFgAEAA0AUQDjALUBlAI5A2UD+AIDArsAY/8z/kX9mPwc/Mj7qPvb+4D8oP0h/8cARwJhA/cDFATiA44DNAPWAlwCrgHFALj/r/7a/VP9Ff0B/fD8yPyT/Hb8pPxD/Vn+xv9PAboC3gOsBCwFagVkBQYFMATOAusAvP6Q/MT6nfk6+Y/5cfqx+yr9x/57ADMCyQMCBaIFgwWmBDoDjwH8/8T+BP62/cD9Bf51/gv/xv+UAFEBxQG8ARsB9f+B/hf9CPyN+7j7ePyn/SL/ywCQAlgE9gUuB7YHVwf9BccDAwEa/nL7V/nz91H3a/c7+Lj52Pt5/lwBKgR8Bv0HfAj+B7IG5QTgAt4AAv9e/Qf8Ffup+tv6qPvw/HD+2P/lAHQB",
    "iwFMAegAiAA/AAwA6f/T/9j/DwCLAEYBIALfAkkDMQOPAoABOADv/s395Pw3/MD7h/ue+xv8Df1n/v7/lAHrAtMDQgRIBAkEpQMrA5cC3AH0AOv/3P7w/Ub95/zF/ML8wvy9/MP89/x4/Vj+iv/nAEACaANFBNUEGwUbBcwEHAT6AmYBgP+B/bf7Zfq4+bn5VPpg+7n8Pv7d/34BBQNHBBEFPQW9BKkDOwK6AGz/fP75/dj9Af5h/uj+jv9DAO8AZwGAARwBOwAD/7L9k/zl+8v7SPxH/aX+QQAAAsEDXgWkBlcHQgdJBnYE/wE5/4L8MPp/+I73Yvf490P5Mfui/WAAIwOSBVcHOggnCDYHoAWrA5gBm//U/V/8UvvF+sv6Zft9/OL9UP+EAFMBqwGbAUgB2QBtABQA1P+u/6r/1/8/AOMArgF1AgUDLwPdAhUC+QC2/3n+Yf2A/N37f/tz+8v7j/y9/Tf/zABFAnADLwR/BHIEIQShA/sCLwI9AS4AF/8X/kv9xfyF/Hn8i/ys/N38LP2w/Xf+gP+0APABDgPvA4cE0wTUBIoE7APyApwB/P86/o/8N/tg+iH6dvpG+3D81P1V/9oASwKEA18EuwSHBMsDqwJeAR4AHf90/ij+Lf5w/t/+a/8CAJIA+wAdAd4AOQBB/yL+F/1a/Bb8W/wl/Vv+3P+GATgDygQOBtUG8AZEBs4EsQIsAJD9LvtK+RP4nfft9/n4q/rl/HT/GQKJBHgGqAf7B3MHMgZxBG4CYwCA/uj8tvsA+9b6Ovsa/FP9r/70//AAiAG4AZMBNgHBAE8A8v+x/5n/sv8DAI0AQAH+AZ0C8wLlAmkCjQFvADj/CP79/Cv8oPtq+5b7LPwp/Xv+/f9/AdUC2QN4BLEEjwQkBH0DpgKmAYoAZv9R/mX9uPxR/Cv8Ovxv/MP8Nv3R/Zr+kP+lAMQBzwKrA0UElgSaBFEEuwPXAqoBQQC6/jz99vsR+6f6wfpU+0n8g/3j/k0ApwHSArADJwQpBLUD4gLVAbsAwP8C/5P+cf6S/uX+Wf/Z/04ApADCAJQAFQBS/2b+ff3H/Gz8h/we/SX+hP8YAbwCRwSLBV4GmgYlBvoELwPxAIH+Jvwl+rT49/f+98b4PfpC/KX+KwGRA5UF+wagB3cHkQYVBTcDMgE8/4L9KPxJ+/P6J/vX++P8Iv5j/3cAQAGqAboBgAEXAZkAIQDF/5L/lv/U/0kA6ACZAToCqQLKAo4C8gEIAer/t/6Q/ZP82Pt0+3T73/uy/Nz9Qv++ACkCXQM/BL8E2wSYBAIEKAMdAvIAvv+W/pP9xfw6/PT77/sk/Ir8G/3S/av+oP+lAKwBoQJwAwkEXgRqBCgEmQPCAq0BagAR/8D9l/y3+zf7JPt/+zv8Rv2C/tP/GQE3AhMDlwO6A3sD6gIdAjQBUgCU/w3/yP7F/vn+U/++/yEAZgB6AE8A5f9E/4L+wP0f/cH8wfwt/Qb+PP+0AEkCzwMXBfYFSQb8BQkFggOHAU3/C/0C+2r5bvgt+K745fm2++/9VwCvAroEQgYjB0sHvAaPBekD/AEBAC3+rPyi+yD7Kfut+5D8r/3f/vn/3QB3AbsBrgFgAecAYQDr/5z/hf+u/xAAnwBEAeIBXgKeApACLgJ5AYEAXv8t/hH9K/yX+2f7pftO/FP9nf4LAHwBzgLiA6EE+wTsBHkErgOiAmsBJQDp/sz94vw3/NL7tfve+0f85/yz/Z/+n/+jAKABhwJJA9oDLgQ8BAEEfAOyArEBiQBS/yL+FP1B/Lr7jvvB+0/8Kf07/mr/lwCnAYACEANMAzYD1QI8AoMBwgASAIn/Mf8S/yb/Yf+w//3/MgA+ABYAu/8x/4v+4/1U/fz88/xI/QH+E/9qAOUBWwOhBIwF+QXTBRMFwwP+AfH/y/3I+x76+/iB+L/4svlC+0f9i//TAeYDjQWhBgkHwQbXBWoEpgK9AOb+Tv0d/Gn7O/uM+0X8Rv1p/oj/fwA2AZ4BtQGFASABoQAkAMP/kv+b/+D/VwDuAI0BFwJzAosCUwLIAfMA5/+//pr9m/ze+337hvv7+9X8AP5h/9YAPgJ3A2UE8gQWBc4EJAQqA/cBpQBT/xf+Cv09/Lr7iPuk+wj8q/yA/Xj+g/+QAJIBeAI2A8ADDgQYBNwDXgOiArUBpgCJ/3L+eP2v/Cn88fsM/Hj8Kv0S/hr/JwAiAfQBjALeAugCsAJCArABEAF3APf/nf9u/2n/hv+3/+n/CgAMAOX/kv8Z/4f+8/10/SP9GP1h/QT++/40AJUB+AI2BCYFqQWlBRAF8gNeAnkAcv57/Mr6jPnm+Ov4nvnu+rv81f4HARkD1QQRBrEGqAb/BcwENQNpAZr/9v2n/Mj7aPuG+xH87/z+/Rj/GQDnAG4BpwGWAUoB2QBdAPL/rP+a/8P/IACmAD4BzwE+AnQCYQL+AU0BXQBF/yH+Ef02/Kv7gvvE+3D8d/3C/jIApgH7AhAEzgQjBQoFhwSoA4ECLgHM/3f+Sv1a/Lb7Z/tv+8j7aPxA/UH+V/9wAHsBZwInA7AD+gMBBMUDSgOWArcBugCy/7D+yP0L/Yn8TPxX/Kn8O/3//eL+0f+zAHkBEAJuApACeQIwAsQBRgHHAFYAAADL/7b/vP/S/+r/9//q/73/bP/8/nn+9P2C/Tv9Mf1z/Qf+6v4LAFQBpQLZA8wEXAVzBQMFDwSoAusAA/8d/Wz7HPpT+Sj5ovm2+kz8Ov5OAFYCHQR4BUUGdQYIBhAFqgMAAkEAnf46/Tn8rfua+/f7rvyi/a7+s/+PAC8BhgGUAWIBBAGRACIAz/+o/7f//f9tAPoAigEFAlICXgIfApIBwAC9/6D+if2Z/Or7lvuo+yX8BP0z/pb/CwFyAqgDkAQVBS0F1AQWBAUDuAFPAOj+nv2M/Mb7V/tE+4r7IPz3/P39Hf9CAFkBTwIXA6QD7wP2A7oDQAOSArsBygDR/+D+B/5X/dv8nPye/N78V/38/cD+kP9aAA8BoAEDAjUCNQILAsEBYwEAAaQAWAAjAAYA/P/9////9//Z/6H/TP/f/mT+6v2D/UT9Pf18/Qf+2/7r/yABYQKLA30EFwVCBfAEIQThAkoBgP+u/QL8qPrE+XH5ufmX+vf7uP2s/6MBbAPaBMwFLQb4BTcFBASCAtsAPf/P/bX8A/zE+/T7g/xX/VD+",
    "Tv8xAOMAVAF/AWkBIQG7AFAA9v/A/7r/6P9EAMIATQHMASkCTwIuAsMBEAEkABX///0A/Tf8vfuk+/P7qPy1/QP/cwDjATEDPgTvBDUFCgVzBH0DQALXAGT/BP7U/Ov7Wfsn+1X72vup/K/91f4FACoBLgIBA5cD6QP0A7oDQgOWAsQB2wDs/wb/Ov6U/R/94fzd/BH9eP0F/q7+Y/8VALcAPgGfAdkB6wHZAasBawEkAd4AogB1AFYAQgA0ACQACADa/5T/N//H/k3+2f15/UD9Pf18/QH+yv7N//QAKAJKAzkE2gQUBdsEKgQMA5cB6/8t/or8K/s0+sH53vmM+rv7Tv0f/wABxAI+BEwF1gXSBUYFRATsAmIB0/9j/jf9aPwD/Aj8bvwg/QD+8f7V/5IAFwFbAV8BLwHaAHcAHADd/8f/4f8pAJcAGAGXAf4BNgIwAuIBTQF7AH7/bv5p/Y389Pu0+9j7Y/xM/X/+4v9TAbEC2gOzBCUFKAW6BOYDvwJgAen/eP4u/ST8b/sb+yv7mfta/Fr9g/69/+4AAQLkAogD5AP2A8EDTAOjAtQB7wAFACf/Y/7E/VX9Gv0U/UH9mv0W/qn+R//k/3IA6wBHAYIBngGeAYcBYQEzAQUB3AC6AKAAigB0AFYAKQDr/5f/Lv+2/jr+xf1o/TL9Mf1w/fL9tf6v/8wA9wESAwAEpQTsBMYEMAQvA9cBRQCd/gX9pfuh+hT6DfqQ+pL7+vyo/m8AKAKnA8kEcwWaBT4FbAQ+A9YBWQDw/rv91fxQ/DD8b/z8/MH9oP59/z4A0QAqAUYBLQHsAJYAPwD8/9v/5f8bAHgA7gBpAdMBGAInAvMBegHCANn/1P7P/eb8NfzU+9L7NPz3/Az+W//GACwCawNkBAAFLwXsBD0EMwPkAW8A9v6X/XD8mfsh+w/7YvsP/AT9Kv5p/6UAyAG8AnED3AP6A84DXwO5AusBCAEgAEb/hv7s/YD9SP1B/Wr9uv0p/qz+OP/B/z0AqAD6ADMBVAFeAVgBRwExARkBBAHzAOIA0AC2AJAAWAALAKn/M/+x/iz+s/1U/R39HP1a/dr9mv6O/6UAygHhAs8DeQTLBLUENARMAw4ClAD//nP9FfwH+2b6Qvqg+nn7uvxE/vL/mwEYA0cECwVWBSQFfgR6AzUC0QB0/zz+SP2p/Gj8gvzt/JP9XP4t/+3/hwDvACABHQHwAKkAWwAYAPL/8f8YAGUAzgBCAa0B+gEYAvoBmgH6ACUAL/8u/j/9ffwB/Nz7Gfy2/Kr94v5AAKcB9AIIBMcEIAUIBYEElwNfAvUAef8L/sv81Ps5+wT7N/vL+6/8zf0N/1IAgwGJAlEDzgP8A90DdgPVAgoCKAFAAGb/pv4N/qP9bP1l/Yv91/09/rT+Mf+r/xcAdAC8AO4ADgEeASMBIgEfARwBHAEbARkBDwH4ANAAkQA5AMr/Rv+3/ij+pf0//QT9AP08/br9dv5n/3sAngG0AqQDVASwBKgEOQRnAz8C2gBW/9X9evxn+7b6efq4+m37ifzy/YX/HAGUAskDoQQJBfsEfgSiA4ACNwHq/7f+uv0I/az8p/zw/Hf9J/7n/qD/PACvAPEAAQHnALEAbgAxAAgAAAAcAF0AuQAlAYwB3gEHAvkBrgElAWUAf/+G/pX9yPw2/PT7DvyI/Fv9d/7F/yYBegKiA38E/gQPBbEE6wPPAnUB/f+H/jT9Ifxk+wv7HPuS+1/8cP2s/vf/MwFKAiUDuAP5A+oDkAP3AjACTgFmAIn/x/4s/sH9iP2B/aX97f1O/r7+Mf+e////TQCKALUA0ADhAOwA9gACAREBIwE1AUIBRQE2ARABzwBwAPf/Z//L/i7+oP0v/ev84PwX/ZH9S/46/00AcAGIAnwDNASZBKAEQQSBA20CGgGl/y7+1vy++wH7sPrU+mr7Zfyv/Sj/rQAcAlMDNwS3BMgEbwS4A7gCiwFRACj/Kf5q/fn82PwD/W39A/6v/lz/9v9tALoA2gDSAKwAdwBCABwAEAAlAFsArgAQAXMBxQH1AfUBuwFFAZkAw//U/ub9Ev1w/Bb8Efxq/Bz9HP5V/6sAAQI2AywEywQDBc0ELQQwA+wBfgAH/6b9e/yf+yP7EPtm+xn8F/1K/pT/2QD/Ae8ClwPvA/MDqAMbA1sCfAGRALH/6v5L/tv9n/2V/bf9/f1b/sb+M/+Y/+7/MgBkAIYAmwCqALYAxgDcAPkAGwE/AV0BbwFsAU4BDwGuAC4Alf/s/kH+pP0l/dX8wPzu/GH9F/4F/xgAPQFbAlYDFgSHBJwETQSeA5oCVgHu/3/+Kv0P/Ef75Prx+m37S/x4/dn+SwCvAeUC0gNjBI4EVAS+A98CzgGpAI3/kf7M/Uv9E/0k/XL97v2F/iP/tv8sAIAArACyAJwAdABKACkAHgAwAF8AqQAEAWEBsgHmAe8BwwFeAcIA/P8Z/zD+Wf2s/D78IPxa/O380P3y/joAiwHHAtADiwTmBNcEXASBA1cC+QCH/x/+4fzq+037FvtJ+937xfzp/S7/dwCqAawCawPaA/UDvgM/A4kCrgHEAOD/Ev9s/vX9s/2l/cP9B/5j/sv+NP+U/+T/IABKAGMAcQB5AIQAlQCxANgACAE7AWsBjQGYAYUBTgHwAG0Azf8Z/2D+tP0l/cX8ofzD/C793v3I/t3/BQEpAi0D+AN3BJoEWwS8A8gCkQEzAMz+ef1a/Ij7FvsP+3P7OPxM/ZX+9v9OAYECcwMRBFEEMQS4A/YCAQLzAOb/8f4p/p79Vf1P/YX96P1q/vb+fv/x/0YAeQCLAIIAaABIAC8AKAA5AGUAqQD+AFcBpQHbAeoByAFxAeQALABV/3P+nP3n/Gr8NvxW/Mz8k/2d/tT/HAFaAnADQgS7BM8EegTBA7UCawECAJn+T/1B/Ib7Lfs8+7D7fPyN/cj+EQBMAV8CMwO7A+4DzQNhA7cC4wH7ABMAQf+R/hL+x/2x/cv9C/5l/sz+NP+R/97/FQA4AEoAUABSAFcAZwCFALIA6wAsAWsBnQG5AbUBiQEyAbEADQBR/4z+0P0v/b38iPya/Pj8n/2G/pr/xQDwAf8C2ANnBJoEbATdA/cCzQF4ABb/w/2g/MT7Rfsr+3r7KPwm/Vv+q//4ACYCGwPDAxMECQSpAwIDJgItATAARv+A/u/9mv2D/aP9",
    "8P1c/tf+Uf+8/w8ARQBfAGAAUQA8AC0AKwA/AGsArQD9AFIBnwHVAegBzgGBAQEBVQCJ/67+2f0g/Zj8Uvxb/Lf8Y/1V/nj/tQDxAQ4D8QOFBLkEhwTxAwMD0gF3ABP/wf2h/Mz7U/s/+5H7QPw5/Wb+qv/pAAgC8AKPA9wD0wN8A+MCGgI2AU0Adf+9/jL+3f2+/dD9Cv5i/sj+L/+N/9n/DgAtADkAOAAzADIAPQBaAIgAyAASAV8BoQHOAdoBvAFwAfYAUgCS/8P++P1F/b/8dvx2/MT8X/0+/lD/fgCxAcwCtANTBJoEfQT/AykDCwK9AF//DP7j/P77cPtG+4H7G/wE/Sf+af+rANQBygJ5A9cD3gOUAwQDPwJbAW4Aj//P/jz+3/26/cn9A/5b/sT+L/+Q/97/EwAwADgAMgAnACEAJwBAAG4AsAD/AFIBngHVAeoB1gGRARoBeQC3/+P+EP5V/cT8cPxl/Kr8Pv0Y/in/WACOAa8CnwNHBJcEhQQRBEIDKwLiAIb/Mv4G/Rv8hvtS+4P7E/zy/Az+R/+FAKwBpAJYA7wDzAOMAwcDTAJxAYoAr//w/lz+/P3R/dn9DP5d/r/+Jf+C/83/AgAfACkAJAAbABYAHgA4AGYAqQD5AE4BnAHWAfEB4QGhATABkgDT///+K/5q/dP8dvxi/J38J/35/QL/LgBkAYgCfgMwBIwEhgQfBFwDTwINAbX/Yf4x/T/8oPtg+4T7Bvza/Ov9H/9aAIIBfQI3A6QDvwOKAw4DXAKIAaYAzv8P/3j+FP7k/eb9Ev5e/rv+Hf94/8L/9v8SABwAGAAPAAsAEgAsAFwAnwDwAEgBmQHYAfcB7QGyAUYBrADv/xz/Rf6B/eP8fvxg/JH8Ef3a/d3+BQA6AWECXQMYBH8EhgQrBHUDcQI3AeP/kP5d/WT8u/tv+4b7/PvE/Mv9+f4wAFcBVQIWA4wDsAOFAxQDawKeAcEA6/8s/5T+LP73/fP9Gv5g/rj+Fv9u/7b/6v8GABAADAAEAAAABwAhAFAAlADnAEEBlgHYAfwB+AHDAVwBxgAKADn/Yf6Y/fT8h/xf/Ib8/Py8/bn+3f8QATkCOwP/A3AEgwQ1BIsDkgJgARAAvv6I/Yn81/uA+4v79Puw/K390/4GAC0BLgL1AnIDoAN/AxgDeAKzAdsABwBK/7D+RP4K/gH+Iv5i/rb+Ef9l/6z/3v/7/wQAAQD5//T//P8VAEUAiQDdADkBkQHYAQECAgLSAXEB3wAnAFb/ff6x/Qb9kfxg/Hz86fyg/ZX+tf/mABECGAPkA2AEfwQ+BKADsgKIATwA7f60/a/89PuS+5D77fud/JH9r/7f/wQBBwLTAlgDjwN4AxsDhALGAfQAIwBm/8v+XP4e/g/+K/5m/rX+DP9e/6L/1P/w//r/9v/u/+n/8P8JADkAfQDTADEBjAHXAQUCCwLhAYUB+ABDAHP/mf7K/Rr9nfxi/HX81/yF/XL+jf+9AOkB9QLIA04EegRFBLMD0AKuAWgAGv/g/db8E/ym+5j76PuN/Hb9jP64/9sA4AGwAj0DfQNwAxwDjwLYAQwBPgCC/+b+dP4y/h7+NP5q/rX+B/9X/5n/yf/l/+//6//j/93/5P/+/ywAcQDIACgBhQHUAQcCEwLwAZkBEQFfAJD/tv7j/S79qfxm/G78xvxr/VH+Zv+TAMAB0AKrAzsEcgRKBMQD7ALUAZMASP8M/v38Mvy7+6H75ft+/Fz9a/6R/7MAuQGOAiEDaQNmAxwDmALpASIBWACe/wH/jP5G/i7+Pv5v/rX+BP9R/5H/wP/b/+T/4P/X/9L/2P/x/yAAZQC8AB4BfgHRAQkCGwL9AawBKAF6AK7/0/7+/UP9t/xr/Gn8t/xS/TD+QP9qAJcBqwKNAyYEaQRNBNQDBwP3Ab0Adf84/iX9UvzR+6z74/tw/ET9S/5s/4sAkgFrAgQDVQNbAxsDnwL4ATcBcQC5/xv/pP5a/j3+Sf51/rf+Av9L/4r/t//R/9r/1v/N/8f/zf/l/xMAWACwABMBdwHNAQoCIQIJAr4BQAGVAMv/8P4Y/ln9x/xx/Gb8qvw7/RH+Gv9CAG8BhgJuAxEEXgRPBOEDIAMaAuYAof9k/k39c/zp+7j74/tl/C79LP5H/2QAbAFIAucCQANPAxgDpgIGAkwBigDT/zX/vP5v/k7+Vf58/rn+AP9H/4P/r//I/9D/zP/C/7z/wf/Y/wYASwCkAAgBbgHJAQoCJwIVAs8BVwGwAOn/Dv80/nD91/x5/GT8nfwl/fL99v4ZAEYBYAJOA/oDUgROBO4DNwM7Ag4Bzf+Q/nb9lfwC/Mb75ftb/Br9D/4k/z0ARQEkAsoCKgNCAxQDqwITAl8BoQDs/0//1P6E/l7+YP6D/rz+//5D/33/p//A/8f/wv+4/7H/tf/M//n/PgCXAP0AZQHDAQkCKwIfAuABbQHLAAUAK/9Q/oj96PyC/GP8k/wQ/dX90v7y/x0BOgItA+EDRARNBPgDTQNaAjUB9/+8/p/9uPwb/NX76ftS/Af98/0C/xgAHwEBAqwCEwM0Aw8DrgIeAnABtwAEAGj/7P6Y/m/+bf6L/r/+//5A/3j/of+4/7//uf+u/6b/qf+//+z/MACJAPAAWwG9AQcCLwIpAvABggHlACIASf9s/qH9+/yM/GT8ifz9/Ln9r/7L//UAEwIMA8gDNQRJBAEEYQN4AlsBIQDn/sj92/w2/OX77vtM/PX82f3h/vT/+gDeAY0C/AIlAwkDsQIoAoEBzAAcAID/A/+t/oD+ev6T/sT+AP8+/3P/m/+x/7f/sP+l/5z/nv+z/9//IgB7AOQAUAG1AQUCMgIyAv8BlwH+AD8AZ/+J/rr9Dv2Y/Gb8gfzr/J79jf6k/8wA7AHqAq0DJQREBAcEdAOVAn8BSgAS//H9//xS/Pf79PtH/Ob8wP3B/tD/1QC7AW4C5AIUAwEDsgIxApAB4AAzAJj/Gv/C/pH+h/6c/sn+Af88/2//lf+q/6//qP+c/5L/k/+m/9H/FABtANYARQGtAQECMwI6Ag0CqwEXAVsAhf+n/tT9Iv2l/Gr8e/zb/IX9bP5+/6QAxQHHApIDEwQ9BA0EhQOwAqIBcwA9/xr+JP1v/Ar8/PtE/Nj8qf2i/q3/sACYAU8CywIDA/kCsQI5Ap8B9ABJAK//Mf/W/qP+",
    "lP6m/s7+BP87/2z/kP+k/6j/oP+T/4j/iP+a/8T/BQBfAMgAOQGkAfwBNAJBAhoCvgEwAXcApP/E/u/9OP2z/G/8dvzM/Gz9TP5Z/3wAngGjAnUD/wM1BBAElAPKAsQBmgBn/0P+SP2N/B/8BvxC/Mv8k/2F/ov/jAB1ATACsQLxAu8CsAI/AqwBBgFeAMb/R//r/rT+ov6w/tT+Bv87/2r/jP+f/6L/mf+L/37/ff+O/7b/+P9QALoALQGbAfcBNAJHAicC0QFIAZMAwf/i/gr+Tv3C/HX8c/y+/FX9Lf40/1QAdgF/AlgD6wMrBBIEoQPiAuUBwQCQ/2z+bv2r/DT8EfxC/MD8fv1p/mr/aQBSAREClwLeAuQCrgJFArgBFwFzANz/Xf///sb+sP66/tv+Cv88/2j/if+a/5z/kv+D/3X/cv+C/6j/6f9BAKsAHwGQAfEBMwJMAjIC4gFfAa8A3/8A/yb+Zf3S/H38cPyy/D/9D/4Q/y0ATwFbAjkD1QMgBBIErQP5AgUC5wC5/5X+k/3K/Ev8HfxD/Lf8a/1O/kr/RwAwAfEBfQLLAtgCqgJJAsIBJwGGAPL/c/8T/9f+v/7F/uL+Dv89/2f/hv+W/5f/jP97/2z/aP92/5v/2v8xAJwAEgGFAeoBMQJPAjwC8wF1AcoA/f8e/0L+ff3j/Ib8cPyn/Cv98v3t/gYAKAE2AhoDvgMTBBEEtwMOAyMCDAHi/73+uf3q/GL8KvxG/K/8Wv01/iv/JQAOAdIBYgK3AswCpQJMAswBNgGZAAUAiP8n/+n+zf7Q/ur+Ev8//2f/hP+T/5P/hv90/2T/Xv9q/43/y/8iAI0ABAF6AeIBLgJSAkYCAwKLAeQAGQA9/1/+lv32/JD8cPye/Bj91/3L/uH/AAERAvoCpgMFBA4EwAMhAz8CLwEIAOb+3/0L/Xv8OfxK/Kn8Sv0d/g3/AwDsALIBRwKiAr4CnwJNAtQBRAGrABkAnP87//r+3P7c/vL+F/9B/2f/g/+Q/4//gf9u/1z/VP9e/4D/vf8SAH0A9QBtAdkBKgJVAk4CEgKgAf4ANwBb/3z+r/0J/Zv8c/yW/Ab9vP2q/rz/2QDsAdoCjQP2AwoExwMzA1sCUgEvAA7/Bf4s/ZT8SfxQ/KT8O/0G/vD+5P/LAJMBLAKMArACmQJOAtwBUQG8ACwAsP9O/wz/6/7n/vv+Hf9E/2j/gv+O/4v/ff9o/1X/S/9T/3P/rv8CAG0A5gBgAc8BJQJWAlYCIAK1ARcBVAB5/5n+yf0e/aj8dvyQ/Pb8o/2J/pf/sgDGAbgCcwPlAwQEzANDA3UCcwFVADb/K/5N/a78W/xX/KD8Lv3x/dX+xf+qAHMBEAJ2AqECkQJOAuIBXAHMAD8AxP9h/x3/+v7z/gT/I/9I/2r/gv+M/4j/ef9j/07/Qv9I/2b/n//z/10A1gBSAcUBIAJWAlwCLgLIATABcACY/7f+5P0z/bb8e/yL/Of8i/1q/nL/jAChAZcCWAPTA/0D0ANSA40CkwF7AF3/Uf5v/cr8bfxf/J/8Iv3d/br+pv+KAFQB9QFgApECiAJMAucBZwHbAFEA1v9z/y7/Cf///g3/Kv9M/2z/gv+L/4b/df9e/0f/Ov8+/1n/kP/j/0wAxgBEAboBGQJVAmICOgLbAUgBjAC2/9X+//1J/cX8gfyH/Nr8dP1M/k//ZgB7AXQCPAPAA/QD0gNfA6QCsgGfAIT/d/6R/eX8gPxp/J78GP3K/aH+iP9qADUB2QFJAoACfgJKAusBcQHpAGIA6f+G/z//GP8M/xf/MP9Q/27/g/+L/4X/cv9Z/0H/Mv80/03/gv/T/zsAtQA1Aa4BEgJTAmYCRQLtAWABqADU//P+G/5g/dX8iPyF/M78X/0v/iz/QABVAVICHwOsA+kD0wNrA7oC0AHCAKr/nf60/QL9lfx0/J/8D/24/Yj+a/9LABcBvQExAm8CdAJGAu4BegH2AHIA+v+Y/1D/Jv8Y/yH/OP9V/3H/hf+L/4P/cP9W/zz/Kv8q/0H/dP/D/yoApAAmAaIBCgJQAmoCTwL9AXcBwwDy/xL/N/54/eb8kfyE/MP8S/0T/gr/GgAvAS8CAgOWA94D0gN1A84C7AHlAND/w/7X/SD9q/yB/KL8Cf2p/XH+T/8sAPcAnwEYAlsCZwJBAvEBggEEAYMADQCr/2P/N/8m/yv/P/9Z/3L/hP+I/4D/bP9R/zb/JP8i/zj/af+3/x0AlwAZAZYBAAJLAmoCVQIJAogB2gALAC7/U/6R/fr8n/yJ/L/8Pv38/ez++P8JAQkC4AJ6A8sDygN4A9wCBQIGAfb/7P7//UT9yPyU/Kr8Bv2b/Vr+Mf8KANMAfQH6AUQCWAI6AvIBiwETAZcAIwDC/3n/Sv81/zb/Rf9c/3L/gP+E/3r/Zv9L/zD/Hv8c/zD/Yf+t/xIAiwAMAYoB9wFFAmgCWAISApcB7gAkAEn/b/6r/RD9rvyR/L38Mv3o/c/+1v/kAOMBvQJdA7YDwAN5A+kCHAImARsAFP8n/mj95fyo/LT8Bf2P/UX+FP/p/7AAWwHcASsCRwIxAvIBkwEhAaoAOQDZ/47/Xf9F/0L/Tf9f/3L/fv9//3X/YP9F/yr/GP8V/yn/WP+j/wcAfwAAAX8B7QE+AmUCWwIaAqUBAgE8AGT/i/7G/Sf9v/yZ/L38KP3U/bT+tP+/AL4BmgJAA6EDtQN5A/QCMgJEAT8APP9P/oz9A/2+/L/8Bf2F/TL++f7J/44AOgG+ARICNQInAvABmQEuAbsATgDv/6T/cf9V/07/Vf9k/3P/fP98/3D/W/8//yX/Ev8P/yL/T/+Z//z/cgDzAHIB4wE2AmICXQIiArMBFQFUAH//p/7g/T790Pyj/L38H/3C/Zr+lP+aAJgBdwIiA4sDqAN4A/4CRgJhAWIAY/92/rD9If3U/Mz8B/19/SD+4P6r/20AGAGfAfkBIgIdAu0BngE5AcwAYQADALn/hP9l/1r/Xv9p/3T/e/95/2z/Vv86/x//DP8I/xr/R/+P//H/ZgDmAGYB2AEuAl4CXgIpAsABKAFrAJn/wv77/VX94vyu/L/8GP2x/YH+dP93AHQBVAIEA3QDmgN0AwUDWAJ8AYQAif+d/tT9QP3r/Nr8C/12/RD+yP6N/0wA9wCBAd8BDwIRAukBoQFDAdsAdAAYAM3/",
    "l/92/2f/Z/9u/3f/e/93/2j/Uf81/xr/B/8C/xP/Pv+F/+X/WQDZAFkBzQEmAloCXgIvAswBOgGBALP/3v4W/m399fy5/ML8Ev2i/Wn+Vv9UAE8BMQLlAlwDiwNwAwwDaQKWAaUArv/D/vn9YP0E/en8EP1x/QH+sf5w/ywA1wBiAcUB+wEEAuQBowFMAekAhgArAOH/qv+G/3X/cf91/3r/e/91/2X/Tv8x/xX/Af/8/gz/Nv97/9r/TQDMAE0BwQEdAlUCXgI1AtgBSwGXAM3/+f4w/oX9CP3G/Mb8Df2U/VL+OP8yACsBDQLFAkMDewNqAxADeAKuAcUA0v/p/h3+gP0d/fn8Fv1t/fT9nP5V/w4AtwBEAasB5gH2Ad4BpAFUAfYAlwA/APX/vf+X/4L/e/97/37/fP90/2P/Sv8t/xH//P72/gX/Lv9x/8//QAC/AD8BtQEUAk8CXgI6AuIBWwGtAOb/FP9L/p79HP3T/Mz8Cf2H/T3+HP8QAAcB6gGmAikDagNiAxMDhQLFAeMA9f8O/0H+oP03/Qv9Hv1r/ej9iP47//H/mAAmAZAB0QHnAdYBpAFaAQIBpwBRAAcAz/+o/5D/hv+D/4L/fv90/2H/R/8p/wz/9/7w/v7+Jf9n/8P/MwCxADIBqQEKAkkCXAI+AuwBawHCAP7/L/9m/rb9MP3h/NL8Bv18/Sn+Af/x/+QAxwGGAg8DWANZAxUDkQLaAQABFgAy/2X+wf1R/R39J/1q/d79dv4j/9T/eQAIAXUBuwHYAc0BogFfAQ0BtgBjABoA4f+4/5//kf+L/4f/gf90/2D/Rf8m/wn/8/7r/vf+Hf9d/7j/JgCkACUBnQEAAkICWgJBAvUBegHWABUASf+B/tD9Rf3w/Nn8Bf1x/Rb+5/7S/8IApAFlAvQCRANPAxUDmwLuARsBNwBW/4n+4f1s/TH9Mf1r/db9Zf4L/7j/WwDrAFoBpQHHAcQBoAFjARcBxABzACwA8//J/63/nf+U/43/hP91/1//Q/8j/wX/7v7l/vH+Ff9U/6z/GQCWABcBkAH2ATsCVwJEAv4BiAHpAC0AZP+c/un9W/0A/eL8Bf1p/QX+zv6z/6AAggFFAtkCMANEAxQDpAIAAjUBVwB5/6z+Av6I/UX9Pf1u/c/9V/72/p7/PwDOAD8BjgG1AbgBmwFkAR0BzwCCADwAAwDZ/7v/qf+d/5T/if95/2L/RP8k/wT/7P7i/uv+Df9J/5//CgCFAAUBfwHnATACUQJDAgQClQH8AEYAgP+6/gf+dv0W/fD8C/1l/ff9uP6W/30AXQEhArgCFQMxAwsDpgILAkoBcwCa/9D+Jf6o/WD9Uf14/dH9UP7n/on/JgCzACUBdQGhAagBkAFfAR4B1ACKAEcAEADm/8n/tv+p/5//k/+B/2n/S/8p/wj/7v7h/uf+Bv8+/5H/+v9yAPEAawHUASECRwJAAgcCoAEPAV4Anf/a/ib+k/0u/QL9E/1k/e39pP56/1wAOAH8AZYC+QIdAwADpQIVAl0BjQC6//L+SP7I/Xv9ZP2E/dT9Sv7a/nb/DgCZAAsBXQGMAZgBhQFaAR0B2ACSAFIAHADz/9X/wv+1/6n/nP+K/3D/Uf8u/wz/8P7h/uT+//40/4P/6f9fANwAVwHCARICPAI7AgoCqgEfAXUAuf/5/kb+sP1H/RT9Hf1k/eP9kf5f/zwAFQHYAXQC3AIHA/MCogIcAm4BpgDY/xT/av7n/Zb9ef2R/dj9Rv7O/mT/+f+AAPIARQF3AYcBeQFTARsB2wCZAFsAJwD//+L/zv/A/7T/pv+S/3j/WP80/xD/8v7h/uL++f4r/3f/2f9MAMgAQgGvAQICMQI1AgsCsgEvAYsA1P8X/2T+zv1g/Sf9KP1m/dz9gP5H/x0A8gC0AVICvwLxAuYCngIiAn0BvQD1/zT/i/4H/rH9jv2f/d79Q/7E/lT/5P9pANkALgFiAXYBbQFMARkB3QCeAGQAMQAJAO3/2f/L/77/r/+b/4D/X/86/xX/9v7i/uD+9P4j/2v/yv86ALUALgGcAfEBJQIvAgsCuQE9AaAA7v80/4P+6/16/Tv9NP1p/db9cf4w/wAA0QCSATECogLaAtcCmQImAooB0gAQAFP/q/4m/sz9pP2t/eT9Qv68/kX/0P9SAMEAFwFOAWUBYQFEARYB3gCjAGsAOwAUAPn/5P/V/8j/uP+k/4j/Z/9B/xr/+f7j/t/+8P4b/1//u/8pAKEAGgGIAeABGAInAgoCvwFKAbMABgBQ/6H+CP6T/U/9Qv1u/dH9ZP4a/+T/sQBwARAChALDAscCkgIpApYB5gAqAHH/y/5E/uf9uv28/ez9Qv60/jf/vv88AKsAAAE5AVQBVAE8ARIB3gCnAHIARAAeAAIA7//g/9L/wv+t/5H/bv9I/yD//v7m/t7+7f4U/1X/rf8YAI4ABgF1Ac8BCwIfAggCxAFWAcYAHQBs/77+Jf6u/WT9UP10/c79WP4G/8r/kQBOAe8BZwKrArcCigIqAqAB+ABCAI7/6v5j/gP+0P3M/fX9Q/6u/iv/rP8oAJQA6gAlAUMBRgEzAQ4B3gCqAHgATAAoAAwA+f/q/9z/y/+1/5n/dv9P/yb/Av/p/t/+6v4O/0v/oP8HAHwA8wBiAb4B/AEWAgUCxwFhAdcANACH/9v+Qf7I/Xr9X/17/c39Tv70/rH/dAAuAc8BSQKSAqUCgQIqAqkBCQFZAKr/B/+A/h7+5/3d/f79Rf6p/h//nP8UAH8A1QARATIBOQEpAQgB3QCtAH0AUwAwABYAAgDz/+X/1P++/6L/fv9W/y3/CP/s/uD+6P4I/0L/k//4/2kA3wBOAawB7gEMAgECygFqAeYASQCg//f+Xv7i/ZD9b/2D/c39Rf7j/pn/VwAOAa8BLAJ5ApMCdwIoArABGAFvAMT/JP+d/jn+/f3u/Qn+Sf6m/hb/jv8CAGsAwAD+ACEBKwEfAQMB2wCuAIIAWgA4AB8ACwD9/+7/3f/H/6r/hv9e/zT/Df/w/uH+5v4D/zn/h//p/1gAzAA7AZoB3wEBAvsBywFyAfUAXgC5/xL/ev79/ab9gP2N/c79Pv7T/oP/OwDwAJABDgJgAoACawIlArUBJQGDAN3/QP+5/lP+FP4A/hT+Tf6j/g3/gP/x/1cArADrABABHQEVAfwA2QCvAIUA",
    "YABAACcAFAAFAPf/5v/Q/7P/j/9m/zv/E//0/uP+5v7//jL/fP/b/0cAuQAoAYgBzwH2AfUBywF4AQIBcQDR/y3/lf4X/r39kf2X/dD9OP7G/m7/IQDSAHEB8QFHAmwCXwIhArkBMQGVAPX/W//V/m7+K/4S/iD+U/6i/gb/c//h/0UAmQDYAP8ADwELAfYA1QCvAIgAZQBHAC8AHAANAAAA7v/Y/7v/l/9u/0P/Gv/5/ub+5v78/iv/cf/N/zYApwAVAXYBvwHqAe4BygF+AQ4BgwDn/0f/sP4x/tT9o/2j/dT9M/65/lr/CAC2AFMB1AEuAlgCUgIcArwBPAGnAAoAdP/w/of+Qv4k/i3+Wf6i/gD/aP/S/zMAhgDFAO8AAQEAAe8A0gCvAIsAaQBNADYAJAAVAAcA9//g/8P/n/92/0r/If/+/un+5v75/iX/aP/A/yYAlQACAWMBrwHdAecByAGCARkBkwD9/2D/y/5L/uz9tv2v/dn9MP6u/kj/8f+aADYBuAEUAkQCRAIVAr4BRQG3AB8Ajf8K/6H+Wf43/jr+YP6j/vv+Xv/E/yIAdAC0AN4A8wD1AOcAzgCuAIwAbQBSAD0AKwAdAA8A///p/8z/qP9+/1L/KP8E/+3+5/73/h//X/+z/xYAgwDvAFEBnwHQAd4BxQGGASMBowARAHj/5f5l/gP+yf28/d/9L/6l/jj/2/+AABoBnAH6AS8CNQIOAr4BTQHFADMApf8j/7r+cP5K/kj+aP6l/vf+Vf+2/xIAYwCiAM4A5QDqAN8AyQCsAI4AcABXAEMAMgAkABYABgDx/9T/sP+H/1r/L/8K//H+6f72/hv/Vv+n/wgAcgDdAD8BjgHCAdUBwQGIASsBsQAkAJD//v5+/hr+3f3K/eb9Lv6d/in/xv9mAP4AgAHhARkCJQIFAr0BUwHSAEYAu/88/9L+h/5d/lb+cf6o/vT+Tf+q/wMAUgCSAL4A1wDfANcAxACqAI4AcwBbAEgAOAArAB4ADQD4/9z/uP+P/2L/N/8R//b+7P72/hf/T/+c//v/YgDLAC0BfQG0AcsBvQGJATMBvwA3AKb/F/+X/jL+8f3Z/e79L/6W/hv/sv9OAOQAZQHHAQQCFQL8AboBWAHeAFcA0f9T/+r+nf5w/mX+ev6r/vL+Rv+f//b/QgCBAK8AygDTAM4AvgCnAI4AdQBfAE0APgAyACQAFAAAAOT/wf+X/2v/Pv8X//v+7/72/hP/SP+S/+3/UgC6ABsBbQGmAcABtwGJATkBywBIALv/L/+w/kn+Bf7o/fj9Mf6R/g//oP83AMoASgGuAe4BBQLxAbcBXAHoAGcA5f9q/wL/s/6E/nT+hP6w/vH+QP+V/+n/MwByAKAAvADIAMUAuACkAI0AdgBiAFEARAA3ACsAGwAGAOv/yf+g/3P/Rv8e/wH/8v72/hH/Qv+J/+D/QgCoAAkBXAGXAbUBsQGIAT4B1gBYAND/Rv/I/mH+Gf74/QH+NP6N/gT/j/8hALEAMAGVAdgB8wHmAbMBXgHxAHYA+P+A/xj/yf6X/oT+j/61/vH+O/+M/93/JQBjAJEArwC8ALwAsgChAIwAdwBlAFUASAA9ADEAIgANAPP/0f+o/3v/Tv8m/wf/9v74/g//Pf+A/9T/MwCYAPgASwGIAakBqQGGAUIB4ABnAOP/Xf/g/nj+Lv4J/gz+OP6K/vr+f/8MAJkAFwF9AcIB4gHaAa0BYAH5AIQACQCV/y7/3/6q/pP+mv67/vL+N/+E/9H/GABUAIMAoQCxALMAqwCdAIoAeABnAFkATQBCADYAKAAUAPr/2P+w/4T/V/8t/w3/+v76/g7/OP94/8n/JQCHAOYAOgF5AZ0BogGEAUUB6AB1APb/cv/3/o/+Q/4a/hj+Pv6I/vH+cP/6/4IA/gBkAawB0AHOAacBYAEAAZAAGgCp/0T/8/69/qP+pv7C/vP+NP99/8f/CwBGAHUAlACmAKoApQCYAIgAeABoAFsAUQBHADwALgAaAAAA4P+4/4z/X/81/xT///78/g3/NP9w/77/FwB3ANYAKQFqAZEBmQGAAUcB8ACCAAYAh/8O/6X+V/4r/iT+RP6I/ur+Y//n/2wA5gBNAZYBvQHAAaABXwEFAZsAKgC8/1j/CP/Q/rP+sv7J/vb+Mv92/73/AAA5AGcAiACaAKEAngCUAIYAdwBpAF4AVABLAEEAMwAgAAcA5//A/5T/Z/89/xr/BP///g7/Mf9q/7T/CgBoAMUAGAFaAYQBkAF8AUgB9gCOABcAm/8k/7z+bP48/jH+S/6I/uT+V//W/1cAzwA1AYABqwGzAZcBXQEKAaUAOADO/2z/HP/j/sP+vv7R/vn+MP9x/7T/9f8tAFoAewCPAJgAlgCPAIMAdgBqAGAAVwBPAEUAOAAmAA0A7v/I/5z/b/9F/yL/Cv8D/w7/L/9k/6r///9ZALUACAFLAXYBhgF2AUgB/ACZACYArv85/9H+gf5O/j7+U/6K/uD+TP/G/0MAuQAeAWsBmAGkAY8BWgENAa4ARgDf/3//MP/1/tP+y/7a/v3+MP9s/6z/6v8hAE4AbwCEAI4AjwCJAIAAdQBqAGEAWQBSAEkAPQAsABQA9f/P/6X/eP9N/yn/EP8G/xD/Lf9e/6L/8/9LAKUA9wA7AWkBfAFxAUcBAAGjADUAwP9N/+f+lf5g/kz+XP6N/tz+Qv+3/zAAowAIAVUBhgGWAYUBVwEPAbUAUgDv/5H/Qv8H/+P+1/7j/gL/MP9p/6X/4f8VAEIAZAB6AIUAiACEAHwAcwBqAGIAWwBVAE0AQQAxABkA/P/X/63/gP9V/zD/Fv8L/xH/LP9a/5r/6P8+AJUA5wArAVsBcQFqAUUBBAGrAEIA0v9h//z+qv5y/lv+Zf6Q/tr+Ov+p/x4AjwDyAEABcwGHAXsBUgEQAbwAXQD+/6P/Vf8Z//P+5P7s/gf/Mf9m/5//2P8LADYAWABvAHwAgAB+AHgAcQBpAGMAXQBXAFAARQA1AB8AAQDe/7T/iP9e/zj/Hf8Q/xT/K/9W/5P/3v8xAIcA1wAcAU0BZgFjAUIBBgGzAE8A4v91/xD/vv6F/mn+b/6V/tj+M/+d/w0AewDdACsBYAF3AXABTAEQAcIAaAALALP/Z/8r/wP/8v71/gz/M/9j/5n/z/8BACwATQBlAHMAeQB4AHQA",
    "bgBoAGMAXgBZAFMASQA6ACQABwDl/7z/kP9m/0D/JP8V/xf/K/9T/4z/1P8kAHgAyAANAT8BWgFbAT8BCAG6AFoA8f+H/yT/0v6X/nn+ev6a/tj+Lf+R//7/aADIABcBTQFoAWUBRgEPAcYAcQAYAMP/eP88/xP///7//hP/Nf9i/5T/yP/4/yEAQwBbAGoAcQByAHAAbABnAGMAXwBbAFUATAA+ACkADQDr/8P/mP9u/0j/K/8a/xr/LP9R/4f/y/8YAGoAuQD9ADEBTwFSATsBCQG/AGQAAACY/zf/5f6p/oj+hf6h/tj+J/+H/+//VgC1AAMBOwFYAVkBPwEOAcoAeQAkANL/iP9M/yL/DP8K/xn/OP9h/5D/wf/w/xcAOQBRAGEAaQBsAGwAaQBlAGIAYABcAFcATwBBAC0AEwDy/8v/oP92/1D/Mv8g/x7/Lf9P/4L/w/8NAF0AqgDuACMBQgFJATYBCAHEAG4ADQCp/0r/+P67/pj+kf6o/tr+JP9+/+H/RQCiAO8AKAFIAU0BOAELAcwAgAAvAOD/mP9c/zL/Gf8U/yH/O/9h/43/u//o/w4ALwBHAFgAYgBmAGcAZgBkAGIAYABdAFkAUQBFADIAGAD4/9L/qP9+/1j/Of8m/yL/L/9O/33/u/8DAFAAnADfABUBNgFAATABBwHIAHYAGQC5/1z/C//N/qf+nf6v/t3+If92/9X/NQCPANwAFgE4AUABLwEIAc4AhwA5AO3/p/9s/0D/J/8f/yj/P/9i/4r/tv/g/wYAJgA+AFAAWgBgAGIAYgBhAGAAYABeAFoAUwBIADUAHAD+/9j/sP+G/2D/Qf8t/yf/Mf9N/3r/tf/6/0QAjgDRAAcBKgE2ASoBBQHKAH4AJQDI/23/Hf/f/rf+qv64/uD+H/9v/8n/JQB+AMoABAEoATQBJwEEAc4AjABDAPr/tf97/0//NP8q/zD/RP9j/4j/sf/a//7/HQA1AEcAUwBaAF0AXgBfAF8AXwBeAFsAVQBKADkAIQACAN//t/+O/2j/Sf8z/yz/NP9N/3f/rv/x/zgAgQDDAPgAHQEsASMBAwHMAIQALwDW/37/L//x/sf+t/7B/uT+Hv9p/7//FwBtALgA8gAYASYBHQH/AM4AkABLAAQAw/+K/17/Qf81/zj/Sf9k/4f/rf/T//f/FAAtAD8ATABUAFgAWwBcAF0AXgBeAFwAVwBMADwAJQAHAOX/vv+W/3D/UP86/zH/N/9O/3T/qf/p/y0AdAC1AOsAEAEhARwB/wDNAIoAOQDk/47/Qf8C/9f+xP7K/un+Hv9k/7X/CgBdAKcA4QAIARkBFAH5AM0AlABSAA8A0P+Y/2z/Tv9A/0D/Tv9n/4b/qv/O//D/DAAlADcARQBNAFMAVwBZAFwAXQBeAFwAWABOAD8AKQAMAOv/xf+d/3j/WP9B/zf/O/9P/3P/pP/h/yMAZwCnAN0AAwEWARQB+wDOAI4AQgDw/53/Uf8T/+f+0f7U/u/+Hv9g/63///9OAJYA0AD4AAwBCgHzAMwAlgBZABkA3P+l/3n/W/9L/0n/VP9p/4b/p//J/+n/BQAdADAAPgBHAE4AUwBWAFkAXABdAF0AWQBQAEEALAARAPH/zP+l/4D/YP9I/z3/P/9R/3H/oP/a/xkAWwCaAM8A9gALAQwB9wDNAJIASgD8/6z/Yf8j//f+3/7f/vX+IP9d/6X/8/8/AIYAwADpAP4A/wDtAMkAmABfACIA5/+y/4b/Z/9W/1L/Wv9s/4b/pf/E/+P///8WACgANwBBAEkATwBTAFcAWgBcAFwAWQBRAEMALwAVAPb/0v+s/4f/aP9Q/0P/Q/9T/3H/nf/T/xAAUACNAMIA6gAAAQMB8QDMAJUAUQAFALn/cf80/wb/7f7p/vz+I/9a/57/6f8yAHYAsADZAPEA9QDmAMYAmQBjACoA8v++/5P/c/9h/1v/YP9w/4f/o//B/97/+P8PACEAMAA7AEQASgBQAFUAWQBbAFwAWQBSAEUAMgAZAPv/2P+z/4//b/9X/0n/SP9V/3H/mv/O/wgARQCBALUA3QD1APoA6wDKAJcAVwAPAMb/gP9D/xb/+/70/gP/Jv9Z/5n/3/8lAGgAoADKAOMA6gDeAMIAmQBnADEA/P/J/5//f/9r/2T/Z/90/4j/ov+9/9n/8v8IABsAKgA2AD8ARgBMAFIAVwBaAFsAWQBTAEcANQAcAAAA3v+6/5b/d/9e/1D/Tf9Y/3L/mP/J/wAAOwB1AKgA0ADpAPEA5QDHAJgAXAAYANL/jv9T/yX/Cf8A/wv/Kv9Z/5T/1v8aAFoAkQC7ANYA3gDWAL4AmQBrADgABADU/6v/i/92/23/bv94/4r/of+7/9T/7f8CABQAIwAwADoAQgBJAE8AVQBZAFoAWQBTAEgANwAfAAMA4//A/57/fv9m/1b/U/9c/3P/lv/E//r/MgBqAJwAxADeAOcA3gDDAJkAYQAgAN3/nP9i/zT/F/8L/xT/Lv9Z/5D/z/8PAEwAgwCtAMgA0wDOALkAmABtAD0ADADf/7b/lv+B/3b/df99/4z/of+4/9D/6P/9/w4AHQAqADUAPgBFAEwAUgBXAFkAWABTAEkAOAAiAAcA6P/G/6T/hv9t/13/WP9g/3T/lf/A//P/KQBfAJAAuADSAN0A1wC/AJgAZAAnAOj/qf9w/0P/JP8X/x3/NP9a/43/yP8EAEAAdQCfALsAyADFALQAlgBvAEIAFADo/8H/of+L/3//fP+C/4//of+2/83/4//3/wgAGAAlADAAOQBCAEkAUABVAFgAVwBTAEkAOgAlAAoA7f/M/6v/jf91/2T/Xv9k/3f/lf+9/+3/IQBVAIUArADHANMAzwC7AJcAZwAuAPH/tf9+/1H/Mv8j/yb/Ov9c/4v/wv/8/zQAZwCRAK4AvAC8AK4AkwBwAEcAGwDx/8v/rP+V/4j/g/+H/5L/ov+1/8r/3//y/wMAEgAgACsANQA+AEYATQBTAFYAVgBSAEkAOwAnAA4A8f/R/7L/lP98/2v/ZP9p/3n/lf+7/+j/GQBLAHkAoAC8AMkAxwC2AJUAaQAzAPr/wP+L/1//P/8v/y//QP9f/4r/vf/0/ykAWwCDAKEAsQCzAKcAkABwAEoAIQD6/9X/tv+f/5H/i/+N/5X/o/+0/8f/2//t////DQAbACYA",
    "MQA7AEMASwBRAFQAVQBSAEkAPAApABAA9f/X/7j/m/+D/3L/a/9u/3z/lv+5/+T/EgBCAG8AlQCwAL8AvwCwAJMAagA4AAEAy/+Y/2z/Tf87/zn/R/9i/4n/uf/s/x8ATgB2AJQApQCpAKEAjQBwAE0AJwABAN7/wP+p/5n/kv+S/5n/pf+0/8X/1//p//r/CAAWACIALQA3AEAASABPAFMAVABRAEkAPAAqABMA+f/c/77/ov+K/3n/cf9z/4D/l/+4/+D/DAA5AGUAigClALUAtgCqAJAAagA8AAgA1f+k/3n/Wv9H/0P/Tv9m/4n/tf/l/xUAQwBqAIcAmgCgAJoAiQBvAE8ALAAIAOf/yv+y/6L/mv+Y/53/pv+0/8T/1P/l//X/AwARAB4AKQA0AD0ARgBMAFEAUgBPAEgAPAArABUA/P/g/8P/qP+R/4D/d/94/4P/mf+3/93/BgAxAFsAfwCaAKoArgCjAIwAagA/AA8A3v+v/4b/Z/9T/07/Vv9r/4r/sv/f/w0AOABeAHsAjgCWAJIAhABuAFEAMAAOAO//0/+7/6v/of+e/6H/qP+0/8L/0v/h//H/AAANABkAJQAwADoAQwBKAE8AUABOAEgAPAAsABcA///k/8n/rv+Y/4f/fv9+/4f/m/+3/9r/AQAqAFIAdACPAKAApQCdAIgAaQBCABQA5/+6/5L/c/9f/1j/Xv9w/4z/sf/a/wUALgBTAHAAgwCMAIsAfwBsAFEAMwAUAPb/2//E/7P/qP+k/6X/q/+1/8H/z//e/+3//P8IABUAIQAtADcAQABHAEwATgBNAEcAPAAsABgAAQDo/87/tP+e/47/hP+E/4z/nf+3/9j//f8jAEkAagCFAJYAmwCVAIQAaABDABkA7v/E/57/f/9r/2P/Zv91/47/r//W//7/JQBIAGQAeACCAIMAegBpAFIANgAZAP3/4//N/7v/sP+q/6n/rv+2/8H/zv/b/+r/+P8EABEAHgApADQAPQBFAEoATABLAEUAOwAsABoAAwDs/9L/uv+l/5X/i/+J/5H/oP+4/9b/+f8dAEEAYQB7AIwAkgCOAH8AZQBEAB0A9f/N/6n/i/93/23/b/97/5H/r//S//j/HAA9AFkAbQB5AHsAdABmAFIAOQAeAAMA6//V/8P/t/+w/67/sf+3/8D/zP/Z/+b/9P8BAA4AGgAmADEAOwBCAEgASgBJAEQAOgAsABoABQDv/9b/v/+r/5v/kv+P/5X/pP+5/9X/9v8XADkAWABxAIIAiQCGAHkAYwBEACEA/P/W/7P/l/+C/3j/d/+B/5X/r//P//L/FAA0AE4AYwBvAHMAbgBjAFEAOwAiAAkA8v/d/8v/vv+2/7P/tP+5/8H/y//X/+P/8f/+/woAFwAjAC4AOABAAEUASABHAEIAOQAsABsABwDx/9r/xP+x/6L/mP+W/5v/p/+7/9X/8/8SADIATwBnAHgAgAB+AHMAXwBEACMAAADe/73/ov+N/4L/gP+I/5n/sP/N/+3/DAAqAEQAWABlAGoAaABfAE8APAAlAA4A+P/k/9P/xf+8/7j/t/+7/8H/yv/V/+H/7v/7/wcAFAAgACsANQA9AEMARgBFAEAAOAArABsACAD0/97/yf+2/6j/n/+c/6D/q/+9/9X/8f8OACwARwBeAG4AdgB2AG0AWwBDACUABQDl/8b/rP+Y/43/if+P/53/sv/M/+n/BQAiADsATgBcAGIAYgBaAE4APAAoABMA///r/9r/zP/C/73/u/+9/8L/yf/T/97/6//4/wQAEQAdACkAMwA7AEEAQwBDAD8ANgAqABsACQD2/+H/zf+8/67/pf+i/6b/sP/A/9b/7/8KACYAPwBVAGUAbQBuAGYAVwBBACcACQDs/8//tv+j/5f/k/+X/6L/tP/L/+X/AAAaADEARQBSAFoAWwBWAEsAPQArABcAAwDy/+H/0//I/8L/vv+//8P/yf/S/9z/6P/1/wEADgAaACYAMAA4AD4AQQBBAD0ANQApABsACQD4/+T/0f/B/7T/q/+o/6v/tP/D/9f/7v8HACAAOABMAFwAZABlAF8AUgA/ACcADADy/9f/wP+t/6H/nP+e/6f/t//L/+L/+/8SACkAOwBJAFEAVABRAEkAPAAtABsACQD4/+f/2f/O/8f/wv/B/8T/yf/R/9v/5v/y////CwAYACQALgA2ADwAPwA+ADoAMwAoABoACgD5/+f/1f/G/7n/sf+u/7H/uf/H/9n/7v8EABwAMgBEAFMAWwBdAFgATQA8ACcADwD3/97/yf+3/6v/pf+m/63/uv/L/+D/9v8LACAAMgBAAEkATQBMAEYAOwAuAB4ADQD+/+7/4P/U/8z/xv/E/8X/yf/Q/9n/5P/w//3/CQAVACEAKwA0ADoAPAA8ADgAMQAmABkACgD6/+n/2P/K/7//t/+1/7f/vv/K/9v/7v8CABcALAA9AEoAUgBVAFEASAA5ACYAEQD7/+X/0f/B/7X/rv+u/7P/vf/M/97/8v8FABgAKgA3AEEARgBGAEIAOgAvACEAEgACAPT/5v/a/9H/yv/H/8f/yv/Q/9j/4v/u//r/BgATAB8AKQAyADcAOgA6ADYALwAlABgACQD6/+r/2//O/8T/vf+7/73/w//P/93/7/8BABQAJgA2AEIASgBMAEkAQgA1ACUAEgD//+v/2f/K/77/uP+2/7n/wv/O/93/7v8AABEAIQAvADkAPwBBAD4AOAAvACMAFQAHAPn/7P/f/9b/zv/K/8n/y//P/9f/4P/s//j/BAARAB0AJwAvADUAOAA3ADQALQAjABYACQD7/+z/3v/S/8j/w//B/8P/yf/T/+D/8P8AABEAIQAvADoAQQBEAEIAOwAxACMAEwABAPH/4f/T/8j/wf++/8D/xv/Q/93/7P/8/wsAGQAmADEAOAA7ADoANgAvACUAGQALAP//8f/l/9r/0v/N/8v/zP/P/9b/3//q//b/AgAPABsAJQAtADMANgA1ADEAKgAhABUACAD7/+3/4P/V/83/yP/G/8n/zv/Y/+P/8f8AAA4AHQApADMAOQA8ADoANQAsACEAEwAEAPb/5//b/9H/yv/G/8f/y//S/93/6f/3/wQAEgAfACkAMAA1ADYANAAuACYAHAAQAAMA9//q/9//1v/Q/83/zf/Q/9b/3v/p//X/",
    "AAANABkAIwAsADEANAAzAC8AKAAeABMABgD6/+3/4v/Y/9H/zf/M/87/1P/c/+f/8/8AAA0AGQAjACwAMQAzADIALgAnAB4AEgAGAPr/7v/i/9n/0v/O/87/0P/W/97/6P/0/wAADAAXACIAKgAvADEAMQAtACYAHQASAAYA+//v/+T/2//U/9D/z//R/9f/3v/o//P/AAALABYAIAAoAC0AMAAvACwAJQAdABIABwD8//D/5f/d/9b/0v/R/9P/2P/f/+j/8////woAFQAfACYALAAuAC4AKwAlABwAEgAHAP3/8f/n/97/2P/U/9L/1P/Z/+D/6f/z//7/CQATAB0AJQAqAC0ALAApACQAHAASAAgA/f/y/+j/4P/Z/9X/1P/V/9r/4P/p//P//v8IABIAGwAjACgAKwArACgAIwAbABIACAD+//P/6v/h/9v/1//V/9f/2//h/+n/8//9/wcAEQAaACEAJwApACkAJwAiABsAEgAIAP//9P/r/+P/3f/Z/9f/2P/c/+L/6f/z//3/BgAQABkAIAAlACgAKAAmACEAGgASAAgA///1/+z/5P/e/9r/2f/a/93/4v/q//P//P8FAA8AFwAeACMAJgAmACQAIAAaABIACQAAAPb/7f/m/+D/3P/a/9v/3v/j/+r/8//8/wQADgAWAB0AIgAlACUAIwAfABkAEgAJAAAA9//v/+f/4f/d/9z/3P/f/+T/6//z//z/BAANABUAGwAgACMAJAAiAB4AGAARAAkAAAD4//D/6f/j/9//3f/e/+D/5f/r//P/+/8DAAwAEwAaAB8AIQAiACEAHQAYABEACQABAPn/8f/q/+T/4f/f/9//4v/m/+z/8//7/wIACwASABgAHQAgACEAHwAcABcAEQAJAAEA+v/y/+v/5v/i/+D/4f/j/+f/7P/z//v/AgAKABEAFwAbAB4AHwAeABsAFgAQAAkAAQD7//P/7f/n/+T/4v/i/+T/6P/t//P/+/8BAAkAEAAVABoAHQAeAB0AGgAVABAACQACAPv/9P/u/+n/5f/j/+P/5f/p/+7/9P/7/wEACAAPABQAGAAbABwAGwAZABUADwAJAAIA/P/1/+//6v/n/+X/5f/m/+r/7v/0//v/AAAHAA0AEwAXABoAGwAaABgAFAAPAAkAAgD9//b/8P/s/+j/5v/m/+j/6//v//T/+v8AAAYADAARABUAGAAZABkAFgATAA4ACQACAP3/9//y/+3/6v/o/+j/6f/s//D/9f/6/wAABgALABAAFAAXABgAFwAVABIADgAIAAMA/v/4//P/7v/r/+n/6f/q/+3/8P/1//r/AAAFAAoADwATABUAFgAWABQAEQANAAgAAwD+//n/9P/w/+3/6//q/+v/7v/x//b/+/8AAAQACQAOABEAFAAVABUAEwAQAAwACAADAP//+f/1//H/7v/s/+z/7f/v//L/9v/7/wAABAAIAA0AEAASABMAEwASAA8ADAAIAAMA///6//b/8v/v/+7/7f/u//D/8//3//v///8DAAgADAAPABEAEgASABEADgALAAcAAwD///v/9//z//H/7//v/+//8f/0//f/+////wMABwAKAA0ADwAQABAADwANAAoABwADAAAA/P/4//X/8v/x//D/8f/y//X/+P/7////AgAGAAkADAAOAA8ADwAOAAwACgAGAAMAAAD8//n/9v/0//L/8v/y//P/9f/4//z///8CAAUACAALAA0ADgAOAA0ACwAJAAYAAwAAAP3/+v/3//X/8//z//P/9P/2//n//P///wEABAAHAAoACwAMAAwADAAKAAgABQADAAAA/f/6//j/9v/1//T/9f/2//f/+f/8////AQAEAAYACAAKAAsACwAKAAkABwAFAAIAAAD+//v/+f/3//b/9v/2//f/+P/6//z///8BAAMABQAHAAkACQAKAAkACAAGAAQAAgAAAP7//P/6//n/+P/3//f/+P/5//v//f///wAAAwAFAAYABwAIAAgACAAHAAYABAACAAAA///9//v/+v/5//j/+f/5//r//P/9////AAACAAQABQAGAAcABwAHAAYABQADAAIAAAD///3//P/7//r/+v/6//r/+//8//7///8AAAEAAwAEAAUABQAGAAUABQAEAAMAAQAAAP///v/9//z/+//7//v//P/8//3//v8AAAAAAQACAAMABAAEAAQABAAEAAMAAgABAAAAAAD///7//f/9//3//f/9//3//v///wAAAAABAAEAAgACAAMAAwADAAIAAgABAAEAAAAAAP/////+//7//v/+//7//v//////AAAAAAAAAQABAAEAAQACAAEAAQABAAEAAAAAAAAAAAAAAP///////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  ].join(""),
};

const getTowersAudio = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!towersAudioContext) {
    towersAudioContext = new AudioContextClass();
  }

  if (!towersAudioMaster) {
    const compressor = towersAudioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-6, towersAudioContext.currentTime);
    compressor.knee.setValueAtTime(12, towersAudioContext.currentTime);
    compressor.ratio.setValueAtTime(3, towersAudioContext.currentTime);
    compressor.attack.setValueAtTime(0.005, towersAudioContext.currentTime);
    compressor.release.setValueAtTime(0.2, towersAudioContext.currentTime);

    const master = towersAudioContext.createGain();
    master.gain.setValueAtTime(1.12, towersAudioContext.currentTime);
    master.connect(compressor);
    compressor.connect(towersAudioContext.destination);
    towersAudioMaster = master;
  }

  if (towersAudioContext.state === "suspended") {
    towersAudioContext.resume().catch(() => {});
  }

  return towersAudioContext;
};

const loadTowersSound = async (name) => {
  const context = getTowersAudio();
  if (!context || !TOWERS_SOUND_DATA[name]) return null;
  if (towersAudioBuffers[name]) return towersAudioBuffers[name];
  if (towersAudioLoads[name]) return towersAudioLoads[name];

  towersAudioLoads[name] = fetch(TOWERS_SOUND_DATA[name])
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      towersAudioBuffers[name] = buffer;
      return buffer;
    })
    .catch(() => null);

  return towersAudioLoads[name];
};

const preloadTowersSounds = () => {
  void loadTowersSound("safe");
  void loadTowersSound("mine");
  void loadTowersSound("cashout");
};

const playTowersSound = async (name, volume = 1) => {
  try {
    const context = getTowersAudio();
    if (!context) return;

    const buffer = await loadTowersSound(name);
    if (!buffer) return;

    if (context.state === "suspended") {
      await context.resume();
    }

    const source = context.createBufferSource();
    const gain = context.createGain();

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), context.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + buffer.duration);

    source.buffer = buffer;
    source.connect(gain);
    gain.connect(towersAudioMaster || context.destination);
    source.start();
  } catch {
    // Sound is non-critical and must never interrupt gameplay.
  }
};

// Comfortable levels: distinct sounds without the harsh clipping of the previous version.
const playTowerTileSound = () => playTowersSound("safe", 1.00);
const playTowerTrapSound = () => playTowersSound("mine", 1.04);
const playTowerCashoutSound = () => playTowersSound("cashout", 0.96);

// Plinko sound effects are synthesized locally so every peg hit can have a
// precise, lightweight click without loading another external audio asset.
let plinkoAudioContext = null;
let plinkoAudioMaster = null;
let plinkoLastSoundAt = 0;

const getPlinkoAudio = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!plinkoAudioContext) {
      plinkoAudioContext =
        new AudioContextClass();
    }

    if (!plinkoAudioMaster) {
      const compressor =
        plinkoAudioContext.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(
        -10,
        plinkoAudioContext.currentTime
      );
      compressor.knee.setValueAtTime(
        10,
        plinkoAudioContext.currentTime
      );
      compressor.ratio.setValueAtTime(
        3,
        plinkoAudioContext.currentTime
      );
      compressor.attack.setValueAtTime(
        0.003,
        plinkoAudioContext.currentTime
      );
      compressor.release.setValueAtTime(
        0.15,
        plinkoAudioContext.currentTime
      );

      const master =
        plinkoAudioContext.createGain();

      master.gain.setValueAtTime(
        0.42,
        plinkoAudioContext.currentTime
      );

      master.connect(
        compressor
      );
      compressor.connect(
        plinkoAudioContext.destination
      );

      plinkoAudioMaster =
        master;
    }

    if (
      plinkoAudioContext.state ===
      "suspended"
    ) {
      plinkoAudioContext.resume().catch(
        () => {}
      );
    }

    return plinkoAudioContext;
  } catch {
    return null;
  }
};

const playPlinkoTone = (
  frequency,
  duration,
  volume,
  type = "sine"
) => {
  try {
    const context =
      getPlinkoAudio();

    if (!context) return;

    const now =
      context.currentTime;

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type =
      type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(
        0.0001,
        volume
      ),
      now + 0.006
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(
      gain
    );
    gain.connect(
      plinkoAudioMaster ||
        context.destination
    );

    oscillator.start(
      now
    );
    oscillator.stop(
      now + duration + 0.01
    );
  } catch {
    // Sound must never interrupt gameplay.
  }
};

const playPlinkoDropSound = () => {
  plinkoLastSoundAt =
    performance.now();

  // Slightly louder drop cue, while leaving peg-hit and landing
  // sounds at their existing levels.
  playPlinkoTone(
    260,
    0.055,
    0.115,
    "triangle"
  );

  window.setTimeout(
    () =>
      playPlinkoTone(
        330,
        0.065,
        0.085,
        "sine"
      ),
    24
  );
};

const playPlinkoPegSound = (
  rowIndex = 0
) => {
  const now =
    performance.now();

  // Prevent an over-loud burst when several spam-dropped balls hit pegs
  // during the same animation frame.
  if (
    now -
      plinkoLastSoundAt <
    24
  ) {
    return;
  }

  plinkoLastSoundAt =
    now;

  const pitch =
    360 +
    (
      Math.min(
        15,
        Math.max(
          0,
          Number(rowIndex) ||
            0
        )
      ) *
      12
    );

  playPlinkoTone(
    pitch,
    0.038,
    0.028,
    "triangle"
  );
};

const playPlinkoLandingSound = (
  didWin
) => {
  plinkoLastSoundAt =
    performance.now();

  if (
    didWin
  ) {
    playPlinkoTone(
      680,
      0.09,
      0.06,
      "sine"
    );

    window.setTimeout(
      () =>
        playPlinkoTone(
          900,
          0.16,
          0.05,
          "sine"
        ),
      55
    );

    return;
  }

  playPlinkoTone(
    210,
    0.11,
    0.045,
    "triangle"
  );
};


/* =========================================================
   CASEX CHICKEN ROAD — PROCEDURAL SOUND FX
   No external audio files required.
========================================================= */

let chickenAudioContext = null;
let chickenAudioMaster = null;

const getChickenAudio = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!chickenAudioContext) {
      chickenAudioContext = new AudioContextClass();
    }

    if (!chickenAudioMaster) {
      const compressor =
        chickenAudioContext.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(
        -8,
        chickenAudioContext.currentTime
      );
      compressor.knee.setValueAtTime(
        10,
        chickenAudioContext.currentTime
      );
      compressor.ratio.setValueAtTime(
        4,
        chickenAudioContext.currentTime
      );
      compressor.attack.setValueAtTime(
        0.004,
        chickenAudioContext.currentTime
      );
      compressor.release.setValueAtTime(
        0.16,
        chickenAudioContext.currentTime
      );

      const master =
        chickenAudioContext.createGain();

      master.gain.setValueAtTime(
        1.05,
        chickenAudioContext.currentTime
      );

      master.connect(compressor);
      compressor.connect(
        chickenAudioContext.destination
      );
      chickenAudioMaster = master;
    }

    if (
      chickenAudioContext.state ===
      "suspended"
    ) {
      chickenAudioContext.resume().catch(() => {});
    }

    return chickenAudioContext;
  } catch {
    return null;
  }
};

const chickenTone = (
  frequency,
  duration,
  volume,
  type = "sine",
  startOffset = 0
) => {
  try {
    const context =
      getChickenAudio();

    if (!context) return;

    const now =
      context.currentTime +
      Math.max(
        0,
        Number(startOffset) || 0
      );

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(
        0.0001,
        volume
      ),
      now + 0.008
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + Math.max(
        0.025,
        duration
      )
    );

    oscillator.connect(gain);
    gain.connect(
      chickenAudioMaster ||
      context.destination
    );

    oscillator.start(now);
    oscillator.stop(
      now +
      Math.max(
        0.035,
        duration
      ) +
      0.02
    );
  } catch {
    // Sound must never interrupt gameplay.
  }
};

const chickenNoiseBurst = (
  duration,
  volume,
  startOffset = 0
) => {
  try {
    const context =
      getChickenAudio();

    if (!context) return;

    const length = Math.max(
      1,
      Math.floor(
        context.sampleRate *
        duration
      )
    );

    const buffer =
      context.createBuffer(
        1,
        length,
        context.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (
      let index = 0;
      index < length;
      index += 1
    ) {
      const fade =
        1 -
        index /
          length;

      data[index] =
        (
          Math.random() *
          2 -
          1
        ) *
        fade;
    }

    const source =
      context.createBufferSource();

    const filter =
      context.createBiquadFilter();

    const gain =
      context.createGain();

    const now =
      context.currentTime +
      Math.max(
        0,
        Number(startOffset) || 0
      );

    filter.type =
      "lowpass";

    filter.frequency.setValueAtTime(
      1500,
      now
    );

    source.buffer = buffer;

    gain.gain.setValueAtTime(
      Math.max(
        0.0001,
        volume
      ),
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now +
        Math.max(
          0.02,
          duration
        )
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(
      chickenAudioMaster ||
      context.destination
    );

    source.start(now);
    source.stop(
      now +
      Math.max(
        0.025,
        duration
      ) +
      0.01
    );
  } catch {
    // Sound must never interrupt gameplay.
  }
};

const playChickenCrossSound = () => {
  chickenTone(
    520,
    0.085,
    0.075,
    "triangle"
  );

  chickenTone(
    720,
    0.115,
    0.06,
    "sine",
    0.045
  );
};

const playChickenHitSound = () => {
  chickenNoiseBurst(
    0.14,
    0.16
  );

  chickenTone(
    145,
    0.17,
    0.11,
    "sawtooth"
  );

  chickenTone(
    82,
    0.23,
    0.085,
    "triangle",
    0.035
  );
};

const playChickenCashoutSound = () => {
  chickenTone(
    520,
    0.09,
    0.075,
    "sine"
  );

  chickenTone(
    660,
    0.105,
    0.075,
    "sine",
    0.055
  );

  chickenTone(
    880,
    0.18,
    0.085,
    "sine",
    0.12
  );
};

const GAMES = {
  mines: {
    name: "Mines",
    subtitle: "Uncover tiles, avoid the mines. The further you go, the higher the reward.",
    icon: "💣",
    accent: "purple",
  },
  towers: {
    name: "Towers",
    subtitle: "Climb higher. Pick the safe tile.",
    icon: "🎯",
    accent: "purple",
  },
  plinko: {
    name: "Plinko",
    subtitle: "Drop the ball. Chase the multiplier.",
    icon: "🔺",
    accent: "pink",
  },
  chicken: {
    name: "Chicken Road",
    subtitle: "Cross the road. Cash out before you get caught.",
    icon: "🐔",
    accent: "gold",
  },
  coinflip: {
    name: "Coinflip",
    subtitle: "Pick your side. Call the flip.",
    icon: "🪙",
    accent: "green",
  },
};

const TOWERS_HOUSE_EDGE = 0.05;

const TOWERS_DIFFICULTIES = {
  easy: {
    label: "Easy",
    safe: 3,
    traps: 1,
    columns: 4,
  },
  medium: {
    label: "Medium",
    safe: 2,
    traps: 1,
    columns: 3,
  },
  hard: {
    label: "Hard",
    safe: 1,
    traps: 1,
    columns: 2,
  },
  expert: {
    label: "Expert",
    safe: 1,
    traps: 2,
    columns: 3,
  },
  master: {
    label: "Master",
    safe: 1,
    traps: 3,
    columns: 4,
  },
};

const TOWERS_ROWS = 10;

function towersMultiplierForStep(floor, difficulty = "easy") {
  if (floor <= 0) return 1;

  const config =
    TOWERS_DIFFICULTIES[difficulty] ||
    TOWERS_DIFFICULTIES.easy;

  const safeProbability = config.safe / config.columns;

  return Math.max(
    1,
    TOWERS_HOUSE_EDGE > 0
      ? (1 - TOWERS_HOUSE_EDGE) /
        Math.pow(safeProbability, floor)
      : 1 / Math.pow(safeProbability, floor)
  );
}

const PLINKO_ROWS_MIN = 8;
const PLINKO_ROWS_MAX = 16;
const PLINKO_HOUSE_EDGE = 0.05;

const PLINKO_RISK_CONFIG = {
  low: { curve: 2.0 },
  medium: { curve: 2.6 },
  high: { curve: 3.2 },
};

const PLINKO_MEDIUM_REFERENCE_MULTIPLIERS = {
  8: [
    13,
    3,
    1.3,
    0.7,
    0.4,
    0.7,
    1.3,
    3,
    13,
  ],
  9: [
    18,
    4,
    1.7,
    0.9,
    0.5,
    0.5,
    0.9,
    1.7,
    4,
    18,
  ],
  10: [
    22,
    5,
    2,
    1.4,
    0.6,
    0.4,
    0.6,
    1.4,
    2,
    5,
    22,
  ],
  11: [
    24,
    6,
    3,
    1.8,
    0.7,
    0.5,
    0.5,
    0.7,
    1.8,
    3,
    6,
    24,
  ],
  12: [
    33,
    11,
    4,
    2,
    1.1,
    0.6,
    0.3,
    0.6,
    1.1,
    2,
    4,
    11,
    33,
  ],
  13: [
    43,
    13,
    6,
    3,
    1.3,
    0.7,
    0.4,
    0.4,
    0.7,
    1.3,
    3,
    6,
    13,
    43,
  ],
  14: [
    58,
    15,
    7,
    4,
    1.9,
    1,
    0.5,
    0.2,
    0.5,
    1,
    1.9,
    4,
    7,
    15,
    58,
  ],
  15: [
    88,
    18,
    11,
    5,
    3,
    1.3,
    0.5,
    0.3,
    0.3,
    0.5,
    1.3,
    3,
    5,
    11,
    18,
    88,
  ],
  16: [
    110,
    41,
    10,
    5,
    3,
    1.5,
    1,
    0.5,
    0.3,
    0.5,
    1,
    1.5,
    3,
    5,
    10,
    41,
    110,
  ],
};

const PLINKO_LOW_REFERENCE_MULTIPLIERS = {
  8: [
    5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6,
  ],
  9: [
    5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6,
  ],
  10: [
    8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9,
  ],
  11: [
    8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4,
  ],
  12: [
    10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10,
  ],
  13: [
    8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1,
  ],
  14: [
    7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1,
  ],
  15: [
    15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15,
  ],
  16: [
    16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16,
  ],
};

const PLINKO_HIGH_REFERENCE_MULTIPLIERS = {
  8: [
    29,
    4,
    1.5,
    0.3,
    0.2,
    0.3,
    1.5,
    4,
    29,
  ],
  9: [
    43,
    7,
    2,
    0.6,
    0.2,
    0.2,
    0.6,
    2,
    7,
    43,
  ],
  10: [
    76,
    10,
    3,
    0.9,
    0.3,
    0.2,
    0.3,
    0.9,
    3,
    10,
    76,
  ],
  11: [
    120,
    14,
    5.2,
    1.4,
    0.4,
    0.2,
    0.2,
    0.4,
    1.4,
    5.2,
    14,
    120,
  ],
  12: [
    170,
    24,
    8.1,
    2,
    0.7,
    0.2,
    0.2,
    0.2,
    0.7,
    2,
    8.1,
    24,
    170,
  ],
  13: [
    260,
    37,
    11,
    4,
    1,
    0.2,
    0.2,
    0.2,
    0.2,
    1,
    4,
    11,
    37,
    260,
  ],
  14: [
    420,
    56,
    18,
    5,
    1.9,
    0.3,
    0.2,
    0.2,
    0.2,
    0.3,
    1.9,
    5,
    18,
    56,
    420,
  ],
  15: [
    620,
    83,
    27,
    8,
    3,
    0.5,
    0.2,
    0.2,
    0.2,
    0.2,
    0.5,
    3,
    8,
    27,
    83,
    620,
  ],
  16: [
    1000,
    130,
    26,
    9,
    4,
    2,
    0.2,
    0.2,
    0.2,
    0.2,
    0.2,
    2,
    4,
    9,
    26,
    130,
    1000,
  ],
};

function plinkoBinomialProbability(rows, slot) {
  if (slot < 0 || slot > rows) return 0;
  let coefficient = 1;
  for (let i = 1; i <= slot; i += 1) {
    coefficient =
      (coefficient * (rows - slot + i)) / i;
  }
  return coefficient / 2 ** rows;
}

function getPlinkoSlotMultipliers(rows, risk) {
  const normalizedRisk =
    String(risk).toLowerCase();

  if (
    normalizedRisk === "medium" &&
    PLINKO_MEDIUM_REFERENCE_MULTIPLIERS[rows]
  ) {
    return PLINKO_MEDIUM_REFERENCE_MULTIPLIERS[rows].map(
      (value) => Number(value)
    );
  }

  if (
    normalizedRisk === "high" &&
    PLINKO_HIGH_REFERENCE_MULTIPLIERS[rows]
  ) {
    return PLINKO_HIGH_REFERENCE_MULTIPLIERS[rows].map(
      (value) => Number(value)
    );
  }

  if (
    normalizedRisk === "low" &&
    PLINKO_LOW_REFERENCE_MULTIPLIERS[rows]
  ) {
    return PLINKO_LOW_REFERENCE_MULTIPLIERS[rows].map(
      (value) => Number(value)
    );
  }

  const config =
    PLINKO_RISK_CONFIG[normalizedRisk] ||
    PLINKO_RISK_CONFIG.medium;

  const raw = Array.from(
    { length: rows + 1 },
    (_, slot) => {
      const distance =
        Math.abs(slot - rows / 2) / (rows / 2);

      return 0.5 * Math.exp(config.curve * distance);
    }
  );

  let expectation = 0;

  for (let slot = 0; slot <= rows; slot += 1) {
    expectation +=
      raw[slot] *
      plinkoBinomialProbability(rows, slot);
  }

  const scale = expectation > 0
    ? PLINKO_HOUSE_EDGE === 0
      ? 1 / expectation
      : (1 - PLINKO_HOUSE_EDGE) / expectation
    : 1;

  return raw.map((value) =>
    Number((value * scale).toFixed(6))
  );
}

function plinkoRandomSlot(rows) {
  let slot = 0;

  for (let step = 0; step < rows; step += 1) {
    if (Math.random() >= 0.5) slot += 1;
  }

  return slot;
}

function buildPlinkoBallPath(
  rows,
  slotIndex,
  serverPath = [],
  boardMetrics = {}
) {
  const totalRows = Math.max(
    PLINKO_ROWS_MIN,
    Math.min(
      PLINKO_ROWS_MAX,
      Number(rows) || PLINKO_ROWS_MIN
    )
  );

  const targetSlot = Math.max(
    0,
    Math.min(
      totalRows,
      Number(slotIndex) || 0
    )
  );

  const suppliedDirections =
    Array.isArray(serverPath)
      ? serverPath
          .map((value) =>
            String(value).toUpperCase() === "R"
              ? 1
              : -1
          )
          .slice(0, totalRows)
      : [];

  const suppliedRightMoves =
    suppliedDirections.reduce(
      (count, direction) =>
        count +
        (direction === 1 ? 1 : 0),
      0
    );

  const directions =
    suppliedDirections.length === totalRows &&
    suppliedRightMoves === targetSlot
      ? suppliedDirections
      : (() => {
          const generated = [
            ...Array.from(
              { length: targetSlot },
              () => 1
            ),
            ...Array.from(
              {
                length:
                  totalRows -
                  targetSlot,
              },
              () => -1
            ),
          ];

          for (
            let i =
              generated.length - 1;
            i > 0;
            i -= 1
          ) {
            const j = Math.floor(
              Math.random() *
                (i + 1)
            );

            [
              generated[i],
              generated[j],
            ] = [
              generated[j],
              generated[i],
            ];
          }

          return generated;
        })();

  const boardWidth =
    Math.max(
      420,
      Number(boardMetrics.width) ||
        720
    );

  const boardHeight =
    Math.max(
      360,
      Number(boardMetrics.height) ||
        540
    );

  // These values mirror the larger desktop Plinko chamber. The peg pitch
  // is intentionally wider so the ball has visible room to travel between
  // contacts, and the exact same pitch is used by the multiplier rail.
  const leftInset = 42;
  const rightInset = 42;
  const topInset = 36;
  const bottomInset = 58;
  const pegSize = 10;

  const measuredBoardWidth =
    Math.max(
      420,
      Number(boardMetrics.width) ||
        900
    );

  const preferredPegPitch =
    Math.max(
      48,
      Math.min(
        56,
        measuredBoardWidth * 0.060
      )
    );

  // The widest row contains totalRows + 2 pegs, which means
  // totalRows + 1 horizontal intervals. Cap the pitch so the complete
  // grid always fits inside the chamber.
  const maxFittingPegPitch =
    Math.max(
      24,
      (
        measuredBoardWidth -
        leftInset -
        rightInset -
        4
      ) /
        (
          totalRows +
          1
        )
    );

  const pegPitch =
    Math.min(
      preferredPegPitch,
      maxFittingPegPitch
    );

  const pegGap =
    Math.max(
      16,
      pegPitch -
        pegSize
    );

  const usableWidth =
    boardWidth -
    leftInset -
    rightInset;

  const usableHeight =
    boardHeight -
    topInset -
    bottomInset;

  // Keep the peg field vertically spacious at low row counts while
  // compressing gracefully as the user moves toward 16 rows.
  const preferredVerticalPitch =
    Math.max(
      40,
      Math.min(
        68,
        520 /
          Math.max(
            1,
            totalRows - 1
          )
      )
    );

  const actualVerticalPitch =
    Math.min(
      preferredVerticalPitch,
      Math.max(
        30,
        usableHeight /
          Math.max(
            1,
            totalRows - 1
          )
      )
    );

  const rowSpan =
    actualVerticalPitch *
    Math.max(
      0,
      totalRows - 1
    );

  const verticalStart =
    topInset +
    Math.max(
      0,
      (usableHeight - rowSpan) / 2
    );

  const pegX = (
    count,
    index
  ) => {
    const rowWidth =
      Math.max(
        0,
        (
          count -
          1
        ) *
          pegPitch
      );

    const centerOffset =
      (
        index -
        (
          count -
          1
        ) /
          2
      ) *
      pegPitch;

    return (
      (
        boardWidth / 2 +
        centerOffset
      ) /
        boardWidth
    ) *
      100;
  };

  const rowY = (
    rowIndex
  ) => {
    if (
      totalRows <=
      1
    ) {
      return (
        (
          topInset +
          pegSize / 2
        ) /
          boardHeight
      ) *
        100;
    }

    const centerY =
      verticalStart +
      pegSize / 2 +
      rowIndex *
        actualVerticalPitch;

    return (
      centerY /
        boardHeight
    ) *
      100;
  };

  // The multiplier rail is outside the board, but spans the same content
  // width. Account for its 5px grid gap so the landing point lines up
  // visually with the actual multiplier box.
  const slotCount =
    totalRows + 1;

  const slotGap =
    Number.isFinite(
      Number(boardMetrics.slotGap)
    )
      ? Number(boardMetrics.slotGap)
      : 2;

  const slotRailWidth =
    Number.isFinite(
      Number(boardMetrics.slotRailWidth)
    )
      ? Number(boardMetrics.slotRailWidth)
      : Math.max(
          pegPitch,
          slotCount * pegPitch - slotGap
        );

  // Each slot is exactly one peg pitch apart. The slot rail is centred and
  // each reward sits between adjacent pegs on the final row.
  const slotCellWidth =
    Math.max(
      1,
      (
        slotRailWidth -
        slotGap *
          (slotCount - 1)
      ) /
      slotCount
    );

  const railLeft =
    (
      boardWidth -
      slotRailWidth
    ) /
    2;

  const targetSlotCenterPx =
    railLeft +
    slotCellWidth / 2 +
    targetSlot *
      (
        slotCellWidth +
        slotGap
      );

  const targetX =
    (
      targetSlotCenterPx /
      boardWidth
    ) *
    100;

  const topY = rowY(0);
  const bottomY = rowY(
    totalRows - 1
  );

  // Start just above the first peg.
  const points = [
    {
      x: 50,
      y: Math.max(
        2.5,
        topY - 8
      ),
    },
    {
      x: pegX(
        3,
        1
      ),
      y: topY,
    },
  ];

  let pegIndex = 1;

  // One path segment per real peg-to-peg bounce.
  // Starting at the centre peg in the 3-peg row means the final
  // slot index is exactly the number of server-selected R moves.
  for (
    let step = 0;
    step <
      totalRows - 1;
    step += 1
  ) {
    const currentCount =
      step + 3;

    const nextCount =
      currentCount + 1;

    const currentX =
      pegX(
        currentCount,
        pegIndex
      );

    const nextIndex =
      pegIndex +
      (
        directions[step] ===
        1
          ? 1
          : 0
      );

    const nextX =
      pegX(
        nextCount,
        nextIndex
      );

    const nextY =
      rowY(
        step + 1
      );

    points.push({
      x: nextX,
      y: nextY,
    });

    pegIndex =
      nextIndex;
  }

  // Drop out of the final peg row and visibly enter the matching reward
  // pocket. The ball layer intentionally permits overflow so the player can
  // see the final descent rather than having the ball disappear at the board edge.
  const pocketY =
    Math.min(
      112,
      (
        boardHeight +
        14 +
        24
      ) /
        boardHeight *
        100
    );

  points.push({
    x: targetX,
    y: Math.min(
      99.5,
      bottomY + 7
    ),
  });

  points.push({
    x: targetX,
    y: pocketY,
  });

  return {
    points,
    landingX:
      targetX,
    landingY:
      pocketY,
  };
}

function readJson(response) {
  return response.json().catch(() => ({}));
}


const ORIGINALS_VERTICAL_POSITION_CSS = `
/* =========================================================
   CASEX ORIGINALS — DEFINITIVE VERTICAL POSITIONING
   Global CASEX navigation occupies the top of the viewport.
   The game switcher sits below it; game content starts below
   the switcher with no overlap.
========================================================= */

.original-games-overlay .original-games-game-tabs{
  position:fixed !important;
  top:86px !important;
  left:20px !important;
  z-index:999999 !important;
  pointer-events:auto !important;
}

.original-games-overlay .original-games-shell{
  box-sizing:border-box !important;
}

/* Towers: small downward adjustment so the game switcher
   never overlaps the Towers title/content. */
.original-games-overlay .original-games-page.original-games-purple .original-games-shell{
  padding-top:132px !important;
}

/* Plinko: substantially larger offset because its unified card
   begins with the title immediately at the top of the shell. */
.original-games-overlay .original-games-page.original-games-pink .original-games-shell{
  padding-top:156px !important;
}

/* Make sure the shell itself cannot be visually pulled under the
   global navigation by margins/transforms from earlier styles. */
.original-games-overlay .original-games-page.original-games-purple .original-games-shell,
.original-games-overlay .original-games-page.original-games-pink .original-games-shell{
  margin-top:0 !important;
  transform:none !important;
}

.original-games-overlay .original-games-page.original-games-gold .original-games-shell,
.original-games-overlay .original-games-page.original-games-chicken .original-games-shell{
  padding-top:124px !important;
}

@media(max-width:1200px){
  .original-games-overlay .original-games-page.original-games-gold .original-games-shell,
  .original-games-overlay .original-games-page.original-games-chicken .original-games-shell{
    padding-top:108px !important;
  }

  .original-games-overlay .original-games-page.original-games-purple .original-games-shell{
    padding-top:112px !important;
  }

  .original-games-overlay .original-games-page.original-games-pink .original-games-shell{
    padding-top:136px !important;
  }
}

@media(max-width:700px){
  .original-games-overlay .original-games-game-tabs{
    top:74px !important;
    left:12px !important;
  }

  .original-games-overlay .original-games-page.original-games-purple .original-games-shell{
    padding-top:92px !important;
  }

  .original-games-overlay .original-games-page.original-games-pink .original-games-shell{
    padding-top:112px !important;
  }

  .original-games-overlay .original-games-page.original-games-gold .original-games-shell,
  .original-games-overlay .original-games-page.original-games-chicken .original-games-shell{
    padding-top:96px !important;
  }
}

/* =========================================================
   CASEX ORIGINALS — MINES INTEGRATION
   Mines now uses the same outer Originals shell and global
   game switcher as Towers, Plinko, Chicken Road and Coinflip.
========================================================= */
.original-games-overlay .original-games-page.original-games-mines .original-games-shell{
  padding-top:124px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-integrated{
  width:100%;
}

.original-games-overlay .original-games-page.original-games-mines .mines-layout{
  display:grid;
  grid-template-columns:300px minmax(0,1fr);
  gap:20px;
  padding-top:0;
  align-items:start;
}

.original-games-overlay .original-games-page.original-games-mines .mines-controls-card{
  width:100%;
  box-sizing:border-box;
  padding:18px;
  border-color:rgba(165,124,255,.28);
  box-shadow:0 22px 60px rgba(0,0,0,.34),0 0 34px rgba(126,78,222,.06);
}

.original-games-overlay .original-games-page.original-games-mines .mines-main-column{
  width:100%;
  min-width:0;
  align-items:center;
}

.original-games-overlay .original-games-page.original-games-mines .mines-board{
  width:min(100%,640px);
  max-width:640px;
  padding:16px;
  box-sizing:border-box;
  border-color:rgba(165,124,255,.24);
  border-radius:20px;
  box-shadow:0 24px 70px rgba(0,0,0,.36),0 0 36px rgba(126,78,222,.06);
}

.original-games-overlay .original-games-page.original-games-mines .mines-stats-bar{
  width:min(100%,640px);
  max-width:640px;
  box-sizing:border-box;
}

.original-games-overlay .original-games-page.original-games-mines .mines-recent-card{
  margin-top:20px;
  border-color:rgba(165,124,255,.20);
}

.original-games-overlay .original-games-page.original-games-mines .mines-start-button{
  background:linear-gradient(135deg,#8d5cf6,#a568ff);
  box-shadow:0 12px 30px rgba(126,78,222,.24);
}

.original-games-overlay .original-games-page.original-games-mines .mines-cashout-button{
  background:linear-gradient(135deg,#21c968,#159447);
}

@media(max-width:1100px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    padding-top:112px !important;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-layout{
    grid-template-columns:285px minmax(0,1fr);
    gap:16px;
  }
}

@media(max-width:900px){
  .original-games-overlay .original-games-page.original-games-mines .mines-layout{
    grid-template-columns:1fr;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-controls-card{
    order:2;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-main-column{
    order:1;
  }
}

@media(max-width:700px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    padding-top:92px !important;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-board{
    padding:10px;
    gap:6px;
    border-radius:16px;
  }
}

/* =========================================================
   CASEX ORIGINALS — MINES FIT / COMPACT DESKTOP LAYOUT
   Keep the complete Mines experience inside the same viewport
   proportions as the other Originals games.
========================================================= */
.original-games-overlay .original-games-page.original-games-mines .original-games-shell{
  padding-top:110px !important;
  padding-bottom:28px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-header{
  margin-bottom:14px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-layout{
  grid-template-columns:300px minmax(0,1fr) !important;
  gap:16px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-main-column{
  gap:10px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-board{
  width:min(100%,520px) !important;
  max-width:520px !important;
  padding:14px !important;
  gap:8px !important;
  border-radius:18px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-stats-bar{
  width:min(100%,520px) !important;
  max-width:520px !important;
  padding:12px 8px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-stats-bar strong{
  font-size:19px !important;
  margin-top:3px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-odds-note{
  margin-top:-2px !important;
}

@media(max-width:1100px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    padding-top:104px !important;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-layout{
    grid-template-columns:280px minmax(0,1fr) !important;
    gap:14px !important;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-board,
  .original-games-overlay .original-games-page.original-games-mines .mines-stats-bar{
    max-width:500px !important;
  }
}

@media(max-width:900px){
  .original-games-overlay .original-games-page.original-games-mines .mines-layout{
    grid-template-columns:1fr !important;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-board,
  .original-games-overlay .original-games-page.original-games-mines .mines-stats-bar{
    max-width:520px !important;
  }
}

@media(max-width:700px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    padding-top:92px !important;
    padding-bottom:24px !important;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-board{
    padding:10px !important;
    gap:6px !important;
    border-radius:16px !important;
  }
  .original-games-overlay .original-games-page.original-games-mines .mines-stats-bar{
    padding:10px 6px !important;
  }
}
/* =========================================================
   CASEX ORIGINALS — MINES FIT / MY BETS RESULT VIEW
========================================================= */
.original-games-overlay .original-games-page.original-games-mines .original-games-shell{
  padding-top:148px !important;
  padding-bottom:22px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-header{
  margin-bottom:12px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-layout{
  grid-template-columns:300px minmax(0,1fr) !important;
  gap:16px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-board{
  width:min(100%,480px) !important;
  max-width:480px !important;
  padding:12px !important;
  gap:7px !important;
  border-radius:18px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-stats-bar{
  width:min(100%,480px) !important;
  max-width:480px !important;
  padding:10px 8px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-stats-bar strong{
  font-size:18px !important;
  margin-top:3px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-odds-note{
  margin-top:-3px !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-recent-card{
  margin-top:18px !important;
}

.original-games-overlay .mines-view-bet-button{
  min-width:52px;
  height:27px;
  padding:0 9px;
  border:1px solid rgba(165,124,255,.38);
  border-radius:8px;
  background:rgba(141,92,246,.08);
  color:#c7a8ff;
  font-size:8px;
  font-weight:950;
  letter-spacing:.8px;
  cursor:pointer;
  transition:.16s ease;
}
.original-games-overlay .mines-view-bet-button:hover{
  border-color:rgba(180,140,255,.82);
  background:rgba(141,92,246,.16);
  color:#fff;
  transform:translateY(-1px);
}

.original-games-overlay .mines-result-modal-backdrop{
  position:fixed;
  inset:0;
  z-index:2000000;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  background:rgba(3,4,9,.76);
  backdrop-filter:blur(9px);
}

.original-games-overlay .mines-result-modal{
  width:min(520px,calc(100vw - 32px));
  max-height:min(86vh,760px);
  overflow:auto;
  padding:20px;
  border:1px solid rgba(165,124,255,.28);
  border-radius:18px;
  background:linear-gradient(145deg,#0f111b,#080a11);
  box-shadow:0 30px 90px rgba(0,0,0,.58),0 0 44px rgba(126,78,222,.12);
}

.original-games-overlay .mines-result-modal-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  margin-bottom:14px;
}

.original-games-overlay .mines-result-modal-head h2{
  margin:5px 0 0;
  font-size:24px;
  letter-spacing:-.7px;
}

.original-games-overlay .mines-result-modal-close{
  width:32px;
  height:32px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:9px;
  background:#151722;
  color:#9d97a8;
  font-size:20px;
  cursor:pointer;
}

.original-games-overlay .mines-result-summary{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  border:1px solid #20232d;
  border-radius:12px;
  background:rgba(255,255,255,.02);
  margin-bottom:14px;
}

.original-games-overlay .mines-result-summary>div{
  padding:12px 10px;
  text-align:center;
  border-right:1px solid #20232d;
}
.original-games-overlay .mines-result-summary>div:last-child{border-right:0}

.original-games-overlay .mines-result-summary span{
  display:block;
  color:#777182;
  font-size:8px;
  font-weight:850;
  letter-spacing:.8px;
}

.original-games-overlay .mines-result-summary strong{
  display:block;
  margin-top:4px;
  color:#fff;
  font-size:15px;
  font-weight:950;
}

.original-games-overlay .mines-result-summary>div:nth-child(2) strong{color:#b18cff}
.original-games-overlay .mines-result-summary>div:nth-child(3) strong{color:#4ade80}

.original-games-overlay .mines-result-board{
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:7px;
  width:min(100%,420px);
  aspect-ratio:1;
  margin:0 auto 14px;
  padding:10px;
  box-sizing:border-box;
  border:1px solid rgba(165,124,255,.2);
  border-radius:14px;
  background:radial-gradient(circle at 50% 0,#151229,#0a0b11 56%,#08090d);
}

.original-games-overlay .mines-result-board-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.original-games-overlay .mines-result-board-7{
  grid-template-columns:repeat(7,minmax(0,1fr));
  gap:5px;
}

.original-games-overlay .mines-result-tile{
  min-width:0;
  min-height:0;
  display:grid;
  place-items:center;
  border:1px solid rgba(154,133,204,.26);
  border-radius:8px;
  background:#141722;
  color:transparent;
  font-size:16px;
  font-weight:950;
}

.original-games-overlay .mines-result-tile.safe{
  color:#a88cff;
  background:linear-gradient(145deg,#24194a,#141021);
  border-color:rgba(168,124,255,.48);
}

.original-games-overlay .mines-result-tile.mine{
  color:#ff7777;
  background:linear-gradient(145deg,#3b151f,#1b0d13);
  border-color:rgba(255,102,119,.55);
}

.original-games-overlay .mines-result-tile.hidden{opacity:.55}

.original-games-overlay .mines-result-modal-footer{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:14px;
  color:#747080;
  font-size:9px;
}

.original-games-overlay .mines-result-modal-done{
  min-width:72px;
  height:34px;
  border:0;
  border-radius:9px;
  background:linear-gradient(135deg,#8d5cf6,#a568ff);
  color:#fff;
  font-size:9px;
  font-weight:950;
  letter-spacing:.7px;
  cursor:pointer;
}

@media(max-width:1100px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    padding-top:136px !important;
  }
}

@media(max-width:700px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    padding-top:92px !important;
  }
  .original-games-overlay .mines-result-modal-backdrop{padding:12px}
  .original-games-overlay .mines-result-modal{padding:16px;border-radius:15px}
  .original-games-overlay .mines-result-board{
    width:100%;
    max-width:360px;
  }
  .original-games-overlay .mines-result-modal-footer{
    align-items:flex-start;
    flex-direction:column;
  }
}

/* =========================================================
   CASEX ORIGINALS — MINES SINGLE EXPERIENCE BOX
   Match the unified framed presentation used by Coinflip.
========================================================= */
.original-games-page.original-games-mines .original-games-shell{
  width:min(1440px,calc(100% - 36px)) !important;
  margin:122px auto 0 !important;
  padding:22px 22px 28px !important;
  box-sizing:border-box !important;
  border:1px solid rgba(134,92,255,.36) !important;
  border-radius:22px !important;
  background:
    radial-gradient(circle at 78% 25%,rgba(124,66,255,.10),transparent 34%),
    linear-gradient(180deg,rgba(12,13,28,.99),rgba(6,8,17,.99)) !important;
  box-shadow:
    0 30px 90px rgba(0,0,0,.40),
    inset 0 1px 0 rgba(255,255,255,.025) !important;
}

.original-games-page.original-games-mines .original-games-heading{
  margin-bottom:16px !important;
}

.original-games-page.original-games-mines .mines-integrated{
  width:100% !important;
}

.original-games-page.original-games-mines .mines-layout{
  gap:16px !important;
}

@media(max-width:1200px){
  .original-games-page.original-games-mines .original-games-shell{
    width:min(100%,calc(100% - 28px)) !important;
    margin-top:108px !important;
    padding:18px 16px 24px !important;
  }
}

@media(max-width:700px){
  .original-games-page.original-games-mines .original-games-shell{
    width:calc(100% - 18px) !important;
    margin-top:94px !important;
    padding:16px 12px 22px !important;
    border-radius:18px !important;
  }
}


/* =========================================================
   CASEX ORIGINALS — MINES FINAL COINFLIP-STYLE OUTER BOX
   The frame itself begins visibly above CASEX ORIGINAL.
   No oversized hidden top padding and no header underline.
========================================================= */

.original-games-overlay .original-games-page.original-games-mines .original-games-shell{
  width:min(1440px,calc(100% - 36px)) !important;
  margin:124px auto 0 !important;
  padding:20px 22px 28px !important;
  box-sizing:border-box !important;
  border:1px solid rgba(134,92,255,.36) !important;
  border-radius:22px !important;
  background:
    radial-gradient(circle at 78% 24%,rgba(124,66,255,.10),transparent 34%),
    linear-gradient(180deg,rgba(12,13,28,.99),rgba(6,8,17,.99)) !important;
  box-shadow:
    0 30px 90px rgba(0,0,0,.40),
    inset 0 1px 0 rgba(255,255,255,.025) !important;
}

.original-games-overlay .original-games-page.original-games-mines .original-games-heading{
  margin-bottom:20px !important;
  padding-bottom:0 !important;
  border-bottom:0 !important;
}

.original-games-overlay .original-games-page.original-games-mines .mines-integrated{
  width:100% !important;
}

@media(max-width:1200px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    width:min(100%,calc(100% - 28px)) !important;
    margin:108px auto 0 !important;
    padding:18px 16px 24px !important;
  }
}

@media(max-width:700px){
  .original-games-overlay .original-games-page.original-games-mines .original-games-shell{
    width:calc(100% - 18px) !important;
    margin:94px auto 0 !important;
    padding:16px 12px 22px !important;
    border-radius:18px !important;
  }
}

/* =========================================================
   CASEX MINES — MATCH THE SHARED MY BETS HISTORY
========================================================= */
.original-games-page.original-games-mines .mines-my-bets-card{
  width:100% !important;
  margin-top:18px !important;
  border:1px solid rgba(104,105,130,.24) !important;
  border-radius:18px !important;
  background:linear-gradient(160deg,rgba(13,16,24,.97),rgba(7,9,14,.98)) !important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 24px 60px rgba(0,0,0,.18) !important;
  overflow:hidden !important;
}
.original-games-page.original-games-mines .mines-my-bets-card .towers-history-tabs{
  min-height:58px !important;
  padding:10px 14px !important;
}
.original-games-page.original-games-mines .mines-my-bets-card .towers-history-tabs button{
  min-height:40px !important;
  padding:0 19px !important;
  font-size:13px !important;
  font-weight:950 !important;
}
.original-games-page.original-games-mines .mines-my-bets-card .towers-history-user-label{
  font-size:8px !important;
  letter-spacing:1.3px !important;
  padding:0 12px !important;
}
.original-games-page.original-games-mines .mines-my-bets-table{
  min-width:720px !important;
}
.original-games-page.original-games-mines .mines-my-bets-row{
  grid-template-columns:1.45fr 1.05fr 1fr 1fr 1.15fr !important;
  min-height:58px !important;
  padding:0 24px !important;
  font-size:10px !important;
}
.original-games-page.original-games-mines .mines-my-bets-row.towers-history-head{
  min-height:44px !important;
  font-size:8px !important;
  letter-spacing:.7px !important;
}
.original-games-page.original-games-mines .mines-my-bets-row .towers-history-game{
  font-size:11px !important;
}
.original-games-page.original-games-mines .mines-my-bets-row .towers-history-game b{
  width:30px !important;
  height:30px !important;
  font-size:13px !important;
}
.original-games-page.original-games-mines .mines-my-bets-row .towers-history-multiplier{
  font-size:11px !important;
  font-weight:1000 !important;
}
.original-games-page.original-games-mines .mines-my-bets-row .towers-history-payout{
  font-size:11px !important;
  font-weight:950 !important;
}
.original-games-page.original-games-mines .mines-my-bets-row .towers-view-result-btn{
  min-width:104px !important;
  min-height:36px !important;
  padding:0 15px !important;
  font-size:10px !important;
  font-weight:1000 !important;
}
@media(max-width:700px){
  .original-games-page.original-games-mines .mines-my-bets-card .towers-history-tabs{
    min-height:52px !important;
    padding:8px !important;
  }
  .original-games-page.original-games-mines .mines-my-bets-card .towers-history-tabs button{
    min-height:40px !important;
    padding:0 16px !important;
    font-size:13px !important;
  }
  .original-games-page.original-games-mines .mines-my-bets-row{
    min-height:54px !important;
    padding:0 14px !important;
    font-size:10px !important;
  }
  .original-games-page.original-games-mines .mines-my-bets-row.towers-history-head{
    min-height:42px !important;
    font-size:8px !important;
  }
  .original-games-page.original-games-mines .mines-my-bets-row .towers-history-game,
  .original-games-page.original-games-mines .mines-my-bets-row .towers-history-multiplier,
  .original-games-page.original-games-mines .mines-my-bets-row .towers-history-payout{
    font-size:10px !important;
  }
  .original-games-page.original-games-mines .mines-my-bets-row .towers-view-result-btn{
    min-width:88px !important;
    min-height:32px !important;
    font-size:9px !important;
  }
}

`;

function GameShell({ game, children, onClose, balance, message, error, hideHeading = false }) {
  const meta = GAMES[game];

  return (
    <div
      className={`original-games-page original-games-${meta.accent}${game === "towers" ? " original-games-towers-page" : ""}${game === "chicken" ? " original-games-chicken" : ""}${game === "coinflip" ? " original-games-coinflip" : game === "mines" ? " original-games-mines" : ""}`}
    >
      <style>{ORIGINALS_VERTICAL_POSITION_CSS}</style>
      <div className="original-games-shell">
        {!hideHeading && (
        <div className="original-games-heading">
          <div>
            <div className="eyebrow">CASEX ORIGINAL</div>
            <h1>{meta.name}</h1>
            <p>{meta.subtitle}</p>
          </div>
          <div className="original-games-live-pill">
            <i />
            LIVE
          </div>
        </div>
        )}

        {message && <div className="original-games-message">{message}</div>}
        {error && <div className="original-games-error">{error}</div>}

        {children}
      </div>
    </div>
  );
}

function BetBox({
  value,
  setValue,
  disabled,
  onBet,
  balance,
  maxBet = 100,
  label = "BET AMOUNT",
  button = "START GAME",
}) {
  const minBetCents = 10;
  const maxBetCents = Math.round(Number(maxBet) * 100);

  const setHalfBet = () => {
    if (disabled) return;
    const cents = parseAmountToCentsClient(value);
    if (cents == null) return;
    const nextCents = Math.max(minBetCents, Math.floor(cents / 2));
    setValue((Math.min(maxBetCents, nextCents) / 100).toFixed(2));
  };

  const setDoubleBet = () => {
    if (disabled) return;
    const cents = parseAmountToCentsClient(value);
    if (cents == null) return;
    const nextCents = Math.min(maxBetCents, cents * 2);
    setValue((nextCents / 100).toFixed(2));
  };

  const setMaxBet = () => {
    if (disabled) return;
    const balanceCents = Math.max(
      0,
      Math.floor(Number(balance || 0) * 100)
    );
    const nextCents = Math.min(maxBetCents, balanceCents);

    if (nextCents >= minBetCents) {
      setValue((nextCents / 100).toFixed(2));
    }
  };

  return (
    <div className="original-games-control-card">
      <div className="original-games-control-label">{label}</div>

      <div className="original-games-standard-bet-row">
        <div className="original-games-bet-input">
          <span>$</span>
          <input
            value={value}
            type="number"
            min="0.10"
            max={String(maxBet)}
            step="0.01"
            inputMode="decimal"
            onChange={(event) => setValue(event.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="original-games-standard-bet-shortcuts">
          <button type="button" onClick={setHalfBet} disabled={disabled}>
            1/2
          </button>
          <button type="button" onClick={setDoubleBet} disabled={disabled}>
            2X
          </button>
          <button type="button" onClick={setMaxBet} disabled={disabled}>
            Max
          </button>
        </div>
      </div>

      <button
        type="button"
        className="original-games-primary"
        onClick={onBet}
        disabled={disabled}
      >
        {button}
      </button>

      <div className="original-games-bet-limit-note">
        Minimum bet $0.10 • Maximum bet ${Number(maxBet).toFixed(2)}
      </div>
    </div>
  );
}


function OriginalGameHistory({ game, authUser, refreshKey = 0 }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlay, setSelectedPlay] = useState(null);

  const meta = GAMES[game] || GAMES.towers;
  const title = meta.name;

  useEffect(() => {
    if (!authUser) {
      setHistory([]);
      setSelectedPlay(null);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(
          `${API}/api/originals/${game}/history?limit=20`,
          { cache: "no-store" }
        );
        const data = await readJson(response);

        if (!cancelled && response.ok && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error(`${title} history load failed:`, error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, game, refreshKey]);

  if (!authUser) return null;

  const isWin = (play) => Number(play.payoutCents || 0) > 0;

  const resultLabel = (play) => {
    if (play.status === "lost") return game === "chicken" ? "Caught" : "Lost";
    if (play.status === "cashed_out") return "Cashed Out";
    if (play.status === "won") return "Won";
    return "Completed";
  };

  const renderPlinkoResult = (play) => {
    const historyRows = Math.max(
      PLINKO_ROWS_MIN,
      Math.min(
        PLINKO_ROWS_MAX,
        Number(play.rows) || PLINKO_ROWS_MIN
      )
    );
    const historyRisk = String(
      play.risk || "medium"
    ).toLowerCase();
    const slots = Array.isArray(play.slotMultipliers)
      ? play.slotMultipliers
      : getPlinkoSlotMultipliers(
          historyRows,
          historyRisk
        );
    const selectedSlot = Number(play.slotIndex ?? -1);

    return (
      <div className="towers-result-modal-game">
        <div className="towers-result-modal-title">
          <span>🔺</span>
          PLINKO
        </div>

        <div
          className="original-result-plinko-board"
          style={{ "--history-plinko-rows": historyRows }}
        >
          {Array.from({ length: historyRows }, (_, row) => (
            <div className="original-result-plinko-peg-row" key={`history-peg-row-${row}`}>
              {Array.from({ length: row + 3 }, (_, index) => (
                <span
                  className="original-result-plinko-peg"
                  key={`history-peg-${row}-${index}`}
                />
              ))}
            </div>
          ))}

          {selectedSlot >= 0 && (
            <div
              className="original-result-plinko-ball"
              style={{
                left: `${
                  8 +
                  ((selectedSlot + 0.5) /
                    (historyRows + 1)) *
                    84
                }%`,
              }}
            >
              ●
            </div>
          )}
        </div>

        <div
          className="original-result-plinko-slots"
          style={{ "--history-plinko-slots": slots.length }}
        >
          {slots.map((value, index) => (
            <div
              key={`history-slot-${index}`}
              className={`original-result-plinko-slot ${
                index === selectedSlot ? "selected" : ""
              }`}
            >
              <strong>{Number(value).toFixed(2)}×</strong>
              {index === selectedSlot && <small>RESULT</small>}
            </div>
          ))}
        </div>

        <div className={`towers-result-modal-outcome ${isWin(play) ? "win" : "loss"}`}>
          <strong>{isWin(play) ? "WINNING DROP" : "NO PAYOUT"}</strong>
          <span>Risk: {String(play.risk || "medium").toUpperCase()}</span>
        </div>
      </div>
    );
  };

  const renderChickenResult = (play) => {
    const path = Array.isArray(play.path) ? play.path : [];
    const totalSteps = Number(play.totalSteps || CHICKEN_STEPS_CLIENT);
    const crashStep = Number(play.hypotheticalCrashStep || 0) || null;
    const crashIndex =
      play.status === "cashed_out" &&
      crashStep &&
      crashStep > Number(play.step || 0)
        ? crashStep - 1
        : -1;

    return (
      <div className="towers-result-modal-game">
        <div className="towers-result-modal-title">
          <span>🐔</span>
          CHICKEN ROAD
          <small className="chicken-result-difficulty">
            {String(play.difficulty || "easy").toUpperCase()}
            {Number.isFinite(Number(play.collisionChance)) ? ` · ${Number(play.collisionChance)}% HIT` : ""}
          </small>
        </div>

        <div className="original-result-chicken-board">
          {Array.from({ length: totalSteps }, (_, index) => {
            const crossed = path[index] === true;
            const caught = path[index] === false;
            const wouldHaveHit = index === crashIndex;

            return (
              <div
                key={`history-chicken-step-${index}`}
                className={`original-result-chicken-step ${
                  crossed ? "safe" : ""
                } ${caught ? "trap" : ""} ${
                  Number(play.step || 0) === index + 1 ? "final" : ""
                } ${wouldHaveHit ? "hypothetical-crash" : ""}`}
                style={wouldHaveHit ? {
                  position: "relative",
                  borderColor: "rgba(255,82,112,.95)",
                  background: "linear-gradient(180deg,rgba(255,55,88,.22),rgba(85,18,38,.16))",
                  boxShadow: "0 0 0 1px rgba(255,82,112,.22),0 0 24px rgba(255,55,88,.22)",
                } : undefined}
              >
                <small>LANE {index + 1}</small>
                {wouldHaveHit ? (
                  <>
                    <strong style={{ color: "#ff6f8d", fontSize: "18px", lineHeight: 1 }}>🚗</strong>
                    <b style={{ color: "#ff8ea5", fontSize: "7px", lineHeight: 1.1, fontWeight: 1000 }}>WOULD HAVE HIT</b>
                  </>
                ) : (
                  <strong>{crossed ? "✓" : caught ? "✕" : "•"}</strong>
                )}
                <span>
                  {Number(play.multipliers?.[index + 1] || 1).toFixed(2)}×
                </span>
              </div>
            );
          })}
        </div>

        {play.status === "cashed_out" && crashStep && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              marginTop: "8px",
              padding: "9px 12px",
              borderRadius: "10px",
              background: "rgba(255,55,88,.08)",
              border: "1px solid rgba(255,82,112,.20)",
              color: "#ff8ea5",
              fontSize: "9px",
              fontWeight: 1000,
            }}
          >
            <span>🚗</span>
            <span>The car would have hit you on lane {crashStep}.</span>
          </div>
        )}

        <div className={`towers-result-modal-outcome ${play.status === "lost" ? "loss" : "win"}`}>
          <strong>
            {play.status === "lost"
              ? "CAUGHT"
              : play.status === "cashed_out"
                ? "CASHED OUT"
                : "ROAD CLEARED"}
          </strong>
          <span>Step {Number(play.step || 0)}/{totalSteps}</span>
        </div>
      </div>
    );
  };

  const renderCoinflipResult = (play) => {
    const outcome = String(play.outcome || "heads").toLowerCase();
    const choice = String(play.choice || "heads").toLowerCase();
    const won = Boolean(play.win);

    return (
      <div className="towers-result-modal-game">
        <div className="towers-result-modal-title">
          <span>🪙</span>
          COINFLIP
        </div>

        <div className="original-result-coinflip">
          <div className={`original-result-coin ${outcome === "tails" ? "tails" : "heads"}`}>
            {outcome.slice(0, 1).toUpperCase()}
          </div>

          <div className="original-result-coinflip-choice">
            <span>CALLED</span>
            <strong>{choice.toUpperCase()}</strong>
          </div>

          <div className="original-result-coinflip-choice">
            <span>LANDED</span>
            <strong>{outcome.toUpperCase()}</strong>
          </div>
        </div>

        <div className={`towers-result-modal-outcome ${won ? "win" : "loss"}`}>
          <strong>{won ? "WINNING FLIP" : "LOSING FLIP"}</strong>
          <span>{won ? `${Number(play.multiplier || 0).toFixed(2)}× payout` : "No payout"}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="towers-history-card original-game-history-card">
        <div className="towers-history-tabs">
          <button type="button" className="active">My Bets</button>
          <span className="towers-history-user-label">YOUR {title.toUpperCase()}</span>
        </div>

        <div className="towers-history-table-wrap">
          {loading ? (
            <div className="towers-history-empty">Loading your {title} history...</div>
          ) : history.length ? (
            <div className="towers-history-table">
              <div className="towers-history-row towers-history-head original-game-history-row">
                <span>Game</span>
                <span>Bet Amount</span>
                <span>Multiplier</span>
                <span>Payout</span>
                <span>Result</span>
              </div>

              {history.map((play) => (
                <div
                  className="towers-history-row towers-history-bet-row original-game-history-row"
                  key={play.id || `${play.roundId}-${play.createdAt}`}
                >
                  <span className="towers-history-game">
                    <b>{meta.icon}</b>
                    {title}
                  </span>
                  <span>{money(play.betCents)}</span>
                  <span className={`towers-history-multiplier ${isWin(play) ? "win" : "loss"}`}>
                    {Number(play.multiplier || 0).toFixed(2)}×
                  </span>
                  <span className={isWin(play) ? "towers-history-payout win" : "towers-history-payout"}>
                    {money(play.payoutCents)}
                  </span>
                  <span className="original-game-history-result-cell">
                    <button
                      type="button"
                      className="towers-view-result-btn"
                      onClick={() => setSelectedPlay(play)}
                    >
                      View Result
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="towers-history-empty">Your completed {title} bets will appear here.</div>
          )}
        </div>
      </div>

      {selectedPlay && (
        <div
          className="towers-result-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} bet result`}
          onClick={() => setSelectedPlay(null)}
        >
          <div
            className={`towers-result-modal original-game-result-modal ${game}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="towers-result-modal-close"
              onClick={() => setSelectedPlay(null)}
              aria-label="Close result"
            >
              ×
            </button>

            <div className="towers-result-modal-placed">
              <strong>Placed by</strong>
              <span className="towers-result-modal-user">
                {authUser?.username || authUser?.name || "You"}
              </span>
              <strong>on</strong>
              <span>
                {selectedPlay.createdAt
                  ? new Date(selectedPlay.createdAt).toLocaleString()
                  : "Unknown date"}
              </span>
            </div>

            <div className="towers-result-modal-brand">
              <span>✦</span>
              CASEX.COM
            </div>

            <div className="towers-result-modal-stats">
              <div>
                <span>BET</span>
                <strong>{money(selectedPlay.betCents)}</strong>
              </div>
              <div>
                <span>MULTIPLIER</span>
                <strong>{Number(selectedPlay.multiplier || 0).toFixed(2)}×</strong>
              </div>
              <div>
                <span>PAYOUT</span>
                <strong className={isWin(selectedPlay) ? "win" : ""}>
                  {money(selectedPlay.payoutCents)}
                </strong>
              </div>
            </div>

            {game === "plinko"
              ? renderPlinkoResult(selectedPlay)
              : game === "chicken"
                ? renderChickenResult(selectedPlay)
                : renderCoinflipResult(selectedPlay)}

            <div className={`towers-result-modal-summary ${isWin(selectedPlay) ? "win" : "loss"}`}>
              <strong>{resultLabel(selectedPlay)}</strong>
              <span>{selectedPlay.outcome || selectedPlay.status}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TowersGame({ balance, onBalanceChange, authUser }) {
  const [bet, setBet] = useState("1.00");
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState("");
  const [error, setError] = useState("");
  const [recentPlays, setRecentPlays] = useState([]);
  const [historyTab, setHistoryTab] = useState("bets");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [selectedHistoryPlay, setSelectedHistoryPlay] = useState(null);

  useEffect(() => {
    // Pre-decode the sounds so the first tile click has no noticeable audio delay.
    preloadTowersSounds();
  }, []);

  useEffect(() => {
    if (!authUser) {
      setRound(null);
      setRecentPlays([]);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;

    const loadActive = async () => {
      try {
        const response = await apiFetch(`${API}/api/originals/towers/active`, {
          cache: "no-store",
        });
        const data = await readJson(response);

        if (!cancelled && response.ok && data.round) {
          setRound(data.round);
          setHypotheticalCrashStep(
            data.round?.status === "cashed_out"
              ? Number(data.round?.hypotheticalCrashStep || 0) || null
              : null
          );
          if (data.round.difficulty) {
            setDifficulty(String(data.round.difficulty).toLowerCase());
          }
        }
      } catch (error) {
        console.error("Towers active round load failed:", error);
      }
    };

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await apiFetch(`${API}/api/originals/towers/history?limit=20`, {
          cache: "no-store",
        });
        const data = await readJson(response);

        if (!cancelled && response.ok && Array.isArray(data.history)) {
          setRecentPlays(data.history);
        }
      } catch (error) {
        console.error("Towers history load failed:", error);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void loadActive();
    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  const rememberPlay = (gameRound) => {
    if (!gameRound || !["lost", "cashed_out", "won"].includes(gameRound.status)) {
      return;
    }

    setRecentPlays((current) => [
      {
        id: `${gameRound.roundId}-${Date.now()}`,
        roundId: Number(gameRound.roundId || 0),
        status: gameRound.status,
        betCents: Number(gameRound.betCents || 0),
        payoutCents: Number(gameRound.payoutCents || 0),
        multiplier: Number(gameRound.multiplier || 0),
        difficulty: String(gameRound.difficulty || difficulty).toLowerCase(),
        step: Number(gameRound.step || 0),
        totalRows: Number(
          gameRound.totalRows ||
          (Array.isArray(gameRound.rows) ? gameRound.rows.length : 10)
        ),
        columns: Number(
          gameRound.columns ||
          (
            Number(gameRound.safeTiles || 0) +
            Number(gameRound.trapCount || 0)
          ) ||
          3
        ),
        safeTiles: Number(gameRound.safeTiles || 0),
        trapCount: Number(gameRound.trapCount || 0),
        rows: Array.isArray(gameRound.rows)
          ? gameRound.rows
          : [],
        pickedColumns: Array.isArray(gameRound.pickedColumns)
          ? gameRound.pickedColumns
          : [],
        createdAt: gameRound.createdAt || new Date().toISOString(),
      },
      ...current.filter((play) => Number(play.roundId || play.id) !== Number(gameRound.roundId)),
    ].slice(0, 20));
  };

  const start = async () => {
    if (loading) return;

    if (!authUser) {
      setError("Please sign in before playing.");
      return;
    }

    setLoading(true);
    setError("");
    setLastResult("");

    try {
      const response = await apiFetch(`${API}/api/originals/towers/start`, {
        method: "POST",
        body: JSON.stringify({ betAmount: bet, difficulty }),
      });
      const data = await readJson(response);

      if (!response.ok) throw new Error(data.error || "TOWERS_START_FAILED");

      setRound(data.round);
      if (data.round?.difficulty) {
        setDifficulty(String(data.round.difficulty).toLowerCase());
      }
      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
    } catch (err) {
      setError(err.message || "Unable to start Towers.");
    } finally {
      setLoading(false);
    }
  };

  const reveal = async (column) => {
    if (!round || loading || round.status !== "active") return;

    setLoading(true);
    setError("");
    setLastResult("");

    try {
      const response = await apiFetch(`${API}/api/originals/towers/reveal`, {
        method: "POST",
        body: JSON.stringify({
          roundId: Number(round.roundId),
          column: Number(column),
        }),
      });
      const data = await readJson(response);

      if (!response.ok) throw new Error(data.error || "TOWERS_REVEAL_FAILED");

      setRound(data.round);
      const safeTile = Boolean(data.result?.safe);
      setLastResult(safeTile ? "SAFE TILE" : "YOU HIT THE TRAP");

      if (safeTile) {
        // The initial click sound plays immediately; this confirms the server result.
        playTowerTileSound();
      } else {
        playTowerTrapSound();
      }

      if (data.round && ["lost", "cashed_out", "won"].includes(data.round.status)) {
        rememberPlay(data.round);
      }

      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
    } catch (err) {
      setError(err.message || "Unable to reveal tile.");
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if (!round || loading || round.status !== "active" || Number(round.step) <= 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API}/api/originals/towers/cashout`, {
        method: "POST",
        body: JSON.stringify({ roundId: Number(round.roundId) }),
      });
      const data = await readJson(response);

      if (!response.ok) throw new Error(data.error || "TOWERS_CASHOUT_FAILED");

      setRound(data.round);
      setLastResult(`CASHED OUT ${money(data.round.payoutCents)}`);
      playTowerCashoutSound();
      rememberPlay(data.round);

      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
    } catch (err) {
      setError(err.message || "Unable to cash out.");
    } finally {
      setLoading(false);
    }
  };

  const rows = round?.rows || [];
  const active = round?.status === "active";
  const step = Number(round?.step || 0);
  const multiplier = Number(round?.multiplier || 1);
  const payout = Number(round?.potentialPayoutCents || 0);
  const terminal = Boolean(round && ["lost", "cashed_out", "won"].includes(round.status));
  const activeDifficulty = String(round?.difficulty || difficulty).toLowerCase();
  const selectedDifficulty =
    TOWERS_DIFFICULTIES[activeDifficulty] ||
    TOWERS_DIFFICULTIES.easy;
  const boardColumns = Number(
    round?.columns ||
    selectedDifficulty.columns
  );
  const totalRows = Number(
    round?.totalRows ||
    rows.length ||
    TOWERS_ROWS
  );

  const towerMultiplierForStep = (floor) => {
    const serverMultiplier = round?.rowMultipliers?.[floor - 1];
    if (serverMultiplier != null) {
      return Number(serverMultiplier);
    }

    return towersMultiplierForStep(floor, activeDifficulty);
  };

  return (
    <GameShell
      game="towers"
      hideHeading
      balance={balance}
      message=""
      error={error}
    >
      <div className="towers-experience">
        <div className="towers-hero">
          <div className="towers-atmosphere" aria-hidden="true">
            <div className="towers-moon" />
            <div className="towers-cloud towers-cloud-one" />
            <div className="towers-cloud towers-cloud-two" />
            <div className="towers-mountain towers-mountain-one" />
            <div className="towers-mountain towers-mountain-two" />
            <div className="towers-castle towers-castle-left" />
            <div className="towers-castle towers-castle-right" />
            <div className="towers-floating-rock towers-rock-one" />
            <div className="towers-floating-rock towers-rock-two" />
            <div className="towers-floating-rock towers-rock-three" />
            <div className="towers-ground-glow" />
          </div>

          <div className="towers-hero-grid">
            <section className="towers-control-column">
              <div className="towers-title-area">
                <div className="towers-eyebrow">CASEX ORIGINAL</div>
                <h1>Towers</h1>
                <p>Climb higher. Pick the safe tile.</p>
                <div className="towers-live-badge"><i />LIVE</div>
              </div>

              <div className="towers-control-card">
                {!active ? (
                  <>
                    <div className="towers-difficulty-label">DIFFICULTY</div>

                    <div className="towers-difficulty-list">
                      {Object.entries(TOWERS_DIFFICULTIES).map(([value, config]) => (
                        <button
                          key={value}
                          type="button"
                          className={`towers-difficulty-option ${
                            difficulty === value ? "active" : ""
                          }`}
                          onClick={() => setDifficulty(value)}
                          disabled={loading}
                          aria-pressed={difficulty === value}
                        >
                          <span className="towers-difficulty-name">{config.label}</span>
                          <span className="towers-difficulty-icons" aria-hidden="true">
                            {"🔑".repeat(config.safe)}
                            {"💀".repeat(config.traps)}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="towers-difficulty-edge">10 FLOORS · 5% HOUSE EDGE</div>

                    <BetBox
                      value={bet}
                      setValue={setBet}
                      disabled={loading}
                      onBet={start}
                      balance={balance}
                      maxBet={100}
                      button={loading ? "STARTING..." : "START CLIMBING"}
                    />
                  </>
                ) : (
                  <>
                    <div className="towers-round-label">CURRENT ROUND</div>
                    <div className="towers-round-multiplier">{multiplier.toFixed(2)}×</div>

                    <div className="towers-round-stat">
                      <div>
                        <span>FLOOR</span>
                        <strong>{step}/{totalRows}</strong>
                      </div>
                      <div>
                        <span>POTENTIAL WIN</span>
                        <strong>{money(payout)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="towers-cashout"
                      onClick={cashout}
                      disabled={loading || step <= 0}
                    >
                      {loading ? "PROCESSING..." : `CASH OUT · ${money(payout)}`}
                    </button>
                  </>
                )}
              </div>

              <div className="towers-how-card">
                <div className="towers-how-heading"><span>i</span>HOW TO PLAY</div>
                <div className="towers-how-item"><b>1</b><span>Pick one safe tile on every floor.</span></div>
                <div className="towers-how-item"><b>2</b><span>Each safe pick increases your multiplier.</span></div>
                <div className="towers-how-item"><b>3</b><span>Cash out whenever you want before the trap.</span></div>
              </div>
            </section>

            <section className="towers-board-area">
              <div className="towers-board-top">
                <div className="towers-banner"><span>♛</span>CLIMB TO VICTORY<span>♛</span></div>
                <div className="towers-board-status"><span />{active ? `FLOOR ${Math.min(step + 1, totalRows)}` : `READY · ${TOWERS_DIFFICULTIES[difficulty]?.label || "Easy"}`}</div>
              </div>

              <div className="towers-structure">
                <div className="towers-torch towers-torch-left"><span /></div>
                <div className="towers-torch towers-torch-right"><span /></div>
                <div className="towers-board-roof"><span>♛</span></div>

                <div className="towers-stone-wall">
                  <div className="towers-board">
                    {Array.from({ length: totalRows }, (_, rowIndex) => {
                      const rowNumber = rowIndex + 1;
                      const isCurrent = Boolean(active && step === rowNumber - 1);
                      const completed = Boolean(round && rowNumber <= step);
                      const selected = round?.pickedColumns?.[rowNumber - 1];
                      const rowData = rows[rowIndex] || {};
                      const trapColumns = terminal
                        ? (
                            Array.isArray(rowData.traps)
                              ? rowData.traps.map(Number)
                              : Number.isInteger(Number(rowData.trap))
                                ? [Number(rowData.trap)]
                                : []
                          )
                        : [];
                      const floorMultiplier = towerMultiplierForStep(rowNumber);

                      return (
                        <div
                          key={rowNumber}
                          className={`towers-row ${isCurrent ? "current" : ""} ${completed ? "completed" : ""}`}
                          style={{ "--towers-columns": boardColumns }}
                        >
                          <span className="towers-row-number">{rowNumber}</span>
                          {Array.from({ length: boardColumns }, (_, column) => (
                            <button
                              type="button"
                              key={column}
                              className={`towers-tile ${selected === column ? "selected" : ""} ${
                                terminal && trapColumns.includes(column) ? "revealed-trap" : ""
                              } ${
                                terminal && trapColumns.length > 0 && !trapColumns.includes(column) ? "revealed-safe" : ""
                              }`}
                              onClick={() => {
                                reveal(column);
                              }}
                              disabled={!active || !isCurrent || loading}
                            >
                              {terminal ? (
                                trapColumns.includes(column) ? (
                                  <span className="towers-tile-trap-icon" aria-label="Trap">💥</span>
                                ) : (
                                  <span className="towers-tile-multiplier">{floorMultiplier.toFixed(2)}×</span>
                                )
                              ) : isCurrent ? (
                                <span className="towers-tile-multiplier">{floorMultiplier.toFixed(2)}×</span>
                              ) : completed ? (
                                selected === column ? (
                                  <span className="towers-tile-multiplier">{floorMultiplier.toFixed(2)}×</span>
                                ) : (
                                  <span className="towers-tile-icon">♛</span>
                                )
                              ) : (
                                <span className="towers-tile-icon">♛</span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="towers-steps">
                  <span /><span /><span /><span /><span />
                </div>
              </div>

              {round?.status === "lost" && (
                <div className="towers-result loss">
                  <strong>TRAPPED</strong>
                  <span>Trap revealed · floor {Math.max(step + 1, 1)}</span>
                </div>
              )}

              {(round?.status === "cashed_out" || round?.status === "won") && (
                <div className="towers-result win">
                  <strong>{multiplier.toFixed(2)}×</strong>
                  <span>{money(round.payoutCents)} paid · board revealed</span>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="towers-history-card">
          <div className="towers-history-tabs">
            <button type="button" className="active">
              My Bets
            </button>
            <span className="towers-history-user-label">YOUR TOWERS</span>
          </div>

          <div className="towers-history-table-wrap">
            {historyLoading ? (
              <div className="towers-history-empty">Loading your Towers history...</div>
            ) : recentPlays.length ? (
              <div className="towers-history-table">
                <div className="towers-history-row towers-history-head">
                  <span>Game</span>
                  <span>Bet Amount</span>
                  <span>Multiplier</span>
                  <span>Payout</span>
                  <span>Result</span>
                </div>

                {recentPlays.map((play) => (
                  <div
                    className="towers-history-row towers-history-bet-row"
                    key={play.id || `${play.roundId}-${play.createdAt}`}
                  >
                    <span className="towers-history-game">
                      <b>♛</b> Towers
                    </span>
                    <span>{money(play.betCents)}</span>
                    <span className={`towers-history-multiplier ${play.status === "lost" ? "loss" : "win"}`}>
                      {Number(play.multiplier || 0).toFixed(2)}×
                    </span>
                    <span className={Number(play.payoutCents || 0) > 0 ? "towers-history-payout win" : "towers-history-payout"}>
                      {money(play.payoutCents)}
                    </span>
                    <span>
                      <button
                        type="button"
                        className="towers-view-result-btn"
                        onClick={() => setSelectedHistoryPlay(play)}
                      >
                        View Result
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="towers-history-empty">
                Your completed Towers bets will appear here.
              </div>
            )}
          </div>
        </div>

        {selectedHistoryPlay && (
          <div
            className="towers-result-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Towers bet result"
            onClick={() => setSelectedHistoryPlay(null)}
          >
            <div
              className="towers-result-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="towers-result-modal-close"
                onClick={() => setSelectedHistoryPlay(null)}
                aria-label="Close result"
              >
                ×
              </button>

              <div className="towers-result-modal-placed">
                <strong>Placed by</strong>
                <span className="towers-result-modal-user">
                  {authUser?.username || authUser?.name || "You"}
                </span>
                <strong>on</strong>
                <span>
                  {selectedHistoryPlay.createdAt
                    ? new Date(selectedHistoryPlay.createdAt).toLocaleString()
                    : "Unknown date"}
                </span>
              </div>

              <div className="towers-result-modal-brand">
                <span>✦</span>
                CASEX.COM
              </div>

              <div className="towers-result-modal-stats">
                <div>
                  <span>BET</span>
                  <strong>{money(selectedHistoryPlay.betCents)}</strong>
                </div>
                <div>
                  <span>MULTIPLIER</span>
                  <strong>{Number(selectedHistoryPlay.multiplier || 0).toFixed(2)}×</strong>
                </div>
                <div>
                  <span>PAYOUT</span>
                  <strong className={Number(selectedHistoryPlay.payoutCents || 0) > 0 ? "win" : ""}>
                    {money(selectedHistoryPlay.payoutCents)}
                  </strong>
                </div>
              </div>

              <div className="towers-result-modal-game">
                <div className="towers-result-modal-title">
                  <span>♛</span>
                  TOWERS
                </div>

                <div className="towers-result-modal-board">
                  {Array.from(
                    { length: Number(selectedHistoryPlay.totalRows || 10) },
                    (_, displayRowIndex) => {
                      const totalRows = Number(
                        selectedHistoryPlay.totalRows || 10
                      );

                      // Display floor 10 at the top and floor 1 at the bottom,
                      // matching the actual Towers board. Stored arrays remain
                      // in play order (floor 1 -> floor 10).
                      const sourceRowIndex =
                        totalRows - 1 - displayRowIndex;

                      const row = Array.isArray(selectedHistoryPlay.rows)
                        ? selectedHistoryPlay.rows[sourceRowIndex] || {}
                        : {};

                      const traps = Array.isArray(row.traps)
                        ? row.traps.map(Number)
                        : Number.isInteger(Number(row.trap))
                          ? [Number(row.trap)]
                          : [];

                      const columns = Number(
                        selectedHistoryPlay.columns ||
                        (
                          Number(selectedHistoryPlay.safeTiles || 0) +
                          Number(selectedHistoryPlay.trapCount || 0)
                        ) ||
                        3
                      );

                      const selected = Array.isArray(
                        selectedHistoryPlay.pickedColumns
                      )
                        ? selectedHistoryPlay.pickedColumns[sourceRowIndex]
                        : null;

                      return (
                        <div
                          className="towers-result-modal-row"
                          style={{ "--history-columns": columns }}
                          key={`history-row-${sourceRowIndex}`}
                        >
                          {Array.from({ length: columns }, (_, column) => {
                            const isTrap = traps.includes(column);
                            const wasPicked = selected === column;

                            return (
                              <div
                                key={`history-cell-${sourceRowIndex}-${column}`}
                                className={`towers-result-modal-tile ${
                                  isTrap ? "trap" : "safe"
                                } ${wasPicked ? "picked" : ""} ${
                                  wasPicked && isTrap ? "picked-trap" : ""
                                } ${
                                  wasPicked && !isTrap ? "picked-safe" : ""
                                }`}
                              >
                                <span>{isTrap ? "💀" : "🔑"}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                  )}
                </div>

                <div className={`towers-result-modal-outcome ${selectedHistoryPlay.status === "lost" ? "loss" : "win"}`}>
                  <strong>
                    {selectedHistoryPlay.status === "lost"
                      ? "TRAP HIT"
                      : selectedHistoryPlay.status === "won"
                        ? "TOWER CLEARED"
                        : "CASHED OUT"}
                  </strong>
                  <span>
                    Floor {Number(selectedHistoryPlay.step || 0)}/10
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function PlinkoGame({
  balance,
  onBalanceChange,
  authUser,
}) {
  const [bet, setBet] =
    useState("1.00");

  const [risk, setRisk] =
    useState("medium");

  const [rows, setRows] =
    useState(8);

  const [balls, setBalls] =
    useState([]);

  const [lastResult, setLastResult] =
    useState(null);

  const [landedDrop, setLandedDrop] =
    useState(null);

  const [error, setError] =
    useState("");

  const [historyRefresh, setHistoryRefresh] =
    useState(0);

  const [impactKey, setImpactKey] =
    useState(0);

  const [pendingDrops, setPendingDrops] =
    useState(0);

  const [plinkoMode, setPlinkoMode] =
    useState("manual");

  const [autoNumberOfBets, setAutoNumberOfBets] =
    useState("0");

  const [autoOnWinMode, setAutoOnWinMode] =
    useState("reset");

  const [autoOnWinPercent, setAutoOnWinPercent] =
    useState("0");

  const [autoOnLossMode, setAutoOnLossMode] =
    useState("reset");

  const [autoOnLossPercent, setAutoOnLossPercent] =
    useState("0");

  const [autoStopProfit, setAutoStopProfit] =
    useState("0");

  const [autoStopLoss, setAutoStopLoss] =
    useState("0");

  const [autoRunning, setAutoRunning] =
    useState(false);

  const [autoRemainingBets, setAutoRemainingBets] =
    useState(Infinity);

  const [autoSessionProfit, setAutoSessionProfit] =
    useState(0);

  const plinkoBoardWidthRef =
    useRef(0);

  const autoRunRef =
    useRef(false);

  const autoSessionProfitRef =
    useRef(0);

  const autoRemainingBetsRef =
    useRef(Infinity);

  const autoInitialBetRef =
    useRef("1.00");

  const autoCurrentBetRef =
    useRef("1.00");

  const plinkoLandingResolversRef =
    useRef(new Map());

  const balanceSequenceRef =
    useRef(0);

  const displayedBalanceSequenceRef =
    useRef(0);

  const [plinkoBoardWidth, setPlinkoBoardWidth] =
    useState(0);

  const plinkoBoardRef =
    useRef(null);

  const plinkoBallRefs =
    useRef(new Map());

  const ballsRef =
    useRef([]);

  const animationStateRef =
    useRef(new Map());

  const animationFrameRef =
    useRef(null);

  const landingResetTimeoutRef =
    useRef(null);

  useEffect(() => {
    ballsRef.current =
      balls;
  }, [balls]);

  useEffect(() => {
    const board =
      plinkoBoardRef.current;

    if (!board) {
      return undefined;
    }

    const updateSize = () => {
      const width =
        board.getBoundingClientRect().width;

      if (
        Number.isFinite(width) &&
        width > 0
      ) {
        plinkoBoardWidthRef.current = width;
        setPlinkoBoardWidth(width);
      }
    };

    updateSize();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateSize)
        : null;

    observer?.observe(board);

    window.addEventListener(
      "resize",
      updateSize
    );

    return () => {
      observer?.disconnect();

      window.removeEventListener(
        "resize",
        updateSize
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      autoRunRef.current = false;

      plinkoLandingResolversRef.current.forEach(
        (resolve) => resolve(null)
      );

      plinkoLandingResolversRef.current.clear();

      if (
        landingResetTimeoutRef.current !=
        null
      ) {
        window.clearTimeout(
          landingResetTimeoutRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    const animate = (
      now
    ) => {
      const currentBalls =
        ballsRef.current;

      const completed = [];

      currentBalls.forEach(
        (ball) => {
          const element =
            plinkoBallRefs.current.get(
              ball.id
            );

          const animation =
            animationStateRef.current.get(
              ball.id
            );

          if (
            !element ||
            !animation
          ) {
            return;
          }

          const rawProgress =
            (
              now -
              animation.startedAt
            ) /
            animation.duration;

          const progress =
            Math.min(
              1,
              Math.max(
                0,
                rawProgress
              )
            );

          const points =
            Array.isArray(
              ball.points
            )
              ? ball.points
              : [];

          if (
            points.length <
            2
          ) {
            return;
          }

          const segmentCount =
            points.length -
            1;

          const scaledProgress =
            progress *
            segmentCount;

          const segmentIndex =
            Math.min(
              segmentCount - 1,
              Math.floor(
                scaledProgress
              )
            );

          const segmentProgress =
            Math.min(
              1,
              Math.max(
                0,
                scaledProgress -
                  segmentIndex
              )
            );

          const from =
            points[
              segmentIndex
            ];

          const to =
            points[
              segmentIndex + 1
            ];

          if (
            !from ||
            !to
          ) {
            return;
          }

          // Smooth per-row travel. Each segment represents one real peg
          // contact, keeping the ball aligned to the peg grid.
          const eased =
            segmentProgress <
            0.5
              ? 4 *
                segmentProgress *
                segmentProgress *
                segmentProgress
              : 1 -
                Math.pow(
                  -2 *
                    segmentProgress +
                    2,
                  3
                ) /
                  2;

          const dx =
            to.x -
            from.x;

          const dy =
            to.y -
            from.y;

          let x =
            from.x +
            dx *
              eased;

          let y =
            from.y +
            dy *
              eased;

          // A small downward arc between pegs creates a physical-looking
          // bounce without moving the ball away from the actual path.
          if (
            segmentIndex <
            segmentCount - 1
          ) {
            const arc =
              Math.sin(
                segmentProgress *
                  Math.PI
              ) *
              Math.min(
                1.35,
                Math.max(
                  0.45,
                  Math.abs(dy) *
                    0.065
                )
              );

            y += arc;
          }

          const velocityAngle =
            Math.atan2(
              dy,
              dx
            ) *
              (180 /
                Math.PI) +
            90;

          const contactPulse =
            Math.pow(
              Math.sin(
                segmentProgress *
                  Math.PI
              ),
              8
            );

          const scaleX =
            1 +
            contactPulse *
              0.10;

          const scaleY =
            1 -
            contactPulse *
              0.07;

          element.style.left =
            `${x}%`;

          element.style.top =
            `${y}%`;

          element.style.transform =
            `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;

          element.style.setProperty(
            "--plinko-trail-angle",
            `${velocityAngle}deg`
          );

          // The moment we enter a new segment, we have just contacted the
          // previous peg. One audio event per contact keeps the sound clean.
          if (
            segmentIndex !==
            animation.lastSegment
          ) {
            if (
              animation.lastSegment >=
              0
            ) {
              playPlinkoPegSound(
                animation.lastSegment
              );
            }

            animation.lastSegment =
              segmentIndex;
          }

          if (
            progress >=
            1
          ) {
            element.style.left =
              `${ball.landingX}%`;

            element.style.top =
              `${ball.landingY}%`;

            element.style.transform =
              "translate(-50%, -50%) scale(1)";

            if (
              !animation.landed
            ) {
              animation.landed =
                true;

              playPlinkoLandingSound(
                Number(
                  ball.result
                    ?.payoutCents ||
                    0
                ) >
                  0
              );

              completed.push(
                ball
              );
            }
          }
        }
      );

      if (
        completed.length
      ) {
        completed.forEach(
          (ball) => {
            setLandedDrop(
              ball
            );

            setLastResult(
              ball.result
            );

            setImpactKey(
              (value) =>
                value + 1
            );

            if (
              landingResetTimeoutRef.current !=
              null
            ) {
              window.clearTimeout(
                landingResetTimeoutRef.current
              );
            }

            // Keep the landing result visible for exactly one second.
            landingResetTimeoutRef.current =
              window.setTimeout(
                () => {
                  setLandedDrop(
                    null
                  );

                  setLastResult(
                    null
                  );

                  landingResetTimeoutRef.current =
                    null;
                },
                1000
              );

            // Leave the ball sitting in the slot for a short impact moment,
            // then remove just that ball. Other drops keep running.
            // The bet was already deducted when the drop request succeeded.
            // The payout is intentionally NOT added until the ball reaches
            // its landing slot. Settlement is server-authoritative and
            // idempotent, so overlapping balls can each settle safely.
            void (async () => {
              const settled = await settlePlinkoDrop(ball);

              if (
                settled &&
                Number.isFinite(
                  Number(
                    settled.newBalanceCents
                  )
                )
              ) {
                balanceSequenceRef.current += 1;

                const settlementSequence =
                  balanceSequenceRef.current;

                if (
                  settlementSequence >=
                  displayedBalanceSequenceRef.current
                ) {
                  displayedBalanceSequenceRef.current =
                    settlementSequence;

                  onBalanceChange?.(
                    Number(
                      settled.newBalanceCents
                    ) /
                      100
                  );
                }
              }

            const landingResolver =
              plinkoLandingResolversRef.current.get(
                ball.id
              );

            if (landingResolver) {
              plinkoLandingResolversRef.current.delete(
                ball.id
              );

              landingResolver({
                result: ball.result,
                balanceAfterCents:
                  Number(
                    settled?.newBalanceCents
                  ),
                betCents: Number(
                  ball.betCents
                ),
                duration: Number(
                  ball.duration
                ),
              });
            }
            })();

            window.setTimeout(
              () => {
                animationStateRef.current.delete(
                  ball.id
                );

                plinkoBallRefs.current.delete(
                  ball.id
                );

                setBalls(
                  (current) =>
                    current.filter(
                      (
                        item
                      ) =>
                        item.id !==
                        ball.id
                    )
                );
              },
              170
            );
          }
        );
      }

      animationFrameRef.current =
        window.requestAnimationFrame(
          animate
        );
    };

    animationFrameRef.current =
      window.requestAnimationFrame(
        animate
      );

    return () => {
      if (
        animationFrameRef.current !=
        null
      ) {
        window.cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      animationFrameRef.current =
        null;
    };
  }, []);

  const controlsLocked =
    autoRunning ||
    balls.length > 0 ||
    pendingDrops > 0 ||
    Boolean(landedDrop);

  const settlePlinkoDrop = async (ball) => {
    const roundId = Number(
      ball?.result?.roundId
    );

    if (!Number.isSafeInteger(roundId) || roundId <= 0) {
      setError("Unable to settle the Plinko result.");
      return null;
    }

    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await apiFetch(
          `${API}/api/originals/plinko/settle`,
          {
            method: "POST",
            body: JSON.stringify({ roundId }),
          }
        );

        const data = await readJson(response);

        if (!response.ok) {
          throw new Error(
            data.error || "PLINKO_SETTLE_FAILED"
          );
        }

        return data;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, 250)
          );
        }
      }
    }

    setError(
      lastError?.message ||
        "Unable to settle the Plinko result."
    );

    return null;
  };

  const drop = async ({
    amountOverride = null,
    forAutobet = false,
    waitForAnimation = true,
  } = {}) => {
    if (
      !authUser
    ) {
      setError(
        "Please sign in before playing."
      );
      return null;
    }

    setError("");

    const requestedBet =
      amountOverride != null
        ? String(amountOverride)
        : String(bet);

    const requestedBetCents =
      parseAmountToCentsClient(requestedBet);

    if (
      requestedBetCents == null ||
      requestedBetCents < PLINKO_MIN_BET_CENTS ||
      requestedBetCents > PLINKO_MAX_BET_CENTS
    ) {
      setError("Bet amount must be between $0.01 and $25.00.");
      return null;
    }

    const normalizedRequestedBet =
      (requestedBetCents / 100).toFixed(2);

    const requestRows =
      Math.max(
        PLINKO_ROWS_MIN,
        Math.min(
          PLINKO_ROWS_MAX,
          Number(rows) ||
            PLINKO_ROWS_MIN
        )
      );

    const requestRisk =
      PLINKO_RISK_CONFIG[
        risk
      ]
        ? risk
        : "medium";

    const animationId =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    setPendingDrops(
      (count) => count + 1
    );

    try {
      const response =
        await apiFetch(
          `${API}/api/originals/plinko/drop`,
          {
            method: "POST",

            body:
              JSON.stringify({
                betAmount:
                  normalizedRequestedBet,

                risk:
                  requestRisk,

                rows:
                  requestRows,
              }),
          }
        );

      const data =
        await readJson(
          response
        );

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "PLINKO_DROP_FAILED"
        );
      }

      const result = {
        ...data.result,

        rows:
          Number(
            data.result?.rows ||
              requestRows
          ),

        risk:
          String(
            data.result?.risk ||
              requestRisk
          ).toLowerCase(),
      };

      const board =
        plinkoBoardRef.current;

      const boardRect =
        board?.getBoundingClientRect();

      const builtPath =
        buildPlinkoBallPath(
          Number(
            result.rows
          ),

          Number(
            result.slotIndex
          ),

          result.path,

          {
            width:
              boardRect?.width,

            height:
              boardRect?.height,

            slotRailWidth:
              plinkoSlotRailWidth,

            slotGap:
              plinkoSlotGap,
          }
        );

      const balanceAfterBetCents =
        Number(
          data.newBalanceCents
        );

      // The server has already debited the wager. Reflect that deduction
      // immediately; the payout is credited only when the ball lands.
      balanceSequenceRef.current += 1;

      const balanceSequence =
        balanceSequenceRef.current;

      if (
        Number.isFinite(balanceAfterBetCents) &&
        balanceSequence >=
          displayedBalanceSequenceRef.current
      ) {
        displayedBalanceSequenceRef.current =
          balanceSequence;

        onBalanceChange?.(
          balanceAfterBetCents / 100
        );
      }

      const ball = {
        id:
          animationId,

        slotIndex:
          Number(
            result.slotIndex
          ),

        rows:
          Number(
            result.rows
          ),

        risk:
          result.risk,

        points:
          builtPath.points,

        landingX:
          builtPath.landingX,

        landingY:
          builtPath.landingY,

        result,

        betCents:
          requestedBetCents,

        balanceAfterCents:
          Number.isFinite(
            balanceAfterBetCents
          )
            ? balanceAfterBetCents
            : null,

        balanceSequence,

        duration:
          900 +
          Number(
            result.rows
          ) *
            78,
      };

      playPlinkoDropSound();

      animationStateRef.current.set(
        animationId,
        {
          startedAt:
            performance.now(),

          duration:
            ball.duration,

          lastSegment:
            -1,

          landed:
            false,
        }
      );

      setBalls(
        (current) => [
          ...current.slice(
            -23
          ),

          ball,
        ]
      );

      setHistoryRefresh(
        (value) =>
          value + 1
      );

      // Manual drops wait for the visual ball to land so the caller can
      // continue from the completed animation. Auto Bet is different: the
      // server has already returned the authoritative result, so it must not
      // wait for the ~1-2 second animation before placing the next wager.
      // This allows several balls to be in flight at the same time.
      if (!waitForAnimation) {
        return {
          result,
          balanceAfterCents:
            balanceAfterBetCents,
          betCents: requestedBetCents,
          duration: ball.duration,
          animationId,
        };
      }

      const landingPromise =
        new Promise((resolve) => {
          plinkoLandingResolversRef.current.set(
            animationId,
            resolve
          );
        });

      const landed =
        await landingPromise;

      return landed || {
        result,
        balanceAfterCents:
          balanceAfterBetCents,
        betCents: Number(
          parseAmountToCentsClient(
            requestedBet
          )
        ),
        duration: ball.duration,
        animationId,
      };
    } catch (
      err
    ) {
      setError(
        err.message ||
          "Unable to drop the ball."
      );

      return {
        error:
          err.message ||
          "Unable to drop the ball.",
      };
    } finally {
      setPendingDrops(
        (count) =>
          Math.max(
            0,
            count - 1
          )
      );
    }
  };

  const startAutobet = async () => {
    if (autoRunRef.current) {
      return;
    }

    if (!authUser) {
      setError(
        "Please sign in before using Auto mode."
      );
      return;
    }

    const baseBetCents =
      parseAmountToCentsClient(
        bet
      );

    if (!baseBetCents) {
      setError(
        "Enter a valid bet amount."
      );
      return;
    }

    if (
      baseBetCents < PLINKO_MIN_BET_CENTS ||
      baseBetCents > PLINKO_MAX_BET_CENTS
    ) {
      setError("Auto Bet amount must be between $0.01 and $25.00.");
      return;
    }

    const requestedBets =
      String(
        autoNumberOfBets
      ).trim();

    const numberOfBets =
      requestedBets === ""
        ? 0
        : Number(
            requestedBets
          );

    if (
      !Number.isInteger(
        numberOfBets
      ) ||
      numberOfBets < 0
    ) {
      setError(
        "Number of Bets must be a whole number. Use 0 for unlimited."
      );
      return;
    }

    const onWinPercent =
      Math.max(
        0,
        Number(
          autoOnWinPercent
        ) || 0
      );

    const onLossPercent =
      Math.max(
        0,
        Number(
          autoOnLossPercent
        ) || 0
      );

    const stopProfit =
      Math.max(
        0,
        Number(
          autoStopProfit
        ) || 0
      );

    const stopLoss =
      Math.max(
        0,
        Number(
          autoStopLoss
        ) || 0
      );

    const lockedRisk =
      risk;

    const lockedRows =
      Number(rows);

    autoRunRef.current = true;
    autoSessionProfitRef.current = 0;
    autoInitialBetRef.current =
      Number(
        bet
      )
        .toFixed(2);
    autoCurrentBetRef.current =
      autoInitialBetRef.current;
    autoRemainingBetsRef.current =
      numberOfBets > 0
        ? numberOfBets
        : Infinity;

    setAutoRunning(
      true
    );

    setAutoSessionProfit(
      0
    );

    setAutoRemainingBets(
      autoRemainingBetsRef.current
    );

    setError("");

    try {
      while (
        autoRunRef.current
      ) {
        const remaining =
          autoRemainingBetsRef.current;

        if (
          Number.isFinite(
            remaining
          ) &&
          remaining <= 0
        ) {
          break;
        }

        const result =
          await drop({
            amountOverride:
              autoCurrentBetRef.current,
            forAutobet:
              true,
            // Do not wait for the visual animation. The backend result is
            // authoritative immediately, allowing the next Auto Bet to be
            // launched while previous balls are still falling.
            waitForAnimation:
              false,
          });

        if (
          !autoRunRef.current
        ) {
          break;
        }

        if (
          !result ||
          result.error ||
          !result.result
        ) {
          break;
        }

        const betCents =
          Number(
            result.betCents
          ) ||
          parseAmountToCentsClient(
            autoCurrentBetRef.current
          );

        const payoutCents =
          Number(
            result.result
              .payoutCents
          ) ||
          0;

        const profitCents =
          payoutCents -
          betCents;

        autoSessionProfitRef.current +=
          profitCents /
          100;

        setAutoSessionProfit(
          autoSessionProfitRef.current
        );

        if (
          Number.isFinite(
            autoRemainingBetsRef.current
          )
        ) {
          autoRemainingBetsRef.current =
            Math.max(
              0,
              autoRemainingBetsRef.current -
                1
            );

          setAutoRemainingBets(
            autoRemainingBetsRef.current
          );
        }

        if (
          stopProfit > 0 &&
          autoSessionProfitRef.current >=
            stopProfit
        ) {
          break;
        }

        if (
          stopLoss > 0 &&
          autoSessionProfitRef.current <=
            -stopLoss
        ) {
          break;
        }

        const didWin =
          profitCents > 0;

        const didLose =
          profitCents < 0;

        const percent =
          didWin
            ? onWinPercent
            : onLossPercent;

        const action =
          didWin
            ? autoOnWinMode
            : autoOnLossMode;

        const currentBetNumber =
          Number(
            autoCurrentBetRef.current
          );

        let nextBet =
          currentBetNumber;

        if (
          didWin ||
          didLose
        ) {
          if (
            action ===
            "increase"
          ) {
            nextBet =
              currentBetNumber *
              (
                1 +
                percent / 100
              );
          } else {
            nextBet =
              Number(
                autoInitialBetRef.current
              );
          }
        }

        if (
          !Number.isFinite(
            nextBet
          ) ||
          nextBet <= 0
        ) {
          nextBet =
            Number(
              autoInitialBetRef.current
            );
        }

        nextBet =
          Math.min(
            25,
            Math.max(
              0.01,
              Number(nextBet.toFixed(2))
            )
          );

        autoCurrentBetRef.current =
          nextBet.toFixed(2);

        setBet(
          autoCurrentBetRef.current
        );

        // The selected risk and row count are captured for the run. This
        // keeps the sequence consistent even if React re-renders between bets.
        if (
          risk !== lockedRisk ||
          Number(rows) !== lockedRows
        ) {
          setRisk(
            lockedRisk
          );

          setRows(
            lockedRows
          );
        }

        // Pace Auto Bet so the animations can overlap naturally instead of
        // spawning balls back-to-back at maximum speed. This is intentionally
        // separate from the animation duration: previous balls keep falling
        // while we wait before launching the next wager.
        if (autoRunRef.current) {
          await new Promise((resolve) =>
            window.setTimeout(
              resolve,
              PLINKO_AUTOBET_INTERVAL_MS
            )
          );
        }
      }
    } finally {
      autoRunRef.current = false;
      setAutoRunning(
        false
      );
      setAutoRemainingBets(
        autoRemainingBetsRef.current
      );
    }
  };

  const stopAutobet = () => {
    autoRunRef.current = false;
    setAutoRunning(
      false
    );
  };

  const slotMultipliers =
    getPlinkoSlotMultipliers(
      rows,
      risk
    );

  const activeRows =
    Number(rows);

  // Keep the visual peg pitch and reward-slot pitch identical so each
  // multiplier sits in the gap between the two pegs above it, matching a
  // real Plinko board. The same geometry is also passed into the animation
  // path calculation so the ball lands in the centre of the correct slot.
  const measuredPlinkoWidth =
    Math.max(
      420,
      Number(plinkoBoardWidth) ||
        720
    );

  const plinkoPegSize = 10;

  const preferredPlinkoPegPitch =
    Math.max(
      48,
      Math.min(
        64,
        measuredPlinkoWidth *
          0.075
      )
    );

  const maxFittingPlinkoPegPitch =
    Math.max(
      30,
      (
        measuredPlinkoWidth -
        32 -
        32 -
        6
      ) /
        (
          activeRows +
          1
        )
    );

  const plinkoPegPitch =
    Math.min(
      preferredPlinkoPegPitch,
      maxFittingPlinkoPegPitch
    );

  const plinkoPegGap =
    Math.max(
      22,
      plinkoPegPitch -
        plinkoPegSize
    );

  const plinkoSlotCount =
    activeRows + 1;

  // Give reward pockets real breathing room while preserving the same
  // center-to-center geometry as the bottom peg row.
  const plinkoSlotGap = 8;

  const plinkoSlotRailWidth =
    plinkoSlotCount *
      plinkoPegPitch -
    plinkoSlotGap;

  return (
    <GameShell
      game="plinko"
      onClose={() => {}}
      balance={balance}
      message=""
      error={error}
      hideHeading
    >
      <style>{PLINKO_AUTOBET_CSS}</style>
      <style>{PLINKO_UNIFIED_LAYOUT_CSS}</style>

      <div className="plinko-experience-card">
        <aside className="plinko-control-panel">
          <div className="plinko-unified-title">
            <span className="plinko-machine-eyebrow">CASEX ORIGINAL</span>
            <div className="plinko-unified-title-row">
              <h1>Plinko</h1>
              <div className="plinko-machine-status">
                <i />
                LIVE
              </div>
            </div>
            <p>Drop the ball. Chase the multiplier.</p>
          </div>

          <div className="plinko-unified-mode-tabs">
            <button
              type="button"
              className={plinkoMode === "manual" ? "active" : ""}
              onClick={() => {
                if (!autoRunning) setPlinkoMode("manual");
              }}
              disabled={autoRunning}
              aria-current={plinkoMode === "manual" ? "page" : undefined}
            >
              Manual
            </button>
            <button
              type="button"
              className={plinkoMode === "auto" ? "active" : ""}
              onClick={() => {
                if (!autoRunning) setPlinkoMode("auto");
              }}
              disabled={autoRunning}
              aria-current={plinkoMode === "auto" ? "page" : undefined}
            >
              Auto
            </button>
          </div>

          {plinkoMode === "manual" ? (
            <div className="original-games-control-card plinko-manual-bet-card">
              <div className="original-games-control-label">BET AMOUNT</div>

              <div className="plinko-bet-main-row">
                <div className="original-games-bet-input plinko-bet-input-large">
                  <span>$</span>
                  <input
                    value={bet}
                    type="number"
                    min="0.01"
                    max="25"
                    step="0.01"
                    inputMode="decimal"
                    onChange={(event) => setBet(clampPlinkoBetInput(event.target.value))}
                  />
                </div>

                <div className="plinko-bet-shortcuts">
                  <button type="button" onClick={() => {
                    const cents = parseAmountToCentsClient(bet);
                    if (cents) {
                      setBet((Math.max(PLINKO_MIN_BET_CENTS, Math.floor(cents / 2)) / 100).toFixed(2));
                    }
                  }}>1/2</button>
                  <button type="button" onClick={() => {
                    const cents = parseAmountToCentsClient(bet);
                    if (cents) {
                      setBet((Math.min(PLINKO_MAX_BET_CENTS, cents * 2) / 100).toFixed(2));
                    }
                  }}>2X</button>
                  <button type="button" onClick={() => {
                    const balanceCents = Math.max(0, Math.floor(Number(balance || 0) * 100));
                    const maxCents = Math.min(PLINKO_MAX_BET_CENTS, balanceCents);
                    if (maxCents >= PLINKO_MIN_BET_CENTS) {
                      setBet((maxCents / 100).toFixed(2));
                    }
                  }}>Max</button>
                </div>
              </div>

              <button
                type="button"
                className="original-games-primary plinko-drop-button"
                onClick={() => void drop()}
              >
                DROP BALL
              </button>

              <div className="plinko-demo-note">
                Minimum bet $0.01 • Maximum bet $25.00
              </div>
            </div>
          ) : (
            <div className="original-games-control-card plinko-auto-bet-card">
              <div className="original-games-control-label">BET AMOUNT</div>

              <div className="plinko-bet-main-row">
                <div className="original-games-bet-input plinko-bet-input-large">
                  <span>$</span>
                  <input
                    value={bet}
                    type="number"
                    min="0.01"
                    max="25"
                    step="0.01"
                    inputMode="decimal"
                    onChange={(event) =>
                      setBet(clampPlinkoBetInput(event.target.value))
                    }
                    disabled={autoRunning}
                  />
                </div>

                <div className="plinko-bet-shortcuts">
                  <button type="button" disabled={autoRunning} onClick={() => {
                    const cents = parseAmountToCentsClient(bet);
                    if (cents) {
                      setBet((Math.max(PLINKO_MIN_BET_CENTS, Math.floor(cents / 2)) / 100).toFixed(2));
                    }
                  }}>1/2</button>
                  <button type="button" disabled={autoRunning} onClick={() => {
                    const cents = parseAmountToCentsClient(bet);
                    if (cents) {
                      setBet((Math.min(PLINKO_MAX_BET_CENTS, cents * 2) / 100).toFixed(2));
                    }
                  }}>2X</button>
                  <button type="button" disabled={autoRunning} onClick={() => {
                    const balanceCents = Math.max(0, Math.floor(Number(balance || 0) * 100));
                    const maxCents = Math.min(PLINKO_MAX_BET_CENTS, balanceCents);
                    if (maxCents >= PLINKO_MIN_BET_CENTS) {
                      setBet((maxCents / 100).toFixed(2));
                    }
                  }}>Max</button>
                </div>
              </div>

            </div>
          )}

          <div
            className={`original-games-control-card plinko-settings-panel ${
              controlsLocked
                ? "plinko-controls-locked"
                : ""
            }`}
          >
            <div className="original-games-control-label">
              GAME MODE
            </div>

            <div className="original-games-risk-tabs plinko-risk-wide">
              {Object.keys(
                PLINKO_RISK_CONFIG
              ).map(
                (value) => (
                  <button
                    type="button"
                    key={value}
                    className={
                      risk === value
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setRisk(
                        value
                      )
                    }
                    disabled={
                      controlsLocked
                    }
                  >
                    {value.toUpperCase()}
                  </button>
                )
              )}
            </div>

            <div className="original-games-control-label plinko-rows-label">
              ROWS
            </div>

            <div className="plinko-rows-control">
              <input
                type="range"
                min={
                  PLINKO_ROWS_MIN
                }
                max={
                  PLINKO_ROWS_MAX
                }
                step="1"
                value={rows}
                onChange={(
                  event
                ) =>
                  setRows(
                    Number(
                      event.target.value
                    )
                  )
                }
                disabled={
                  controlsLocked
                }
                aria-label="Plinko rows"
              />

              <div className="plinko-rows-values">
                <span>
                  8 ROWS
                </span>

                <strong>
                  {rows}
                </strong>

                <span>
                  16 ROWS
                </span>
              </div>
            </div>

            {plinkoMode === "auto" && (
              <div className="plinko-auto-controls">
                <div className="plinko-auto-field">
                  <label>NUMBER OF BETS</label>
                  <div className="plinko-auto-input-row">
                    <input
                      value={autoNumberOfBets}
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      onChange={(event) =>
                        setAutoNumberOfBets(
                          event.target.value
                        )
                      }
                      disabled={autoRunning}
                    />
                    <span>∞</span>
                  </div>
                  <small>0 = unlimited</small>
                </div>

                <div className="plinko-auto-rule">
                  <label>ON WIN</label>
                  <div className="plinko-auto-rule-row">
                    <div className="plinko-auto-toggle">
                      <button
                        type="button"
                        className={
                          autoOnWinMode === "reset"
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setAutoOnWinMode("reset")
                        }
                        disabled={autoRunning}
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        className={
                          autoOnWinMode === "increase"
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setAutoOnWinMode("increase")
                        }
                        disabled={autoRunning}
                      >
                        Increase By
                      </button>
                    </div>
                    <div className="plinko-percent-input">
                      <input
                        value={autoOnWinPercent}
                        type="number"
                        min="0"
                        step="0.1"
                        onChange={(event) =>
                          setAutoOnWinPercent(
                            event.target.value
                          )
                        }
                        disabled={
                          autoRunning ||
                          autoOnWinMode !== "increase"
                        }
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>

                <div className="plinko-auto-rule">
                  <label>ON LOSS</label>
                  <div className="plinko-auto-rule-row">
                    <div className="plinko-auto-toggle">
                      <button
                        type="button"
                        className={
                          autoOnLossMode === "reset"
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setAutoOnLossMode("reset")
                        }
                        disabled={autoRunning}
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        className={
                          autoOnLossMode === "increase"
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setAutoOnLossMode("increase")
                        }
                        disabled={autoRunning}
                      >
                        Increase By
                      </button>
                    </div>
                    <div className="plinko-percent-input">
                      <input
                        value={autoOnLossPercent}
                        type="number"
                        min="0"
                        step="0.1"
                        onChange={(event) =>
                          setAutoOnLossPercent(
                            event.target.value
                          )
                        }
                        disabled={
                          autoRunning ||
                          autoOnLossMode !== "increase"
                        }
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>

                <div className="plinko-auto-stop-grid">
                  <div className="plinko-auto-field">
                    <label>STOP ON PROFIT</label>
                    <div className="plinko-stop-input">
                      <span>+</span>
                      <input
                        value={autoStopProfit}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(event) =>
                          setAutoStopProfit(
                            event.target.value
                          )
                        }
                        disabled={autoRunning}
                      />
                      <span>$</span>
                    </div>
                  </div>

                  <div className="plinko-auto-field">
                    <label>STOP ON LOSS</label>
                    <div className="plinko-stop-input">
                      <span>-</span>
                      <input
                        value={autoStopLoss}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(event) =>
                          setAutoStopLoss(
                            event.target.value
                          )
                        }
                        disabled={autoRunning}
                      />
                      <span>$</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={
                    `original-games-primary plinko-auto-start ${
                      autoRunning ? "stop" : ""
                    }`
                  }
                  onClick={() =>
                    autoRunning
                      ? stopAutobet()
                      : void startAutobet()
                  }
                >
                  {autoRunning
                    ? "STOP AUTOBET"
                    : "START AUTOBET"}
                </button>

                <div className="plinko-auto-remaining">
                  <span>REMAINING BETS</span>
                  <strong>
                    {Number.isFinite(
                      autoRemainingBets
                    )
                      ? autoRemainingBets
                      : "∞"}
                  </strong>
                </div>

                <div className={`plinko-auto-session ${
                  autoSessionProfit > 0
                    ? "positive"
                    : autoSessionProfit < 0
                      ? "negative"
                      : ""
                }`}>
                  <span>SESSION PROFIT</span>
                  <strong>
                    {autoSessionProfit >= 0
                      ? "+"
                      : "-"}
                    ${Math.abs(
                      autoSessionProfit
                    ).toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            <div className="plinko-live-drops">
              <span className="plinko-live-dot" />

              <strong>
                {balls.length}
              </strong>{" "}
              active drop
              {balls.length ===
              1
                ? ""
                : "s"}
            </div>

            <div className="plinko-live-hint">
              {controlsLocked
                ? "Rows and risk are locked while balls are active."
                : "Drop again while balls are still travelling."}
            </div>

          </div>
        </aside>

        <section className="plinko-machine-panel">
          <div className="plinko-machine">
            <div
              ref={
                plinkoBoardRef
              }
              className="plinko-board"
              data-risk={
                risk
              }
              data-rows={
                activeRows
              }
              style={{
                "--plinko-rows":
                  activeRows,
                "--plinko-peg-gap":
                  `${plinkoPegGap}px`,
                "--plinko-peg-size":
                  `${plinkoPegSize}px`,
                "--plinko-peg-pitch":
                  `${plinkoPegPitch}px`,
                "--plinko-slot-gap":
                  `${plinkoSlotGap}px`,
                "--plinko-slot-rail-width":
                  `${plinkoSlotRailWidth}px`,
              }}
            >
              <div
                className="plinko-board-glow"
                aria-hidden="true"
              />

              {landedDrop &&
                Number(
                  landedDrop.rows
                ) ===
                  activeRows &&
                String(
                  landedDrop.risk
                ).toLowerCase() ===
                  String(
                    risk
                  ).toLowerCase() && (
                  <div
                    key={
                      impactKey
                    }
                    className={`plinko-impact-layer ${
                      Number(
                        landedDrop.result
                          ?.payoutCents ||
                          0
                      ) > 0
                        ? "win"
                        : "loss"
                    }`}
                    style={{
                      "--plinko-impact-x":
                        `${Number(
                          landedDrop.landingX
                        )}%`,
                    }}
                    aria-hidden="true"
                  >
                    <span className="plinko-impact-ring" />
                    <span className="plinko-impact-core" />

                    {Number(
                      landedDrop.result
                        ?.payoutCents ||
                        0
                    ) > 0 && (
                      <span className="plinko-impact-payout">
                        +{money(
                          Number(
                            landedDrop
                              .result
                              .payoutCents
                          )
                        )}
                      </span>
                    )}
                  </div>
                )}

              <div
                className="plinko-balls-layer"
                aria-hidden="true"
              >
                {balls.map(
                  (
                    ball
                  ) => (
                    <div
                      key={
                        ball.id
                      }
                      ref={(
                        element
                      ) => {
                        if (
                          element
                        ) {
                          plinkoBallRefs.current.set(
                            ball.id,
                            element
                          );
                        } else {
                          plinkoBallRefs.current.delete(
                            ball.id
                          );
                        }
                      }}
                      className="plinko-live-ball"
                    >
                      <span className="plinko-live-ball-trail" />
                      <span className="plinko-live-ball-glow" />
                      <span className="plinko-live-ball-core" />
                    </div>
                  )
                )}
              </div>

              <div
                className="plinko-peg-field"
                aria-hidden="true"
              >
                {Array.from(
                  {
                    length:
                      activeRows,
                  },
                  (
                    _,
                    rowIndex
                  ) => (
                    <div
                      className="plinko-pegs-row"
                      key={
                        rowIndex
                      }
                    >
                      {Array.from(
                        {
                          length:
                            rowIndex +
                            3,
                        },
                        (
                          _,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className="plinko-peg"
                          />
                        )
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              className="plinko-slots"
              style={{
                "--plinko-slot-count":
                  plinkoSlotCount,
                "--plinko-slot-gap":
                  `${plinkoSlotGap}px`,
                "--plinko-slot-rail-width":
                  `${plinkoSlotRailWidth}px`,
              }}
            >
              {slotMultipliers.map(
                (
                  multiplier,
                  index
                ) => {
                  const isLandedSlot =
                    landedDrop &&
                    Number(
                      landedDrop.rows
                    ) ===
                      activeRows &&
                    String(
                      landedDrop.risk
                    ).toLowerCase() ===
                      String(
                        risk
                      ).toLowerCase() &&
                    Number(
                      landedDrop.slotIndex
                    ) ===
                      index;

                  return (
                    <div
                      key={
                        index
                      }
                      className={`plinko-slot ${
                        isLandedSlot
                          ? `selected ${
                              Number(
                                landedDrop
                                  .result
                                  ?.payoutCents ||
                                  0
                              ) > 0
                                ? "win"
                                : "loss"
                            }`
                          : ""
                      }`}
                    >
                      <strong>
                        {Number(
                          multiplier
                        ).toFixed(
                          2
                        )}
                        ×
                      </strong>
                    </div>
                  );
                }
              )}
            </div>

            {lastResult && (
              <div
                className={`original-games-result-banner ${
                  Number(
                    lastResult.payoutCents
                  ) > 0
                    ? "win"
                    : "loss"
                }`}
              >
                <strong>
                  {Number(
                    lastResult.payoutCents
                  ) > 0
                    ? `WIN ${Number(
                        lastResult.multiplier
                      ).toFixed(
                        2
                      )}×`
                    : "NO PAYOUT"}
                </strong>

                <span>
                  {Number(
                    lastResult.payoutCents
                  ) > 0
                    ? `${money(
                        lastResult.payoutCents
                      )} returned`
                    : "The ball landed outside the winning payout"}
                  {` · ${Number(
                    lastResult.rows
                  )} rows · ${String(
                    lastResult.risk
                  ).toUpperCase()}`}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      <OriginalGameHistory
        game="plinko"
        authUser={
          authUser
        }
        refreshKey={
          historyRefresh
        }
      />
    </GameShell>
  );
}

function ChickenRoadGame({ balance, onBalanceChange, authUser }) {
  const [bet, setBet] = useState("1.00");
  const [difficulty, setDifficulty] = useState("easy");
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [lastMove, setLastMove] = useState(0);
  const [hypotheticalCrashStep, setHypotheticalCrashStep] = useState(null);
  const [chickenManualCameraShift, setChickenManualCameraShift] = useState(0);
  const [chickenRoadDragging, setChickenRoadDragging] = useState(false);
  const chickenRoadDragRef = useRef({
    dragging: false,
    startX: 0,
    startShift: 0,
    width: 1,
    pointerId: null,
  });

  const chickenDifficulties = useMemo(
    () => [
      {
        key: "easy",
        label: "Easy",
        collision: 14.22,
        tone: "easy",
        descriptor: "Relaxed",
      },
      {
        key: "medium",
        label: "Medium",
        collision: 19.43,
        tone: "medium",
        descriptor: "Balanced",
      },
      {
        key: "hard",
        label: "Hard",
        collision: 24.24,
        tone: "hard",
        descriptor: "Risky",
      },
      {
        key: "daredevil",
        label: "Daredevil",
        collision: 29.46,
        tone: "daredevil",
        descriptor: "Extreme",
      },
    ],
    []
  );

  const multipliers = useMemo(() => {
    const selected = chickenDifficulties.find((item) => item.key === difficulty) || chickenDifficulties[0];
    const survival = Math.max(0.01, 1 - selected.collision / 100);
    return Array.from({ length: CHICKEN_STEPS_CLIENT + 1 }, (_, index) => {
      if (index === 0) return 1;
      return Math.max(1, Number((0.93 / Math.pow(survival, index)).toFixed(2)));
    });
  }, [difficulty, chickenDifficulties]);

  useEffect(() => {
    if (!authUser) {
      setRound(null);
      return;
    }

    let cancelled = false;

    const loadActive = async () => {
      try {
        const response = await apiFetch(`${API}/api/originals/chicken/active`, {
          cache: "no-store",
        });
        const data = await readJson(response);

        if (!cancelled && response.ok && data.round) {
          setRound(data.round);
          if (data.round.difficulty) {
            setDifficulty(String(data.round.difficulty).toLowerCase());
          }
        }
      } catch (loadError) {
        console.error("Chicken Road active round load failed:", loadError);
      }
    };

    void loadActive();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  useEffect(() => {
    const activeStep = Number(round?.step || 0);
    if (activeStep !== lastMove) {
      setLastMove(activeStep);
    }
  }, [round?.step]);

  const currentDifficulty =
    chickenDifficulties.find((item) => item.key === String(round?.difficulty || difficulty).toLowerCase()) ||
    chickenDifficulties[0];

  const roundMultipliers = Array.isArray(round?.multipliers) && round.multipliers.length
    ? round.multipliers
    : multipliers;

  const currentMultiplier = Number(round?.multiplier || roundMultipliers[Number(round?.step || 0)] || 1);
  const progress = Math.min(CHICKEN_STEPS_CLIENT, Number(round?.step || 0));
  const visualProgress = round?.status === "lost" ? Math.min(CHICKEN_STEPS_CLIENT, progress + 1) : progress;
  const displayedHypotheticalCrashStep =
    Number(
      round?.hypotheticalCrashStep ??
      hypotheticalCrashStep ??
      0
    ) || null;
  const hypotheticalCrashLane =
    round?.status === "cashed_out" &&
    displayedHypotheticalCrashStep &&
    displayedHypotheticalCrashStep > progress
      ? displayedHypotheticalCrashStep - 1
      : -1;
  const active = round?.status === "active";
  const finished = Boolean(round && !active);
  const cameraProgress = Math.min(
    CHICKEN_STEPS_CLIENT,
    Math.max(0, Number(visualProgress || progress || 0))
  );
  const chickenRoadAutoCameraShift = useMemo(() => {
    const lanePercent = 100 / CHICKEN_STEPS_CLIENT;
    const maxShift = -(100 - (CHICKEN_VISIBLE_LANES / CHICKEN_STEPS_CLIENT) * 100);
    return Math.max(
      maxShift,
      Math.min(0, (3 - cameraProgress) * lanePercent)
    );
  }, [cameraProgress]);

  const chickenRoadMaxManualShift =
    -(100 - (CHICKEN_VISIBLE_LANES / CHICKEN_STEPS_CLIENT) * 100);

  const chickenRoadCameraShift = (() => {
    const manualMax =
      Math.abs(chickenRoadMaxManualShift);
    const manualOffset = Math.max(
      chickenRoadMaxManualShift,
      Math.min(0, chickenManualCameraShift)
    );

    // The game keeps its automatic forward camera movement, while the
    // player can still grab the road and pan farther left to inspect
    // later lanes at any point during an active round.
    const combinedShift =
      chickenRoadAutoCameraShift + manualOffset;

    return Math.max(
      -manualMax,
      Math.min(0, combinedShift)
    );
  })();

  const chickenRoadPointerDown = (event) => {
    if (loading) return;

    const rect = event.currentTarget.getBoundingClientRect();
    chickenRoadDragRef.current = {
      dragging: true,
      startX: event.clientX,
      startShift: chickenManualCameraShift,
      width: Math.max(1, rect.width),
      pointerId: event.pointerId,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is not supported in every browser.
    }

    setChickenRoadDragging(true);
  };

  const chickenRoadPointerMove = (event) => {
    const drag = chickenRoadDragRef.current;
    if (!drag.dragging || loading) return;

    const deltaX = event.clientX - drag.startX;
    const visibleFraction = CHICKEN_VISIBLE_LANES / CHICKEN_STEPS_CLIENT;
    // Dragging toward the left pans the camera toward later lanes.
    const shiftDelta =
      (deltaX / drag.width) * visibleFraction * 100;

    setChickenManualCameraShift(
      Math.max(
        chickenRoadMaxManualShift,
        Math.min(0, drag.startShift + shiftDelta)
      )
    );
  };

  const chickenRoadPointerUp = (event) => {
    const drag = chickenRoadDragRef.current;
    if (!drag.dragging) return;

    try {
      if (drag.pointerId != null) {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      }
    } catch {
      // Ignore pointer capture cleanup failures.
    }

    chickenRoadDragRef.current = {
      dragging: false,
      startX: 0,
      startShift: 0,
      width: 1,
      pointerId: null,
    };
    setChickenRoadDragging(false);
  };
  const chickenPlayerLeft = useMemo(() => {
    // Start on the left sidewalk before the first crossing.
    if (cameraProgress <= 0) return 3.2;

    // Once all lanes are crossed, move onto the right sidewalk.
    if (cameraProgress >= CHICKEN_STEPS_CLIENT) return 96.5;

    const visibleRoadPercent =
      (CHICKEN_VISIBLE_LANES / CHICKEN_STEPS_CLIENT) * 100;
    const lanePercent = 100 / CHICKEN_STEPS_CLIENT;
    const worldLaneCenter = (cameraProgress - 0.5) * lanePercent;
    const viewportPercent =
      ((worldLaneCenter + chickenRoadCameraShift) / visibleRoadPercent) * 100;

    return 7 + (viewportPercent / 100) * 86;
  }, [cameraProgress, chickenRoadCameraShift]);

  const start = async () => {
    if (loading) return;
    if (!authUser) {
      setError("Please sign in before playing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API}/api/originals/chicken/start`, {
        method: "POST",
        body: JSON.stringify({
          betAmount: bet,
          difficulty,
        }),
      });
      const data = await readJson(response);

      if (!response.ok) throw new Error(data.error || "CHICKEN_START_FAILED");

      setRound(data.round);
      setHypotheticalCrashStep(null);
      setChickenManualCameraShift(0);
      setLastMove(0);
      if (data.round?.difficulty) {
        setDifficulty(String(data.round.difficulty).toLowerCase());
      }
      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
    } catch (err) {
      setError(err.message || "Unable to start Chicken Road.");
    } finally {
      setLoading(false);
    }
  };

  const step = async () => {
    if (!round || loading || round.status !== "active") return;

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API}/api/originals/chicken/step`, {
        method: "POST",
        body: JSON.stringify({ roundId: Number(round.roundId) }),
      });
      const data = await readJson(response);

      if (!response.ok) throw new Error(data.error || "CHICKEN_STEP_FAILED");

      setRound(data.round);
      setHypotheticalCrashStep(null);
      setHistoryRefresh((value) => value + 1);

      if (data.round?.status === "lost") {
        playChickenHitSound();
      } else {
        playChickenCrossSound();

        if (data.round?.status === "won") {
          window.setTimeout(
            () => playChickenCashoutSound(),
            90
          );
        }
      }

      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
    } catch (err) {
      setError(err.message || "Unable to cross the next lane.");
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if (!round || loading || round.status !== "active" || Number(round.step) <= 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`${API}/api/originals/chicken/cashout`, {
        method: "POST",
        body: JSON.stringify({ roundId: Number(round.roundId) }),
      });
      const data = await readJson(response);

      if (!response.ok) throw new Error(data.error || "CHICKEN_CASHOUT_FAILED");

      setRound(data.round);
      setHypotheticalCrashStep(
        Number(
          data.round?.hypotheticalCrashStep ??
          data.hypotheticalCrashStep ??
          0
        ) || null
      );
      setHistoryRefresh((value) => value + 1);
      playChickenCashoutSound();

      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
    } catch (err) {
      setError(err.message || "Unable to cash out.");
    } finally {
      setLoading(false);
    }
  };

  // Keep traffic visually readable on the 20-lane board. The reference layout
  // uses traffic in selected lanes rather than filling every lane at once.
  const laneTraffic = [
    { lane: 1, variant: "blue", top: "19%", delay: "-1.8s", duration: "8.4s" },
    { lane: 3, variant: "red", top: "61%", delay: "-4.2s", duration: "9.6s" },
    { lane: 5, variant: "green", top: "45%", delay: "-2.6s", duration: "10.2s" },
    { lane: 6, variant: "blue", top: "41%", delay: "-5.4s", duration: "8.9s" },
    { lane: 7, variant: "orange", top: "46%", delay: "-1.2s", duration: "9.8s" },
    { lane: 9, variant: "yellow", top: "29%", delay: "-6.1s", duration: "10.6s" },
    { lane: 10, variant: "orange", top: "31%", delay: "-3.7s", duration: "9.1s" },
    { lane: 11, variant: "purple", top: "15%", delay: "-7.0s", duration: "10.8s" },
    { lane: 12, variant: "green", top: "52%", delay: "-4.8s", duration: "9.4s" },
    { lane: 13, variant: "blue", top: "47%", delay: "-2.9s", duration: "10.1s" },
    { lane: 15, variant: "red", top: "72%", delay: "-6.4s", duration: "9.7s" },
    { lane: 16, variant: "yellow", top: "44%", delay: "-3.1s", duration: "10.9s" },
    { lane: 18, variant: "orange", top: "25%", delay: "-5.7s", duration: "9.3s" },
    { lane: 19, variant: "purple", top: "43%", delay: "-1.9s", duration: "10.4s" },
    { lane: 14, variant: "red", top: "65%", delay: "-4.5s", duration: "9.9s" },
    { lane: 17, variant: "blue", top: "37%", delay: "-7.6s", duration: "10.7s" },
    { lane: 20, variant: "green", top: "76%", delay: "-2.2s", duration: "9.5s" },
  ];

  const laneCars = laneTraffic;

  return (
    <GameShell
      game="chicken"
      onClose={() => onClose?.()}
      balance={balance}
      message=""
      error={error}
      hideHeading
    >
      <div className="chicken-experience">
        <div className="chicken-game-shell">
        <div className="chicken-top-grid">
          <div className="chicken-title-block">
            <div className="eyebrow">CASEX ORIGINAL</div>
            <div className="chicken-title-row">
              <h1>Chicken Road</h1>
              <span className="chicken-live-pill"><i /> LIVE</span>
            </div>
            <p>Cross the road. Lock in your multiplier before the traffic gets you.</p>
          </div>

          <div className={`chicken-run-state ${active ? "active" : finished ? round?.status === "lost" ? "loss" : "win" : "ready"}`}>
            <span />
            {active
              ? `${currentDifficulty.label.toUpperCase()} · LANE ${progress + 1}/${CHICKEN_STEPS_CLIENT}`
              : finished
                ? round.status === "lost" ? "RUN ENDED · CAUGHT" : "RUN ENDED · PAYOUT LOCKED"
                : `READY · ${currentDifficulty.label.toUpperCase()}`}
          </div>
        </div>


        <div className="chicken-main-layout">
          <section className="chicken-road-card">
            <div className="chicken-road-header">
              <div>
                <span>MISSION</span>
                <strong>UNCROSS THE ROAD</strong>
              </div>
              <div className="chicken-road-header-multiplier">
                <small>CURRENT MULTIPLIER</small>
                <strong>{currentMultiplier.toFixed(2)}×</strong>
              </div>
            </div>

            <div className="chicken-road-scene-v2">
              <div className="chicken-sky-v2">
                <div className="chicken-cloud cloud-one" />
                <div className="chicken-cloud cloud-two" />
                <div className="chicken-sun-v2">☀</div>
              </div>

              <div className="chicken-horizon-v2" />
              <div className="chicken-sidewalk left" />
              <div className="chicken-sidewalk right" />

              <div
                className={`chicken-road-camera ${chickenRoadDragging ? "dragging" : ""}`}
                onPointerDown={chickenRoadPointerDown}
                onPointerMove={chickenRoadPointerMove}
                onPointerUp={chickenRoadPointerUp}
                onPointerCancel={chickenRoadPointerUp}
                onPointerLeave={(event) => {
                  if (chickenRoadDragRef.current.dragging) {
                    chickenRoadPointerMove(event);
                  }
                }}
                role="application"
                aria-label="Chicken Road. Hold and drag left to browse later lanes and multipliers during or before a round."
              >
                <div className="chicken-road-drag-hint" aria-hidden="true">
                    <span>✋</span> HOLD & DRAG LEFT TO BROWSE
                </div>

                <div
                  className="chicken-road-v2"
                  style={{
                    gridTemplateColumns: `repeat(${CHICKEN_STEPS_CLIENT}, minmax(0, 1fr))`,
                    transform: `translateX(${chickenRoadCameraShift}%)`,
                  }}
                >
                {Array.from({ length: CHICKEN_STEPS_CLIENT }, (_, index) => (
                  <div
                    key={`road-lane-${index}`}
                    className={`chicken-road-lane ${index < progress ? "cleared" : ""} ${index === progress ? "next" : ""} ${index === hypotheticalCrashLane ? "hypothetical-crash" : ""}`}
                  >
                    <span className="chicken-lane-number">{index + 1}</span>
                    <span className="chicken-lane-multiplier">{Number(roundMultipliers[index + 1] || multipliers[index + 1] || 1).toFixed(2)}×</span>
                    <span className="chicken-lane-glow" />
                    {index === hypotheticalCrashLane && (
                      <span className="chicken-hypothetical-crash" aria-label={`Chicken would have been hit on lane ${index + 1}`}>
                        <b>✕</b>
                        <small>WOULD HAVE HIT</small>
                      </span>
                    )}
                  </div>
                ))}

                {laneCars.map((car, index) => {
                  // Traffic stays active ahead of the chicken, but once the
                  // chicken reaches a lane, that lane and every cleared lane
                  // become static. This prevents a car from continuing to
                  // drive through the chicken after the chicken has crossed.
                  const trafficFrozen = car.lane <= progress;

                  return (
                    <div
                      key={`traffic-${index}`}
                      className={`chicken-traffic-car ${car.variant} ${
                        trafficFrozen ? "passed" : ""
                      }`}
                      style={{
                        left: `${((car.lane - 0.5) / CHICKEN_STEPS_CLIENT) * 100}%`,
                        top: car.top,
                        animationDelay: car.delay,
                        animationDuration: car.duration,
                        animationDirection: car.lane % 2 === 0 ? "normal" : "reverse",
                        animationPlayState: trafficFrozen
                          ? "paused"
                          : "running",
                      }}
                    >
                      <span className="car-body">
                        <span className="car-window" />
                        <span className="car-light one" />
                        <span className="car-light two" />
                      </span>
                    </div>
                  );
                })}

                  <div className="chicken-finish-gate">
                    <span>✦</span>
                    FINISH
                  </div>
                </div>
              </div>

              <div
                key={`chicken-runner-${lastMove}`}
                className={`chicken-road-avatar ${round?.status === "lost" ? "caught" : ""} ${active ? "running" : ""}`}
                style={{ left: `${chickenPlayerLeft}%` }}
              >
                <span className="chicken-avatar-shadow" />
                <span className="chicken-avatar-bird">🐔</span>
              </div>

              {round?.status === "cashed_out" && (
                <div className="chicken-cashout-result" aria-live="polite">
                  <strong>{currentMultiplier.toFixed(2)}×</strong>
                  <span>{money(round.payoutCents)} paid · board revealed</span>
                </div>
              )}

            </div>

            <div className="chicken-road-footer">
              <div className="chicken-road-tip">
                <span>⚠</span>
                <div>
                  <strong>Watch the traffic</strong>
                  <small>Each crossing locks in a higher multiplier.</small>
                </div>
              </div>
              <div className="chicken-road-progress">
                <span>{progress}/{CHICKEN_STEPS_CLIENT} LANES</span>
                <div><i style={{ width: `${(progress / CHICKEN_STEPS_CLIENT) * 100}%` }} /></div>
              </div>
              {round?.status === "cashed_out" && displayedHypotheticalCrashStep && (
                <div className="chicken-cashout-preview">
                  <span>✕</span>
                  <div>
                    <strong>TRAFFIC PREVIEW</strong>
                    <small>
                      You cashed out on lane {progress}. The chicken would have been hit on lane {displayedHypotheticalCrashStep}.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="chicken-control-column">
            {!active ? (
              <div className="chicken-control-card chicken-setup-card">
                <div className="chicken-control-heading">
                  <div>
                    <span>CHOOSE YOUR RISK</span>
                    <strong>Difficulty</strong>
                  </div>
                  <span className="chicken-info-badge">i</span>
                </div>

                <div className="chicken-difficulty-grid">
                  {chickenDifficulties.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`chicken-difficulty-option ${item.tone} ${difficulty === item.key ? "active" : ""}`}
                      onClick={() => {
                        setDifficulty(item.key);
                        setRound(null);
                        setHypotheticalCrashStep(null);
                        setChickenManualCameraShift(0);
                        setLastMove(0);
                      }}
                      disabled={loading}
                    >
                      <span className="difficulty-dot" />
                      <span className="difficulty-name">{item.label}</span>
                      <span className="difficulty-risk">{item.collision}% COLLISION</span>
                      <span className="difficulty-desc">{item.descriptor}</span>
                    </button>
                  ))}
                </div>

                <div className="chicken-bet-section">
                  <div className="chicken-control-heading compact">
                    <div>
                      <span>STAKE</span>
                      <strong>Bet Amount</strong>
                    </div>
                  </div>
                  <BetBox
                    value={bet}
                    setValue={setBet}
                    disabled={loading}
                    onBet={start}
                    balance={balance}
                    maxBet={100}
                    button={loading ? "STARTING..." : "START CHICKEN ROAD"}
                  />
                </div>
              </div>
            ) : (
              <div className="chicken-control-card chicken-live-card">
                <div className="chicken-live-card-top">
                  <div>
                    <span>RUNNING · {currentDifficulty.label.toUpperCase()}</span>
                    <strong>{currentMultiplier.toFixed(2)}×</strong>
                  </div>
                  <span className="chicken-risk-chip">{currentDifficulty.collision.toFixed(2)}% HIT</span>
                </div>

                <div className="chicken-payout-highlight">
                  <span>POTENTIAL PAYOUT</span>
                  <strong>{money(round.potentialPayoutCents)}</strong>
                </div>

                <button
                  type="button"
                  className="chicken-cross-button"
                  onClick={step}
                  disabled={loading}
                >
                  <span>{loading ? "CROSSING..." : `CROSS LANE ${progress + 1}`}</span>
                  <b>→</b>
                </button>

                <button
                  type="button"
                  className="chicken-cashout-button"
                  onClick={cashout}
                  disabled={loading || progress <= 0}
                >
                  {loading ? "PROCESSING..." : `CASH OUT · ${money(round.potentialPayoutCents)}`}
                </button>

                <div className="chicken-live-details">
                  <div><span>BET</span><strong>{money(round.betCents)}</strong></div>
                  <div><span>LANE</span><strong>{progress}/{CHICKEN_STEPS_CLIENT}</strong></div>
                  <div><span>HIT CHANCE</span><strong>{currentDifficulty.collision.toFixed(2)}%</strong></div>
                </div>
              </div>
            )}

            {finished && round.status === "lost" && (
              <div className="chicken-finished-card loss">
                <span>✕</span>
                <div>
                  <strong>RUN ENDED</strong>
                  <small>The traffic caught your chicken.</small>
                </div>
              </div>
            )}

          </aside>
        </div>

        </div>
        <OriginalGameHistory
          game="chicken"
          authUser={authUser}
          refreshKey={historyRefresh}
        />
      </div>
    </GameShell>
  );
}

function CoinflipGame({ balance, onBalanceChange, authUser, onClose }) {
  const [bet, setBet] = useState("1.00");
  const [choice, setChoice] = useState("heads");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingOutcome, setPendingOutcome] = useState(null);
  const [recentFlips, setRecentFlips] = useState([]);
  const [error, setError] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const coinAudioRef = useRef(null);
  const flipTimerRef = useRef(null);
  const coinElRef = useRef(null);
  const coinAnimationFrameRef = useRef(null);
  const coinAnimationTokenRef = useRef(0);
  const coinRotationRef = useRef(0);
  const coinAnimationControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      coinAnimationTokenRef.current += 1;

      if (flipTimerRef.current) {
        window.clearTimeout(flipTimerRef.current);
      }

      if (coinAnimationFrameRef.current) {
        window.cancelAnimationFrame(coinAnimationFrameRef.current);
      }
    };
  }, []);

  const playCoinFlipSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = coinAudioRef.current || new AudioContextClass();
      coinAudioRef.current = context;

      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      const now = context.currentTime;

      for (let index = 0; index < 5; index += 1) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = index % 2 === 0 ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(
          270 + index * 75,
          now + index * 0.09
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          520 + index * 95,
          now + index * 0.09 + 0.08
        );

        gain.gain.setValueAtTime(
          0.0001,
          now + index * 0.09
        );
        gain.gain.exponentialRampToValueAtTime(
          0.045,
          now + index * 0.09 + 0.008
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + index * 0.09 + 0.12
        );

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + index * 0.09);
        oscillator.stop(now + index * 0.09 + 0.14);
      }

      window.setTimeout(() => {
        try {
          const landing = context.createOscillator();
          const landingGain = context.createGain();

          landing.type = "sine";
          landing.frequency.setValueAtTime(180, context.currentTime);
          landing.frequency.exponentialRampToValueAtTime(
            95,
            context.currentTime + 0.11
          );

          landingGain.gain.setValueAtTime(0.0001, context.currentTime);
          landingGain.gain.exponentialRampToValueAtTime(
            0.07,
            context.currentTime + 0.008
          );
          landingGain.gain.exponentialRampToValueAtTime(
            0.0001,
            context.currentTime + 0.13
          );

          landing.connect(landingGain);
          landingGain.connect(context.destination);
          landing.start();
          landing.stop(context.currentTime + 0.15);
        } catch {
          // Sound must never interrupt gameplay.
        }
      }, 640);
    } catch {
      // Sound must never interrupt gameplay.
    }
  };

  const playCoinWinSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = coinAudioRef.current || new AudioContextClass();
      coinAudioRef.current = context;

      const resumePromise =
        context.state === "suspended" ? context.resume() : Promise.resolve();

      resumePromise.catch(() => {});

      const now = context.currentTime;

      // Bright three-note cash/chime with a short sparkle tail.
      const notes = [
        { frequency: 784, start: 0.00, duration: 0.16, volume: 0.065 },
        { frequency: 988, start: 0.085, duration: 0.18, volume: 0.075 },
        { frequency: 1175, start: 0.175, duration: 0.24, volume: 0.09 },
      ];

      notes.forEach(({ frequency, start, duration, volume }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + start);
        oscillator.detune.setValueAtTime(4, now + start);

        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(
          volume,
          now + start + 0.012
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + start + duration
        );

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + start);
        oscillator.stop(now + start + duration + 0.02);
      });

      // Tiny high-frequency sparkle at the end.
      const sparkle = context.createOscillator();
      const sparkleGain = context.createGain();
      sparkle.type = "triangle";
      sparkle.frequency.setValueAtTime(1568, now + 0.27);
      sparkle.frequency.exponentialRampToValueAtTime(2093, now + 0.39);
      sparkleGain.gain.setValueAtTime(0.0001, now + 0.27);
      sparkleGain.gain.exponentialRampToValueAtTime(0.026, now + 0.285);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.43);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(context.destination);
      sparkle.start(now + 0.27);
      sparkle.stop(now + 0.45);
    } catch {
      // Sound must never interrupt gameplay.
    }
  };

  const applyCoinMotion = (angle, lift = 0, scale = 1, roll = 0) => {
    const coin = coinElRef.current;
    coinRotationRef.current = angle;

    if (!coin) return;

    coin.style.setProperty("--coin-angle", `${angle}deg`);
    coin.style.setProperty("--coin-lift", `${lift}px`);
    coin.style.setProperty("--coin-scale", String(scale));
    coin.style.setProperty("--coin-roll", `${roll}deg`);

    /*
     * The old implementation relied on nested 3D transforms. In the live
     * page those transforms were being overridden by the legacy Coin Flip
     * styles, which is why only Heads could remain visible.
     *
     * Instead, drive the two physical faces directly from the exact same
     * rotation value used by the animation. At the edge-on point the current
     * face is almost zero-width, then the opposite face expands immediately.
     * This is a continuous 2-sided coin flip with no timer or React rerender.
     */
    const headsFace = coin.querySelector(".coinflip-heads-layer");
    const tailsFace = coin.querySelector(".coinflip-tails-layer");

    if (headsFace && tailsFace) {
      const radians = (angle * Math.PI) / 180;
      const faceScaleX = Math.max(0.028, Math.abs(Math.cos(radians)));
      coin.style.setProperty(
        "--coin-edge-scale",
        faceScaleX.toFixed(5)
      );
      const normalized = ((angle % 360) + 360) % 360;
      const showHeads = normalized < 90 || normalized >= 270;

      const faceTransform =
        `scaleX(${faceScaleX.toFixed(5)}) translateZ(2px)`;

      headsFace.style.setProperty(
        "transform",
        faceTransform,
        "important"
      );
      tailsFace.style.setProperty(
        "transform",
        faceTransform,
        "important"
      );

      headsFace.style.setProperty(
        "opacity",
        showHeads ? "1" : "0",
        "important"
      );
      tailsFace.style.setProperty(
        "opacity",
        showHeads ? "0" : "1",
        "important"
      );

      headsFace.style.setProperty(
        "visibility",
        showHeads ? "visible" : "hidden",
        "important"
      );
      tailsFace.style.setProperty(
        "visibility",
        showHeads ? "hidden" : "visible",
        "important"
      );

      /* Slight shading at the narrow edge makes the flip feel physical. */
      const edgeLight = 0.94 + faceScaleX * 0.06;
      headsFace.style.setProperty(
        "filter",
        `brightness(${showHeads ? edgeLight.toFixed(3) : "1"})`,
        "important"
      );
      tailsFace.style.setProperty(
        "filter",
        `brightness(${showHeads ? "1" : edgeLight.toFixed(3)})`,
        "important"
      );
    }

    coin.style.setProperty(
      "transform",
      `translateY(${lift}px) rotateZ(${roll}deg) scale(${scale})`,
      "important"
    );
  };

  const setCoinToSide = (side) => {
    const angle = String(side).toLowerCase() === "tails" ? 180 : 0;
    coinAnimationTokenRef.current += 1;

    if (coinAnimationFrameRef.current) {
      window.cancelAnimationFrame(coinAnimationFrameRef.current);
      coinAnimationFrameRef.current = null;
    }

    coinAnimationControllerRef.current = null;
    applyCoinMotion(angle, 0, 1, 0);
  };

  const cancelCoinAnimation = (resetSide = choice) => {
    coinAnimationTokenRef.current += 1;

    if (coinAnimationFrameRef.current) {
      window.cancelAnimationFrame(coinAnimationFrameRef.current);
      coinAnimationFrameRef.current = null;
    }

    coinAnimationControllerRef.current = null;
    setCoinToSide(resetSide);
  };

  const startCoinAnimation = (startingSide) => {
    const startAngle =
      String(startingSide).toLowerCase() === "tails" ? 180 : 0;

    coinAnimationTokenRef.current += 1;
    const token = coinAnimationTokenRef.current;

    if (coinAnimationFrameRef.current) {
      window.cancelAnimationFrame(coinAnimationFrameRef.current);
    }

    let angle = startAngle;
    let lastTimestamp = performance.now();
    let spinElapsed = 0;
    let currentAngularVelocity = 0;

    let landingRequestedOutcome = null;
    let landingStartedAt = null;
    let landingFrom = startAngle;
    let landingTarget = null;
    let landingDuration = 0;
    let landingStartVelocity = 0;
    let landingResolver = null;

    applyCoinMotion(angle, 0, 1, 0);

    const beginLanding = (outcome, timestamp) => {
      const finalOffset =
        String(outcome).toLowerCase() === "tails" ? 180 : 0;

      landingFrom = angle;

      const currentNormalized = ((angle % 360) + 360) % 360;
      let extra = finalOffset - currentNormalized;
      extra = ((extra % 360) + 360) % 360;

      // Three full turns plus the exact amount needed to land on
      // the server-selected face. This keeps the destination deterministic.
      const distance = 1080 + extra;

      /*
       * The live spin is already at the maximum cruise speed when landing
       * begins. The landing curve below is constructed so its initial
       * velocity is exactly the current velocity and then falls smoothly
       * to zero with zero acceleration at the finish.
       */
      landingStartVelocity = Math.max(currentAngularVelocity, 1.44);
      landingDuration = (2 * distance) / landingStartVelocity;
      landingTarget = landingFrom + distance;
      landingStartedAt = timestamp;
    };

    const requestLanding = (outcome) =>
      new Promise((resolve) => {
        landingRequestedOutcome = outcome;
        landingResolver = resolve;
      });

    const frame = (timestamp) => {
      if (coinAnimationTokenRef.current !== token) return;

      const delta = Math.min(34, timestamp - lastTimestamp);
      lastTimestamp = timestamp;

      if (landingTarget == null) {
        /*
         * Smoothly ramp into the cruise speed instead of kicking the coin
         * from 0 to full rotation speed on the first frame.
         */
        spinElapsed += delta;
        const rampProgress = Math.min(1, spinElapsed / 220);
        const ramp = rampProgress * rampProgress * (3 - 2 * rampProgress);

        currentAngularVelocity = 1.44 * ramp;
        angle += delta * currentAngularVelocity;

        /*
         * Keep the supporting motion very subtle. The actual 3D geometry
         * creates the edge-on effect, so we do not fight it with large
         * scale or vertical oscillations.
         */
        applyCoinMotion(angle, 0, 1, 0);

        /*
         * Do not let an ultra-fast API response cut the acceleration ramp.
         * Once the coin has reached cruise speed, start the final landing.
         */
        if (landingRequestedOutcome !== null && rampProgress >= 1) {
          beginLanding(landingRequestedOutcome, timestamp);
          landingRequestedOutcome = null;
        }
      } else {
        const progress = Math.min(
          1,
          (timestamp - landingStartedAt) / landingDuration
        );

        /*
         * Minimum-jerk-style position curve with a non-zero starting slope:
         * f(u) = 2u - 2u^3 + u^4
         *
         * f'(0) = 2, so physical starting velocity is exactly
         * landingStartVelocity. f''(0) = f''(1) = 0, avoiding the
         * acceleration jolt that the previous ease-out produced.
         */
        const u = progress;
        const easedDistance =
          2 * u -
          2 * u * u * u +
          u * u * u * u;

        angle =
          landingFrom +
          (landingTarget - landingFrom) * easedDistance;

        // A tiny lift and scale arc, both with zero velocity at the ends.
        const arc = Math.sin(Math.PI * progress);
        const lift = -(arc * arc) * 8;
        const scale = 1 + (arc * arc) * 0.022;

        applyCoinMotion(angle, lift, scale, 0);

        if (progress >= 1) {
          applyCoinMotion(landingTarget, 0, 1, 0);

          coinAnimationFrameRef.current = null;
          coinAnimationControllerRef.current = null;
          landingResolver?.();
          return;
        }
      }

      coinAnimationFrameRef.current = window.requestAnimationFrame(frame);
    };

    coinAnimationFrameRef.current = window.requestAnimationFrame(frame);

    const controller = {
      land: requestLanding,
    };

    coinAnimationControllerRef.current = controller;
    return controller;
  };

  const chooseSide = (nextChoice) => {
    if (loading) return;
    setChoice(nextChoice);
    setResult(null);
    setPendingOutcome(null);
    setCoinToSide(nextChoice);
  };

  const setCoinflipHalfBet = () => {
    if (loading) return;
    const cents = parseAmountToCentsClient(bet);
    if (cents == null) return;

    const nextCents = Math.max(
      COINFLIP_MIN_BET_CENTS,
      Math.floor(cents / 2)
    );

    setBet((nextCents / 100).toFixed(2));
  };

  const setCoinflipDoubleBet = () => {
    if (loading) return;
    const cents = parseAmountToCentsClient(bet);
    if (cents == null) return;

    const nextCents = Math.min(
      COINFLIP_MAX_BET_CENTS,
      cents * 2
    );

    setBet((nextCents / 100).toFixed(2));
  };

  const setCoinflipMaxBet = () => {
    if (loading) return;

    const balanceCents = Math.max(
      0,
      Math.floor(Number(balance || 0) * 100)
    );

    const maxCents = Math.min(
      COINFLIP_MAX_BET_CENTS,
      balanceCents
    );

    if (maxCents >= COINFLIP_MIN_BET_CENTS) {
      setBet((maxCents / 100).toFixed(2));
    }
  };

  const settleCoinflipRound = async (roundId) => {
    if (!Number.isSafeInteger(Number(roundId)) || Number(roundId) <= 0) {
      throw new Error("INVALID_COINFLIP_ROUND");
    }

    let lastError = null;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        const response = await apiFetch(`${API}/api/originals/coinflip/resolve`, {
          method: "POST",
          body: JSON.stringify({ roundId: Number(roundId) }),
        });
        const data = await readJson(response);

        if (response.ok) {
          return data;
        }

        if (data?.error === "COINFLIP_SETTLEMENT_NOT_READY") {
          const retryAfterMs = Math.max(75, Number(data.retryAfterMs || 150));
          await new Promise((resolve) => window.setTimeout(resolve, retryAfterMs));
          continue;
        }

        lastError = new Error(data?.error || "COINFLIP_RESOLVE_FAILED");
      } catch (err) {
        lastError = err;
      }

      if (attempt < 11) {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
    }

    throw lastError || new Error("COINFLIP_RESOLVE_FAILED");
  };

  const flip = async () => {
    if (loading) return;
    if (!authUser) {
      setError("Please sign in before playing.");
      return;
    }

    const requestedBetCents = parseAmountToCentsClient(bet);
    if (
      requestedBetCents == null ||
      requestedBetCents < COINFLIP_MIN_BET_CENTS ||
      requestedBetCents > COINFLIP_MAX_BET_CENTS
    ) {
      setError("Bet must be between $0.10 and $100.00.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setPendingOutcome(null);

    if (flipTimerRef.current) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }

    const coinAnimation = startCoinAnimation(choice);

    playCoinFlipSound();

    try {
      const response = await apiFetch(`${API}/api/originals/coinflip/flip`, {
        method: "POST",
        body: JSON.stringify({ betAmount: bet, choice }),
      });
      const data = await readJson(response);

      if (!response.ok) throw new Error(data.error || "COINFLIP_FAILED");

      const nextResult = data.result;
      const normalizedOutcome =
        String(nextResult?.outcome || "heads").toLowerCase();

      setPendingOutcome(normalizedOutcome);

      // The wager is deducted immediately. This balance is deliberately
      // the post-bet balance returned by the flip endpoint.
      if (data.newBalanceCents != null) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }

      // Do not settle/credit anything until the coin has completely landed.
      await coinAnimation.land(normalizedOutcome);

      // Only now does the server credit a winning payout.
      const settled = await settleCoinflipRound(nextResult?.roundId);
      const settledResult = settled?.result || nextResult;

      if (settled?.newBalanceCents != null) {
        onBalanceChange?.(Number(settled.newBalanceCents) / 100);
      }

      setResult(settledResult);
      setPendingOutcome(null);
      if (Boolean(settledResult?.win)) {
        playCoinWinSound();
      }
      setRecentFlips((current) => [
        {
          outcome: normalizedOutcome,
          win: Boolean(settledResult?.win),
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        ...current,
      ].slice(0, 12));
      setHistoryRefresh((value) => value + 1);
    } catch (err) {
      cancelCoinAnimation(choice);
      if (err?.name === "AbortError") return;
      setPendingOutcome(null);
      setError(err.message || "Unable to flip the coin.");
    } finally {
      setLoading(false);
    }
  };

  const displayedMultiplier = Number(result?.multiplier || 1.95);
  const displayedPayout = Number(result?.payoutCents || 0);
  const betCents = parseAmountToCentsClient(bet);
  const estimatedWinCents =
    Number.isFinite(betCents) ? Math.round(betCents * displayedMultiplier) : 0;
  const visibleOutcome =
    String(result?.outcome || pendingOutcome || choice || "heads").toLowerCase();
  const restingCoinSide = result?.outcome || choice || "heads";
  const restingCoinClass =
    String(restingCoinSide).toLowerCase() === "tails"
      ? "coinflip-side-tails"
      : "coinflip-side-heads";

  return (
    <GameShell
      game="coinflip"
      onClose={() => onClose?.()}
      balance={balance}
      message=""
      error={error}
    >
      <style>{`
        /* =========================================================
           CASEX COINFLIP — BET CONTROLS MATCH PLINKO
           ========================================================= */

        .original-games-page.original-games-coinflip .coinflip-bet-main-row {
          display: grid !important;
          grid-template-columns: minmax(0,1fr) auto !important;
          align-items: stretch !important;
          gap: 8px !important;
        }

        .original-games-page.original-games-coinflip .coinflip-bet-input {
          min-width: 0 !important;
        }

        .original-games-page.original-games-coinflip .coinflip-bet-shortcuts {
          display: grid !important;
          grid-template-columns: repeat(3, auto) !important;
          gap: 2px !important;
          align-self: stretch !important;
          min-width: 110px !important;
          padding: 2px !important;
          border: 1px solid rgba(92,88,130,.34) !important;
          border-radius: 10px !important;
          background: #17192c !important;
        }

        .original-games-page.original-games-coinflip .coinflip-bet-shortcuts button {
          min-width: 34px !important;
          min-height: 100% !important;
          padding: 0 9px !important;
          border: 0 !important;
          border-radius: 7px !important;
          background: transparent !important;
          color: #fff !important;
          font-size: 9px !important;
          font-weight: 1000 !important;
          cursor: pointer !important;
        }

        .original-games-page.original-games-coinflip .coinflip-bet-shortcuts button:hover:not(:disabled) {
          background: rgba(132,72,241,.25) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-bet-shortcuts button:disabled {
          opacity: .45 !important;
          cursor: not-allowed !important;
        }

        @media(max-width:700px){
          .original-games-page.original-games-coinflip .coinflip-bet-main-row {
            grid-template-columns: minmax(0,1fr) !important;
          }

          .original-games-page.original-games-coinflip .coinflip-bet-shortcuts {
            min-height: 38px !important;
          }
        }

        /* =========================================================
           CASEX COINFLIP — PREMIUM VISUAL REFINEMENT
           Keep the guaranteed H/T alternation from React, but restore
           the heavier metallic coin, bevels, rim, shine and bounce.
           ========================================================= */

        .original-games-page.original-games-coinflip .coinflip-coin {
          width: 226px !important;
          height: 226px !important;
          margin: 0 0 6px !important;
          position: relative !important;
          display: grid !important;
          place-items: center !important;
          border-radius: 50% !important;
          transform-style: preserve-3d !important;
          -webkit-transform-style: preserve-3d !important;
          transform-origin: 50% 50% !important;
          will-change: transform !important;
          overflow: visible !important;
          transition: transform .18s cubic-bezier(.22,.82,.25,1), filter .18s ease !important;
          filter:
            drop-shadow(0 28px 24px rgba(0,0,0,.30))
            drop-shadow(0 0 30px rgba(187,129,255,.08));
        }

        /* Thick metallic edge behind the active face. */
        .original-games-page.original-games-coinflip .coinflip-coin::before {
          content: "" !important;
          position: absolute !important;
          inset: 3px !important;
          border-radius: 50% !important;
          z-index: 0 !important;
          transform: scaleX(var(--coin-edge-scale, 1)) translateZ(-10px) !important;
          border: 4px solid rgba(255,214,123,.28) !important;
          background:
            repeating-linear-gradient(
              90deg,
              #9b5b12 0 3px,
              #c67a1a 3px 6px
            ) !important;
          box-shadow:
            0 9px 0 rgba(49,27,6,.92),
            0 20px 32px rgba(0,0,0,.30) !important;
          pointer-events: none !important;
        }

        .original-games-page.original-games-coinflip .coinflip-coin.tails::before {
          border-color: rgba(194,211,255,.30) !important;
          background:
            repeating-linear-gradient(
              90deg,
              #344b78 0 3px,
              #536fa6 3px 6px
            ) !important;
          box-shadow:
            0 9px 0 rgba(18,31,63,.94),
            0 20px 32px rgba(0,0,0,.30) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-coin.heads::before {
          border-color: rgba(255,214,123,.30) !important;
        }

        /* One face is rendered by React at a time. Never let the legacy
           two-face CSS rotate, hide or animate that active face. */
        .original-games-page.original-games-coinflip .coinflip-coin .coinflip-visible-face {
          position: absolute !important;
          inset: 0 !important;
          z-index: 2 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 4px !important;
          margin: 0 !important;
          border-radius: 50% !important;
          backface-visibility: visible !important;
          -webkit-backface-visibility: visible !important;
          visibility: visible !important;
          opacity: 1 !important;
          transform: none !important;
          -webkit-transform: none !important;
          animation: none !important;
          overflow: hidden !important;
          border-width: 7px !important;
        }

        .original-games-page.original-games-coinflip .coinflip-coin .coinflip-visible-face::before {
          content: "" !important;
          position: absolute !important;
          inset: 14px !important;
          border-radius: 50% !important;
          border: 2px solid rgba(255,248,214,.34) !important;
          box-shadow:
            inset 0 0 0 2px rgba(117,67,9,.16),
            0 0 0 1px rgba(255,255,255,.10) !important;
          pointer-events: none !important;
        }

        .original-games-page.original-games-coinflip .coinflip-coin .coinflip-visible-face::after {
          content: "" !important;
          position: absolute !important;
          width: 58% !important;
          height: 23% !important;
          left: 15% !important;
          top: 8% !important;
          border-radius: 50% !important;
          background: rgba(255,255,255,.19) !important;
          filter: blur(8px) !important;
          transform: rotate(-16deg) !important;
          pointer-events: none !important;
        }

        .original-games-page.original-games-coinflip .coinflip-coin .coinflip-visible-face.heads-face {
          border-color: rgba(255,246,214,.88) !important;
          background:
            radial-gradient(circle at 32% 25%,
              #fff8c9 0%,
              #ffe48a 15%,
              #f2b637 48%,
              #bf7415 78%,
              #7b450b 100%) !important;
          box-shadow:
            0 20px 56px rgba(240,173,55,.28),
            inset 0 2px 0 rgba(255,255,255,.48),
            inset 0 -14px 26px rgba(102,52,5,.20),
            inset 0 0 0 3px rgba(126,72,9,.22) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-coin .coinflip-visible-face.tails-face {
          border-color: rgba(226,234,255,.84) !important;
          background:
            radial-gradient(circle at 32% 25%,
              #f4f7ff 0%,
              #c7d5ff 16%,
              #829bea 47%,
              #5069bd 76%,
              #2f3f78 100%) !important;
          box-shadow:
            0 20px 56px rgba(90,129,219,.27),
            inset 0 2px 0 rgba(255,255,255,.42),
            inset 0 -14px 26px rgba(20,31,72,.22),
            inset 0 0 0 3px rgba(49,71,135,.24) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-visible-face .coinflip-face-letter {
          position: relative !important;
          z-index: 3 !important;
          font-size: 86px !important;
          line-height: .84 !important;
          font-weight: 1000 !important;
          color: #fff !important;
          text-shadow:
            0 3px 0 rgba(0,0,0,.17),
            0 6px 16px rgba(0,0,0,.24) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-visible-face small {
          position: relative !important;
          z-index: 3 !important;
          margin-top: 1px !important;
          color: rgba(255,255,255,.88) !important;
          font-size: 10px !important;
          line-height: 1 !important;
          letter-spacing: 2.6px !important;
          font-weight: 950 !important;
          text-shadow: 0 1px 5px rgba(0,0,0,.18) !important;
        }

        /* Smooth physical flip: full face -> thin edge -> full face.
           React swaps H/T exactly at each half-cycle. */
        .original-games-page.original-games-coinflip .coinflip-coin.coinflip-visual-flipping {
          animation: casexPremiumCoinFlipCycle 360ms cubic-bezier(.42,0,.58,1) infinite !important;
          transform-style: preserve-3d !important;
          -webkit-transform-style: preserve-3d !important;
          perspective: 900px !important;
          -webkit-perspective: 900px !important;
        }

        .original-games-page.original-games-coinflip .coinflip-coin.coinflip-visual-flipping .coinflip-visible-face {
          animation: none !important;
        }

        @keyframes casexPremiumCoinFlipCycle {
          0% {
            transform: translateY(5px) rotateZ(-2deg) scaleX(1) scaleY(.98);
            filter:
              drop-shadow(0 26px 22px rgba(0,0,0,.28))
              drop-shadow(0 0 29px rgba(187,129,255,.08));
          }
          18% {
            transform: translateY(-2px) rotateZ(1deg) scaleX(.94) scaleY(1.01);
          }
          35% {
            transform: translateY(-7px) rotateZ(1.5deg) scaleX(.72) scaleY(1.03);
          }
          50% {
            transform: translateY(-10px) rotateZ(1.8deg) scaleX(.075) scaleY(1.055);
            filter:
              drop-shadow(0 12px 15px rgba(0,0,0,.18))
              drop-shadow(0 0 22px rgba(187,129,255,.11));
          }
          65% {
            transform: translateY(-7px) rotateZ(-1.1deg) scaleX(.72) scaleY(1.03);
          }
          82% {
            transform: translateY(-2px) rotateZ(-.6deg) scaleX(.94) scaleY(1.01);
          }
          100% {
            transform: translateY(5px) rotateZ(0) scaleX(1) scaleY(.98);
            filter:
              drop-shadow(0 28px 24px rgba(0,0,0,.30))
              drop-shadow(0 0 30px rgba(187,129,255,.08));
          }
        }

        @media(max-width:1000px){
          .original-games-page.original-games-coinflip .coinflip-coin{
            width: 208px !important;
            height: 208px !important;
          }
          .original-games-page.original-games-coinflip .coinflip-visible-face .coinflip-face-letter{
            font-size: 76px !important;
          }
        }

        @media(max-width:700px){
          .original-games-page.original-games-coinflip .coinflip-coin{
            width: 178px !important;
            height: 178px !important;
          }
          .original-games-page.original-games-coinflip .coinflip-visible-face .coinflip-face-letter{
            font-size: 65px !important;
          }
        }

        /* =========================================================
           CASEX COINFLIP — TRUE PHYSICAL 3D FLIP
           Two fixed faces rotate with the coin itself. No timed H/T
           swapping, no CSS animation restarts, no snapping.
           ========================================================= */

        .original-games-page.original-games-coinflip .coinflip-stage {
          perspective: none !important;
          -webkit-perspective: none !important;
          perspective-origin: 50% 50% !important;
          overflow: visible !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-coin {
          transform-style: flat !important;
          -webkit-transform-style: flat !important;
          transform-origin: 50% 50% !important;
          transform:
            translateY(var(--coin-lift, 0px))
            rotateZ(var(--coin-roll, 0deg))
            scale(var(--coin-scale, 1)) !important;
          transition: none !important;
          animation: none !important;
          will-change: transform !important;
          backface-visibility: visible !important;
          -webkit-backface-visibility: visible !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-coin::before {
          content: "" !important;
          position: absolute !important;
          inset: 3px !important;
          z-index: 0 !important;
          border-radius: 50% !important;
          transform: scaleX(var(--coin-edge-scale, 1)) translateZ(-10px) !important;
          border: 4px solid rgba(255,214,123,.28) !important;
          background:
            repeating-linear-gradient(
              90deg,
              #9b5b12 0 3px,
              #c67a1a 3px 6px
            ) !important;
          box-shadow:
            0 9px 0 rgba(49,27,6,.92),
            0 20px 32px rgba(0,0,0,.30) !important;
          pointer-events: none !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-side-tails::before {
          border-color: rgba(194,211,255,.30) !important;
          background:
            repeating-linear-gradient(
              90deg,
              #344b78 0 3px,
              #536fa6 3px 6px
            ) !important;
          box-shadow:
            0 9px 0 rgba(18,31,63,.92),
            0 20px 32px rgba(0,0,0,.30) !important;
        }

        /* During the flip, keep the same neutral metallic rim. The rim follows
           the exact edge scale calculated by applyCoinMotion, so it never
           becomes a full purple/blue disc behind the coin faces. */
        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-physical-flipping::before {
          border-color: rgba(255,214,123,.28) !important;
          background:
            repeating-linear-gradient(
              90deg,
              #9b5b12 0 3px,
              #c67a1a 3px 6px
            ) !important;
          box-shadow:
            0 9px 0 rgba(49,27,6,.92),
            0 20px 32px rgba(0,0,0,.30) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face {
          position: absolute !important;
          inset: 0 !important;
          z-index: 2 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 4px !important;
          margin: 0 !important;
          border-radius: 50% !important;
          visibility: visible !important;
          opacity: 1 !important;
          overflow: hidden !important;
          animation: none !important;
          backface-visibility: hidden !important;
          -webkit-backface-visibility: hidden !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face.heads-face,
        .original-games-page.original-games-coinflip .coinflip-physical-face.tails-face {
          transform: scaleX(1) translateZ(2px) !important;
        }

        /* Resting state: show exactly one face. During a flip, JavaScript
           takes over both opacity/visibility values frame-by-frame. */
        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-side-heads .coinflip-tails-layer {
          visibility: hidden !important;
          opacity: 0 !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-side-heads .coinflip-heads-layer {
          visibility: visible !important;
          opacity: 1 !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-side-tails .coinflip-heads-layer {
          visibility: hidden !important;
          opacity: 0 !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-side-tails .coinflip-tails-layer {
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* During the physical rotation, never let legacy selectors hide
           or fade either side. The 3D geometry controls visibility. */
        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-physical-flipping .coinflip-physical-face,
        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-physical-flipping .coinflip-physical-face.heads-face,
        .original-games-page.original-games-coinflip .coinflip-physical-coin.coinflip-physical-flipping .coinflip-physical-face.tails-face {
          visibility: visible !important;
          opacity: 1 !important;
          backface-visibility: visible !important;
          -webkit-backface-visibility: visible !important;
          animation: none !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face::before {
          content: "" !important;
          position: absolute !important;
          inset: 14px !important;
          border-radius: 50% !important;
          border: 2px solid rgba(255,248,214,.34) !important;
          box-shadow:
            inset 0 0 0 2px rgba(117,67,9,.16),
            0 0 0 1px rgba(255,255,255,.10) !important;
          pointer-events: none !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face::after {
          content: "" !important;
          position: absolute !important;
          width: 58% !important;
          height: 23% !important;
          left: 15% !important;
          top: 8% !important;
          border-radius: 50% !important;
          background: rgba(255,255,255,.19) !important;
          filter: blur(8px) !important;
          transform: rotate(-16deg) !important;
          pointer-events: none !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face.heads-face {
          border-color: rgba(255,246,214,.88) !important;
          background:
            radial-gradient(circle at 32% 25%,
              #fff8c9 0%,
              #ffe48a 15%,
              #f2b637 48%,
              #bf7415 78%,
              #7b450b 100%) !important;
          box-shadow:
            0 20px 56px rgba(240,173,55,.28),
            inset 0 2px 0 rgba(255,255,255,.48),
            inset 0 -14px 26px rgba(102,52,5,.20),
            inset 0 0 0 3px rgba(126,72,9,.22) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face.tails-face {
          border-color: rgba(226,234,255,.84) !important;
          background:
            radial-gradient(circle at 32% 25%,
              #f4f7ff 0%,
              #c7d5ff 16%,
              #829bea 47%,
              #5069bd 76%,
              #2f3f78 100%) !important;
          box-shadow:
            0 20px 56px rgba(90,129,219,.27),
            inset 0 2px 0 rgba(255,255,255,.42),
            inset 0 -14px 26px rgba(20,31,72,.22),
            inset 0 0 0 3px rgba(49,71,135,.24) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face .coinflip-face-letter {
          position: relative !important;
          z-index: 3 !important;
          font-size: 86px !important;
          line-height: .84 !important;
          font-weight: 1000 !important;
          color: #fff !important;
          text-shadow:
            0 3px 0 rgba(0,0,0,.17),
            0 6px 16px rgba(0,0,0,.24) !important;
        }

        .original-games-page.original-games-coinflip .coinflip-physical-face small {
          position: relative !important;
          z-index: 3 !important;
          margin-top: 1px !important;
          color: rgba(255,255,255,.88) !important;
          font-size: 10px !important;
          line-height: 1 !important;
          letter-spacing: 2.6px !important;
          font-weight: 950 !important;
          text-shadow: 0 1px 5px rgba(0,0,0,.18) !important;
        }

        @media(max-width:1000px){
          .original-games-page.original-games-coinflip .coinflip-physical-coin {
            width: 208px !important;
            height: 208px !important;
          }
          .original-games-page.original-games-coinflip .coinflip-physical-face .coinflip-face-letter {
            font-size: 76px !important;
          }
        }

        @media(max-width:700px){
          .original-games-page.original-games-coinflip .coinflip-physical-coin {
            width: 178px !important;
            height: 178px !important;
          }
          .original-games-page.original-games-coinflip .coinflip-physical-face .coinflip-face-letter {
            font-size: 65px !important;
          }
        }

      `}</style>

      <div className="coinflip-layout">
        <div className="coinflip-main-card original-games-board-card">
          <div className="coinflip-stage">
            <div className="coinflip-stage-glow" />

            <div
              ref={coinElRef}
              className={`coinflip-coin coinflip-physical-coin ${
                loading ? "coinflip-physical-flipping" : ""
              } ${!loading ? restingCoinClass : ""}`}
              aria-label={
                result
                  ? `Coin landed on ${visibleOutcome}`
                  : "Coinflip coin"
              }
              style={{
                "--coin-angle": `${
                  String(restingCoinSide).toLowerCase() === "tails" ? 180 : 0
                }deg`,
                "--coin-lift": "0px",
                "--coin-scale": "1",
                "--coin-roll": "0deg",
                "--coin-edge-scale": "1",
              }}
            >
              <div className="coinflip-face heads-face coinflip-physical-face coinflip-heads-layer">
                <span className="coinflip-face-letter">H</span>
                <small>HEADS</small>
              </div>

              <div className="coinflip-face tails-face coinflip-physical-face coinflip-tails-layer">
                <span className="coinflip-face-letter">T</span>
                <small>TAILS</small>
              </div>
            </div>

            {!result && !loading && (
              <div className="coinflip-ready">
                <span>CALL YOUR FLIP</span>
                <strong>
                  {choice === "heads" ? "Heads" : "Tails"} selected
                </strong>
              </div>
            )}
          </div>

          {result?.win && (
            <div className="coinflip-result-overlay win">
              <span className="coinflip-overlay-label">YOU WON</span>
              <strong>{displayedMultiplier.toFixed(2)}×</strong>
              <small>{money(displayedPayout)} PAID</small>
            </div>
          )}

          {result && (
            <div className={`coinflip-result ${result.win ? "win" : "loss"}`}>
              <strong>{String(result.outcome || "").toUpperCase()}</strong>
              <span>
                {result.win
                  ? `${displayedMultiplier.toFixed(2)}× · ${money(displayedPayout)}`
                  : "The coin landed the other way"}
              </span>
            </div>
          )}

          <div className="coinflip-recent">
            <div className="coinflip-recent-head">
              <span>RECENT FLIPS</span>
              <small>Last 12</small>
            </div>
            <div className="coinflip-recent-list">
              {recentFlips.length > 0 ? (
                recentFlips.map((flipResult) => (
                  <span
                    key={flipResult.id}
                    className={`${flipResult.outcome} ${
                      flipResult.win ? "win" : "loss"
                    }`}
                    title={`${flipResult.outcome} · ${
                      flipResult.win ? "Won" : "Lost"
                    }`}
                  >
                    {flipResult.outcome === "heads" ? "H" : "T"}
                  </span>
                ))
              ) : (
                <span className="empty">No flips yet</span>
              )}
            </div>
          </div>
        </div>

        <aside className="original-games-sidebar coinflip-sidebar">
          <div className="coinflip-bet-card original-games-control-card">
            <div className="coinflip-side-selector">
              <div className="coinflip-choice-heading coinflip-sidebar-heading">
                <span>CHOOSE YOUR SIDE</span>
                <strong>Call it before the flip</strong>
              </div>

              <div className="coinflip-choice-row coinflip-sidebar-choice-row">
                <button
                  type="button"
                  className={choice === "heads" ? "active" : ""}
                  onClick={() => chooseSide("heads")}
                  disabled={loading}
                >
                  <span>H</span>
                  <div>
                    <strong>Heads</strong>
                    <small>50% chance</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={choice === "tails" ? "active" : ""}
                  onClick={() => chooseSide("tails")}
                  disabled={loading}
                >
                  <span>T</span>
                  <div>
                    <strong>Tails</strong>
                    <small>50% chance</small>
                  </div>
                </button>
              </div>
            </div>

            <div className="coinflip-control-divider" />
            <div className="coinflip-side-label">BET AMOUNT</div>

            <div className="plinko-bet-main-row coinflip-bet-main-row">
              <div className="original-games-bet-input plinko-bet-input-large coinflip-bet-input">
                <span>$</span>
                <input
                  value={bet}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  onChange={(event) =>
                    setBet(normalizeCoinflipBetInput(event.target.value))
                  }
                  disabled={loading}
                />
              </div>

              <div className="plinko-bet-shortcuts coinflip-bet-shortcuts">
                <button
                  type="button"
                  onClick={setCoinflipHalfBet}
                  disabled={loading}
                >
                  1/2
                </button>
                <button
                  type="button"
                  onClick={setCoinflipDoubleBet}
                  disabled={loading}
                >
                  2X
                </button>
                <button
                  type="button"
                  onClick={setCoinflipMaxBet}
                  disabled={loading}
                >
                  Max
                </button>
              </div>
            </div>

            <div className="coinflip-payout-preview">
              <div>
                <span>WIN MULTIPLIER</span>
                <strong>1.95×</strong>
              </div>
              <div>
                <span>POTENTIAL PAYOUT</span>
                <strong>{money(estimatedWinCents)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="original-games-primary coinflip-flip-button"
              onClick={flip}
              disabled={loading}
            >
              {loading ? "FLIPPING..." : "FLIP COIN"}
            </button>
          </div>


        </aside>

        <OriginalGameHistory
          game="coinflip"
          authUser={authUser}
          refreshKey={historyRefresh}
        />
      </div>
    </GameShell>
  );
}

function MinesGame({ authUser, openAuth, onBalanceChange, soundEnabled, balance }) {
  const gridOptions = [3, 5, 7];
  const mineOptions = {
    3: Array.from({ length: 8 }, (_, index) => index + 1),
    5: Array.from({ length: 24 }, (_, index) => index + 1),
    7: Array.from({ length: 48 }, (_, index) => index + 1),
  };

  const HOUSE_EDGE = 0.03;
  const [gridSize, setGridSize] = useState(5);
  const [mineCount, setMineCount] = useState(3);
  const [betAmount, setBetAmount] = useState("10.00");
  const [game, setGame] = useState(null);
  const [revealingTile, setRevealingTile] = useState(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [recentGames, setRecentGames] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [mineMenuOpen, setMineMenuOpen] = useState(false);
  const [requestingTile, setRequestingTile] = useState(null);
  const [viewingBet, setViewingBet] = useState(null);

  const minesAudioRef = useRef(null);

  const getMinesAudio = () => {
    if (!soundEnabled || typeof window === "undefined") return null;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!minesAudioRef.current) {
      minesAudioRef.current = new AudioCtx();
    }

    if (minesAudioRef.current.state === "suspended") {
      void minesAudioRef.current.resume().catch(() => {});
    }

    return minesAudioRef.current;
  };

  const primeMinesAudio = () => {
    if (!soundEnabled) return;
    getMinesAudio();
  };

  const playMineSafeSound = () => {
    const ctx = getMinesAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  };

  const playMineExplosionSound = () => {
    const ctx = getMinesAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.34, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  };

  const playMineCashoutSound = () => {
    const ctx = getMinesAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    [392, 494, 587].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = index * 0.07;

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now + delay);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.095, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  };

  useEffect(() => {
    return () => {
      const context = minesAudioRef.current;
      if (context && context.state !== "closed") {
        void context.close();
      }
      minesAudioRef.current = null;
    };
  }, []);

  const totalTiles = gridSize * gridSize;
  const safeTiles = Math.max(0, totalTiles - mineCount);
  const pregameNextSafe = totalTiles > 0 ? safeTiles / totalTiles : 0;
  const pregameNextMine = Math.max(0, 1 - pregameNextSafe);

  const getPreviewMultiplier = (revealedCount) => {
    if (revealedCount <= 0) return 1;
    let survival = 1;
    for (let i = 0; i < revealedCount; i += 1) {
      survival *= (safeTiles - i) / (totalTiles - i);
    }
    return survival > 0 ? Math.max(1, (1 - HOUSE_EDGE) / survival) : 1;
  };

  const currentMultiplier = game
    ? Number(game.currentMultiplier || 1)
    : 1;
  const currentBetCents = game
    ? Number(game.betCents || 0)
    : Math.round(Number(betAmount || 0) * 100);
  const potentialWinCents = game
    ? Number(game.potentialWinCents || 0)
    : Math.floor(currentBetCents * getPreviewMultiplier(0));
  const active = game?.status === "active";
  const finished = game && game.status !== "active";
  const revealedPositions = new Set(
    Array.isArray(game?.revealedPositions) ? game.revealedPositions.map(Number) : []
  );
  const minePositions = new Set(
    Array.isArray(game?.minePositions) ? game.minePositions.map(Number) : []
  );

  const loadRecentGames = async () => {
    if (!authUser) {
      setRecentGames([]);
      return;
    }
    try {
      const response = await apiFetch(`${API}/api/mines/recent`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setRecentGames(Array.isArray(data.games) ? data.games : []);
    } catch (error) {
      console.error("Mines recent-games load failed:", error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadActiveGame = async () => {
      if (!authUser) {
        setGame(null);
        setLoadingGame(false);
        setErrorMessage("");
        setRecentGames([]);
        return;
      }

      setLoadingGame(true);
      setErrorMessage("");

      try {
        const response = await apiFetch(`${API}/api/mines/active`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) return;
          throw new Error(data?.error || "MINES_ACTIVE_GAME_FAILED");
        }

        if (cancelled) return;

        if (Number.isFinite(Number(data?.balanceCents))) {
          onBalanceChange?.(Number(data.balanceCents) / 100);
        }

        if (data?.game) {
          setGame(data.game);
          setGridSize(Number(data.game.gridSize));
          setMineCount(Number(data.game.mineCount));
          setMineMenuOpen(false);
          setBetAmount((Number(data.game.betCents) / 100).toFixed(2));
        } else {
          setGame(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Mines active-game load failed:", error);
          setErrorMessage("Unable to load your Mines game. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) setLoadingGame(false);
      }
    };

    void loadActiveGame();
    void loadRecentGames();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  useEffect(() => {
    const allowed = mineOptions[gridSize] || [];
    if (!allowed.includes(mineCount)) {
      setMineCount(allowed[0] || 1);
    }
  }, [gridSize]);

  const startGame = async () => {
    if (actionLoading || loadingGame) return;
    if (!authUser) {
      openAuth("login");
      return;
    }

    const numericBet = Number(betAmount);
    if (!Number.isFinite(numericBet) || numericBet <= 0) {
      setErrorMessage("Enter a valid bet amount.");
      return;
    }

    setActionLoading(true);
    setErrorMessage("");
    primeMinesAudio();

    try {
      const response = await apiFetch(`${API}/api/mines/start`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    gridSize,
    mineCount,
    betAmount: numericBet.toFixed(2),
  }),
});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "MINES_START_FAILED");

      setGame(data.game);
      setBetAmount((Number(data.game.betCents) / 100).toFixed(2));
      if (Number.isFinite(Number(data.newBalanceCents))) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
    } catch (error) {
      console.error("Mines start failed:", error);
      if (error?.message === "INSUFFICIENT_BALANCE") {
        setErrorMessage("You don't have enough balance for this bet.");
      } else if (error?.message === "ACTIVE_GAME_EXISTS") {
        setErrorMessage("You already have an active Mines game.");
      } else {
        setErrorMessage("The Mines game could not be started. Please try again.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const revealTile = async (index) => {
    if (!active || actionLoading || revealedPositions.has(index)) return;

    setActionLoading(true);
    setRevealingTile(index);
    setRequestingTile(index);
    setErrorMessage("");
    primeMinesAudio();

    try {
      const response = await apiFetch(`${API}/api/mines/reveal`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    gameId: Number(game.gameId),
    tileIndex: index,
  }),
});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "MINES_REVEAL_FAILED");

      setGame(data.game);
      if (
        data.newBalanceCents != null &&
        Number.isFinite(Number(data.newBalanceCents))
      ) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }

      if (data.game?.status === "lost") {
        playMineExplosionSound();
      } else if (data.game?.status === "active") {
        playMineSafeSound();
      } else if (data.game?.status === "cashed_out") {
        playMineCashoutSound();
      }

      if (data.game?.status !== "active") {
        await loadRecentGames();
      }
    } catch (error) {
      console.error("Mines reveal failed:", error);
      if (error?.message === "TILE_ALREADY_REVEALED") {
        setErrorMessage("That tile has already been revealed.");
      } else if (error?.message === "GAME_ALREADY_FINISHED") {
        setErrorMessage("This Mines game has already finished.");
      } else {
        setErrorMessage("The tile could not be revealed. Please try again.");
      }
    } finally {
      setRevealingTile(null);
      setRequestingTile(null);
      setActionLoading(false);
    }
  };

  const cashOut = async () => {
    if (!active || actionLoading || revealedPositions.size === 0) return;

    setActionLoading(true);
    setErrorMessage("");
    primeMinesAudio();

    try {
      const response = await apiFetch(`${API}/api/mines/cashout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId: Number(game.gameId) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "MINES_CASHOUT_FAILED");

      setGame(data.game);
      if (
        data.newBalanceCents != null &&
        Number.isFinite(Number(data.newBalanceCents))
      ) {
        onBalanceChange?.(Number(data.newBalanceCents) / 100);
      }
      playMineCashoutSound();
      await loadRecentGames();
    } catch (error) {
      console.error("Mines cashout failed:", error);
      if (error?.message === "NO_TILES_REVEALED") {
        setErrorMessage("Reveal at least one safe tile before cashing out.");
      } else {
        setErrorMessage("Cash out failed. Please try again.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const newGame = () => {
    setGame(null);
    setMineMenuOpen(false);
    setErrorMessage("");
    setRevealingTile(null);
  };

  const nextSafeProbability = game
    ? Number(game.nextSafeProbability || 0)
    : pregameNextSafe;
  const nextMineProbability = game
    ? Number(game.nextMineProbability || 0)
    : pregameNextMine;

  return (
    <GameShell
      game="mines"
      balance={balance}
      message=""
      error=""
    >
      <div className="mines-integrated">
        <div className="mines-layout">
          <aside className="mines-controls-card">
            <div className="mines-control-block">
              <div className="eyebrow">GRID SIZE</div>
              <div className="mines-grid-options">
                {gridOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={gridSize === size ? "active" : ""}
                    onClick={() => {
                      if (!active && !actionLoading) {
                        setGridSize(size);
                        setMineMenuOpen(false);
                        setErrorMessage("");
                      }
                    }}
                    disabled={active || actionLoading}
                  >
                    {size} × {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mines-control-block">
              <div className="eyebrow">MINES</div>
              <div className="mines-select-wrap">
                <button
                  type="button"
                  className={`mines-select ${mineMenuOpen ? "open" : ""}`}
                  onClick={() => {
                    if (!active && !actionLoading) setMineMenuOpen((open) => !open);
                  }}
                  disabled={active || actionLoading}
                  aria-haspopup="listbox"
                  aria-expanded={mineMenuOpen}
                >
                  <span>{mineCount}</span>
                  <span className="mines-select-arrow">⌄</span>
                </button>

                {mineMenuOpen && !active && !actionLoading && (
                  <div className="mines-options-menu" role="listbox" aria-label="Mine count">
                    {(mineOptions[gridSize] || []).map((count) => (
                      <button
                        key={count}
                        type="button"
                        role="option"
                        aria-selected={mineCount === count}
                        className={`mines-option ${mineCount === count ? "active" : ""}`}
                        onClick={() => {
                          setMineCount(count);
                          setMineMenuOpen(false);
                          setErrorMessage("");
                        }}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mines-control-block">
              <div className="eyebrow">BET AMOUNT</div>
              <div className="mines-input-wrap">
                <span>$</span>
                <input
                  type="number"
                  min="0.10"
                  max="100"
                  step="0.01"
                  value={active ? (Number(currentBetCents) / 100).toFixed(2) : betAmount}
                  onChange={(event) => {
                    if (!active && !actionLoading) setBetAmount(event.target.value);
                  }}
                  disabled={active || actionLoading}
                />
              </div>

              <div className="mines-quick-bets">
                <button
                  type="button"
                  onClick={() => {
                    if (active || actionLoading) return;
                    const cents = Math.round(Number(betAmount) * 100);
                    if (Number.isFinite(cents) && cents > 0) {
                      const nextCents = Math.max(10, Math.floor(cents / 2));
                      setBetAmount((Math.min(10000, nextCents) / 100).toFixed(2));
                    }
                  }}
                  disabled={active || actionLoading}
                >
                  1/2
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (active || actionLoading) return;
                    const cents = Math.round(Number(betAmount) * 100);
                    if (Number.isFinite(cents) && cents > 0) {
                      const nextCents = Math.min(10000, cents * 2);
                      setBetAmount((nextCents / 100).toFixed(2));
                    }
                  }}
                  disabled={active || actionLoading}
                >
                  2X
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (active || actionLoading) return;
                    const balanceCents = Math.max(
                      0,
                      Math.floor(Number(balance || 0) * 100)
                    );
                    const maxCents = Math.min(10000, balanceCents);

                    if (maxCents >= 10) {
                      setBetAmount((maxCents / 100).toFixed(2));
                    }
                  }}
                  disabled={active || actionLoading}
                >
                  Max
                </button>
              </div>
            </div>

            <div className="mines-odds-box">
              <div>
                <span>Next tile safe</span>
                <strong>{(nextSafeProbability * 100).toFixed(2)}%</strong>
              </div>
              <div>
                <span>Mine chance</span>
                <strong>{(nextMineProbability * 100).toFixed(2)}%</strong>
              </div>
            </div>

            {!active ? (
              <button
                type="button"
                className="mines-start-button"
                onClick={startGame}
                disabled={loadingGame || actionLoading}
              >
                {loadingGame ? "LOADING..." : actionLoading ? "STARTING..." : "START GAME"}
              </button>
            ) : (
              <button
                type="button"
                className="mines-start-button mines-cashout-button"
                onClick={cashOut}
                disabled={actionLoading || revealedPositions.size === 0}
              >
                {actionLoading ? "PROCESSING..." : revealedPositions.size === 0 ? "REVEAL A TILE" : `CASH OUT $${(potentialWinCents / 100).toFixed(2)}`}
              </button>
            )}

            {errorMessage && (
              <div className="mines-error">{errorMessage}</div>
            )}
          </aside>

          <div className="mines-main-column">
            <div className={`mines-board mines-board-${gridSize} ${active ? "is-active" : ""} ${finished ? "is-finished" : ""}`}>
              {Array.from({ length: totalTiles }, (_, index) => {
                const isRevealed = revealedPositions.has(index);
                const isMine = minePositions.has(index);
                const showFinishedBoard = Boolean(finished);
                const isShown = isRevealed || showFinishedBoard;
                const disabled =
                  loadingGame ||
                  actionLoading ||
                  (!active && !finished) ||
                  isRevealed ||
                  finished;

                return (
                  <button
                    key={index}
                    type="button"
                    className={`mines-tile ${isShown && !isMine ? "revealed" : ""} ${isMine && showFinishedBoard ? "mine" : ""} ${revealingTile === index ? "is-revealing" : ""} ${requestingTile === index ? "is-pending" : ""}`}
                    onPointerDown={() => {
                      if (active && !actionLoading && !revealedPositions.has(index)) {
                        primeMinesAudio();
                        setRequestingTile(index);
                      }
                    }}
                    onClick={() => revealTile(index)}
                    disabled={disabled}
                    aria-label={isMine && showFinishedBoard ? "Mine" : isShown ? "Safe tile" : "Hidden tile"}
                  >
                    {isMine && showFinishedBoard ? "✕" : isShown ? "◆" : requestingTile === index ? "…" : "?"}
                  </button>
                );
              })}

              {game?.status === "cashed_out" && (
                <div className="mines-result-overlay" aria-live="polite">
                  <strong>{currentMultiplier.toFixed(2)}×</strong>
                  <span>
                    ${(Number(game.payoutCents || 0) / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="mines-stats-bar">
              <div>
                <span>Tiles Left</span>
                <strong>{game ? Number(game.tilesLeft || 0) : safeTiles}</strong>
              </div>
              <div>
                <span>Current Multiplier</span>
                <strong>{currentMultiplier.toFixed(2)}x</strong>
              </div>
              <div>
                <span>Potential Win</span>
                <strong>${(potentialWinCents / 100).toFixed(2)}</strong>
              </div>
            </div>
            <div className="mines-odds-note">
              Next tile: <strong>{(nextSafeProbability * 100).toFixed(2)}% safe</strong> · <strong>{(nextMineProbability * 100).toFixed(2)}% mine</strong>
            </div>
          </div>
        </div>

        <div className="towers-history-card original-game-history-card mines-my-bets-card">
          <div className="towers-history-tabs">
            <button type="button" className="active">My Bets</button>
            <span className="towers-history-user-label">YOUR MINES</span>
          </div>

          <div className="towers-history-table-wrap">
            {recentGames.length ? (
              <div className="towers-history-table mines-my-bets-table">
                <div className="towers-history-row towers-history-head original-game-history-row mines-my-bets-row">
                  <span>Game</span>
                  <span>Bet Amount</span>
                  <span>Multiplier</span>
                  <span>Payout</span>
                  <span>Result</span>
                </div>

                {recentGames.map((entry) => (
                  <div
                    className="towers-history-row towers-history-bet-row original-game-history-row mines-my-bets-row"
                    key={entry.gameId}
                  >
                    <span className="towers-history-game">
                      <b>💣</b>
                      Mines
                    </span>
                    <span>${(Number(entry.betCents || 0) / 100).toFixed(2)}</span>
                    <span
                      className={`towers-history-multiplier ${
                        entry.status === "lost" ? "loss" : "win"
                      }`}
                    >
                      {Number(entry.multiplier || 0).toFixed(2)}×
                    </span>
                    <span
                      className={
                        Number(entry.payoutCents || 0) > 0
                          ? "towers-history-payout win"
                          : "towers-history-payout"
                      }
                    >
                      ${(Number(entry.payoutCents || 0) / 100).toFixed(2)}
                    </span>
                    <span className="original-game-history-result-cell">
                      <button
                        type="button"
                        className="towers-view-result-btn"
                        onClick={() => setViewingBet(entry)}
                      >
                        View Result
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="towers-history-empty">
                Your completed Mines bets will appear here.
              </div>
            )}
          </div>
        </div>

        {viewingBet && (
          <div
            className="mines-result-modal-backdrop"
            onClick={() => setViewingBet(null)}
          >
            <div
              className="mines-result-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Mines bet result"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mines-result-modal-head">
                <div>
                  <div className="eyebrow">BET RESULT</div>
                  <h2>
                    {viewingBet.status === "lost" ? "Mine Hit" : "Cashed Out"}
                  </h2>
                </div>
                <button
                  type="button"
                  className="mines-result-modal-close"
                  onClick={() => setViewingBet(null)}
                  aria-label="Close result"
                >
                  ×
                </button>
              </div>

              <div className="mines-result-summary">
                <div>
                  <span>BET</span>
                  <strong>
                    ${(Number(viewingBet.betCents || 0) / 100).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span>MULTIPLIER</span>
                  <strong>
                    {Number(viewingBet.multiplier || 0).toFixed(2)}x
                  </strong>
                </div>
                <div>
                  <span>WIN</span>
                  <strong>
                    ${(Number(viewingBet.payoutCents || 0) / 100).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div
                className={`mines-result-board mines-result-board-${viewingBet.gridSize}`}
              >
                {(() => {
                  const resultRevealed = new Set(
                    Array.isArray(viewingBet.revealedPositions)
                      ? viewingBet.revealedPositions.map(Number)
                      : []
                  );
                  const resultMines = new Set(
                    Array.isArray(viewingBet.minePositions)
                      ? viewingBet.minePositions.map(Number)
                      : []
                  );

                  return Array.from(
                    { length: Number(viewingBet.gridSize || 5) ** 2 },
                    (_, index) => {
                      const isMine = resultMines.has(index);
                      const wasRevealed = resultRevealed.has(index);

                      return (
                        <div
                          key={index}
                          className={`mines-result-tile ${
                            isMine
                              ? "mine"
                              : wasRevealed
                                ? "safe"
                                : "hidden"
                          }`}
                        >
                          {isMine ? "✕" : wasRevealed ? "◆" : ""}
                        </div>
                      );
                    }
                  );
                })()}
              </div>

              <div className="mines-result-modal-footer">
                <span>
                  {viewingBet.gridSize} × {viewingBet.gridSize} ·{" "}
                  {viewingBet.mineCount} mines · {viewingBet.revealedCount}{" "}
                  tiles revealed
                </span>
                <button
                  type="button"
                  className="mines-result-modal-done"
                  onClick={() => setViewingBet(null)}
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}

export default function OriginalGames({
  game = "towers",
  authUser,
  balance,
  onBalanceChange,
  onClose,
  openAuth,
  soundEnabled = true,
  onOpenColorDicing,
}) {
  const [activeGame, setActiveGame] = useState(game);

  useEffect(() => {
    setActiveGame(game);
  }, [game]);

  useEffect(() => {
    const handleClose = () => onClose?.();
    window.addEventListener("casex-original-close", handleClose);
    return () => window.removeEventListener("casex-original-close", handleClose);
  }, [onClose]);

  const GameComponent = useMemo(() => {
    if (activeGame === "plinko") return PlinkoGame;
    if (activeGame === "chicken") return ChickenRoadGame;
    if (activeGame === "coinflip") return CoinflipGame;
    if (activeGame === "mines") return MinesGame;
    return TowersGame;
  }, [activeGame]);

  const switchGame = (nextGame) => {
    if (nextGame === "dicing") {
      onOpenColorDicing?.();
      return;
    }

    setActiveGame(nextGame);
  };

  return (
    <div className="original-games-overlay">
      <div className="original-games-game-tabs">
        <button
          type="button"
          className={game === "dicing" ? "active" : ""}
          onClick={() => switchGame("dicing")}
        >
          <span>🎲</span>
          <strong>Color Dicing</strong>
        </button>

        {Object.entries(GAMES).map(([slug, meta]) => (
          <button
            type="button"
            key={slug}
            className={activeGame === slug ? "active" : ""}
            onClick={() => switchGame(slug)}
          >
            <span>{meta.icon}</span>
            <strong>{meta.name}</strong>
          </button>
        ))}
      </div>

      <GameComponent
        key={activeGame}
        authUser={authUser}
        balance={balance}
        onBalanceChange={onBalanceChange}
        openAuth={openAuth}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
