import { useDraggable } from '@dnd-kit/core';
import PlayerHeadshot from '../teams/PlayerHeadshot';

export default function DraggableAsset({ 
  asset, 
  isOverlay = false,
  onRemove // ⬅️ NEW PROP
}: { 
  asset: any, 
  isOverlay?: boolean,
  onRemove?: () => void // ⬅️ NEW TYPE
}) {
  // If this is the overlay, we append a suffix so dnd-kit doesn't get confused by duplicate IDs
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: isOverlay ? `${asset.id}-overlay` : asset.id,
    data: asset, 
  });

  // Only apply the raw CSS transform to the original item, the DragOverlay handles its own positioning
  const style = transform && !isOverlay ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50, 
  } : undefined;

  // Visual states
  const baseClasses = "bg-white rounded-md border border-slate-200 p-2 flex items-center justify-between transition-all duration-200";
  const ghostClasses = isDragging && !isOverlay ? "opacity-30 border-dashed" : "shadow-sm hover:border-blue-300";
  const overlayClasses = isOverlay ? "shadow-xl scale-105 ring-2 ring-blue-500 cursor-grabbing rotate-2 z-50" : "cursor-grab";

  // 🎯 DRAFT PICK RENDER
  if (asset.type === 'PICK') {
    return (
      <div 
        ref={setNodeRef} {...listeners} {...attributes} style={style}
        className={`${baseClasses} ${ghostClasses} ${overlayClasses}`}
      >
        <div className="flex items-center gap-2 overflow-hidden pr-1">
            <div className="h-7 w-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs border border-blue-100 flex-shrink-0">
              🎯
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[11px] md:text-xs text-slate-800 truncate">{asset.name}</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Draft Pick</div>
            </div>
        </div>

        <div className="flex items-center flex-shrink-0 gap-1">
            {/* ❌ NEW: Remove Button */}
            {onRemove && !isOverlay && (
              <button 
                onPointerDown={(e) => e.stopPropagation()} // Stops dnd-kit from initiating a drag
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Remove from block"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}

            <div className="text-slate-300 px-1 hidden md:block">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <button 
              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors md:hidden" 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => alert("Move Menu coming soon!")}
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
        </div>
      </div>
    );
  }

  // ⚾ PLAYER RENDER
  const player = asset.meta;
  const isNotActive = player.status !== 'ACTIVE';

  return (
    <div 
      ref={setNodeRef} {...listeners} {...attributes} style={style}
      className={`${baseClasses} ${ghostClasses} ${overlayClasses}`}
    >
      <div className="flex items-center gap-2 overflow-hidden pr-1">
          <div className="relative h-8 w-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
            <PlayerHeadshot player={player} />
            {isNotActive && (
              <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                <span className="bg-red-600 text-white text-[6px] font-black px-0.5 rounded uppercase tracking-tighter">
                  {player.status}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-bold text-[11px] md:text-xs text-slate-800 truncate leading-tight">
              {asset.name}
            </div>
            <div className="flex items-center gap-1 text-[8px] font-bold uppercase mt-0.5">
              <span className="text-blue-700 bg-blue-50 px-1 rounded border border-blue-100">{player.positions?.[0]?.abbrev || '??'}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 truncate">{player.level}</span>
            </div>
          </div>
      </div>
      
      <div className="flex items-center flex-shrink-0 gap-1">
          {/* ❌ NEW: Remove Button */}
          {onRemove && !isOverlay && (
            <button 
              onPointerDown={(e) => e.stopPropagation()} // Stops dnd-kit from initiating a drag
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Remove from block"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}

          <div className="text-slate-300 px-1 hidden md:block">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          </div>
          <button 
            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors md:hidden" 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => alert("Move Menu coming soon!")}
          >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
      </div>
    </div>
  );
}