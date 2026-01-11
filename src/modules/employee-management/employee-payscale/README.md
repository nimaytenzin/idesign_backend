# Employee Payscale Module Documentation

## Entity

### EmployeePayscale

Static salary template entity with one-to-one relationship to User.

**Fields:**
- `id` (UUID, Primary Key) - Auto-generated UUID identifier
- `userId` (INTEGER, Foreign Key, UNIQUE) - Reference to User entity
- `basicSalary` (DECIMAL 15,2) - Base salary amount
- `benefitsAllowance` (DECIMAL 15,2) - Additional benefits and allowances
- `salaryArrear` (DECIMAL 15,2, default: 0.00) - Backdated salary payments
- `grossSalary` (DECIMAL 15,2) - Total salary before deductions
- `pfDeduction` (DECIMAL 15,2) - Employee provident fund contribution
- `gisDeduction` (DECIMAL 15,2) - Group insurance scheme contribution
- `netSalary` (DECIMAL 15,2) - Salary after deductions (Gross - PF - GIS)
- `tds` (DECIMAL 15,2) - Tax deducted at source on net salary
- `healthContribution` (DECIMAL 15,2) - Health insurance contribution
- `totalPayout` (DECIMAL 15,2) - Final amount after all calculations
- `updatedAt` (TIMESTAMP) - Timestamp of last update

**Relationships:**
- `BelongsTo` User - One-to-one relationship with User entity

**Constraints:**
- Unique constraint on `userId` (one payscale per user)

## DTOs

### CreateEmployeePayscaleDto

**Fields:**
- `userId` (number, required) - User ID reference
- `basicSalary` (number, required, min: 0, maxDecimalPlaces: 2)
- `benefitsAllowance` (number, required, min: 0, maxDecimalPlaces: 2)
- `salaryArrear` (number, optional, min: 0, maxDecimalPlaces: 2)
- `grossSalary` (number, required, min: 0, maxDecimalPlaces: 2)
- `pfDeduction` (number, required, min: 0, maxDecimalPlaces: 2)
- `gisDeduction` (number, required, min: 0, maxDecimalPlaces: 2)
- `netSalary` (number, required, min: 0, maxDecimalPlaces: 2)
- `tds` (number, required, min: 0, maxDecimalPlaces: 2)
- `healthContribution` (number, required, min: 0, maxDecimalPlaces: 2)
- `totalPayout` (number, required, min: 0, maxDecimalPlaces: 2)

### UpdateEmployeePayscaleDto

Extends `PartialType(CreateEmployeePayscaleDto)` - All fields optional.

### EmployeePayscaleResponseDto

**Fields:**
- `id` (string) - UUID identifier
- `userId` (number) - User ID reference
- `basicSalary` (number)
- `benefitsAllowance` (number)
- `salaryArrear` (number)
- `grossSalary` (number)
- `pfDeduction` (number)
- `gisDeduction` (number)
- `netSalary` (number)
- `tds` (number)
- `healthContribution` (number)
- `totalPayout` (number)
- `updatedAt` (Date)
- `user` (optional object) - User information with `id`, `name`, `emailAddress`

## Routes

### POST `/employee-payscale`
- **Description:** Create a new payscale for a user
- **Access:** ADMIN only
- **Authentication:** JWT required
- **Request Body:** `CreateEmployeePayscaleDto`
- **Response:** Created payscale entity
- **Validation:** Validates user exists and payscale doesn't already exist for user

### GET `/employee-payscale/user/:userId`
- **Description:** Get payscale by user ID
- **Access:** ADMIN, STAFF
- **Authentication:** JWT required
- **Path Parameters:** `userId` (string) - User ID
- **Response:** Payscale entity with user information
- **Errors:** 404 if payscale not found

### PATCH `/employee-payscale/user/:userId`
- **Description:** Update payscale for a user
- **Access:** ADMIN only
- **Authentication:** JWT required
- **Path Parameters:** `userId` (string) - User ID
- **Request Body:** `UpdateEmployeePayscaleDto` (partial fields)
- **Response:** Updated payscale entity with user information
- **Errors:** 404 if payscale not found
