"use client";

import { useSearchParams } from "next/navigation";
import ChessBoard from "@/components/ChessBoard";

export default function Page() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("data");

  if (!encoded) return <div>No game data</div>;

  let moves = "";
  try {
    moves = atob(encoded); // safe
  } catch (e) {
    return <div>Invalid PGN encoding!</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Game Review</h1>
      </header>
      <main className="flex-grow flex items-center justify-center bg-gray-900 p-8">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
          <ChessBoard pgn={moves} />
        </div>
      </main>
    </div>
  );
};