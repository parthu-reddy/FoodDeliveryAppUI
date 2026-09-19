import { FormField, Input } from '@shared/ui';

interface CoordinateFieldsProps {
  lat: string;
  lng: string;
  onChange: (next: { lat: string; lng: string }) => void;
}

/**
 * Latitude and longitude, typed by hand.
 *
 * The two fields were written out twice with the same "reposition the marker if both parse"
 * body, once per axis, and each copy read the *other* axis from a closure — so the pair only
 * behaved because both copies were kept in step. One handler, both values.
 */
export function CoordinateFields({ lat, lng, onChange }: CoordinateFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Latitude" required>
        <Input
          type="number"
          step="any"
          required
          value={lat}
          onChange={(e) => onChange({ lat: e.target.value, lng })}
        />
      </FormField>
      <FormField label="Longitude" required>
        <Input
          type="number"
          step="any"
          required
          value={lng}
          onChange={(e) => onChange({ lat, lng: e.target.value })}
        />
      </FormField>
    </div>
  );
}
