import { Input } from '@shared/ui';

export interface AddressFormValues {
  label: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
}

interface AddressFormFieldsProps {
  addressForm: AddressFormValues;
  setAddressForm: (next: AddressFormValues) => void;
}

/**
 * The six fields of a postal address.
 *
 * Shared by the delivery-address modal and the address page, which had the same six `Input`s
 * with the same grid and the same spread-update handler written out twice.
 */
export function AddressFormFields({ addressForm, setAddressForm }: AddressFormFieldsProps) {
  return (
<div className="space-y-3 flex-1 pb-4">
<label className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-300 uppercase">Address Details</label>

<div className="grid grid-cols-2 gap-3">
<div className="col-span-2">
<Input
type="text"
placeholder="Label (e.g. Home, Work)"
value={addressForm.label}
onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
/>
</div>

<div className="col-span-2">
<Input
type="text"
placeholder="Address Line 1"
value={addressForm.addressLine1}
onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
/>
</div>

<div className="col-span-2">
<Input
type="text"
placeholder="Address Line 2 (Optional)"
value={addressForm.addressLine2}
onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
/>
</div>

<div>
<Input
type="text"
placeholder="City"
value={addressForm.city}
onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
/>
</div>

<div>
<Input
type="text"
placeholder="State"
value={addressForm.state}
onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
/>
</div>

<div className="col-span-2">
<Input
type="text"
placeholder="ZIP Code"
value={addressForm.zipCode}
onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
/>
</div>
</div>
</div>
  );
}
