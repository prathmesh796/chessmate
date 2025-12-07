"use client";

import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const ChessBoard = ({ pgn }: { pgn?: string }) => {
  const [game] = useState(new Chess());
  const [moves, setMoves] = useState<string[][]>([]);
  const [allPositions, setAllPositions] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<string>("");
  const isReviewMode = !!pgn;

  // Initialize game positions from PGN
  useEffect(() => {
    if (pgn) {
      const tempGame = new Chess();
      tempGame.loadPgn(pgn);

      // Get all moves
      const history = tempGame.history();

      // Generate all positions
      const positions: string[] = [];
      const tempGame2 = new Chess();
      positions.push(tempGame2.fen()); // Initial position

      history.forEach((move) => {
        tempGame2.move(move);
        positions.push(tempGame2.fen());
      });

      setAllPositions(positions);
      setCurrentPosition(positions[0]);

      // Format moves for display
      const formattedMoves: string[][] = [];
      for (let i = 0; i < history.length; i += 2) {
        const movePair = [history[i], history[i + 1] || ""];
        formattedMoves.push(movePair);
      }
      setMoves(formattedMoves);
    }
  }, [pgn]);

  // Navigation functions
  const goToNextMove = () => {
    if (currentMoveIndex < allPositions.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      setCurrentPosition(allPositions[newIndex]);
    }
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      setCurrentPosition(allPositions[newIndex]);
    }
  };

  const goToFirstMove = () => {
    setCurrentMoveIndex(0);
    setCurrentPosition(allPositions[0]);
  };

  const goToLastMove = () => {
    const lastIndex = allPositions.length - 1;
    setCurrentMoveIndex(lastIndex);
    setCurrentPosition(allPositions[lastIndex]);
  };

  const goToMove = (moveIndex: number) => {
    if (moveIndex >= 0 && moveIndex < allPositions.length) {
      setCurrentMoveIndex(moveIndex);
      setCurrentPosition(allPositions[moveIndex]);
    }
  };

  // Handle move validation (only for non-review mode)
  const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (isReviewMode || !targetSquare) return false;

    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move === null) return false;
    return true;
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6">
      {/* Chessboard Section */}
      <section className="flex flex-col items-center">
        <div className="mb-4" style={{ width: 480 }}>
          <Chessboard
            options={{
              position: isReviewMode ? currentPosition : game.fen(),
              boardStyle: {
                borderRadius: "8px",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
              },
              onPieceDrop: onDrop,
              allowDragging: !isReviewMode,
            }}
          />
        </div>

        {/* Navigation Controls */}
        {isReviewMode && (
          <div className="w-full max-w-[480px] bg-[#262421] rounded-lg p-5 border border-[#3d3d3d] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-base font-semibold">
                Move {currentMoveIndex} <span className="text-gray-400">of {allPositions.length - 1}</span>
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#81b64c] animate-pulse"></div>
                <span className="text-gray-400 text-sm">Live Analysis</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={goToFirstMove}
                disabled={currentMoveIndex === 0}
                className="px-4 py-3 bg-[#81b64c] text-white rounded-lg hover:bg-[#7fa650] disabled:bg-[#3d3d3d] disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="First move"
              >
                ⏮
              </button>

              <button
                onClick={goToPreviousMove}
                disabled={currentMoveIndex === 0}
                className="px-5 py-3 bg-[#81b64c] text-white rounded-lg hover:bg-[#7fa650] disabled:bg-[#3d3d3d] disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="Previous move"
              >
                ◀
              </button>

              <button
                onClick={goToNextMove}
                disabled={currentMoveIndex === allPositions.length - 1}
                className="px-5 py-3 bg-[#81b64c] text-white rounded-lg hover:bg-[#7fa650] disabled:bg-[#3d3d3d] disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="Next move"
              >
                ▶
              </button>

              <button
                onClick={goToLastMove}
                disabled={currentMoveIndex === allPositions.length - 1}
                className="px-4 py-3 bg-[#81b64c] text-white rounded-lg hover:bg-[#7fa650] disabled:bg-[#3d3d3d] disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="Last move"
              >
                ⏭
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Moves History */}
      <section className="flex-1 bg-[#262421] rounded-lg border border-[#3d3d3d] shadow-lg overflow-hidden min-w-[350px]">
        <div className="bg-[#312e2b] px-6 py-4 border-b border-[#3d3d3d]">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="text-[#81b64c]">📋</span>
            Moves History
          </h2>
        </div>

        <div className="p-4">
          <ol className="list-none space-y-1 h-[500px] overflow-y-auto pr-2 scrollbar-custom">
            {moves.map((movePair, index) => {
              const moveNumber = index + 1;
              const isWhiteActive = currentMoveIndex === moveNumber * 2 - 1;
              const isBlackActive = currentMoveIndex === moveNumber * 2;

              return (
                <li
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-150 ${(isWhiteActive || isBlackActive) ? 'bg-[#3d3d3d]' : 'hover:bg-[#2f2f2f]'
                    }`}
                >
                  <span className="text-gray-500 font-semibold min-w-[40px] text-sm">
                    {moveNumber}.
                  </span>

                  <div className="flex gap-2 flex-1">
                    <span
                      onClick={() => goToMove(moveNumber * 2 - 1)}
                      className={`cursor-pointer px-4 py-2 rounded-md font-mono text-sm font-medium flex-1 text-center transition-all duration-150 ${isWhiteActive
                        ? "bg-[#81b64c] text-white shadow-md scale-105"
                        : "bg-[#312e2b] text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
                        }`}
                    >
                      {movePair[0]}
                    </span>

                    {movePair[1] && (
                      <span
                        onClick={() => goToMove(moveNumber * 2)}
                        className={`cursor-pointer px-4 py-2 rounded-md font-mono text-sm font-medium flex-1 text-center transition-all duration-150 ${isBlackActive
                          ? "bg-[#81b64c] text-white shadow-md scale-105"
                          : "bg-[#312e2b] text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
                          }`}
                      >
                        {movePair[1]}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <style jsx>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #81b64c;
          border-radius: 4px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #7fa650;
        }
      `}</style>
    </div>
  );
};

export default ChessBoard;