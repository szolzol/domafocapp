import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Play, Pause, Square, Plus, Minus, MessageSquare, Trash2, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react"
import { toast } from 'sonner'
import { Tournament, Match, Goal, Player } from '../App'
import { soundService } from '@/lib/soundService'

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
  const [comments, setComments] = useState(match.comments || '')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isHalfTime, setIsHalfTime] = useState(false)
  const [halfTimeStarted, setHalfTimeStarted] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1
          
          // Show milestone notifications (every 5 minutes)
          if (newTime > 0 && newTime % 300 === 0) {
            const minutes = Math.floor(newTime / 60)
            toast.info(`${minutes} minutes played`, {
              duration: 3000,
            })
            
            if (soundEnabled) {
              // Simple notification sound can be a brief sound
            }
          }
          
          // Check for half-time break (at 45 minutes = 2700 seconds)
          if (tournament.hasHalfTime && newTime === 2700 && !halfTimeStarted) {
            setIsHalfTime(true)
            setHalfTimeStarted(true)
            setIsRunning(false)
            
            toast.info('⏰ Half Time!', {
              description: 'Take a break. Resume when ready for second half.',
              duration: 6000,
            })
          }
          
          return newTime
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, soundEnabled, tournament.hasHalfTime, halfTimeStarted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startMatch = () => {
    setIsRunning(true)
    const updatedMatch = { ...match, status: 'live' as const }
    onUpdateMatch(updatedMatch)
    
    // Enable audio context on user interaction and play start sound
    if (soundEnabled) {
      // Sound will be played when first goal is scored
    }
    
    toast.success('Match started! ⚽', {
      description: `${match.team1.name} vs ${match.team2.name}`
    })
  }

  const pauseMatch = () => {
    setIsRunning(false)
    
    toast.info('Match paused', {
      description: 'Timer stopped',
      duration: 2000,
    })
  }

  const resumeMatch = () => {
    setIsRunning(true)
    
    if (isHalfTime) {
      setIsHalfTime(false)
      toast.success('Second Half Started!', {
        description: 'Timer running for second half',
        duration: 3000,
      })
    } else {
      toast.success('Match resumed', {
        description: 'Timer running',
        duration: 2000,
      })
    }
    
    if (soundEnabled) {
      // Sound for resume action
    }
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

    const teamName = tournament.teams.find(t => t.id === teamId)?.name || 'Unknown Team'
    
    if (teamId === match.team1.id) {
      setScore1(prev => prev + 1)
    } else {
      setScore2(prev => prev + 1)
    }
    
    // Play goal sound and show notification
    if (soundEnabled) {
      soundService.playGoalSound()
    }
    
    toast.success('⚽ GOAL!', {
      description: `${player.alias} scores for ${teamName} at ${newGoal.minute}'`,
      duration: 4000,
    })
  }

  const removeGoal = (goalId: string) => {
    const goalToRemove = goals.find(g => g.id === goalId)
    if (!goalToRemove) return

    const updatedGoals = goals.filter(g => g.id !== goalId)
    setGoals(updatedGoals)
    
    const teamName = tournament.teams.find(t => t.id === goalToRemove.teamId)?.name || 'Unknown Team'

    if (goalToRemove.teamId === match.team1.id) {
      setScore1(prev => Math.max(0, prev - 1))
    } else {
      setScore2(prev => Math.max(0, prev - 1))
    }
    
    // Show notification for goal removal
    toast.info('Goal removed', {
      description: `${goalToRemove.playerName}'s goal for ${teamName} has been removed`,
      duration: 3000,
    })
  }

  const endMatch = () => {
    setIsRunning(false)
    
    const finalMatch: Match = {
      ...match,
      status: 'completed',
      duration: time,
      score1,
      score2,
      goals,
      comments: comments.trim()
    }
    
    // Play match end sound and show final score notification
    if (soundEnabled) {
      soundService.playMatchEndSound()
    }
    
    const winnerText = score1 > score2 ? `${match.team1.name} wins!` :
                      score2 > score1 ? `${match.team2.name} wins!` : 
                      'It\'s a draw!'
    
    toast.success(`Match completed! ${winnerText}`, {
      description: `Final score: ${match.team1.name} ${score1} - ${score2} ${match.team2.name}`,
      duration: 5000,
    })
    
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
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSoundEnabled(!soundEnabled)
                  toast.info(soundEnabled ? 'Sound effects disabled' : 'Sound effects enabled', {
                    duration: 2000,
                  })
                }}
                className="flex items-center gap-2"
              >
                {soundEnabled ? (
                  <SpeakerHigh className="w-4 h-4" />
                ) : (
                  <SpeakerSlash className="w-4 h-4" />
                )}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </Button>
              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? "LIVE" : "PAUSED"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold mb-2">{formatTime(time)}</div>
            {isHalfTime && (
              <div className="text-lg font-semibold text-amber-600 mb-2">
                ⏰ HALF TIME
              </div>
            )}
            {tournament.hasHalfTime && time >= 2700 && !isHalfTime && (
              <div className="text-sm text-muted-foreground">
                Second Half
              </div>
            )}
            {tournament.hasHalfTime && time < 2700 && (
              <div className="text-sm text-muted-foreground">
                First Half
              </div>
            )}
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
                <Button onClick={resumeMatch} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  {isHalfTime ? 'Start Second Half' : 'Resume'}
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
                  onClick={() => {
                    const teamGoals = goals.filter(g => g.teamId === match.team1.id)
                    if (teamGoals.length > 0) {
                      removeGoal(teamGoals[teamGoals.length - 1].id)
                    }
                  }}
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
                  onClick={() => {
                    const teamGoals = goals.filter(g => g.teamId === match.team2.id)
                    if (teamGoals.length > 0) {
                      removeGoal(teamGoals[teamGoals.length - 1].id)
                    }
                  }}
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {tournament.teams.find(t => t.id === goal.teamId)?.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(goal.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Match Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="match-comments">Add comments about this match</Label>
            <Textarea
              id="match-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g., Ended earlier due to rain, Great match with amazing saves..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Comments will be saved when the match is ended
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveMatch