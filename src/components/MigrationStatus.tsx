import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Cloud,
  Smartphone,
  RefreshCw,
} from "lucide-react";

interface MigrationStatusProps {
  useFirestore: boolean;
  error: string | null;
  onRetryConnection: () => Promise<void>;
  onMigrateToFirestore: () => Promise<void>;
  tournamentCount: number;
}

export function MigrationStatus({
  useFirestore,
  error,
  onRetryConnection,
  onMigrateToFirestore,
  tournamentCount,
}: MigrationStatusProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      await onMigrateToFirestore();
    } finally {
      setIsMigrating(false);
    }
  };

  if (useFirestore && !error) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Cloud Sync Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                {tournamentCount} tournament{tournamentCount !== 1 ? "s" : ""}{" "}
                synced to Firestore
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-green-600 border-green-600">
              Live
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="w-5 h-5" />
          Offline Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-700">
            Using local storage ({tournamentCount} tournament
            {tournamentCount !== 1 ? "s" : ""})
          </span>
        </div>

        {error && (
          <div className="text-sm text-orange-600 bg-orange-100 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-orange-700 border-orange-300 hover:bg-orange-100">
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Connecting..." : "Retry Cloud Sync"}
          </Button>

          {tournamentCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMigrate}
              disabled={isMigrating}
              className="text-orange-700 border-orange-300 hover:bg-orange-100">
              <Cloud
                className={`w-4 h-4 mr-2 ${isMigrating ? "animate-pulse" : ""}`}
              />
              {isMigrating ? "Migrating..." : "Migrate to Cloud"}
            </Button>
          )}
        </div>

        <div className="text-xs text-orange-600">
          💡 Check your Firebase configuration if cloud sync fails
        </div>
      </CardContent>
    </Card>
  );
}

export default MigrationStatus;
