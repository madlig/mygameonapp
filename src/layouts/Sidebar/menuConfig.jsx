import {
    HomeIcon,
    PuzzlePieceIcon,
    ClipboardDocumentListIcon,
    BriefcaseIcon,
    MagnifyingGlassIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    InformationCircleIcon,
    CalendarIcon,
  } from "@heroicons/react/24/outline";
  
  export const menuConfig = {
    main: [
      { path: "/dashboard", label: "Dashboard", icon: HomeIcon },
      { path: "/games", label: "Games", icon: PuzzlePieceIcon },
      { path: "/task", label: "Tasks", icon: BriefcaseIcon },
      { path: "/requests", label: "Requests", icon: ClipboardDocumentListIcon },
      { path: "/operational", label: "Operational", icon: MagnifyingGlassIcon },
    ],
    others: [
      { path: "/feedback", label: "Feedback", icon: ChatBubbleOvalLeftEllipsisIcon },
      { path: "/about", label: "About", icon: InformationCircleIcon },
      { label: "Coming Soon", icon: CalendarIcon, disabled: true },
    ],
    shortcuts: [
      { path: "/add-game", label: "Add Game", color: "bg-green-600 hover:bg-green-700" },
      { path: "/add-location", label: "Add Location", color: "bg-blue-600 hover:bg-blue-700" },
      { path: "/add-task", label: "Add Task", color: "bg-yellow-600 hover:bg-yellow-700" },
      { path: "/add-request", label: "Add Request", color: "bg-red-600 hover:bg-red-700" },
    ],
  };
  