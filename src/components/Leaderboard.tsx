import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';
import { LEADERBOARD_ADDRESS, LEADERBOARD_ABI, BUILDER_CODE } from '../wagmi';
import { soundEffects } from '../utils/soundEffects';
import { useGameStore } from '../store/gameStore';
import { Trophy, Send, Award } from 'lucide-react';

// Fallback high scores when contract is not deployed yet or is empty
const MOCK_LEADERBOARD = [
  { player: '0x3456...a2f4', name: 'N3ON_VIPER', score: 320, timestamp: Date.now() - 3600000 * 3 },
  { player: '0x8bc2...d199', name: 'CYB3R_KONG', score: 260, timestamp: Date.now() - 3600000 * 12 },
  { player: '0x45f9...99ee', name: 'BASE_GOD', score: 210, timestamp: Date.now() - 3600000 * 24 },
  { player: '0xf3da...e291', name: 'BLOCK_RUNNER', score: 180, timestamp: Date.now() - 3600000 * 48 },
  { player: '0x7a22...a9fb', name: 'ETH_WHALE', score: 150, timestamp: Date.now() - 3600000 * 72 },
];

export function Leaderboard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { score } = useGameStore();

  const [nameInput, setNameInput] = useState('');
  const [submissionComplete, setSubmissionComplete] = useState(false);

  const isBaseNetwork = chainId === base.id;
  const isContractActive = LEADERBOARD_ADDRESS !== '0x0000000000000000000000000000000000000000';

  // --- Wagmi Contract Reads ---
  const { data: contractScores, refetch: refetchLeaderboard } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: LEADERBOARD_ABI,
    functionName: 'getLeaderboard',
    query: {
      enabled: isConnected && isBaseNetwork && isContractActive,
    }
  });

  // --- Wagmi Contract Writes ---
  const { writeContract: writeScore, data: scoreTxHash } = useWriteContract();

  // Transaction confirmation
  const { isLoading: isScoreConfirming, isSuccess: isScoreSuccess } = useWaitForTransactionReceipt({
    hash: scoreTxHash,
  });

  // Track transaction completion to refresh scoreboard
  useEffect(() => {
    if (isScoreSuccess) {
      soundEffects.playHighscore();
      refetchLeaderboard();
      setSubmissionComplete(true);
    }
  }, [isScoreSuccess, refetchLeaderboard]);

  // Handle Score Submission click
  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput || score <= 0 || !isConnected || !isBaseNetwork || !isContractActive) return;

    soundEffects.playSelect();

    try {
      writeScore({
        address: LEADERBOARD_ADDRESS,
        abi: LEADERBOARD_ABI,
        functionName: 'submitScore',
        args: [nameInput.toUpperCase(), BigInt(score), BUILDER_CODE],
        value: parseEther('0.00001'), // Decreased Entry Fee: 0.00001 ETH
      });
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
  };

  // Truncate wallet addresses for display
  const truncateAddr = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Parse leaderboard entries (on-chain fallback to mock)
  const displayLeaderboard = () => {
    if (contractScores && contractScores.length > 0) {
      // Sort in descending order to display highest scores
      return [...contractScores]
        .map((entry) => ({
          player: entry.player,
          name: entry.name,
          score: Number(entry.score),
          timestamp: Number(entry.timestamp) * 1000
        }))
        .sort((a, b) => b.score - a.score);
    }

    // Default mock fallback
    return MOCK_LEADERBOARD;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. Score submission panel - compact form */}
      {useGameStore.getState().gameState === 'GAME_OVER' && score > 0 && !submissionComplete && (
        <div className="arcade-card" style={{ 
          padding: '20px', 
          border: '1px solid var(--neon-cyan)', 
          boxShadow: '0 0 15px var(--neon-cyan-glow)', 
          boxSizing: 'border-box',
          animation: 'fade-in 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Award size={20} className="text-neon-cyan" />
            <h3 className="text-neon-cyan" style={{ margin: 0, fontFamily: 'var(--font-arcade)', fontSize: '15px', letterSpacing: '0.5px' }}>
              RECORD RUN ON BASE
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', textAlign: 'left', lineHeight: '1.4', margin: '0 0 16px' }}>
            Submit score <strong className="text-neon-cyan" style={{ fontSize: '14px' }}>{score}</strong> to the leaderboard. Requires <span style={{ color: '#fff', fontWeight: 'bold' }}>0.00001 ETH</span> (~$0.03 USD) to write on-chain.
          </p>

          {!isConnected ? (
            <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.04)', border: '1px dashed rgba(236, 72, 153, 0.4)', borderRadius: '8px', color: '#f43f5e', fontSize: '12px', textAlign: 'left' }}>
              ⚠️ Connect wallet and switch to <strong>Base Mainnet</strong> to submit.
            </div>
          ) : !isBaseNetwork ? (
            <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.04)', border: '1px dashed rgba(236, 72, 153, 0.4)', borderRadius: '8px', color: '#f43f5e', fontSize: '12px', textAlign: 'left' }}>
              ⚠️ Switch your network to <strong>Base Mainnet</strong> to submit.
            </div>
          ) : !isContractActive ? (
            <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.04)', border: '1px dashed rgba(168, 85, 247, 0.4)', borderRadius: '8px', color: 'var(--neon-purple)', fontSize: '12px', textAlign: 'left' }}>
              💡 <strong>Ready for Deployment!</strong> Deploy <code>BaseSnake.sol</code> on Base Mainnet, set address in <code>src/wagmi.ts</code> to enable actual score submissions.
            </div>
          ) : (
            <form onSubmit={handleSubmitScore} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="arcade-input"
                placeholder="ARCADE INITIALS (E.G. ARC)"
                maxLength={16}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                disabled={isScoreConfirming || scoreTxHash !== undefined}
                style={{ flex: 1, minWidth: '150px', padding: '10px 12px', fontSize: '14px' }}
              />
              <button
                type="submit"
                className="btn-neon btn-cyan"
                disabled={isScoreConfirming || !nameInput || scoreTxHash !== undefined}
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                {isScoreConfirming ? (
                  <>CONFIRMING...</>
                ) : scoreTxHash ? (
                  <>SUBMITTING...</>
                ) : (
                  <>
                    <Send size={12} /> SUBMIT
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 2. Global Leaderboard table card */}
      <div className="arcade-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} className="text-neon-cyan" style={{ filter: 'drop-shadow(0 0 5px var(--neon-cyan-glow))' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-arcade)', fontSize: '16px', color: 'white', letterSpacing: '0.5px' }}>
              GLOBAL LEADERBOARD
            </h3>
          </div>
          
          {isContractActive ? (
            <span style={{ fontSize: '10px', color: 'var(--neon-emerald)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              ON-CHAIN
            </span>
          ) : (
            <span style={{ fontSize: '10px', color: 'var(--neon-purple)', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              PRACTICE MODE
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.15)', background: 'rgba(168, 85, 247, 0.02)' }}>
                <th style={{ padding: '10px 8px', color: 'var(--neon-purple)', fontFamily: 'var(--font-arcade)', fontSize: '11px', letterSpacing: '0.5px' }}>RANK</th>
                <th style={{ padding: '10px 8px', color: 'var(--neon-purple)', fontFamily: 'var(--font-arcade)', fontSize: '11px', letterSpacing: '0.5px' }}>NAME</th>
                <th style={{ padding: '10px 8px', color: 'var(--neon-purple)', fontFamily: 'var(--font-arcade)', fontSize: '11px', letterSpacing: '0.5px' }}>ADDRESS</th>
                <th style={{ padding: '10px 8px', color: 'var(--neon-purple)', fontFamily: 'var(--font-arcade)', fontSize: '11px', letterSpacing: '0.5px', textAlign: 'right' }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {displayLeaderboard().map((entry, index) => {
                const isUser = isConnected && address && entry.player.toLowerCase() === address.toLowerCase();
                
                return (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      backgroundColor: isUser ? 'rgba(6, 182, 212, 0.04)' : 'transparent',
                      color: isUser ? 'var(--neon-cyan)' : '#cbd5e1',
                      transition: 'background-color 0.2s ease'
                    }}
                    className="leaderboard-row"
                  >
                    <td style={{ padding: '10px 8px', fontFamily: 'var(--font-arcade)', fontWeight: 'bold' }}>
                      {index === 0 && '🥇 '}
                      {index === 1 && '🥈 '}
                      {index === 2 && '🥉 '}
                      {index > 2 && `${index + 1}`}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {entry.name}
                    </td>
                    <td style={{ padding: '10px 8px', color: isUser ? 'var(--neon-cyan)' : '#64748b', fontSize: '12px' }}>
                      {truncateAddr(entry.player)}
                    </td>
                    <td className="text-neon-cyan" style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--font-arcade)', fontWeight: 'bold', fontSize: '14px' }}>
                      {entry.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isContractActive && (
          <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', textAlign: 'left', lineHeight: '1.3' }}>
            💡 To save high scores on-chain, deploy the contract on Base Mainnet and enter its address in <code>src/wagmi.ts</code>.
          </div>
        )}
      </div>
      
      {/* CSS Hover Transitions for row highlights */}
      <style>{`
        .leaderboard-row:hover {
          background-color: rgba(168, 85, 247, 0.03) !important;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
