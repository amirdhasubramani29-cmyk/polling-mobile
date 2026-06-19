export function timeAgo(date: Date, lang = "en"): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals: [number, string, string][] = [
    [31536000, lang === "ta" ? "ஆண்டு" : "year", lang === "ta" ? "ஆண்டுகள்" : "years"],
    [2592000, lang === "ta" ? "மாதம்" : "month", lang === "ta" ? "மாதங்கள்" : "months"],
    [604800, lang === "ta" ? "வாரம்" : "week", lang === "ta" ? "வாரங்கள்" : "weeks"],
    [86400, lang === "ta" ? "நாள்" : "day", lang === "ta" ? "நாட்கள்" : "days"],
    [3600, lang === "ta" ? "மணி" : "hour", lang === "ta" ? "மணிகள்" : "hours"],
    [60, lang === "ta" ? "நிமிடம்" : "minute", lang === "ta" ? "நிமிடங்கள்" : "minutes"],
  ];

  for (const [secs, singular, plural] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      const unit = count === 1 ? singular : plural;
      if (lang === "ta") return `${count} ${unit} முன்பு`;
      return `${count} ${unit} ago`;
    }
  }

  return lang === "ta" ? "இப்போது" : "just now";
}
