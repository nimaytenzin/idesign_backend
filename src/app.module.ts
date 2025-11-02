import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProductCategoryModule } from './modules/product-category/product-category.module';
import { ProductSubCategoryModule } from './modules/product-sub-category/product-sub-category.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST_DEVELOPMENT || 'localhost',
      port: parseInt(process.env.DB_PORT_DEVELOPMENT) || 3306,
      username: process.env.DB_USER_DEVELOPMENT || 'root',
      password: process.env.DB_PASS_DEVELOPMENT || '',
      database: process.env.DB_NAME_DEVELOPMENT || 'idesign',
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    ProductCategoryModule,
    ProductSubCategoryModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
