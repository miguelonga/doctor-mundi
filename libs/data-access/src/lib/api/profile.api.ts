import {
  ProfilePatch,
  Recommendation,
  RecommendationRequest,
  VolunteerProfile,
} from '@doctor-mundi/core';

export abstract class ProfileApi {
  abstract getMe(): Promise<VolunteerProfile>;
  abstract updateMe(patch: ProfilePatch): Promise<VolunteerProfile>;
  abstract getProfileById(id: string): Promise<VolunteerProfile | null>;
  abstract recommendations(profileId?: string): Promise<readonly Recommendation[]>;
  abstract requestRecommendation(payload: RecommendationRequest): Promise<void>;
}
