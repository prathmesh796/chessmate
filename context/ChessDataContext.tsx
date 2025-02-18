"use client"

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, PlayerStats, Game, status, ChessDataContextType } from "@/types/types";

const ChessDataContext = createContext<ChessDataContextType | undefined>(undefined);

export const ChessDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [status, setStatus] = useState<status | null>(null);

  const extractDatesFromArchives = (archives: string[]): string[] => {
    return archives.map(url => url.split("/").slice(-2).join("/"));
  };

  // Fetch data from multiple endpoints
  useEffect(() => {
  const fetchUserData = async (username: string) => {
    try {
      const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`);
      const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
      const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
      const statusRes = await fetch(`https://api.chess.com/pub/player/${username}/is-online`);

      if (!profileRes.ok || !statsRes.ok || !archivesRes.ok) throw new Error("User not found");

      const profileData = await profileRes.json();
      const statsData = await statsRes.json();
      const archivesData = await archivesRes.json();
      const status = await statusRes.json();

      // Fetch latest month's games
      const latestGamesRes = await fetch(archivesData.archives[archivesData.archives.length - 1]);
      const latestGamesData = await latestGamesRes.json();

      setUserProfile(profileData);
      setStats(statsData);
      setGames(latestGamesData.games);
      setDates(extractDatesFromArchives(archivesData.archives))
      setStatus(status);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserProfile(null);
      setStats(null);
      setGames(null);
    }
  };

}, []);

  return (
    <ChessDataContext.Provider value={{ userProfile, stats, games, dates, status }}>
      {children}
    </ChessDataContext.Provider>
  );
};

export const useChessData = () => useContext(ChessDataContext);