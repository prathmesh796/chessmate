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

  const chessboardOptions = {
    // your config options here
    position: game.fen(),
    boardStyle: {
      display: "grid",
      gridTemplateColumns: `repeat(${8}, 1fr)`,
      overflow: "hidden",
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    pieceStyle: {
      width: "25px",
      height: "25px",
    },
    onPieceDrop: onDrop,
  };

return (
  <div className="flex flex-col items-center">
    <Chessboard
      options={chessboardOptions}
    />
  </div>
);
};

export default ChessBoard;