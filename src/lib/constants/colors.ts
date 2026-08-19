export const uiColors = {
  brand: {
    primary: "#d41478",
    primarySoft: "#fff0f7",
    primaryGlow: "#ff4dac",
  },
  ink: {
    navy: "#151927",
    muted: "#667085",
    accent: "#3a1632",
  },
  neutral: {
    bg: "#fff8fb",
    surface: "#ffffff",
    line: "#ece7ee",
    white: "#ffffff",
  },
  support: {
    success: "#11875d",
    pitchLight: "#3aaa71",
    pitchDark: "#248b5b",
  },
} as const;

export type UiColorScale = typeof uiColors;
