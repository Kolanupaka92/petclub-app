# Pet Club App

A modern React application for managing a pet club using Vite, React, and Tailwind CSS.

## Features

- ⚡ **Vite** - Fast build tool and dev server
- ⚛️ **React 19** - Latest React framework
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📦 **Modular Architecture** - Well-organized project structure

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kolanupaka92/petclub-app.git
cd petclub-app
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp .env.example .env.local
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

### Preview

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
petclub-app/
├── public/           # Static assets
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── App.jsx       # Main App component
│   ├── index.css     # Global styles
│   └── main.jsx      # Entry point
├── index.html        # HTML template
├── vite.config.js    # Vite configuration
├── tailwind.config.js # Tailwind configuration
├── postcss.config.js # PostCSS configuration
└── package.json      # Dependencies
```

## Configuration Files

- **`.gitignore`** - Specifies files to be ignored by Git
- **`.env.example`** - Template for environment variables
- **`.editorconfig`** - Standardizes coding styles across editors
- **`.prettierrc`** - Code formatting rules
- **`eslint.config.js`** - Linting rules and configuration

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Dependencies

### Runtime
- **react** - UI library
- **react-dom** - DOM rendering

### Development
- **@vitejs/plugin-react** - React plugin for Vite
- **vite** - Build tool
- **tailwindcss** - CSS framework
- **postcss** - CSS processor
- **autoprefixer** - Vendor prefixes

## License

MIT

## Author

[Kolanupaka92](https://github.com/Kolanupaka92)
