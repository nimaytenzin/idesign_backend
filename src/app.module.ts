import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { databaseConfig } from './database/database.config';
import { DEVELOPMENT, PRODUCTION, TEST } from './constants/constants';
import { AuthModule } from './modules/auth/auth.module';
import { ProductCategoryModule } from './modules/product-category/product-category.module';
import { ProductSubCategoryModule } from './modules/product-sub-category/product-sub-category.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SmsModule } from './modules/external/sms/sms.module';
import { PaymentSettlementModule } from './modules/external/payment-settlement/payment-settlement.module';
import { CompanyModule } from './modules/company/company-profile/company.module';
import { ChartOfAccountsModule } from './modules/accounts/chart-of-accounts/chart-of-accounts.module';
import { TransactionModule } from './modules/accounts/transaction/transaction.module';
import { ExpenseModule } from './modules/accounts/expense/expense.module';
import { HeroSlideModule } from './modules/hero-slide/hero-slide.module';
import { LeaveManagementModule } from './modules/leave-management/leave-management.module';
import { CompanyClientModule } from './modules/company/company-client/company-client.module';
import { CompanyServiceModule } from './modules/company/company-service/company-service.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DiscountModule } from './modules/discount/discount.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { EmployeeManagementModule } from './modules/employee-management/employee-management.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { TodoModule } from './modules/todo/todo.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { DocumentSubCategoryModule } from './modules/document/document-sub-category/document-sub-category.module';
import { DocumentCategoryModule } from './modules/document/document-category/document-category.module';
import { DocumentModule } from './modules/document/document/document.module';

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

  console.log('App Module - NODE_ENV:', process.env.NODE_ENV);
  console.log('App Module - Using database config:', {
    host: config.host,
    database: config.database,
    username: config.username,
  });

  return {
    dialect: (config.dialect as any) || 'mysql',
    host: config.host || 'localhost',
    port: config.port ? parseInt(String(config.port)) : 3306,
    username: config.username || 'root',
    password: config.password || 'secret',
    database: config.database || 'idesign',
    autoLoadModels: true,
    synchronize: true,
    logging: config.logging !== undefined ? config.logging : false,
  };
}

@Module({
  imports: [
    SequelizeModule.forRoot(getDatabaseConfig()),
    DatabaseModule,
    AuthModule,
    ProductCategoryModule,
    ProductSubCategoryModule,
    ProductModule,
    OrderModule,
    ChartOfAccountsModule,
    TransactionModule,
    ExpenseModule,
    AccountsModule,
    PaymentSettlementModule,
    CompanyModule,
    CompanyClientModule,
    CompanyServiceModule,
    HeroSlideModule,
    LeaveManagementModule,
    SmsModule,
    AnalyticsModule,
    CustomerModule,
    DiscountModule,
    OutboxModule,
    EmployeeManagementModule,
    CalendarModule,
    TodoModule,
    AffiliateModule,
    DocumentCategoryModule,
    DocumentSubCategoryModule,
    DocumentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
