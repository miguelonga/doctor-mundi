import {
  LanguageLevel,
  Mission,
  MissionMatch,
  ProfileScore,
  Recommendation,
  VolunteerProfile,
} from '../models/models';
import { L, Localized } from '../models/localized';
import { ROLE_LABELS, SPECIALTY_LABELS } from '../models/labels';

const LEVEL_RANK: Record<LanguageLevel, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  native: 4,
};

function overlap<T>(a: readonly T[], b: readonly T[]): T[] {
  const set = new Set(b);
  return a.filter((item) => set.has(item));
}

function daysBetween(a: string, b: string): number {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function computeProfileScore(
  profile: VolunteerProfile,
  recommendationCount: number
): ProfileScore {
  const experienceYears = profile.experience.reduce((total, item) => {
    const from = new Date(item.from).getTime();
    const to = item.to === 'present' ? Date.now() : new Date(item.to).getTime();
    if (Number.isNaN(from) || Number.isNaN(to)) return total;
    return total + Math.max(0, (to - from) / (86_400_000 * 365));
  }, 0);

  const verification = profile.verified ? 25 : 6;
  const experience = Math.min(20, Math.round(experienceYears * 2.5) + profile.experience.length * 3);
  const specialty = Math.min(15, profile.specialties.length * 5);
  const languages = Math.min(15, profile.languages.length * 5);
  const recommendations = Math.min(15, recommendationCount * 5);
  const missions = Math.min(10, profile.stats.missions * 2);

  const breakdown = { verification, experience, specialty, languages, recommendations, missions };
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return { total: Math.min(100, total), breakdown };
}

export function computeMissionMatch(
  mission: Mission,
  profile: VolunteerProfile | null,
  recommendationCount = 0
): MissionMatch {
  if (!profile) {
    return {
      missionId: mission.id,
      score: 0,
      reasons: [],
    };
  }

  const reasons: Localized[] = [];
  let score = 0;

  const roleMatches = overlap(mission.roles, profile.roles);
  if (roleMatches.length) {
    score += 35;
    reasons.push(L(
      `Coincide con tu rol de ${ROLE_LABELS[roleMatches[0]].es.toLowerCase()}`,
      `Matches your ${ROLE_LABELS[roleMatches[0]].en.toLowerCase()} role`
    ));
  }

  const availabilityOverlap =
    new Date(profile.availability.from) <= new Date(mission.endDate) &&
    new Date(profile.availability.to) >= new Date(mission.startDate);
  if (availabilityOverlap) {
    score += 20;
    reasons.push(L(
      'Encaja con tu disponibilidad',
      'Fits your availability'
    ));
  } else {
    score += 4;
  }

  const languageScore = mission.languages.reduce((sum, requirement) => {
    const spoken = profile.languages.find((language) => language.code === requirement.code);
    if (!spoken) return sum;
    return sum + (LEVEL_RANK[spoken.level] >= LEVEL_RANK[requirement.minLevel] ? 1 : 0.4);
  }, 0);
  if (mission.languages.length) {
    score += Math.round((languageScore / mission.languages.length) * 20);
    if (languageScore >= mission.languages.length) {
      reasons.push(L(
        'Puedes trabajar en el idioma de la misión',
        'You can work in the mission language'
      ));
    }
  } else {
    score += 12;
  }

  const wishRegion = profile.wishes.regions.includes(mission.region);
  const wishCountry = profile.wishes.countries.includes(mission.countryCode);
  if (wishRegion || wishCountry) {
    score += 15;
    reasons.push(L(
      'Está en una región que te interesa',
      'It is in a region you are interested in'
    ));
  } else if (!profile.wishes.regions.length && !profile.wishes.countries.length) {
    score += 8;
  } else {
    score += 2;
  }

  const specialtyMatches = overlap(mission.specialties, profile.specialties);
  if (specialtyMatches.length) {
    score += 10;
    reasons.push(L(
      `Tu experiencia en ${SPECIALTY_LABELS[specialtyMatches[0]].es.toLowerCase()} encaja con lo que piden`,
      `Your ${SPECIALTY_LABELS[specialtyMatches[0]].en.toLowerCase()} experience matches what they ask for`
    ));
  } else {
    score += 3;
  }

  if (recommendationCount >= 2) {
    reasons.push(L(
      'Tus recomendaciones respaldan tu perfil',
      'Your recommendations back your profile'
    ));
  }

  if (!reasons.length) {
    reasons.push(L(
      'Tu perfil puede encajar: revisa los requisitos',
      'Your profile may fit: check the requirements'
    ));
  }

  return {
    missionId: mission.id,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
  };
}

export function missionDurationDays(mission: Mission): number {
  return daysBetween(mission.startDate, mission.endDate);
}

export function urgentScore(mission: Mission): number {
  return mission.urgency === 'critical' ? 3 : mission.urgency === 'high' ? 2 : 1;
}

export function recommendationCountFor(
  profileId: string,
  recommendations: readonly Recommendation[]
): number {
  return recommendations.filter(
    (recommendation) => recommendation.profileId === profileId && recommendation.status === 'published'
  ).length;
}
