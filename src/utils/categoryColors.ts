/**
 * Shared category color definitions used across:
 *  - CreatePollPage  (chip selector)
 *  - TrendingPolls   (filter buttons)
 *  - PollCard        (category badge + hover glow)
 */

export interface CategoryStyle {
  /** Classes for the badge / inactive chip */
  badge: string;
  /** Active / selected chip (solid background) */
  active: string;
  /** Hover accent gradient for PollCard */
  accent: string;
  /** Drop-shadow colour for PollCard */
  glow: string;
}

// src/utils/categoryColors.ts

export const CATEGORY_COLORS: Record<string, string> = {
politics: "#ef4444",
technology: "#3b82f6",
entertainment: "#a855f7",
sports: "#22c55e",
lifestyle: "#f97316",
science: "#14b8a6",
education: "#eab308",
health: "#ec4899",
business: "#6366f1",
culture: "#d946ef",
};

export const DEFAULT_STYLE: CategoryStyle = {
  badge:  "bg-muted text-muted-foreground border-border",
  active: "bg-muted-foreground text-background border-muted-foreground",
  accent: "from-muted/10",
  glow:   "shadow-black/5",
};

export const getCategoryColor = (name?: string) =>
CATEGORY_COLORS[name || ""] || "#6b7280";
