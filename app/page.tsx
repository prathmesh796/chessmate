"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false); // New state variable for loading
  const [FNG, setFNG] = useState(""); // State for FNG input
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username) {
      setLoading(true);
      setTimeout(() => {
        router.push(`/search/${username}`);
      }, 1000);
    }
  };

  const handleReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (FNG) {
      setLoading(true);
      setTimeout(() => {
        router.push(`/review/${FNG}`);
      }, 1000);
    }
  };

  return (
    <main>
      <div className="bgWrap">
        <Image
          src="/chess.com-bg.png"
          alt="Chessmate logo"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="opacity-40"
        />
      </div>
      <div className="flex flex-col items-center justify-center h-screen">
        {loading ? ( // Show loading screen if loading is true
          <div className="flex flex-col items-center">
            <h1 className="m-4 text-4xl text-white font-bold">Loading...</h1>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
          </div>
        ) : (
          <>
            <h1 className="m-4 text-6xl text-white font-bold">Chessmate</h1>
            <h3 className="text-xl text-white">A scraper for your chess.com account.</h3>
            <form onSubmit={handleSearch} className="flex flex-col items-center">
              <input
                type="text"
                placeholder="Enter your chess.com username"
                className="h-10 w-96 rounded-full my-10 mx-5 p-5 outline-none text-black"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                type="submit"
                className="h-10 w-36 bg-pawn rounded-full text-white"
                disabled={loading} // Disable button when loading
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </form>

            <form onSubmit={handleReview} className="flex flex-col items-center">
              <input
                type="text"
                placeholder="Enter your chess.com username"
                className="h-10 w-96 rounded-full my-10 mx-5 p-5 outline-none text-black"
                value={FNG}
                onChange={(e) => setFNG(e.target.value)}
              />
              <button
                type="submit"
                className="h-10 w-36 bg-pawn rounded-full text-white"
                disabled={loading} // Disable button when loading
              >
                {loading ? "Searching..." : "Review"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
