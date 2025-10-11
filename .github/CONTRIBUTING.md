# Contributing to notePlus

Thank you for your interest in contributing to notePlus! This document provides guidelines and information for contributors.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/noteplus.git`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## Development Principles

This project follows **Test-Driven Development (TDD)**:

1. Write tests first
2. Make tests fail
3. Write minimal code to make tests pass
4. Refactor and improve

## Code Standards

### TypeScript

- Use strict mode
- Define proper types for all functions and variables
- Avoid `any` type

### Testing

- Write tests for all new features
- Maintain test coverage above 70%
- Use descriptive test names
- Test both success and error cases

### Security

- Never use `eval()` or similar dangerous functions
- Sanitize all user inputs
- Use DOMPurify for HTML sanitization
- Follow Electron security best practices

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write clear, self-documenting code
- Add comments for complex logic

## Pull Request Process

1. Create a feature branch from `main`
2. Write tests for your changes
3. Implement the feature
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request

### PR Requirements

- All tests must pass
- Code coverage should not decrease
- Follow the existing code style
- Include tests for new functionality
- Update documentation if applicable

## Issue Guidelines

### Bug Reports

- Use the bug report template
- Include steps to reproduce
- Provide environment information
- Add screenshots if applicable

### Feature Requests

- Use the feature request template
- Explain the problem and proposed solution
- Consider implementation complexity
- Check for existing similar requests

## Development Workflow

1. **Planning**: Discuss major changes in issues first
2. **Development**: Follow TDD approach
3. **Testing**: Ensure comprehensive test coverage
4. **Review**: Code review by maintainers
5. **Merge**: Squash and merge to main branch

## Architecture Guidelines

### Main Process (Electron)

- Handle file operations
- Manage native menus
- Implement security measures
- Handle system integration

### Renderer Process (React)

- UI components and interactions
- State management
- Real-time preview
- User input handling

### IPC Communication

- Use secure IPC channels
- Validate all data
- Handle errors gracefully
- Maintain type safety

## Performance Considerations

- Use React.memo for expensive components
- Implement proper debouncing
- Optimize re-renders
- Monitor memory usage
- Use requestAnimationFrame for animations

## Security Checklist

- [ ] No `eval()` usage
- [ ] Input sanitization
- [ ] XSS protection
- [ ] Context isolation enabled
- [ ] Node integration disabled
- [ ] Secure IPC communication

## Getting Help

- Check existing issues and discussions
- Join our community discussions
- Ask questions in issues with the `question` label

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to notePlus! 🎉
