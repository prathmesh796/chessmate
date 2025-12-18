import { useState, useEffect, memo } from 'react'
import { Game } from '@/types/types';

const HeatMap = memo(({ username, dates }: { username: string; dates: string[] }) => {
    const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'rapid' | 'blitz' | 'bullet'>('all');
    const [allGames, setAllGames] = useState<Game[]>([]);
    const [isMounted, setIsMounted] = useState(false);

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
                      ${heatmapFilter === filter
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
    )
})

export default HeatMap;