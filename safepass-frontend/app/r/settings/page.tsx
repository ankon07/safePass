"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  User,
  Shield,
  Key,
  Bell,
  Database,
  Activity,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";

function RegulatorSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Settings
        </h1>
        <p className="text-slate-500">
          Manage your regulator account and system preferences.
        </p>
      </div>

      {/* Profile Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Name</label>
              <p className="text-lg font-semibold">{user?.name || 'Not available'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Email</label>
              <p className="text-lg">{user?.email || 'Not available'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Role</label>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4" />
                <Badge variant="destructive">{user?.role || 'Unknown'}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">DID</label>
              <p className="text-sm font-mono text-slate-700 break-all">
                {user?.did || 'Not available'}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline" disabled>
              <User className="h-4 w-4 mr-2" />
              Edit Profile (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-approve Documents</p>
                  <p className="text-sm text-slate-500">Automatically approve certain document types</p>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Trust Score Auto-calculation</p>
                  <p className="text-sm text-slate-500">Automatically recalculate trust scores</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">ZKP System</p>
                  <p className="text-sm text-slate-500">Zero-knowledge proof verification</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="outline" disabled>
                <Settings className="h-4 w-4 mr-2" />
                Configure System (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Document Submissions</p>
                  <p className="text-sm text-slate-500">New document upload notifications</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Alerts</p>
                  <p className="text-sm text-slate-500">Critical system notifications</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-slate-500">System activity summaries</p>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="outline" disabled>
                <Bell className="h-4 w-4 mr-2" />
                Manage Notifications (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Authentication</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Two-Factor Authentication</span>
                  <Badge variant="outline">Not Configured</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Session Timeout</span>
                  <Badge variant="secondary">24 hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Last Login</span>
                  <span className="text-slate-500">Today</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Permissions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Document Verification</span>
                  <Badge variant="default">Granted</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Trust Score Management</span>
                  <Badge variant="default">Granted</Badge>
                </div>
                <div className="flex justify-between">
                  <span>User Management</span>
                  <Badge variant="default">Granted</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" disabled>
              <Key className="h-4 w-4 mr-2" />
              Change Password (Coming Soon)
            </Button>
            <Button variant="outline" disabled>
              <Shield className="h-4 w-4 mr-2" />
              Setup 2FA (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium">Database</p>
              <Badge variant="default">Online</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium">ZKP System</p>
              <Badge variant="default">Ready</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium">API Gateway</p>
              <Badge variant="default">Healthy</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(RegulatorSettingsPage, ['Regulator']);
