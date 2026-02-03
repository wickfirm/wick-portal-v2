"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Video,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface UserIntegrations {
  calendarConnected: boolean;
  googleCalendarId: string | null;
  zoomConnected: boolean;
}

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<UserIntegrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();

    // Handle success/error from OAuth callback
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      toast({
        title: "Google Calendar Connected",
        description: "Your Google Calendar has been successfully connected.",
      });
      window.history.replaceState({}, "", "/settings/integrations");
    } else if (success === "zoom_connected") {
      toast({
        title: "Zoom Connected",
        description: "Your Zoom account has been successfully connected.",
      });
      window.history.replaceState({}, "", "/settings/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Google authentication failed. Please try again.",
        zoom_auth_failed: "Zoom authentication failed. Please try again.",
        missing_params: "Missing required parameters.",
        invalid_state: "Invalid state parameter.",
        save_failed: "Failed to save connection.",
        callback_failed: "Callback processing failed.",
      };
      toast({
        title: "Connection Failed",
        description: errorMessages[error] || "An error occurred.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/settings/integrations");
    }
  }, [searchParams, toast]);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/user/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = async () => {
    setConnecting("google");
    try {
      const res = await fetch("/api/integrations/google/auth");
      if (res.ok) {
        const { authUrl } = await res.json();
        window.location.href = authUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to initiate Google connection.",
          variant: "destructive",
        });
        setConnecting(null);
      }
    } catch (error) {
      console.error("Error connecting Google:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google.",
        variant: "destructive",
      });
      setConnecting(null);
    }
  };

  const disconnectGoogle = async () => {
    setConnecting("google-disconnect");
    try {
      const res = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        toast({
          title: "Disconnected",
          description: "Google Calendar has been disconnected.",
        });
        fetchIntegrations();
      } else {
        toast({
          title: "Error",
          description: "Failed to disconnect Google Calendar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google Calendar.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const connectZoom = async () => {
    setConnecting("zoom");
    try {
      const res = await fetch("/api/integrations/zoom/auth");
      if (res.ok) {
        const { authUrl } = await res.json();
        window.location.href = authUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to initiate Zoom connection.",
          variant: "destructive",
        });
        setConnecting(null);
      }
    } catch (error) {
      console.error("Error connecting Zoom:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Zoom.",
        variant: "destructive",
      });
      setConnecting(null);
    }
  };

  const disconnectZoom = async () => {
    setConnecting("zoom-disconnect");
    try {
      const res = await fetch("/api/integrations/zoom/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        toast({
          title: "Disconnected",
          description: "Zoom has been disconnected.",
        });
        fetchIntegrations();
      } else {
        toast({
          title: "Error",
          description: "Failed to disconnect Zoom.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error disconnecting Zoom:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Zoom.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services to enhance your booking experience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Google Calendar */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <span>Google Calendar</span>
              </CardTitle>
              <CardDescription>
                Sync bookings with your Google Calendar and create Google Meet links automatically.
              </CardDescription>
            </div>
            {integrations?.calendarConnected ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="mr-1 h-3 w-3" />
                Not connected
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Automatic calendar event creation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Google Meet links for video calls
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Two-way sync for updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Calendar availability checking
                </li>
              </ul>

              {integrations?.calendarConnected ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={connectGoogle}
                    disabled={connecting === "google"}
                  >
                    {connecting === "google" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Reconnect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={disconnectGoogle}
                    disabled={connecting === "google-disconnect"}
                  >
                    {connecting === "google-disconnect" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={connectGoogle} disabled={connecting === "google"}>
                  {connecting === "google" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Zoom - Coming Soon */}
        <Card className="opacity-60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Video className="h-5 w-5 text-blue-600" />
                </div>
                <span>Zoom</span>
              </CardTitle>
              <CardDescription>
                Automatically create Zoom meeting links for your video bookings.
              </CardDescription>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Automatic Zoom meeting creation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unique meeting links per booking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Meeting recordings (optional)
                </li>
              </ul>

              <Button disabled variant="outline">
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to enable Google Calendar integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li>
              Go to the{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Cloud Console
              </a>
            </li>
            <li>Create a new project or select an existing one</li>
            <li>Enable the Google Calendar API</li>
            <li>Go to "Credentials" and create an OAuth 2.0 Client ID</li>
            <li>Set the authorized redirect URI to: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/integrations/google/callback</code></li>
            <li>Add the Client ID and Secret to your environment variables</li>
            <li>Click "Connect Google Calendar" above</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
