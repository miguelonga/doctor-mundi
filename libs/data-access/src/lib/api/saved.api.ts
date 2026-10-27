export abstract class SavedApi {
  abstract listSavedIds(): Promise<readonly string[]>;
  abstract toggleSaved(missionId: string): Promise<boolean>;
  abstract isSaved(missionId: string): Promise<boolean>;
}
