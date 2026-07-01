/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Video, Clock, MessageSquare, Search, Sparkles } from "lucide-react";
import { Screenplay } from "../types";

interface ScriptViewerProps {
  script?: Screenplay;
  isRecreated?: boolean;
  isLoading?: boolean;
}

export default function ScriptViewer({ script, isRecreated = false, isLoading = false }: ScriptViewerProps) {
  const [viewMode, setViewMode] = useState<string>("full"); // "full" | "bios" | "ep_0", "ep_1", etc.
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-y-80 p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl space-y-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-indigo-100 rounded-full animate-ping opacity-60"></div>
          <div className="relative w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2 max-w-sm">
          <h4 className="text-sm font-semibold text-slate-800">正在进行视频智能解析与剧本提取</h4>
          <p className="text-xs text-slate-400">我们将逐帧解析镜头画面、提取台词ASR，并使用 Gemini 多模态模型反向生成结构化剧本...</p>
        </div>

        {/* Progress simulator list */}
        <div className="w-full max-w-xs bg-white border border-slate-200 rounded-xl p-4 text-left space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
              画面场景切割与人脸识别
            </span>
            <span className="text-indigo-600 font-mono font-semibold">进行中 45%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-[loading_2s_infinite]" style={{ width: "45%" }}></div>
          </div>
          
          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
            <span className="text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              ASR 语音转文字识别
            </span>
            <span className="text-slate-400 font-mono">等待中</span>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
            <span className="text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              大模型多模态剧本生成
            </span>
            <span className="text-slate-400 font-mono">等待中</span>
          </div>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed border-slate-200 rounded-xl bg-slate-50 p-6 text-center">
        <Video className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
        <p className="text-slate-600 text-sm font-medium">暂无剧本数据</p>
        <p className="text-slate-400 text-xs mt-1">请完成视频解析或二创改写后查看</p>
      </div>
    );
  }

  // Filter character bios based on search query
  const filteredBios = script.characterBios.filter((bio) =>
    bio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bio.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map and filter episodes/scenes based on search query
  const filteredEpisodes = script.episodes.map((ep, idx) => {
    const matchedScenes = ep.scenes.filter((scene) =>
      scene.sceneNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.dialogues?.some((d) =>
        d.character.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    return { ...ep, originalIndex: idx, scenes: matchedScenes };
  }).filter((ep) => ep.scenes.length > 0);

  // Helper to render character bios section
  const renderBiosSection = () => (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
        <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
        人物小传
      </h3>
      {filteredBios.length === 0 ? (
        <p className="text-center py-4 text-slate-400 text-xs">未搜索到相关人物</p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredBios.map((bio, index) => (
            <div
              key={index}
              className={`p-4 border rounded-xl transition-all ${
                bio.isNew
                  ? "bg-purple-50/60 border-purple-200/80 ring-1 ring-purple-100 shadow-xs"
                  : "bg-slate-50/40 border-slate-200/60 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    bio.isNew 
                      ? "bg-purple-100/80 border-purple-200 text-purple-600" 
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-slate-800 text-sm">{bio.name}</span>
                    <span className="ml-2 text-[10px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300/40">
                      {bio.gender} / {bio.age}
                    </span>
                  </div>
                </div>
                {bio.isNew && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    二创改写
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                {bio.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Helper to render episodes & scenes
  const renderEpisodesSection = (targetEpIndex?: number) => {
    // If targetEpIndex is specified, only render that episode (if it has matching scenes after filter)
    const epsToRender = targetEpIndex !== undefined 
      ? filteredEpisodes.filter(ep => ep.originalIndex === targetEpIndex)
      : filteredEpisodes;

    if (epsToRender.length === 0) {
      return <p className="text-center py-6 text-slate-400 text-xs">未搜索到匹配的剧本场景</p>;
    }

    return (
      <div className="space-y-6">
        {epsToRender.map((ep, epIdx) => (
          <div key={epIdx} className="space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
              {ep.title}
            </h3>

            <div className="space-y-4">
              {ep.scenes.map((scene, scIdx) => (
                <div
                  key={scene.id || scIdx}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Scene Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">
                      {scene.sceneNo}
                    </span>
                    <div className="text-xs text-slate-400 font-mono">
                      <span>{scene.time}</span>
                    </div>
                  </div>

                  {/* Scene Content / Narration */}
                  <div className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {scene.content}
                  </div>

                  {/* Dialogues */}
                  {scene.dialogues && scene.dialogues.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100/60">
                      <div className="space-y-2.5">
                        {scene.dialogues.map((dlg, dlgIdx) => (
                          <div key={dlgIdx} className="text-xs leading-relaxed flex items-start gap-1">
                            <span className="font-bold text-slate-800 shrink-0 min-w-[4rem]">
                              {dlg.character}：
                            </span>
                            <span className="text-slate-600 font-sans whitespace-pre-wrap flex-1">
                              {dlg.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Search & Selector Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4 shrink-0">
        
        {/* View Mode Dropdown Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-slate-500">查看范围:</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs transition-all"
          >
            <option value="full">全本 (包含人物与简介)</option>
            <option value="bios">人物小传</option>
            {script.episodes.map((ep, idx) => (
              <option key={idx} value={`ep_${idx}`}>{ep.title}</option>
            ))}
          </select>
        </div>

        {/* Script level Search */}
        <div className="relative w-full sm:w-44">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索人物、台词、场景..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Main Body Document Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 bg-white">
        
        {/* Render View Based on Mode */}
        {viewMode === "full" ? (
          <div className="space-y-6">
            {/* 1. Plot Summary */}
            {script.summary && (
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
                  剧情简介
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">
                  {script.summary}
                </p>
              </div>
            )}

            {/* 2. Character Bios */}
            {renderBiosSection()}

            {/* 3. Screenplay Episodes */}
            <div className="pt-2">
              {renderEpisodesSection()}
            </div>
          </div>
        ) : viewMode === "bios" ? (
          renderBiosSection()
        ) : (
          /* Single Episode mode: Extract selected episode index */
          renderEpisodesSection(parseInt(viewMode.split("_")[1]))
        )}
      </div>
    </div>
  );
}
