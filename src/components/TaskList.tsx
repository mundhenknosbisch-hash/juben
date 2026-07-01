/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Plus, Eye, Trash2, SlidersHorizontal, Loader2, PlayCircle, FileText } from "lucide-react";
import { Task } from "../types";

interface TaskListProps {
  tasks: Task[];
  onViewTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenNewTaskModal: () => void;
}

export default function TaskList({ 
  tasks, 
  onViewTask, 
  onDeleteTask, 
  onOpenNewTaskModal 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filtering tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "success" && task.status === "success") ||
      (statusFilter === "recreated" && task.status === "success" && !!task.recreatedScript) ||
      (statusFilter === "not-recreated" && task.status === "success" && !task.recreatedScript) ||
      (statusFilter === "analyzing" && task.status === "analyzing") ||
      (statusFilter === "failed" && task.status === "failed");
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="task-list-wrapper" className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight">二创任务列表</h1>
          <p className="text-slate-500 text-sm">
            负责视频剧本逆向提取、结构分析与AI二创改写工作。
          </p>
        </div>
        <button
          onClick={onOpenNewTaskModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>新建剧本任务</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索项目名称..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="all">全部状态</option>
            <option value="success">成功 (全部)</option>
            <option value="recreated">成功 (已改写)</option>
            <option value="not-recreated">成功 (未改写)</option>
            <option value="analyzing">分析中</option>
            <option value="failed">失败</option>
          </select>
          <SlidersHorizontal className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Total stats label */}
        <div className="ml-auto text-xs font-mono text-slate-400">
          共 {filteredTasks.length} 项任务
        </div>
      </div>

      {/* Table Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">项目名称</th>
                <th className="px-6 py-4">源视频数</th>
                <th className="px-6 py-4">分析阶段</th>
                <th className="px-6 py-4">当前状态</th>
                <th className="px-6 py-4">更新时间</th>
                <th className="px-6 py-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm text-slate-600">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    暂无符合条件的二创任务，点击右上角新建一个吧！
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  return (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>{task.name}</span>
                        </div>
                      </td>

                      {/* Video Count */}
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {task.videoCount}
                      </td>

                      {/* Analysis Phase Badges */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {/* Phase 1: 原片分析 */}
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                            task.analysisPhase === "original" && task.status === "success"
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-200 font-semibold"
                              : "bg-slate-100 text-slate-400 border border-slate-200/60"
                          }`}>
                            原片分析
                          </span>

                          {/* Phase 2: 二创改写 */}
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                            (task.analysisPhase === "recreate" || task.analysisPhase === "storyboard") && task.status === "success"
                              ? "bg-purple-50 text-purple-600 border border-purple-200 font-semibold"
                              : "bg-slate-100 text-slate-400 border border-slate-200/60"
                          }`}>
                            二创改写
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {task.status === "success" && (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              解析成功
                            </span>
                            {task.recreatedScript ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                                已改写
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                未改写
                              </span>
                            )}
                          </div>
                        )}
                        {task.status === "analyzing" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                            分析中
                          </span>
                        )}
                        {task.status === "failed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            失败
                          </span>
                        )}
                      </td>

                      {/* Update Time */}
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {task.updateTime}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onViewTask(task.id)}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 text-indigo-600 transition-all flex items-center gap-1 text-xs"
                            title="查看任务"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>查看</span>
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-600 transition-all"
                            title="删除任务"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
