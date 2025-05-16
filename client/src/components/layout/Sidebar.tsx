import { SidebarSection, SidebarNavItem } from "@/types";
import { cn } from "@/lib/utils";
import { Home, Terminal, Database, LineChart, ShieldCheck, FileText, GitBranch, HardDrive, Settings, Star, Code, Link, Cpu } from "lucide-react";

const sidebarNavItems: SidebarSection[] = [
  {
    title: "Navigation",
    items: [
      {
        icon: "Home",
        label: "Home",
        href: "/",
        active: true,
      },
      {
        icon: "Terminal",
        label: "Projects",
        href: "/projects",
      },
      {
        icon: "Database",
        label: "Data Sources",
        href: "/data-sources",
      },
      {
        icon: "LineChart",
        label: "Analytics",
        href: "/analytics",
      },
    ],
  },
  {
    title: "Components",
    items: [
      {
        icon: "ShieldCheck",
        label: "Security",
        href: "/security",
      },
      {
        icon: "FileText",
        label: "Prompt Engineering",
        href: "/prompt-engineering",
      },
      {
        icon: "GitBranch",
        label: "Routing Logic",
        href: "/routing-logic",
      },
      {
        icon: "HardDrive",
        label: "Caching",
        href: "/caching",
      },
      {
        icon: "Settings",
        label: "API Management",
        href: "/api-management",
      },
    ],
  },
  {
    title: "Models",
    items: [
      {
        icon: "Star",
        label: "Primary LLMs",
        href: "/models/primary",
      },
      {
        icon: "Code",
        label: "Code Models",
        href: "/models/code",
      },
      {
        icon: "Link",
        label: "Embeddings",
        href: "/models/embeddings",
      },
    ],
  },
];

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  Terminal: <Terminal className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  LineChart: <LineChart className="h-4 w-4" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  GitBranch: <GitBranch className="h-4 w-4" />,
  HardDrive: <HardDrive className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  Star: <Star className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Link: <Link className="h-4 w-4" />,
};

export default function Sidebar() {
  return (
    <aside className="w-14 md:w-60 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="p-2 md:p-4 flex flex-col h-full">
        {sidebarNavItems.map((section, index) => (
          <div key={index} className="mb-4">
            <h2 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-2 hidden md:block">
              {section.title}
            </h2>
            <nav>
              {section.items.map((item, itemIndex) => (
                <a
                  key={itemIndex}
                  href={item.href}
                  className={cn(
                    "flex items-center md:space-x-2 p-2 rounded text-sm mb-1",
                    item.active
                      ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750"
                  )}
                >
                  {iconMap[item.icon]}
                  <span className="hidden md:block">{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        ))}

        <div className="mt-auto hidden md:block">
          <div className="flex items-center space-x-3 p-2 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-medium">Gateway Status</h4>
              <div className="flex items-center text-xs mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                <span>Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
