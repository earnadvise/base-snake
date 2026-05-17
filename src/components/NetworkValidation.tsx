import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { ShieldAlert, ArrowRightLeft } from 'lucide-react';

export function NetworkValidation() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // No warning if not connected
  if (!isConnected) return null;

  // Check if connected chain matches Base Mainnet (ID: 8453)
  const isWrongNetwork = chainId !== base.id;

  if (!isWrongNetwork) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '600px',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      <div className="arcade-card text-neon-pink" style={{
        padding: '16px 20px',
        border: '1px solid var(--neon-pink)',
        boxShadow: '0 0 20px var(--neon-pink-glow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'rgba(12, 4, 16, 0.95)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={20} className="blink" style={{ color: 'var(--neon-pink)' }} />
          <div style={{ textAlign: 'left' }}>
            <strong style={{ display: 'block', fontSize: '14px', fontFamily: 'var(--font-arcade)', letterSpacing: '0.5px' }}>
              WRONG NETWORK CONNECTED
            </strong>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Switch to Base Mainnet to view high scores & save runs on-chain.
            </span>
          </div>
        </div>

        <button 
          className="btn-neon btn-pink" 
          onClick={() => switchChain({ chainId: base.id })}
          disabled={isPending}
          style={{ 
            padding: '8px 16px', 
            fontSize: '11px',
            boxShadow: 'none'
          }}
        >
          <ArrowRightLeft size={12} />
          {isPending ? 'SWITCHING...' : 'SWITCH TO BASE'}
        </button>
      </div>
    </div>
  );
}
