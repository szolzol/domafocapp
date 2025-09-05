import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Download } from "@phosphor-icons/react"
import { toast } from 'sonner'
import type { Tournament, Team, Player } from '@/App'

interface DataImporterProps {
  onImport: (tournaments: Tournament[]) => void
  onClose: () => void
  isOpen: boolean
}

interface ImportedData {
  [key: string]: string
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
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm'>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [importedData, setImportedData] = useState<ImportedData[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [previewTournaments, setPreviewTournaments] = useState<Tournament[]>([])
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
          status: 'completed',
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
      const playerHat = row[mappingConfig.playerHat]?.toLowerCase().includes('first') || 
                       row[mappingConfig.playerHat]?.toLowerCase().includes('strong') ? 'first' : 'second'
      
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
          tournament?.teams.push(team)
        }
        
        const team = teamMap.get(teamKey)
        if (team && !team.players.find(p => p.name === playerName)) {
          const player: Player = {
            id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: playerName,
            alias: playerAlias,
            goals: 0,
            hat: playerHat as 'first' | 'second'
          }
          team.players.push(player)
        }
      }
    })

    setPreviewTournaments(tournaments)
    setStep('confirm')
  }

  const handleImport = () => {
    onImport(previewTournaments)
    toast.success(`Successfully imported ${previewTournaments.length} tournament(s)`)
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

  const downloadSampleCSV = () => {
    const sampleData = `Tournament Name,Date,Team Name,Player Name,Player Alias,Player Hat
Doma Football Day,2024-08-23,Red Eagles,John Smith,Johnny,first
Doma Football Day,2024-08-23,Red Eagles,Sarah Davis,Sar,strong
Doma Football Day,2024-08-23,Blue Tigers,Mike Johnson,Mike,second
Doma Football Day,2024-08-23,Blue Tigers,Emma Wilson,Em,weak`
    
    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_tournament_data.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Sample file downloaded')
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
          <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download Sample
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