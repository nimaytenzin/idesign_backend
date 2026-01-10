import { Module, Global } from '@nestjs/common';
import { PaginationService } from './pagination.service';

/**
 * Global pagination module
 * Provides pagination service and DTOs to all modules
 */
@Global()
@Module({
  providers: [PaginationService],
  exports: [PaginationService],
})
export class PaginationModule {}
