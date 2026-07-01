/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LayoutDashboard, 
  Film, 
  Sparkles, 
  Image, 
  FolderHeart, 
  Settings, 
  ChevronRight,
  Tv
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, onChangeTab }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "仪表盘", icon: LayoutDashboard, group: "工作台" },
    { id: "drama-gen", label: "短剧生成", icon: Film, group: "创作中心" },
    { id: "script-recreate", label: "剧本二创", icon: Sparkles, group: "创作中心", isNew: true },
    { id: "image-gen", label: "图片生成", icon: Image, group: "创作中心" },
    { id: "my-works", label: "我的作品", icon: FolderHeart, group: "资产管理" },
    { id: "settings", label: "设置", icon: Settings, group: "资产管理" },
  ];

  // Group items
  const groups = ["工作台", "创作中心", "资产管理"];

  return (
    <aside id="sidebar-container" className="w-64 bg-slate-50 border-r border-slate-200 text-slate-700 flex flex-col h-screen shrink-0">
      {/* Sidebar Header Logo */}
      <div id="sidebar-logo" className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-slate-900 text-base tracking-wide">AI 编剧系统</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div id="sidebar-nav" className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        {groups.map((group) => {
          const itemsInGroup = menuItems.filter((item) => item.group === group);
          return (
            <div key={group} className="space-y-2">
              <h3 className="px-3 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                {group}
              </h3>
              <div className="space-y-1">
                {itemsInGroup.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-item-${item.id}`}
                      onClick={() => onChangeTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "hover:bg-slate-200/60 hover:text-slate-900 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.isNew && !isActive && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-indigo-500/10 text-indigo-600 rounded uppercase">
                          Hot
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User profile section */}
      <div id="sidebar-profile" className="p-4 border-t border-slate-200 flex items-center gap-3 bg-slate-100/50">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-semibold font-display">
          U
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-slate-800 truncate">Demo User</span>
          <span className="text-xs text-slate-500 truncate">mundhenknosbisch@gmail.com</span>
        </div>
      </div>
    </aside>
  );
}
