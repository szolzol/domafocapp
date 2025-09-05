import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, Trophy, BarChart3 } from "@phosphor-icons/react"
import { Toaster } from 'sonner'
import TournamentSetup from '@/components/TournamentSetup'
import Fixtures from '@/components/Fixtures'
import LiveMatch from '@/components/LiveMatch'
import MatchEditor from '@/components/MatchEditor'
import Statistics from '@/components/Statistics'

export interface Tournament {
  id: string
  name: string
  date: string
  status: 'setup' | 'active' | 'completed'
  teams: Team[]
  fixtures: Match[]
  rounds: number
  teamSize: number // 2v2, 3v3, 4v4, 5v5, 6v6
}

export interface Team {
  id: string
  name: string
  players: Player[]
  stats: {
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    points: number
  }
}

export interface Player {
  id: string
  name: string
  alias: string
  goals: number
  hat: 'first' | 'second' // first = strong, second = weak
}

export interface Match {
  id: string
  team1: Team
  team2: Team
  score1: number
  score2: number
  status: 'pending' | 'live' | 'completed'
  round: number
  duration: number
  goals: Goal[]
  comments: string
}

export interface Goal {
  id: string
  playerId: string
  playerName: string
  teamId: string
  minute: number
}

function App() {
  const [tournaments, setTournaments] = useKV("tournaments", [] as Tournament[])
  const [currentView, setCurrentView] = useState<'home' | 'setup' | 'fixtures' | 'match' | 'edit' | 'stats'>('home')
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const createNewTournament = () => {
    const newTournament: Tournament = {
      id: Date.now().toString(),
      name: '',
      date: '',
      status: 'setup',
      teams: [],
      fixtures: [],
      rounds: 1,
      teamSize: 2 // Default to 2v2
    }
    setSelectedTournament(newTournament)
    setCurrentView('setup')
  }

  const saveTournament = (tournament: Tournament) => {
    setTournaments(currentTournaments => {
      const existingIndex = currentTournaments.findIndex(t => t.id === tournament.id)
      if (existingIndex >= 0) {
        const updated = [...currentTournaments]
        updated[existingIndex] = tournament
        return updated
      } else {
        return [...currentTournaments, tournament]
      }
    })
    setSelectedTournament(tournament)
  }

  const selectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    if (tournament.status === 'setup') {
      setCurrentView('setup')
    } else {
      setCurrentView('fixtures')
    }
  }

  const startMatch = (match: Match) => {
    setSelectedMatch(match)
    setCurrentView('match')
  }

  const editMatch = (match: Match) => {
    setSelectedMatch(match)
    setCurrentView('edit')
  }

  const updateMatch = (updatedMatch: Match) => {
    if (!selectedTournament) return
    
    const updatedTournament = {
      ...selectedTournament,
      fixtures: selectedTournament.fixtures.map(m => 
        m.id === updatedMatch.id ? updatedMatch : m
      )
    }
    
    saveTournament(updatedTournament)
    setSelectedMatch(updatedMatch)
  }

  const renderHomeScreen = () => (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <div className="w-8 h-8 rounded-full soccer-ball"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">DomaFocApp</h1>
            <p className="text-muted-foreground">Soccer Tournament Manager</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={createNewTournament}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5" />
                Create Tournament
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Start a new 2v2 soccer tournament</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('stats')}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View tournament statistics and rankings</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Tournaments</h2>
          {tournaments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tournaments yet. Create your first tournament to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tournaments.map(tournament => (
                <Card key={tournament.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => selectTournament(tournament)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tournament.name || 'Unnamed Tournament'}</CardTitle>
                      <Badge variant={
                        tournament.status === 'setup' ? 'secondary' :
                        tournament.status === 'active' ? 'default' : 'outline'
                      }>
                        {tournament.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {tournament.date || 'No date set'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {tournament.teams.length} teams
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (currentView === 'home') return renderHomeScreen()

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => {
                setCurrentView('home')
                setSelectedTournament(null)
                setSelectedMatch(null)
              }}
              className="text-lg font-semibold"
            >
              ← DomaFocApp
            </Button>
            
            {selectedTournament && (
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{selectedTournament.name || 'Unnamed Tournament'}</h1>
                <div className="text-xs text-muted-foreground">
                  {selectedTournament.teamSize}v{selectedTournament.teamSize}
                </div>
                <div className="flex gap-2">
                  {selectedTournament.status !== 'setup' && (
                    <>
                      <Button
                        variant={currentView === 'fixtures' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentView('fixtures')}
                      >
                        Fixtures
                      </Button>
                      <Button
                        variant={currentView === 'stats' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentView('stats')}
                      >
                        Stats
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          {currentView === 'setup' && selectedTournament && (
            <TournamentSetup
              tournament={selectedTournament}
              onSave={saveTournament}
              onComplete={(tournament) => {
                saveTournament(tournament)
                setCurrentView('fixtures')
              }}
            />
          )}

          {currentView === 'fixtures' && selectedTournament && (
            <Fixtures
              tournament={selectedTournament}
              onStartMatch={startMatch}
              onEditMatch={editMatch}
              onUpdateTournament={saveTournament}
            />
          )}

          {currentView === 'match' && selectedMatch && selectedTournament && (
            <LiveMatch
              match={selectedMatch}
              tournament={selectedTournament}
              onUpdateMatch={updateMatch}
              onEndMatch={() => setCurrentView('fixtures')}
            />
          )}

          {currentView === 'edit' && selectedMatch && selectedTournament && (
            <MatchEditor
              match={selectedMatch}
              tournament={selectedTournament}
              onSave={(updatedMatch) => {
                updateMatch(updatedMatch)
                setCurrentView('fixtures')
              }}
              onCancel={() => setCurrentView('fixtures')}
            />
          )}

          {currentView === 'stats' && (
            <Statistics
              tournaments={tournaments}
              selectedTournament={selectedTournament}
            />
          )}
        </main>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          }
        }}
      />
    </>
  )
}

export default App