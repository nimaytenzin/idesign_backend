import { databaseConfig } from './database.config';
import { Sequelize } from 'sequelize-typescript';
import {
  DEVELOPMENT,
  PRODUCTION,
  SEQUELIZE,
  TEST,
} from 'src/constants/constants';
import { User } from 'src/modules/auth/entities/user.entity';
import { ProductCategory } from 'src/modules/product-category/entities/product-category.entity';
import { ProductSubCategory } from 'src/modules/product-sub-category/entities/product-sub-category.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { ProductImage } from 'src/modules/product/entities/product-image.entity';

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;

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
      console.log('Database Config:', config);
      const sequelize = new Sequelize(config);
      sequelize.addModels([
        User,
        ProductCategory,
        ProductSubCategory,
        Product,
        ProductImage,
      ]);

      await sequelize.sync();
      return sequelize;
    },
  },
];
