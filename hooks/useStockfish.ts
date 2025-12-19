"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface EvaluationResult {
    type: "cp" | "mate"; // centipawn or mate
    value: number; // centipawns or moves to mate
    depth: number;
}

export interface EngineLine {
    moves: string[]; // UCI format moves
    evaluation: EvaluationResult;
    multipv: number; // Line number (1 = best, 2 = second best, etc.)
}

export const useStockfish = () => {
    const engineRef = useRef<Worker | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [engineLines, setEngineLines] = useState<EngineLine[]>([]);
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

                        // Parse evaluation and PV lines from info messages
                        if (message.startsWith("info") && message.includes("score")) {
                            const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
                            const depthMatch = message.match(/depth (\d+)/);
                            const multipvMatch = message.match(/multipv (\d+)/);
                            const pvMatch = message.match(/pv (.+)/);

                            if (scoreMatch && depthMatch) {
                                const type = scoreMatch[1] as "cp" | "mate";
                                const value = parseInt(scoreMatch[2]);
                                const depth = parseInt(depthMatch[1]);
                                const evalResult: EvaluationResult = { type, value, depth };

                                // Update main evaluation (from line 1)
                                if (!multipvMatch || multipvMatch[1] === "1") {
                                    setEvaluation(evalResult);
                                }

                                // Parse PV lines for engine lines
                                if (multipvMatch && pvMatch) {
                                    const multipv = parseInt(multipvMatch[1]);
                                    // Extract only valid UCI moves (format: e2e4, a7a8q, etc.)
                                    // UCI moves are 4-5 characters: from_square + to_square + optional_promotion
                                    const allTokens = pvMatch[1].trim().split(/\s+/);
                                    const moves = allTokens.filter(token => {
                                        // Valid UCI move: 4 chars (e.g., e2e4) or 5 chars (e.g., e7e8q for promotion)
                                        if (token.length !== 4 && token.length !== 5) return false;

                                        // Check if it matches UCI format: [a-h][1-8][a-h][1-8][qrbn]?
                                        const uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
                                        return uciPattern.test(token);
                                    });

                                    setEngineLines(prev => {
                                        const newLines = [...prev];
                                        const existingIndex = newLines.findIndex(line => line.multipv === multipv);

                                        const newLine: EngineLine = {
                                            moves,
                                            evaluation: evalResult,
                                            multipv
                                        };

                                        if (existingIndex >= 0) {
                                            newLines[existingIndex] = newLine;
                                        } else {
                                            newLines.push(newLine);
                                        }

                                        // Sort by multipv and keep only top 3
                                        return newLines.sort((a, b) => a.multipv - b.multipv).slice(0, 3);
                                    });
                                }
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
                // Enable MultiPV for top 3 lines
                engineRef.current.postMessage("setoption name MultiPV value 3");
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
        engineLines,
        analyzePosition,
        stopAnalysis,
    };
};
