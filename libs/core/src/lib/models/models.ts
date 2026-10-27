import { Localized } from './localized';
import { RegionId } from './countries';

export type RoleId =
  | 'doctor'
  | 'nurse'
  | 'midwife'
  | 'paramedic'
  | 'pharmacist'
  | 'lab-tech'
  | 'psychologist'
  | 'logistics'
  | 'translator'
  | 'biomedical'
  | 'public-health'
  | 'nutrition';

export type SpecialtyId =
  | 'emergency'
  | 'pediatrics'
  | 'obgyn'
  | 'surgery'
  | 'internal'
  | 'anesthesia'
  | 'infectious'
  | 'mental-health'
  | 'lab'
  | 'pharmacy'
  | 'logistics'
  | 'translation'
  | 'biomed'
  | 'public-health'
  | 'nutrition';

export type Urgency = 'critical' | 'high' | 'standard';
export type ContractType = 'emergency' | 'short' | 'long' | 'remote';
export type MissionStatus = 'open' | 'closing' | 'filled';
export type LanguageLevel = 'basic' | 'intermediate' | 'advanced' | 'native';

export type ApplicationStatus =
  | 'submitted'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'declined'
  | 'withdrawn';

export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

export interface LanguageRequirement {
  readonly code: string;
  readonly minLevel: LanguageLevel;
}

export interface TeamMember {
  readonly name: string;
  readonly role: Localized;
  readonly avatar: string;
}

export interface MissionLogistics {
  readonly housing: boolean;
  readonly travel: boolean;
  readonly insurance: boolean;
  readonly stipend?: Localized;
  readonly notes: Localized;
}

export interface Mission {
  readonly id: string;
  readonly slug: string;
  readonly title: Localized;
  readonly orgId: string;
  readonly summary: Localized;
  readonly description: Localized;
  readonly roles: readonly RoleId[];
  readonly specialties: readonly SpecialtyId[];
  readonly urgency: Urgency;
  readonly status: MissionStatus;
  readonly contractType: ContractType;
  readonly countryCode: string;
  readonly region: RegionId;
  readonly city: string;
  readonly coordinates: GeoPoint;
  readonly startDate: string;
  readonly endDate: string;
  readonly durationWeeks: number;
  readonly slots: { readonly total: number; readonly filled: number };
  readonly languages: readonly LanguageRequirement[];
  readonly requirements: readonly Localized[];
  readonly responsibilities: readonly Localized[];
  readonly benefits: readonly Localized[];
  readonly logistics: MissionLogistics;
  readonly photos: readonly string[];
  readonly team: readonly TeamMember[];
  readonly createdAt: string;
  readonly featured: boolean;
  readonly remote: boolean;
}

export interface Organization {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly monogram: string;
  readonly color: string;
  readonly description: Localized;
  readonly countryCode: string;
  readonly verified: boolean;
  readonly rating: number;
  readonly reviewCount: number;
  readonly focusAreas: readonly Localized[];
  readonly website: string;
  readonly founded: number;
}

export interface ExperienceItem {
  readonly id: string;
  readonly role: RoleId;
  readonly organization: string;
  readonly countryCode: string;
  readonly from: string;
  readonly to: string;
  readonly summary: Localized;
  readonly verified: boolean;
}

export interface EducationItem {
  readonly id: string;
  readonly title: Localized;
  readonly institution: string;
  readonly year: number;
}

export type DocumentStatus = 'verified' | 'pending' | 'expired';

export interface DocumentItem {
  readonly id: string;
  readonly type: 'license' | 'passport' | 'degree' | 'vaccination' | 'insurance';
  readonly name: string;
  readonly status: DocumentStatus;
  readonly expiresAt?: string;
}

export interface ProfileLanguage {
  readonly code: string;
  readonly level: LanguageLevel;
}

export interface Availability {
  readonly from: string;
  readonly to: string;
}

export interface Wishlist {
  readonly roles: readonly RoleId[];
  readonly regions: readonly RegionId[];
  readonly countries: readonly string[];
  readonly contractTypes: readonly ContractType[];
  readonly availability: Availability;
  readonly alerts: boolean;
}

export interface ScoreBreakdown {
  readonly verification: number;
  readonly experience: number;
  readonly specialty: number;
  readonly languages: number;
  readonly recommendations: number;
  readonly missions: number;
}

export interface ProfileScore {
  readonly total: number;
  readonly breakdown: ScoreBreakdown;
}

