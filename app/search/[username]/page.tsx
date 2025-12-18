"use client"

import { useEffect, useState } from 'react';
import { Game } from "@/types/types";
import NavBar from "@/components/NavBar";
import HeatMap from '@/components/HeatMap';
import PreviousGames from '@/components/PreviousGames';
import ProfileAside from '@/components/ProfileAside';
import Banner from '@/components/Branner';
import StatsBanner from '@/components/StatsBanner';

export default function Page({ params }: { params: Promise<{ username: string }> }) {
  const [username, setUsername] = useState<string | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'rapid' | 'blitz' | 'bullet' | 'daily'>('rapid');

  const extractDatesFromArchives = (archives: string[]): string[] => {
    return archives.map(url => url.split("/").slice(-2).join("/"));
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
        const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);

        if (!archivesRes.ok) throw new Error("User not found");

        const archivesData = await archivesRes.json();

        // Fetch latest month's games
        const latestGamesRes = await fetch(archivesData.archives[archivesData.archives.length - 1]);
        const latestGamesData = await latestGamesRes.json();

        setGames(latestGamesData.games);
        setDates(extractDatesFromArchives(archivesData.archives));
      } catch (error) {
        console.error("Error fetching user data:", error);
        setGames(null);
      }
    };
    if (username) {
      fetchUserData(username);
    }
  }, [username]);

  // Fetch monthly games
  const fetchMonthlyGames = async (username: string | null, selectedDate: string) => {
    try {
      const monthlyGamesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/${selectedDate}`);

      const monthlyGamesData = await monthlyGamesRes.json();

      setGames(monthlyGamesData.games);
      //console.log("Monthly Games:", monthlyGamesData.games);
    } catch (error) {
      console.error("Error fetching monthly games:", error);
      setGames(null);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchMonthlyGames(username, selectedDate);
    }
  }, [username, selectedDate]);

  return (
    <>
      <header className="bg-gradient-to-r from-profile_card to-transparent shadow-none px-0">
        <Banner />
      </header>
      
      <main className="flex min-h-screen px-24 py-10 md:px-40 lg:px-60 bg-gradient-to-br from-profile_bg via-[#181818] to-profile_bg">
        {/* Sidebar */}
        <aside className="w-1/4 min-h-[calc(100vh-2rem)] p-7 rounded-2xl bg-gradient-to-b from-profile_card/90 via-[#232323]/95 to-profile_card/90 text-white shadow-xl border border-gray-700/40 backdrop-blur-lg sticky top-8 self-start min-w-[300px] max-w-sm transition-all duration-200">
          {username && <ProfileAside username={username}/>}
        </aside>

        <article className="flex flex-col w-3/4 mx-4 gap-8">
          {/* Game Mode Navigation */}
          <NavBar selectedMode={selectedMode} setSelectedMode={setSelectedMode} />

          {/* Stats Display */}
          {username && <StatsBanner username={username} selectedMode={selectedMode} />}

          {/* Activity Heatmap */}
          {username && <HeatMap username={username} dates={dates} />}

          {/* Previous games */}
          {games &&
            <section className="w-full min-h-40 p-6 rounded-2xl bg-gradient-to-br from-profile_card/90 via-[#232323] to-profile_card/85 mb-4 text-white shadow-xl border border-gray-700/15">
              <div className="flex flex-col sm:flex-row justify-between items-center px-3 mb-4 gap-3">
                <h2 className="font-semibold text-lg tracking-wide">Previous Games</h2>
                <select
                  className="bg-black from-profile_bg to-[#232323] outline-none p-2.5 rounded-lg border border-gray-700/30 text-white focus:border-pawn/60 focus:ring-pawn/30 transition shadow-sm cursor-pointer min-w-[120px] scroll-black"
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
              <PreviousGames games={games} />
            </section>
          }
        </article>
      </main>
    </>
  );
}