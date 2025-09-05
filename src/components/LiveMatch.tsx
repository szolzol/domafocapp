import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Plus, Minus } from "@phosphor-icons/react"
import { Tournament, Match, Goal, Player } from '../App'

interface LiveMatchProps {
  match: Match
  tournament: Tournament
  onUpdateMatch: (match: Match) => void
  onEndMatch: () => void
}

function LiveMatch({ match, tournament, onUpdateMatch, onEndMatch }: LiveMatchProps) {
  const [isRunning, setIsRunning] = useState(match.status === 'live')
  const [time, setTime] = useState(match.duration)
  const [score1, setScore1] = useState(match.score1)
  const [score2, setScore2] = useState(match.score2)
  const [goals, setGoals] = useState<Goal[]>(match.goals)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startMatch = () => {
    setIsRunning(true)
    const updatedMatch = { ...match, status: 'live' as const }
    onUpdateMatch(updatedMatch)
  }

  const pauseMatch = () => {
    setIsRunning(false)
  }

  const addGoal = (teamId: string, playerId: string) => {
    const player = tournament.teams
      .find(t => t.id === teamId)
      ?.players.find(p => p.id === playerId)
    
    if (!player) return

    const newGoal: Goal = {
      id: Date.now().toString(),
      playerId: player.id,
      playerName: player.alias,
      teamId: teamId,
      minute: Math.floor(time / 60)
    }

    const updatedGoals = [...goals, newGoal]
    setGoals(updatedGoals)

    if (teamId === match.team1.id) {
      setScore1(prev => prev + 1)
    } else {
      setScore2(prev => prev + 1)
    }
  }

  const removeLastGoal = (teamId: string) => {
    const teamGoals = goals.filter(g => g.teamId === teamId)
    if (teamGoals.length === 0) return

    const lastGoal = teamGoals[teamGoals.length - 1]
    const updatedGoals = goals.filter(g => g.id !== lastGoal.id)
    setGoals(updatedGoals)

    if (teamId === match.team1.id) {
      setScore1(prev => Math.max(0, prev - 1))
    } else {
      setScore2(prev => Math.max(0, prev - 1))
    }
  }

  const endMatch = () => {
    setIsRunning(false)
    
    const finalMatch: Match = {
      ...match,
      status: 'completed',
      duration: time,
      score1,
      score2,
      goals
    }
    
    onUpdateMatch(finalMatch)
    onEndMatch()
  }

  const team1Goals = goals.filter(g => g.teamId === match.team1.id)
  const team2Goals = goals.filter(g => g.teamId === match.team2.id)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Live Match</CardTitle>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "LIVE" : "PAUSED"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold mb-2">{formatTime(time)}</div>
            <div className="flex gap-4 justify-center">
              {match.status === 'pending' && !isRunning && (
                <Button onClick={startMatch} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Start Match
                </Button>
              )}
              
              {isRunning && (
                <Button onClick={pauseMatch} variant="outline" size="lg">
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              {!isRunning && match.status === 'live' && (
                <Button onClick={() => setIsRunning(true)} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              
              {time > 0 && (
                <Button onClick={endMatch} variant="destructive" size="lg">
                  <Square className="w-5 h-5 mr-2" />
                  End Match
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8 items-center">
            <Card>
              <CardHeader className="text-center pb-3">
                <CardTitle className="text-xl">{match.team1.name}</CardTitle>
                <div className="text-4xl font-bold text-primary">{score1}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {match.team1.players.map(player => (
                    <div key={player.id} className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addGoal(match.team1.id, player.id)}
                        disabled={!isRunning}
                        className="flex-1 mr-2"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {player.alias}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLastGoal(match.team1.id)}
                  disabled={team1Goals.length === 0}
                  className="w-full"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Undo Last Goal
                </Button>
                
                {team1Goals.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium mb-1">Goals:</div>
                    {team1Goals.map(goal => (
                      <div key={goal.id} className="flex justify-between">
                        <span>{goal.playerName}</span>
                        <span>{goal.minute}'</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground mb-2">VS</div>
              <div className="text-lg text-muted-foreground">
                Round {match.round}
              </div>
            </div>
            
            <Card>
              <CardHeader className="text-center pb-3">
                <CardTitle className="text-xl">{match.team2.name}</CardTitle>
                <div className="text-4xl font-bold text-primary">{score2}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {match.team2.players.map(player => (
                    <div key={player.id} className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addGoal(match.team2.id, player.id)}
                        disabled={!isRunning}
                        className="flex-1 mr-2"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {player.alias}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLastGoal(match.team2.id)}
                  disabled={team2Goals.length === 0}
                  className="w-full"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Undo Last Goal
                </Button>
                
                {team2Goals.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium mb-1">Goals:</div>
                    {team2Goals.map(goal => (
                      <div key={goal.id} className="flex justify-between">
                        <span>{goal.playerName}</span>
                        <span>{goal.minute}'</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Match Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {goals
                .sort((a, b) => b.minute - a.minute)
                .map(goal => (
                <div key={goal.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{goal.minute}'</Badge>
                    <span className="font-medium">{goal.playerName}</span>
                    <span className="text-muted-foreground">⚽</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {tournament.teams.find(t => t.id === goal.teamId)?.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LiveMatch