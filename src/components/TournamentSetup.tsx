import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash, Users, Shuffle, Edit2 } from "@phosphor-icons/react"
import { Tournament, Team, Player } from '../App'

interface TournamentSetupProps {
  tournament: Tournament
  onSave: (tournament: Tournament) => void
  onComplete: (tournament: Tournament) => void
}

function TournamentSetup({ tournament, onSave, onComplete }: TournamentSetupProps) {
  const [name, setName] = useState(tournament.name)
  const [date, setDate] = useState(tournament.date)
  const [rounds, setRounds] = useState(tournament.rounds || 1)
  const [players, setPlayers] = useState<Array<{name: string, hat: 'first' | 'second'}>>([])
  const [teams, setTeams] = useState<Team[]>(tournament.teams)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerHat, setNewPlayerHat] = useState<'first' | 'second'>('first')
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editPlayerAliases, setEditPlayerAliases] = useState<{[playerId: string]: string}>({})

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers(current => [...current, { name: newPlayerName.trim(), hat: newPlayerHat }])
      setNewPlayerName('')
      setNewPlayerHat('first')
    }
  }

  const removePlayer = (index: number) => {
    setPlayers(current => current.filter((_, i) => i !== index))
  }

  const generateTeams = () => {
    if (players.length < 2) return
    
    // Separate players by hat (skill level)
    const firstHat = players.filter(p => p.hat === 'first')
    const secondHat = players.filter(p => p.hat === 'second')
    
    // Shuffle each group
    const shuffledFirst = [...firstHat].sort(() => Math.random() - 0.5)
    const shuffledSecond = [...secondHat].sort(() => Math.random() - 0.5)
    
    const newTeams: Team[] = []
    const minTeams = Math.min(shuffledFirst.length, shuffledSecond.length)
    
    // Create balanced teams (1 first hat + 1 second hat)
    for (let i = 0; i < minTeams; i++) {
      const teamPlayers: Player[] = [
        {
          id: `${Date.now()}_${i}_0`,
          name: shuffledFirst[i].name,
          alias: shuffledFirst[i].name, // Default alias to name
          goals: 0,
          hat: 'first'
        },
        {
          id: `${Date.now()}_${i}_1`,
          name: shuffledSecond[i].name,
          alias: shuffledSecond[i].name, // Default alias to name
          goals: 0,
          hat: 'second'
        }
      ]
      
      newTeams.push({
        id: `team_${Date.now()}_${i}`,
        name: `Team ${i + 1}`,
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
    
    // Handle remaining players if uneven numbers
    const remainingFirst = shuffledFirst.slice(minTeams)
    const remainingSecond = shuffledSecond.slice(minTeams)
    const allRemaining = [...remainingFirst, ...remainingSecond]
    
    // Pair remaining players
    for (let i = 0; i < allRemaining.length; i += 2) {
      if (i + 1 < allRemaining.length) {
        const teamPlayers: Player[] = [
          {
            id: `${Date.now()}_extra_${i}_0`,
            name: allRemaining[i].name,
            alias: allRemaining[i].name,
            goals: 0,
            hat: allRemaining[i].hat
          },
          {
            id: `${Date.now()}_extra_${i}_1`,
            name: allRemaining[i + 1].name,
            alias: allRemaining[i + 1].name,
            goals: 0,
            hat: allRemaining[i + 1].hat
          }
        ]
        
        newTeams.push({
          id: `team_extra_${Date.now()}_${i}`,
          name: `Team ${newTeams.length + 1}`,
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

  const openTeamEditor = (team: Team) => {
    setEditingTeam(team)
    setEditTeamName(team.name)
    const aliases: {[playerId: string]: string} = {}
    team.players.forEach(player => {
      aliases[player.id] = player.alias
    })
    setEditPlayerAliases(aliases)
  }

  const saveTeamEdits = () => {
    if (!editingTeam) return
    
    const updatedTeams = teams.map(team => {
      if (team.id === editingTeam.id) {
        return {
          ...team,
          name: editTeamName.trim() || team.name,
          players: team.players.map(player => ({
            ...player,
            alias: editPlayerAliases[player.id] || player.alias
          }))
        }
      }
      return team
    })
    
    setTeams(updatedTeams)
    setEditingTeam(null)
    setEditTeamName('')
    setEditPlayerAliases({})
  }

  const generateFixtures = () => {
    if (teams.length < 2) return []
    
    const fixtures = []
    let matchId = 1
    
    // Generate round-robin tournament for specified number of rounds
    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          fixtures.push({
            id: matchId.toString(),
            team1: teams[i],
            team2: teams[j],
            score1: 0,
            score2: 0,
            status: 'pending' as const,
            round: round,
            duration: 0,
            goals: [],
            comments: ''
          })
          matchId++
        }
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
      rounds: rounds,
      teams,
      fixtures,
      status: 'active'
    }
    
    onComplete(completedTournament)
  }

  const canComplete = name.trim() && date && teams.length >= 2
  const firstHatCount = players.filter(p => p.hat === 'first').length
  const secondHatCount = players.filter(p => p.hat === 'second').length

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
          <div>
            <Label htmlFor="tournament-rounds">Number of Rounds</Label>
            <Select value={rounds.toString()} onValueChange={(value) => setRounds(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select number of rounds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Round (each team plays once)</SelectItem>
                <SelectItem value="2">2 Rounds (each team plays twice)</SelectItem>
                <SelectItem value="3">3 Rounds (each team plays three times)</SelectItem>
                <SelectItem value="4">4 Rounds (each team plays four times)</SelectItem>
              </SelectContent>
            </Select>
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
                onKeyPress={(e) => e.key === 'Enter' && newPlayerName.trim() && addPlayer()}
              />
            </div>
            <div>
              <Label htmlFor="player-hat">Skill Level</Label>
              <Select value={newPlayerHat} onValueChange={(value: 'first' | 'second') => setNewPlayerHat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Hat (Strong)</SelectItem>
                  <SelectItem value="second">Second Hat (Weak)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addPlayer} disabled={!newPlayerName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>

          {players.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Registered Players ({players.length})</h4>
                <div className="flex gap-2">
                  <Badge variant="outline">First Hat: {firstHatCount}</Badge>
                  <Badge variant="outline">Second Hat: {secondHatCount}</Badge>
                </div>
              </div>
              <div className="grid gap-2">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{player.name}</span>
                      <Badge variant={player.hat === 'first' ? 'default' : 'secondary'}>
                        {player.hat === 'first' ? 'Strong' : 'Weak'}
                      </Badge>
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
                  Generate Balanced Teams
                </Button>
                <span className="text-sm text-muted-foreground flex items-center">
                  {players.length % 2 === 1 && players.length > 0 && (
                    <Badge variant="secondary">1 player will sit out</Badge>
                  )}
                </span>
              </div>
              
              {Math.abs(firstHatCount - secondHatCount) > 1 && players.length > 2 && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Uneven skill distribution. Teams will be balanced as much as possible.
                  </p>
                </div>
              )}
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
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{team.name}</h4>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openTeamEditor(team)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Team</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="team-name">Team Name</Label>
                            <Input
                              id="team-name"
                              value={editTeamName}
                              onChange={(e) => setEditTeamName(e.target.value)}
                              placeholder="Enter team name"
                            />
                          </div>
                          <div>
                            <Label>Player Aliases</Label>
                            <div className="space-y-2 mt-2">
                              {editingTeam?.players.map(player => (
                                <div key={player.id}>
                                  <Label className="text-sm text-muted-foreground">{player.name}</Label>
                                  <Input
                                    value={editPlayerAliases[player.id] || ''}
                                    onChange={(e) => setEditPlayerAliases(prev => ({
                                      ...prev,
                                      [player.id]: e.target.value
                                    }))}
                                    placeholder="Enter alias"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <DialogTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogTrigger>
                            <DialogTrigger asChild>
                              <Button onClick={saveTeamEdits}>Save Changes</Button>
                            </DialogTrigger>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-1">
                    {team.players.map(player => (
                      <div key={player.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{player.name}</span>
                          <span className="text-muted-foreground ml-1">({player.alias})</span>
                        </div>
                        <Badge 
                          variant={player.hat === 'first' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {player.hat === 'first' ? 'S' : 'W'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary">
                <strong>Tournament Format:</strong> {rounds} round{rounds > 1 ? 's' : ''} with {teams.length * (teams.length - 1) / 2 * rounds} matches total
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
            rounds,
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