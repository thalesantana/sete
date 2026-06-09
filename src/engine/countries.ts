/** Nome (PT) e bandeira de cada seleção do catálogo. */

interface CountryInfo { name: string; iso2?: string; flag?: string }

const DATA: Record<string, CountryInfo> = {
  ALG: { name: 'Argélia', iso2: 'DZ' },
  ARG: { name: 'Argentina', iso2: 'AR' },
  AUS: { name: 'Austrália', iso2: 'AU' },
  AUT: { name: 'Áustria', iso2: 'AT' },
  BEL: { name: 'Bélgica', iso2: 'BE' },
  BRA: { name: 'Brasil', iso2: 'BR' },
  BUL: { name: 'Bulgária', iso2: 'BG' },
  CHI: { name: 'Chile', iso2: 'CL' },
  CIV: { name: 'Costa do Marfim', iso2: 'CI' },
  CMR: { name: 'Camarões', iso2: 'CM' },
  COL: { name: 'Colômbia', iso2: 'CO' },
  CRC: { name: 'Costa Rica', iso2: 'CR' },
  CRO: { name: 'Croácia', iso2: 'HR' },
  CZE: { name: 'República Tcheca', iso2: 'CZ' },
  DEN: { name: 'Dinamarca', iso2: 'DK' },
  ECU: { name: 'Equador', iso2: 'EC' },
  EGY: { name: 'Egito', iso2: 'EG' },
  ENG: { name: 'Inglaterra', flag: '🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}' },
  ESP: { name: 'Espanha', iso2: 'ES' },
  FRA: { name: 'França', iso2: 'FR' },
  GER: { name: 'Alemanha', iso2: 'DE' },
  GHA: { name: 'Gana', iso2: 'GH' },
  GRE: { name: 'Grécia', iso2: 'GR' },
  HUN: { name: 'Hungria', iso2: 'HU' },
  IRL: { name: 'Irlanda', iso2: 'IE' },
  ITA: { name: 'Itália', iso2: 'IT' },
  JPN: { name: 'Japão', iso2: 'JP' },
  KOR: { name: 'Coreia do Sul', iso2: 'KR' },
  MAR: { name: 'Marrocos', iso2: 'MA' },
  MEX: { name: 'México', iso2: 'MX' },
  NED: { name: 'Holanda', iso2: 'NL' },
  NGA: { name: 'Nigéria', iso2: 'NG' },
  NIR: { name: 'Irlanda do Norte', iso2: 'GB' },
  PAR: { name: 'Paraguai', iso2: 'PY' },
  PER: { name: 'Peru', iso2: 'PE' },
  POL: { name: 'Polônia', iso2: 'PL' },
  POR: { name: 'Portugal', iso2: 'PT' },
  ROU: { name: 'Romênia', iso2: 'RO' },
  RUS: { name: 'Rússia', iso2: 'RU' },
  SCO: { name: 'Escócia', flag: '🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}' },
  SEN: { name: 'Senegal', iso2: 'SN' },
  SRB: { name: 'Sérvia', iso2: 'RS' },
  SUI: { name: 'Suíça', iso2: 'CH' },
  SWE: { name: 'Suécia', iso2: 'SE' },
  TCH: { name: 'Tchecoslováquia', iso2: 'CZ' },
  TUR: { name: 'Turquia', iso2: 'TR' },
  UKR: { name: 'Ucrânia', iso2: 'UA' },
  URS: { name: 'União Soviética', iso2: 'RU' },
  URU: { name: 'Uruguai', iso2: 'UY' },
  USA: { name: 'Estados Unidos', iso2: 'US' },
  WAL: { name: 'País de Gales', flag: '🏴\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}' },
  YUG: { name: 'Iugoslávia', iso2: 'RS' },
}

/** ISO-2 → regional-indicator flag emoji. */
function flagFromIso(iso2: string): string {
  return String.fromCodePoint(...[...iso2.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export interface Country { code: string; name: string; flag: string }

/** Resolve a 3-letter selection code to its display name + flag. */
export function country(sel: string): Country {
  const info = DATA[sel]
  if (!info) return { code: sel, name: sel, flag: '🏳️' }
  return { code: sel, name: info.name, flag: info.flag ?? (info.iso2 ? flagFromIso(info.iso2) : '🏳️') }
}
