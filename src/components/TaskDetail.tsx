/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowLeft, 
  Video, 
  Sparkles, 
  Download, 
  LayoutGrid, 
  Tv, 
  Compass, 
  HelpCircle, 
  Upload, 
  RefreshCw,
  Loader2,
  CheckCircle,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Film
} from "lucide-react";
import { Task } from "../types";
import ScriptViewer from "./ScriptViewer";

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
  onRecreate: (prompt: string, model: string) => Promise<void>;
  isRecreating: boolean;
  compareMode?: boolean;
  setCompareMode?: (active: boolean) => void;
}

export default function TaskDetail({ 
  task, 
  onBack, 
  onRecreate, 
  isRecreating,
  compareMode: propCompareMode,
  setCompareMode: propSetCompareMode
}: TaskDetailProps) {
  const [model, setModel] = useState(task.recreateModel || "gemini-3.5-flash");
  const [prompt, setPrompt] = useState(
    task.recreatePrompt || 
    "1. 将原本悲弱的女主改写为大女主复仇人设。\n2. 删减回忆铺垫，开场直接切入高潮法庭戏，增强悬念感。"
  );
  
  // State for side-by-side full screen compare mode
  const [localCompareMode, setLocalCompareMode] = useState(false);
  const compareMode = propCompareMode !== undefined ? propCompareMode : localCompareMode;
  const setCompareMode = propSetCompareMode !== undefined ? propSetCompareMode : setLocalCompareMode;

  // State to control settings panel expanded/collapsed state (starts collapsed if already recreated)
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(!task.recreatedScript);

  // Suggested prompts
  const suggestedPrompts = [
    { label: "大女主反杀", text: "1. 将原本悲弱的女主改写为大女主复仇人设。\n2. 开场直接切入高潮谈判或法庭对线，增加戏剧张力。" },
    { label: "反转打脸", text: "1. 增加楚天耀/萧珩的嚣张气焰，制造极度压抑氛围。\n2. 在结局设计神医/主角亮出王牌，迎来神级反转，高能逆袭打脸。" },
    { label: "快节奏短剧", text: "1. 砍掉30%的过渡对话，加快对话和场景切换频率。\n2. 每2分钟添加一个爆点/悬念，以便更适合抖音短剧平台传播。" }
  ];

  const handleExport = (isRecreated: boolean = true) => {
    const scriptToExport = isRecreated ? task.recreatedScript : task.originalScript;
    if (!scriptToExport) return;
    
    // Construct beautiful text output
    let textContent = `【AI剧本二创系统】 导出文档 (${isRecreated ? "二创剧本" : "原始剧本"})\n`;
    textContent += `=========================================\n`;
    textContent += `项目名称: ${task.name}\n`;
    if (isRecreated) {
      textContent += `改编模型: ${model}\n`;
      textContent += `修改要求 (Prompt):\n${prompt}\n`;
    } else {
      textContent += `剧本类型: 视频素材逆向解析还原\n`;
    }
    textContent += `=========================================\n\n`;
    
    textContent += `【人物小传】\n`;
    scriptToExport.characterBios.forEach((bio) => {
      textContent += `角色: ${bio.name} (${bio.gender}/${bio.age})\n`;
      textContent += `人设描述: ${bio.description}\n\n`;
    });
    
    textContent += `【剧本内容】\n`;
    scriptToExport.episodes.forEach((ep) => {
      textContent += `=== ${ep.title} ===\n\n`;
      ep.scenes.forEach((sc) => {
        textContent += `[${sc.sceneNo}] - ${sc.camera || ""} (${sc.time})\n`;
        textContent += `场景叙事: ${sc.content}\n`;
        if (sc.dialogues && sc.dialogues.length > 0) {
          textContent += `台词对话:\n`;
          sc.dialogues.forEach((dlg) => {
            textContent += `  ${dlg.character}: ${dlg.text}\n`;
          });
        }
        textContent += `\n-----------------------------------------\n\n`;
      });
    });

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = isRecreated 
      ? `${task.name}_二创剧本_${model}.txt`
      : `${task.name}_原始剧本.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyPresetPrompt = (presetText: string) => {
    setPrompt(presetText);
  };

  return (
    <div id="task-detail-container" className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-screen">
      {/* Subheader Back panel */}
      <div className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <h2 className="text-sm font-semibold text-slate-950 font-display">
            查看任务：{task.name}
          </h2>
        </div>

        {/* Compare Mode Toggle indicator */}
        <div className="flex items-center gap-2">
          {task.recreatedScript && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                compareMode 
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              }`}
            >
              {compareMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{compareMode ? "退出对照模式" : "全屏对照模式"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Workspace Layout */}
      {compareMode ? (
        /* ==================== COMPARE MODE (左右对照原剧本和新剧本, 占位极大) ==================== */
        <div className="flex-1 p-6 flex gap-6 overflow-hidden bg-slate-50">
          {/* Left Panel: Original Script */}
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-indigo-600" />
                <span>原始剧本 (AI还原)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(false)}
                  className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>导出文档</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl bg-white border border-slate-200">
              <ScriptViewer script={task.originalScript} />
            </div>
          </div>

          {/* Right Panel: Recreated Script */}
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>AI 二创剧本结果</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(true)}
                  className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>导出文档</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl bg-white border border-slate-200">
              <ScriptViewer script={task.recreatedScript} isRecreated={true} />
            </div>
          </div>
        </div>
      ) : (
        /* ==================== STANDARD WORKSPACE VIEW ==================== */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 gap-6">
          
          {/* COLUMN 1: 1. 视频上传与逆向解析 */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
            {/* Column Header & Upload Info Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5 shrink-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm">1. 视频上传与逆向解析</h3>
                  </div>
                </div>
                {task.status === "analyzing" ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                    分析中
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    解析完成
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 pt-0.5">
                <Film className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {task.videoNames.join(", ")}
                  </p>
                  {task.status === "analyzing" ? (
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      正在提取画面特征与语音(ASR)...
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      共 {task.videoCount} 个视频素材 · 画面与ASR解析成功
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Large Document display area */}
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📜 原始剧本结构 (AI还原)</span>
                </h4>
                <button
                  disabled={task.status === "analyzing"}
                  onClick={() => handleExport(false)}
                  className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 rounded flex items-center gap-1 transition-all cursor-pointer font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出文档</span>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScriptViewer script={task.originalScript} isLoading={task.status === "analyzing"} />
              </div>
            </div>
          </div>

          {/* COLUMN 2: 2. 剧本 AI 二创改写 */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
            {/* Column Header & Config Toggle Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5 shrink-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm">2. 剧本 AI 二创改写</h3>
                  </div>
                </div>
                {task.recreatedScript ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    改写完成
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    待改写
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <div className="min-w-0 flex-1">
                  {task.recreatedScript ? (
                    <p className="text-xs text-slate-500 truncate">
                      模型：<span className="font-semibold text-slate-700">{model}</span> · 二创改写成功
                    </p>
                  ) : (
                    <p className="text-xs text-slate-450">
                      尚未生成二创剧本，请展开配置进行改写
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-all cursor-pointer shadow-xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isSettingsExpanded ? "收起配置" : "修改二创要求"}</span>
                </button>
              </div>
            </div>

            {/* AI Settings Form Box */}
            {isSettingsExpanded && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shrink-0 shadow-sm animate-fadeIn">
                {/* Model Choice */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    选择改写大模型
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (推荐，极速智能)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (轻量，超低时延)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (深度推理，更擅长宏大叙事)</option>
                  </select>
                </div>

                {/* Requirement Input (Prompt) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      二创修改要求 (Prompt)
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入您对剧本的二创改写规则。例如：1. 将原本悲弱的女主改写为大女主复仇人设。2. 开场直接进入法庭对线爆发冲突。"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400 resize-none font-sans leading-relaxed"
                  />
                </div>

                {/* Action trigger button */}
                <button
                  disabled={isRecreating}
                  onClick={async () => {
                    await onRecreate(prompt, model);
                    setIsSettingsExpanded(false);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white py-2.5 px-4 rounded-lg font-semibold text-sm shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isRecreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>正在调遣 Gemini 生成二创剧本...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>开始生成二创剧本</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Results document viewer area */}
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✨ AI 二创剧本结果</span>
                </h4>
                {task.recreatedScript && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCompareMode(true)}
                      className="px-2.5 py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded flex items-center gap-1 transition-all cursor-pointer font-semibold"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>对照模式</span>
                    </button>
                    <button
                      onClick={() => handleExport(true)}
                      className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>导出文档</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {isRecreating ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50/50 border border-dashed border-slate-250 rounded-xl">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                    <p className="text-sm text-slate-700 font-medium">大语言模型正在重构内容中...</p>
                    <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed">
                      重新组织剧情主线、替换核心人物关系并调整场景对话，生成高质量的二创剧本，预计需要 5-10 秒。
                    </p>
                  </div>
                ) : task.recreatedScript ? (
                  <ScriptViewer script={task.recreatedScript} isRecreated={true} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                    <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">
                      在上方配置您的二创修改要求 (Prompt) 和模型，点击开始生成！
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
