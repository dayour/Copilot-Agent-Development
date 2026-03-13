# Multi-Agent AI Scheduling Assistant

A sophisticated AI-powered scheduling assistant built with Microsoft Teams AI and integrated with Copilot Studio Calendar Manager for real calendar operations.

##  Features

- **Multi-Agent Architecture**: Combines local Teams AI logic with remote Copilot Studio Calendar Manager
- **Real Calendar Integration**: Connected to Copilot Studio Calendar Manager for actual calendar operations
- **Natural Language Processing**: Understands scheduling requests in plain English
- **Microsoft Teams Integration**: Native Teams app with chat interface
- **DevTools Support**: Built-in development and testing tools

##  Architecture

```
User Request → Teams AI Agent → Calendar Manager (Copilot Studio) → Microsoft 365 Calendar
```

### Components

1. **Teams AI Application** (`src/index.ts`)
   - Handles user interactions
   - Processes natural language requests
   - Routes calendar operations to Calendar Manager

2. **Calendar Manager Integration**
   - Copilot Studio bot: `dystudio_calendarManager`
   - Environment: `YOUR_ENVIRONMENT_ID`
   - Real Microsoft 365 calendar connectivity

3. **Microsoft 365 Agents SDK**
   - Authentication and communication with Copilot Studio
   - Secure API connections

##  Dependencies

```json
{
  "@microsoft/agents-copilotstudio-client": "^0.6.1",
  "@azure/msal-node": "^3.6.3",
  "@microsoft/teams.apps": "preview",
  "@microsoft/teams.dev": "^2.0.0-preview.7"
}
```

##  Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Access DevTools**
   - Open: http://localhost:3979/devtools
   - Test the chat interface

##  Usage Examples

### Schedule Meetings
```
"Schedule a meeting for 4pm tomorrow"
"Book a 2-hour workshop next Friday"
"Set up a client call for Monday morning"
```

### View Calendar
```
"What's my schedule today?"
"Show my calendar for this week"
"When am I free tomorrow?"
```

### Manage Meetings
```
"Cancel my 3pm meeting"
"Reschedule the team meeting to 4pm"
"Add John to my client presentation"
```

##  Configuration

### Calendar Manager Connection
- **Environment ID**: `YOUR_ENVIRONMENT_ID`
- **Schema Name**: `dystudio_calendarManager`
- **Authentication**: Microsoft authentication required

### M365 Agents Toolkit OAuth

For user authentication in Teams applications:

1. Update `aad.manifest.json` with required scopes
2. Configure `infra/botRegistration/azurebot.bicep` with scope permissions

Example scopes for calendar access:
```json
"requiredResourceAccess": [
    {
        "resourceAppId": "Microsoft Graph",
        "resourceAccess": [
            {
                "id": "Calendars.ReadWrite",
                "type": "Scope"
            },
            {
                "id": "User.Read",
                "type": "Scope"
            }
        ]
    }
]
```

##  Development

### Local Development
```bash
npm run dev
```

### DevTools Testing
```bash
npm start
# Navigate to http://localhost:3979/devtools
```

### Build for Production
```bash
npm run build
npm start
```

##  Project Structure

```
scheduler-agent/
├── src/
│   └── index.ts          # Main application logic
├── appPackage/
│   └── manifest.json     # Teams app manifest
├── infra/                # Azure infrastructure
├── env/                  # Environment configurations
├── dist/                 # Built output
└── package.json          # Dependencies and scripts
```

##  Future Enhancements

- [ ] Full Microsoft Graph API integration
- [ ] Advanced recurring meeting support
- [ ] Meeting room booking
- [ ] Calendar conflict resolution
- [ ] Email notifications
- [ ] Multi-timezone support

##  License

MIT License - See LICENSE file for details

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

##  Support

For questions or issues, please open a GitHub issue or contact the development team.
