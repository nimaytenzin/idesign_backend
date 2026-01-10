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
import { Order } from 'src/modules/order/entities/order.entity';
import { ChartOfAccounts } from 'src/modules/accounts/chart-of-accounts/entities/chart-of-accounts.entity';
import { Transaction } from 'src/modules/accounts/transaction/entities/transaction.entity';
import { Expense } from 'src/modules/accounts/expense/entities/expense.entity';
import { Company } from 'src/modules/company/company-profile/entities/company.entity';
import { Customer } from 'src/modules/customer/entities/customer.entity';
import { SmsTemplate } from 'src/modules/sms-template/entities/sms-template.entity';
import { Discount } from 'src/modules/discount/entities/discount.entity';
import { DiscountProduct } from 'src/modules/discount/entities/discount-product.entity';
import { DiscountCategory } from 'src/modules/discount/entities/discount-category.entity';
import { DiscountSubcategory } from 'src/modules/discount/entities/discount-subcategory.entity';
import { OrderItem } from 'src/modules/order/entities/order-item.entity';
import { OrderDiscount } from 'src/modules/order/entities/order-discount.entity';
import { Outbox } from 'src/modules/outbox/entities/outbox.entity';
import { Event } from 'src/modules/calendar/entities/event.entity';
import { EventType } from 'src/modules/calendar/entities/event-type.entity';
import { EventCategory } from 'src/modules/calendar/entities/event-category.entity';
import { EmployeeProfile } from 'src/modules/employee-management/employee-profile/entities/employee-profile.entity';
import { EmployeeEducation } from 'src/modules/employee-management/employee-education/entities/employee-education.entity';
import { EmployeeWorkExperience } from 'src/modules/employee-management/employee-work-experience/entities/employee-work-experience.entity';
import { AffiliateCommission } from 'src/modules/affiliate-marketer-management/affiliate-commission/entities/affiliate-commission.entity';
import { DocumentCategory } from 'src/modules/document/document-category/entities/document-category.entity';
import { DocumentSubCategory } from 'src/modules/document/document-sub-category/entities/document-sub-category.entity';
import { Document } from 'src/modules/document/document/entities/document.entity';
import { DeliveryRate } from 'src/modules/delivery/delivery-rate/entities/delivery-rate.entity';
import { DeliveryLocation } from 'src/modules/delivery/delivery-location/entities/delivery-location.entity';
import { AffiliateProfile } from 'src/modules/affiliate-marketer-management/affiliate-profile/entities/affiliate-profile.entity';

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;
      console.log('NODE_ENV:', process.env.NODE_ENV);  
      console.log('PRODUCTION constant:', PRODUCTION);

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
      
      // Remove password field if it's empty or undefined to avoid authentication issues
      const sequelizeConfig: any = {
        ...config,
        dialect: (config.dialect || 'mysql') as any,
      };
      
      // If password is undefined, empty string, null, or only whitespace, don't include it in the config
      // This prevents Sequelize from trying to authenticate with an empty password
      if (!config.password || (typeof config.password === 'string' && config.password.trim() === '')) {
        delete sequelizeConfig.password;
      }
      
      const sequelize = new Sequelize(sequelizeConfig);
      sequelize.addModels([
        User,
        EmployeeProfile,
        EmployeeEducation,
        EmployeeWorkExperience,

        AffiliateProfile,
        AffiliateCommission,
        ProductCategory,
        ProductSubCategory,
        Product,
        ProductImage,
        Order,
        OrderItem,
        OrderDiscount,
        Customer,
         Outbox,
        ChartOfAccounts,
        Transaction,
        Expense,
        Company,
        SmsTemplate,
        Discount,
        DiscountProduct,
        DiscountCategory,
        DiscountSubcategory,
        Event,
        EventType,
        EventCategory,
       
        DocumentCategory,
        DocumentSubCategory,
        Document,
        DeliveryRate,
        DeliveryLocation,
      ]);

      await sequelize.sync();
      return sequelize;
    },
  },
];
