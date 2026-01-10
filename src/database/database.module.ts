import { databaseProviders } from './database.provider';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseSeedService } from './database-seed.service';
import { User } from '../modules/auth/entities/user.entity';
import { databaseConfig } from './database.config';
import { DEVELOPMENT, PRODUCTION, TEST } from '../constants/constants';

// Get database config based on environment
function getDatabaseConfig() {
  const env = process.env.NODE_ENV || DEVELOPMENT;
  let config;

  switch (env) {
    case DEVELOPMENT:
      config = databaseConfig.development;
      break;
    case TEST:
      config = databaseConfig.test;
      break;
    case PRODUCTION:
      config = databaseConfig.production;
      break;
    default:
      config = databaseConfig.development;
  }

  // Remove password field if it's empty or undefined
  const sequelizeConfig: any = {
    dialect: (config.dialect as any) || 'mysql',
    host: config.host || 'localhost',
    port: config.port ? parseInt(String(config.port)) : 3306,
    username: config.username || 'root',
    database: config.database || 'idesign',
    autoLoadModels: true,
    synchronize: true,
    logging: config.logging !== undefined ? config.logging : false,
  };

  // Only include password if it's not empty
  if (config.password && config.password.trim() !== '') {
    sequelizeConfig.password = config.password;
  }

  return sequelizeConfig;
}

@Module({
  imports: [
    SequelizeModule.forRoot(getDatabaseConfig()),
  ],
  providers: [
    ...databaseProviders,
    {
      provide: 'USER_REPOSITORY',
      useValue: User,
    },
    DatabaseSeedService,
  ],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
