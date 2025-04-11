import {Player} from "./player";
import {SongCard} from "./songcard";

export interface Round {
    activePlayer: Player;
    songCard: SongCard | null;
    roundNr: number;
    activePlayerPlacement: number;
    challenger: Player | null;
    challengerPlacement: number | null;
    previewURL: string | null;
}