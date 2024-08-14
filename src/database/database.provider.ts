import { databaseConfig } from './database.config';
import { Sequelize } from 'sequelize-typescript';
import {
  DEVELOPMENT,
  PRODUCTION,
  SEQUELIZE,
  TEST,
} from 'src/constants/constants';
import { BuildingsGeom } from 'src/modules/buildings-geom/entities/buildings-geom.entity';

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;
      //console.log('LOADING ENVIRONMENT VARIABLE');
      //console.log(process.env.NODE_ENV);
      //console.log(databaseConfig.development);
      switch (process.env.NODE_ENV) {
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
      const sequelize = new Sequelize(config);
      sequelize.addModels([
        BuildingsGeom
      ]);

      await sequelize.sync();
      return sequelize;
    },
  },
];
