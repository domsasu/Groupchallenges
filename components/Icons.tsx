
import React from 'react';
import { 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  Lock, 
  XCircle, 
  X,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Flag,
  File,
  MessageSquare,
  StickyNote,
  Globe,
  HelpCircle,
  Menu,
  Star,
  Calendar,
  MapPin,
  Briefcase,
  LayoutDashboard,
  LayoutGrid,
  Trophy,
  Zap,
  Clock,
  Search,
  Bell,
  Flame,
  BadgeCheck,
  History,
  RefreshCw,
  Share,
  Sparkles,
  ArrowDown,
  Download,
  Info,
  Target,
  Settings,
  Compass,
  BookOpen,
  GraduationCap,
  ExternalLink,
  Pencil,
  Calculator,
  TrendingUp,
  Pause,
  PauseCircle,
  Brain,
  VolumeX,
  Volume2,
  SlidersHorizontal
} from 'lucide-react';

export const Icons = {
  Play: PlayCircle,
  Reading: FileText,
  Quiz: AlertCircle,
  Completed: CheckCircle,
  Lock: Lock,
  Failed: XCircle,
  Check: Check,
  ChevronDown: ChevronDown,
  ChevronRight: ChevronRight,
  ArrowDown: ArrowDown,
  Like: ThumbsUp,
  Dislike: ThumbsDown,
  Report: Flag,
  Transcript: FileText,
  Notes: StickyNote,
  Files: File,
  Coach: MessageSquare,
  Globe: Globe,
  Help: HelpCircle,
  Menu: Menu,
  Star: Star,
  Calendar: Calendar,
  MapPin: MapPin,
  Briefcase: Briefcase,
  Dashboard: LayoutDashboard,
  Grid: LayoutGrid,
  Trophy: Trophy,
  Zap: Zap,
  Clock: Clock,
  Search: Search,
  Bell: Bell,
  Flame: Flame,
  Verified: BadgeCheck,
  History: History,
  Retry: RefreshCw,
  Share: Share,
  Download: Download,
  Sparkles: Sparkles,
  Info: Info,
  Target: Target,
  Settings: Settings,
  /** Pinterest-style filter control */
  FilterSliders: SlidersHorizontal,
  Compass: Compass,
  BookOpen: BookOpen,
  GraduationCap: GraduationCap,
  ExternalLink: ExternalLink,
  Edit: Pencil,
  Calculator: Calculator,
  TrendingUp: TrendingUp,
  Pause: Pause,
  PauseCircle: PauseCircle,
  Brain: Brain,
  VolumeX: VolumeX,
  Volume: Volume2,
  Close: X,
  User: () => (
    <div className="w-8 h-8 rounded-full bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] flex items-center justify-center body-sm-semibold shadow-sm">
      PP
    </div>
  ),
  UserLarge: () => (
    <div className="w-24 h-24 rounded-full bg-[var(--cds-color-blue-700)] text-[var(--cds-color-white)] flex items-center justify-center text-3xl font-bold shadow-md border-4 border-white">
      PP
    </div>
  ),
  TodoStarDone: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#F9F5FF"/>
      <path d="M12 16.8749L7.89998 19.3249C7.71665 19.4249 7.53748 19.4666 7.36248 19.4499C7.18748 19.4332 7.03331 19.3749 6.89998 19.2749C6.76665 19.1749 6.66665 19.0374 6.59998 18.8624C6.53331 18.6874 6.52498 18.5082 6.57498 18.3249L7.64998 13.7499L4.02498 10.6749C3.87498 10.5416 3.78331 10.3874 3.74998 10.2124C3.71665 10.0374 3.72498 9.86657 3.77498 9.6999C3.82498 9.53324 3.91665 9.39574 4.04998 9.2874C4.18331 9.17907 4.34998 9.11657 4.54998 9.0999L9.29998 8.6749L11.175 4.3249C11.2583 4.14157 11.375 4.00407 11.525 3.9124C11.675 3.82074 11.8333 3.7749 12 3.7749C12.1666 3.7749 12.325 3.82074 12.475 3.9124C12.625 4.00407 12.7416 4.14157 12.825 4.3249L14.7 8.6999L19.45 9.0999C19.65 9.11657 19.8166 9.18324 19.95 9.2999C20.0833 9.41657 20.175 9.55824 20.225 9.7249C20.275 9.89157 20.2791 10.0582 20.2375 10.2249C20.1958 10.3916 20.1 10.5416 19.95 10.6749L16.35 13.7499L17.425 18.3249C17.475 18.5082 17.4666 18.6874 17.4 18.8624C17.3333 19.0374 17.2333 19.1749 17.1 19.2749C16.9666 19.3749 16.8125 19.4332 16.6375 19.4499C16.4625 19.4666 16.2833 19.4249 16.1 19.3249L12 16.8749Z" fill="url(#todo_star_done_grad)"/>
      <defs><linearGradient id="todo_star_done_grad" x1="3.72123" y1="11.6142" x2="20.2765" y2="11.8176" gradientUnits="userSpaceOnUse"><stop stopColor="#A678F5"/><stop offset="0.99" stopColor="#4A0FAB"/></linearGradient></defs>
    </svg>
  ),
  TodoStarUndone: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#F2F5FA"/>
      <path d="M12 16.8749L7.89998 19.3249C7.71665 19.4249 7.53748 19.4666 7.36248 19.4499C7.18748 19.4332 7.03331 19.3749 6.89998 19.2749C6.76665 19.1749 6.66665 19.0374 6.59998 18.8624C6.53331 18.6874 6.52498 18.5082 6.57498 18.3249L7.64998 13.7499L4.02498 10.6749C3.87498 10.5416 3.78331 10.3874 3.74998 10.2124C3.71665 10.0374 3.72498 9.86657 3.77498 9.6999C3.82498 9.53324 3.91665 9.39574 4.04998 9.2874C4.18331 9.17907 4.34998 9.11657 4.54998 9.0999L9.29998 8.6749L11.175 4.3249C11.2583 4.14157 11.375 4.00407 11.525 3.9124C11.675 3.82074 11.8333 3.7749 12 3.7749C12.1666 3.7749 12.325 3.82074 12.475 3.9124C12.625 4.00407 12.7416 4.14157 12.825 4.3249L14.7 8.6999L19.45 9.0999C19.65 9.11657 19.8166 9.18324 19.95 9.2999C20.0833 9.41657 20.175 9.55824 20.225 9.7249C20.275 9.89157 20.2791 10.0582 20.2375 10.2249C20.1958 10.3916 20.1 10.5416 19.95 10.6749L16.35 13.7499L17.425 18.3249C17.475 18.5082 17.4666 18.6874 17.4 18.8624C17.3333 19.0374 17.2333 19.1749 17.1 19.2749C16.9666 19.3749 16.8125 19.4332 16.6375 19.4499C16.4625 19.4666 16.2833 19.4249 16.1 19.3249L12 16.8749Z" fill="#C1CAD9"/>
    </svg>
  ),
  CoachSparkle: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.94 2.53888C11.8643 2.35358 11.6019 2.35358 11.5263 2.53888L11.2036 3.32908C11.128 3.51438 10.9809 3.66143 10.7956 3.73709L10.0054 4.05971C9.82013 4.13537 9.82013 4.39777 10.0054 4.47343L10.7956 4.79605C10.9809 4.87171 11.128 5.01876 11.2036 5.20406L11.5263 5.99426C11.6019 6.17956 11.8643 6.17956 11.94 5.99426L12.2626 5.20406C12.3383 5.01876 12.4853 4.87171 12.6706 4.79605L13.4608 4.47343C13.6461 4.39777 13.6461 4.13537 13.4608 4.05971L12.6706 3.73709C12.4853 3.66143 12.3383 3.51438 12.2626 3.32908L11.94 2.53888Z" fill="url(#cs_lg1)"/>
      <path d="M11.94 2.53888C11.8643 2.35358 11.6019 2.35358 11.5263 2.53888L11.2036 3.32908C11.128 3.51438 10.9809 3.66143 10.7956 3.73709L10.0054 4.05971C9.82013 4.13537 9.82013 4.39777 10.0054 4.47343L10.7956 4.79605C10.9809 4.87171 11.128 5.01876 11.2036 5.20406L11.5263 5.99426C11.6019 6.17956 11.8643 6.17956 11.94 5.99426L12.2626 5.20406C12.3383 5.01876 12.4853 4.87171 12.6706 4.79605L13.4608 4.47343C13.6461 4.39777 13.6461 4.13537 13.4608 4.05971L12.6706 3.73709C12.4853 3.66143 12.3383 3.51438 12.2626 3.32908L11.94 2.53888Z" fill="url(#cs_rg1)"/>
      <path d="M7.72277 3.8762C7.59656 3.56706 7.15881 3.56706 7.03259 3.8762L6.34872 5.5512C5.97009 6.47858 5.23414 7.21454 4.30676 7.59317L2.63175 8.27704C2.32262 8.40325 2.32262 8.841 2.63175 8.96722L4.30676 9.65109C5.23414 10.0297 5.97009 10.7657 6.34872 11.6931L7.03259 13.3681C7.15881 13.6772 7.59656 13.6772 7.72277 13.3681L8.40664 11.6931C8.78527 10.7657 9.52123 10.0297 10.4486 9.65109L12.1236 8.96722C12.4327 8.841 12.4327 8.40325 12.1236 8.27704L10.4486 7.59317C9.52123 7.21454 8.78527 6.47858 8.40664 5.5512L7.72277 3.8762Z" fill="url(#cs_lg2)"/>
      <path d="M7.72277 3.8762C7.59656 3.56706 7.15881 3.56706 7.03259 3.8762L6.34872 5.5512C5.97009 6.47858 5.23414 7.21454 4.30676 7.59317L2.63175 8.27704C2.32262 8.40325 2.32262 8.841 2.63175 8.96722L4.30676 9.65109C5.23414 10.0297 5.97009 10.7657 6.34872 11.6931L7.03259 13.3681C7.15881 13.6772 7.59656 13.6772 7.72277 13.3681L8.40664 11.6931C8.78527 10.7657 9.52123 10.0297 10.4486 9.65109L12.1236 8.96722C12.4327 8.841 12.4327 8.40325 12.1236 8.27704L10.4486 7.59317C9.52123 7.21454 8.78527 6.47858 8.40664 5.5512L7.72277 3.8762Z" fill="url(#cs_rg2)"/>
      <defs>
        <linearGradient id="cs_lg1" x1="21.4074" y1="8.00853" x2="0.75947" y2="6.25318" gradientUnits="userSpaceOnUse"><stop offset="0.197115" stopColor="#0FF0FF"/><stop offset="0.536748" stopColor="#4B95FF"/><stop offset="1" stopColor="#1E72EB"/></linearGradient>
        <radialGradient id="cs_rg1" cx="0" cy="0" r="1" gradientTransform="matrix(14.4037 7.97289 -30.9428 37.8414 4.61655 -3.04478)" gradientUnits="userSpaceOnUse"><stop stopColor="#1CFFBA"/><stop offset="0.654851" stopColor="#08FFB5" stopOpacity="0"/></radialGradient>
        <linearGradient id="cs_lg2" x1="21.4074" y1="8.00853" x2="0.75947" y2="6.25318" gradientUnits="userSpaceOnUse"><stop offset="0.197115" stopColor="#0FF0FF"/><stop offset="0.536748" stopColor="#4B95FF"/><stop offset="1" stopColor="#1E72EB"/></linearGradient>
        <radialGradient id="cs_rg2" cx="0" cy="0" r="1" gradientTransform="matrix(14.4037 7.97289 -30.9428 37.8414 4.61655 -3.04478)" gradientUnits="userSpaceOnUse"><stop stopColor="#1CFFBA"/><stop offset="0.654851" stopColor="#08FFB5" stopOpacity="0"/></radialGradient>
      </defs>
    </svg>
  ),
  Coin: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 123 111" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M81.0039 85.9366L40.5149 109.478C44.4898 107.167 48.095 101.066 50.0979 90.004L90.5869 66.4624C88.6148 77.4937 84.9789 83.6256 81.0039 85.9366Z" fill="#C74504"/>
      <path d="M2.37109 28.8698L42.8601 5.32843C45.3869 3.84938 49.9472 4.5581 56.2948 8.22491C60.732 10.7824 66.0628 14.819 72.1947 20.5503L31.7057 44.0917C25.5738 38.3296 20.2429 34.3238 15.8058 31.7663C9.45817 28.0995 4.89781 27.4216 2.37109 28.8698Z" fill="#DE6000"/>
      <path d="M119.921 81.6843L79.4321 105.226C85.9029 101.467 79.2781 83.6255 56.1987 65.2915L96.6876 41.7499C119.767 60.0839 126.392 77.9251 119.921 81.6843Z" fill="#DE6000"/>
      <path d="M41.2612 24.6175L81.7503 1.07613C84.3694 -0.433738 87.1427 -0.310581 89.7002 1.16847L49.2112 24.7101C46.6537 23.231 43.8804 23.1077 41.2612 24.6175Z" fill="#C74504"/>
      <path d="M49.2059 24.7101C56.8477 29.1164 62.5174 45.54 56.1698 65.2915C88.2776 90.8051 88.5241 115.364 65.9685 102.329C61.5314 99.7719 56.2007 95.7354 50.0688 90.004C46.7718 108.338 38.9759 113.083 32.5359 109.386C24.8941 104.979 19.2244 88.5558 25.572 68.8043C-6.53572 43.2907 -6.7822 18.7322 15.7733 31.7663C20.2105 34.3239 25.5411 38.3604 31.673 44.0918C34.9701 25.7577 42.7659 21.0125 49.2059 24.7101Z" fill="#FAAF00"/>
      <path d="M49.2061 24.7101L89.6951 1.16849C97.3369 5.57483 103.007 21.9984 96.659 41.7499L56.1699 65.2915C62.4867 45.54 56.817 29.1164 49.2061 24.7101Z" fill="#FFEAC9"/>
    </svg>
  ),
  CoinEmpty: ({ className }: { className?: string }) => (
    <svg className={className} width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
       <path d="M8.44436 20.0032C6.29228 19.962 4.60838 19.1003 3.58954 17.7225L1.09961 14.3633C2.12112 15.741 3.80501 16.6 5.95443 16.644" fill="#CBD5E1"/>
      <path d="M5.95312 16.6412C10.534 16.7318 15.5005 13.0761 17.0461 8.48185C17.8654 6.04474 17.5595 3.83268 16.4076 2.2793L18.8976 5.63856C20.0494 7.19194 20.3553 9.40401 19.536 11.8411C17.9904 16.4354 13.0239 20.0883 8.44305 20.0005" fill="#E2E8F0"/>
      <path d="M11.555 0.00155098C16.1358 0.0921193 18.5965 3.88776 17.0482 8.48185C15.5027 13.0761 10.5361 16.7292 5.9553 16.6414C1.37447 16.5536 -1.08353 12.7552 0.462033 8.16093C2.0076 3.56665 6.97415 -0.0862729 11.555 0.00155098Z" fill="#F1F5F9"/>
      <path d="M11.1036 1.34311C14.9449 1.41721 17.0092 4.60357 15.711 8.45684C14.4129 12.3101 10.247 15.3757 6.40574 15.2989C2.56444 15.2248 0.500145 12.0384 1.79831 8.18514C3.09648 4.33187 7.26232 1.26901 11.1036 1.34311Z" fill="#E2E8F0"/>
    </svg>
  ),
  GoalRing: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="currentColor"/>
      <circle cx="10" cy="10" r="3" fill="white"/>
    </svg>
  ),
  GoalCheckDark: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="#363F52"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M13.8269 6.65756L8.19906 12.2854L5.84163 9.91146C5.70883 9.77866 5.55095 9.71226 5.36801 9.71226C5.18506 9.71226 5.02719 9.77866 4.89438 9.91146C4.76158 10.0443 4.69243 10.2022 4.68693 10.385C4.68143 10.5679 4.74508 10.7258 4.87788 10.8586L7.73417 13.7132C7.86698 13.846 8.02211 13.9124 8.19956 13.9124C8.37701 13.9124 8.53214 13.846 8.66495 13.7132L14.7566 7.60391C14.8894 7.47111 14.9558 7.31323 14.9558 7.13029C14.9558 6.94734 14.8894 6.78947 14.7566 6.65666C14.6238 6.52386 14.4687 6.45721 14.2912 6.45721C14.1138 6.45721 13.9587 6.52476 13.8269 6.65756Z" fill="white"/>
    </svg>
  ),
  GoalCheckYellow: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="#FFC936"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M13.8269 6.65756L8.19906 12.2854L5.84163 9.91146C5.70883 9.77866 5.55095 9.71226 5.36801 9.71226C5.18506 9.71226 5.02719 9.77866 4.89438 9.91146C4.76158 10.0443 4.69243 10.2022 4.68693 10.385C4.68143 10.5679 4.74508 10.7258 4.87788 10.8586L7.73417 13.7132C7.86698 13.846 8.02211 13.9124 8.19956 13.9124C8.37701 13.9124 8.53214 13.846 8.66495 13.7132L14.7566 7.60391C14.8894 7.47111 14.9558 7.31323 14.9558 7.13029C14.9558 6.94734 14.8894 6.78947 14.7566 6.65666C14.6238 6.52386 14.4687 6.45721 14.2912 6.45721C14.1138 6.45721 13.9587 6.52476 13.8269 6.65756Z" fill="white"/>
    </svg>
  ),
  GoalPending: ({ className, number }: { className?: string; number: number }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9.5" stroke="#C1CAD9"/>
      <text x="10" y="14" textAnchor="middle" fill="#C1CAD9" fontSize="10" fontWeight="500" fontFamily="system-ui, sans-serif">{number}</text>
    </svg>
  ),
  GoalActive: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="#FFC936"/>
      <circle cx="10" cy="10" r="3" fill="white"/>
    </svg>
  ),
  XPBadge: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer glow circle */}
      <circle cx="60" cy="60" r="58" fill="url(#xpGradientOuter)" />
      {/* Main badge circle */}
      <circle cx="60" cy="60" r="50" fill="url(#xpGradientMain)" />
      {/* Inner highlight */}
      <circle cx="60" cy="60" r="42" fill="url(#xpGradientInner)" />
      {/* XP Text */}
      <text x="60" y="72" textAnchor="middle" fill="white" fontSize="36" fontWeight="bold" fontFamily="system-ui, sans-serif">XP</text>
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="xpGradientOuter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="xpGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="xpGradientInner" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
    </svg>
  )
};
