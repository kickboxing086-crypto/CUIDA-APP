export interface CepAddressResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  fullAddress: string;
}

/**
 * Formata CEP no padrão 00000-000
 */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Consulta CEP em tempo real via ViaCEP com fallback para BrasilAPI
 */
export async function fetchAddressByCep(rawCep: string): Promise<CepAddressResult | null> {
  const clean = rawCep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    // 1. Consulta principal: ViaCEP
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        const street = data.logradouro || '';
        const neighborhood = data.bairro || '';
        const city = data.localidade || '';
        const state = data.uf || '';

        const parts: string[] = [];
        if (street) parts.push(street);
        if (neighborhood) parts.push(neighborhood);
        if (city && state) parts.push(`${city} - ${state}`);
        else if (city) parts.push(city);

        return {
          cep: formatCep(clean),
          street,
          neighborhood,
          city,
          state,
          fullAddress: parts.join(', '),
        };
      }
    }
  } catch (err) {
    console.warn('[CUIDA CEP] ViaCEP indisponível, tentando BrasilAPI:', err);
  }

  try {
    // 2. Fallback: BrasilAPI
    const res2 = await fetch(`https://brasilapi.com.br/api/cep/v1/${clean}`);
    if (res2.ok) {
      const data2 = await res2.json();
      const street = data2.street || '';
      const neighborhood = data2.neighborhood || '';
      const city = data2.city || '';
      const state = data2.state || '';

      const parts: string[] = [];
      if (street) parts.push(street);
      if (neighborhood) parts.push(neighborhood);
      if (city && state) parts.push(`${city} - ${state}`);
      else if (city) parts.push(city);

      return {
        cep: formatCep(clean),
        street,
        neighborhood,
        city,
        state,
        fullAddress: parts.join(', '),
      };
    }
  } catch (err) {
    console.error('[CUIDA CEP] Erro ao consultar BrasilAPI:', err);
  }

  return null;
}
