import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Users, Calendar } from "@phosphor-icons/react"
import { Tournament, Player } from '@/App'

interface StatisticsProps {
  tournaments: Tournament[]
  selectedTournament?: Tournament | null
}

function Statistics({ tournaments, selectedTournament }: StatisticsProps) {
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current')
  
  const activeTournaments = tournaments.filter(t => t.status === 'active' || t.status === 'completed')
  const currentTournament = selectedTournament || activeTournaments[activeTournaments.length - 1]
  
  const calculatePlayerStats = (tournament?: Tournament) => {
    const tournamentsToAnalyze = tournament ? [tournament] : activeTournaments
    const playerStats = new Map<string, {
      player: Player
      tournaments: number
      goals: number
      matches: number
      wins: number
      draws: number
      losses: number
    }>()

    tournamentsToAnalyze.forEach(t => {
      t.teams.forEach(team => {
        team.players.forEach(player => {
          const existing = playerStats.get(player.id) || {
            player,
            tournaments: 0,
            goals: 0,
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0
          }

          const teamMatches = t.fixtures.filter(m => 
            m.status === 'completed' && (m.team1.id === team.id || m.team2.id === team.id)
          )

          const playerGoals = t.fixtures.reduce((acc, match) => {
            return acc + match.goals.filter(g => g.playerId === player.id).length
          }, 0)

          teamMatches.forEach(match => {
            const isTeam1 = match.team1.id === team.id
            const teamScore = isTeam1 ? match.score1 : match.score2
            const opponentScore = isTeam1 ? match.score2 : match.score1

            if (teamScore > opponentScore) existing.wins++
            else if (teamScore === opponentScore) existing.draws++
            else existing.losses++
          })

          existing.tournaments = tournament ? 1 : existing.tournaments + 1
          existing.goals += playerGoals
          existing.matches += teamMatches.length
          
          playerStats.set(player.id, existing)
        })
      })
    })

    return Array.from(playerStats.values()).sort((a, b) => b.goals - a.goals)
  }

  const calculateTeamStats = (tournament?: Tournament) => {
    const tournamentsToAnalyze = tournament ? [tournament] : activeTournaments
    const teamStats = new Map()

    tournamentsToAnalyze.forEach(t => {
      t.teams.forEach(team => {
        const matches = t.fixtures.filter(m => 
          m.status === 'completed' && (m.team1.id === team.id || m.team2.id === team.id)
        )

        let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0

        matches.forEach(match => {
          const isTeam1 = match.team1.id === team.id
          const teamScore = isTeam1 ? match.score1 : match.score2
          const opponentScore = isTeam1 ? match.score2 : match.score1

          goalsFor += teamScore
          goalsAgainst += opponentScore

          if (teamScore > opponentScore) wins++
          else if (teamScore === opponentScore) draws++
          else losses++
        })

        const points = wins * 3 + draws

        teamStats.set(team.id, {
          team,
          matches: matches.length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference: goalsFor - goalsAgainst,
          points
        })
      })
    })

    return Array.from(teamStats.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
  }

  const playerStats = calculatePlayerStats(viewMode === 'current' ? currentTournament : undefined)
  const teamStats = calculateTeamStats(viewMode === 'current' ? currentTournament : undefined)

  const totalGoals = activeTournaments.reduce((acc, t) => 
    acc + t.fixtures.reduce((matchAcc, m) => matchAcc + m.score1 + m.score2, 0), 0
  )

  const totalMatches = activeTournaments.reduce((acc, t) => 
    acc + t.fixtures.filter(m => m.status === 'completed').length, 0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tournament Statistics</h1>
        
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(value: 'current' | 'all') => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Tournament</SelectItem>
              <SelectItem value="all">All Tournaments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'current' && currentTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {currentTournament.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentTournament.teams.length}</div>
                <div className="text-sm text-muted-foreground">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentTournament.fixtures.filter(m => m.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Matches Played</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentTournament.fixtures.reduce((acc, m) => acc + m.score1 + m.score2, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentTournament.date}</div>
                <div className="text-sm text-muted-foreground">Date</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Overall Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{activeTournaments.length}</div>
                <div className="text-sm text-muted-foreground">Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalMatches}</div>
                <div className="text-sm text-muted-foreground">Total Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalGoals}</div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">Goals per Match</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Scorers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playerStats.slice(0, 10).map((stat, index) => (
                <div key={stat.player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-accent text-accent-foreground' :
                      index === 1 ? 'bg-secondary text-secondary-foreground' :
                      index === 2 ? 'bg-muted text-muted-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{stat.player.alias}</div>
                      <div className="text-xs text-muted-foreground">{stat.player.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stat.goals}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.matches} matches
                    </div>
                  </div>
                </div>
              ))}
              
              {playerStats.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No player statistics available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamStats.slice(0, 10).map((stat, index) => (
                <div key={stat.team.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-accent text-accent-foreground' :
                      index === 1 ? 'bg-secondary text-secondary-foreground' :
                      index === 2 ? 'bg-muted text-muted-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{stat.team.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.wins}W {stat.draws}D {stat.losses}L
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stat.points}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.goalDifference > 0 ? '+' : ''}{stat.goalDifference} GD
                    </div>
                  </div>
                </div>
              ))}
              
              {teamStats.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No team statistics available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Statistics