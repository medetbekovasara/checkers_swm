import { OnlineArena } from "@/components/game/OnlineArena";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OnlineArena inviteCode={id} />;
}
