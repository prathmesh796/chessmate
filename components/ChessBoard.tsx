"use client";

import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const ChessBoard = ({ pgn }: { pgn?: string }) => {
  const [game, setGame] = useState(new Chess());

  // Load PGN if provided
  if (pgn) {
    game.loadPgn(pgn);
  }

  // Handle move validation
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // Auto-promote to Queen
    });

    if (move === null) return false; // Invalid move

    setGame(new Chess(game.fen())); // Update board state
    return true;
  };

  return (
    <div className="flex flex-col items-center">
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardWidth={400}
        customBoardStyle={{
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        }}
      />
    </div>
  );
};

export default ChessBoard;