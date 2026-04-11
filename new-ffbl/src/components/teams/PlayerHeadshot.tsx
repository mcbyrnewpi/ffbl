// src/components/teams/PlayerHeadshot.tsx
interface PlayerHeadshotProps {
  player: any;
  className?: string;
}

export default function PlayerHeadshot({ player, className }: PlayerHeadshotProps) {
  const imgUrl = player?.mlbId 
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120/v1/people/${player.mlbId}/headshot/silo/current.png` 
    : '/images/placeholders/no-player.svg';

  return (
    <img 
      src={imgUrl}
      alt={player?.lastName ? `${player.firstName} ${player.lastName}` : 'Player Headshot'}
      // 🌟 FIX: Applies passed classes, or falls back to our new un-cropped default
      className={className || "w-full h-full object-contain object-bottom p-1"}
      onError={(e) => {
        e.currentTarget.src = '/images/placeholders/no-player.svg';
      }}
    />
  );
}