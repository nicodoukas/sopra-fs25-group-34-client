import {User} from "./user";

export interface Lobby {
  lobbyId: string | null;
  lobbyName: string | null;
  host: User | null;
  members: User[];
}