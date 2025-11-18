# Employee Directory SPFx WebPart

A modern, feature-rich SharePoint Framework (SPFx) web part that displays employee information from Azure AD groups with beautiful UI, search, and filtering capabilities.

## Features

- **Azure AD Integration**: Fetch employees from any Azure AD security group
- **Beautiful Design**: Modern card-based layout with gradient backgrounds and smooth animations
- **Search & Filter**: Search by name, job title, department, or email
- **Advanced Filtering**: Filter by job title, department, and office location
- **Loading Progress**: Visual loading overlay with percentage indicator
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **User Photos**: Automatically fetches and displays user profile photos from Microsoft Graph
- **Lazy Loading Option**: Option to enable lazy loading for better performance with large groups

## Screenshots

The webpart features:
- Employee cards with profile photos, job titles, departments, and contact information
- Real-time search and filter functionality
- Cascading filters that update based on selections
- Loading progress indicator showing percentage complete
- Clean, modern UI based on Microsoft Fluent Design

## Prerequisites

- Node.js v22.14.0 or higher
- SharePoint Online tenant
- Global Administrator or SharePoint Administrator permissions (for API approval)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Solution

```bash
gulp bundle --ship
gulp package-solution --ship
```

This will create the `.sppkg` file in the `sharepoint/solution` folder.

### 3. Deploy to SharePoint

1. Navigate to your SharePoint App Catalog (e.g., `https://yourtenant.sharepoint.com/sites/appcatalog`)
2. Go to **Apps for SharePoint**
3. Upload the `.sppkg` file from `sharepoint/solution/employee-directory.sppkg`
4. Click **Deploy** when prompted
5. Check "Make this solution available to all sites in the organization" if you want it tenant-wide

### 4. Approve API Permissions

After deploying, you need to approve the Microsoft Graph API permissions:

1. Go to SharePoint Admin Center
2. Navigate to **Advanced** > **API Access**
3. You should see pending requests for:
   - **Microsoft Graph - Group.Read.All**
   - **Microsoft Graph - User.Read.All**
   - **Microsoft Graph - GroupMember.Read.All**
4. Approve each permission request

**Note**: Only Global Administrators or SharePoint Administrators can approve API permissions.

## Configuration

### Adding the Web Part to a Page

1. Edit a SharePoint page
2. Click **+** to add a new web part
3. Search for "Employee Directory"
4. Add the web part to the page

### Configuring the Web Part

1. Click the **Edit** (pencil) icon on the web part
2. In the property pane:
   - **Azure AD Group**: Select the Azure AD security group containing the employees you want to display
   - **Enable Lazy Loading**: Toggle on/off to enable lazy loading (useful for large groups)
3. Click **Republish** to save your changes

## Usage

### Search
- Use the search bar to find employees by name, job title, department, or email
- Search is real-time and filters results as you type

### Filters
- **Job Title**: Filter employees by their job title
- **Department**: Filter employees by department
- **Office Location**: Filter employees by office location
- Filters can be combined for more specific results
- Click "Clear All Filters" to reset

### Employee Cards
- Each card shows:
  - Profile photo (or initials if no photo available)
  - Full name
  - Job title
  - Department
  - Office location
  - Email address (clickable mailto link)
  - Phone number

## Development

### Local Testing

```bash
gulp serve
```

This will start the local workbench at `https://localhost:4321/temp/workbench.html`

**Note**: You can't test Microsoft Graph integration in the local workbench. You need to deploy to SharePoint and use the online workbench.

### Testing with SharePoint

```bash
gulp serve --nobrowser
```

Then navigate to your SharePoint site and append:
```
https://yourtenant.sharepoint.com/sites/yoursite/_layouts/15/workbench.aspx
```

## Architecture

### File Structure

```
src/
├── webparts/
│   └── employeeDirectory/
│       ├── models/
│       │   └── IEmployee.ts                    # Employee and Group interfaces
│       ├── services/
│       │   └── GraphService.ts                 # Microsoft Graph API service
│       ├── EmployeeDirectoryWebPart.ts         # Main web part logic
│       ├── EmployeeDirectoryWebPart.module.scss # Styles
│       └── loc/
│           └── mystrings.d.ts                  # Localization strings
```

### Key Components

#### GraphService.ts
- Handles all Microsoft Graph API calls
- Fetches Azure AD groups
- Retrieves group members
- Loads user profile photos
- Implements batch photo loading for performance

#### EmployeeDirectoryWebPart.ts
- Main web part implementation
- Manages state (employees, filters, search query)
- Renders UI dynamically
- Handles user interactions
- Implements loading progress tracking

## API Permissions Explained

### Group.Read.All
- Required to list all Azure AD security groups
- Allows the web part to populate the group dropdown in the property pane

### User.Read.All
- Required to read user profile information
- Retrieves display name, job title, department, office location, email, and phone

### GroupMember.Read.All
- Required to read members of a specific group
- Allows the web part to fetch all users in the selected Azure AD group

## Performance Considerations

- **Photo Loading**: Photos are loaded in batches of 20 to avoid overwhelming the API
- **Lazy Loading**: Optional lazy loading can be enabled for very large groups
- **Filtering**: All filtering happens client-side for instant results
- **Caching**: Employee data is cached until the group selection changes

## Troubleshooting

### Web Part Shows "No Azure AD Group Selected"
- Configure the web part and select a group from the property pane

### API Permission Errors
- Ensure all Microsoft Graph API permissions are approved in SharePoint Admin Center
- Wait a few minutes after approval for permissions to propagate

### Photos Not Loading
- Check that users have profile photos set in Microsoft 365
- Verify that the User.Read.All permission is approved
- Some users may not have photos - initials will be shown as fallback

### Empty Employee List
- Verify the selected Azure AD group contains users
- Check that you have permissions to read the group members
- Ensure the group is a security group (not Microsoft 365 group)

## Browser Support

- Microsoft Edge (Chromium)
- Google Chrome
- Mozilla Firefox
- Safari 14+

## Version History

| Version | Date | Comments |
|---------|------|----------|
| 1.0.0 | 2025-01-18 | Initial release |

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please contact your SharePoint administrator.

## Credits

Built with:
- [SharePoint Framework (SPFx)](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)
- [Fluent UI](https://developer.microsoft.com/en-us/fluentui)
