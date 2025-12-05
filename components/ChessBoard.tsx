"use client";

import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

const ChessBoard = ({ pgn }: { pgn?: string }) => {
  const [game, setGame] = useState(new Chess());
  const [moves, setMoves] = useState<string[][]>([]);

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

  useEffect(() => {
    const history = game.history();
    const moves: string[][] = [];

    for(let i = 1; i < history.length; i+=2) {
      const m = [history[i-1], history[i]];
      moves.push(m);
    }
    setMoves(moves);
    //console.log("Moves history:", moves);
  }, [game]);

  const chessboardOptions = {
    // your config options here
    position: game.fen(),
    boardStyle: {
      display: "grid",
      gridTemplateColumns: `repeat(${8}, 1fr)`,
      overflow: "hidden",
      width: '400px',
      height: '400px',
      position: 'relative',
    },
    pieceStyle: {
      width: "25px",
      height: "25px",
    },
    onPieceDrop: onDrop,
  };

return (
  <div className="flex items-center">
    <section className="flex flex-col items-center m-2">
      <Chessboard
      options={chessboardOptions}
    />
    </section>
    
  
    <section className="bg-slate-900 text-white h-max p-4">
      <h2 className="text-center font-bold mb-2">Moves History</h2>
      <ol className="list-decimal list-inside scroll-m-0 h-96 overflow-y-auto">
        {moves.map((movePair, index) => (
          <li key={index} className="w-80">
            {movePair[0]    } {movePair[1] ? movePair[1] : ""}
          </li>
        ))}
      </ol>
    </section>
  </div>
);
};

export default ChessBoard;