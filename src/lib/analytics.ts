import { track } from '@vercel/analytics'

// ============================================
// WALLET ANALYTICS
// ============================================

export const trackWalletConnected = (walletType: string, chain: 'ethereum' | 'stacks') => {
  track('wallet_connected', {
    wallet: walletType,
    chain,
  })
}

export const trackWalletDisconnected = (chain: 'ethereum' | 'stacks') => {
  track('wallet_disconnected', {
    chain,
  })
}

// ============================================
// BRIDGE ANALYTICS
// ============================================

export const trackBridgeInitiated = (
  amount: string,
  fromChain: string,
  toChain: string
) => {
  track('bridge_initiated', {
    amount,
    fromChain,
    toChain,
  })
}

export const trackBridgeApproval = (amount: string, txHash: string) => {
  track('bridge_approval', {
    amount,
    txHash,
  })
}

export const trackBridgeBurn = (amount: string, txHash: string) => {
  track('bridge_burn', {
    amount,
    txHash,
  })
}

export const trackBridgeAttestationReceived = (messageHash: string) => {
  track('bridge_attestation_received', {
    messageHash,
  })
}

export const trackBridgeCompleted = (
  amount: string,
  fromChain: string,
  toChain: string,
  duration: number
) => {
  track('bridge_completed', {
    amount,
    fromChain,
    toChain,
    durationSeconds: duration,
  })
}

export const trackBridgeFailed = (
  step: 'approval' | 'burn' | 'attestation' | 'mint',
  errorMessage: string
) => {
  track('bridge_failed', {
    step,
    error: errorMessage,
  })
}

// ============================================
// TRANSFER ANALYTICS (Stacks to Stacks)
// ============================================

export const trackTransferInitiated = (amount: string) => {
  track('transfer_initiated', {
    amount,
    chain: 'stacks',
  })
}

export const trackTransferCompleted = (amount: string, txId: string) => {
  track('transfer_completed', {
    amount,
    txId,
    chain: 'stacks',
  })
}

export const trackTransferFailed = (errorMessage: string) => {
  track('transfer_failed', {
    error: errorMessage,
    chain: 'stacks',
  })
}

// ============================================
// PAGE & UI ANALYTICS
// ============================================

export const trackPageView = (page: string) => {
  track('page_view', {
    page,
  })
}

export const trackTabChanged = (tab: string) => {
  track('tab_changed', {
    tab,
  })
}

export const trackFAQOpened = (question: string) => {
  track('faq_opened', {
    question,
  })
}

export const trackExternalLinkClicked = (url: string, label: string) => {
  track('external_link_clicked', {
    url,
    label,
  })
}
