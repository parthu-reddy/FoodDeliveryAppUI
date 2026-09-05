
interface DeliveryOnlineToggleProps {
  isOnline: boolean;
  deliveryExecutiveId: string;
  isProfileMandatory: boolean;
  handleToggleOnline: () => void;
}

export function DeliveryOnlineToggle({
  isOnline,
  deliveryExecutiveId,
  isProfileMandatory,
  handleToggleOnline
}: DeliveryOnlineToggleProps) {
  return (
    <button
      onClick={handleToggleOnline}
      disabled={!deliveryExecutiveId || isProfileMandatory}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
        isOnline 
          ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
          : (!deliveryExecutiveId || isProfileMandatory)
            ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
            : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-[#f0ede6]'
      }`}
    >
      {isOnline ? 'Online Duty' : 'Offline'}
    </button>
  );
}
