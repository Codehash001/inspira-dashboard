"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Header } from "./header"
import {
  Home,
  Bot,
  BookOpen,
  Image as ImageIcon,
  Video,
  Settings,
  CreditCard,
  HelpCircle,
  History,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User2,
  Sparkle,
  TicketCheck,
  Code,
  Shield,
  UserRoundCog,
  LockKeyhole,
  GraduationCap,
  Brain,
  School,
  Beaker,
  Atom,
  Microscope,
  Globe,
  Languages,
  Palette,
  Music,
  Timer,
  Pencil,
  Briefcase,
  Building,
  BadgeCheck,
  Coins,
  Flag,
  BookMarked,
  FileText,
  Lightbulb,
  Leaf
} from "lucide-react"
import { useWallet } from "@/lib/use-wallet"
import { ethers } from "ethers"
import InspiraSubscriptionABI from '@/contract-abi/InspiraSubscription.json'
import { useCredits } from '@/hooks/use-credits';
import { formatCredits } from "@/lib/format-credits"

const SUBSCRIPTION_ADDRESS = process.env.NEXT_PUBLIC_INSPIRA_SUBSCRIPTION_ADDRESS!;
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

const plans = [
  { name: "Free Plan", type: 0 },
  { name: "Pro Plan", type: 1 },
  { name: "Ultra Plan", type: 2 },
];

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "AI Chat",
    href: "/chat",
    icon: Bot,
  },
  {
    name: "Book Grading",
    href: "/book-grading",
    icon: BookOpen,
  },
  {
    name: "Image Generation",
    href: "/image-generation",
    icon: ImageIcon,
  },
  {
    name: "Video Generation",
    href: "/video-generation",
    icon: Video,
    comingSoon: false,
  },
  {
    name: "Blockchain Tools",
    href: "#",
    icon: Code,
    children: [
      {
        name: "AI Auditor",
        href: "/blockchain/ai-auditor",
        icon: Shield,
      }
    ]
  },
  {
    name: "EduFi Tools",
    href: "#",
    icon: GraduationCap,
    children: [
      {
        name: "US EduFi",
        href: "/edufi/us",
        icon: Flag,
        children: [
          {
            name: "Advanced Placement (AP)",
            href: "/edufi/us/ap",
            icon: Brain,
            children: [
              {
                name: "STEM",
                href: "/edufi/us/ap/stem",
                icon: Atom,
                children: [
                  {
                    name: "AP Calculus AB",
                    href: "/edufi/us/ap/stem/calculus-ab",
                    icon: Atom,
                  },
                  {
                    name: "AP Physics 1",
                    href: "/edufi/us/ap/stem/physics-1",
                    icon: Atom,
                  },
                  {
                    name: "AP Computer Science A",
                    href: "/edufi/us/ap/stem/computer-science-a",
                    icon: Code,
                  },
                  {
                    name: "AP Chemistry",
                    href: "/edufi/us/ap/stem/chemistry",
                    icon: Beaker,
                  }
                ]
              },
              {
                name: "Social Sciences",
                href: "/edufi/us/ap/social",
                icon: Globe,
                children: [
                  {
                    name: "AP Psychology",
                    href: "/edufi/us/ap/social/psychology",
                    icon: Brain,
                  },
                  {
                    name: "AP US History",
                    href: "/edufi/us/ap/social/us-history",
                    icon: BookMarked,
                  },
                  {
                    name: "AP Economics",
                    href: "/edufi/us/ap/social/economics",
                    icon: Coins,
                  }
                ]
              },
              {
                name: "Languages",
                href: "/edufi/us/ap/languages",
                icon: Languages,
                children: [
                  {
                    name: "AP English Literature",
                    href: "/edufi/us/ap/languages/english-literature",
                    icon: BookOpen,
                  },
                  {
                    name: "AP Spanish Language",
                    href: "/edufi/us/ap/languages/spanish",
                    icon: Languages,
                  },
                  {
                    name: "AP Mandarin",
                    href: "/edufi/us/ap/languages/mandarin",
                    icon: Languages,
                  }
                ]
              },
              {
                name: "Creative Studies",
                href: "/edufi/us/ap/creative",
                icon: Palette,
                children: [
                  {
                    name: "AP Studio Art",
                    href: "/edufi/us/ap/creative/studio-art",
                    icon: Palette,
                  },
                  {
                    name: "AP Music Theory",
                    href: "/edufi/us/ap/creative/music-theory",
                    icon: Music,
                  },
                  {
                    name: "Environmental Science",
                    href: "/edufi/us/ap/creative/environmental-science",
                    icon: Leaf,
                  }
                ]
              }
            ]
          },
          {
            name: "College Prep",
            href: "/edufi/us/college-prep",
            icon: School,
            children: [
              {
                name: "Test Prep",
                href: "#",
                icon: FileText,
                children: [
                  {
                    name: "SAT Prep",
                    href: "/edufi/us/college-prep/test-prep/sat",
                    icon: FileText,
                  },
                  {
                    name: "ACT Prep",
                    href: "/edufi/us/college-prep/test-prep/act",
                    icon: FileText,
                  },
                  {
                    name: "AP Exam Strategy",
                    href: "/edufi/us/college-prep/test-prep/ap-strategy",
                    icon: Lightbulb,
                  }
                ]
              },
              {
                name: "Academic Skills",
                href: "#",
                icon: BookOpen,
                children: [
                  {
                    name: "Time Management",
                    href: "/edufi/us/college-prep/academic/time-management",
                    icon: Timer,
                  },
                  {
                    name: "Essay Writing",
                    href: "/edufi/us/college-prep/academic/essay-writing",
                    icon: Pencil,
                  },
                  {
                    name: "Note Taking Techniques",
                    href: "/edufi/us/college-prep/academic/note-taking",
                    icon: Pencil,
                  }
                ]
              },
              {
                name: "Career Guidance",
                href: "#",
                icon: Briefcase,
                children: [
                  {
                    name: "Choosing a Major",
                    href: "/edufi/us/college-prep/career/choosing-major",
                    icon: Lightbulb,
                  },
                  {
                    name: "College Admissions",
                    href: "/edufi/us/college-prep/career/admissions",
                    icon: Building,
                  },
                  {
                    name: "Scholarship Planning",
                    href: "/edufi/us/college-prep/career/scholarships",
                    icon: Coins,
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "UK EduFi",
        href: "#",
        icon: Flag,
        children: [
          {
            name: "A-Levels",
            href: "#",
            icon: Brain,
            children: [
              {
                name: "STEM",
                href: "/edufi/us/ap/stem",
                icon: Atom,
                children: [
                  {
                    name: "A-Level Mathematics",
                    href: "/edufi/uk/a-levels/stem/mathematics",
                    icon: Atom,
                  },
                  {
                    name: "A-Level Physics",
                    href: "/edufi/uk/a-levels/stem/physics",
                    icon: Atom,
                  },
                  {
                    name: "A-Level Chemistry",
                    href: "/edufi/uk/a-levels/stem/chemistry",
                    icon: Beaker,
                  },
                  {
                    name: "A-Level Biology",
                    href: "/edufi/uk/a-levels/stem/biology",
                    icon: Microscope,
                  }
                ]
              },
              {
                name: "Social Sciences",
                href: "/edufi/us/ap/social",
                icon: Globe,
                children: [
                  {
                    name: "A-Level History",
                    href: "/edufi/uk/a-levels/social/history",
                    icon: BookMarked,
                  },
                  {
                    name: "A-Level Psychology",
                    href: "/edufi/uk/a-levels/social/psychology",
                    icon: Brain,
                  },
                  {
                    name: "A-Level Economics",
                    href: "/edufi/uk/a-levels/social/economics",
                    icon: Coins,
                  }
                ]
              },
              {
                name: "Languages",
                href: "/edufi/us/ap/languages",
                icon: Languages,
                children: [
                  {
                    name: "A-Level English Literature",
                    href: "/edufi/uk/a-levels/languages/english-literature",
                    icon: BookOpen,
                  },
                  {
                    name: "A-Level French",
                    href: "/edufi/uk/a-levels/languages/french",
                    icon: Languages,
                  },
                  {
                    name: "A-Level Spanish",
                    href: "/edufi/uk/a-levels/languages/spanish",
                    icon: Languages,
                  }
                ]
              },
              {
                name: "Creative Studies",
                href: "/edufi/us/ap/creative",
                icon: Palette,
                children: [
                  {
                    name: "A-Level Art & Design",
                    href: "/edufi/uk/a-levels/creative/art-design",
                    icon: Palette,
                  },
                  {
                    name: "A-Level Music",
                    href: "/edufi/uk/a-levels/creative/music",
                    icon: Music,
                  }
                ]
              }
            ]
          },
          {
            name: "University Prep",
            href: "#",
            icon: School,
            children: [
              {
                name: "UCAS Application Strategy",
                href: "/edufi/uk/university-prep/ucas-strategy",
                icon: FileText,
              },
              {
                name: "Personal Statement Writing",
                href: "/edufi/uk/university-prep/personal-statement",
                icon: Pencil,
              },
              {
                name: "Career Exploration",
                href: "/edufi/uk/university-prep/career-exploration",
                icon: Briefcase,
              }
            ]
          }
        ]
      },
      {
        name: "European EduFi",
        href: "#",
        icon: Globe,
        children: [
          {
            name: "IB (International Baccalaureate)",
            href: "#",
            icon: Brain,
            children: [
              {
                name: "STEM",
                href: "/edufi/us/ap/stem",
                icon: Atom,
                children: [
                  {
                    name: "IB Mathematics",
                    href: "/edufi/eu/ib/stem/mathematics",
                    icon: Atom,
                  },
                  {
                    name: "IB Physics",
                    href: "/edufi/eu/ib/stem/physics",
                    icon: Atom,
                  },
                  {
                    name: "IB Chemistry",
                    href: "/edufi/eu/ib/stem/chemistry",
                    icon: Beaker,
                  },
                  {
                    name: "IB Biology",
                    href: "/edufi/eu/ib/stem/biology",
                    icon: Microscope,
                  }
                ]
              },
              {
                name: "Social Sciences",
                href: "/edufi/us/ap/social",
                icon: Globe,
                children: [
                  {
                    name: "IB History",
                    href: "/edufi/eu/ib/social/history",
                    icon: BookMarked,
                  },
                  {
                    name: "IB Economics",
                    href: "/edufi/eu/ib/social/economics",
                    icon: Coins,
                  }
                ]
              },
              {
                name: "Languages",
                href: "/edufi/us/ap/languages",
                icon: Languages,
                children: [
                  {
                    name: "IB English A Literature",
                    href: "/edufi/eu/ib/languages/english-literature",
                    icon: BookOpen,
                  },
                  {
                    name: "IB Spanish B",
                    href: "/edufi/eu/ib/languages/spanish",
                    icon: Languages,
                  },
                  {
                    name: "IB French B",
                    href: "/edufi/eu/ib/languages/french",
                    icon: Languages,
                  }
                ]
              },
              {
                name: "Creative Studies",
                href: "/edufi/us/ap/creative",
                icon: Palette,
                children: [
                  {
                    name: "IB Visual Arts",
                    href: "/edufi/eu/ib/creative/visual-arts",
                    icon: Palette,
                  },
                  {
                    name: "IB Music",
                    href: "/edufi/eu/ib/creative/music",
                    icon: Music,
                  }
                ]
              }
            ]
          },
          {
            name: "University Preparation",
            href: "#",
            icon: School,
            children: [
              {
                name: "IB Application Tips",
                href: "/edufi/eu/university-prep/ib-application",
                icon: FileText,
              },
              {
                name: "Personal Statement Writing (for EU Universities)",
                href: "/edufi/eu/university-prep/personal-statement",
                icon: Pencil,
              },
              {
                name: "Financial Aid & Scholarships",
                href: "/edufi/eu/university-prep/financial-aid",
                icon: Coins,
              }
            ]
          }
        ]
      },
      {
        name: "Global University EduFi",
        href: "#",
        icon: Globe,
        children: [
          {
            name: "Undergraduate Courses",
            href: "#",
            icon: Brain,
            children: [
              {
                name: "STEM Disciplines",
                href: "#",
                icon: Atom,
                children: [
                  {
                    name: "Computer Science",
                    href: "/edufi/global/undergraduate/stem/computer-science",
                    icon: Code,
                  },
                  {
                    name: "Engineering",
                    href: "/edufi/global/undergraduate/stem/engineering",
                    icon: Atom,
                  },
                  {
                    name: "Mathematics",
                    href: "/edufi/global/undergraduate/stem/mathematics",
                    icon: Atom,
                  }
                ]
              },
              {
                name: "Social Sciences",
                href: "/edufi/us/ap/social",
                icon: Globe,
                children: [
                  {
                    name: "Political Science",
                    href: "/edufi/global/undergraduate/social/political-science",
                    icon: Globe,
                  },
                  {
                    name: "Sociology",
                    href: "/edufi/global/undergraduate/social/sociology",
                    icon: Globe,
                  }
                ]
              },
              {
                name: "Humanities",
                href: "#",
                icon: BookOpen,
                children: [
                  {
                    name: "History",
                    href: "/edufi/global/undergraduate/humanities/history",
                    icon: BookMarked,
                  },
                  {
                    name: "Philosophy",
                    href: "/edufi/global/undergraduate/humanities/philosophy",
                    icon: Lightbulb,
                  },
                  {
                    name: "Literature",
                    href: "/edufi/global/undergraduate/humanities/literature",
                    icon: BookOpen,
                  }
                ]
              },
              {
                name: "Creative Arts",
                href: "#",
                icon: Palette,
                children: [
                  {
                    name: "Fine Arts",
                    href: "/edufi/global/undergraduate/arts/fine-arts",
                    icon: Palette,
                  },
                  {
                    name: "Music",
                    href: "/edufi/global/undergraduate/arts/music",
                    icon: Music,
                  },
                  {
                    name: "Theater",
                    href: "/edufi/global/undergraduate/arts/theater",
                    icon: Palette,
                  }
                ]
              }
            ]
          },
          {
            name: "Postgraduate Courses",
            href: "#",
            icon: School,
            children: [
              {
                name: "Masters Programs",
                href: "#",
                icon: GraduationCap,
                children: [
                  {
                    name: "Data Science",
                    href: "/edufi/global/postgraduate/masters/data-science",
                    icon: Code,
                  },
                  {
                    name: "MBA",
                    href: "/edufi/global/postgraduate/masters/mba",
                    icon: Briefcase,
                  }
                ]
              },
              {
                name: "PhD Guidance",
                href: "#",
                icon: GraduationCap,
                children: [
                  {
                    name: "Application Tips",
                    href: "/edufi/global/postgraduate/phd/application",
                    icon: FileText,
                  },
                  {
                    name: "Research Funding",
                    href: "/edufi/global/postgraduate/phd/funding",
                    icon: Coins,
                  }
                ]
              },
              {
                name: "Professional Certifications",
                href: "#",
                icon: BadgeCheck,
                children: [
                  {
                    name: "Project Management",
                    href: "/edufi/global/postgraduate/certifications/project-management",
                    icon: Briefcase,
                  },
                  {
                    name: "Cybersecurity",
                    href: "/edufi/global/postgraduate/certifications/cybersecurity",
                    icon: Shield,
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
]

const secondaryNavigation = [
  {
    name: "Usage History",
    href: "/history",
    icon: History,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: TicketCheck,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Help & Support",
    href: "/support",
    icon: HelpCircle,
  },
  {
    name: "Admin",
    href: "/admin",
    icon: UserRoundCog,
    adminOnly: true,
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const { theme } = useTheme()
  const { address, signer } = useWallet()
  const { credits, loading } = useCredits();
  const [subscription, setSubscription] = useState<{
    planType: number;
    subscribedAt: number;
  } | null>(null);

  useEffect(() => {
    if (signer && address) {
      fetchSubscriptionDetails();
      setupEventListeners();
    }
  }, [signer, address]);

  const setupEventListeners = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );

      // Listen for subscription purchase events
      contract.on("SubscriptionPurchased", (user, planType, credits, timestamp) => {
        if (user.toLowerCase() === address?.toLowerCase()) {
          console.log('Subscription purchased event:', { planType, credits });
          setSubscription(prev => ({
            ...prev!,
            planType: Number(planType),
          }));
        }
      });

      // Listen for unsubscribe events
      contract.on("SubscriptionUnsubscribed", (user, planType) => {
        if (user.toLowerCase() === address?.toLowerCase()) {
          console.log('Subscription unsubscribed event');
          fetchSubscriptionDetails(); // Fetch full details as plan type changes
        }
      });

      // Listen for free plan claims
      contract.on("FreePlanClaimed", (user, credits, expiresAt) => {
        if (user.toLowerCase() === address?.toLowerCase()) {
          console.log('Free plan claimed:', { credits, expiresAt });
          setSubscription(prev => ({
            ...prev!,
            planType: 0, // Free plan
          }));
        }
      });

      // Cleanup function to remove event listeners
      return () => {
        contract.removeAllListeners();
      };
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  };

  const fetchSubscriptionDetails = async () => {
    try {
      const contract = new ethers.Contract(
        SUBSCRIPTION_ADDRESS,
        InspiraSubscriptionABI.abi,
        signer
      );
      
      const sub = await contract.getUserSubscription(address);
      setSubscription({
        planType: Number(sub.planType),
        subscribedAt: Number(sub.subscribedAt),
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  };

  useEffect(() => {
    if (!address) return;

    const interval = setInterval(fetchSubscriptionDetails, 10000); // 15 secs
    return () => clearInterval(interval);
  }, [address]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--theme-bg))] overflow-x-hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-[100dvh] border-r backdrop-blur-xl transition-all duration-300",
          "border-[hsl(var(--theme-border))] bg-[hsl(var(--theme-bg))]/95",
          isOpen ? "w-[280px]" : "w-[68px]",
          "lg:translate-x-0",
          !isOpen && "lg:w-[68px]",
          !isOpen && "w-[280px]",
          "translate-x-[-100%]",
          isOpen && "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-[hsl(var(--theme-border))] px-4">
            <div className={cn(
              "flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300",
              
            )}>
              <Image
                src="/logo.png"
                alt="Inspira Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <span
              className={cn(
                "ml-3 text-xl font-semibold transition-all duration-300 text-[hsl(var(--theme-fg))]",
                !isOpen && "hidden opacity-0 scale-0"
              )}
            >
              Inspira
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {/* Primary Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => {
                return (
                  <div key={item.name} className="relative group">
                    {item.comingSoon ? (
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors opacity-50 cursor-not-allowed",
                          !isOpen && "justify-center"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", !isOpen && "h-5 w-5")} />
                        <span className={cn("transition-opacity duration-300", !isOpen && "hidden")}>
                          {item.name}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.children ? "#" : item.href}
                        onClick={(e) => {
                          if (item.children) {
                            e.preventDefault()
                            toggleExpand(item.name)
                          } else if (window.innerWidth < 1024) {
                            setIsOpen(false)
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          "hover:bg-[hsl(var(--theme-primary))]/5 hover:text-[hsl(var(--theme-primary))] hover:border-[hsl(var(--theme-primary))]/30",
                          ((item.href === '/' && pathname === '/') || 
                           (item.href !== '/' && pathname.startsWith(item.href)))
                            ? "bg-[hsl(var(--theme-primary))]/5 text-[hsl(var(--theme-primary))]"
                            : "text-[hsl(var(--theme-muted))]",
                          !isOpen && "justify-center"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", !isOpen && "h-5 w-5")} />
                        <span className={cn("transition-opacity duration-300", !isOpen && "hidden")}>
                          {item.name}
                        </span>
                        {item.children && isOpen && (
                          <ChevronRight className={cn(
                            "ml-auto h-4 w-4 shrink-0 transition-transform",
                            expandedItems.includes(item.name) && "transform rotate-90"
                          )} />
                        )}
                      </Link>
                    )}
                    {item.comingSoon && (
                      <div className="absolute right-0 ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-[hsl(var(--theme-fg))]/80 text-[hsl(var(--theme-bg))] rounded text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity group-hover:opacity-100">
                        Coming Soon
                      </div>
                    )}
                    {item.children && (
                      <div className={cn(
                        "ml-6 mt-1 overflow-hidden transition-all duration-200",
                        !expandedItems.includes(item.name) && "h-0 mt-0",
                        !isOpen && "ml-0"
                      )}>
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => {
                              if (window.innerWidth < 1024) { // lg breakpoint
                                setIsOpen(false)
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              "hover:bg-[hsl(var(--theme-primary))]/5 hover:text-[hsl(var(--theme-primary))]",
                              pathname === child.href
                                ? "bg-[hsl(var(--theme-primary))]/5 text-[hsl(var(--theme-primary))]"
                                : "text-[hsl(var(--theme-muted))]",
                              !isOpen && "justify-center"
                            )}
                          >
                            <child.icon className={cn("h-3 w-3 shrink-0", !isOpen && "h-4 w-4")} />
                            <span className={cn("transition-opacity duration-300", !isOpen && "hidden")}>
                              {child.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Secondary Navigation */}
            <div className="mt-6 pt-6 border-t border-[hsl(var(--theme-border))] space-y-1">
              {secondaryNavigation.map((item) => {
                if (item.adminOnly && (!address || address.toLowerCase() !== ADMIN_WALLET?.toLowerCase())) {
                  return null;
                }
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) { // lg breakpoint
                        setIsOpen(false)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2  text-sm transition-colors",
                      "hover:bg-[hsl(var(--theme-primary))]/5 hover:text-[hsl(var(--theme-primary))] hover:border-[hsl(var(--theme-primary))]/30",
                      pathname === item.href
                        ? "bg-[hsl(var(--theme-primary))]/5 text-[hsl(var(--theme-primary))]"
                        : "text-[hsl(var(--theme-muted))]",
                      !isOpen && "justify-center"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", !isOpen && "h-5 w-5")} />
                    <span className={cn("transition-opacity duration-300", !isOpen && "hidden")}>
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Free Plan */}
          <div className="border-t border-[hsl(var(--theme-border))] p-4 mt-auto">
            {isOpen && (
              <div className="my-1 flex flex-col space-y-1">
                <p className="text-xs font-medium text-[hsl(var(--theme-fg))]">
                  {subscription ? plans[subscription.planType].name : 'Please connect your wallet'}
                </p>
                <p className="text-xs text-[hsl(var(--theme-muted))]">
                  {`${formatCredits(credits)} Credits Available`}
                </p>
              </div>
            )}
            {isOpen ? (
              <Link
                href="/upgrade-plan"
                onClick={() => {
                  if (window.innerWidth < 1024) { // lg breakpoint
                    setIsOpen(false)
                  }
                }}
                className="block"
              >
                <Button
                  size="sm"
                  className={cn(
                    "w-full",
                    (!subscription || subscription.planType === 0)
                      ? "bg-gradient-to-r from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] text-[hsl(var(--theme-bg))] hover:opacity-90"
                      : "border border-[hsl(var(--theme-border))]  hover:opacity-90"
                  )}
                >
                  {(!subscription || subscription.planType === 0) ? 'Upgrade Plan' : 'Manage Plan'}
                </Button>
              </Link>
            )
          
          :

          <Link
                href="/upgrade-plan"
                onClick={() => {
                  if (window.innerWidth < 1024) { // lg breakpoint
                    setIsOpen(false)
                  }
                }}
                className="block"
              >
                <Button
                  size="sm"
                  className={cn(
                    "w-full",
                    (!subscription || subscription.planType === 0)
                      ? "bg-gradient-to-r from-[hsl(var(--theme-primary))] to-[hsl(var(--theme-secondary))] text-[hsl(var(--theme-bg))] hover:opacity-90"
                      : "border border-[hsl(var(--theme-border))]  hover:opacity-90"
                  )}
                >
                  <Sparkle className="h-4 w-4 shrink-0" />
                </Button>
              </Link>
          
          }
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "absolute md:-right-3 md:top-12 top-6 right-3 z-[51]  flex items-center justify-center rounded-full transition-all",
              "border bg-[hsl(var(--theme-bg))] border-[hsl(var(--theme-border))]",
              "text-[hsl(var(--theme-muted))] hover:text-[hsl(var(--theme-primary))] hover:border-[hsl(var(--theme-primary))]/30",
              isOpen ? "h-6 w-6" : "h-8 w-8 md:-right-4 -right-12 top-4"
            )}
          >
            {isOpen ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 h-screen flex flex-col",
          "pl-0",
          "lg:pl-[280px]",
          !isOpen && "lg:pl-[68px]"
        )}
      >
        <Header isOpen={isOpen} setIsOpen={setIsOpen} />
        <main className="flex-1 overflow-auto">
          <div className="px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
