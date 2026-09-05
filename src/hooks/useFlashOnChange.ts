import { useEffect, useRef, useState } from "react";

/**
 * Fase 14 — sistema de resposta: `true` por 400ms sempre que `value` muda
 * entre renders (nunca no mount) — usado pra piscar um realce âmbar no
 * tile que acabou de atualizar (ex.: km depois de um abastecimento
 * registrado). Ver docs/DESIGN.md, "Sistema de resposta".
 */
export function useFlashOnChange(value: unknown): boolean {
  const previous = useRef(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setFlashing(true);
    const timeout = setTimeout(() => setFlashing(false), 400);
    return () => clearTimeout(timeout);
  }, [value]);

  return flashing;
}
