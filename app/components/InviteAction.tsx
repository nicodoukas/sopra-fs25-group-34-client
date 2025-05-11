import { useState } from "react";

import { useApi } from "@/hooks/useApi";
import { Lobby } from "@/types/lobby";
import { User } from "@/types/user";

import { Button, message } from "antd";

interface Props {
  user: User;
  lobby: Lobby;
}

export default function InviteAction({ user, lobby }: Props) {
  const apiService = useApi();
  const [pending, setPending] = useState(false);

  const isMember = lobby.members?.some((member) => member.id === user.id);

  if (isMember) {
    return <p>already joined lobby</p>;
  }

  if (pending) {
    return <p>pending lobby invite</p>;
  }

  const handleInvite = async () => {
    try {
      setPending(true);
      await apiService.post(`/lobbies/invite/${user.id}`, lobby.lobbyId);
      message.success(`Lobby invite sent to ${user.username}`);
    } catch (error) {
      message.error(`Failed to invite ${user.username}.`);
      console.error("Invite error:", error);
      setPending(false);
    }
  };

  return (
    <Button type="primary" onClick={handleInvite}>
      Invite to Lobby
    </Button>
  );
}
