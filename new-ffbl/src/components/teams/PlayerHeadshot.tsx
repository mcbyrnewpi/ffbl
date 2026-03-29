import Image from 'next/image';

interface Props {
  player: any;
  className?: string;
}

export default function PlayerHeadshot({ player, className = "" }: Props) {
  const rawData = player.mlbRawData as any;
  const mlbId = player.mlbId;

  // 1. Determine the best source
  // Priority: DB Snapshot > Live MLB Template > Local Silhouette
  const src = rawData?.images?.headshot 
    ? rawData.images.headshot 
    : mlbId 
      ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:brooks:no_headshot.png/w_213,q_auto:best/v1/people/${mlbId}/headshot/67/current`
      : "/images/placeholders/no-player.svg"; // Your local fallback

  return (
    <div className={`relative w-full h-full bg-slate-100 ${className}`}>
      <Image
        src={src}
        alt={`${player.lastName} headshot`}
        fill
        unoptimized
        className="object-cover object-top transition-opacity duration-300"
        sizes="(max-width: 768px) 50vw, 20vw"
        // 🛡️ The ultimate safety: If the URL 404s, switch to a local image
        onError={(e) => {
          // This is a React trick to swap the src if the external link is dead
          const target = e.target as HTMLImageElement;
          target.src = "/images/placeholders/no-player.svg";
        }}
      />
    </div>
  );
}