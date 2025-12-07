"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface EvaluationResult {
    type: "cp" | "mate"; // centipawn or mate
    value: number; // centipawns or moves to mate
    depth: number;
}

export const useStockfish = () => {
    const engineRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initialize Stockfish engine
        const initEngine = async () => {
            try {
                // Load Stockfish from public directory
                // Files are copied from node_modules during postinstall
                const workerPath = "/stockfish/stockfish-17.1-lite-single-03e3232.js";
                const engine = new Worker(workerPath);

                engineRef.current = engine;

                engine.onmessage = (event: MessageEvent) => {
                    const message = event.data || event;

                    if (typeof message === "string") {
                        // Engine is ready
                        if (message === "uciok") {
                            setIsReady(true);
                        }

                        // Parse evaluation from info lines
                        if (message.startsWith("info") && message.includes("score")) {
                            const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
                            const depthMatch = message.match(/depth (\d+)/);

                            if (scoreMatch && depthMatch) {
                                const type = scoreMatch[1] as "cp" | "mate";
                                const value = parseInt(scoreMatch[2]);
                                const depth = parseInt(depthMatch[1]);

                                setEvaluation({ type, value, depth });
                            }
                        }
                    }
                };

                // Initialize UCI protocol
                engine.postMessage("uci");
            } catch (error) {
                console.error("Failed to initialize Stockfish:", error);
            }
        };

        initEngine();

        // Cleanup on unmount
        return () => {
            if (analysisTimeoutRef.current) {
                clearTimeout(analysisTimeoutRef.current);
            }
            if (engineRef.current) {
                engineRef.current.postMessage("quit");
                engineRef.current.terminate();
            }
        };
    }, []);

    const analyzePosition = useCallback((fen: string, depth: number = 15) => {
        if (!engineRef.current || !isReady) return;

        // Clear previous analysis timeout
        if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
        }

        // Stop any ongoing analysis
        engineRef.current.postMessage("stop");

        // Small delay before starting new analysis
        analysisTimeoutRef.current = setTimeout(() => {
            if (engineRef.current) {
                engineRef.current.postMessage("ucinewgame");
                engineRef.current.postMessage(`position fen ${fen}`);
                engineRef.current.postMessage(`go depth ${depth}`);
            }
        }, 100);
    }, [isReady]);

    const stopAnalysis = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.postMessage("stop");
        }
        if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
        }
    }, []);

    return {
        isReady,
        evaluation,
        analyzePosition,
        stopAnalysis,
    };
};
