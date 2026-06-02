import React from 'react';
import {
  Utensils,
  Home,
  Car,
  Smile,
  ShoppingBag,
  Heart,
  Briefcase,
  ArrowLeftRight,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  PiggyBank,
  Coins,
  Hexagon,
  Check,
  Trash2,
  Plus,
  AlertCircle,
  Calendar,
  User,
  Users,
  CheckCircle2,
  Sparkles,
  RefreshCcw,
  Info,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  DollarSign
} from 'lucide-react';

const iconsMap: Record<string, React.ComponentType<any>> = {
  Utensils,
  Home,
  Car,
  Smile,
  ShoppingBag,
  Heart,
  Briefcase,
  ArrowLeftRight,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  PiggyBank,
  Coins,
  Hexagon,
  Check,
  Trash2,
  Plus,
  AlertCircle,
  Calendar,
  User,
  Users,
  CheckCircle2,
  Sparkles,
  RefreshCcw,
  Info,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  DollarSign
};

interface LucideIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
  size?: number | string;
}

export function LucideIcon({ name, className = '', size = 20, ...props }: LucideIconProps) {
  // Try to match exact or title-cased icon name
  const IconComponent = iconsMap[name] || iconsMap[name.charAt(0).toUpperCase() + name.slice(1)] || PlusCircle;

  return <IconComponent className={className} size={size} {...props} />;
}
