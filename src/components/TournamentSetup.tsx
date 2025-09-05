import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash, Users, Shuffle } from "@phosphor-icons/react"
import { Tournament, Team, Player } from '../App'

interface TournamentSetupProps {
  tournament: Tournament
  onSave: (tournament: Tournament) => void
  onComplete: (tournament: Tournament) => void
}

function TournamentSetup({ tournament, onSave, onComplete }: TournamentSetupProps) {
  const [name, setName] = useState(tournament.name)
  const [date, setDate] = useState(tournament.date)
  const [players, setPlayers] = useState<Array<{name: string, alias: string}>>([])
  const [teams, setTeams] = useState<Team[]>(tournament.teams)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerAlias, setNewPlayerAlias] = useState('')

  const addPlayer = () => {
    if (newPlayerName.trim() && newPlayerAlias.trim()) {
      setPlayers(current => [...current, { name: newPlayerName.trim(), alias: newPlayerAlias.trim() }])
      setNewPlayerName('')
      setNewPlayerAlias('')
    }
  }

  const removePlayer = (index: number) => {
    setPlayers(current => current.filter((_, i) => i !== index))
  }

  const generateTeams = () => {
    if (players.length < 2) return
    
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5)
    const newTeams: Team[] = []
    
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        const teamPlayers: Player[] = [
          {
            id: Date.now().toString() + i,
            name: shuffledPlayers[i].name,
            alias: shuffledPlayers[i].alias,
            goals: 0
          },
          {
            id: Date.now().toString() + i + 1,
            name: shuffledPlayers[i + 1].name,
            alias: shuffledPlayers[i + 1].alias,
            goals: 0
          }
        ]
        
        newTeams.push({
          id: Date.now().toString() + i,
          name: `Team ${Math.floor(i / 2) + 1}`,
          players: teamPlayers,
          stats: {
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0
          }
        })
      }
    }
    
    setTeams(newTeams)
  }

  const generateFixtures = () => {
    if (teams.length < 2) return []
    
    const fixtures = []
    let matchId = 1
    
    // Round-robin tournament
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          id: matchId.toString(),
          team1: teams[i],
          team2: teams[j],
          score1: 0,
          score2: 0,
          status: 'pending' as const,
          round: 1,
          duration: 0,
          goals: []
        })
        matchId++
      }
    }
    
    return fixtures
  }

  const handleComplete = () => {
    const fixtures = generateFixtures()
    const completedTournament: Tournament = {
      ...tournament,
      name: name.trim(),
      date: date,
      teams,
      fixtures,
      status: 'active'
    }
    
    onComplete(completedTournament)
  }

  const canComplete = name.trim() && date && teams.length >= 2

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tournament-name">Tournament Name</Label>
            <Input
              id="tournament-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Doma Football Day"
            />
          </div>
          <div>
            <Label htmlFor="tournament-date">Date</Label>
            <Input
              id="tournament-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Player Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="player-name">Player Name</Label>
              <Input
                id="player-name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Full name"
                onKeyPress={(e) => e.key === 'Enter' && newPlayerAlias && addPlayer()}
              />
            </div>
            <div>
              <Label htmlFor="player-alias">Alias</Label>
              <Input
                id="player-alias"
                value={newPlayerAlias}
                onChange={(e) => setNewPlayerAlias(e.target.value)}
                placeholder="Nickname"
                onKeyPress={(e) => e.key === 'Enter' && newPlayerName && addPlayer()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addPlayer} disabled={!newPlayerName.trim() || !newPlayerAlias.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>

          {players.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Registered Players ({players.length})</h4>
              <div className="grid gap-2">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">{player.name}</span>
                      <span className="text-muted-foreground ml-2">({player.alias})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(index)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={generateTeams} 
                  disabled={players.length < 2}
                  variant="outline"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate Teams
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  {players.length % 2 === 1 && players.length > 0 && (
                    <Badge variant="secondary">1 player will sit out</Badge>
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Teams ({teams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team, index) => (
                <div key={team.id} className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">{team.name}</h4>
                  <div className="space-y-1">
                    {team.players.map(player => (
                      <div key={player.id} className="text-sm">
                        <span className="font-medium">{player.name}</span>
                        <span className="text-muted-foreground ml-1">({player.alias})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary">
                <strong>Tournament Format:</strong> Round-robin league with {teams.length * (teams.length - 1) / 2} matches total
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-end">
        <Button 
          variant="outline"
          onClick={() => onSave({
            ...tournament,
            name: name.trim(),
            date,
            teams
          })}
        >
          Save Draft
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={!canComplete}
          className="bg-primary hover:bg-primary/90"
        >
          Complete Setup & Generate Fixtures
        </Button>
      </div>
    </div>
  )
}

export default TournamentSetup