# Company Profile API Documentation

## Create Company Profile

### Endpoint
```
POST /company
```

### Request Headers
```
Content-Type: application/json
```

### Request Body

The request body should be a JSON object with the following structure:

#### Required Fields
- `name` (string, required): Company name

#### Optional Fields
- `phone1` (string, optional): Primary phone number
- `phone2` (string, optional): Secondary phone number
- `phone3` (string, optional): Tertiary phone number
- `email` (string, optional): Email address (must be valid email format)
- `address` (string, optional): Company address
- `dzongkhag` (string, optional): Dzongkhag name
- `thromde` (string, optional): Thromde name
- `country` (string, optional): Country name (defaults to "Bhutan")
- `website` (string, optional): Website URL (must be valid URL format if provided, cannot be empty string)
- `tpnNumber` (string, optional): TPN number
- `businessLicenseNumber` (string, optional): Business license number
- `slogan` (string, optional): Company slogan
- `facebookLink` (string, optional): Facebook page URL (must be valid URL format if provided, cannot be empty string)
- `tiktokLink` (string, optional): TikTok profile URL (must be valid URL format if provided, cannot be empty string)
- `description` (string, optional): Company description
- `logo` (string, optional): Logo file path or URL
- `isActive` (boolean, optional): Whether the company is active (defaults to `true`)
- `zpssBankName` (enum, optional): Bank name for ZPSS account. Valid values:
  - `BOB` - Bank of Bhutan
  - `BNB` - Bhutan National Bank
  - `PNB` - Punjab National Bank
  - `BDBL` - Bhutan Development Bank Limited
  - `TBANK` - T-Bank
  - `DKBANK` - Druk Khan Bank
- `zpssAccountName` (string, optional): Account holder name for ZPSS account
- `zpssAccountNumber` (string, optional): Account number for ZPSS account

### Validation Rules

1. **Email Validation**: If `email` is provided, it must be a valid email format
2. **URL Validation**: If `website`, `facebookLink`, or `tiktokLink` are provided, they must be valid URLs. **Important**: Do not send empty strings (`""`) for URL fields. Either omit the field entirely or provide a valid URL.
3. **Enum Validation**: `zpssBankName` must be one of the valid enum values listed above

### Example Request (Success)

```json
{
  "name": "Ministry of Infrastructure and Transport",
  "phone1": "+975-2-123456",
  "phone2": "",
  "phone3": "",
  "email": "info@idesign.bt",
  "address": "194 Chang Lam SE, Thimphu, Department of Human Settlement, Ministry of Infrastructure and Transport.",
  "dzongkhag": "Thimphu",
  "thromde": "Thimphu Thromde",
  "country": "Bhutan",
  "tpnNumber": "2123123",
  "businessLicenseNumber": "312323",
  "slogan": "Ministry of Infrastructure and Transport",
  "description": "Ministry of Infrastructure and Transport",
  "isActive": true,
  "zpssBankName": "BOB",
  "zpssAccountName": "Nima",
  "zpssAccountNumber": "101273372"
}
```

### Example Request (With URLs)

```json
{
  "name": "Ministry of Infrastructure and Transport",
  "email": "info@idesign.bt",
  "address": "194 Chang Lam SE, Thimphu",
  "dzongkhag": "Thimphu",
  "thromde": "Thimphu Thromde",
  "country": "Bhutan",
  "website": "https://www.idesign.bt",
  "facebookLink": "https://www.facebook.com/idesign",
  "tiktokLink": "https://www.tiktok.com/@idesign",
  "tpnNumber": "2123123",
  "businessLicenseNumber": "312323",
  "slogan": "Ministry of Infrastructure and Transport",
  "description": "Ministry of Infrastructure and Transport",
  "isActive": true,
  "zpssBankName": "BOB",
  "zpssAccountName": "Nima",
  "zpssAccountNumber": "101273372"
}
```

### Example Request (Minimal - Only Required Fields)

