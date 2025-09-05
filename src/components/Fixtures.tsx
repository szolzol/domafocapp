import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Eye, Edit } from "@phosphor-icons/react"
import { Tournament, Match, Team } from '../App'

interface FixturesProps {
  tournament: Tournament
  onStartMatch: (match: Match) => void
  onUpdateTournament: (tournament: Tournament) => void
  onEditMatch?: (match: Match) => void
}

function Fixtures({ tournament, onStartMatch, onUpdateTournament, onEditMatch }: FixturesProps) {
  const calculateLeagueTable = () => {
    const table = tournament.teams.map(team => ({
      ...team,
      stats: {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      }
    }))

    tournament.fixtures.forEach(match => {
      if (match.status === 'completed') {
        const team1Index = table.findIndex(t => t.id === match.team1.id)
        const team2Index = table.findIndex(t => t.id === match.team2.id)
        
        if (team1Index >= 0 && team2Index >= 0) {
          table[team1Index].stats.played++
          table[team2Index].stats.played++
          table[team1Index].stats.goalsFor += match.score1
          table[team1Index].stats.goalsAgainst += match.score2
          table[team2Index].stats.goalsFor += match.score2
          table[team2Index].stats.goalsAgainst += match.score1

          if (match.score1 > match.score2) {
            table[team1Index].stats.won++
            table[team1Index].stats.points += 3
            table[team2Index].stats.lost++
          } else if (match.score2 > match.score1) {
            table[team2Index].stats.won++
            table[team2Index].stats.points += 3
            table[team1Index].stats.lost++
          } else {
            table[team1Index].stats.drawn++
            table[team2Index].stats.drawn++
            table[team1Index].stats.points += 1
            table[team2Index].stats.points += 1
          }
        }
      }
    })

    return table.sort((a, b) => {
      if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points
      const aGD = a.stats.goalsFor - a.stats.goalsAgainst
      const bGD = b.stats.goalsFor - b.stats.goalsAgainst
      if (bGD !== aGD) return bGD - aGD
      return b.stats.goalsFor - a.stats.goalsFor
    })
  }

  const leagueTable = calculateLeagueTable()
  const completedMatches = tournament.fixtures.filter(m => m.status === 'completed').length
  const totalMatches = tournament.fixtures.length
  const isComplete = completedMatches === totalMatches

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fixtures</CardTitle>
                <Badge variant={isComplete ? "default" : "secondary"}>
                  {completedMatches}/{totalMatches} completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournament.fixtures.map((match) => (
                <div
                  key={match.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    match.status === 'completed' 
                      ? 'bg-muted border-border' 
                      : match.status === 'live'
                      ? 'bg-accent/10 border-accent'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{match.team1.name}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-medium">{match.team2.name}</span>
                        </div>
                        
                        {match.status === 'completed' && (
                          <div className="text-lg font-bold">
                            {match.score1} - {match.score2}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={
                          match.status === 'pending' ? 'secondary' :
                          match.status === 'live' ? 'default' : 'outline'
                        }>
                          {match.status}
                        </Badge>
                        
                        <Badge variant="outline">Round {match.round}</Badge>
                        
                        {tournament.hasHalfTime && (
                          <Badge variant="outline" className="text-xs">With Half-Time</Badge>
                        )}
                        
                        {match.status === 'completed' && (
                          <span>{Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')} duration</span>
                        )}
                        
                        {match.comments && (
                          <span className="italic">"{match.comments}"</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {match.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => onStartMatch(match)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {match.status === 'live' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onStartMatch(match)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Live
                        </Button>
                      )}
                      
                      {match.status === 'completed' && onEditMatch && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onEditMatch(match)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {tournament.fixtures.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No fixtures generated yet. Complete tournament setup first.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>League Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-9 gap-3 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <span className="col-span-4">Team</span>
                  <span className="text-center">P</span>
                  <span className="text-center">W</span>
                  <span className="text-center">D</span>
                  <span className="text-center">L</span>
                  <span className="text-center">Pts</span>
                </div>
                
                {leagueTable.map((team, index) => (
                  <div key={team.id} className="grid grid-cols-9 gap-3 py-2 text-sm">
                    <div className="col-span-4 flex items-center gap-2">
                      <span className="text-muted-foreground font-mono text-xs w-4 flex-shrink-0">
                        {index + 1}.
                      </span>
                      <span className="font-medium" title={team.name}>{team.name}</span>
                    </div>
                    <span className="text-center">{team.stats.played}</span>
                    <span className="text-center">{team.stats.won}</span>
                    <span className="text-center">{team.stats.drawn}</span>
                    <span className="text-center">{team.stats.lost}</span>
                    <span className="text-center font-bold">{team.stats.points}</span>
                  </div>
                ))}
              </div>
              
              {leagueTable.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Table will update as matches are completed
                </div>
              )}
            </CardContent>
          </Card>
          
          {isComplete && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-accent">🏆 Tournament Complete!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Winner:</span>
                    <span className="font-bold text-accent">{leagueTable[0]?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Points:</span>
                    <span>{leagueTable[0]?.stats.points}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Fixtures