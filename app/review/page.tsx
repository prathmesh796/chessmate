"use client";

import { useSearchParams } from "next/navigation";
import ChessBoard from "@/components/ChessBoard";

export default function Page() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("data");

  if (!encoded) return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-white text-xl">No game data</div>
    </div>
  );

  let moves = "";
  try {
    moves = atob(encoded);
  } catch (e) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Invalid PGN encoding!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#262421]">
      {/* Header */}
      <header className="bg-[#312e2b] border-b border-[#3d3d3d] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-[#81b64c]">♔</span>
                Game Review
              </h1>
              <p className="text-gray-400 text-sm mt-1">Analyze your game move by move</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-[#81b64c] hover:bg-[#7fa650] text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                Export PGN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-7xl">
          <div className="bg-[#312e2b] rounded-xl shadow-2xl p-8 border border-[#3d3d3d]">
            <ChessBoard pgn={moves} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#312e2b] border-t border-[#3d3d3d] py-4">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>Powered by Chessmate • Analyze and improve your game</p>
        </div>
      </footer>
    </div>
  );
};