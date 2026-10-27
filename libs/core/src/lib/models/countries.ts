import { Localized, L } from './localized';

export type RegionId =
  | 'africa-west'
  | 'africa-east'
  | 'africa-south'
  | 'middle-east'
  | 'south-asia'
  | 'southeast-asia'
  | 'europe'
  | 'latin-america'
  | 'caribbean'
  | 'pacific';

export interface Country {
  readonly code: string;
  readonly name: Localized;
  readonly region: RegionId;
  readonly lat: number;
  readonly lng: number;
}

export const COUNTRIES: readonly Country[] = [
  { code: 'KE', name: L('Kenia', 'Kenya'), region: 'africa-east', lat: -1.2921, lng: 36.8219 },
  { code: 'UG', name: L('Uganda', 'Uganda'), region: 'africa-east', lat: 0.3476, lng: 32.5825 },
  { code: 'TZ', name: L('Tanzania', 'Tanzania'), region: 'africa-east', lat: -6.7924, lng: 39.2083 },
  { code: 'ET', name: L('Etiopía', 'Ethiopia'), region: 'africa-east', lat: 9.0192, lng: 38.7525 },
  { code: 'SS', name: L('Sudán del Sur', 'South Sudan'), region: 'africa-east', lat: 4.8594, lng: 31.5713 },
  { code: 'NG', name: L('Nigeria', 'Nigeria'), region: 'africa-west', lat: 9.082, lng: 8.6753 },
  { code: 'ML', name: L('Malí', 'Mali'), region: 'africa-west', lat: 17.5707, lng: -3.9962 },
  { code: 'SN', name: L('Senegal', 'Senegal'), region: 'africa-west', lat: 14.4974, lng: -14.4524 },
  { code: 'CD', name: L('República Democrática del Congo', 'DR Congo'), region: 'africa-south', lat: -4.0383, lng: 21.7587 },
  { code: 'MZ', name: L('Mozambique', 'Mozambique'), region: 'africa-south', lat: -18.6657, lng: 35.5296 },
  { code: 'SY', name: L('Siria', 'Syria'), region: 'middle-east', lat: 34.8021, lng: 38.9968 },
  { code: 'YE', name: L('Yemen', 'Yemen'), region: 'middle-east', lat: 15.5527, lng: 48.5164 },
  { code: 'JO', name: L('Jordania', 'Jordan'), region: 'middle-east', lat: 30.5852, lng: 36.2384 },
  { code: 'LB', name: L('Líbano', 'Lebanon'), region: 'middle-east', lat: 33.8547, lng: 35.8623 },
  { code: 'BD', name: L('Bangladesh', 'Bangladesh'), region: 'south-asia', lat: 23.685, lng: 90.3563 },
  { code: 'NP', name: L('Nepal', 'Nepal'), region: 'south-asia', lat: 28.3949, lng: 84.124 },
  { code: 'PK', name: L('Pakistán', 'Pakistan'), region: 'south-asia', lat: 30.3753, lng: 69.3451 },
  { code: 'PH', name: L('Filipinas', 'Philippines'), region: 'southeast-asia', lat: 12.8797, lng: 121.774 },
  { code: 'ID', name: L('Indonesia', 'Indonesia'), region: 'southeast-asia', lat: -0.7893, lng: 113.9213 },
  { code: 'MM', name: L('Myanmar', 'Myanmar'), region: 'southeast-asia', lat: 21.9162, lng: 95.956 },
  { code: 'GR', name: L('Grecia', 'Greece'), region: 'europe', lat: 39.0742, lng: 21.8243 },
  { code: 'UA', name: L('Ucrania', 'Ukraine'), region: 'europe', lat: 48.3794, lng: 31.1656 },
  { code: 'MD', name: L('Moldavia', 'Moldova'), region: 'europe', lat: 47.4116, lng: 28.3699 },
  { code: 'ES', name: L('España', 'Spain'), region: 'europe', lat: 40.4168, lng: -3.7038 },
  { code: 'FR', name: L('Francia', 'France'), region: 'europe', lat: 46.2276, lng: 2.2137 },
  { code: 'DE', name: L('Alemania', 'Germany'), region: 'europe', lat: 51.1657, lng: 10.4515 },
  { code: 'IT', name: L('Italia', 'Italy'), region: 'europe', lat: 41.8719, lng: 12.5674 },
  { code: 'NL', name: L('Países Bajos', 'Netherlands'), region: 'europe', lat: 52.1326, lng: 5.2913 },
  { code: 'PT', name: L('Portugal', 'Portugal'), region: 'europe', lat: 39.3999, lng: -8.2245 },
  { code: 'GB', name: L('Reino Unido', 'United Kingdom'), region: 'europe', lat: 55.3781, lng: -3.436 },
  { code: 'IN', name: L('India', 'India'), region: 'south-asia', lat: 20.5937, lng: 78.9629 },
  { code: 'CO', name: L('Colombia', 'Colombia'), region: 'latin-america', lat: 4.5709, lng: -74.2973 },
  { code: 'PE', name: L('Perú', 'Peru'), region: 'latin-america', lat: -9.19, lng: -75.0152 },
  { code: 'GT', name: L('Guatemala', 'Guatemala'), region: 'latin-america', lat: 15.7835, lng: -90.2308 },
  { code: 'HT', name: L('Haití', 'Haiti'), region: 'caribbean', lat: 18.9712, lng: -72.2852 },
  { code: 'FJ', name: L('Fiyi', 'Fiji'), region: 'pacific', lat: -17.7134, lng: 178.065 },
];

export const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

export const REGION_LABELS: Record<RegionId, Localized> = {
  'africa-west': L('África Occidental', 'West Africa'),
  'africa-east': L('África Oriental', 'East Africa'),
  'africa-south': L('África Austral', 'Southern Africa'),
  'middle-east': L('Oriente Medio', 'Middle East'),
  'south-asia': L('Asia del Sur', 'South Asia'),
  'southeast-asia': L('Sudeste Asiático', 'Southeast Asia'),
  europe: L('Europa', 'Europe'),
  'latin-america': L('América Latina', 'Latin America'),
  caribbean: L('Caribe', 'Caribbean'),
  pacific: L('Pacífico', 'Pacific'),
};
