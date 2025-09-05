import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, X } from "@phosphor-icons/react"
import { Tournament, Match, Goal, Player } from '../App'

interface MatchEditorProps {
  match: Match
  tournament: Tournament
  onSave: (updatedMatch: Match) => void
  onCancel: () => void
}

function MatchEditor({ match, tournament, onSave, onCancel }: MatchEditorProps) {
  const [score1, setScore1] = useState(match.score1)
  const [score2, setScore2] = useState(match.score2)
  const [duration, setDuration] = useState(match.duration)
  const [goals, setGoals] = useState<Goal[]>(match.goals)
  const [comments, setComments] = useState(match.comments || '')

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTime = (timeString: string) => {
    const [mins, secs] = timeString.split(':').map(Number)
    return (mins || 0) * 60 + (secs || 0)
  }

  const addGoal = () => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      playerId: '',
      playerName: '',
      teamId: '',
      minute: 0
    }
    setGoals([...goals, newGoal])
  }

  const updateGoal = (goalId: string, field: keyof Goal, value: string | number) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, [field]: value }
        
        // If player is selected, update player name and team
        if (field === 'playerId' && value) {
          const team1Player = match.team1.players.find(p => p.id === value)
          const team2Player = match.team2.players.find(p => p.id === value)
          
          if (team1Player) {
            updatedGoal.playerName = team1Player.alias
            updatedGoal.teamId = match.team1.id
          } else if (team2Player) {
            updatedGoal.playerName = team2Player.alias
            updatedGoal.teamId = match.team2.id
          }
        }
        
        return updatedGoal
      }
      return goal
    }))
  }

  const removeGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId))
  }

  const recalculateScore = () => {
    const team1Goals = goals.filter(g => g.teamId === match.team1.id).length
    const team2Goals = goals.filter(g => g.teamId === match.team2.id).length
    setScore1(team1Goals)
    setScore2(team2Goals)
  }

  const handleSave = () => {
    // Filter out incomplete goals (missing required fields)
    const validGoals = goals.filter(g => g.playerId && g.playerName && g.teamId)
    
    const updatedMatch: Match = {
      ...match,
      score1,
      score2,
      duration,
      goals: validGoals,
      comments: comments.trim()
    }
    
    onSave(updatedMatch)
  }

  const allPlayers = [...match.team1.players, ...match.team2.players]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle>Edit Match</CardTitle>
            <div className="flex gap-2">
              <Button onClick={onCancel} variant="outline" size="sm" className="flex-1 sm:flex-none">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" className="flex-1 sm:flex-none">
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center mb-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2 truncate">{match.team1.name}</h3>
              <Input
                type="number"
                min="0"
                value={score1}
                onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
                className="text-center text-2xl font-bold w-20 mx-auto"
              />
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground mb-2">VS</div>
              <Badge variant="outline">Round {match.round}</Badge>
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2 truncate">{match.team2.name}</h3>
              <Input
                type="number"
                min="0"
                value={score2}
                onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
                className="text-center text-2xl font-bold w-20 mx-auto"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">Match Duration</Label>
              <Input
                id="duration"
                value={formatTime(duration)}
                onChange={(e) => setDuration(parseTime(e.target.value))}
                placeholder="MM:SS"
                className="w-32"
              />
            </div>

            <div>
              <Label htmlFor="comments">Match Comments</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about this match..."
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle>Goals</CardTitle>
            <div className="flex gap-2">
              <Button onClick={addGoal} size="sm" variant="outline" className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-1" />
                Add Goal
              </Button>
              <Button 
                onClick={recalculateScore} 
                size="sm" 
                variant="secondary"
                className="flex-1 sm:flex-none"
              >
                Recalculate Score
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No goals recorded. Add goals using the button above.
            </p>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Player</Label>
                      <Select 
                        value={goal.playerId} 
                        onValueChange={(value) => updateGoal(goal.id, 'playerId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder" disabled>Select a player</SelectItem>
                          {match.team1.players.map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.alias} ({match.team1.name})
                            </SelectItem>
                          ))}
                          {match.team2.players.map(player => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.alias} ({match.team2.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Minute</Label>
                      <Input
                        type="number"
                        min="0"
                        value={goal.minute}
                        onChange={(e) => updateGoal(goal.id, 'minute', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      {goal.teamId && (
                        <Badge variant="outline" className="mb-2">
                          {goal.teamId === match.team1.id ? match.team1.name : match.team2.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(goal.id)}
                    className="text-destructive hover:text-destructive self-center"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MatchEditor