```json
{
  "name": "Ministry of Infrastructure and Transport"
}
```

### Common Errors

#### Error: Invalid URL Format
**Problem**: Sending empty strings (`""`) for URL fields (`website`, `facebookLink`, `tiktokLink`)

**Solution**: Either omit the field entirely or provide a valid URL. Do not send empty strings.

**Incorrect**:
```json
{
  "name": "Company Name",
  "website": "",
  "facebookLink": "",
  "tiktokLink": ""
}
```

**Correct** (Option 1 - Omit fields):
```json
{
  "name": "Company Name"
}
```

**Correct** (Option 2 - Provide valid URLs):
```json
{
  "name": "Company Name",
  "website": "https://www.example.com",
  "facebookLink": "https://www.facebook.com/example",
  "tiktokLink": "https://www.tiktok.com/@example"
}
```

#### Error: Invalid Email Format
**Problem**: Email field contains invalid email format

**Solution**: Ensure email follows standard email format (e.g., `user@domain.com`)

#### Error: Invalid Enum Value
**Problem**: `zpssBankName` contains a value not in the allowed enum

**Solution**: Use one of the valid enum values: `BOB`, `BNB`, `PNB`, `BDBL`, `TBANK`, `DKBANK`

### Response

#### Success Response (201 Created)
```json
{
  "id": 1,
  "name": "Ministry of Infrastructure and Transport",
  "phone1": "+975-2-123456",
  "phone2": null,
  "phone3": null,
  "email": "info@idesign.bt",
  "address": "194 Chang Lam SE, Thimphu, Department of Human Settlement, Ministry of Infrastructure and Transport.",
  "dzongkhag": "Thimphu",
  "thromde": "Thimphu Thromde",
  "country": "Bhutan",
  "website": null,
  "tpnNumber": "2123123",
  "businessLicenseNumber": "312323",
  "slogan": "Ministry of Infrastructure and Transport",
  "facebookLink": null,
  "tiktokLink": null,
  "description": "Ministry of Infrastructure and Transport",
  "logo": null,
  "isActive": true,
  "zpssBankName": "BOB",
  "zpssAccountName": "Nima",
  "zpssAccountNumber": "101273372",
  "createdAt": "2026-01-08T02:30:00.000Z",
  "updatedAt": "2026-01-08T02:30:00.000Z"
}
```

