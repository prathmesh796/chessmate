"use client";

import { EvaluationResult } from "@/hooks/useStockfish";

interface EvaluationBarProps {
    evaluation: EvaluationResult | null;
}

const EvaluationBar = ({ evaluation }: EvaluationBarProps) => {
    // Calculate the percentage for white (0-100%)
    const getWhitePercentage = (): number => {
        if (!evaluation) return 50; // Equal position

        if (evaluation.type === "mate") {
            // Mate score: positive = white winning, negative = black winning
            return evaluation.value > 0 ? 100 : 0;
        }

        // Centipawn evaluation
        // Convert centipawns to percentage using sigmoid-like function
        // Typical range: -500 to +500 centipawns
        const cp = evaluation.value;
        const maxCp = 500;
        const clampedCp = Math.max(-maxCp, Math.min(maxCp, cp));

        // Sigmoid transformation for smooth visualization
        const percentage = 50 + (clampedCp / maxCp) * 50;
        return Math.max(0, Math.min(100, percentage));
    };

    const getEvaluationText = (): string => {
        if (!evaluation) return "0.0";

        if (evaluation.type === "mate") {
            const moves = Math.abs(evaluation.value);
            return evaluation.value > 0 ? `M${moves}` : `-M${moves}`;
        }

        // Convert centipawns to pawns
        const pawns = (evaluation.value / 100).toFixed(1);
        return evaluation.value >= 0 ? `+${pawns}` : pawns;
    };

    const whitePercentage = getWhitePercentage();
    const blackPercentage = 100 - whitePercentage;
    const evaluationText = getEvaluationText();
    const isWhiteAdvantage = evaluation ?
        (evaluation.type === "mate" ? evaluation.value > 0 : evaluation.value > 0) :
        true;

    return (
        <div className="flex flex-col items-center gap-3 bg-[#262421] rounded-lg p-4 border border-[#3d3d3d] shadow-lg">
            {/* Title */}
            <div className="text-white font-semibold text-sm">Evaluation</div>

            {/* Vertical Bar */}
            <div className="relative w-12 h-[480px] bg-[#1a1a1a] rounded-lg overflow-hidden border-2 border-[#3d3d3d] shadow-inner">
                {/* White section (bottom) */}
                <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-gray-200 transition-all duration-500 ease-out"
                    style={{ height: `${whitePercentage}%` }}
                />

                {/* Black section (top) */}
                <div
                    className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-gray-800 transition-all duration-500 ease-out"
                    style={{ height: `${blackPercentage}%` }}
                />

                {/* Center line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#81b64c] transform -translate-y-1/2 z-10" />
            </div>

            {/* Evaluation Score */}
            <div className={`text-lg font-bold font-mono px-3 py-1.5 rounded-md ${isWhiteAdvantage
                    ? "bg-white text-black"
                    : "bg-black text-white"
                } border-2 border-[#81b64c] shadow-md min-w-[60px] text-center`}>
                {evaluationText}
            </div>

            {/* Depth indicator */}
            {evaluation && (
                <div className="text-gray-400 text-xs">
                    Depth: {evaluation.depth}
                </div>
            )}
        </div>
    );
};

export default EvaluationBar;
