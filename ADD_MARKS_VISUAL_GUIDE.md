# Add Marks Feature - Visual Guide & Usage

## Feature Location
```
SubjectManagement Screen (Subjects View)
│
├─ Top Bar
│  ├─ ← Back Button (Left)
│  └─ 🔵 Add Marks Button (Right) ← NEW FEATURE
│
├─ Header: "Subjects - [Student Name]"
│
├─ FlatList of Subject Cards
│  ├─ Subject Name
│  ├─ Records Count Badge
│  ├─ Latest Marks Preview
│  └─ Latest Date
│
└─ ... (existing modal for viewing details)
```

## Form Layout

When "Add Marks" button is tapped:

```
┌─────────────────────────────────────────┐
│  Add Marks Record                    ✕  │
├─────────────────────────────────────────┤
│                                         │
│  Subject                                │
│  ┌─────────────────────────────────────┐│
│  │ [Maths] [English] [Science] → ➔  ││ (Horizontal scroll)
│  └─────────────────────────────────────┘│
│                                         │
│  Marks Percentage (0-100)               │
│  ┌─────────────────────────────────────┐│
│  │ Enter marks (e.g., 85)          │   ││ (Numpad keyboard)
│  └─────────────────────────────────────┘│
│                                         │
│  Exam Date (YYYY-MM-DD)                 │
│  ┌─────────────────────────────────────┐│
│  │ 2025-11-24                      │   ││ (Text input)
│  └─────────────────────────────────────┘│
│  Format: YYYY-MM-DD                     │
│                                         │
├─────────────────────────────────────────┤
│                  [Cancel]  [Add Marks]  │ (Action buttons)
└─────────────────────────────────────────┘
```

## Form Field Details

### 1. Subject Field (Horizontal Dropdown)
```
Visual: Scrollable horizontal list of subject chips

Behavior:
- Shows all subjects for selected student
- First subject pre-selected
- Tap any subject to select it
- Selected subject: Blue background, white text
- Unselected subjects: Gray background, dark text

Styling:
- Each chip: 100px minimum width
- Padding: 16px horizontal, 10px vertical
- Border radius: 8px
- Gap between chips: 8px
```

### 2. Marks Percentage Field
```
Type: TextInput with number-pad keyboard
Input Validation:
- Accepts digits 0-9 only
- Max length: 3 characters (for 0-100 range)
- Triggers numpad keyboard on focus

Format: Integer 0-100
- 0 = 0%
- 50 = 50%
- 100 = 100%

Error States:
- Empty: "Please enter valid marks percentage (0-100)"
- Non-numeric: "Please enter valid marks percentage (0-100)"
- Outside range: "Marks must be between 0 and 100"
- Examples of invalid input: -5, 105, "abc", 99.5
```

### 3. Exam Date Field
```
Type: TextInput with text keyboard
Format: YYYY-MM-DD (ISO 8601)
- YYYY = 4-digit year (e.g., 2025)
- MM = 2-digit month (01-12)
- DD = 2-digit day (01-31)

Examples of valid dates:
✓ 2025-11-24
✓ 2025-01-01
✓ 2025-12-31

Examples of invalid dates:
✗ 24-11-2025 (wrong format)
✗ 11/24/2025 (wrong format)
✗ 2025-13-01 (invalid month)
✗ 2025-02-30 (invalid day)

Default: Today's date in YYYY-MM-DD format

Error State:
- Empty: "Please select exam date"
```

## Validation Flow

```
User taps "Add Marks" button on form
                ↓
┌─ Validation Loop ──────────────────┐
│                                    │
│ 1. Subject selected?               │
│    ├─ No → Alert: "Please select   │
│    │         a subject" → Stop     │
│    └─ Yes → Continue               │
│                                    │
│ 2. Marks is numeric?               │
│    ├─ No → Alert: "Please enter    │
│    │        valid marks..." → Stop │
│    └─ Yes → Continue               │
│                                    │
│ 3. Marks in 0-100 range?           │
│    ├─ No → Alert: "Marks must be   │
│    │        between 0 and 100"     │
│    │        → Stop                 │
│    └─ Yes → Continue               │
│                                    │
│ 4. Date provided?                  │
│    ├─ No → Alert: "Please select   │
│    │         exam date" → Stop     │
│    └─ Yes → Continue               │
│                                    │
│ ✓ All validations pass             │
│   → Call API                       │
└────────────────────────────────────┘
                ↓
        API Call: POST
    /api/student-subjects/
    [studentId]/[subjectId]/marks
                ↓
         Response?
        ↙        ↘
    Success      Error
      ↓            ↓
   Alert:      Alert:
   "Marks      "[error
   added       message]"
   success!"     
      ↓            ↓
   Close       Stay Open
   Modal       (allow retry)
      ↓
  Refresh
  subject
  records
  list
      ↓
  New mark
  appears
  in table
```

