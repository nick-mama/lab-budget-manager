"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsForm() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile Settings - contains sample data*/}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Profile Settings</CardTitle>
          <CardDescription>
            Update your personal information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                defaultValue="Nick"
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                defaultValue="Mamaoag"
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue="nick.mamaoag@university.edu"
              className="bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">
              Role
            </Label>
            <Select defaultValue="lab-manager">
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="researcher">Researcher</SelectItem>
                <SelectItem value="lab-manager">Lab Manager</SelectItem>
                <SelectItem value="financial-admin">Financial Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Optional nofication settings for future implementation */}
      {/* Notification Settings
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-foreground">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-foreground">Request Approvals</Label>
              <p className="text-sm text-muted-foreground">
                Notify when requests are reviewed
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-foreground">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Warn when budgets are low
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-foreground">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Send weekly financial summaries
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card> */}

      {/* Security Settings */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Security</CardTitle>
          <CardDescription>
            Manage your account security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-foreground">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              className="bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-foreground">
              New Password
            </Label>
            <Input id="newPassword" type="password" className="bg-secondary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              className="bg-secondary"
            />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Future system settings for dashboard customization */}
      {/* System Settings
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">System Preferences</CardTitle>
          <CardDescription>
            Customize your dashboard experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-foreground">
              Currency Display
            </Label>
            <Select defaultValue="usd">
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFormat" className="text-foreground">
              Date Format
            </Label>
            <Select defaultValue="mdy">
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-foreground">
              Timezone
            </Label>
            <Select defaultValue="pst">
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                <SelectItem value="cst">Central Time (CT)</SelectItem>
                <SelectItem value="est">Eastern Time (ET)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save Preferences
          </Button>
        </CardContent>
      </Card> */}
    </div>
  );
}
