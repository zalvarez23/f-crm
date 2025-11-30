# Call Center Feature

## Overview
The Call Center feature provides lead management and distribution functionality for supervisors and administrators.

## Structure
```
call-center/
├── pages/
│   └── call-center-page.tsx    # Main call center dashboard
├── components/                  # Future: Call center specific components
└── README.md
```

## Functionality

### Call Center Page
- **Lead Distribution Dashboard**: View lead distribution across executives
- **Bulk Upload**: Upload leads from Excel files
- **Manual Lead Creation**: Create individual leads
- **Executive Management**: View executive lead counts

### Access Control
- **Allowed Roles**: `supervisor`, `administrator`
- **Route**: `/call-center`

## Dependencies
- Uses `LeadUploadDialog` and `LeadDialog` from `features/leads/components`
- Uses `leadsService` from `features/leads/services`
- Uses `usersService` from `features/users/services`

## Future Enhancements
- Call center specific analytics
- Real-time lead assignment
- Call center performance metrics
- Custom call center components
