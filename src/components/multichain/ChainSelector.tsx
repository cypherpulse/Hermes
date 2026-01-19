/**
 * ChainSelector Component
 * 
 * A dropdown selector for choosing blockchain networks.
 * Supports filtering chains and displaying chain icons/info.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { 
  type CCTPChainId, 
  type CCTPChainConfig,
  CCTP_CHAINS,
  getAllChains,
  getSourceChains,
} from '@/lib/multichain-bridge-config';
import { cn } from '@/lib/utils';

interface ChainSelectorProps {
  value: CCTPChainId | null;
  onChange: (chainId: CCTPChainId) => void;
  excludeChains?: CCTPChainId[];
  includeEthereum?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  showBalance?: boolean;
  balance?: string;
  supportedChains?: string[]; // Bridge Kit supported chain names
}

export function ChainSelector({
  value,
  onChange,
  excludeChains = [],
  includeEthereum = true,
  disabled = false,
  placeholder = 'Select chain',
  label,
  showBalance = false,
  balance,
  supportedChains,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get available chains
  const availableChains = includeEthereum 
    ? getAllChains() 
    : getSourceChains();
  
  const filteredChains = availableChains.filter(
    chain => !excludeChains.includes(chain.id) &&
             (!supportedChains || supportedChains.includes(chain.id))
  );

  const selectedChain = value ? CCTP_CHAINS[value] : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (chainId: CCTPChainId) => {
    onChange(chainId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3",
          "bg-background border border-border rounded-xl",
          "hover:border-primary/50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed hover:border-border",
        )}
      >
        <div className="flex items-center gap-3">
          {selectedChain ? (
            <>
              <ChainIcon chain={selectedChain} />
              <div className="text-left">
                <p className="font-medium text-foreground">
                  {selectedChain.displayName}
                </p>
                {showBalance && balance && (
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(balance).toFixed(2)} USDC
                  </p>
                )}
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isOpen && "transform rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {filteredChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => handleSelect(chain.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3",
                  "hover:bg-accent/50 transition-colors",
                  value === chain.id && "bg-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <ChainIcon chain={chain} />
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {chain.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {chain.name}
                    </p>
                  </div>
                </div>
                
                {value === chain.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Chain Icon Component
function ChainIcon({ chain, size = 'md' }: { chain: CCTPChainConfig; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
  };

  return (
    <div 
      className={cn(
        sizeClasses[size],
        "flex items-center justify-center rounded-full",
        "bg-gradient-to-br from-white/10 to-white/5",
        "border border-white/10"
      )}
      style={{ backgroundColor: `${chain.color}20` }}
    >
      <span>{chain.icon}</span>
    </div>
  );
}

// Stacks chain option (for destination)
export const STACKS_CHAIN = {
  id: 'Stacks' as const,
  name: 'Stacks',
  displayName: 'Stacks',
  icon: '₿',
  color: '#5546FF',
};

interface ChainSelectorWithStacksProps {
  value: CCTPChainId | 'Stacks' | null;
  onChange: (chainId: CCTPChainId | 'Stacks') => void;
  excludeChains?: (CCTPChainId | 'Stacks')[];
  includeStacks?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  supportedChains?: string[]; // Bridge Kit supported chain names
}

export function ChainSelectorWithStacks({
  value,
  onChange,
  excludeChains = [],
  includeStacks = true,
  disabled = false,
  placeholder = 'Select chain',
  label,
  supportedChains,
}: ChainSelectorWithStacksProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get available chains
  const evmChains = getAllChains().filter(
    chain => !excludeChains.includes(chain.id) &&
             (!supportedChains || supportedChains.includes(chain.id))
  );

  const showStacks = includeStacks && !excludeChains.includes('Stacks');

  const selectedChain = value === 'Stacks' 
    ? STACKS_CHAIN 
    : value ? CCTP_CHAINS[value] : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (chainId: CCTPChainId | 'Stacks') => {
    onChange(chainId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3",
          "bg-background border border-border rounded-xl",
          "hover:border-primary/50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed hover:border-border",
        )}
      >
        <div className="flex items-center gap-3">
          {selectedChain ? (
            <>
              <div 
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10"
                style={{ backgroundColor: `${selectedChain.color}20` }}
              >
                <span className="text-lg">{selectedChain.icon}</span>
              </div>
              <p className="font-medium text-foreground">
                {selectedChain.displayName}
              </p>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isOpen && "transform rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {/* Stacks option first if included */}
            {showStacks && (
              <button
                type="button"
                onClick={() => handleSelect('Stacks')}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3",
                  "hover:bg-accent/50 transition-colors border-b border-border",
                  value === 'Stacks' && "bg-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10"
                    style={{ backgroundColor: `${STACKS_CHAIN.color}20` }}
                  >
                    <span className="text-lg">{STACKS_CHAIN.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {STACKS_CHAIN.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bitcoin L2
                    </p>
                  </div>
                </div>
                
                {value === 'Stacks' && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            )}

            {/* EVM chains */}
            {evmChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => handleSelect(chain.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3",
                  "hover:bg-accent/50 transition-colors",
                  value === chain.id && "bg-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <ChainIcon chain={chain} />
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {chain.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {chain.name}
                    </p>
                  </div>
                </div>
                
                {value === chain.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { ChainIcon };
