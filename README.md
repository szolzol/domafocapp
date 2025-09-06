# ⚽ DomaFocApp - Soccer Tournament Management System

A comprehensive soccer tournament management application built with **GitHub Spark**, **React 18**, and **TypeScript**. Create, manage, and track soccer tournaments with real-time match scoring, team balancing, and detailed statistics.

## 🚀 Features

### Tournament Management
- **Complete Tournament Setup**: Create tournaments with custom team sizes (2v2 to 6v6)
- **Flexible Rounds**: Support for 1-4 rounds with automatic fixture generation
- **Team Auto-Generation**: Intelligent team balancing based on player skill levels
- **Half-Time Support**: Optional half-time breaks for longer matches

### Live Match Tracking
- **Real-Time Timer**: Match timer with milestone notifications
- **Goal Tracking**: Record goals with player attribution and timestamps
- **Sound Integration**: Audio notifications for goals and match events
- **Match Comments**: Add notes and observations during matches

### Data Management
- **Local Storage**: All data persists locally using GitHub Spark's useKV hook
- **CSV Import**: Bulk import tournament data from CSV files
- **Data Export**: Export tournament statistics and results
- **Backup & Restore**: Tournament data is automatically saved

### Statistics & Analytics
- **Live League Tables**: Real-time standings with points, goals, and match statistics
- **Player Statistics**: Individual player goal counts and performance metrics
- **Tournament Analytics**: Comprehensive tournament overview and insights
- **Visual Charts**: Data visualization for better insights

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.3.5 with hot module replacement
- **UI Components**: Radix UI with shadcn/ui styling system
- **Styling**: Tailwind CSS v4 with custom theme system
- **Icons**: Lucide React icons
- **Notifications**: Sonner toast system
- **Data Persistence**: GitHub Spark useKV hook with JSON serialization
- **Platform**: GitHub Spark v0.39.0

## 🏗️ Data Storage Architecture

### GitHub Spark useKV Hook
The application uses GitHub Spark's `useKV` hook for persistent data storage:

```typescript
const [tournamentsJSON, setTournamentsJSON] = useKV("tournaments", "[]");
```

### Data Serialization Pattern
Since `useKV` only accepts JSON-serializable strings, the app implements a wrapper pattern:

```typescript
// Store tournaments as JSON strings
const tournaments: Tournament[] = tournamentsJSON ? JSON.parse(tournamentsJSON) : [];

// Update function with JSON serialization
const setTournaments = (newTournaments: Tournament[] | ((current: Tournament[]) => Tournament[])) => {
  const tournamentsToSet = typeof newTournaments === 'function' ? newTournaments(tournaments) : newTournaments;
  setTournamentsJSON(JSON.stringify(tournamentsToSet));
};
```

### Data Models
```typescript
interface Tournament {
  id: string;
  name: string;
  date: string;
  status: "setup" | "active" | "completed";
  teams: Team[];
  fixtures: Match[];
  rounds: number;
  teamSize: number; // 2v2, 3v3, 4v4, 5v5, 6v6
  hasHalfTime: boolean;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
  stats: TeamStats;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  score1: number;
  score2: number;
  status: "pending" | "active" | "completed";
  round: number;
  duration: number;
  goals: Goal[];
  comments: string;
}
```

### Storage Benefits
- **No External Dependencies**: Pure client-side storage
- **Automatic Persistence**: Data survives browser refreshes
- **Type Safety**: Full TypeScript support with proper serialization
- **Performance**: Fast local access with JSON caching

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/szolzol/domafocapp
   cd domafocapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   Navigate to `http://localhost:5002` in your browser

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check

# Lint code
npm run lint
```

## 📊 Usage Guide

### Creating a Tournament
1. Click "Create New Tournament" on the home screen
2. Fill in tournament details (name, date, rounds, team size)
3. Add players with skill level designation (Strong/Weak)
4. Generate balanced teams automatically
5. Complete setup to generate fixtures

### Managing Matches
1. Navigate to "Fixtures" tab in an active tournament
2. Click "Start Match" to begin live tracking
3. Use timer controls to start/pause/stop match timer
4. Record goals in real-time with player attribution
5. Add match comments and observations
6. Complete match to update league standings

### Importing Data
1. Click "Import Data" on the home screen
2. Upload CSV file with tournament data
3. Map columns to tournament fields
4. Preview imported tournaments
5. Confirm import to add to your tournaments

## 🎮 Key Components

### TournamentSetup.tsx
- Tournament configuration and team generation
- Player registration with skill balancing
- Fixture generation with round-robin algorithm

### LiveMatch.tsx  
- Real-time match timer with milestone notifications
- Goal recording with player and time attribution
- Half-time break support
- Sound integration for match events

### Fixtures.tsx
- Fixture display and management
- League table calculation and display
- Match status tracking and updates

### Statistics.tsx
- Tournament analytics and insights
- Player performance statistics
- Data visualization and reporting

### DataImporter.tsx
- CSV import functionality
- Data mapping and validation
- Bulk tournament creation

## 🔧 Configuration

### Tailwind CSS v4 Theme
The app uses a custom theme system with CSS variables:

```css
/* src/styles/theme.css */
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #16a34a;
  --secondary: #f1f5f9;
  /* ... more theme variables */
}
```

### Sound Integration
Audio notifications are handled through a centralized sound service for consistent user experience.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GitHub Spark** for the excellent development platform
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first styling approach
- **Lucide** for the beautiful icon set
- Soccer community for inspiration and feedback

---

Built with ❤️ using GitHub Spark | Perfect for local soccer tournaments and friendly competitions
