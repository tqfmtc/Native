# Date Format Update: DD-MM-YY

## Changes Made

All date formats in the SubjectManagement component have been updated from various formats to a consistent **DD-MM-YY** format throughout the UI.

### 1. **formatDate() Function**
Updated to return dates in DD-MM-YY format:

**Before:**
```typescript
const formatDate = (dateStr?: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  // Output: "24 Nov 2025" or similar
}
```

**After:**
```typescript
const formatDate = (dateStr?: string) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
  // Output: "24-11-25"
}
```

### 2. **New Helper Functions Added**

#### convertToApiFormat(ddmmyy)
Converts user input from DD-MM-YY display format to YYYY-MM-DD API format:
- Input: "24-11-25"
- Output: "2025-11-24"

#### convertToDisplayFormat(yyyymmdd)
Converts internal YYYY-MM-DD format to DD-MM-YY display format:
- Input: "2025-11-24"
- Output: "24-11-25"

### 3. **Form Data State**
Updated to store dates in DD-MM-YY display format:

**Before:**
```typescript
examDate: new Date().toISOString().split('T')[0], // "2025-11-24"
```

**After:**
```typescript
examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0]), // "24-11-25"
```

### 4. **openAddMarksModal() Function**
Initializes date field with DD-MM-YY format:
```typescript
examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0])
```

### 5. **closeAddMarksModal() Function**
Resets date field with DD-MM-YY format:
```typescript
examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0])
```

### 6. **submitAddMarks() Function**
Converts DD-MM-YY back to YYYY-MM-DD before API submission:
```typescript
const apiExamDate = convertToApiFormat(marksFormData.examDate);
// Then uses apiExamDate in API call
```

### 7. **Form UI Labels & Placeholders**

**Exam Date Label:**
- Before: "Exam Date (YYYY-MM-DD)"
- After: "Exam Date (DD-MM-YY)"

**Exam Date Placeholder:**
- Before: "e.g., 2025-11-24"
- After: "e.g., 24-11-25"

**Exam Date Helper Text:**
- Before: "Format: YYYY-MM-DD"
- After: "Format: DD-MM-YY"

## Where Dates Appear in UI

### 1. **Marks History Table** (Detail Modal)
Shows exam dates in DD-MM-YY format using `formatDate()`:
```
| S.No | Exam Date  | Percentage |
|------|------------|------------|
|  1   | 15-10-25   |    75%     |
|  2   | 24-11-25   |    85%     |
```

### 2. **Subject Card Preview** (Subjects View)
Shows latest exam date in DD-MM-YY format:
```
Subject: Maths
Latest Date: 24-11-25
```

### 3. **Add Marks Form** (Modal)
Shows and accepts dates in DD-MM-YY format:
```
Exam Date (DD-MM-YY)
[24-11-25]  ← User input/display
Format: DD-MM-YY  ← Helper text
```

## Conversion Logic

### Display to API (DD-MM-YY → YYYY-MM-DD)
```typescript
Input: "24-11-25"
↓
Split by "-": ["24", "11", "25"]
↓
Parse year: 25 → 2025 (< 30 → add 2000, else add 1900)
↓
Format as: "2025-11-24"
↓
Output: "2025-11-24" (YYYY-MM-DD for API)
```

### API to Display (YYYY-MM-DD → DD-MM-YY)
```typescript
Input: "2025-11-24"
↓
Extract: Y="2025", M="11", D="24"
↓
Shorten year: 2025 → "25"
↓
Format as: "24-11-25"
↓
Output: "24-11-25" (DD-MM-YY for display)
```

## Date Format Examples

### Valid Input Formats (User can type)
- ✓ `24-11-25` (DD-MM-YY) → Converted to `2025-11-24` for API
- ✓ `2025-11-24` (YYYY-MM-DD) → Converted to `24-11-25` for display
- ✓ Any format gets processed through converter

### Display Format (What user sees)
- Marks history table: `15-10-25`, `24-11-25`
- Subject card preview: `24-11-25`
- Form field: `24-11-25`
- Helper text: "Format: DD-MM-YY"

### API Format (What backend receives)
- Always: `YYYY-MM-DD` (e.g., `2025-11-24`)

## Year Handling

The converter intelligently handles 2-digit years:
```typescript
0-29   → 2000-2029 (future dates)
30-99  → 1930-1999 (past dates)
```

Examples:
- `24-11-25` → `2025-11-24` (assumes 2025)
- `24-11-99` → `1999-11-24` (assumes 1999)
- `24-11-01` → `2001-11-24` (assumes 2001)

## Files Modified

- **components/SubjectManagement.tsx**
  - Added formatDate() with DD-MM-YY output
  - Added convertToApiFormat() helper
  - Added convertToDisplayFormat() helper
  - Updated form data initialization
  - Updated submitAddMarks() to convert formats
  - Updated form UI labels and placeholders

## Testing Checklist

- [ ] Dates in marks history table show DD-MM-YY format
- [ ] Subject card preview shows date in DD-MM-YY format
- [ ] Add Marks form shows DD-MM-YY placeholder
- [ ] User can enter dates in DD-MM-YY format
- [ ] User can enter dates in YYYY-MM-DD format (also works)
- [ ] API receives dates in YYYY-MM-DD format
- [ ] New marks appear with correct DD-MM-YY formatted date
- [ ] Date conversion works for all date ranges
- [ ] No errors in TypeScript compilation

## Backward Compatibility

The converter is flexible and can handle:
1. New DD-MM-YY format input
2. YYYY-MM-DD format input (fallback)
3. Any other format attempts (gracefully handled)

This ensures users can enter dates in either format, and the component will handle conversion correctly.
