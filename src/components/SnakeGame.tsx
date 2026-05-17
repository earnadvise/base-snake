import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Position } from '../store/gameStore';
import { soundEffects } from '../utils/soundEffects';
import { Play, RotateCcw, Volume2, VolumeX, Pause, ShieldAlert } from 'lucide-react';

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const BLOCK_SIZE = CANVAS_SIZE / GRID_SIZE;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    gameState,
    score,
    highScore,
    snake,
    food,
    direction,
    speed,
    isSoundMuted,
    setGameState,
    setScore,
    setSnake,
    setFood,
    setDirection,
    setSpeed,
    toggleSound,
    resetGame,
  } = useGameStore();

  const particlesRef = useRef<Particle[]>([]);

  // Ref to hold current direction to avoid direct dependency issues in the tick
  const directionRef = useRef(direction);
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Generate glowing particle burst
  const triggerParticleBurst = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    const px = x * BLOCK_SIZE + BLOCK_SIZE / 2;
    const py = y * BLOCK_SIZE + BLOCK_SIZE / 2;
    
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedPower = 1 + Math.random() * 4;
      newParticles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speedPower,
        vy: Math.sin(angle) * speedPower,
        color,
        size: 2 + Math.random() * 4,
        alpha: 1.0,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      
      const currentDir = directionRef.current;
      let newDir = { ...currentDir };

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y === 0) newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y === 0) newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x === 0) newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x === 0) newDir = { x: 1, y: 0 };
          break;
        default:
          return;
      }
      
      // Only set direction if it changed and is a valid turn
      if (newDir.x !== currentDir.x || newDir.y !== currentDir.y) {
        setDirection(newDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, setDirection]);

  // Check collision with coordinates
  const checkCollision = (head: Position, body: Position[]) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    for (let cell of body) {
      if (cell.x === head.x && cell.y === head.y) {
        return true;
      }
    }
    return false;
  };

  // Place food at new random coordinate
  const generateNewFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    let onSnake = true;
    
    while (onSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      
      // Check if food lands on the snake
      onSnake = currentSnake.some(cell => cell.x === newFood.x && cell.y === newFood.y);
    }
    return newFood!;
  }, []);

  // Primary Gameplay Loop (tick)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const gameTick = () => {
      const currentSnake = [...useGameStore.getState().snake];
      const currentDir = directionRef.current;
      const currentFood = useGameStore.getState().food;
      const currentScore = useGameStore.getState().score;
      const currentSpeed = useGameStore.getState().speed;

      // Calculate new head position
      const head = {
        x: currentSnake[0].x + currentDir.x,
        y: currentSnake[0].y + currentDir.y,
      };

      // Collision Check
      if (checkCollision(head, currentSnake)) {
        soundEffects.playGameOver();
        setGameState('GAME_OVER');
        return;
      }

      // Add new head
      const newSnake = [head, ...currentSnake];

      // Check if food was eaten
      if (head.x === currentFood.x && head.y === currentFood.y) {
        soundEffects.playEat();
        triggerParticleBurst(currentFood.x, currentFood.y, '#06b6d4'); // Cyber cyan particles
        
        const nextFood = generateNewFood(newSnake);
        setFood(nextFood);
        
        const newScore = currentScore + 10;
        setScore(newScore);

        // Gradually increase game speed (minimum delay of 60ms)
        const nextSpeed = Math.max(60, currentSpeed - 4);
        setSpeed(nextSpeed);
      } else {
        // Remove tail cell if food was not eaten
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    const intervalId = setInterval(gameTick, speed);
    return () => clearInterval(intervalId);
  }, [gameState, speed, generateNewFood, setFood, setGameState, setScore, setSpeed, setSnake, triggerParticleBurst]);

  // Animation Loop (60fps Canvas Render & Particle updates)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawGame = () => {
      // Clear board
      ctx.fillStyle = '#06040c';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw Retro Grid lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, CANVAS_SIZE);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
      }

      // Draw Glowing Food
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#06b6d4'; // Cyan neon
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      // Pulsing effect using timestamp
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
      const r = (BLOCK_SIZE / 2) * 0.8 * pulse;
      ctx.arc(
        food.x * BLOCK_SIZE + BLOCK_SIZE / 2,
        food.y * BLOCK_SIZE + BLOCK_SIZE / 2,
        r,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // Draw Neon Snake
      snake.forEach((cell, index) => {
        const isHead = index === 0;
        ctx.save();
        ctx.shadowBlur = isHead ? 20 : 10;
        ctx.shadowColor = isHead ? '#ec4899' : '#a855f7'; // Pink head, purple body
        
        ctx.fillStyle = isHead ? '#ec4899' : '#a855f7';
        
        // Rounded neon blocks
        const padding = 2;
        const x = cell.x * BLOCK_SIZE + padding;
        const y = cell.y * BLOCK_SIZE + padding;
        const size = BLOCK_SIZE - padding * 2;
        const radius = isHead ? 6 : 4;
        
        // Custom draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Draw cute little terminal eyes on head
        if (isHead) {
          ctx.fillStyle = '#ffffff';
          const eyeSize = 3;
          const offset = 5;
          // Position eyes based on direction
          let eyeLeft = { x: x + offset, y: y + offset };
          let eyeRight = { x: x + size - offset - eyeSize, y: y + offset };

          if (direction.x === 1) { // RIGHT
            eyeLeft = { x: x + size - offset - eyeSize, y: y + offset };
            eyeRight = { x: x + size - offset - eyeSize, y: y + size - offset - eyeSize };
          } else if (direction.x === -1) { // LEFT
            eyeLeft = { x: x + offset, y: y + offset };
            eyeRight = { x: x + offset, y: y + size - offset - eyeSize };
          } else if (direction.y === 1) { // DOWN
            eyeLeft = { x: x + offset, y: y + size - offset - eyeSize };
            eyeRight = { x: x + size - offset - eyeSize, y: y + size - offset - eyeSize };
          }

          ctx.fillRect(eyeLeft.x, eyeLeft.y, eyeSize, eyeSize);
          ctx.fillRect(eyeRight.x, eyeRight.y, eyeSize, eyeSize);
        }

        ctx.restore();
      });

      // Update and Draw Particles
      const activeParticles = particlesRef.current.map(p => {
        // Draw particle
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Move particle
        return {
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vx: p.vx * 0.96, // drag
          vy: p.vy * 0.96,
          alpha: p.alpha - 0.02, // fade
        };
      }).filter(p => p.alpha > 0);

      particlesRef.current = activeParticles;

      // Infinite animation frames
      animationId = requestAnimationFrame(drawGame);
    };

    drawGame();
    return () => cancelAnimationFrame(animationId);
  }, [snake, food, direction]);

  // Touch handlers for mobile
  const handleTouchControl = (dir: Position) => {
    if (gameState !== 'PLAYING') return;
    const currentDir = directionRef.current;
    
    // Validate turn (no 180s)
    if (dir.x !== 0 && currentDir.x === 0) {
      setDirection(dir);
      soundEffects.playSelect();
    } else if (dir.y !== 0 && currentDir.y === 0) {
      setDirection(dir);
      soundEffects.playSelect();
    }
  };

  const startGameHandler = () => {
    soundEffects.playSelect();
    setGameState('PLAYING');
  };

  const pauseGameHandler = () => {
    soundEffects.playSelect();
    setGameState('PAUSED');
  };

  const resetGameHandler = () => {
    soundEffects.playSelect();
    resetGame();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      
      {/* Game Header Console */}
      <div className="arcade-card" style={{ width: '100%', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-neon btn-pink" onClick={toggleSound} style={{ padding: '8px 12px' }} title="Toggle Sound">
            {isSoundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '12px', color: 'var(--neon-purple)', fontFamily: 'var(--font-arcade)' }}>HI-SCORE</span>
            <span className="text-neon-pink" style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-arcade)' }}>{highScore}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'var(--font-arcade)' }}>SCORE</span>
          <span className="text-neon-cyan" style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-arcade)' }}>{score}</span>
        </div>

        <div>
          {gameState === 'PLAYING' ? (
            <button className="btn-neon btn-cyan" onClick={pauseGameHandler} style={{ padding: '8px 16px', fontSize: '12px' }}>
              <Pause size={14} /> PAUSE
            </button>
          ) : (
            <button className="btn-neon btn-emerald" onClick={startGameHandler} disabled={gameState === 'GAME_OVER'} style={{ padding: '8px 16px', fontSize: '12px' }}>
              <Play size={14} /> PLAY
            </button>
          )}
        </div>
      </div>

      {/* Canvas Box */}
      <div style={{ position: 'relative', border: '3px solid var(--neon-purple)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 25px var(--neon-purple-glow), inset 0 0 10px rgba(0,0,0,1)', background: '#06040c' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        />

        {/* Screen Overlays */}
        {gameState === 'IDLE' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(6, 4, 12, 0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px', zIndex: 5 }}>
            <h2 className="retro-glitch" style={{ fontSize: '28px', margin: 0 }}>INSERT COIN</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '280px', textAlign: 'center' }}>
              Control with <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Arrow keys</span> or <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>WASD</span>. Eat glowing cyan tokens to grow!
            </p>
            <button className="btn-neon btn-purple" onClick={startGameHandler} style={{ fontSize: '16px', padding: '14px 28px' }}>
              <Play size={18} /> START GAME
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(6, 4, 12, 0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px', zIndex: 5 }}>
            <h2 className="retro-glitch" style={{ fontSize: '28px', margin: 0, color: 'var(--neon-cyan)' }}>PAUSED</h2>
            <button className="btn-neon btn-cyan" onClick={startGameHandler} style={{ fontSize: '14px' }}>
              <Play size={16} /> RESUME
            </button>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(6, 4, 12, 0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', zIndex: 5, padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-pink)' }}>
              <ShieldAlert size={32} />
              <h2 className="retro-glitch" style={{ fontSize: '32px', margin: 0, color: 'var(--neon-pink)' }}>GAME OVER</h2>
            </div>
            
            <p style={{ color: '#cbd5e1', fontSize: '15px' }}>
              FINAL SCORE: <span className="text-neon-cyan" style={{ fontFamily: 'var(--font-arcade)', fontWeight: 'bold', fontSize: '18px' }}>{score}</span>
            </p>

            {score > 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '280px', textAlign: 'center', margin: '0 0 10px' }}>
                Great run! Connect your wallet below to record this high score on the global Base Mainnet Leaderboard!
              </p>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 10px' }}>
                Score at least 10 points to submit to on-chain board.
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-neon btn-pink" onClick={resetGameHandler}>
                <RotateCcw size={16} /> RESTART
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-screen Mobile responsive D-PAD controller */}
      <div className="mobile-dpad" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <button className="btn-neon btn-purple" onClick={() => handleTouchControl({ x: 0, y: -1 })} style={{ padding: '12px 20px', borderRadius: '50%' }}>
          ▲
        </button>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button className="btn-neon btn-purple" onClick={() => handleTouchControl({ x: -1, y: 0 })} style={{ padding: '12px 20px', borderRadius: '50%' }}>
            ◀
          </button>
          <button className="btn-neon btn-purple" onClick={() => handleTouchControl({ x: 1, y: 0 })} style={{ padding: '12px 20px', borderRadius: '50%' }}>
            ▶
          </button>
        </div>
        <button className="btn-neon btn-purple" onClick={() => handleTouchControl({ x: 0, y: 1 })} style={{ padding: '12px 20px', borderRadius: '50%' }}>
          ▼
        </button>
      </div>

      {/* Inline styles for responsive Mobile D-Pad reveal */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-dpad {
            display: flex !important;
          }
        }
      `}</style>
      
    </div>
  );
}
