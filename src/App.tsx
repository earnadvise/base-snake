import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SnakeGame } from './components/SnakeGame';
import { Leaderboard } from './components/Leaderboard';
import { NetworkValidation } from './components/NetworkValidation';
import { Gamepad2, Sparkles, Trophy, Heart } from 'lucide-react';

function App() {
  return (
    <div className="grid-container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px', 
      justifyContent: 'space-between',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      
      {/* Network warning banner */}
      <NetworkValidation />

      {/* Retro Arcade Header */}
      <header className="arcade-card" style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '2px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.1)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Gamepad2 size={28} className="text-neon-pink" style={{ filter: 'drop-shadow(0 0 6px var(--neon-pink-glow))' }} />
          <div style={{ textAlign: 'left' }}>
            <h1 className="retro-glitch" style={{ fontSize: '26px', margin: 0, letterSpacing: '1px', lineHeight: 1.1 }}>
              BASE_SNAKE
            </h1>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-arcade)', display: 'block', marginTop: '2px' }}>
              RETRO ARCADE ON BASE MAINNET
            </span>
          </div>
        </div>

        {/* Web3 Connect Button */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>

      {/* Primary Grid Layout */}
      <main style={{
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '1080px',
          boxSizing: 'border-box'
        }}>
          {/* Column 1: Canvas Game Board */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
              <Sparkles size={16} className="text-neon-pink" />
              <h2 style={{ fontSize: '15px', fontFamily: 'var(--font-arcade)', color: '#94a3b8', margin: 0, letterSpacing: '0.5px' }}>
                PLAY GAME
              </h2>
            </div>
            <div style={{ width: '100%' }}>
              <SnakeGame />
            </div>
          </section>

          {/* Column 2: Leaderboard */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
              <Trophy size={16} className="text-neon-cyan" />
              <h2 style={{ fontSize: '15px', fontFamily: 'var(--font-arcade)', color: '#94a3b8', margin: 0, letterSpacing: '0.5px' }}>
                HIGH SCORES
              </h2>
            </div>
            <div style={{ width: '100%' }}>
              <Leaderboard />
            </div>
          </section>
        </div>
      </main>

      {/* Cyberpunk Footer */}
      <footer className="arcade-card" style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '12px',
        color: '#475569',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Powered by </span>
          <strong style={{ color: '#94a3b8' }}>Base Mainnet</strong>
          <span style={{ color: 'var(--neon-purple)', fontSize: '9px', background: 'rgba(168, 85, 247, 0.06)', padding: '1px 5px', borderRadius: '3px', marginLeft: '4px' }}>L2</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Made with</span>
          <Heart size={10} style={{ color: 'var(--neon-pink)', fill: 'var(--neon-pink)' }} />
          <span>for the Base Builder Guild</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
