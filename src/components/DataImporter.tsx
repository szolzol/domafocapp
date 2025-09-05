import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Download, Info } from "@phosphor-icons/react"
import { toast } from 'sonner'
import { Tournament, Team, Player, Match, Goal } from '@/App'

const sampleCsvData = `Tournament Name,Tournament Date,Team Name,Player Name,Player Alias,Player Strength,Team 1,Team 2,Team 1 Score,Team 2 Score,Goal Scorer,Goal Team,Goal Minute
Doma Football Day,2024-08-23,Red Eagles,John Smith,Johnny,strong,,,,,,,
Doma Football Day,2024-08-23,Red Eagles,Mike Johnson,Mikey,weak,,,,,,,
Doma Football Day,2024-08-23,Blue Tigers,Sarah Davis,Sar,strong,,,,,,,
Doma Football Day,2024-08-23,Blue Tigers,Tom Wilson,Tommy,weak,,,,,,,
Doma Football Day,2024-08-23,Green Lions,Alex Brown,Alex,strong,,,,,,,
Doma Football Day,2024-08-23,Green Lions,Emma White,Em,weak,,,,,,,
Doma Football Day,2024-08-23,Yellow Wolves,Chris Lee,Chris,strong,,,,,,,
Doma Football Day,2024-08-23,Yellow Wolves,Lisa Green,Lisa,weak,,,,,,,
Doma Football Day,2024-08-23,,,,,Red Eagles,Blue Tigers,2,1,Johnny,Red Eagles,15
Doma Football Day,2024-08-23,,,,,Red Eagles,Blue Tigers,2,1,Mikey,Red Eagles,45
Doma Football Day,2024-08-23,,,,,Red Eagles,Blue Tigers,2,1,Sar,Blue Tigers,60
Doma Football Day,2024-08-23,,,,,Green Lions,Yellow Wolves,1,3,Alex,Green Lions,20
Doma Football Day,2024-08-23,,,,,Green Lions,Yellow Wolves,1,3,Chris,Yellow Wolves,35
Doma Football Day,2024-08-23,,,,,Green Lions,Yellow Wolves,1,3,Lisa,Yellow Wolves,50
Doma Football Day,2024-08-23,,,,,Green Lions,Yellow Wolves,1,3,Chris,Yellow Wolves,70`

interface ImportedData {
  [key: string]: any
}

interface DataImporterProps {
  onImport: (tournaments: Tournament[]) => void
  onClose: () => void
  isOpen: boolean
}

interface MappingConfig {
  tournamentName: string
  tournamentDate: string
  teamName: string
  playerName: string
  playerAlias: string
  playerHat: string
  matchTeam1: string
  matchTeam2: string
  matchScore1: string
  matchScore2: string
  matchDate: string
  goalScorer: string
  goalTeam: string
  goalMinute: string
}

