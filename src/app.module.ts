import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { PaginationModule } from './common/pagination/pagination.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductCategoryModule } from './modules/product-category/product-category.module';
import { ProductSubCategoryModule } from './modules/product-sub-category/product-sub-category.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentReceiptModule } from './modules/payment-receipt/payment-receipt.module';
import { BankAccountModule } from './modules/bank-account/bank-account.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { SmsModule } from './modules/external/sms/sms.module';
import { PaymentSettlementModule } from './modules/external/payment-settlement/payment-settlement.module';
import { CompanyModule } from './modules/company/company-profile/company.module';
import { HeroSlideModule } from './modules/hero-slide/hero-slide.module';
import { LeaveManagementModule } from './modules/leave-management/leave-management.module';
import { CompanyClientModule } from './modules/company/company-client/company-client.module';
import { CompanyServiceModule } from './modules/company/company-service/company-service.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DiscountModule } from './modules/discount/discount.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { TodoModule } from './modules/todo/todo.module';
import { DocumentCategoryModule } from './modules/document/document-category/document-category.module';
import { DocumentSubCategoryModule } from './modules/document/document-sub-category/document-sub-category.module';
import { DocumentModule } from './modules/document/document/document.module';
import { DeliveryLocationModule } from './modules/delivery/delivery-location/delivery-location.module';
import { DeliveryRateModule } from './modules/delivery/delivery-rate/delivery-rate.module';
import { AffiliateProfileModule } from './modules/affiliate-marketer-management/affiliate-profile/affiliate-profile.module';
import { AffiliateCommissionModule } from './modules/affiliate-marketer-management/affiliate-commission/affiliate-commission.module';
import { EmployeeProfileModule } from './modules/employee-management/employee-profile/employee-profile.module';
import { EmployeeWorkExperienceModule } from './modules/employee-management/employee-work-experience/employee-work-experience.module';
import { EmployeeEducationModule } from './modules/employee-management/employee-education/employee-education.module';
import { EmployeePayscaleModule } from './modules/employee-management/employee-payscale/employee-payscale.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { CalendarEventModule } from './modules/calendar/calendar-event/calendar-event.module';

@Module({
  imports: [
    PaginationModule,
    DatabaseModule,
    AuthModule,
    ProductCategoryModule,
    ProductSubCategoryModule,
    ProductModule,
    OrderModule,
    PaymentReceiptModule,
    BankAccountModule,
    ExpenseModule,
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
    TodoModule,
    DocumentCategoryModule,
    DocumentSubCategoryModule,
    DocumentModule,
    DeliveryLocationModule,
    DeliveryRateModule,
    AffiliateProfileModule,
    AffiliateCommissionModule,

    EmployeeProfileModule,
    EmployeeEducationModule,
    EmployeeWorkExperienceModule,
    EmployeePayscaleModule,
    AttendanceModule,

    CalendarEventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
