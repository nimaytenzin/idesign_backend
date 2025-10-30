import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CurrentHouseholdListingService } from './current-household-listing.service';
import { CreateCurrentHouseholdListingDto } from './dto/create-current-household-listing.dto';
import { UpdateCurrentHouseholdListingDto } from './dto/update-current-household-listing.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('current-household-listing')
export class CurrentHouseholdListingController {
  constructor(
    private readonly currentHouseholdListingService: CurrentHouseholdListingService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ENUMERATOR)
  async create(
    @Body() createCurrentHouseholdListingDto: CreateCurrentHouseholdListingDto,
  ) {
    return this.currentHouseholdListingService.create(
      createCurrentHouseholdListingDto,
    );
  }

  @Get()
  async findAll(@Query('eaId') eaId?: string) {
    if (eaId) {
      return this.currentHouseholdListingService.findByEnumerationArea(+eaId);
    }
    return this.currentHouseholdListingService.findAll();
  }

  @Get('by-enumeration-area/:eaId')
  async findByEnumerationArea(@Param('eaId') eaId: string) {
    return this.currentHouseholdListingService.findByEnumerationArea(+eaId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.currentHouseholdListingService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.ENUMERATOR)
  async update(
    @Param('id') id: string,
    @Body() updateCurrentHouseholdListingDto: UpdateCurrentHouseholdListingDto,
  ) {
    return this.currentHouseholdListingService.update(
      +id,
      updateCurrentHouseholdListingDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.currentHouseholdListingService.remove(+id);
  }
}
