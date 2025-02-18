// Define types for fetched data
export interface UserProfile {
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

export interface status {
    online: boolean;
}

export interface RatingRecord {
    win: number;
    loss: number;
    draw: number;
    time_per_move?: number; // Only for chess_daily
    timeout_percent?: number; // Only for chess_daily
}

export interface LastRating {
    rating: number;
    date: number;
    rd?: number; // Some game modes may not have this
}

export interface BestRating {
    rating: number;
    date: number;
    game: string;
}

export interface ChessStats {
    last: LastRating;
    best?: BestRating; // Some users may not have this
    record: RatingRecord;
}

export interface TacticsStats {
    highest?: { rating: number; date: number }; // May be missing
    lowest?: { rating: number; date: number }; // May be missing
}

export interface PuzzleRushStats {
    best?: {
        total_attempts: number;
        score: number;
    }; // Some users may not have puzzle rush data
}

export interface PlayerStats {
    chess_daily?: ChessStats; // Some users may not have played Daily
    chess_rapid?: ChessStats;
    chess_bullet?: ChessStats;
    chess_blitz?: ChessStats;
    fide?: number; // Some users may not have a FIDE rating
    tactics?: TacticsStats;
    puzzle_rush?: PuzzleRushStats;
}


export interface Game {
    url: string;
    time_class: string;
    pgn: string;
    white: { username: string; result: string };
    black: { username: string; result: string };
}

export interface ChessDataContextType {
    userProfile: UserProfile | null;
    stats: PlayerStats | null;
    games: Game[] | null;
    dates: string[];
    status: status | null;
}