# Contributing to ContactForge

Thank you for your interest in contributing to ContactForge! We welcome developers, designers, and contributors who share our vision of privacy-first, offline-only contact management.

## 🎯 Welcome

ContactForge is built on core principles that guide our development:

- **Privacy First**: No data collection, no cloud sync, no external tracking. All data stays on the user's device.
- **Offline-Only**: The app functions completely without internet connectivity. No network dependencies.
- **Open Source**: Transparent development, community-driven improvements, and collaborative problem-solving.
- **User-Centric**: Features are designed around user needs, not corporate metrics.

By contributing to ContactForge, you're helping build a contact management solution that respects user privacy and autonomy.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Expo CLI**: use `npx expo` (no global install required)
- **Git**
- Basic knowledge of TypeScript and React Native

### Setting Up Your Development Environment

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Contact-Forge.git
   cd Contact-Forge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - No environment variables are required for local development (offline-first design means no API keys or secrets)
   - Verify the `app.json` and `eas.json` configurations are appropriate for your environment

4. **Verify TypeScript, Lint, and Tests**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

5. **Run the Development Server**
   ```bash
   npm start
   # or with Expo
   expo start
   ```
   - Scan the QR code with Expo Go app on iOS/Android
   - Press `w` to open in web preview
   - Press `i` for iOS or `a` for Android simulators

## 📋 Code Standards

### TypeScript

- **Strict Mode Required**: All code must be written with TypeScript strict mode enabled (`tsconfig.json` includes `"strict": true`)
- Use explicit type annotations for function parameters and return types
- Avoid `any` type; use `unknown` when necessary and narrow types appropriately
- Example:
  ```typescript
  interface Contact {
    id: string;
    name: string;
    email?: string;
  }
  
  function getContactName(contact: Contact): string {
    return contact.name;
  }
  ```

### File Organization

Follow the established project structure:

```
src/
├── services/          # Business logic (contact operations, validation)
├── db/                # Database and storage operations
├── components/        # React Native components
├── hooks/             # Custom React hooks
├── utils/             # Utility functions and helpers
├── types/             # TypeScript type definitions
└── constants/         # Application constants
```

- Place each component or service in its own file
- Group related utilities into subdirectories
- Keep files focused and under 300 lines when possible

### Naming Conventions

- **Files**: Use `kebab-case` for filenames (e.g., `contact-service.ts`, `contact-list.tsx`)
- **Functions/Variables**: Use `camelCase` (e.g., `getContactById`, `isValidEmail`)
- **Types/Interfaces**: Use `PascalCase` (e.g., `Contact`, `ContactFilter`)
- **Constants**: Use `UPPER_SNAKE_CASE` (e.g., `MAX_CONTACTS`, `DEFAULT_SORT_ORDER`)
- **React Components**: Use `PascalCase` (e.g., `ContactList`, `ContactDetailsScreen`)

### Documentation

All public functions, components, and complex logic must include JSDoc comments:

```typescript
/**
 * Validates an email address format.
 * @param email - The email string to validate
 * @returns True if email format is valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * ContactListScreen component displays a list of all contacts
 * with search and filtering capabilities.
 * @component
 * @example
 * return <ContactListScreen navigation={navigation} />
 */
export function ContactListScreen({ navigation }): JSX.Element {
  // ...
}
```

### Code Quality Rules

- **No Console Logs in Production**: Remove all `console.log`, `console.warn`, `console.error` from production code (debugging during development is fine, but must be removed before PR submission)
- **No External API Calls**: Respect the offline-first principle. Do not add dependencies on external APIs or network calls
- **Error Handling**: All async operations must include try-catch blocks with meaningful error handling
- **Constants for Magic Numbers**: Never use magic numbers; define constants with descriptive names
- **DRY Principle**: Extract repeated code into utility functions or components

### Testing

- **Pure functions should have tests**: All utility functions, validation logic, and business logic must be covered by unit tests
- **Test-driven approach**: Write tests before or alongside implementation
- **Descriptive test names**: Use clear, descriptive test names that explain what is being tested
- **Mock Expo modules**: Use Jest mocks for Expo modules in tests (see Testing section)

## 🔄 Making Changes

### Workflow

1. **Fork the Repository** on GitHub
   ```bash
   # From the GitHub web interface, click "Fork"
   ```

2. **Create a Feature Branch** from `main`
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/add-contact-health-score
   ```
   - Use descriptive branch names: `feature/`, `fix/`, `docs/`, `refactor/`

3. **Make Focused Commits**
   - Keep changes focused on a single feature or bug fix
   - Each commit should be logically independent
   - Avoid mixing refactoring with feature work in the same commit

4. **Write Tests**
   - Add unit tests for new functions and utilities
   - Update tests if you modify existing logic
   - Ensure all tests pass locally

5. **Keep Commits Atomic**
   - One feature = one commit (or logically related commits)
   - Use `git rebase -i` to clean up commit history before submitting PR

### Breaking Changes

- **Avoid Breaking Changes**: Never introduce breaking changes to public APIs without discussion
- If a breaking change is necessary:
  - Open an issue for discussion first
  - Document the change clearly in PR description
  - Update all dependent code and documentation

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests for a specific file
npm test -- contact-service.test.ts

# Run tests with coverage
npm test -- --coverage
```

