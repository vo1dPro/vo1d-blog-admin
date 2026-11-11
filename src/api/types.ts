import type { components } from './generated';
type Schemas = components['schemas'];
export type Media = Schemas['MediaResponseDto'];
export type UploadResult = Schemas['MediaUploadResponseDto'] | Schemas['PhotoUploadResponseDto'];
export type Book = Schemas['BookResponseDto'];
export type Game = Schemas['GameResponseDto'];
export type Photo = Schemas['PhotoResponseDto'];
export type Skill = Schemas['SkillResponseDto'];
export type SocialLink = Schemas['SocialLinkResponseDto'];
export type SiteProfile = Schemas['AdminSiteProfileResponseDto'];
export type SteamGame = Schemas['SteamGameDto'];
export type SteamStatus = Schemas['SteamStatusDto'];
export type SteamLinkResult = Schemas['SteamLinkResultDto'];
// Nullable primitive metadata is wrong in the upstream OpenAPI. See docs/contract-notes.md.
export type BookInput = Required<Schemas['CreateBookDto']>;
export type GameInput = Required<Schemas['CreateGameDto']>;
export type PhotoInput = Required<Schemas['CreatePhotoDto']>;
export type SkillInput = Schemas['CreateSkillDto'];
export type SocialInput = Schemas['CreateSocialLinkDto'];
export type SiteInput = Required<Omit<Schemas['UpdateSiteProfileDto'], 'avatarMediaId'>> & {
  avatarMediaId: number | null;
};
