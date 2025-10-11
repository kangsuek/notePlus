# notePlus

> A modern markdown editor with built-in calculator for macOS

## 📝 Project Overview

notePlus is a powerful markdown-based note-taking application designed for macOS users. It combines real-time markdown preview with mathematical calculation capabilities, allowing you to write notes and perform calculations seamlessly in one application.

### ✨ Key Features

- ✅ **Real-time Markdown Editing**: Live preview with full markdown syntax support
- ✅ **Built-in Calculator**: Type `=` to instantly calculate mathematical expressions (powered by mathjs)
- ✅ **Bidirectional Scroll Sync**: Synchronized scrolling between Editor and Preview panels
- ✅ **File Management**: Local file save/open with recent documents management
- ✅ **macOS Native**: Dark Mode, keyboard shortcuts, native menu bar integration
- ✅ **Multi-format Support**: .md, .txt, .html, .js, .ts, .py, .json and more
- ✅ **Smart UI**: Resizable panels, sidebar with recent files, status bar
- ✅ **Security First**: Safe expression evaluation, XSS protection, input sanitization

## 🛠 Tech Stack

- **Platform**: macOS 11.0+ (Universal Binary)
- **Framework**: Electron + React + TypeScript
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library
- **Styling**: CSS Modules + Styled Components
- **Key Libraries**:
  - `marked` - Markdown parsing
  - `mathjs` - Safe mathematical expression evaluation
  - `electron-store` - Local data persistence
  - `react-resizable-panels` - Resizable UI panels
  - `DOMPurify` - XSS protection

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- macOS 11.0+ (for development and running)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/noteplus.git
cd noteplus

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Package for distribution
npm run dist
```

### Quick Start

1. **Launch the app**: Run `npm run dev` to start the development version
2. **Create a new file**: Press `Cmd+N` or use File → New
3. **Write markdown**: Type your content in the editor
4. **Calculate expressions**: Type `= 2 + 2` and see the result instantly
5. **Save your work**: Press `Cmd+S` to save, or `Cmd+Shift+S` for Save As

## 📚 Development Guide

### Project Structure

```
notePlus/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main process entry point
│   │   ├── menu.ts        # Native menu configuration
│   │   └── preload.ts     # Preload script for secure IPC
│   ├── renderer/          # React renderer process
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── types.ts       # TypeScript type definitions
│   ├── shared/            # Shared types and utilities
│   └── __tests__/         # Test files
├── docs/                  # Documentation
│   ├── 01.prd.md         # Product Requirements Document
│   └── 02.progress-status.md  # Development progress
├── .cursorrules          # Cursor AI development rules
└── package.json
```

### Development Principles

This project follows **TDD (Test-Driven Development)** methodology:

1. ✅ Write tests first
2. ✅ Verify tests fail
3. ✅ Implement minimal code
4. ✅ Make tests pass
5. ✅ Refactor and improve

For detailed development rules, see [.cursorrules](./.cursorrules) file.

### Architecture

- **Main Process**: Handles file operations, native menus, and system integration
- **Renderer Process**: React-based UI with real-time markdown preview
- **IPC Communication**: Secure communication between main and renderer processes
- **Security**: Context isolation, no node integration, XSS protection

## 📖 Documentation

- [PRD (Product Requirements Document)](./docs/01.prd.md)
- [Development Progress](./docs/02.progress-status.md)
- [Cursor AI Development Rules](./.cursorrules)

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Current Test Coverage**: 75.1% (277 tests across 24 test suites)

### Test Categories

- **Unit Tests**: Individual component and utility function testing
- **Integration Tests**: End-to-end workflow testing
- **Component Tests**: React component behavior testing
- **Security Tests**: XSS protection and input validation testing

## 🎨 Code Quality

```bash
# ESLint check
npm run lint

# ESLint auto-fix
npm run lint:fix

# Prettier formatting
npm run format

# Prettier check
npm run format:check
```

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Security**: No `eval()`, XSS protection, input sanitization

## 📈 Development Status

**Current Phase**: Phase 1 (MVP) - Completed ✅
**Progress**: Core features implemented and tested

### ✅ Completed Features

- Real-time markdown editing with live preview
- Mathematical expression calculation (`=` syntax)
- File management (save, open, recent files)
- macOS native integration (menus, shortcuts, dark mode)
- Bidirectional scroll synchronization
- Security features (XSS protection, safe evaluation)
- Comprehensive test coverage (75.1%)

### 🚧 Roadmap

- [ ] Find and replace functionality
- [ ] Plugin system for extensions
- [ ] Cloud sync integration
- [ ] Advanced markdown features (tables, diagrams)
- [ ] Performance optimizations

For detailed progress, see [Development Progress](./docs/02.progress-status.md).

## 🤝 Contributing

We welcome contributions! This project follows TDD methodology. Please ensure:

- Write tests for all new features
- Follow ESLint and Prettier rules
- Use TypeScript strict mode
- Maintain security principles (no `eval()`, XSS protection)
- Update documentation as needed

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests first (TDD approach)
4. Implement the feature
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 🎯 Features in Detail

### Mathematical Calculations

Type `=` followed by any mathematical expression to see instant results:

```markdown
= 2 + 2 \* 3
= sqrt(16) + pow(2, 3)
= sin(pi/2) + cos(0)
```

### Keyboard Shortcuts

| Action    | macOS         | Windows/Linux  |
| --------- | ------------- | -------------- |
| New File  | `Cmd+N`       | `Ctrl+N`       |
| Open File | `Cmd+O`       | `Ctrl+O`       |
| Save      | `Cmd+S`       | `Ctrl+S`       |
| Save As   | `Cmd+Shift+S` | `Ctrl+Shift+S` |
| Undo      | `Cmd+Z`       | `Ctrl+Z`       |
| Redo      | `Cmd+Y`       | `Ctrl+Y`       |
| Find      | `Cmd+F`       | `Ctrl+F`       |
| Replace   | `Cmd+H`       | `Ctrl+H`       |

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Team

notePlus Development Team

---

**Development Started**: 2025-01-01
**MVP Completed**: 2025-01-15
**Current Version**: 0.2.0

## 🌟 Why notePlus?

- **All-in-One**: Write notes and perform calculations in one app
- **Native Performance**: Built with Electron for native macOS experience
- **Security First**: Safe mathematical evaluation with XSS protection
- **Developer Friendly**: Open source, well-tested, and extensible
- **Modern UI**: Clean, resizable interface with dark mode support

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Please [open an issue](https://github.com/yourusername/noteplus/issues) and we'll get back to you!

## 📸 Screenshots

_Screenshots coming soon!_

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/noteplus&type=Date)](https://star-history.com/#yourusername/noteplus&Date)

---

**Made with ❤️ for the macOS community**
