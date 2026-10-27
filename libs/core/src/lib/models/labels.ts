import { Localized, L } from './localized';
import { ContractType, LanguageLevel, RoleId, SpecialtyId, Urgency, ApplicationStatus } from './models';

export const ROLE_LABELS: Record<RoleId, Localized> = {
  doctor: L('Medicina', 'Doctor'),
  nurse: L('Enfermería', 'Nursing'),
  midwife: L('Matronería', 'Midwifery'),
  paramedic: L('Emergencias', 'Paramedic'),
  pharmacist: L('Farmacia', 'Pharmacy'),
  'lab-tech': L('Laboratorio', 'Lab technician'),
  psychologist: L('Psicología', 'Psychology'),
  logistics: L('Logística', 'Logistics'),
  translator: L('Traducción', 'Translation'),
  biomedical: L('Ingeniería biomédica', 'Biomedical engineering'),
  'public-health': L('Salud pública', 'Public health'),
  nutrition: L('Nutrición', 'Nutrition'),
};

export const SPECIALTY_LABELS: Record<SpecialtyId, Localized> = {
  emergency: L('Urgencias', 'Emergency'),
  pediatrics: L('Pediatría', 'Paediatrics'),
  obgyn: L('Ginecología y obstetricia', 'Obstetrics and gynaecology'),
  surgery: L('Cirugía', 'Surgery'),
  internal: L('Medicina interna', 'Internal medicine'),
  anesthesia: L('Anestesia', 'Anaesthesia'),
  infectious: L('Enfermedades infecciosas', 'Infectious diseases'),
  'mental-health': L('Salud mental', 'Mental health'),
  lab: L('Diagnóstico de laboratorio', 'Lab diagnostics'),
  pharmacy: L('Farmacia clínica', 'Clinical pharmacy'),
  logistics: L('Logística humanitaria', 'Humanitarian logistics'),
  translation: L('Interpretación', 'Interpretation'),
  biomed: L('Equipamiento médico', 'Medical equipment'),
  'public-health': L('Salud comunitaria', 'Community health'),
  nutrition: L('Nutrición infantil', 'Child nutrition'),
};

export const URGENCY_LABELS: Record<Urgency, Localized> = {
  critical: L('Crítica', 'Critical'),
  high: L('Alta', 'High'),
  standard: L('Estándar', 'Standard'),
};

export const CONTRACT_LABELS: Record<ContractType, Localized> = {
  emergency: L('Respuesta de emergencia', 'Emergency response'),
  short: L('Estancia corta', 'Short stay'),
  long: L('Misión larga', 'Long mission'),
  remote: L('Remota', 'Remote'),
};

export const LEVEL_LABELS: Record<LanguageLevel, Localized> = {
  basic: L('Básico', 'Basic'),
  intermediate: L('Intermedio', 'Intermediate'),
  advanced: L('Avanzado', 'Advanced'),
  native: L('Nativo', 'Native'),
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, Localized> = {
  submitted: L('Enviada', 'Submitted'),
  screening: L('En revisión', 'Under review'),
  interview: L('Entrevista', 'Interview'),
  offer: L('Oferta', 'Offer'),
  accepted: L('Aceptada', 'Accepted'),
  declined: L('No seleccionada', 'Not selected'),
  withdrawn: L('Retirada', 'Withdrawn'),
};

export const LANGUAGE_NAMES: Record<string, Localized> = {
  es: L('Español', 'Spanish'),
  en: L('Inglés', 'English'),
  fr: L('Francés', 'French'),
  ar: L('Árabe', 'Arabic'),
  pt: L('Portugués', 'Portuguese'),
  sw: L('Suajili', 'Swahili'),
  so: L('Somalí', 'Somali'),
  ht: L('Criollo haitiano', 'Haitian Creole'),
  uk: L('Ucraniano', 'Ukrainian'),
  ro: L('Rumano', 'Romanian'),
  bn: L('Bengalí', 'Bengali'),
  ne: L('Nepalí', 'Nepali'),
  id: L('Indonesio', 'Indonesian'),
  fj: L('Fiyiano', 'Fijian'),
  ku: L('Kurdo', 'Kurdish'),
  tr: L('Turco', 'Turkish'),
  el: L('Griego', 'Greek'),
  ru: L('Ruso', 'Russian'),
  qu: L('Quechua', 'Quechua'),
};
