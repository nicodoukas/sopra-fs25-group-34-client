import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Lobby } from "@/types/lobby";
import { User } from "@/types/user";

import "@ant-design/v5-patch-for-react-19";
import { Button } from "antd";
import { MessageInstance } from "antd/es/message/interface";

interface Props {
  user: User;
  lobby: Lobby;
  messageAPI: MessageInstance;
}

export default function InviteAction({ user, lobby, messageAPI }: Props) {
  const apiService = useApi();
  const [pending, setPending] = useState(false);

  const isMember = lobby.members.some((member) => member.id === user.id);

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
      messageAPI.success(`Lobby invite sent to ${user.username}`);
    } catch (error) {
      alert(`Failed to invite ${user.username}.`);
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
