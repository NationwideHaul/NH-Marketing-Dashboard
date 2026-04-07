// Seeded PRNG (mulberry32) for deterministic mock data
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface MetricConfig {
  key: string;
  label: string;
  baseline: number;
  dailyGrowth: number; // e.g., 0.001 = 0.1% daily
  noise: number; // 0-1, amplitude of random variation
  weekendDip: number; // 0-1, how much to reduce on weekends
  format: "number" | "currency" | "percent";
  min?: number;
  max?: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export function generateTimeSeries(
  platform: string,
  config: MetricConfig,
  startDate: Date,
  endDate: Date
): TimeSeriesPoint[] {
  const seed = hashString(`${platform}-${config.key}`);
  const random = mulberry32(seed);
  const points: TimeSeriesPoint[] = [];

  const current = new Date(startDate);
  let dayIndex = 0;

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base value with growth trend
    let value = config.baseline * (1 + config.dailyGrowth * dayIndex);

    // Add noise
    const noiseValue = (random() - 0.5) * 2 * config.noise * config.baseline;
    value += noiseValue;

    // Weekend dip
    if (isWeekend && config.weekendDip > 0) {
      value *= 1 - config.weekendDip;
    }

    // Seasonal bump (more activity in certain months)
    const month = current.getMonth();
    const seasonalFactor = 1 + 0.1 * Math.sin((month / 12) * Math.PI * 2);
    value *= seasonalFactor;

    // Clamp
    if (config.min !== undefined) value = Math.max(config.min, value);
    if (config.max !== undefined) value = Math.min(config.max, value);

    // Round appropriately
    if (config.format === "percent") {
      value = Math.round(value * 100) / 100;
    } else if (config.format === "currency") {
      value = Math.round(value * 100) / 100;
    } else {
      value = Math.round(value);
    }

    points.push({
      date: current.toISOString().split("T")[0],
      value,
    });

    current.setDate(current.getDate() + 1);
    dayIndex++;
  }

  return points;
}

// Aggregate daily data to monthly buckets
export function aggregateMonthly(points: TimeSeriesPoint[]): TimeSeriesPoint[] {
  const monthly: Record<string, number[]> = {};
  for (const p of points) {
    const month = p.date.substring(0, 7); // YYYY-MM
    if (!monthly[month]) monthly[month] = [];
    monthly[month].push(p.value);
  }
  return Object.entries(monthly).map(([month, values]) => ({
    date: month,
    value: Math.round(values.reduce((a, b) => a + b, 0)),
  }));
}

// Aggregate to weekly
export function aggregateWeekly(points: TimeSeriesPoint[]): TimeSeriesPoint[] {
  const weekly: TimeSeriesPoint[] = [];
  for (let i = 0; i < points.length; i += 7) {
    const chunk = points.slice(i, i + 7);
    const sum = chunk.reduce((a, b) => a + b.value, 0);
    weekly.push({ date: chunk[0].date, value: Math.round(sum) });
  }
  return weekly;
}
