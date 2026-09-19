import { Button } from '@shared/ui';

/**
 * On duty or off. The single most consequential control on the rider's screen — it is what
 * makes their phone start ringing — so it is a 48px target and it states which way it is.
 *
 * Was a hand-rolled `<button>` with three branches of raw slate utilities and a hard-coded
 * rose glow. It carried no accessible state at all: a screen reader read "Online Duty" with
 * no indication of whether that was the current state or the thing the button would do.
 */

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
  handleToggleOnline,
}: DeliveryOnlineToggleProps) {
  const blocked = !deliveryExecutiveId || isProfileMandatory;

  return (
    <Button
      size="touch"
      variant={isOnline ? 'success' : 'secondary'}
      onClick={handleToggleOnline}
      disabled={blocked}
      aria-pressed={isOnline}
      title={blocked ? 'Complete your profile before going on duty' : undefined}
    >
      {isOnline ? 'Online Duty' : 'Offline'}
    </Button>
  );
}