## API Integration Details

### Request
```
Method: POST
Endpoint: /api/student-subjects/{studentId}/{subjectId}/marks
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
Body: {
  "marksPercentage": 85,
  "examDate": "2025-11-24"
}
```

### Response (Expected)
```json
{
  "_id": "...",
  "student": "...",
  "subject": {
    "_id": "...",
    "subjectName": "Maths"
  },
  "marksPercentage": [
    {
      "percentage": 75,
      "examDate": "2025-10-15",
      "recordedAt": "2025-10-16T10:30:00.000Z"
    },
    {
      "percentage": 85,        ← New mark added
      "examDate": "2025-11-24",
      "recordedAt": "2025-11-24T14:22:00.000Z"
    }
  ],
  "createdAt": "..."
}
```

## After Successful Submission

The marks history table is automatically updated and refreshed:

```
Subject Details Modal (Auto-Updated)
┌────────────────────────────────────────┐
│  Maths                              ✕  │
├────────────────────────────────────────┤
│                                        │
│  Marks History                         │
│  ┌──────────────────────────────────┐ │
│  │ S.No │ Exam Date  │ Percentage   │ │
│  ├──────────────────────────────────┤ │
│  │  1   │ 15-Oct-2025│ 75%         │ │
│  ├──────────────────────────────────┤ │
│  │  2   │ 24-Nov-2025│ 85%  ← NEW  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Summary                               │
│  ├─ Total Records: 2                   │
│  ├─ Highest Marks: 85%                 │
│  ├─ Lowest Marks: 75%                  │
│  └─ Average Marks: 80.00%              │
│                                        │
├────────────────────────────────────────┤
│                            [Close]     │
└────────────────────────────────────────┘
```

## UX Flow Diagram

```
Subjects Screen
│
│ User taps "Add Marks"
│ (Blue button, top-right)
↓
Add Marks Modal Opens
│
├─ User selects subject (or keeps default)
├─ User enters marks (e.g., 85)
├─ User enters date (e.g., 2025-11-24)
│
├─ User taps "Add Marks" button
│
└─ Form validates
   │
   ├─ ❌ Invalid → Error alert → User can retry
   │
   └─ ✓ Valid → API call
      │
      ├─ ❌ API Error → Error alert → Modal stays open
      │
      └─ ✓ API Success
         │
         └─ Success alert
            │
            └─ Modal closes
               │
               └─ Subject records refreshed
                  │
                  └─ New mark visible in history
```

## Button States

### Normal State
```
┌─────────────────┐
│   Add Marks     │  Blue background, white text
└─────────────────┘  Clickable, responsive to tap
```

### Disabled State (During API Call)
```
┌─────────────────┐
│  [spinner]      │  Shows activity indicator
└─────────────────┘  Not clickable, dimmed appearance
```

## Error Scenarios & Recovery

| Scenario | Error Message | Recovery |
|----------|---------------|----------|
| No subject selected | "Please select a subject" | Select a subject and retry |
| Invalid marks format | "Please enter valid marks..." | Enter numeric value 0-100 |
| Out of range marks | "Marks must be between 0 and 100" | Enter value between 0-100 |
| No date entered | "Please select exam date" | Enter date in YYYY-MM-DD format |
| Invalid date format | (Accepted as-is, API may reject) | Enter date in YYYY-MM-DD format |
| Network/API error | "[Error message from API]" | Check connection, retry |

## Implementation Notes

1. **Subject Dropdown**: Uses ScrollView with horizontal scroll indicator disabled for clean UI
2. **Keyboard Handling**: 
   - Marks field: number-pad keyboard prevents non-numeric input at OS level
   - Date field: Default text keyboard allows manual date entry
3. **Date Format**: Simple text input (YYYY-MM-DD) chosen over DatePicker for:
   - Simpler implementation
   - Cross-platform compatibility (iOS & Android)
   - Faster data entry for experienced users
4. **API Optimization**: After successful submission, component automatically calls `fetchSubjects()` to refresh the subject records list
5. **UX Feedback**: 
   - Loading spinner on button during API call
   - Success alert confirms action
   - Error alerts help user troubleshoot
   - Modal auto-closes on success for clean transition

## Accessibility Features

- ✓ Clear labels for all form fields
- ✓ Helpful placeholder text
- ✓ Format hints below date field
- ✓ Descriptive error messages
- ✓ Keyboard types optimized per field (numpad for numbers)
- ✓ Subject chips easy to tap (good touch targets)
- ✓ High contrast blue buttons for visibility