#### Error Response (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": [
    "website must be a URL address",
    "facebookLink must be a URL address"
  ],
  "error": "Bad Request"
}
```

### Notes

1. **URL Fields**: The DTO uses `@IsUrl()` validator for `website`, `facebookLink`, and `tiktokLink`. This means:
   - Empty strings (`""`) will fail validation
   - If you don't want to provide a URL, omit the field entirely (don't include it in the JSON)
   - If you provide a value, it must be a valid URL format

2. **Email Field**: Uses `@IsEmail()` validator, so if provided, it must be a valid email format

3. **Default Values**:
   - `country` defaults to `"Bhutan"` if not provided
   - `isActive` defaults to `true` if not provided

4. **Field Types**:
   - String fields can be empty strings (`""`) except for URL fields
   - Boolean fields should be `true` or `false`
   - Enum fields must match exactly one of the allowed values

5. **Singleton Pattern**: Only one company profile can exist in the system. If a company profile already exists, you must use the update endpoint instead of create.

---

## Update Company Profile

### Endpoint
```
PATCH /company
```

### Request Headers
```
Content-Type: application/json
```

### Request Body

All fields are **optional** for update. Only include the fields you want to update.

#### Available Fields (All Optional)
- `name` (string, optional): Company name
- `phone1` (string, optional): Primary phone number
- `phone2` (string, optional): Secondary phone number
- `phone3` (string, optional): Tertiary phone number
- `email` (string, optional): Email address (must be valid email format)
- `address` (string, optional): Company address
- `dzongkhag` (string, optional): Dzongkhag name
- `thromde` (string, optional): Thromde name
- `country` (string, optional): Country name
- `website` (string, optional): Website URL (must be valid URL format if provided, cannot be empty string)
- `tpnNumber` (string, optional): TPN number
- `businessLicenseNumber` (string, optional): Business license number
- `slogan` (string, optional): Company slogan
- `facebookLink` (string, optional): Facebook page URL (must be valid URL format if provided, cannot be empty string)
- `tiktokLink` (string, optional): TikTok profile URL (must be valid URL format if provided, cannot be empty string)
- `description` (string, optional): Company description
- `logo` (string, optional): Logo file path or URL
- `isActive` (boolean, optional): Whether the company is active
- `zpssBankName` (enum, optional): Bank name for ZPSS account. Valid values:
  - `BOB` - Bank of Bhutan
  - `BNB` - Bhutan National Bank
  - `PNB` - Punjab National Bank
  - `BDBL` - Bhutan Development Bank Limited
  - `TBANK` - T-Bank
  - `DKBANK` - Druk Khan Bank
- `zpssAccountName` (string, optional): Account holder name for ZPSS account
- `zpssAccountNumber` (string, optional): Account number for ZPSS account

### Validation Rules

Same validation rules apply as in Create endpoint:
1. **Email Validation**: If `email` is provided, it must be a valid email format
2. **URL Validation**: If `website`, `facebookLink`, or `tiktokLink` are provided, they must be valid URLs. **Important**: Do not send empty strings (`""`) for URL fields. Either omit the field entirely or provide a valid URL.
3. **Enum Validation**: `zpssBankName` must be one of the valid enum values listed above

### Example Request (Update Single Field)

```json
{
  "email": "newemail@idesign.bt"
}
```

### Example Request (Update Multiple Fields)

```json
{
  "name": "Updated Company Name",
  "phone1": "+975-2-999999",
  "email": "updated@idesign.bt",
  "address": "New Address, Thimphu",
  "isActive": false
}
```

### Example Request (Update URLs)

```json
{
  "website": "https://www.newwebsite.com",
  "facebookLink": "https://www.facebook.com/newpage",
  "tiktokLink": "https://www.tiktok.com/@newaccount"
}
```

### Example Request (Update ZPSS Account Details)

```json
{
  "zpssBankName": "BNB",
  "zpssAccountName": "Updated Account Name",
  "zpssAccountNumber": "999999999"
}
```

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Updated Company Name",
  "phone1": "+975-2-999999",
  "phone2": null,
  "phone3": null,
  "email": "updated@idesign.bt",
  "address": "New Address, Thimphu",
  "dzongkhag": "Thimphu",
  "thromde": "Thimphu Thromde",
  "country": "Bhutan",
  "website": null,
  "tpnNumber": "2123123",
  "businessLicenseNumber": "312323",
  "slogan": "Ministry of Infrastructure and Transport",
  "facebookLink": null,
  "tiktokLink": null,
  "description": "Ministry of Infrastructure and Transport",
  "logo": null,
  "isActive": false,
  "zpssBankName": "BOB",
  "zpssAccountName": "Nima",
  "zpssAccountNumber": "101273372",
  "createdAt": "2026-01-08T02:30:00.000Z",
  "updatedAt": "2026-01-08T03:00:00.000Z"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Company details not found",
  "error": "Not Found"
}
```

#### Error Response (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "website must be a URL address"
  ],
  "error": "Bad Request"
}
```

### Notes

1. **Partial Updates**: You can update any combination of fields. Only the fields you include in the request body will be updated.

2. **URL Fields**: Same rules apply as Create endpoint - do not send empty strings for URL fields.

3. **Existing Company Required**: A company profile must exist before you can update it. If no company exists, you'll receive a 404 error.

---

## Delete Company Profile

### Endpoint
```
DELETE /company
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
No request body required.

### Description
Deletes the company profile from the system. This is a permanent deletion.

