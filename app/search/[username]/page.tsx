"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserProfile, PlayerStats, Game } from "@/types/types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from '@/components/ui/button';
import Navbar from "@/components/Navbar";
import React from 'react';

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  //const [ratingHistory, setRatingHistory] = useState<RatingData[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const totalPages = games ? Math.ceil(games.length / limit) : 0;

  const router = useRouter();

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

  function extractMoves(pgn: string): string {
    return pgn
      .replace(/\[.*?\]\n?/g, "")        // remove all [Tags]
      .replace(/\{.*?\}/g, "")          // remove comments like {[%clk ...]}
      .replace(/\s+/g, " ")             // collapse spaces & newlines
      .trim();
  }


  const handleReview = (pgn: string) => {
    console.log("Reviewing PGN:", pgn);

    const onlyMoves = extractMoves(pgn);
    const encoded = btoa(onlyMoves);
    router.push(`/review?data=${encoded}`);
  };

  // Fetch monthly games
  const fetchMonthlyGames = async (username: string | null, selectedDate: string) => {
    try {
      const monthlyGamesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/${selectedDate}`);

      const monthlyGamesData = await monthlyGamesRes.json();

      setGames(monthlyGamesData.games);
      console.log("Monthly Games:", monthlyGamesData.games);
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
  }, [params]);

  useEffect(() => {
    // Fetch data from multiple endpoints
    const fetchUserData = async (username: string) => {
      try {
        const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`);
        const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
        const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);

        if (!profileRes.ok || !statsRes.ok || !archivesRes.ok) throw new Error("User not found");

        const profileData = await profileRes.json();
        const statsData = await statsRes.json();
        const archivesData = await archivesRes.json();

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
                <Image
                  src={userProfile.avatar || '/userimg.png'}
                  alt={`${userProfile.username}'s avatar`}
                  className="rounded-full mx-auto"
                  width={56}
                  height={56}
                />
              </Link>

              <div className="flex flex-col items-left justify-center">
                <Link href={userProfile.url}><h2 className="text-xl font-semibold text-center mb-2">{userProfile.username}</h2></Link>
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
            <div>
              {stats?.chess_rapid && (
                <div className='text-white'>
                  <h2 className='font-semibold mb-2'>Rapid Stats</h2>

                </div>
              )}
            </div>
          </section>

          {/* win/lose percentage */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section >

          {/* heatmap */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section>

          {/* previous games */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4 text-white'>
            <div className='flex justify-between px-4'>
              <h2 className='font-semibold  '>Previous Games</h2>
              <select className='bg-profile_bg outline-none p-2 rounded-md' onChange={(e) => { setSelectedDate(e.target.value) }}>
                <option value="">Select</option>
                {dates.map((date, index) => (
                  <option key={index} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {currentGames.map((game, index) => (
                <Link key={index} href={game.url} target='_blank'>
                  <div key={index} className='flex justify-between  px-4 py-2 rounded-lg bg-profile_bg m-2 '>
                    <div className='flex items-center'>
                      <Image src={game.time_class === 'rapid' ? '/rapid.png' : game.time_class === 'bullet' ? '/bullet.png' : '/blitz.png'} alt='game-type' width={25} height={25} />
                    </div>
                    <div className='flex items-center'>
                      <h3 className='text-white'>{game.white.username} vs {game.black.username}</h3>
                    </div>
                    <div className='flex items-center'>
                      <p className='text-white'>{game.white.result} - {game.black.result}</p>
                    </div>
                    <div className='flex items-center'>
                      <Button className='bg-pawn' onClick={() => handleReview(game.pgn)}>Review</Button>
                    </div>
                    <div className='flex items-center'>
                      <p className='text-gray-400'>{new Date(game.end_time * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
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