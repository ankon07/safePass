"use client";

import { useState } from "react";
import {
  notifications as initialNotifications,
  AppNotification,
  NotificationType,
} from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Flag, Info, ShieldCheck, MailCheck } from "lucide-react";

// Helper to map an icon to each notification type
const notificationIcons: { [key in NotificationType]: React.ReactNode } = {
  Application: <Briefcase className="h-5 w-5" />,
  Credential: <ShieldCheck className="h-5 w-5" />,
  Grievance: <Flag className="h-5 w-5" />,
  General: <Info className="h-5 w-5" />,
};

const notificationIconColors: { [key in NotificationType]: string } = {
  Application: "bg-blue-100 text-blue-600",
  Credential: "bg-green-100 text-viridian-green",
  Grievance: "bg-amber-100 text-amber-600",
  General: "bg-slate-100 text-slate-600",
};

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );
    // TODO: Add API call to persist this change
  };

  const markAllAsRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((n) => ({ ...n, isRead: true }))
    );
    // TODO: Add API call to persist this change
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-jungle-green">
            Notifications
          </h1>
          <p className="text-slate-500">
            All your important alerts and updates in one place.
          </p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>
          <MailCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="border rounded-lg">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "flex items-start gap-4 p-4 border-b last:border-b-0 cursor-pointer",
              !notification.isRead && "bg-light-grayish-green/50"
            )}
            onClick={() => markAsRead(notification.id)}
          >
            <div
              className={cn(
                "rounded-full p-2",
                notificationIconColors[notification.type]
              )}
            >
              {notificationIcons[notification.type]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-dark-jungle-green">
                {notification.title}
              </p>
              <p className="text-sm text-slate-600">{notification.body}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(notification.date, { addSuffix: true })}
              </p>
              {!notification.isRead && (
                <div className="mt-2 ml-auto h-2 w-2 rounded-full bg-blue-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
