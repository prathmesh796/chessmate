"use client"

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleSubmit = (e:any) => {
    e.preventDefault(); // Prevent the default form submission
    if (username) {
      router.push(`/search/${username}`); // Redirect to the search page with the username
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
        <h1 className="m-4 text-6xl text-white font-bold">Chessmate</h1>
        <h3 className="text-xl text-white">A scrapper for your chess.com account.</h3>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="text"
            placeholder="Enter your chess.com username"
            className="h-10 w-96 rounded-full my-10 mx-5 p-5 outline-none text-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // Update state on input change
          />
          <button type="submit" className="h-10 w-36 bg-pawn rounded-full text-white">
            Search
          </button>
        </form>
      </div>
    </main>
  );
}