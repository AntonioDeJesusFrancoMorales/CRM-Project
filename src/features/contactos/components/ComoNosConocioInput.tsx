import { Input } from '@/components/ui/input';
import { COMO_NOS_CONOCIO_SUGERENCIAS } from '../schemas/contacto.schema';

interface ComoNosConocioInputProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ComoNosConocioInput({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = 'Ej. Referido, Redes sociales...',
}: ComoNosConocioInputProps) {
  return (
    <>
      <Input
        list="como-nos-conocio-options"
        maxLength={200}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
      />
      <datalist id="como-nos-conocio-options">
        {COMO_NOS_CONOCIO_SUGERENCIAS.map((sugerencia) => (
          <option key={sugerencia} value={sugerencia} />
        ))}
      </datalist>
    </>
  );
}
