import {User} from "./user";

export interface Lobby {
  id: string | null;
  name: string | null;
  host: string | null;
  members: User[];
}