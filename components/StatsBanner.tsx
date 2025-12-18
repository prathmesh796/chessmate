import { PlayerStats } from '@/types/types';
import { memo, useState, useEffect } from 'react'

const StatsBanner = memo(({ username, selectedMode }: { username: string, selectedMode: string }) => {
    const [stats, setStats] = useState<PlayerStats | null>(null);

    useEffect(() => {
    // Fetch data from multiple endpoints
    const fetchUserData = async () => {
      try {
        const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`);

        if (!statsRes.ok) throw new Error("User not found");

        const statsData = await statsRes.json();

        setStats(statsData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setStats(null);
      }
    };
    if (username) {
      fetchUserData();
    }
  }, [username]);

    return (
        <div>
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
        </div>
    )
})

export default StatsBanner