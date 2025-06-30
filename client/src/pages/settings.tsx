import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSettingsSchema, type UpdateSettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Palette, Globe, Clock, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface UserSettings {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  emailNotifications: boolean;
  reminderNotifications: boolean;
  weeklyDigest: boolean;
  autoDeleteOldItems: boolean;
}

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  loginMethod: "email" | "oauth";
  settings: UserSettings;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const form = useForm<UpdateSettings>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      timezone: "UTC",
      emailNotifications: true,
      reminderNotifications: true,
      weeklyDigest: false,
      autoDeleteOldItems: false,
    },
  });

  // Update form when profile data loads - use useEffect to prevent infinite re-renders
  React.useEffect(() => {
    if (profile?.settings && !form.formState.isDirty) {
      form.reset(profile.settings);
    }
  }, [profile?.settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UpdateSettings) => {
      return await apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmDelete: "DELETE" }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      // Redirect to home page after a brief delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateSettings) => {
    updateSettingsMutation.mutate(data);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation === "DELETE") {
      deleteAccountMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Settings className="w-8 h-8 mr-3" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={form.watch("theme")}
                onValueChange={(value) => form.setValue("theme", value as "light" | "dark" | "system")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={form.watch("language")}
                onValueChange={(value) => form.setValue("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={form.watch("timezone")}
                onValueChange={(value) => form.setValue("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Receive notifications about important updates via email
                </p>
              </div>
              <Switch
                checked={form.watch("emailNotifications")}
                onCheckedChange={(checked) => form.setValue("emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reminder Notifications</Label>
                <p className="text-sm text-gray-500">
                  Get notified about upcoming document reminders
                </p>
              </div>
              <Switch
                checked={form.watch("reminderNotifications")}
                onCheckedChange={(checked) => form.setValue("reminderNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Digest</Label>
                <p className="text-sm text-gray-500">
                  Receive a weekly summary of your document activity
                </p>
              </div>
              <Switch
                checked={form.watch("weeklyDigest")}
                onCheckedChange={(checked) => form.setValue("weeklyDigest", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Data Management
            </CardTitle>
            <CardDescription>
              Control how your data is managed and stored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-delete Old Items</Label>
                <p className="text-sm text-gray-500">
                  Automatically delete documents older than 2 years
                </p>
              </div>
              <Switch
                checked={form.watch("autoDeleteOldItems")}
                onCheckedChange={(checked) => form.setValue("autoDeleteOldItems", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="w-32"
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600">
            Actions in this section are irreversible. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
                  <p>This includes:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>All uploaded documents and images</li>
                    <li>All AI analysis and summaries</li>
                    <li>Your profile and settings</li>
                    <li>All calendar reminders and exports</li>
                  </ul>
                  <div className="mt-4">
                    <Label htmlFor="deleteConfirm">Type <strong>DELETE</strong> to confirm:</Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== "DELETE" || deleteAccountMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}