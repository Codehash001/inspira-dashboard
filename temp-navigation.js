// Updated navigation structure for US EduFi section
const updatedNavigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: "Home",
  },
  {
    name: "AI Chat",
    href: "/chat",
    icon: "Bot",
  },
  {
    name: "Book Grading",
    href: "/book-grading",
    icon: "BookOpen",
  },
  {
    name: "Image Generation",
    href: "/image-generation",
    icon: "ImageIcon",
  },
  {
    name: "Video Generation",
    href: "/video-generation",
    icon: "Video",
    comingSoon: false,
  },
  {
    name: "Blockchain Tools",
    href: "#",
    icon: "Code",
    children: [
      {
        name: "AI Auditor",
        href: "/blockchain/ai-auditor",
        icon: "Shield",
      }
    ]
  },
  {
    name: "EduFi Tools",
    href: "#",
    icon: "GraduationCap",
    children: [
      {
        name: "US EduFi",
        href: "/edufi/us",
        icon: "Flag",
        children: [
          {
            name: "Advanced Placement (AP)",
            href: "/edufi/us/ap",
            icon: "Brain",
            children: [
              {
                name: "STEM",
                href: "/edufi/us/ap/stem",
                icon: "Atom",
                children: [
                  {
                    name: "AP Calculus AB",
                    href: "/edufi/us/ap/stem/calculus-ab",
                    icon: "Atom",
                  },
                  {
                    name: "AP Physics 1",
                    href: "/edufi/us/ap/stem/physics-1",
                    icon: "Atom",
                  },
                  {
                    name: "AP Computer Science A",
                    href: "/edufi/us/ap/stem/computer-science-a",
                    icon: "Code",
                  },
                  {
                    name: "AP Chemistry",
                    href: "/edufi/us/ap/stem/chemistry",
                    icon: "Beaker",
                  }
                ]
              },
              {
                name: "Social Sciences",
                href: "/edufi/us/ap/social",
                icon: "Globe",
                children: [
                  {
                    name: "AP Psychology",
                    href: "/edufi/us/ap/social/psychology",
                    icon: "Brain",
                  },
                  {
                    name: "AP US History",
                    href: "/edufi/us/ap/social/us-history",
                    icon: "BookMarked",
                  },
                  {
                    name: "AP Economics",
                    href: "/edufi/us/ap/social/economics",
                    icon: "Coins",
                  }
                ]
              },
              {
                name: "Languages",
                href: "/edufi/us/ap/languages",
                icon: "Languages",
                children: [
                  {
                    name: "AP English Literature",
                    href: "/edufi/us/ap/languages/english-literature",
                    icon: "BookOpen",
                  },
                  {
                    name: "AP Spanish Language",
                    href: "/edufi/us/ap/languages/spanish",
                    icon: "Languages",
                  },
                  {
                    name: "AP Mandarin",
                    href: "/edufi/us/ap/languages/mandarin",
                    icon: "Languages",
                  }
                ]
              },
              {
                name: "Creative Studies",
                href: "/edufi/us/ap/creative",
                icon: "Palette",
                children: [
                  {
                    name: "AP Studio Art",
                    href: "/edufi/us/ap/creative/studio-art",
                    icon: "Palette",
                  },
                  {
                    name: "AP Music Theory",
                    href: "/edufi/us/ap/creative/music-theory",
                    icon: "Music",
                  },
                  {
                    name: "Environmental Science",
                    href: "/edufi/us/ap/creative/environmental-science",
                    icon: "Leaf",
                  }
                ]
              }
            ]
          },
          {
            name: "College Prep",
            href: "/edufi/us/college-prep",
            icon: "School",
            children: [
              {
                name: "Test Prep",
                href: "#",
                icon: "FileText",
                children: [
                  {
                    name: "SAT Prep",
                    href: "/edufi/us/college-prep/test-prep/sat",
                    icon: "FileText",
                  },
                  {
                    name: "ACT Prep",
                    href: "/edufi/us/college-prep/test-prep/act",
                    icon: "FileText",
                  },
                  {
                    name: "AP Exam Strategy",
                    href: "/edufi/us/college-prep/test-prep/ap-strategy",
                    icon: "Lightbulb",
                  }
                ]
              },
              {
                name: "Academic Skills",
                href: "#",
                icon: "BookOpen",
                children: [
                  {
                    name: "Time Management",
                    href: "/edufi/us/college-prep/academic/time-management",
                    icon: "Timer",
                  },
                  {
                    name: "Essay Writing",
                    href: "/edufi/us/college-prep/academic/essay-writing",
                    icon: "Pencil",
                  },
                  {
                    name: "Note Taking Techniques",
                    href: "/edufi/us/college-prep/academic/note-taking",
                    icon: "Pencil",
                  }
                ]
              },
              {
                name: "Career Guidance",
                href: "#",
                icon: "Briefcase",
                children: [
                  {
                    name: "Choosing a Major",
                    href: "/edufi/us/college-prep/career/choosing-major",
                    icon: "Lightbulb",
                  },
                  {
                    name: "College Admissions",
                    href: "/edufi/us/college-prep/career/admissions",
                    icon: "Building",
                  },
                  {
                    name: "Scholarship Planning",
                    href: "/edufi/us/college-prep/career/scholarships",
                    icon: "Coins",
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
        icon: "Flag",
        children: [
          // UK EduFi structure remains unchanged
        ]
      }
    ]
  }
];
