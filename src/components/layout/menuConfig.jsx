import {
  HomeIcon,
  PuzzlePieceIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export const menuConfig = {
  main: [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/games', label: 'Games', icon: PuzzlePieceIcon },
    { path: '/task', label: 'Tasks', icon: BriefcaseIcon },
    { path: '/requests', label: 'Requests', icon: ClipboardDocumentListIcon },
    { path: '/operational', label: 'Operational', icon: MagnifyingGlassIcon },
  ],
  others: [
    {
      path: '/feedback',
      label: 'Feedback',
      icon: ChatBubbleOvalLeftEllipsisIcon,
    },
    { path: '/content', label: 'Contents', icon: DocumentTextIcon },
    { path: '/about', label: 'About', icon: InformationCircleIcon },
  ],
};

