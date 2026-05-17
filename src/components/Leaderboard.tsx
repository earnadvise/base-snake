import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';
import { LEADERBOARD_ADDRESS, LEADERBOARD_ABI, BUILDER_CODE } from '../wagmi';
import { soundEffects } from '../utils/soundEffects';
import { useGameStore } from '../store/gameStore';
import { Trophy, Send, Award, Inbox } from 'lucide-react';

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
        value: parseEther('0.00001'), // Entry Fee: 0.00001 ETH
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

  // Parse leaderboard entries (returns empty if contract is not configured or empty)
  const displayLeaderboard = () => {
    if (contractScores && contractScores.length > 0) {
      return [...contractScores]
        .map((entry) => ({
          player: entry.player,
          name: entry.name,
          score: Number(entry.score),
          timestamp: Number(entry.timestamp) * 1000
        }))
        .sort((a, b) => b.score - a.score);
    }
    return [];
  };

  const scoresList = displayLeaderboard();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. Record Run Submission Box */}
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
              RECORD RUN DETECTED
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', textAlign: 'left', lineHeight: '1.4', margin: '0 0 16px' }}>
            Submit your high score of <strong className="text-neon-cyan" style={{ fontSize: '14px' }}>{score}</strong> to the leaderboard. Requires <span style={{ color: '#fff', fontWeight: 'bold' }}>0.00001 ETH</span> (~$0.03 USD) to write on-chain.
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
              💡 Configure your contract address inside <code>src/wagmi.ts</code> to enable actual score submissions.
            </div>
          ) : (
            <form onSubmit={handleSubmitScore} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="arcade-input"
                placeholder="YOUR INITIALS (E.G. ARC)"
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
              GLOBAL SCORES
            </h3>
          </div>
        </div>

        {scoresList.length > 0 ? (
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
                {scoresList.map((entry, index) => {
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
        ) : (
          /* Premium Professional Empty State */
          <div style={{
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            border: '1px dashed rgba(168, 85, 247, 0.2)',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.01)',
            boxSizing: 'border-box'
          }}>
            <Inbox size={32} style={{ color: '#475569', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.02))' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-arcade)',
                fontSize: '12px',
                color: '#94a3b8',
                letterSpacing: '1px'
              }}>
                NO RECORDS ON-CHAIN YET
              </p>
              <p style={{
                margin: '6px 0 0',
                fontSize: '11px',
                color: '#64748b',
                lineHeight: '1.4'
              }}>
                {!isContractActive 
                  ? 'Connect a deployed leaderboard contract to view scores.' 
                  : 'Submit your score below to claim the first spot!'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS Hover Transitions */}
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
