import {SongCard} from "./songcard";

export interface Player {
    userId: string | null;
    gameId: string | null;
    coinBalance: number;
    username: string | null;
    timeline: SongCard[];
}
