import {User} from "./user";

export interface Lobby {
  lobbyId: string | null;
  lobbyName: string | null;
  host: string | null;
  members: User[];
}