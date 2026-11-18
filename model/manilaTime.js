const dateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function manilaParts(now) {
  const result = {};
  for (const part of dateTimeFormat.formatToParts(now)) {
    result[part.type] = part.value;
  }
  return result;
}

function getManilaDate(now = new Date()) {
  const { year, month, day } = manilaParts(now);
  return year + "-" + month + "-" + day;
}

function getManilaTime(now = new Date()) {
  const { hour, minute } = manilaParts(now);
  return hour + ":" + minute;
}

function getManilaTimestamp(now = new Date()) {
  return getManilaDate(now) + " " + getManilaTime(now);
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isClockTime(value) {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isEventEnded(event, now = new Date()) {
  const endTime = event.endTime || "23:59";
  if (!isCalendarDate(event.date) || !isClockTime(endTime)) return false;
  const manilaDate = getManilaDate(now);
  return event.date < manilaDate ||
    (event.date === manilaDate && endTime <= getManilaTime(now));
}

module.exports = {
  getManilaDate,
  getManilaTime,
  getManilaTimestamp,
  isCalendarDate,
  isClockTime,
  isEventEnded,
};
