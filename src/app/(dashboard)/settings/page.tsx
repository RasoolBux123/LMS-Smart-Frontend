"use client";

import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [gradeAlerts, setGradeAlerts] = useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage appearance and notification preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <Label>Dark mode</Label>
            <p className="text-xs text-muted-foreground">
              Switch between light and dark themes.
            </p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(c) => setTheme(c ? "dark" : "light")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive a summary of activity by email.
              </p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Deadline reminders</Label>
              <p className="text-xs text-muted-foreground">
                Get notified 24 hours before a deadline.
              </p>
            </div>
            <Switch
              checked={deadlineReminders}
              onCheckedChange={setDeadlineReminders}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Grade alerts</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when an assignment is graded.
              </p>
            </div>
            <Switch checked={gradeAlerts} onCheckedChange={setGradeAlerts} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Settings saved.")}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
