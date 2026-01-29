# Company Profile – Frontend Guide

## Instagram Link

The Company Profile supports an **Instagram link** (`instagramLink`), in addition to `facebookLink` and `tiktokLink`.

---

## 1. API

### GET `/company`

Returns the active company. Response includes `instagramLink` (or `null`).

```json
{
  "id": 1,
  "name": "...",
  "facebookLink": "https://www.facebook.com/...",
  "instagramLink": "https://www.instagram.com/yourhandle/",
  "tiktokLink": "https://www.tiktok.com/@...",
  ...
}
```

### PATCH `/company`

Updates the company. **Body (all optional):** `UpdateCompanyDto` = partial of `CreateCompanyDto`.  
You can send only the fields you change, including `instagramLink`.

**Example – update only Instagram:**

```http
PATCH /company
Content-Type: application/json

{
  "instagramLink": "https://www.instagram.com/yourhandle/"
}
```

**Example – clear Instagram:**

```json
{
  "instagramLink": null
}
```

---

## 2. `instagramLink` in DTOs

| DTO | Field | Validation | Required |
|-----|--------|------------|----------|
| `CreateCompanyDto` | `instagramLink` | `@IsUrl()` | No (`@IsOptional()`) |
| `UpdateCompanyDto` | `instagramLink` | Same (partial) | No |

- **Format:** Full URL, e.g. `https://www.instagram.com/username/` or `https://instagram.com/username`.
- **Empty:** Omit the field or send `null` to clear.

---

## 3. Frontend UI

### 3.1 Input

- **Type:** `url` or `text`.
- **Placeholder:** `https://www.instagram.com/yourhandle/`
- **Helper:** If the user types only a handle (e.g. `yourhandle`), normalize before submit:

  ```ts
  function toInstagramUrl(value: string): string | null {
    const v = (value || '').trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    const handle = v.replace(/^@/, '').replace(/\/$/, '');
    return `https://www.instagram.com/${handle}/`;
  }
  ```

### 3.2 Form (create / edit)

- **Create:** `instagramLink` is optional; can be left empty.
- **Edit:** Prefill from `GET /company` → `company.instagramLink`. On save, send `PATCH /company` with `{ instagramLink }` (or `{ instagramLink: null }` to clear).

### 3.3 Display

- If `company.instagramLink` is set, show an Instagram icon/link that opens in a new tab.
- If empty, hide the link or show an “Add Instagram” prompt.

---

## 4. Example: React form field

```tsx
// Read
const { data: company } = useQuery(['company'], () => api.get('/company').then(r => r.data));

// Form state
const [instagram, setInstagram] = useState(company?.instagramLink ?? '');

// Normalize before submit
function toInstagramUrl(s: string): string | null {
  const v = (s || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://www.instagram.com/${v.replace(/^@/, '')}/`;
}

// PATCH on save
await api.patch('/company', {
  instagramLink: toInstagramUrl(instagram),
});
```

---

## 5. Database

`instagramLink` is `STRING(500)`, nullable.  
If you use **Sequelize `sync`**, the column is created/updated on app start.  
If you use **migrations**, add a migration:

```ts
// example: add instagramLink to company
await queryInterface.addColumn('Companies', 'instagramLink', {
  type: DataTypes.STRING(500),
  allowNull: true,
});
```

---

## 6. Social link fields (reference)

| Field | Example |
|-------|---------|
| `facebookLink` | `https://www.facebook.com/yourpage` |
| `instagramLink` | `https://www.instagram.com/yourhandle/` |
| `tiktokLink` | `https://www.tiktok.com/@yourhandle` |
