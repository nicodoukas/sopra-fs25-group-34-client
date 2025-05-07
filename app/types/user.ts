import {ProfilePicture} from "./profilePicture";

export interface User {
  id: string | null;
  username: string | null;
  birthday: string | null;
  creation_date: string | null;
  token: string | null;
  status: string | null;
  friends: number[];
  friendrequests: number[];
  openLobbyInvitations: number[];
  lobbyId: string | null;
  profilePicture: ProfilePicture;
  description: string | null;
}
