import React, { createContext, useContext, useState } from "react";

// Define types for fetched data
interface UserProfile {
  avatar: string;
  player_id: number;
  "@id": string;
  url: string;
  username: string;
  followers: number;
  country: string;
  last_online: number;
  joined: number;
  status: string;
  is_streamer: boolean;
  verified: boolean;
  league: string;
  streaming_platforms: string[];
}

interface RatingRecord {
  win: number;
  loss: number;
  draw: number;
  time_per_move?: number; // Only for chess_daily
  timeout_percent?: number; // Only for chess_daily
}

interface LastRating {
  rating: number;
  date: number;
  rd?: number; // Some game modes may not have this
}

interface BestRating {
  rating: number;
  date: number;
  game: string;
}

interface ChessStats {
  last: LastRating;
  best?: BestRating; // Some users may not have this
  record: RatingRecord;
}

interface TacticsStats {
  highest?: { rating: number; date: number }; // May be missing
  lowest?: { rating: number; date: number }; // May be missing
}

interface PuzzleRushStats {
  best?: {
    total_attempts: number;
    score: number;
  }; // Some users may not have puzzle rush data
}

interface PlayerStats {
  chess_daily?: ChessStats; // Some users may not have played Daily
  chess_rapid?: ChessStats;
  chess_bullet?: ChessStats;
  chess_blitz?: ChessStats;
  fide?: number; // Some users may not have a FIDE rating
  tactics?: TacticsStats;
  puzzle_rush?: PuzzleRushStats;
}


interface Game {
  url: string;
  time_class: string;
  pgn: string;
  white: { username: string; result: string };
  black: { username: string; result: string };
}

interface ChessDataContextType {
  userProfile: UserProfile | null;
  stats: PlayerStats | null;
  games: Game[] | null;
  fetchUserData: (username: string) => Promise<void>;
}

const ChessDataContext = createContext<ChessDataContextType | undefined>(undefined);

export const ChessDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);

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
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserProfile(null);
      setStats(null);
      setGames(null);
    }
  };

  return (
    <ChessDataContext.Provider value={{ userProfile, stats, games, fetchUserData }}>
      {children}
    </ChessDataContext.Provider>
  );
};

export const useChessData = () => useContext(ChessDataContext);