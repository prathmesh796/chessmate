"use client";

import { useState, useEffect } from "react";
import { EngineLine, EvaluationResult } from "@/hooks/useStockfish";

const STORAGE_KEY_PREFIX = "move-explainer-";


interface MoveExplainerProps {
    currentMove: string | null;
    fen: string;
    bestMove: string | null;
    evalBefore: EvaluationResult | null;
    evalAfter: EvaluationResult | null;
    topLines: EngineLine[];
    moveNumber: number;
    side: "white" | "black";
}

const MoveExplainer = ({
    currentMove,
    fen,
    bestMove,
    evalBefore,
    evalAfter,
    topLines,
    moveNumber,
    side,
}: MoveExplainerProps) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derive a unique key for the current move context
    const getCacheKey = () => {
        if (!currentMove || !fen) return null;
        // Using FEN and move ensures uniqueness for this position
        return `${STORAGE_KEY_PREFIX}${fen}-${currentMove}`;
    };

    // Reset or load from cache when move changes
    useEffect(() => {
        setExplanation(null);
        setError(null);
        setLoading(false);

        const cacheKey = getCacheKey();
        if (cacheKey) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                setExplanation(cached);
            }
        }
    }, [currentMove, fen]);


    const getEvaluationText = (ev: EvaluationResult | null) => {
        if (!ev) return "N/A";
        if (ev.type === "mate") return `Mate in ${ev.value}`;
        return `${(ev.value / 100).toFixed(2)}`;
    };

    const handleExplain = async () => {
        if (!currentMove) return;

        setLoading(true);
        setError(null);
        setExplanation(null);

        try {
            const response = await fetch("/api/explain-move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fen,
                    move: currentMove,
                    bestMove: bestMove || "Unknown",
                    evalBefore: getEvaluationText(evalBefore),
                    evalAfter: getEvaluationText(evalAfter),
                    topLines: topLines.map((l) => ({
                        moves: l.moves.slice(0, 3).join(" "), // Only first 3 moves of line
                        eval: getEvaluationText(l.evaluation),
                    })),
                    moveNumber,
                    side,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch explanation");
            }

            const data = await response.json();
            setExplanation(data.explanation);

            // Save to cache
            const cacheKey = getCacheKey();
            if (cacheKey) {
                localStorage.setItem(cacheKey, data.explanation);
            }

        } catch (err) {
            setError("Failed to generate explanation. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!currentMove) {
        return (
            <div className="bg-[#262421] p-4 rounded-lg border border-[#3d3d3d] text-center text-gray-400 text-sm">
                Make a move to get an explanation.
            </div>
        );
    }

    return (
        <div className="bg-[#262421] p-5 rounded-lg border border-[#3d3d3d] shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className="text-[#81b64c]">✨</span>
                    AI Move Explainer
                </h3>
                {!explanation && !loading && (
                    <button
                        onClick={handleExplain}
                        className="px-3 py-1.5 bg-[#81b64c] hover:bg-[#7fa650] text-white text-xs font-bold rounded shadow-md transition-colors"
                    >
                        Explain This Move
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse">
                    <div className="w-4 h-4 border-2 border-[#81b64c] border-t-transparent rounded-full animate-spin"></div>
                    Analyzing move context...
                </div>
            )}

            {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/40">
                    {error}
                </div>
            )}

            {explanation && (
                <div className="bg-[#1a1a1a] p-3 rounded border border-[#3d3d3d] text-gray-300 text-sm leading-relaxed">
                    {explanation}
                </div>
            )}
        </div>
    );
};

export default MoveExplainer;
