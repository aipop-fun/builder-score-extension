# Builder Score Extension

A powerful Chrome extension that seamlessly integrates Builder Score metrics into social media platforms, providing real-time insights about Web3 builders and their contributions.

## Features

- **Real-time Score Display**: Automatically displays Builder Scores on Twitter and Warpcast profiles
- **Interactive Badges**: Clickable badges showing detailed builder metrics
- **Score Verification**: Visual indication of verified builder accounts
- **Profile Analytics**: Comprehensive view of builder activity, identity, and skills scores
- **Social Integration**: Support for multiple platforms (Twitter, Warpcast) with platform-specific UI adaptations
- **Caching System**: Efficient data management with 24-hour cache duration
- **Rate Limiting**: Smart request handling with automatic retries and rate limit management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/aipopfun/builder-score-extension.git
cd builder-score-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from your project

## Development

Run the development build with hot reload:
```bash
npm run dev
```

### Technical Stack

- **TypeScript**: Type-safe development
- **React**: Component-based UI development
- **Tailwind CSS**: Utility-first styling
- **Webpack**: Module bundling
- **Chrome Extension API**: Browser integration
- **Zustand**: State management
- **Framer Motion**: Animations

## Configuration

The extension uses several configuration objects that can be modified in the source code:

```typescript
const CONFIG = {
  DEBUG: true,
  MUTATION_DEBOUNCE: 500,
  BADGE_UPDATE_COOLDOWN: 2000,
  // ... other configurations
}

const API_CONFIG = {
  BASE_URL: 'http://talent.aipop.fun/api/passport',
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  // ... other API configurations
}
```

## Features in Detail

### Badge System
- Dynamic score display
- Visual verification indicators
- Interactive click handlers
- Smooth hover effects
- Platform-specific styling

### Data Management
- Efficient caching system
- Rate limit handling
- Retry mechanism
- Error handling
- Request queuing

### UI Components
- Score badges
- Detailed popup views
- Platform-specific adaptations
- Responsive design

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

- [codingsh](https://twitter.com/codingsh)

## Acknowledgments

- Built with React and TypeScript
- Styled with Tailwind CSS
- Powered by Chrome Extension APIs
- Special thanks to all contributors