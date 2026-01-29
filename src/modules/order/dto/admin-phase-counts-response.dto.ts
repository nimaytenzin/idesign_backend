/**
 * Response for GET /orders/admin/counts.
 * Phase counts for admin tab badges: Pending Action, In Progress, Collection Gap, Completed.
 */
export class AdminPhaseCountsResponseDto {
  pendingAction: number;
  inProgress: number;
  collectionGap: number;
  completed: number;
}
