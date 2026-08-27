export const shortDateFmt = new Intl.DateTimeFormat("vi-VN", {
  month: "short",
  day: "numeric",
});

/** Compact axis labels — numeric day/month without "thg" to reduce overlap. */
export const axisDateFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "numeric",
});

export const weekdayDateFmt = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** Full descriptive date for dashboard trend tooltips. */
export const trendTooltipDateFmt = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const hmsTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

// `Intl.NumberFormat.prototype.format` is a bound getter — safe to extract.
export const intFmt = new Intl.NumberFormat("vi-VN").format;
