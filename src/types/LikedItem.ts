// src/types/LikedItem.ts
export type LikedItem = {
  id: string;
  title: string;
  img: string;
  location?: string;
  category?: string;
  isSeasonal?: boolean;
  isLocal?: boolean;
  type: 'restaurant' | 'food';
  likeCount?: number;
};
