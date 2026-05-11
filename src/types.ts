export interface UserProfile {
  uid: string;
  name: string;
  emojiAvatar: string;
  age: number;
  gradeLevel?: 'CP' | 'CM1' | '1ère Année Collège';
  totalScore: number;
  gamesPlayed: {
    detective: number;
    market: number;
    butterfly?: number;
    train?: number;
    balance?: number;
    polyglot?: number;
    clock?: number;
    bubble?: number;
    maze?: number;
  };
  timePlayedMinutes: number;
}
