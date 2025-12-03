import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as HiIcons from 'react-icons/hi';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io5';
import * as BiIcons from 'react-icons/bi';

const sizeMap = {
  xs: 'h-3 w-3',   // 12px
  sm: 'h-4 w-4',   // 16px
  md: 'h-5 w-5',   // 20px
  lg: 'h-6 w-6',   // 24px
  xl: 'h-8 w-8'    // 32px
};

const variantMap = {
  default: 'text-gray-600 dark:text-gray-300',
  primary: 'text-primary-600 dark:text-primary-400',
  secondary: 'text-secondary-600 dark:text-secondary-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  white: 'text-white',
};

// Icon mapping object — each key must be unique
const iconMap = {
  // Navigation & Actions
  menu: HiIcons.HiMenu,
  close: HiIcons.HiX,
  search: HiIcons.HiSearch,
  plus: HiIcons.HiPlus,
  edit: HiIcons.HiPencil,
  delete: HiIcons.HiTrash,
  settings: HiIcons.HiCog,

  // User & Profile
  user: FaIcons.FaUser,
  profile: FaIcons.FaUserCircle,
  logout: HiIcons.HiLogout,

  // Status & Feedback
  success: HiIcons.HiCheckCircle,
  error: HiIcons.HiExclamationCircle,
  warning: HiIcons.HiExclamationTriangle,
  info: HiIcons.HiInformationCircle,
  loading: AiIcons.AiOutlineLoading3Quarters,

  // Common Actions
  download: HiIcons.HiDownload,
  upload: HiIcons.HiUpload,
  save: HiIcons.HiSave,
  share: HiIcons.HiShare,

  // Forms & Input
  chevronDown: HiIcons.HiChevronDown,
  chevronUp: HiIcons.HiChevronUp,
  chevronLeft: HiIcons.HiChevronLeft,
  chevronRight: HiIcons.HiChevronRight,

  // Communication
  mail: HiIcons.HiMail,
  notification: HiIcons.HiBell,

  // Document & Files
  document: HiIcons.HiDocument,
  folder: HiIcons.HiFolder,

  // Application Specific (keep these only once)
  job: BiIcons.BiBriefcase,
  company: BiIcons.BiBuildings,
  resume: IoIcons.IoDocument,
  employment: BiIcons.BiBriefcase,

  // New navbar icons you added (unique names)
  home: HiIcons.HiHome,                // if you use a home icon anywhere
  education: HiIcons.HiAcademicCap,    // used for Education
  certifications: HiIcons.HiBadgeCheck,// used for Certifications
  projects: HiIcons.HiCollection,      // used for Projects
  brain: FaIcons.FaBrain,
  target: HiIcons.HiFlag,              // used for Goals (flag represents target/goal)
  
  // Custom Reports icons
  'file-text': HiIcons.HiDocumentText,
  users: HiIcons.HiUserGroup,
  briefcase: BiIcons.BiBriefcase,
  'dollar-sign': HiIcons.HiCurrencyDollar,
  building: BiIcons.BiBuildings,
  clock: HiIcons.HiClock,
  'trending-up': HiIcons.HiTrendingUp,
  'bar-chart-2': HiIcons.HiChartBar,
  'pie-chart': HiIcons.HiChartPie,
  play: HiIcons.HiPlay,
  loader: AiIcons.AiOutlineLoading3Quarters,
  'share-2': HiIcons.HiShare,
  lightbulb: HiIcons.HiLightBulb,
  'check-circle': HiIcons.HiCheckCircle,
  'alert-circle': HiIcons.HiExclamationCircle,
  file: HiIcons.HiDocument,
};


export const Icon = ({ 
  name,
  size = 'md',
  variant = 'default',
  className = '',
  spin = false,
  label,
  title
}) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }
  const sizeClass = sizeMap[size] || sizeMap.md;
  const variantClass = variantMap[variant] || variantMap.default;
  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClass} ${variantClass} ${spin ? 'animate-spin' : ''} ${className}`}
      role="img"
      aria-label={label || name}
      title={title || label || name}
    >
      <IconComponent className="w-full h-full" />
    </span>
  );
};

// Export the icon names for autocomplete
export const IconNames = Object.keys(iconMap);