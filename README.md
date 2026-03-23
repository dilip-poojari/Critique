# CritFull - UX Design Critique & Review Tool

A professional-grade UX design critique tool powered by Claude AI, built with React and following IBM's Carbon Design System principles.

## Features

- 🎨 **Multi-Input Support**: Upload screenshots, provide URLs, or link Figma files
- 🤖 **AI-Powered Analysis**: Leverages Claude Sonnet 4 for comprehensive design critique
- ♿ **Accessibility Focus**: WCAG 2.2 compliance checking with detailed recommendations
- 🏗️ **Carbon Design System**: Evaluates adherence to IBM's design system
- 📊 **Comprehensive Scoring**: 7 category breakdown including accessibility, heuristics, and UX laws
- 🔍 **Heuristic Evaluation**: Nielsen's 10 Usability Heuristics + Weinschenk & Barker's 20 classifications
- ⚖️ **UX Laws**: Evaluates against Fitts' Law, Hick's Law, Miller's Law, and more
- 📋 **Export Options**: Copy as Markdown or print as PDF
- 📚 **Review History**: Tracks last 5 reviews for comparison

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Configuration

1. Open the application
2. Click "Configure API Key"
3. Enter your Anthropic API key
4. The key is stored locally in your browser

## Usage

1. **Choose Input Method**: Screenshot upload, URL, or Figma link
2. **Add Context** (Optional): Describe the design purpose and target users
3. **Run Critique**: Click the button to analyze
4. **Review Results**: Get detailed scores, issues, and recommendations
5. **Export**: Copy as Markdown or print as PDF

## Technology Stack

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Anthropic Claude AI**: Design analysis engine
- **IBM Plex Fonts**: Typography
- **CSS Variables**: IBM Carbon color tokens

## Design Philosophy

Built with an editorial/magazine aesthetic inspired by IBM Design Language and Bauhaus precision. Dark mode first with Carbon-inspired colors and sharp typographic hierarchy.

## License

MIT

## Credits

- Powered by [Anthropic Claude](https://www.anthropic.com/)
- Design principles from [Carbon Design System](https://carbondesignsystem.com/)
- Accessibility guidelines from [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- UX laws from [Laws of UX](https://lawsofux.com/)