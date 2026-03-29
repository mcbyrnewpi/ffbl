import { useDroppable } from '@dnd-kit/core';

interface Props {
  id: string; 
  title: string;
  teamId?: string; 
  onRemove?: () => void; // ⬅️ NEW: Optional function to remove the block
  children: React.ReactNode;
}

export default function TradeDropzone({ id, title, teamId, onRemove, children }: Props) {
  const { isOver, setNodeRef, active } = useDroppable({ id });

  const draggedAsset = active?.data?.current;
  const isInvalidDrop = isOver && teamId && draggedAsset && draggedAsset.sourceTeamId === teamId;
  const isValidDrop = isOver && !isInvalidDrop;

  let containerClasses = 'border-dashed border-slate-200 bg-slate-50';
  
  if (isInvalidDrop) {
    containerClasses = 'border-red-500 bg-red-50 ring-2 ring-red-200';
  } else if (isValidDrop) {
    containerClasses = 'border-blue-500 bg-blue-50 shadow-inner';
  }

  return (
    <div 
      ref={setNodeRef}
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 min-h-[150px] flex flex-col ${containerClasses}`}
    >
      {/* ⬅️ NEW: Flex container to hold the title and the X button */}
      <div className="flex justify-between items-start mb-3 z-10 relative">
        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest">
          {title}
        </h3>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors -mt-1 -mr-1"
            title="Remove team from trade"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-2 flex-grow z-10 relative">
        {children}
      </div>

      {isInvalidDrop && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-xl z-20">
           <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-md shadow-md uppercase tracking-wider text-center">
             Cannot trade to <br/> current owner
           </span>
        </div>
      )}
    </div>
  );
}