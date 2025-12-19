"use client";

import { Chess } from "chess.js";
import { EngineLine } from "@/hooks/useStockfish";

interface EngineLinesProps {
    lines: EngineLine[];
    currentPosition: string;
}

const EngineLines = ({ lines, currentPosition }: EngineLinesProps) => {
    // Convert UCI moves to SAN (Standard Algebraic Notation)
    const convertUCItoSAN = (uciMoves: string[], fen: string): string[] => {
        if (!uciMoves || uciMoves.length === 0) {
            return [];
        }

        try {
            const tempGame = new Chess(fen);
            const sanMoves: string[] = [];

            for (let i = 0; i < Math.min(uciMoves.length, 5); i++) {
                try {
                    const uciMove = uciMoves[i];

                    // Parse UCI move format (e.g., "e2e4", "e7e8q")
                    const from = uciMove.substring(0, 2);
                    const to = uciMove.substring(2, 4);
                    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

                    const move = tempGame.move({
                        from,
                        to,
                        promotion,
                    });

                    if (move) {
                        sanMoves.push(move.san);
                    } else {
                        // Move is invalid for this position, stop processing
                        break;
                    }
                } catch (e) {
                    // Move conversion failed, stop processing this line
                    // This can happen during rapid position changes
                    break;
                }
            }

            return sanMoves;
        } catch (e) {
            // Invalid FEN or Chess.js error, return empty array
            return [];
        }
    };

    // Format evaluation for display
    const formatEvaluation = (line: EngineLine): string => {
        const { evaluation } = line;

        if (evaluation.type === "mate") {
            return `M${Math.abs(evaluation.value)}`;
        }

        // Convert centipawns to pawns
        const pawns = evaluation.value / 100;
        return pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
    };

    // Get evaluation color based on value
    const getEvalColor = (line: EngineLine): string => {
        const { evaluation } = line;

        if (evaluation.type === "mate") {
            return evaluation.value > 0 ? "text-green-400" : "text-red-400";
        }

        if (evaluation.value > 50) return "text-green-400";
        if (evaluation.value < -50) return "text-red-400";
        return "text-gray-300";
    };

    if (lines.length === 0) {
        return (
            <section className="bg-[#262421] rounded-lg border border-[#3d3d3d] shadow-lg">
                <div className="bg-[#312e2b] px-4 py-3 rounded-t-lg border border-[#3d3d3d]">
                    <h2 className="text-white font-bold text-base flex items-center gap-2">
                        <span className="text-[#81b64c]">🔍</span>
                        Engine Lines
                    </h2>
                </div>
                <div className="text-gray-400 text-center py-6 text-sm">
                    Analyzing position...
                </div>
            </section>
        );
    }

    return (
        <section className="bg-[#262421] rounded-lg border border-[#3d3d3d] shadow-lg">
            <div className="bg-[#312e2b] px-4 py-3 rounded-t-lg border border-[#3d3d3d]">
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                    <span className="text-[#81b64c]">🔍</span>
                    Engine Lines
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                    Top {lines.length} best moves • Depth {lines[0]?.evaluation.depth || 0}
                </p>
            </div>

            <div className="space-y-3 p-4">
                {lines.map((line, index) => {
                    const sanMoves = convertUCItoSAN(line.moves, currentPosition);
                    const evalText = formatEvaluation(line);
                    const evalColor = getEvalColor(line);
                    const isBestMove = index === 0;

                    return (
                        <div
                            key={line.multipv}
                            className={`rounded-lg p-4 transition-all duration-200 ${isBestMove
                                ? "bg-[#81b64c] bg-opacity-20 border-2 border-[#81b64c]"
                                : "bg-[#312e2b] border border-[#3d3d3d] hover:bg-[#3d3d3d]"
                                }`}
                        >
                            <div className="flex flex-wrap gap-2">
                                {sanMoves.length > 0 ? (
                                    <div className="flex items-center justify-evenly gap-2">
                                        <span className="text-gray-400 text-xs font-semibold">
                                            #{line.multipv}
                                        </span>

                                        {sanMoves.map((move, moveIndex) => (
                                            <span
                                                key={moveIndex}
                                                className={`font-mono text-sm px-2 py-1 rounded ${moveIndex === 0 && isBestMove
                                                    ? "bg-[#81b64c] text-white font-bold"
                                                    : "bg-[#262421] text-gray-300"
                                                    }`}
                                            >
                                                {move}
                                            </span>
                                        ))}
                                        {sanMoves.length < line.moves.length && (
                                            <span className="text-gray-500 text-sm px-2 py-1">...</span>
                                        )}

                                        <span className={`font-bold text-lg ${evalColor}`}>
                                            {evalText}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-gray-500 text-sm">No moves available</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default EngineLines;
