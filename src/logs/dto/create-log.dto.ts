export interface CreateLogDto {
  userId: string;
  action: string;
  ip?: string;
  performedBy?: string | null;
}
