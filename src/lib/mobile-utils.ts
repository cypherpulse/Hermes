// Mobile detection utilities for better wallet support
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

// Check if running in a mobile browser context
export const isMobileBrowser = (): boolean => {
  return isMobile() && 'ontouchstart' in window;
};

// Get recommended wallet for mobile
export const getRecommendedMobileWallet = (): string => {
  if (isIOS()) {
    return 'MetaMask or Trust Wallet';
  } else if (isAndroid()) {
    return 'MetaMask or Coinbase Wallet';
  }
  return 'MetaMask';
};