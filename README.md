# IntroMatch - Dating & Matching Web App

A modern, feature-rich dating and matching web application built with Nuxt 4, Tailwind CSS, and TypeScript. This app connects to a Laravel-based dating API with comprehensive features including user authentication, profile management, matching system, real-time chat, and venue check-ins.

## 🚀 Features

### Authentication & User Management
- ✅ User registration with email verification
- ✅ Login with email/password
- ✅ Password reset functionality
- ✅ OAuth integration (Google, Facebook)
- ✅ Profile management with avatar uploads
- ✅ User preferences and settings

### Matching & Discovery
- ✅ Smart matching algorithm based on interests and preferences
- ✅ Profile browsing and discovery
- ✅ Like/pass system
- ✅ Match notifications
- ✅ Similarity breakdown display

### Messaging & Chat
- ✅ Real-time messaging integration
- ✅ Chat channels
- ✅ Message notifications
- ✅ Read receipts

### Location & Venues
- ✅ Venue search and discovery
- ✅ Venue check-ins
- ✅ Nearby matches
- ✅ Distance-based filtering

### Profile Customization
- ✅ Interests selection
- ✅ Attributes management
- ✅ Preferences configuration
- ✅ Deal-breakers definition
- ✅ Photo gallery management

## 🛠️ Tech Stack

### Frontend
- **Nuxt 4** - Vue.js framework with SSR support
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management
- **VueUse** - Collection of Vue composition utilities
- **Day.js** - Date manipulation library
- **Zod** - Schema validation

### Testing
- **Playwright** - End-to-end testing framework
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile viewport testing
- Accessibility testing

### Design System
- Custom UI component library
- Responsive design patterns
- Modern blue color scheme
- Gradient elements and smooth animations

## 📁 Project Structure

```
web-app/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   ├── Card.vue
│   │   ├── Avatar.vue
│   │   ├── Modal.vue
│   │   ├── Badge.vue
│   │   └── SelectionPill.vue
│   ├── AppHeader.vue       # Global header component
│   └── AppFooter.vue       # Global footer component
├── composables/
│   ├── useApi.ts          # API client wrapper
│   ├── useAuth.ts         # Authentication logic
│   ├── useProfile.ts      # Profile management
│   └── useMatches.ts      # Matching logic
├── layouts/
│   └── default.vue        # Default layout with header/footer
├── middleware/
│   └── auth.ts            # Authentication middleware
├── pages/
│   ├── index.vue          # Landing page
│   ├── login.vue          # Login page
│   ├── register.vue       # Registration page
│   └── dashboard.vue      # User dashboard
├── plugins/
│   └── api.ts             # API plugin initialization
├── stores/
│   ├── auth.ts            # Auth state management
│   ├── profile.ts         # Profile state
│   └── matches.ts         # Matches state
├── tests/
│   ├── auth.spec.ts       # Authentication tests
│   ├── navigation.spec.ts # Navigation tests
│   ├── responsive.spec.ts # Responsive design tests
│   └── accessibility.spec.ts # Accessibility tests
├── types/
│   ├── api.ts             # API response types
│   ├── user.ts            # User and profile types
│   ├── match.ts           # Match types
│   ├── chat.ts            # Chat types
│   └── venue.ts           # Venue types
├── nuxt.config.ts         # Nuxt configuration
├── tailwind.config.js     # Tailwind configuration
├── playwright.config.ts   # Playwright configuration
└── package.json           # Dependencies
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Laravel API running at `http://localhost:8000`

### Installation

1. **Clone the repository**
```bash
cd /Developer/intro/web-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` and set:
```env
NUXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
```

4. **Run development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## 🧪 Testing

### Run all tests
```bash
npm run test
```

### Run tests with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npx playwright test tests/auth.spec.ts
```

### Debug tests
```bash
npx playwright test --debug
```

## 📋 API Integration

This web app connects to a Laravel API with the following endpoints:

### Authentication (`/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Matches (`/match`)
- `GET /matches` - Get user matches
- `GET /matches/{id}` - Get match details
- `POST /reveals` - Reveal profile to user

### Chat (`/chat`)
- `GET /channels` - Get chat channels
- `GET /channels/{id}/messages` - Get messages
- `POST /channels/{id}/messages` - Send message

### Venues (`/venue`)
- `GET /search` - Search venues
- `GET /nearby` - Get nearby venues
- `POST /checkins` - Check in to venue

See the [API Documentation](../api/README.md) for complete API details.

## 🎨 Design System

### Colors
- **Primary Blue**: `#0050FF` - Main brand color
- **Accent Cyan**: `#00D9FF` - Accent color
- **Gradients**: Blue to cyan for icons and highlights

### Components
All components follow a consistent design pattern:
- Rounded corners (20-24px radius)
- Smooth transitions and hover effects
- Responsive grid layouts
- Accessible by default

### Typography
- Headlines: Bold, 24-28px
- Body: Regular, 16px
- Captions: 14px

## 🔐 Security

- All authentication uses token-based auth (localStorage)
- CORS enabled for API requests
- Protected routes with middleware
- Input validation on all forms
- XSS protection through Vue's built-in sanitization

## 📱 Responsive Design

The app is fully responsive and tested across:
- **Mobile**: 375px (iPhone)
- **Tablet**: 768px (iPad)
- **Desktop**: 1920px (HD)

## ♿ Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance

## 🔄 State Management

Using Pinia stores for:
- **Auth Store**: User authentication state
- **Profile Store**: User profile data
- **Matches Store**: Matches and likes
- **Chat Store**: Messages and channels

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run generate` - Generate static site
- `npm run preview` - Preview production build
- `npm run test` - Run Playwright tests
- `npm run test:ui` - Run tests in UI mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

Built with ❤️ by the IntroMatch team

## 🐛 Known Issues

- Auth token refresh needs implementation
- Some mobile animations need optimization
- Profile photo upload progress indicator needed

## 🗺️ Roadmap

- [ ] Implement chat real-time updates via Ably
- [ ] Add video call integration
- [ ] Implement push notifications
- [ ] Add advanced filtering options
- [ ] Build mobile apps (React Native)
- [ ] Add AI-powered match suggestions
- [ ] Implement gamification features
- [ ] Add premium subscription tiers

## 📞 Support

For support, email support@intromatch.com or join our Slack channel.

---

**Made with Nuxt 4, Tailwind CSS, and lots of ☕**
