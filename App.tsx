import React, { useState, useEffect } from 'react';
import { GameState, QuizQuestion } from './types';
import { generateQuestions } from './services/geminiService';
import { GameEngine } from './components/GameEngine';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [finalScore, setFinalScore] = useState(0);

  const startGame = async () => {
    setGameState(GameState.LOADING);
    const generated = await generateQuestions();
    setQuestions(generated);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState(GameState.GAME_OVER);
  };

  const renderContent = () => {
    switch (gameState) {
      case GameState.MENU:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-300 to-blue-400 p-4 text-center">
            <div className="bg-white/90 p-10 rounded-3xl shadow-2xl max-w-lg border-b-8 border-green-600 transform hover:scale-105 transition-transform duration-300">
              <h1 className="text-5xl font-extrabold text-green-700 mb-6 drop-shadow-sm">
                🌱 พอเพียง<br/>Quest AR
              </h1>
              <p className="text-xl text-gray-700 mb-8 font-medium">
                เกมตอบคำถามเศรษฐกิจพอเพียง<br/>
                ขยับตัวเพื่อเก็บคำตอบที่ถูกต้อง!
              </p>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                    <span className="text-2xl">📹</span>
                    <span>เกมนี้ใช้กล้องในการตรวจจับการเคลื่อนไหว</span>
                 </div>

                 <button
                  onClick={startGame}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-3xl font-bold py-4 px-8 rounded-full shadow-lg border-b-4 border-yellow-600 active:translate-y-1 active:border-b-0 transition-all"
                >
                  เริ่มเกมเลย! 🚀
                </button>
              </div>
            </div>
            
            <footer className="absolute bottom-4 text-white/80 text-sm">
               สร้างสำหรับนักเรียนชั้นป.4 • Powered by Gemini AI
            </footer>
          </div>
        );

      case GameState.LOADING:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100">
            <div className="animate-spin text-6xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold text-gray-700 animate-pulse">กำลังให้ AI สร้างคำถาม...</h2>
            <p className="text-gray-500 mt-2">เตรียมตัวขยับร่างกายให้พร้อม!</p>
          </div>
        );

      case GameState.PLAYING:
        return (
          <GameEngine 
            questions={questions}
            onGameOver={handleGameOver}
          />
        );

      case GameState.GAME_OVER:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-purple-400 to-pink-400 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-purple-200">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">หมดเวลา! 🏁</h2>
              
              <div className="py-6">
                <p className="text-gray-500 text-lg uppercase tracking-widest">คะแนนของคุณ</p>
                <div className="text-7xl font-black text-purple-600 my-2">{finalScore}</div>
              </div>

              <div className="space-y-3">
                 <p className="text-gray-600 italic">"ความพอประมาณ คือหัวใจของความพอเพียง"</p>
                 <button
                  onClick={startGame}
                  className="w-full bg-green-500 hover:bg-green-400 text-white text-2xl font-bold py-3 px-6 rounded-xl shadow-md transition-colors"
                >
                  เล่นอีกครั้ง 🔄
                </button>
                <button
                  onClick={() => setGameState(GameState.MENU)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xl font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  กลับหน้าหลัก
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="antialiased text-gray-900 font-sans">
      {renderContent()}
    </div>
  );
};

export default App;
