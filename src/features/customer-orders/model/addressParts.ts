import { z } from 'zod';

/**
 * Split a one-line Indian address into the fields a form asks for.
 *
 * There were two of these, both called `parseIndianAddress`, in two files, returning
 * different shapes and disagreeing on the same input. The positional one in the address modal
 * counted commas from the end and took whatever landed there; this one — the address page's —
 * works backwards properly: it drops a trailing "India", splits "Karnataka 560034" into a
 * state and a ZIP, and only then falls back to position. It is the one that survives, because
 * getting this wrong puts the city in the state column of a saved address and sends the
 * delivery somewhere else.
 */

export interface AddressParts {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
}

const COUNTRY_SUFFIXES = ['india', 'in'];
/** "Karnataka 560034" — a state and a postcode sharing one comma-separated part. */
const STATE_WITH_ZIP = /(.*?)\s+([\d\s-]{5,10})$/;
const ZIP_ONLY = /^[\d\s-]{5,10}$/;

export function parseIndianAddress(address: string | undefined | null): AddressParts {
  const parts = String(address ?? '').split(',').map((part) => part.trim()).filter(Boolean);

  let zipCode = '';
  let state = '';
  let city = '';
  let index = parts.length - 1;

  if (index >= 0 && COUNTRY_SUFFIXES.includes(parts[index].toLowerCase())) index--;

  if (index >= 0) {
    const withZip = parts[index].match(STATE_WITH_ZIP);
    if (withZip) {
      state = withZip[1].trim();
      zipCode = withZip[2].trim();
      index--;
    } else if (ZIP_ONLY.test(parts[index])) {
      zipCode = parts[index];
      index--;
    }
  }
  if (index >= 0 && !state) {
    state = parts[index];
    index--;
  }
  if (index >= 0) {
    city = parts[index];
    index--;
  }

  // Whatever is left at the front is the street. A second line only exists when there is
  // something between the street and the city.
  const addressLine1 = parts[0] ?? '';
  const addressLine2 = index >= 1 ? parts.slice(1, index + 1).join(', ') : '';

  return { addressLine1, addressLine2, city, state, zipCode };
}

/**
 * What the server will accept as an address. It lives beside the parser because the two are
 * the same subject: one produces these fields, the other decides whether they are usable.
 */
export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label cannot exceed 50 characters'),
  addressLine1: z.string().min(1, 'Address Line 1 is required').max(255, 'Address cannot exceed 255 characters'),
  addressLine2: z.string().max(255, 'Address cannot exceed 255 characters').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City cannot exceed 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State cannot exceed 100 characters'),
  zipCode: z.string().min(1, 'ZIP Code is required').max(20, 'ZIP Code cannot exceed 20 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});
