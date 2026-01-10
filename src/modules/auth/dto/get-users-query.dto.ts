import { IsOptional, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/dto/pagination-query.dto';
import { UserRole } from '../entities/user.entity';

/**
 * DTO for querying users with pagination and role filter
 * Admin Only endpoint
 */
export class GetUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
