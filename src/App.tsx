/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TaskList from "./components/TaskList";
import TaskDetail from "./components/TaskDetail";
import NewTaskModal from "./components/NewTaskModal";
import { Task } from "./types";
import { Sparkles, Loader2, AlertCircle, PlayCircle, Library, Layers } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState("script-recreate");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [apiError, setApiError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Show auto-expiring toasts
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch tasks on mount
  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("获取任务列表失败");
      const data = await response.json();
      setTasks(data);
      setApiError("");
    } catch (err: any) {
      console.error(err);
      setApiError("服务连接异常，请确保开发服务器正常运行。");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Poll tasks if any task is analyzing
  useEffect(() => {
    const hasAnalyzingTask = tasks.some((task) => task.status === "analyzing");
    if (!hasAnalyzingTask) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 2000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Handle task view
  const handleViewTask = (id: string) => {
    setActiveTaskId(id);
  };

  // Handle task delete
  const handleDeleteTask = async (id: string) => {
    if (!confirm("确定要删除这项剧本二创任务吗？此操作无法撤销。")) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("删除失败");
      showToast("任务删除成功");
      fetchTasks();
      if (activeTaskId === id) {
        setActiveTaskId(null);
      }
    } catch (err: any) {
      alert("删除任务失败: " + err.message);
    }
  };

  // Handle creating a new task
  const handleCreateTask = async (name: string, videoNames: string[], analysisPrompt: string) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, videoNames, analysisPrompt }),
      });
      if (!response.ok) throw new Error("创建任务失败");
      
      setIsModalOpen(false);
      showToast("任务创建成功！正在为您进行智能多视频逆向分析...");
      fetchTasks();
    } catch (err: any) {
      alert("创建任务失败: " + err.message);
    }
  };

  // Handle screenplay AI recreation
  const handleRecreateScreenplay = async (prompt: string, model: string) => {
    if (!activeTaskId) return;
    setIsRecreating(true);
    try {
      const response = await fetch(`/api/tasks/${activeTaskId}/recreate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, model }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "二创重写失败");
      }
      
      showToast(`二创剧本已通过 ${model} 生成成功！`);
      fetchTasks();
    } catch (err: any) {
      alert("AI 生成失败: " + err.message);
    } finally {
      setIsRecreating(false);
    }
  };

  // Tab change handler
  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    // If we leave the script-recreate tab, clear detail view state
    if (tabId !== "script-recreate") {
      setActiveTaskId(null);
    }
    setIsCompareMode(false);
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  return (
    <div id="app-root-container" className="flex h-screen w-screen bg-white font-sans text-slate-800 overflow-hidden select-none">
      {/* Sidebar Navigation */}
      {!isCompareMode && <Sidebar currentTab={currentTab} onChangeTab={handleTabChange} />}

      {/* Main Workspace Frame */}
      <main id="main-frame" className="flex-1 flex flex-col overflow-hidden relative">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-indigo-600 border border-indigo-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Global Connection Error Banner */}
        {apiError && (
          <div className="bg-rose-600/10 border-b border-rose-500/20 text-rose-600 text-xs py-2 px-4 flex items-center justify-center gap-2 font-medium shrink-0">
            <AlertCircle className="w-4 h-4" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Tab Router Routing Logic */}
        {currentTab === "script-recreate" ? (
          activeTaskId && activeTask ? (
            <TaskDetail
              task={activeTask}
              onBack={() => {
                setActiveTaskId(null);
                setIsCompareMode(false);
              }}
              onRecreate={handleRecreateScreenplay}
              isRecreating={isRecreating}
              compareMode={isCompareMode}
              setCompareMode={setIsCompareMode}
            />
          ) : (
            <TaskList
              tasks={tasks}
              onViewTask={handleViewTask}
              onDeleteTask={handleDeleteTask}
              onOpenNewTaskModal={() => setIsModalOpen(true)}
            />
          )
        ) : (
          /* Placeholder Views for Other Tabs */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-md shadow-indigo-100/50">
              <Layers className="w-8 h-8" />
            </div>
            <h1 className="font-display font-bold text-slate-900 text-xl tracking-tight mb-2">
              {currentTab === "dashboard" && "仪表盘工作台"}
              {currentTab === "drama-gen" && "AI 短剧生成中心"}
              {currentTab === "image-gen" && "AI 图片/海报生成"}
              {currentTab === "my-works" && "我的作品资产库"}
              {currentTab === "settings" && "系统全局设置"}
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
              这里是正在规划中的高级创作引擎，我们目前首推最具创新性的{" "}
              <span className="text-indigo-600 font-semibold">“剧本二创”</span> 工作台。
              快去剧本二创体验解析视频、定制大女主爽文或龙王打脸的乐趣吧！
            </p>
            <button
              onClick={() => handleTabChange("script-recreate")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>进入 “剧本二创” tab</span>
            </button>
          </div>
        )}

        {/* Modal overlays */}
        {isModalOpen && (
          <NewTaskModal
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateTask}
          />
        )}
      </main>
    </div>
  );
}
