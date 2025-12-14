"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserProfile, PlayerStats, Game } from "@/types/types";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import { Button } from '@/components/ui/button';
import Navbar from "@/components/Navbar";

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'rapid' | 'blitz' | 'bullet' | 'daily'>('rapid');
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'rapid' | 'blitz' | 'bullet'>('all');
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [isMounted, setIsMounted] = useState(false);
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

  // Helper function to get last 365 days
  const getLast365Days = (): Date[] => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  // Process heatmap data
  const processHeatmapData = (games: Game[], filter: 'all' | 'rapid' | 'blitz' | 'bullet'): Map<string, number> => {
    const gameCountMap = new Map<string, number>();

    // Filter games based on selected filter
    const filteredGames = filter === 'all'
      ? games
      : games.filter(game => game.time_class === filter);

    // Count games per day
    filteredGames.forEach(game => {
      const date = new Date(game.end_time * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      gameCountMap.set(dateKey, (gameCountMap.get(dateKey) || 0) + 1);
    });

    return gameCountMap;
  };

  // Get color based on game count
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'bg-gray-800';
    if (count === 1) return 'bg-green-900/40';
    if (count <= 3) return 'bg-green-700/60';
    if (count <= 5) return 'bg-green-500/80';
    return 'bg-green-400';
  };


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

        console.log("User Profile:", profileData);
        // console.log("Stats:", statsData);
        // console.log("Games:", latestGamesData.games);
        // console.log("Dates:", dates);
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

  // Fetch all games for heatmap
  useEffect(() => {
    const fetchAllGames = async () => {
      if (!username || dates.length === 0) return;

      try {
        const allGamesData: Game[] = [];

        // Fetch games from all available months
        for (const date of dates) {
          const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${date}`);
          if (response.ok) {
            const data = await response.json();
            allGamesData.push(...data.games);
          }
        }

        setAllGames(allGamesData);
        console.log("All games loaded for heatmap:", allGamesData.length);
      } catch (error) {
        console.error("Error fetching all games:", error);
      }
    };

    fetchAllGames();
  }, [username, dates]);

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <header className="bg-gradient-to-r from-profile_card to-transparent shadow-none px-0">
        <Navbar />
      </header>
      <main className="flex min-h-screen px-24 py-10 md:px-40 lg:px-60 bg-gradient-to-br from-profile_bg via-[#181818] to-profile_bg">
        {/* Sidebar */}
        <aside className="w-1/4 p-7 rounded-2xl bg-gradient-to-b from-profile_card/90 via-[#232323]/95 to-profile_card/90 text-white shadow-xl border border-gray-700/40 backdrop-blur-lg sticky top-8 self-start min-w-[300px] max-w-sm transition-all duration-200">
          {userProfile && (
            <>
              <div className="flex flex-col items-center mb-8 space-y-1">
                <Link href={userProfile.url} className="group">
                  <Image
                    src={userProfile.avatar || '/userimg.png'}
                    alt={`${userProfile.username}'s avatar`}
                    className="rounded-full border-4 border-pawn shadow-2xl shadow-pawn/40 group-hover:shadow-pawn/70 group-hover:ring-2 group-hover:scale-105 hover:ring-pawn/50 transition-all duration-200 mb-3"
                    width={110}
                    height={110}
                  />
                </Link>
                <div className="flex items-center gap-2 mb-1">
                  <Link href={userProfile.url}>
                    <h2 className="text-2xl font-bold tracking-wide hover:text-pawn transition">
                      {userProfile.username}
                    </h2>
                  </Link>
                  {userProfile.verified && (
                    <span className="text-blue-400 text-lg" title="Verified">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="inline"><circle cx="10" cy="10" r="10" fill="#66c2ff"/><path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  )}
                </div>
                {userProfile.league && (
                  <span className="px-4 py-1 bg-pawn/20 text-pawn rounded-full text-xs font-semibold mb-1 border border-pawn/30 shadow-pawn/10 shadow">
                    {userProfile.league}
                  </span>
                )}
                {userProfile.is_streamer && (
                  <span className="px-4 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/40 shadow-purple-500/20 shadow">
                    <span className="mr-1 animate-pulse text-purple-500">●</span>Streamer
                  </span>
                )}
              </div>

              <div className="bg-gradient-to-r from-transparent via-gray-600/30 to-transparent h-[1px] w-full mb-5"></div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Status:</span>
                  <span className="font-medium text-green-400 capitalize">{userProfile.status}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Followers:</span>
                  <span className="font-medium">{userProfile.followers.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Country:</span>
                  <span className="font-medium">{userProfile.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Joined:</span>
                  <span className="font-medium">
                    {new Date(userProfile.joined * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Last Online:</span>
                  <span className="font-medium">
                    {new Date(userProfile.last_online * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {userProfile.streaming_platforms && userProfile.streaming_platforms.length > 0 && (
                <>
                  <div className="bg-gradient-to-r from-transparent via-gray-600/30 to-transparent h-[1px] w-full my-5"></div>
                  <div>
                    <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-widest mb-2">Streaming On</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.streaming_platforms.map((platform, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-gray-800/70 rounded-full text-xs text-gray-50 border border-gray-700/30">{platform}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </aside>

        <article className="flex flex-col w-3/4 mx-4 gap-8">
          {/* Game Mode Navigation */}
          <nav className="flex justify-start  p-3 pl-5 rounded-2xl bg-gradient-to-r from-profile_card/80 via-[#232323]/90 to-profile_card/75 mb-5 shadow-lg border border-gray-700/25 overflow-x-auto">
            <ul className="flex gap-3 sm:gap-5 font-medium">
              {['rapid', 'daily', 'blitz', 'bullet'].map((mode) => (
                <li
                  key={mode}
                  onClick={() => setSelectedMode(mode as 'rapid' | 'blitz' | 'bullet' | 'daily')}
                  className={`cursor-pointer px-5 py-2 rounded-xl transition-all capitalize tracking-wide font-semibold border
                  ${selectedMode === mode
                    ? 'bg-gradient-to-r from-pawn to-[#9bc16a] text-white shadow-md border-pawn/60 scale-105'
                    : 'border-transparent text-gray-400 hover:text-white/95 hover:bg-gradient-to-r hover:from-gray-800/60 hover:to-gray-700/70 hover:border-pawn/30'
                  }`}
                  style={{ letterSpacing: '.05em' }}
                >
                  {mode}
                </li>
              ))}
            </ul>
          </nav>

          {/* Stats Display */}
          <section className="w-full min-h-40 p-8 rounded-2xl bg-gradient-to-br from-profile_card/90 via-[#232323] to-profile_card/90 mb-4 shadow-lg border border-gray-700/25">
            {stats && (() => {
              const modeStats = selectedMode === 'rapid' ? stats.chess_rapid
                : selectedMode === 'blitz' ? stats.chess_blitz
                : selectedMode === 'bullet' ? stats.chess_bullet
                : stats.chess_daily;

              if (!modeStats) {
                return (
                  <div className="text-gray-500 text-center py-12">
                    <p className="text-lg">No <span className="capitalize">{selectedMode}</span> stats available</p>
                  </div>
                );
              }

              const { last, best, record } = modeStats;
              const totalGames = record.win + record.loss + record.draw;
              const winRate = totalGames > 0 ? ((record.win / totalGames) * 100).toFixed(1) : '0';
              const lossRate = totalGames > 0 ? ((record.loss / totalGames) * 100).toFixed(1) : '0';
              const drawRate = totalGames > 0 ? ((record.draw / totalGames) * 100).toFixed(1) : '0';

              return (
                <div className="text-white">
                  <h2 className="text-2xl font-extrabold mb-7 capitalize tracking-tight">{selectedMode} Chess</h2>
                  {/* Rating Cards */}
                  <div className="grid sm:grid-cols-2 gap-6 mb-7">
                    <div className="bg-gradient-to-br from-profile_bg/85 to-[#202927] p-5 rounded-xl border-l-8 border-pawn shadow-md flex flex-col items-center gap-1 animate-fadeIn">
                      <p className="text-gray-400 text-sm mb-1">Current Rating</p>
                      <p className="text-4xl font-extrabold text-pawn drop-shadow">{last.rating}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(last.date * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {best && (
                      <div className="bg-gradient-to-br from-profile_bg/85 to-[#252525] p-5 rounded-xl border-l-8 border-yellow-400 shadow-lg flex flex-col items-center gap-1 animate-fadeIn">
                        <p className="text-gray-400 text-sm mb-1">Best Rating</p>
                        <p className="text-4xl font-extrabold text-yellow-400 drop-shadow">{best.rating}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(best.date * 1000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Record Stats */}
                  <div className="bg-gradient-to-br from-profile_bg/70 to-[#252525] p-5 rounded-xl mb-4 shadow border border-gray-700/15">
                    <h3 className="text-lg font-bold mb-4">Game Record</h3>
                    <div className="grid grid-cols-4 gap-5 text-center">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Total Games</p>
                        <p className="text-2xl font-bold">{totalGames}</p>
                      </div>
                      <div>
                        <p className="text-green-400 text-xs mb-1">Wins</p>
                        <p className="text-2xl font-bold text-green-400">{record.win}</p>
                        <p className="text-xs text-gray-500">{winRate}%</p>
                      </div>
                      <div>
                        <p className="text-red-400 text-xs mb-1">Losses</p>
                        <p className="text-2xl font-bold text-red-400">{record.loss}</p>
                        <p className="text-xs text-gray-500">{lossRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-300 text-xs mb-1">Draws</p>
                        <p className="text-2xl font-bold text-gray-100">{record.draw}</p>
                        <p className="text-xs text-gray-500">{drawRate}%</p>
                      </div>
                    </div>
                  </div>
                  {/* Daily-specific stats */}
                  {selectedMode === 'daily' && 'time_per_move' in record && (
                    <div className="bg-gradient-to-br from-profile_bg to-[#252525] p-5 rounded-xl shadow border border-gray-700/15">
                      <h3 className="text-lg font-bold mb-3">Daily Stats</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-gray-400 text-xs">Avg Time Per Move</p>
                          <p className="text-lg font-bold">{record.time_per_move}s</p>
                        </div>
                        {record.timeout_percent !== undefined && (
                          <div>
                            <p className="text-gray-400 text-xs">Timeout Rate</p>
                            <p className="text-lg font-bold">{record.timeout_percent}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Win/Loss Percentage Visualization */}
          <section className="w-full min-h-40 p-7 rounded-2xl bg-gradient-to-br from-profile_card/80 via-[#232323]/90 to-profile_card/85 mb-4 shadow-lg border border-gray-700/20">
            {stats && (() => {
              const modeStats = selectedMode === 'rapid' ? stats.chess_rapid
                : selectedMode === 'blitz' ? stats.chess_blitz
                : selectedMode === 'bullet' ? stats.chess_bullet
                : stats.chess_daily;

              if (!modeStats) return null;
              const { record } = modeStats;
              const totalGames = record.win + record.loss + record.draw;
              if (totalGames === 0) return null;

              const winPercent = (record.win / totalGames) * 100;
              const lossPercent = (record.loss / totalGames) * 100;
              const drawPercent = (record.draw / totalGames) * 100;

              return (
                <div className="text-white">
                  <h2 className="text-xl font-extrabold mb-3 tracking-tight">Performance Distribution</h2>
                  {/* Visual Bar */}
                  <div className="w-full h-8 flex rounded-xl overflow-hidden mb-5 border border-gray-700/30 shadow-inner">
                    <div
                      className="bg-green-500 flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        width: `${winPercent}%`,
                        minWidth: winPercent > 0 && winPercent < 10 ? '20px' : undefined,
                        color: winPercent > 15 ? 'white' : 'transparent'
                      }}
                    >
                      {winPercent > 10 && `${winPercent.toFixed(1)}%`}
                    </div>
                    <div
                      className="bg-red-500 flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        width: `${lossPercent}%`,
                        minWidth: lossPercent > 0 && lossPercent < 10 ? '20px' : undefined,
                        color: lossPercent > 15 ? 'white' : 'transparent'
                      }}
                    >
                      {lossPercent > 10 && `${lossPercent.toFixed(1)}%`}
                    </div>
                    <div
                      className="bg-gray-500 flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        width: `${drawPercent}%`,
                        minWidth: drawPercent > 0 && drawPercent < 10 ? '20px' : undefined,
                        color: drawPercent > 15 ? 'white' : 'transparent'
                      }}
                    >
                      {drawPercent > 10 && `${drawPercent.toFixed(1)}%`}
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-col sm:flex-row justify-around gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="opacity-90">Wins: {record.win} <span className="hidden sm:inline">({winPercent.toFixed(1)}%)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="opacity-90">Losses: {record.loss} <span className="hidden sm:inline">({lossPercent.toFixed(1)}%)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <span className="opacity-90">Draws: {record.draw} <span className="hidden sm:inline">({drawPercent.toFixed(1)}%)</span></span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Additional Stats (Tactics, Puzzle Rush, FIDE) */}
          {stats && (stats.tactics || stats.puzzle_rush || stats.fide) && (
            <section className="w-full min-h-40 p-7 rounded-2xl bg-gradient-to-br from-profile_card/85 via-[#232323]/90 to-profile_card/75 mb-4 shadow-lg border border-gray-700/15">
              <div className="text-white">
                <h2 className="text-xl font-bold mb-5">Additional Stats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {stats.fide && (
                    <div className="bg-gradient-to-br from-profile_bg/95 to-[#222725]  p-5 rounded-xl text-center shadow-md border-l-4 border-pawn/40 animate-fadeIn">
                      <p className="text-gray-400 text-xs mb-2">FIDE Rating</p>
                      <p className="text-2xl font-bold text-pawn">{stats.fide}</p>
                    </div>
                  )}
                  {stats.tactics?.highest && (
                    <div className="bg-gradient-to-br from-profile_bg/95 to-[#1a233a] p-5 rounded-xl text-center shadow-md border-l-4 border-blue-400/40 animate-fadeIn">
                      <p className="text-gray-400 text-xs mb-2">Tactics (Highest)</p>
                      <p className="text-2xl font-bold text-blue-400">{stats.tactics.highest.rating}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(stats.tactics.highest.date * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {stats.puzzle_rush?.best && (
                    <div className="bg-gradient-to-br from-profile_bg/95 to-[#291a36] p-5 rounded-xl text-center shadow-md border-l-4 border-purple-400/40 animate-fadeIn">
                      <p className="text-gray-400 text-xs mb-2">Puzzle Rush</p>
                      <p className="text-2xl font-bold text-purple-400">{stats.puzzle_rush.best.score}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {stats.puzzle_rush.best.total_attempts} attempts
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Activity Heatmap */}
          <section className="w-full min-h-40 p-8 rounded-2xl bg-gradient-to-br from-profile_card/90 via-[#232323] to-profile_card/90 mb-4 text-white shadow-lg border border-gray-700/15">
            <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-bold tracking-tight">Activity Heatmap</h2>
              {/* Filter Buttons */}
              <div className="flex gap-2">
                {(['all', 'rapid', 'blitz', 'bullet'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHeatmapFilter(filter)}
                    className={`px-4 py-2 rounded-lg transition-all capitalize font-semibold text-sm shadow-sm focus:outline-none 
                      ${
                        heatmapFilter === filter
                        ? 'bg-gradient-to-r from-pawn to-[#9bc16a] text-white shadow-md shadow-pawn/20 scale-105'
                        : 'bg-gradient-to-br from-profile_bg to-[#232323] text-gray-400 hover:text-white border border-pawn/15 hover:border-pawn/40'
                      }`}
                  >
                    {filter === 'all' ? 'All Games' : filter}
                  </button>
                ))}
              </div>
            </div>

            {allGames.length > 0 && isMounted ? (
              <div className="bg-gradient-to-br from-profile_bg to-[#252525] p-5 rounded-xl overflow-x-auto shadow-inner border border-gray-700/25">
                {(() => {
                  const days = getLast365Days();
                  const gameCountMap = processHeatmapData(allGames, heatmapFilter);

                  // Calculate the starting day of week (0 = Sunday, 6 = Saturday)
                  const startDate = days[0];
                  const startDayOfWeek = startDate.getDay();

                  // Create a grid structure: array of weeks, each week has 7 days (Sun-Sat)
                  const weeks: (Date | null)[][] = [];
                  let currentWeek: (Date | null)[] = new Array(7).fill(null);

                  // Fill the first week with nulls before the start date
                  let dayIndex = 0;
                  for (let i = startDayOfWeek; i < 7 && dayIndex < days.length; i++) {
                    currentWeek[i] = days[dayIndex];
                    dayIndex++;
                  }
                  weeks.push(currentWeek);

                  // Fill remaining weeks
                  while (dayIndex < days.length) {
                    currentWeek = new Array(7).fill(null);
                    for (let i = 0; i < 7 && dayIndex < days.length; i++) {
                      currentWeek[i] = days[dayIndex];
                      dayIndex++;
                    }
                    weeks.push(currentWeek);
                  }

                  // Calculate month labels based on when the month changes
                  const monthLabels: { month: string; weekIndex: number }[] = [];
                  let lastMonthYear = -1;

                  weeks.forEach((week, weekIndex) => {
                    // Get all non-null days in the week
                    const validDays = week.filter(day => day !== null) as Date[];
                    if (validDays.length === 0) return;
                    
                    // Check if the week contains the 1st day of a month (new month starts)
                    let firstOfMonthDay: Date | null = null;
                    for (const day of validDays) {
                      if (day.getDate() === 1) {
                        firstOfMonthDay = day;
                        break;
                      }
                    }
                    
                    // Determine which month to show
                    let monthToShow: Date | null = null;
                    
                    if (firstOfMonthDay) {
                      // If week contains 1st of month, use that month
                      const monthYearKey = firstOfMonthDay.getFullYear() * 12 + firstOfMonthDay.getMonth();
                      if (monthYearKey !== lastMonthYear) {
                        monthToShow = firstOfMonthDay;
                      }
                    } else {
                      // Otherwise, check if the week's month is different from last shown
                      // Use the last day of the week (most recent month in the week)
                      const lastDay = validDays[validDays.length - 1];
                      const monthYearKey = lastDay.getFullYear() * 12 + lastDay.getMonth();
                      if (monthYearKey !== lastMonthYear) {
                        monthToShow = lastDay;
                      }
                    }
                    
                    // Add the label if we found a new month
                    if (monthToShow) {
                      const monthYearKey = monthToShow.getFullYear() * 12 + monthToShow.getMonth();
                      monthLabels.push({
                        month: monthToShow.toLocaleDateString('en-US', { month: 'short' }),
                        weekIndex: weekIndex
                      });
                      lastMonthYear = monthYearKey;
                    }
                  });

                  return (
                    <div>
                      {/* Month Labels */}
                      <div className="flex gap-[3px] mb-2 ml-10">
                        {monthLabels.map((label, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-gray-400 font-semibold"
                            style={{
                              marginLeft: idx === 0 ? 0 : `${(label.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 16}px`
                            }}
                          >
                            {label.month}
                          </div>
                        ))}
                      </div>

                      {/* Heatmap Grid */}
                      <div className="flex gap-[3px]">
                        {/* Day labels (Sun=0, Mon=1, ..., Sat=6) */}
                        <div className="flex flex-col gap-[3px] text-xs text-gray-400 font-semibold pr-1 mt-[8px]">
                          <div style={{ height: '12px' }}></div> {/* Sun */}
                          <div style={{ height: '12px' }}>Mon</div>
                          <div style={{ height: '12px' }}></div> {/* Tue */}
                          <div style={{ height: '12px' }}>Wed</div>
                          <div style={{ height: '12px' }}></div> {/* Thu */}
                          <div style={{ height: '12px' }}>Fri</div>
                          <div style={{ height: '12px' }}></div> {/* Sat */}
                        </div>

                        {/* Weeks */}
                        <div className="flex gap-[3px]">
                          {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                              {week.map((day, dayIndex) => {
                                if (!day) {
                                  // Empty cell for padding
                                  return (
                                    <div
                                      key={dayIndex}
                                      className="w-4 h-4"
                                    />
                                  );
                                }

                                const dateKey = day.toISOString().split('T')[0];
                                const count = gameCountMap.get(dateKey) || 0;
                                const color = getHeatmapColor(count);

                                return (
                                  <div
                                    key={dayIndex}
                                    className={`w-4 h-4 rounded-md ${color} hover:ring-2 hover:ring-pawn/90 border border-black/10 hover:!z-20 transition-all cursor-pointer group relative`}
                                    title={`${day.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}: ${count} game${count !== 1 ? 's' : ''}`}
                                  >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-950/95 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                                      <span className="font-semibold">{day.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}:</span> {count} game{count !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                        <span>Less</span>
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded-md bg-gray-800"></div>
                          <div className="w-4 h-4 rounded-md bg-green-900/40"></div>
                          <div className="w-4 h-4 rounded-md bg-green-700/60"></div>
                          <div className="w-4 h-4 rounded-md bg-green-500/80"></div>
                          <div className="w-4 h-4 rounded-md bg-green-400"></div>
                        </div>
                        <span>More</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-profile_bg rounded-xl animate-pulse">
                <p className="text-gray-500">Loading game activity...</p>
              </div>
            )}
          </section>

          {/* Previous games */}
          <section className="w-full min-h-40 p-6 rounded-2xl bg-gradient-to-br from-profile_card/90 via-[#232323] to-profile_card/85 mb-4 text-white shadow-xl border border-gray-700/15">
            <div className="flex flex-col sm:flex-row justify-between items-center px-3 mb-4 gap-3">
              <h2 className="font-semibold text-lg tracking-wide">Previous Games</h2>
              <select 
                className="bg-gradient-to-br from-profile_bg to-[#232323] outline-none p-2.5 rounded-lg border border-gray-700/30 text-white focus:border-pawn/60 focus:ring-pawn/30 transition shadow-sm cursor-pointer min-w-[120px]"
                onChange={(e) => { setSelectedDate(e.target.value || "") }}
                value={selectedDate || ""}
              >
                <option value="">Select month</option>
                {dates.map((date, index) => (
                  <option key={index} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl overflow-auto shadow border border-gray-700/20 bg-profile_bg/60">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="bg-profile_card/90">
                    <th className="p-3 text-left rounded-tl-xl font-semibold">Type</th>
                    <th className="p-3 text-left font-semibold">Players</th>
                    <th className="p-3 text-left font-semibold">Result</th>
                    <th className="p-3 text-left font-semibold">Date</th>
                    <th className="p-3 text-left rounded-tr-xl font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGames.map((game, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-700/40 hover:bg-gradient-to-r hover:from-pawn/10 hover:to-transparent transition-all duration-150 group"
                    >
                      <td className="p-3">
                        <Image
                          src={
                            game.time_class === 'rapid'
                              ? '/rapid.png'
                              : game.time_class === 'bullet'
                                ? '/bullet.png'
                                : '/blitz.png'
                          }
                          alt="game-type"
                          width={28}
                          height={28}
                          className="rounded shadow-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Link href={game.url} target="_blank" className="hover:underline hover:text-pawn transition-colors">
                          {game.white.username}
                          <span className="mx-1 text-gray-400/70">vs</span>
                          {game.black.username}
                        </Link>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-green-400">{game.white.result}</span>
                        {" "}
                        <span className="text-gray-300/70">-</span>
                        {" "}
                        <span className="font-semibold text-red-400">{game.black.result}</span>
                      </td>
                      <td className="p-3 text-gray-400">{new Date(game.end_time * 1000).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button className="bg-gradient-to-r from-pawn to-[#9bc16a] hover:from-[#9bc16a] hover:to-pawn shadow-lg hover:shadow-pawn/40 transition-all border-none outline-none text-xs px-4 py-2 font-medium rounded-md" onClick={() => handleReview(game.pgn)}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <Pagination>
                <PaginationPrevious onClick={() => currentPage > 1 && handlePrevious()}>
                  <PaginationLink>Previous</PaginationLink>
                </PaginationPrevious>
                <PaginationContent>
                  {Array.from({ length: totalPages }, (_, index) => (
                    <PaginationItem 
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={currentPage === index + 1 ? 'bg-pawn/40 rounded' : ''}
                    >
                      <PaginationLink>{index + 1}</PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
                <PaginationNext onClick={() => currentPage < totalPages && handleNext()}>
                  <PaginationLink>Next</PaginationLink>
                </PaginationNext>
              </Pagination>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}