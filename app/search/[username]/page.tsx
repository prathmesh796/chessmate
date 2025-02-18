"use client"

import Link from 'next/link';
import { useEffect } from 'react';
import { useChessData } from '@/context/ChessDataContext';

import Navbar from "@/components/Navbar";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const username = (await params).username;

  const chessDataContext = useChessData();

  if (!chessDataContext) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    const fetchData = async () => {
      if (username) {
        await chessDataContext.fetchUserData(username);
      }
    };

    fetchData();
  }, [username, chessDataContext]);

  const playerData = chessDataContext.userProfile;
  if (!playerData) {
    return <div>Player data not found</div>;
  }
  const status = chessDataContext.status;
  const dates = chessDataContext.dates;
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="flex min-h-screen px-44 py-10 bg-profile_bg">
        {/* Sidebar */}
        <aside className="w-1/4 p-4 rounded-lg bg-profile_card text-white">
          <div className="flex items-center justify-around mb-4">
            <Link href={playerData.url}>
              <img
                src={playerData.avatar || '/userimg.png'}
                alt={`${playerData.username}'s avatar`}
                className="w-14 h-14 rounded-full mx-auto"
              />
            </Link>

            <div className="flex flex-col items-left justify-center">
              <Link href={playerData.url}><h2 className="text-xl font-semibold text-center mb-2">{playerData.username}</h2></Link>
              <div className='flex items-center gap-1'>
                <div className={`w-2 h-2 rounded-full ml-2 ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className='text-gray-600'>{status ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>

          <div className='bg-gray-700 h-[1px] w-5/4 rounded-full mb-4'></div>

          
        </aside>


        <article className='flex flex-col w-3/4 mx-4'>
          <nav className='flex justify-start p-4 rounded-lg bg-profile_card mb-4'>
            <ul className='flex gap-4'>
              <li className='text-white'>Rapid</li>
              <li className='text-white'>Daily</li>
              <li className='text-white'>Blitz</li>
              <li className='text-white'>Bullet</li>
            </ul>
          </nav>

          {/* Graph of the players ration */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section>

          {/* win/lose percentage */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section >

          {/* heatmap */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section>

          {/* previous games */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>
            <h2 className='text-white'>Previous Games</h2>
            {/* <label>Select a Month:</label>
            <select onChange={(e) => {selectedDate = e.target.value}}>
              <option value="">--Select--</option>
              {dates.map((date, index) => (
                <option key={index} value={date}>
                  {date}
                </option>
              ))}
            </select> */}
          </section>
        </article>
      </main>
    </>
  );
}