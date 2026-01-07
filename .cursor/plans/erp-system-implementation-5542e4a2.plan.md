<!-- 5542e4a2-1cb8-4627-aaf2-5f5eadf668fd 5bb42880-f24b-4f93-bc84-a5e67abf7f90 -->
# ERP System Implementation Plan

## Overview

Create a comprehensive ERP system with HR and Finance modules, following the existing NestJS + Sequelize + MySQL architecture. The system will integrate with the existing product module for inventory and order management.

## Module Structure

### HR Management Module (`src/modules/hr/`)

**Leave Management:**

- `entities/leave-request.entity.ts` - Leave requests (annual, sick, casual, unpaid)
- `entities/leave-balance.entity.ts` - Employee leave balances
- `dto/` - Create/update leave DTOs, leave query DTOs
- `hr.controller.ts` - Leave CRUD, approval workflows
- `hr.service.ts` - Leave business logic, balance calculations
- `hr.module.ts`

**Payroll Management:**

- `entities/employee.entity.ts` - Employee details (extends/linked to User)
- `entities/payroll.entity.ts` - Payroll records (salary, deductions, allowances)
- `entities/salary-structure.entity.ts` - Employee salary configurations
- `dto/` - Payroll generation, salary structure DTOs
- Payroll calculation service methods
- Payroll generation endpoints

### Finance Management Module (`src/modules/finance/`)

**Accounting:**

- `entities/account.entity.ts` - Chart of accounts (assets, liabilities, equity, revenue, expenses)
- `entities/journal-entry.entity.ts` - Double-entry bookkeeping
- `entities/transaction.entity.ts` - Financial transactions
- `dto/` - Journal entry, transaction DTOs
- `finance.controller.ts` - Accounting endpoints
- `finance.service.ts` - Accounting logic, balance calculations

**Sales & Orders:**

- `entities/order.entity.ts` - Customer orders (references Product)
- `entities/order-item.entity.ts` - Order line items
- `entities/customer.entity.ts` - Customer master data
- `dto/` - Order creation, order status update DTOs
- Order processing, status management

**Invoicing:**

- `entities/invoice.entity.ts` - Invoices (linked to orders)
- `entities/invoice-item.entity.ts` - Invoice line items
- `dto/` - Invoice generation DTOs
- Invoice generation, PDF export (optional)

**Inventory/Stock:**

- `entities/stock-movement.entity.ts` - Stock in/out transactions
- `entities/warehouse.entity.ts` - Warehouse locations
- Integration with existing `Product` entity for stock balance
- Stock balance calculation, low stock alerts

**Financial Reports:**

- `entities/balance-sheet.entity.ts` or service methods for balance sheet generation
- `entities/income-statement.entity.ts` or service methods for P&L
- Report generation endpoints (balance statement, income statement, cash flow)

## Implementation Details

### Database Relationships

- Employee extends/links to User entity
- Orders reference Products (foreign key)
- Invoices reference Orders
- Journal entries reference Accounts
- Stock movements reference Products and Warehouses

### Key Features

1. **Leave Management**: Request, approve/reject, balance tracking, leave types
2. **Payroll**: Salary calculation, deductions (tax, insurance), allowances, payroll history
3. **Accounting**: Chart of accounts, double-entry bookkeeping, trial balance
4. **Sales**: Order creation, order status workflow, customer management
5. **Invoicing**: Generate invoices from orders, invoice status, payment tracking
6. **Inventory**: Stock movements, warehouse management, stock balance reconciliation
7. **Reports**: Balance sheet, income statement, financial summaries

### Integration Points

- Link Employee entity to User (one-to-one or extend User)
- Orders reference existing Product entities
- Stock movements update Product.stockQuantity
- Financial transactions integrate with accounting module

### Security & Authorization

- Extend existing UserRole enum or add ERP-specific roles
- Role-based access control for HR and Finance modules
- Use existing JWT guards and role decorators

## Files to Create

### HR Module (~15 files)

- `src/modules/hr/entities/employee.entity.ts`
- `src/modules/hr/entities/leave-request.entity.ts`
- `src/modules/hr/entities/leave-balance.entity.ts`
- `src/modules/hr/entities/payroll.entity.ts`
- `src/modules/hr/entities/salary-structure.entity.ts`
- `src/modules/hr/dto/` (8-10 DTO files)
- `src/modules/hr/hr.controller.ts`
- `src/modules/hr/hr.service.ts`
- `src/modules/hr/hr.module.ts`

### Finance Module (~25 files)

- `src/modules/finance/entities/account.entity.ts`
- `src/modules/finance/entities/journal-entry.entity.ts`
- `src/modules/finance/entities/transaction.entity.ts`
- `src/modules/finance/entities/order.entity.ts`
- `src/modules/finance/entities/order-item.entity.ts`
- `src/modules/finance/entities/customer.entity.ts`
- `src/modules/finance/entities/invoice.entity.ts`
- `src/modules/finance/entities/invoice-item.entity.ts`
- `src/modules/finance/entities/stock-movement.entity.ts`
- `src/modules/finance/entities/warehouse.entity.ts`
- `src/modules/finance/dto/` (12-15 DTO files)
- `src/modules/finance/finance.controller.ts`
- `src/modules/finance/finance.service.ts`
- `src/modules/finance/finance.module.ts`

### Updates

- `src/app.module.ts` - Register HR and Finance modules
- `src/modules/auth/entities/user.entity.ts` - Add employee relationship (if needed)

## Technical Considerations

- Follow existing Sequelize patterns (decorators, relationships)
- Use existing DTO validation patterns (class-validator)
- Maintain consistency with existing module structure
- Add proper error handling and validation
- Consider transaction management for financial operations

### To-dos

- [ ] Create HR module entities: Employee, LeaveRequest, LeaveBalance, Payroll, SalaryStructure
- [ ] Create HR module DTOs for leave management and payroll operations
- [ ] Implement HR service with leave management and payroll calculation logic
- [ ] Create HR controller with endpoints for leave requests, approvals, and payroll
- [ ] Create HR module and register in app.module.ts
- [ ] Create Finance module entities: Account, JournalEntry, Transaction, Order, OrderItem, Customer, Invoice, InvoiceItem, StockMovement, Warehouse
- [ ] Create Finance module DTOs for accounting, orders, invoicing, and inventory operations
- [ ] Implement Finance service with accounting, order processing, invoicing, and inventory management logic
- [ ] Create Finance controller with endpoints for accounting, sales, invoicing, inventory, and reports
- [ ] Create Finance module and register in app.module.ts
- [ ] Integrate Finance module with existing Product entity for inventory and orders
- [ ] Link Employee entity to User entity and extend role system if needed