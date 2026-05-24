'use client';

import { ArrowLeft, Captions, FolderOpen, Image, Sparkles, Square, Type } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipPanel, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarPanelType, useSidebarPanel } from './sidebar-panel/sidebar-panel-context';

interface SidebarButtonProps {
  children: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  isActive?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ children, tooltip, onClick, isActive }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={onClick}
        className={cn(
          'flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white',
          isActive && 'bg-white/10 text-white',
        )}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipPanel side="right">{tooltip}</TooltipPanel>
  </Tooltip>
);

type SidebarItemConfig = {
  icon: React.FC<{ className?: string }>;
  label: string;
  panelType: SidebarPanelType;
};

const sidebarItems: SidebarItemConfig[] = [
  { icon: FolderOpen, label: 'Assets', panelType: 'assets' },
  { icon: Type, label: 'Text', panelType: 'text' },
  { icon: Square, label: 'Shapes', panelType: 'solid' },
  { icon: Image, label: 'Images', panelType: 'image' },
  { icon: Captions, label: 'Captions', panelType: 'captions' },
  { icon: Sparkles, label: 'Motion', panelType: 'motion-design' },
];

export const EditorSidebar: React.FC = () => {
  const { activePanel, setActivePanel } = useSidebarPanel();

  return (
    <aside className="border-r-editor-starter-border bg-editor-starter-panel flex h-full w-12 flex-col border-r">
      <div className="flex flex-col items-center gap-1 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/" className="flex size-8 items-center justify-center rounded-md text-white hover:bg-white/10">
              <NextImage src="/icon.svg" alt="Framedeck" width={18} height={18} className="size-8" />
            </Link>
          </TooltipTrigger>
          <TooltipPanel side="right">Framedeck</TooltipPanel>
        </Tooltip>
      </div>

      <div className="mx-2 border-t border-white/10" />

      <div className="flex flex-1 flex-col items-center gap-1 p-2">
        {sidebarItems.map((item) => (
          <SidebarButton
            key={item.label}
            tooltip={item.label}
            onClick={() => setActivePanel(item.panelType)}
            isActive={item.panelType === activePanel}
          >
            <item.icon className="size-4" />
          </SidebarButton>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/projects"
              className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipPanel side="right">Back to Projects</TooltipPanel>
        </Tooltip>
      </div>
    </aside>
  );
};
