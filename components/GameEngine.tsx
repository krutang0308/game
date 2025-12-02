import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMotionTracker } from '../hooks/useMotionTracker';
import { FallingItem, QuizQuestion } from '../types';

interface GameEngineProps {
  questions: QuizQuestion[];
  onGameOver: (score: number) => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ questions, onGameOver }) => {
  const { videoRef, canvasRef, playerX, permissionGranted } = useMotionTracker(true);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds total game time
  const [items, setItems] = useState<FallingItem[]>([]);
  const [showFeedback, setShowFeedback] = useState<{msg: string, color: string} | null>(null);

  const requestRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);
  const gameStateRef = useRef({
    score: 0,
    currentQIndex: 0,
    isGameOver: false
  });

  // Sync refs
  useEffect(() => {
    gameStateRef.current.score = score;
    gameStateRef.current.currentQIndex = currentQIndex;
  }, [score, currentQIndex]);

  // Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          gameStateRef.current.isGameOver = true;
          onGameOver(gameStateRef.current.score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onGameOver]);

  // Game Loop
  const gameLoop = useCallback((time: number) => {
    if (gameStateRef.current.isGameOver) return;

    setItems(prevItems => {
      const newItems: FallingItem[] = [];
      const containerH = window.innerHeight;
      const containerW = window.innerWidth;
      
      // Player Hitbox (bottom center, based on motion playerX)
      const playerW = 120; // Width of basket/character
      const playerH = 80;
      const playerXPx = (playerX / 100) * containerW;
      const playerYPx = containerH - 100;

      let itemHit = false;

      prevItems.forEach(item => {
        // Move item down
        item.y += item.speed;

        // Collision Detection (AABB)
        const hitPlayer = 
          item.x < playerXPx + playerW / 2 &&
          item.x + item.width > playerXPx - playerW / 2 &&
          item.y < playerYPx + playerH &&
          item.y + item.height > playerYPx;

        if (hitPlayer) {
          itemHit = true;
          if (item.isCorrect) {
            setScore(s => s + 10);
            setShowFeedback({ msg: "+10 เยี่ยมมาก!", color: "text-green-600" });
            // Next Question after a delay or immediately? 
            // Let's cycle question immediately on correct catch
            setCurrentQIndex(prev => (prev + 1) % questions.length);
          } else {
            setScore(s => Math.max(0, s - 5));
            setShowFeedback({ msg: "-5 ผิดนะจ๊ะ!", color: "text-red-600" });
          }
          setTimeout(() => setShowFeedback(null), 1000);
        } else if (item.y < containerH) {
          // Keep item if not off screen
          newItems.push(item);
        }
      });

      // Spawn Logic
      if (!itemHit && time - lastSpawnTime.current > 1500) { // Spawn every 1.5s
        const currentQ = questions[gameStateRef.current.currentQIndex];
        // Randomly choose an answer from current question or a wrong one
        const isCorrectSpawn = Math.random() > 0.4; // 60% chance of correct answer to make it playable
        
        let text = "";
        let isCorrect = false;

        if (isCorrectSpawn) {
          text = currentQ.answers[currentQ.correctAnswerIndex];
          isCorrect = true;
        } else {
           // Pick a wrong answer
           const wrongAnswers = currentQ.answers.filter((_, i) => i !== currentQ.correctAnswerIndex);
           text = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
           isCorrect = false;
        }

        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          text,
          isCorrect,
          x: Math.random() * (containerW - 150) + 25, // Random X, padding
          y: -100,
          speed: 3 + Math.random() * 2, // Random speed
          width: 120, // approx width
          height: 60
        });
        lastSpawnTime.current = time;
      }

      return newItems;
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [playerX, questions]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      {/* Background Video Layer */}
      <video 
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60 scale-x-[-1]" 
        playsInline 
        muted 
      />
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} width={64} height={48} className="hidden" />

      {/* UI Overlay */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        
        {/* Top HUD */}
        <div className="flex flex-col items-center pt-6 px-4 space-y-2">
          <div className="flex justify-between w-full max-w-4xl bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border-2 border-green-500">
             <div className="text-xl font-bold text-gray-800">
               คะแนน: <span className="text-green-600 text-3xl">{score}</span>
             </div>
             <div className="text-xl font-bold text-gray-800">
               เวลา: <span className={`${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-600'} text-3xl`}>{timeLeft}</span>
             </div>
          </div>

          {/* Current Question Display */}
          <div className="bg-blue-600/90 text-white p-6 rounded-2xl shadow-lg max-w-2xl text-center border-4 border-yellow-400">
            <h2 className="text-2xl font-bold drop-shadow-md">
              {questions[currentQIndex]?.question}
            </h2>
          </div>
        </div>

        {/* Feedback Popup */}
        {showFeedback && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
             <div className={`text-6xl font-black ${showFeedback.color} drop-shadow-[0_4px_4px_rgba(255,255,255,1)] animate-bounce`}>
               {showFeedback.msg}
             </div>
          </div>
        )}

        {/* Falling Items */}
        {items.map(item => (
          <div 
            key={item.id}
            className={`absolute flex items-center justify-center p-3 rounded-full text-lg font-bold shadow-lg border-2 
              ${item.isCorrect ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}
            `}
            style={{
              left: item.x,
              top: item.y,
              width: `${item.width}px`,
              height: `auto`,
              minHeight: `${item.height}px`
            }}
          >
            {item.text}
          </div>
        ))}

        {/* Player Avatar (Follows Motion) */}
        <div 
          className="absolute bottom-4 w-32 h-32 transition-transform duration-75 ease-out"
          style={{ 
            left: `${playerX}%`, 
            transform: 'translateX(-50%)' 
          }}
        >
          {/* A cute basket or character sprite */}
          <div className="relative w-full h-full">
            <div className="absolute bottom-0 w-full h-24 bg-amber-400 rounded-b-3xl rounded-t-lg border-4 border-amber-600 shadow-xl flex items-center justify-center overflow-hidden">
               <span className="text-4xl">🧺</span>
            </div>
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-center bg-white/80 px-2 rounded-lg text-sm font-bold">
              รับคำตอบ!
            </div>
          </div>
        </div>

        {!permissionGranted && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white pointer-events-auto">
             <div className="text-center p-8">
               <h3 className="text-2xl mb-4">ต้องการสิทธิ์การใช้กล้อง</h3>
               <p>กรุณากดอนุญาตให้ใช้กล้องเพื่อเล่นเกมแบบ Motion Tracking</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
