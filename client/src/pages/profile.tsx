import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, changePasswordSchema, type UpdateProfile, type ChangePassword } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Calendar, Shield, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  loginMethod: "email" | "oauth";
  createdAt: string;
}

export default function Profile() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const profileForm = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when profile data loads - use useEffect to prevent infinite re-renders
  useEffect(() => {
    if (profile && !profileForm.formState.isDirty) {
      profileForm.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      return await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      return await apiRequest("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      passwordForm.reset();
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePassword) => {
    changePasswordMutation.mutate(data);
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

  if (!profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  const initials = `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        <Badge variant={profile.loginMethod === "email" ? "default" : "secondary"}>
          {profile.loginMethod === "email" ? <Mail className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
          {profile.loginMethod === "email" ? "Email Account" : "OAuth Account"}
        </Badge>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.profileImageUrl} alt={`${profile.firstName} ${profile.lastName}`} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{profile.firstName} {profile.lastName}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2" />
                {profile.email}
              </CardDescription>
            </div>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              disabled={updateProfileMutation.isPending}
            >
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            Member since {new Date(profile.createdAt).toLocaleDateString()}
          </div>

          {isEditingProfile ? (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...profileForm.register("firstName")}
                    error={profileForm.formState.errors.firstName?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...profileForm.register("lastName")}
                    error={profileForm.formState.errors.lastName?.message}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...profileForm.register("email")}
                  error={profileForm.formState.errors.email?.message}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-32"
                >
                  {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false);
                    profileForm.reset();
                  }}
                  className="w-20"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">First Name</p>
                <p className="text-gray-900">{profile.firstName || "Not set"}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Last Name</p>
                <p className="text-gray-900">{profile.lastName || "Not set"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change (Email users only) */}
      {profile.loginMethod === "email" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isChangingPassword ? (
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
              >
                Change Password
              </Button>
            ) : (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      {...passwordForm.register("currentPassword")}
                      error={passwordForm.formState.errors.currentPassword?.message}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                    error={passwordForm.formState.errors.newPassword?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      passwordForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}