**Note**: Only one company profile exists in the system (singleton pattern). Deleting it will remove all company information.

### Response

#### Success Response (204 No Content)
No response body. The HTTP status code `204` indicates successful deletion.

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Company details not found",
  "error": "Not Found"
}
```

### Example Usage

#### cURL
```bash
curl -X DELETE http://localhost:3000/company
```

#### JavaScript (Fetch)
```javascript
fetch('http://localhost:3000/company', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(response => {
    if (response.status === 204) {
      console.log('Company profile deleted successfully');
    } else if (response.status === 404) {
      console.log('Company profile not found');
    }
  });
```

### Notes

1. **Permanent Deletion**: This operation cannot be undone. All company data will be permanently removed.

2. **Singleton Pattern**: Since only one company profile exists, deleting it means you'll need to create a new one using the POST endpoint if needed.

3. **No Request Body**: The DELETE endpoint does not require any request body.

---

## Get Company Profile

### Endpoint
```
GET /company
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
No request body required.

### Description
Retrieves the active company profile. Returns the company that has `isActive: true`.

### Response

#### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "Ministry of Infrastructure and Transport",
  "phone1": "+975-2-123456",
  "phone2": null,
  "phone3": null,
  "email": "info@idesign.bt",
  "address": "194 Chang Lam SE, Thimphu",
  "dzongkhag": "Thimphu",
  "thromde": "Thimphu Thromde",
  "country": "Bhutan",
  "website": null,
  "tpnNumber": "2123123",
  "businessLicenseNumber": "312323",
  "slogan": "Ministry of Infrastructure and Transport",
  "facebookLink": null,
  "tiktokLink": null,
  "description": "Ministry of Infrastructure and Transport",
  "logo": null,
  "isActive": true,
  "zpssBankName": "BOB",
  "zpssAccountName": "Nima",
  "zpssAccountNumber": "101273372",
  "createdAt": "2026-01-08T02:30:00.000Z",
  "updatedAt": "2026-01-08T02:30:00.000Z"
}
```

#### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Company details not found",
  "error": "Not Found"
}
```

---

## Get All Company Profiles

### Endpoint
```
GET /company/all
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
No request body required.

### Description
Retrieves all company profiles (including inactive ones), ordered by creation date (newest first).

### Response

#### Success Response (200 OK)
```json
[
  {
    "id": 1,
    "name": "Ministry of Infrastructure and Transport",
    "phone1": "+975-2-123456",
    "phone2": null,
    "phone3": null,
    "email": "info@idesign.bt",
    "address": "194 Chang Lam SE, Thimphu",
    "dzongkhag": "Thimphu",
    "thromde": "Thimphu Thromde",
    "country": "Bhutan",
    "website": null,
    "tpnNumber": "2123123",
    "businessLicenseNumber": "312323",
    "slogan": "Ministry of Infrastructure and Transport",
    "facebookLink": null,
    "tiktokLink": null,
    "description": "Ministry of Infrastructure and Transport",
    "logo": null,
    "isActive": true,
    "zpssBankName": "BOB",
    "zpssAccountName": "Nima",
    "zpssAccountNumber": "101273372",
    "createdAt": "2026-01-08T02:30:00.000Z",
    "updatedAt": "2026-01-08T02:30:00.000Z"
  }
]
```

### Notes

1. **Returns Array**: This endpoint returns an array of company profiles, even though typically only one exists.

2. **Includes Inactive**: Unlike `GET /company`, this endpoint returns all profiles regardless of `isActive` status.

---

## Summary

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| POST | `/company` | Create company profile | 201 Created, 400 Bad Request |
| GET | `/company` | Get active company profile | 200 OK, 404 Not Found |
| GET | `/company/all` | Get all company profiles | 200 OK |
| PATCH | `/company` | Update company profile | 200 OK, 400 Bad Request, 404 Not Found |
| DELETE | `/company` | Delete company profile | 204 No Content, 404 Not Found |

