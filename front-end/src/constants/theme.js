import { createContext, useContext } from 'react';

export const lightColors = {
  primary: '#006cb4',
  accent: '#0A8CC4',
  value: '#0B87C9',
  background: '#eeefef',
  surface: '#EEF4FA',
  card: '#FFFFFF',
  mintCard: '#E3F7F0',
  text: '#3F3F46',
  textStrong: '#0F172A',
  muted: '#8A8F98',
  mutedText: '#5B6470',
  inactive: '#6B7280',
  navBg: '#EAF6FC',
  grid: '#4B4B4B',
  border: '#D6E2EC',
  divider: '#E6EDF4',
  link: '#0873A6',
  buttonBg: '#0A7DB8',
  softBlue: '#E3F4FD',
  success: '#17703F',
  successBg: '#D3F0DF',
  danger: '#B42318',
  dangerBg: '#FDECEC',
  badgeGreenBg: '#BFEBD0',
  badgeGreenText: '#2E9E5B',
  badgeBlueBg: '#BFE3F7',
  badgeBlueText: '#2A8AC4',
};

export const darkColors = {
  ...lightColors,
  primary: '#5BB8F2', accent: '#55B9E8', value: '#79C8F5',
  background: '#101820', surface: '#17232D', card: '#202E39', mintCard: '#18372F',
  text: '#D3DEE7', textStrong: '#F2F7FB', muted: '#A3B0BB', mutedText: '#B5C1CB', inactive: '#9AA9B5',
  navBg: '#172630', grid: '#9AA9B5', border: '#344654', divider: '#354652', link: '#75C9F2',
  buttonBg: '#087DB6', softBlue: '#173747', success: '#8FE2AE', successBg: '#1D4030',
  danger: '#FF8A80', dangerBg: '#482B2D', badgeGreenBg: '#214C38', badgeGreenText: '#8FE2AE',
  badgeBlueBg: '#203E51', badgeBlueText: '#82D0F7',
};

export const colors = lightColors;

export function getColors(dark) {
  return dark ? darkColors : lightColors;
}

/** @type {import('react').Context<{ dark: boolean, setDark: (value: boolean) => void }>} */
export const ThemeContext = createContext({
  dark: false,
  setDark: (value) => { void value; },
});
export const useTheme = () => useContext(ThemeContext);

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 5,
};
