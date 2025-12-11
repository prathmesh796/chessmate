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
      <header>
        <Navbar />
      </header>
      <main className="flex min-h-screen px-44 py-10 bg-profile_bg">
        {/* Sidebar */}
        <aside className="w-1/4 p-6 rounded-lg bg-profile_card text-white">
          {userProfile && (
            <>
              <div className="flex flex-col items-center mb-6">
                <Link href={userProfile.url}>
                  <Image
                    src={userProfile.avatar || '/userimg.png'}
                    alt={`${userProfile.username}'s avatar`}
                    className="rounded-full border-4 border-pawn mb-4"
                    width={96}
                    height={96}
                  />
                </Link>

                <div className="flex items-center gap-2 mb-2">
                  <Link href={userProfile.url}>
                    <h2 className="text-2xl font-bold hover:text-pawn transition-colors">
                      {userProfile.username}
                    </h2>
                  </Link>
                  {userProfile.verified && (
                    <span className="text-blue-400" title="Verified">✓</span>
                  )}
                </div>

                {userProfile.league && (
                  <span className="px-3 py-1 bg-pawn/20 text-pawn rounded-full text-sm font-semibold mb-2">
                    {userProfile.league}
                  </span>
                )}

                {userProfile.is_streamer && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                    Streamer
                  </span>
                )}
              </div>

              <div className='bg-gray-700 h-[1px] w-full rounded-full mb-4'></div>

              {/* Profile Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className="font-semibold capitalize">{userProfile.status}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Followers:</span>
                  <span className="font-semibold">{userProfile.followers.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Country:</span>
                  <span className="font-semibold">{userProfile.location}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Joined:</span>
                  <span className="font-semibold">
                    {new Date(userProfile.joined * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Online:</span>
                  <span className="font-semibold">
                    {new Date(userProfile.last_online * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {userProfile.streaming_platforms && userProfile.streaming_platforms.length > 0 && (
                <>
                  <div className='bg-gray-700 h-[1px] w-full rounded-full my-4'></div>
                  <div>
                    <h3 className="text-gray-400 text-sm mb-2">Streaming On:</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.streaming_platforms.map((platform, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </aside>

        <article className='flex flex-col w-3/4 mx-4'>
          {/* Game Mode Navigation */}
          <nav className='flex justify-start p-4 rounded-lg bg-profile_card mb-4'>
            <ul className='flex gap-4'>
              {['rapid', 'daily', 'blitz', 'bullet'].map((mode) => (
                <li
                  key={mode}
                  onClick={() => setSelectedMode(mode as 'rapid' | 'blitz' | 'bullet' | 'daily')}
                  className={`cursor-pointer px-4 py-2 rounded-md transition-all capitalize font-semibold ${selectedMode === mode
                    ? 'bg-pawn text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                >
                  {mode}
                </li>
              ))}
            </ul>
          </nav>

          {/* Stats Display */}
          <section className='w-full min-h-40 p-6 rounded-lg bg-profile_card mb-4'>
            {stats && (() => {
              const modeStats = selectedMode === 'rapid' ? stats.chess_rapid :
                selectedMode === 'blitz' ? stats.chess_blitz :
                  selectedMode === 'bullet' ? stats.chess_bullet :
                    stats.chess_daily;

              if (!modeStats) {
                return (
                  <div className='text-gray-400 text-center py-8'>
                    <p className='text-lg'>No {selectedMode} stats available</p>
                  </div>
                );
              }

              const { last, best, record } = modeStats;
              const totalGames = record.win + record.loss + record.draw;
              const winRate = totalGames > 0 ? ((record.win / totalGames) * 100).toFixed(1) : '0';
              const lossRate = totalGames > 0 ? ((record.loss / totalGames) * 100).toFixed(1) : '0';
              const drawRate = totalGames > 0 ? ((record.draw / totalGames) * 100).toFixed(1) : '0';

              return (
                <div className='text-white'>
                  <h2 className='text-2xl font-bold mb-6 capitalize'>{selectedMode} Chess</h2>

                  {/* Rating Cards */}
                  <div className='grid grid-cols-2 gap-4 mb-6'>
                    <div className='bg-profile_bg p-4 rounded-lg border-l-4 border-pawn'>
                      <p className='text-gray-400 text-sm mb-1'>Current Rating</p>
                      <p className='text-3xl font-bold text-pawn'>{last.rating}</p>
                      <p className='text-gray-500 text-xs mt-1'>
                        {new Date(last.date * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {best && (
                      <div className='bg-profile_bg p-4 rounded-lg border-l-4 border-yellow-500'>
                        <p className='text-gray-400 text-sm mb-1'>Best Rating</p>
                        <p className='text-3xl font-bold text-yellow-500'>{best.rating}</p>
                        <p className='text-gray-500 text-xs mt-1'>
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
                  <div className='bg-profile_bg p-4 rounded-lg mb-4'>
                    <h3 className='text-lg font-semibold mb-4'>Game Record</h3>
                    <div className='grid grid-cols-4 gap-4 text-center'>
                      <div>
                        <p className='text-gray-400 text-sm mb-1'>Total Games</p>
                        <p className='text-2xl font-bold'>{totalGames}</p>
                      </div>
                      <div>
                        <p className='text-green-400 text-sm mb-1'>Wins</p>
                        <p className='text-2xl font-bold text-green-400'>{record.win}</p>
                        <p className='text-xs text-gray-500'>{winRate}%</p>
                      </div>
                      <div>
                        <p className='text-red-400 text-sm mb-1'>Losses</p>
                        <p className='text-2xl font-bold text-red-400'>{record.loss}</p>
                        <p className='text-xs text-gray-500'>{lossRate}%</p>
                      </div>
                      <div>
                        <p className='text-gray-400 text-sm mb-1'>Draws</p>
                        <p className='text-2xl font-bold'>{record.draw}</p>
                        <p className='text-xs text-gray-500'>{drawRate}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Daily-specific stats */}
                  {selectedMode === 'daily' && 'time_per_move' in record && (
                    <div className='bg-profile_bg p-4 rounded-lg'>
                      <h3 className='text-lg font-semibold mb-3'>Daily Stats</h3>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='text-gray-400 text-sm'>Avg Time Per Move</p>
                          <p className='text-xl font-bold'>{record.time_per_move}s</p>
                        </div>
                        {record.timeout_percent !== undefined && (
                          <div>
                            <p className='text-gray-400 text-sm'>Timeout Rate</p>
                            <p className='text-xl font-bold'>{record.timeout_percent}%</p>
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
          <section className='w-full min-h-40 p-6 rounded-lg bg-profile_card mb-4'>
            {stats && (() => {
              const modeStats = selectedMode === 'rapid' ? stats.chess_rapid :
                selectedMode === 'blitz' ? stats.chess_blitz :
                  selectedMode === 'bullet' ? stats.chess_bullet :
                    stats.chess_daily;

              if (!modeStats) return null;

              const { record } = modeStats;
              const totalGames = record.win + record.loss + record.draw;

              if (totalGames === 0) return null;

              const winPercent = (record.win / totalGames) * 100;
              const lossPercent = (record.loss / totalGames) * 100;
              const drawPercent = (record.draw / totalGames) * 100;

              return (
                <div className='text-white'>
                  <h2 className='text-xl font-bold mb-4'>Performance Distribution</h2>

                  {/* Visual Bar */}
                  <div className='w-full h-8 flex rounded-lg overflow-hidden mb-4'>
                    <div
                      className='bg-green-500 flex items-center justify-center text-xs font-bold'
                      style={{ width: `${winPercent}%` }}
                    >
                      {winPercent > 10 && `${winPercent.toFixed(1)}%`}
                    </div>
                    <div
                      className='bg-red-500 flex items-center justify-center text-xs font-bold'
                      style={{ width: `${lossPercent}%` }}
                    >
                      {lossPercent > 10 && `${lossPercent.toFixed(1)}%`}
                    </div>
                    <div
                      className='bg-gray-500 flex items-center justify-center text-xs font-bold'
                      style={{ width: `${drawPercent}%` }}
                    >
                      {drawPercent > 10 && `${drawPercent.toFixed(1)}%`}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className='flex justify-around text-sm'>
                    <div className='flex items-center gap-2'>
                      <div className='w-4 h-4 bg-green-500 rounded'></div>
                      <span>Wins: {record.win} ({winPercent.toFixed(1)}%)</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-4 h-4 bg-red-500 rounded'></div>
                      <span>Losses: {record.loss} ({lossPercent.toFixed(1)}%)</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-4 h-4 bg-gray-500 rounded'></div>
                      <span>Draws: {record.draw} ({drawPercent.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Additional Stats (Tactics, Puzzle Rush, FIDE) */}
          {stats && (stats.tactics || stats.puzzle_rush || stats.fide) && (
            <section className='w-full min-h-40 p-6 rounded-lg bg-profile_card mb-4'>
              <div className='text-white'>
                <h2 className='text-xl font-bold mb-4'>Additional Stats</h2>

                <div className='grid grid-cols-3 gap-4'>
                  {stats.fide && (
                    <div className='bg-profile_bg p-4 rounded-lg text-center'>
                      <p className='text-gray-400 text-sm mb-2'>FIDE Rating</p>
                      <p className='text-2xl font-bold text-pawn'>{stats.fide}</p>
                    </div>
                  )}

                  {stats.tactics?.highest && (
                    <div className='bg-profile_bg p-4 rounded-lg text-center'>
                      <p className='text-gray-400 text-sm mb-2'>Tactics (Highest)</p>
                      <p className='text-2xl font-bold text-blue-400'>{stats.tactics.highest.rating}</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(stats.tactics.highest.date * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {stats.puzzle_rush?.best && (
                    <div className='bg-profile_bg p-4 rounded-lg text-center'>
                      <p className='text-gray-400 text-sm mb-2'>Puzzle Rush</p>
                      <p className='text-2xl font-bold text-purple-400'>{stats.puzzle_rush.best.score}</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {stats.puzzle_rush.best.total_attempts} attempts
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Activity Heatmap */}
          <section className='w-full min-h-40 p-6 rounded-lg bg-profile_card mb-4 text-white'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold'>Activity Heatmap</h2>

              {/* Filter Buttons */}
              <div className='flex gap-2'>
                {(['all', 'rapid', 'blitz', 'bullet'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHeatmapFilter(filter)}
                    className={`px-4 py-2 rounded-md transition-all capitalize font-semibold text-sm ${heatmapFilter === filter
                      ? 'bg-pawn text-white'
                      : 'bg-profile_bg text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                  >
                    {filter === 'all' ? 'All Games' : filter}
                  </button>
                ))}
              </div>
            </div>

            {allGames.length > 0 && isMounted ? (
              <div className='bg-profile_bg p-4 rounded-lg overflow-x-auto'>
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
                    // Find the first non-null day in the week
                    const firstDay = week.find(day => day !== null);
                    if (firstDay) {
                      const currentMonth = firstDay.getMonth();
                      const currentYear = firstDay.getFullYear();
                      const monthYearKey = currentYear * 12 + currentMonth; // Unique key for year+month

                      // Add label if it's a new month
                      if (monthYearKey !== lastMonthYear) {
                        monthLabels.push({
                          month: firstDay.toLocaleDateString('en-US', { month: 'short' }),
                          weekIndex: weekIndex
                        });
                        lastMonthYear = monthYearKey;
                      }
                    }
                  });

                  return (
                    <div>
                      {/* Month Labels */}
                      <div className='flex gap-[3px] mb-2 ml-8'>
                        {monthLabels.map((label, idx) => (
                          <div
                            key={idx}
                            className='text-xs text-gray-400'
                            style={{
                              marginLeft: idx === 0 ? 0 : `${(label.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 15}px`
                            }}
                          >
                            {label.month}
                          </div>
                        ))}
                      </div>

                      {/* Heatmap Grid */}
                      <div className='flex gap-[3px]'>
                        {/* Day labels (Sun=0, Mon=1, ..., Sat=6) */}
                        <div className='flex flex-col gap-[3px] text-xs text-gray-400 pr-2'>
                          <div style={{ height: '12px' }}></div> {/* Sun */}
                          <div style={{ height: '12px' }}>Mon</div>
                          <div style={{ height: '12px' }}></div> {/* Tue */}
                          <div style={{ height: '12px' }}>Wed</div>
                          <div style={{ height: '12px' }}></div> {/* Thu */}
                          <div style={{ height: '12px' }}>Fri</div>
                          <div style={{ height: '12px' }}></div> {/* Sat */}
                        </div>

                        {/* Weeks */}
                        <div className='flex gap-[3px]'>
                          {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className='flex flex-col gap-[3px]'>
                              {week.map((day, dayIndex) => {
                                if (!day) {
                                  // Empty cell for padding
                                  return (
                                    <div
                                      key={dayIndex}
                                      className='w-3 h-3'
                                    />
                                  );
                                }

                                const dateKey = day.toISOString().split('T')[0];
                                const count = gameCountMap.get(dateKey) || 0;
                                const color = getHeatmapColor(count);

                                return (
                                  <div
                                    key={dayIndex}
                                    className={`w-3 h-3 rounded-sm ${color} hover:ring-2 hover:ring-pawn transition-all cursor-pointer group relative`}
                                    title={`${day.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}: ${count} game${count !== 1 ? 's' : ''}`}
                                  >
                                    {/* Tooltip */}
                                    <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg'>
                                      {day.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}: {count} game{count !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className='flex items-center gap-2 mt-4 text-xs text-gray-400'>
                        <span>Less</span>
                        <div className='flex gap-1'>
                          <div className='w-3 h-3 rounded-sm bg-gray-800'></div>
                          <div className='w-3 h-3 rounded-sm bg-green-900/40'></div>
                          <div className='w-3 h-3 rounded-sm bg-green-700/60'></div>
                          <div className='w-3 h-3 rounded-sm bg-green-500/80'></div>
                          <div className='w-3 h-3 rounded-sm bg-green-400'></div>
                        </div>
                        <span>More</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className='flex items-center justify-center h-32 bg-profile_bg rounded-lg'>
                <p className='text-gray-400'>Loading game activity...</p>
              </div>
            )}
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
              <table className='w-full text-white'>
                <thead>
                  <tr className='bg-profile_card rounded-lg'>
                    <th className='p-2 text-left'>Type</th>
                    <th className='p-2 text-left'>Players</th>
                    <th className='p-2 text-left'>Result</th>
                    <th className='p-2 text-left'>Date</th>
                    <th className='p-2 text-left'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGames.map((game, index) => (
                    <tr key={index} className='border-b border-gray-700 hover:bg-profile_bg_hover'>
                      <td className='p-2'>
                        <Image
                          src={game.time_class === 'rapid' ? '/rapid.png' : game.time_class === 'bullet' ? '/bullet.png' : '/blitz.png'}
                          alt='game-type'
                          width={25}
                          height={25}
                        />
                      </td>
                      <td className='p-2'>
                        <Link href={game.url} target='_blank' className='hover:underline'>
                          {game.white.username} vs {game.black.username}
                        </Link>
                      </td>
                      <td className='p-2'>
                        {game.white.result} - {game.black.result}
                      </td>
                      <td className='p-2'>
                        <p className='text-gray-400'>{new Date(game.end_time * 1000).toLocaleDateString()}</p>
                      </td>
                      <td className='p-2'>
                        <Button className='bg-pawn' onClick={() => handleReview(game.pgn)}>Review</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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