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

// Deep link helpers for wallet apps
export const openWalletApp = (wallet: 'metamask' | 'coinbase' | 'leather'): void => {
  const currentUrl = encodeURIComponent(window.location.href);
  
  if (wallet === 'metamask') {
    // MetaMask deep link
    if (isIOS()) {
      window.location.href = `https://metamask.app.link/dapp/${window.location.hostname}`;
    } else {
      window.location.href = `https://metamask.app.link/dapp/${window.location.hostname}`;
    }
  } else if (wallet === 'coinbase') {
    // Coinbase Wallet deep link
    if (isIOS()) {
      window.location.href = `https://go.cb-w.com/dapp?cb_url=${currentUrl}`;
    } else {
      window.location.href = `https://go.cb-w.com/dapp?cb_url=${currentUrl}`;
    }
  } else if (wallet === 'leather') {
    // Leather wallet deep link
    if (isIOS() || isAndroid()) {
      const leatherUrl = `https://leather.io/connect?return=${currentUrl}`;
      window.location.href = leatherUrl;
    }
  }
};

// Check if wallet is installed
export const isWalletInstalled = (wallet: 'metamask' | 'coinbase' | 'leather'): boolean => {
  if (wallet === 'metamask') {
    return typeof window.ethereum !== 'undefined' && !!(window.ethereum as any).isMetaMask;
  } else if (wallet === 'coinbase') {
    return typeof window.ethereum !== 'undefined' && !!(window.ethereum as any).isCoinbaseWallet;
  } else if (wallet === 'leather') {
    return typeof (window as any).LeatherProvider !== 'undefined';
  }
  return false;
};