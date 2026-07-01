/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { X, Upload, Film, AlertCircle, Plus } from "lucide-react";

interface NewTaskModalProps {
  onClose: () => void;
  onSubmit: (name: string, videoNames: string[], analysisPrompt: string) => void;
}

export default function NewTaskModal({ onClose, onSubmit }: NewTaskModalProps) {
  const [name, setName] = useState("");
  const [videoNames, setVideoNames] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState(
    "逐帧解析整部视频，输出带时间戳的镜头描述、全部人物台词、分镜剧情大纲或者精准识别并提取短剧视频中的场景、人物、对话等核心元素，转化为结构化剧本文本。"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const names = filesArray.map((f: any) => f.name);
      setVideoNames((prev) => [...prev, ...names]);
      setError("");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const names = filesArray.map((f: any) => f.name);
      setVideoNames((prev) => [...prev, ...names]);
      setError("");
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setVideoNames((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("请输入项目名称");
      return;
    }

    let finalVideos = [...videoNames];
    if (finalVideos.length === 0) {
      // Auto-generate virtual video names if the user didn't upload files, to make testing easy
      const cleanName = name.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
      finalVideos = [`${cleanName}_1.mp4`, `${cleanName}_2.mp4`];
    }

    onSubmit(name.trim(), finalVideos, analysisPrompt.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div 
        id="new-task-modal-container"
        className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-bold text-lg">新建二创任务</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              项目名称 / 剧本标题
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：豪门复仇记-测试一"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Analysis requirements prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              剧本智能分析要求
            </label>
            <textarea
              rows={4}
              value={analysisPrompt}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              placeholder="请输入视频智能分析提取剧本的特定要求或指令..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Drag & Drop File Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              上传视频素材（支持多选）
            </label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-slate-50/50 hover:border-indigo-500 hover:bg-indigo-50/10"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-500 mb-3 border border-slate-200 shadow-sm">
                <Upload className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-slate-700 text-center">
                拖拽视频文件到此，或 <span className="text-indigo-600 hover:underline">点击上传</span>
              </p>
              <p className="text-xs text-slate-400 text-center mt-1">
                支持 MP4, MKV, AVI, MOV 等视频格式（未上传将自动生成测试素材）
              </p>
            </div>
          </div>

          {/* Uploaded File List */}
          {videoNames.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                已选素材 ({videoNames.length})
              </span>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50">
                {videoNames.map((vName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-700 truncate">
                      <Film className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate font-mono">{vName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-md shadow-indigo-600/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>创建并开始智能分析</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
