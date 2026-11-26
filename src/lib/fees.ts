import { DistanceTier, Order } from "../types/choyfood";

export const CUSTOMER_DISTANCE_FEES: Record<DistanceTier, number> = {
  "0-2km": 25,
  "2-5km": 35,
  "5-10km": 50,
};

const RIDER_BASE_DISTANCE_FEES: Record<DistanceTier, number> = {
  "0-2km": 20,
  "2-5km": 30,
  "5-10km": 45,
};

/**
 * Computes rider payout for a delivery run.
 * Keeps fee calculation rules strictly internal — never render the underlying formula in Customer or Rider UI.
 */
export function calculateHiddenRiderPayout(
  order: Pick<Order, "distanceTier" | "totalAmount" | "tipAmount">
): number {
  const base = RIDER_BASE_DISTANCE_FEES[order.distanceTier] ?? 20;
  const orderShare = Math.round((Number(order.totalAmount) || 0) * 0.02 * 100) / 100;
  const tip = Math.max(0, Number(order.tipAmount) || 0);
  return Math.round((base + orderShare + tip) * 100) / 100;
}

/**
 * Computes platform delivery markup for Admin analytics only.
 */
export function calculatePlatformMarkup(
  order: Pick<Order, "distanceTier" | "deliveryFee" | "totalAmount" | "tipAmount">
): number {
  const customerFee = Math.max(0, Number(order.deliveryFee) || 0);
  const riderBase = RIDER_BASE_DISTANCE_FEES[order.distanceTier] ?? 20;
  const orderShare = Math.round((Number(order.totalAmount) || 0) * 0.02 * 100) / 100;
  const net = customerFee - riderBase - orderShare;
  return Math.round(net * 100) / 100;
}

/**
 * Safe recursive-descent arithmetic expression evaluator (supports +, -, *, /, %, parentheses, decimals).
 * Zero eval() or new Function(). Returns null if the expression is not pure arithmetic.
 */
export function evaluateMathExpression(rawInput: string): number | null {
  const cleaned = rawInput
    .replace(/[×x]/gi, "*")
    .replace(/÷/g, "/")
    .replace(/₱|PHP/gi, "")
    .trim();

  if (!cleaned || cleaned.length > 120) return null;
  if (!/^[0-9+\-*/().%\s]+$/.test(cleaned)) return null;
  if (!/\d/.test(cleaned)) return null;

  let pos = 0;

  const skipWs = () => {
    while (pos < cleaned.length && cleaned[pos] === " ") pos++;
  };

  const parseExpression = (): number | null => {
    let left = parseTerm();
    if (left === null) return null;
    while (true) {
      skipWs();
      const ch = cleaned[pos];
      if (ch === "+" || ch === "-") {
        pos++;
        const right = parseTerm();
        if (right === null) return null;
        left = ch === "+" ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  };

  const parseTerm = (): number | null => {
    let left = parseFactor();
    if (left === null) return null;
    while (true) {
      skipWs();
      const ch = cleaned[pos];
      if (ch === "*" || ch === "/" || ch === "%") {
        pos++;
        const right = parseFactor();
        if (right === null) return null;
        if ((ch === "/" || ch === "%") && right === 0) return null;
        if (ch === "*") left = left * right;
        else if (ch === "/") left = left / right;
        else left = left % right;
      } else {
        break;
      }
    }
    return left;
  };

  const parseFactor = (): number | null => {
    skipWs();
    if (pos >= cleaned.length) return null;

    if (cleaned[pos] === "+") {
      pos++;
      return parseFactor();
    }
    if (cleaned[pos] === "-") {
      pos++;
      const val = parseFactor();
      return val === null ? null : -val;
    }

    if (cleaned[pos] === "(") {
      pos++;
      const val = parseExpression();
      skipWs();
      if (cleaned[pos] !== ")") return null;
      pos++;
      return val;
    }

    const start = pos;
    let dotCount = 0;
    while (pos < cleaned.length && ((cleaned[pos] >= "0" && cleaned[pos] <= "9") || cleaned[pos] === ".")) {
      if (cleaned[pos] === ".") dotCount++;
      if (dotCount > 1) return null;
      pos++;
    }
    if (start === pos) return null;
    const num = Number(cleaned.slice(start, pos));
    return Number.isFinite(num) ? num : null;
  };

  const result = parseExpression();
  skipWs();
  if (pos !== cleaned.length || result === null || !Number.isFinite(result)) {
    return null;
  }
  return Math.round(result * 10000) / 10000;
}

/**
 * Plays a pleasant Web Audio chime for Admin alerts or Store interactions.
 */
export function playNotificationChime(kind: "order" | "store" | "alert" = "order"): void {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes =
      kind === "store"
        ? [523.25, 659.25, 783.99]
        : kind === "alert"
        ? [660, 880]
        : [587.33, 880];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.24);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // Ignore autoplay / audio hardware restrictions cleanly
  }
}