export default function DataImporter({ onImport, onClose, isOpen }: DataImporterProps) {
  const [importedData, setImportedData] = useState<ImportedData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm'>('upload')
  const [columns, setColumns] = useState<string[]>([])
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>({
    tournamentName: '',
    tournamentDate: '',
    teamName: '',
    playerName: '',
    playerAlias: '',
    playerHat: '',
    matchTeam1: '',
    matchTeam2: '',
    matchScore1: '',
    matchScore2: '',
    matchDate: '',
    goalScorer: '',
    goalTeam: '',
    goalMinute: ''
  })
  const [previewTournaments, setPreviewTournaments] = useState<Tournament[]>([])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload a CSV or Excel file')
      return
    }

    setIsLoading(true)
    
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const row: ImportedData = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        }).filter(row => Object.values(row).some(v => v))
        
        setColumns(headers)
        setImportedData(data)
        setStep('preview')
      } else {
        // For Excel files, we'll provide instructions since we can't parse them directly
        toast.error('Please convert your Excel file to CSV format first. In Excel: File > Save As > CSV (Comma delimited)')
      }
    } catch (error) {
      toast.error('Error reading file. Please check the format.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateTournaments = () => {
    const tournaments: Tournament[] = []
    const tournamentMap = new Map<string, Tournament>()

    // Group data by tournament
    importedData.forEach(row => {
      const tournamentName = row[mappingConfig.tournamentName] || 'Imported Tournament'
      const tournamentDate = row[mappingConfig.tournamentDate] || new Date().toISOString().split('T')[0]
      
      if (!tournamentMap.has(tournamentName)) {
        const tournament: Tournament = {
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: tournamentName,
          date: tournamentDate,
          status: 'completed', // Imported tournaments are marked as completed
          teams: [],
          fixtures: [],
          rounds: 1,
          teamSize: 2,
          hasHalfTime: false
        }
        tournamentMap.set(tournamentName, tournament)
        tournaments.push(tournament)
      }
    })

    // Process teams and players
    const teamMap = new Map<string, Team>()
    
    importedData.forEach(row => {
      const tournamentName = row[mappingConfig.tournamentName] || 'Imported Tournament'
      const teamName = row[mappingConfig.teamName]
      const playerName = row[mappingConfig.playerName]
      const playerAlias = row[mappingConfig.playerAlias] || playerName
      const playerHat = row[mappingConfig.playerHat]?.toLowerCase() === 'strong' || row[mappingConfig.playerHat]?.toLowerCase() === 'first' ? 'first' : 'second'
      
      if (teamName && playerName) {
        const teamKey = `${tournamentName}_${teamName}`
        
        if (!teamMap.has(teamKey)) {
          const team: Team = {
            id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: teamName,
            players: [],
            stats: {
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0
            }
          }
          teamMap.set(teamKey, team)
          
          const tournament = tournamentMap.get(tournamentName)
          if (tournament) {
            tournament.teams.push(team)
          }
        }
        
        const team = teamMap.get(teamKey)
        if (team && !team.players.some(p => p.name === playerName)) {
          const player: Player = {
            id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: playerName,
            alias: playerAlias,
            goals: 0,
            hat: playerHat
          }
          team.players.push(player)
        }
      }
    })

    // Process matches if mapping is provided
    if (mappingConfig.matchTeam1 && mappingConfig.matchTeam2) {
      const matchMap = new Map<string, Match>()
      
      importedData.forEach(row => {
        const tournamentName = row[mappingConfig.tournamentName] || 'Imported Tournament'
        const team1Name = row[mappingConfig.matchTeam1]
        const team2Name = row[mappingConfig.matchTeam2]
        const score1 = parseInt(row[mappingConfig.matchScore1]) || 0
        const score2 = parseInt(row[mappingConfig.matchScore2]) || 0
        
        if (team1Name && team2Name) {
          const matchKey = `${tournamentName}_${team1Name}_${team2Name}`
          
          if (!matchMap.has(matchKey)) {
            const tournament = tournamentMap.get(tournamentName)
            const team1 = tournament?.teams.find(t => t.name === team1Name)
            const team2 = tournament?.teams.find(t => t.name === team2Name)
            
            if (team1 && team2) {
              const match: Match = {
                id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                team1,
                team2,
                score1,
                score2,
                status: 'completed',
                round: 1,
                duration: 90,
                goals: [],
                comments: ''
              }
              
              matchMap.set(matchKey, match)
              tournament?.fixtures.push(match)
              
              // Update team stats
              team1.stats.played++
              team2.stats.played++
              team1.stats.goalsFor += score1
              team1.stats.goalsAgainst += score2
              team2.stats.goalsFor += score2
              team2.stats.goalsAgainst += score1
              
              if (score1 > score2) {
                team1.stats.won++
                team1.stats.points += 3
                team2.stats.lost++
              } else if (score2 > score1) {
                team2.stats.won++
                team2.stats.points += 3
                team1.stats.lost++
              } else {
                team1.stats.drawn++
                team2.stats.drawn++
                team1.stats.points++
                team2.stats.points++
              }
            }
          }
        }
      })
    }

    // Process goals if mapping is provided
    if (mappingConfig.goalScorer && mappingConfig.goalTeam) {
      importedData.forEach(row => {
        const tournamentName = row[mappingConfig.tournamentName] || 'Imported Tournament'
        const goalScorer = row[mappingConfig.goalScorer]
        const goalTeam = row[mappingConfig.goalTeam]
        const goalMinute = parseInt(row[mappingConfig.goalMinute]) || 0
        
        if (goalScorer && goalTeam) {
          const tournament = tournamentMap.get(tournamentName)
          const team = tournament?.teams.find(t => t.name === goalTeam)
          const player = team?.players.find(p => p.name === goalScorer || p.alias === goalScorer)
          
          if (player) {
            player.goals++
          }
        }
      })
    }

    setPreviewTournaments(tournaments)
    setStep('confirm')
  }

  const handleImport = () => {
    onImport(previewTournaments)
    toast.success(`Successfully imported ${previewTournaments.length} tournament(s)`)
    onClose()
    resetImporter()
  }

  const resetImporter = () => {
    setImportedData([])
    setColumns([])
    setStep('upload')
    setMappingConfig({
      tournamentName: '',
      tournamentDate: '',
      teamName: '',
      playerName: '',
      playerAlias: '',
      playerHat: '',
      matchTeam1: '',
      matchTeam2: '',
      matchScore1: '',
      matchScore2: '',
      matchDate: '',
      goalScorer: '',
      goalTeam: '',
      goalMinute: ''
    })
    setPreviewTournaments([])
  }

  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-tournament-data.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Sample template downloaded')
  }

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import Tournament Data</h3>
        <p className="text-muted-foreground mb-4">
          Upload a CSV file with your tournament data. Excel files should be converted to CSV first.
        </p>
      </div>
      
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <span className="text-primary font-medium">Choose a file</span> or drag and drop
        </Label>
        <Input
          id="file-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
        <p className="text-sm text-muted-foreground mt-2">CSV, XLS, XLSX up to 10MB</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Expected Data Format:</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Your file can contain any combination of: tournament names, dates, team names, player names, 
          match results, goal scorers, etc. The next step will help you map your columns to our format.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadSampleTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            Download Sample CSV
          </Button>
        </div>
      </div>
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Preview</h3>
          <p className="text-muted-foreground">Found {importedData.length} rows with {columns.length} columns</p>
        </div>
        <Button variant="outline" onClick={() => setStep('upload')}>
          Upload Different File
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importedData.slice(0, 5).map((row, index) => (
                <tr key={index} className="border-t">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 truncate max-w-32">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {importedData.length > 5 && (
          <div className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            ... and {importedData.length - 5} more rows
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStep('upload')}>
          Back
        </Button>
        <Button onClick={() => setStep('mapping')}>
          Configure Mapping
        </Button>
      </div>
    </div>
  )

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Map Your Data</h3>
        <p className="text-muted-foreground">
          Map your CSV columns to tournament data fields. Only map the fields you have data for.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Mapping Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Required:</strong> At least Tournament Name OR Team Name must be mapped</li>
              <li>• <strong>Player Strength:</strong> Should contain "strong"/"first" or "weak"/"second"</li>
              <li>• <strong>Match Data:</strong> All match fields (Team 1, Team 2, Scores) should be mapped together</li>
              <li>• <strong>Goal Data:</strong> Goal Scorer and Goal Team should be mapped together</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tournament Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Tournament Name</Label>
              <Select value={mappingConfig.tournamentName} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, tournamentName: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Tournament Date</Label>
              <Select value={mappingConfig.tournamentDate} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, tournamentDate: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Team & Player Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Team Name</Label>
              <Select value={mappingConfig.teamName} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, teamName: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Player Name</Label>
              <Select value={mappingConfig.playerName} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, playerName: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Player Alias (Optional)</Label>
              <Select value={mappingConfig.playerAlias} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, playerAlias: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Player Strength (first/strong or second/weak)</Label>
              <Select value={mappingConfig.playerHat} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, playerHat: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Match Results (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Team 1</Label>
              <Select value={mappingConfig.matchTeam1} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, matchTeam1: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team 2</Label>
              <Select value={mappingConfig.matchTeam2} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, matchTeam2: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team 1 Score</Label>
              <Select value={mappingConfig.matchScore1} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, matchScore1: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Team 2 Score</Label>
              <Select value={mappingConfig.matchScore2} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, matchScore2: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Goal Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Goal Scorer</Label>
              <Select value={mappingConfig.goalScorer} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, goalScorer: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Goal Scorer Team</Label>
              <Select value={mappingConfig.goalTeam} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, goalTeam: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Goal Minute</Label>
              <Select value={mappingConfig.goalMinute} onValueChange={(value) => 
                setMappingConfig(prev => ({ ...prev, goalMinute: value }))
              }>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStep('preview')}>
          Back
        </Button>
        <Button 
          onClick={generateTournaments}
          disabled={!mappingConfig.tournamentName && !mappingConfig.teamName && !mappingConfig.playerName}
        >
          Generate Preview
        </Button>
      </div>
    </div>
  )

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Import Preview</h3>
        <p className="text-muted-foreground">
          Review the tournaments that will be imported and confirm to proceed.
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {previewTournaments.map(tournament => (
          <Card key={tournament.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tournament.name}</CardTitle>
                <Badge variant="outline">{tournament.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tournament.date}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Teams:</span> {tournament.teams.length}
                </div>
                <div>
                  <span className="font-medium">Players:</span> {tournament.teams.reduce((acc, team) => acc + team.players.length, 0)}
                </div>
                <div>
                  <span className="font-medium">Matches:</span> {tournament.fixtures.length}
                </div>
              </div>
              
              {tournament.teams.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Teams:</p>
                  <div className="flex flex-wrap gap-1">
                    {tournament.teams.slice(0, 5).map(team => (
                      <Badge key={team.id} variant="secondary" className="text-xs">
                        {team.name} ({team.players.length})
                      </Badge>
                    ))}
                    {tournament.teams.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{tournament.teams.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {previewTournaments.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No tournaments could be generated from your data. Please check your column mappings.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStep('mapping')}>
          Back to Mapping
        </Button>
        <Button 
          onClick={handleImport}
          disabled={previewTournaments.length === 0}
          className="gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Import {previewTournaments.length} Tournament(s)
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Import Tournament Data</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            Import your existing tournament data from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Processing file...</p>
            </div>
          )}

          {!isLoading && step === 'upload' && renderUploadStep()}
          {!isLoading && step === 'preview' && renderPreviewStep()}
          {!isLoading && step === 'mapping' && renderMappingStep()}
          {!isLoading && step === 'confirm' && renderConfirmStep()}
        </div>
      </DialogContent>
    </Dialog>
  )
}