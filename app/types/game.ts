import {Player} from "./player";

export interface Game {
    gameId: string | null;
    gameName: string | null;
    turnCount: number;
    turnOrder: Player[] | null;
    host: Player | null;
    players: Player[];
}