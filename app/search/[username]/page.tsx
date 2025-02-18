"use client"

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserProfile, PlayerStats, Game, status } from "@/types/types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Navbar from "@/components/Navbar";
import React from 'react';

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [status, setStatus] = useState<status | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const totalPages = games ? Math.ceil(games.length / limit) : 0;

  // Get the current games to display
  const startIndex = (currentPage - 1) * limit;
  const currentGames = games ? games.slice().reverse().slice(startIndex, startIndex + limit) : [];

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const extractDatesFromArchives = (archives: string[]): string[] => {
    return archives.map(url => url.split("/").slice(-2).join("/"));
  };

  // Fetch data from multiple endpoints
  const fetchUserData = async (username: string) => {
    try {
      const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`);
      const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
      const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
      //const statusRes = await fetch(`https://api.chess.com/pub/player/${username}/is-online`);

      if (!profileRes.ok || !statsRes.ok || !archivesRes.ok) throw new Error("User not found");

      const profileData = await profileRes.json();
      const statsData = await statsRes.json();
      const archivesData = await archivesRes.json();
      //const statusData = await statusRes.json();

      // Fetch latest month's games
      const latestGamesRes = await fetch(archivesData.archives[archivesData.archives.length - 1]);
      const latestGamesData = await latestGamesRes.json();

      setUserProfile(profileData);
      setStats(statsData);
      setGames(latestGamesData.games);
      setDates(extractDatesFromArchives(archivesData.archives));
      //setStatus(statusData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserProfile(null);
      setStats(null);
      setGames(null);
    }
  };

  // Fetch monthly games
  const fetchMonthlyGames = async (username: string | null, selectedDate: string) => {
    try {
      const monthlyGamesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/${selectedDate}`);

      const monthlyGamesData = await monthlyGamesRes.json();

      setGames(monthlyGamesData.games);
    } catch (error) {
      console.error("Error fetching monthly games:", error);
      setGames(null);
    }
  };

  useEffect(() => {
    const getUsername = async () => {
      const resolvedParams = await params;
      setUsername(resolvedParams.username);
    };

    getUsername();
  }, []);

  useEffect(() => {
    if (username) {
      fetchUserData(username);
    }
  }, [username]);

  useEffect(() => {
    if (selectedDate) {
      fetchMonthlyGames(username, selectedDate);
    }
  }, [username, selectedDate]);

  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="flex min-h-screen px-44 py-10 bg-profile_bg">
        {/* Sidebar */}
        <aside className="w-1/4 p-4 rounded-lg bg-profile_card text-white">
          {userProfile &&
            <div className="flex items-center justify-around mb-4">
              <Link href={userProfile.url}>
                <img
                  src={userProfile.avatar || '/userimg.png'}
                  alt={`${userProfile.username}'s avatar`}
                  className="w-14 h-14 rounded-full mx-auto"
                />
              </Link>

              <div className="flex flex-col items-left justify-center">
                <Link href={userProfile.url}><h2 className="text-xl font-semibold text-center mb-2">{userProfile.username}</h2></Link>
                <div className='flex items-center gap-1'>
                  <div className={`w-2 h-2 rounded-full ml-2 ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className='text-gray-600'>{status ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </div>
          }

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

          {/* Graph of the players ratio */}
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
            <label>Select a Month:</label>
            <select onChange={(e) => { setSelectedDate(e.target.value) }}>
              <option value="">--Select--</option>
              {dates.map((date, index) => (
                <option key={index} value={date}>
                  {date}
                </option>
              ))}
            </select>

            <div>
              {currentGames.map((game, index) => (
                <div key={index} className='flex justify-between p-4 rounded-lg bg-profile_card mb-4'>
                  <div>
                    <h3 className='text-white'>{game.white.username} vs {game.black.username}</h3>
                    <p className='text-gray-400'>{game.time_class}</p>
                  </div>
                  <div>
                    <p className='text-white'>{game.white.result} - {game.black.result}</p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination>
              <PaginationPrevious onClick={() => currentPage > 1 && handlePrevious()}>
                <PaginationLink>Previous</PaginationLink>
              </PaginationPrevious>
              <PaginationContent>
                {Array.from({ length: totalPages }, (_, index) => (
                  <PaginationItem key={index + 1} onClick={() => handlePageChange(index + 1)}>
                    <PaginationLink>{index + 1}</PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
              <PaginationNext onClick={() => currentPage < totalPages && handleNext()}>
                <PaginationLink>Next</PaginationLink>
              </PaginationNext>
            </Pagination>
          </section>


        </article>
      </main>
    </>
  );
}