### TypeScript Verification

```bash
# Check for TypeScript errors
npm run typecheck
```

### Testing Requirements

- **All Tests Must Pass**: `npm test` must exit with code 0
- **TypeScript Must Pass**: `npm run typecheck` must have no errors
- **New Features**: Include unit tests that verify behavior
- **Bug Fixes**: Add regression tests that would have caught the bug
- **Descriptive Test Names**: Use `describe()` and `it()` with clear descriptions
  ```typescript
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });
    
    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
    });
  });
  ```

### Mocking Expo Modules

When testing code that uses Expo modules, mock them appropriately:

```typescript
jest.mock('expo-contacts', () => ({
  getContactsAsync: jest.fn(() => Promise.resolve({ data: [] })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock-directory/',
  readAsStringAsync: jest.fn(),
}));
```

## 📝 Commit Messages

Follow semantic commit format for clear, searchable commit history:

```
<type>: <subject>

<body>

<footer>
```

### Commit Types

- **feat**: A new feature or functionality
- **fix**: A bug fix
- **docs**: Documentation changes (README, comments, guides)
- **style**: Code style changes (formatting, semicolons) that don't affect functionality
- **refactor**: Code refactoring without changing functionality
- **test**: Adding or updating tests
- **chore**: Build config, dependencies, tooling changes

### Examples

```
feat: add contact health score calculation

Implement scoring algorithm to assess contact data completeness and 
detail level, considering name, email, phone, and organization fields.

Closes #42
```

```
fix: prevent duplicate contacts in filtered list

Apply deduplication logic when combining custom and system contacts
after applying search filters.

Fixes #58
```

```
docs: update CONTRIBUTING.md with testing guidelines

Add section on mocking Expo modules and increase test coverage requirements.
```

## 🔀 Pull Request Process

1. **Before Submitting**
   - Ensure your branch is up to date with `main`
   - Run `npm run typecheck` - must pass with no errors
   - Run `npm test` - all tests must pass
   - Run `npm run build` if available - must succeed

2. **Fill Out PR Template**
   - Describe what changes you made
   - Explain why these changes are needed
   - Reference related issues (e.g., "Closes #42")

3. **PR Title Format**
   - Use semantic format: "feat: add contact groups support"
   - Be specific and descriptive

4. **Update Documentation**
   - Update README if your changes affect user-facing features
   - Add/update JSDoc comments for new functions
   - Update type definitions if interfaces change

5. **Pass All Checks**
   - All CI/CD checks must pass (TypeScript, tests, linting)
   - No merge conflicts with `main`
   - Code review approval from at least one maintainer

6. **Address Feedback**
   - Respond to review comments promptly
   - Make requested changes in new commits
   - Rebase before merge if requested

## 🐛 Reporting Issues

### Before Opening an Issue

- Search existing issues to avoid duplicates
- Check closed issues in case the problem was already addressed
- Verify the issue occurs on the latest `main` branch

### Reporting a Bug

Provide the following information:

1. **Clear Title**: "Contacts not saving on device restart" (not "Bug found")

2. **Description**: What did you expect to happen? What actually happened?

3. **Steps to Reproduce**
   ```
   1. Open the app
   2. Add a new contact
   3. Force close the app
   4. Reopen the app
   5. Contact is missing
   ```

4. **Expected Behavior**
   - "Contact should persist and be visible after app restart"

5. **Actual Behavior**
   - "Contact was deleted"

6. **Environment Information**
   - Device: iPhone 12, Android 11 emulator, etc.
   - OS Version: iOS 15.2, Android 11, etc.
   - App Version: (if applicable)

7. **Screenshots/Logs**
   - Attach screenshots showing the problem
   - Include relevant error messages or stack traces

### Reporting a Feature Request

1. **Title**: Clearly describe the feature
2. **Description**: Explain the use case and benefit
3. **Example**: Show how the feature would work
4. **Alternatives**: Describe any alternative solutions you've considered

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- **Be Respectful**: Treat all contributors with courtesy and respect
- **No Harassment**: Harassment, discrimination, or abusive behavior will not be tolerated
- **Assume Good Intent**: Assume other contributors are acting in good faith
- **Constructive Feedback**: Provide feedback that is helpful, specific, and actionable
- **Respect Differences**: Welcome contributors from diverse backgrounds and perspectives

### Reporting Violations

If you experience or witness code of conduct violations, please contact the maintainers directly. All reports will be handled confidentially and investigated promptly.

## ⚖️ License & Contributor Agreement

- ContactForge is licensed under the **MIT License**
- By contributing to this project, you agree that your contributions will be licensed under the same MIT License
- You retain copyright to your contributions
- You confirm that your contributions are your own work or properly licensed/attributed

## 🙏 Thank You

Your contributions make ContactForge better! Whether it's code, documentation, bug reports, or feature ideas, we appreciate your involvement in building a privacy-respecting contact management solution.

For questions or guidance, feel free to:
- Open an issue with the `question` label
- Check existing documentation
- Reach out to maintainers

Happy coding! 🚀
