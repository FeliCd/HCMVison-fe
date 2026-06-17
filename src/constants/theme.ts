/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/* ── Extended Design Tokens ─────────────────────────────────── */

/** App brand palette — single source of truth */
export const AppColors = {
  /** Main dark navy background */
  bg: '#051424',
  /** Teal/Cyan card background */
  bgCard: 'rgba(22, 37, 41, 0.85)',
  bgCardLight: 'rgba(22, 37, 41, 0.5)',
  bgCardDark: 'rgba(5, 20, 36, 0.85)',
  /** Accent cyan / teal */
  accent: '#00f2ea',
  accentBright: '#29fcf3',
  /** Text hierarchy */
  textPrimary: '#d4e4fa',
  textSecondary: '#b9cac8',
  textMuted: '#849492',
  /** Text on accent buttons */
  textOnAccent: '#003735',
  /** Alert colors */
  danger: '#ffb4ab',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  dangerStrong: '#93000a',
  amber: '#f59e0b',
  amberBg: 'rgba(245, 158, 11, 0.1)',
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  successLight: '#6ffbbe',
  /** Border colors */
  border: 'rgba(255, 255, 255, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderAccent: 'rgba(0, 242, 234, 0.3)',
  /** Glassmorphism */
  glassBg: 'rgba(25, 30, 40, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassBorderActive: 'rgba(255, 255, 255, 0.28)',
  glassBorderMuted: 'rgba(255, 255, 255, 0.06)',
  glassGlow: 'transparent',
} as const;

/** Consistent border radius tokens */
export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 100,
} as const;

/** Shadow presets for depth & iOS frosted glass elevation */
export const Shadows = {
  /** Subtle card elevation */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  /** Standard dark drop shadow replacing neon glow */
  glow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  /** Strong dark drop shadow replacing neon glow */
  glowStrong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  /** Subtle depth for floating UI */
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  /** Danger glow */
  danger: {
    shadowColor: '#ffb4ab',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

/** Typography presets */
export const Typography = {
  /** Large page title */
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  /** Section/page title */
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  /** Card/section heading */
  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  /** Subtitle / label */
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  /** Body text */
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  /** Small / caption */
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  /** Tiny label */
  tiny: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
} as const;
