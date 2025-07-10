import React from "react";
import { BellIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const RightActions = () => (
  <div className="flex items-center space-x-4">
    <button
      className="relative p-2 rounded-full hover:bg-gray-700 transition"
      aria-label="Notifications"
    >
      <BellIcon className="h-6 w-6" />
      {/* Notification Badge */}
      <span className="absolute top-1 right-1 bg-red-600 text-xs font-bold text-white rounded-full h-4 w-4 flex items-center justify-center">
        3
      </span>
    </button>
    <button
      className="p-2 rounded-full hover:bg-gray-700 transition"
      aria-label="Profile"
    >
      <UserCircleIcon className="h-6 w-6" />
    </button>
  </div>
);

export default RightActions;
