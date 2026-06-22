export interface Report {
  id: string;
  title: string;
  type: string;
  month: string;
  year: number;
  author: string;
  authorInitials: string;
  commentCount: number;
  coverImage: string;
  isPublished: boolean;
  hasInconsistencies?: boolean;
}
