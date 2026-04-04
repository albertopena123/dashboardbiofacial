import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Bell,
  Shield,
  Building2,
  Blocks,
  BookOpen,
  Calendar,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Heart,
  Globe,
  Folder,
  type LucideIcon,
} from "lucide-react"

export interface IconOption {
  name: string
  icon: LucideIcon
}

export const AVAILABLE_ICONS: IconOption[] = [
  { name: "LayoutDashboard", icon: LayoutDashboard },
  { name: "Users", icon: Users },
  { name: "FileText", icon: FileText },
  { name: "Settings", icon: Settings },
  { name: "BarChart3", icon: BarChart3 },
  { name: "Bell", icon: Bell },
  { name: "Shield", icon: Shield },
  { name: "Building2", icon: Building2 },
  { name: "Blocks", icon: Blocks },
  { name: "BookOpen", icon: BookOpen },
  { name: "Calendar", icon: Calendar },
  { name: "Mail", icon: Mail },
  { name: "MapPin", icon: MapPin },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Briefcase", icon: Briefcase },
  { name: "Heart", icon: Heart },
  { name: "Globe", icon: Globe },
  { name: "Folder", icon: Folder },
]

export const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  AVAILABLE_ICONS.map(({ name, icon }) => [name, icon])
)
