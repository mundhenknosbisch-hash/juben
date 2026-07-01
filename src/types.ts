/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Dialogue {
  character: string;
  text: string;
}

export interface Scene {
  id: string;
  sceneNo: string;
  time: string;
  camera?: string;
  content: string;
  dialogues?: Dialogue[];
}

export interface Episode {
  title: string;
  scenes: Scene[];
}

export interface CharacterBio {
  name: string;
  gender: string;
  age: string;
  description: string;
  isNew?: boolean; // Highlight newly added or modified characters in recreation
}

export interface Screenplay {
  title: string;
  summary?: string;
  characterBios: CharacterBio[];
  episodes: Episode[];
}

export type TaskStatus = "analyzing" | "success" | "failed";
export type AnalysisPhase = "original" | "recreate" | "storyboard";

export interface Task {
  id: string;
  name: string;
  videoCount: number;
  videoNames: string[];
  status: TaskStatus;
  analysisPhase: AnalysisPhase;
  updateTime: string;
  originalScript?: Screenplay;
  recreatedScript?: Screenplay;
  recreatePrompt?: string;
  recreateModel?: string;
  analysisPrompt?: string;
}