export interface ProfileStats {
  readonly missions: number;
  readonly countries: number;
  readonly hours: number;
}

export interface VolunteerProfile {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly avatar: string;
  readonly headline: Localized;
  readonly bio: Localized;
  readonly location: { readonly city: string; readonly countryCode: string };
  readonly roles: readonly RoleId[];
  readonly specialties: readonly SpecialtyId[];
  readonly languages: readonly ProfileLanguage[];
  readonly availability: Availability;
  readonly verified: boolean;
  readonly score: ProfileScore;
  readonly experience: readonly ExperienceItem[];
  readonly education: readonly EducationItem[];
  readonly documents: readonly DocumentItem[];
  readonly wishes: Wishlist;
  readonly stats: ProfileStats;
  readonly joinedAt: string;
}

export interface Recommendation {
  readonly id: string;
  readonly profileId: string;
  readonly authorName: string;
  readonly authorRole: Localized;
  readonly authorAvatar: string;
  readonly organization: string;
  readonly relation: Localized;
  readonly rating: number;
  readonly quote: Localized;
  readonly date: string;
  readonly status: 'published' | 'pending';
}

export interface ApplicationTimelineEntry {
  readonly status: ApplicationStatus;
  readonly date: string;
  readonly note?: Localized;
}

export interface Application {
  readonly id: string;
  readonly missionId: string;
  readonly userId: string;
  readonly status: ApplicationStatus;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly timeline: readonly ApplicationTimelineEntry[];
  readonly answers: Readonly<Record<string, unknown>>;
  readonly motivation: string;
}

export interface MissionMatch {
  readonly missionId: string;
  readonly score: number;
  readonly reasons: readonly Localized[];
}

export type MissionSort = 'relevance' | 'startDate' | 'duration' | 'urgency';

export interface MissionFilters {
  readonly q: string;
  readonly role: RoleId | 'all';
  readonly country: string | 'all';
  readonly region: RegionId | 'all';
  readonly language: string | 'all';
  readonly urgency: Urgency | 'all';
  readonly contractType: ContractType | 'all';
  readonly startFrom?: string;
  readonly startTo?: string;
  readonly minDuration?: number;
  readonly verified: boolean;
  readonly remote: boolean;
  readonly sort: MissionSort;
  readonly page: number;
  readonly pageSize: number;
}

export const DEFAULT_FILTERS: MissionFilters = {
  q: '',
  role: 'all',
  country: 'all',
  region: 'all',
  language: 'all',
  urgency: 'all',
  contractType: 'all',
  verified: false,
  remote: false,
  sort: 'relevance',
  page: 1,
  pageSize: 9,
};

export interface PageMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly facets?: {
    readonly roles: Readonly<Record<string, number>>;
    readonly countries: Readonly<Record<string, number>>;
    readonly urgencies: Readonly<Record<string, number>>;
  };
}

export interface Paged<T> {
  readonly data: readonly T[];
  readonly meta: PageMeta;
}

export interface FilterMeta {
  readonly roles: readonly RoleId[];
  readonly countries: readonly string[];
  readonly regions: readonly RegionId[];
  readonly languages: readonly string[];
  readonly urgencies: readonly Urgency[];
  readonly contractTypes: readonly ContractType[];
}

export interface LandingStats {
  readonly openMissions: number;
  readonly countries: number;
  readonly volunteers: number;
  readonly organizations: number;
}

export interface AuthSession {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'volunteer' | 'organization';
  readonly avatar?: string;
}

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface RegisterPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface RecommendationRequest {
  readonly authorName: string;
  readonly authorEmail: string;
  readonly organization?: string;
  readonly message: string;
}

export interface MissionQuery extends MissionFilters {}

export interface ProfilePatch {
  readonly name?: string;
  readonly headline?: Localized;
  readonly bio?: Localized;
  readonly location?: { readonly city: string; readonly countryCode: string };
  readonly roles?: readonly RoleId[];
  readonly specialties?: readonly SpecialtyId[];
  readonly languages?: readonly ProfileLanguage[];
  readonly availability?: Availability;
}

export interface ApplicationDraft {
  readonly availableFrom: string;
  readonly availableTo: string;
  readonly role: RoleId;
  readonly years: number;
  readonly license: string;
  readonly driving: boolean;
  readonly health?: string;
  readonly languages: readonly ProfileLanguage[];
  readonly motivation: string;
  readonly consent: boolean;
}
