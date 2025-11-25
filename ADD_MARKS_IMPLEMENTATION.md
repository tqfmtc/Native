# Add Marks Feature Implementation

## Overview
Added a comprehensive "Add Marks" feature to the SubjectManagement screen that allows tutors to add new mark records for students' subjects through an easy-to-use form modal.

## Changes Made

### 1. **API Configuration** (`constants/config.ts`)
Added new endpoint for adding marks:
```typescript
STUDENT_SUBJECT_ADD_MARKS: '/student-subjects/:studentId/:subjectId/marks'
```

### 2. **API Function** (`utils/api.ts`)
Added new function to POST marks records:
```typescript
export const addStudentSubjectMarks = async (
  studentId: string,
  subjectId: string,
  token: string,
  payload: { marksPercentage: number; examDate: string }
): Promise<any>
```

### 3. **SubjectManagement Component** (`components/SubjectManagement.tsx`)

#### New State Variables:
- `addMarksModalVisible` - Controls visibility of Add Marks modal
- `selectedSubjectForMarks` - Tracks which subject is selected in the form
- `marksFormData` - Stores form input values:
  - `subjectId` - Selected subject ID
  - `marksPercentage` - Marks percentage (0-100)
  - `examDate` - Date of exam (YYYY-MM-DD format)
- `isAddingMarks` - Loading state during API submission

#### New Handler Functions:

**openAddMarksModal()**
- Validates that a student is selected and has subjects
- Pre-populates form with first subject
- Opens the modal

**closeAddMarksModal()**
- Resets form data
- Closes modal
- Clears selected subject

**handleDateChange(text)**
- Allows user to type date in text input
- Updates examDate in form data

**submitAddMarks()**
- Validates all form inputs:
  - Subject selected
  - Marks percentage is numeric and between 0-100
  - Exam date is provided
- Calls API to add marks
- Refreshes subject records list on success
- Shows success/error alerts
- Closes modal after successful submission

#### UI Components Added:

**"Add Marks" Button** (in subjects view topBar)
- Styled similar to "Mark Attendance" button in StudentManagement
- Blue color (#3B82F6) for consistency with app theme
- Located at top-right of subjects screen
- Positioned opposite to back button using flexDirection: 'row' and justifyContent: 'space-between'

**Add Marks Modal** with three form fields:

1. **Subject Dropdown**
   - Horizontal scrollable list of subject chips
   - Shows subject names from the selected student's records
   - Active selection highlighted in blue
   - User can tap any subject to select it

2. **Marks Percentage Input**
   - TextInput with `keyboardType="number-pad"` for numpad keyboard
   - Accepts values 0-100
   - Max length 3 characters
   - Placeholder: "Enter marks (e.g., 85)"
   - Validates input on submission

3. **Exam Date Input**
   - TextInput accepting date in YYYY-MM-DD format
   - Helper text shows expected format
   - Defaults to today's date
   - User can manually type or modify date

#### Modal Features:
- Backdrop with semi-transparent dark overlay
- Header with title and close button (✕)
- Form fields with labels and placeholders
- Validation error messages shown as alerts
- Submit button shows loading spinner during API call
- Cancel button to dismiss modal
- Both buttons disabled during submission to prevent double-clicks
- Styled footer with action buttons

#### Form Validation:
- ✓ Subject must be selected
- ✓ Marks percentage must be numeric
- ✓ Marks must be between 0 and 100
- ✓ Exam date must be provided
- ✓ Clear error messages for each validation failure

### 4. **Styling** (StyleSheet additions)

New styles added:
- `addMarksButtonPill` - Blue pill button (main action button)
- `addMarksButtonPillText` - White text for button
- `infoPair` - Container for label + input
- `infoLabel` - Form field labels
- `input` - TextInput styling
- `helperText` - Small helper text below inputs
- `dropdownContainer` - Container for subject chips
- `dropdownOption` - Individual subject chip
- `dropdownOptionActive` - Selected subject chip (blue)
- `dropdownOptionText` - Subject name text
- `dropdownOptionTextActive` - White text for selected chip
- `btnPrimary` - Primary action button styling
- `btnTextLight` - White button text

## User Flow

1. User navigates to SubjectManagement → selects student → views subjects list
2. Taps "Add Marks" button in top-right corner
3. Modal opens with Add Marks form
4. User:
   - Selects a subject from horizontal list (or it defaults to first one)
   - Enters marks percentage (0-100) using numpad
   - Enters exam date in YYYY-MM-DD format
5. User taps "Add Marks" button in modal
6. Form validates input
7. If valid, API submits data to: `POST /api/student-subjects/:studentId/:subjectId/marks`
8. On success:
   - Success alert shown
   - Modal closes
   - Subject records list refreshes to show new mark
9. On error:
   - Error alert shown with error message
   - Modal remains open for user to correct input

## API Integration

**Endpoint**: `POST /api/student-subjects/:studentId/:subjectId/marks`

**Request Body**:
```json
{
  "marksPercentage": 85,
  "examDate": "2025-11-24"
}
```

**Expected Response**: Updated subject record with new mark added to marksPercentage array

## Form Data Requirements

- **marksPercentage** (number, required): Must be 0-100
- **examDate** (string, required): Format must be YYYY-MM-DD
- **studentId** (derived): Taken from selectedStudent._id
- **subjectId** (derived): Selected from marksFormData.subjectId

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Subject | Must select one | "Please select a subject" |
| Marks | Must be numeric | "Please enter valid marks percentage (0-100)" |
| Marks | Must be 0-100 | "Marks must be between 0 and 100" |
| Date | Must be provided | "Please select exam date" |

## Design Consistency

The "Add Marks" button follows the same design pattern as the "Mark Attendance" button in StudentManagement:
- Blue color (#3B82F6)
- Rounded pill shape (borderRadius: 999)
- Shadow for depth (elevation + shadow properties)
- Responsive to user interactions

The form styling is consistent with StudentManagement's edit form:
- Light gray backgrounds for inputs
- Border styling with subtle colors
- Proper label and value hierarchy
- Accessible font sizes and weights

## Files Modified

1. `/constants/config.ts` - Added API endpoint
2. `/utils/api.ts` - Added API function
3. `/components/SubjectManagement.tsx` - Main feature implementation:
   - Imports (TextInput)
   - State management
   - Handler functions
   - Modal UI
   - Styling

## Testing Checklist

- [ ] App builds without TypeScript errors
- [ ] App compiles and runs on Android emulator
- [ ] "Add Marks" button appears in subjects view
- [ ] Clicking button opens Add Marks modal
- [ ] Subject dropdown shows all subjects for student
- [ ] Can select different subjects
- [ ] Marks input accepts numeric input only
- [ ] Date input accepts text in YYYY-MM-DD format
- [ ] Form validates all fields on submission
- [ ] Error alerts show for invalid input
- [ ] Success alert shows after successful submission
- [ ] Subject records list refreshes with new mark
- [ ] New mark appears in marks history table with correct S.No indexing
- [ ] Close button dismisses modal
- [ ] Cancel button dismisses modal without submitting
- [ ] Modal buttons disabled during API submission

## Future Enhancements

Possible additions:
- Calendar picker for date selection (requires react-native-community/datetimepicker)
- Ability to edit existing marks records
- Ability to delete marks records
- Bulk import of marks from CSV
- Export marks to PDF/Excel
- Marks analytics and visualization
