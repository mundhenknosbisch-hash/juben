import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initialTasks } from "./src/data/mockScripts";
import { Task, Screenplay } from "./src/types";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory task store (initialized with mock tasks)
let taskStore: Task[] = [...initialTasks];

// Setup Gemini API Client if API key is present
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or uses placeholder. Will fall back to local generators.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// JSON Schemas for Gemini structure
const screenplaySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    characterBios: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          gender: { type: Type.STRING },
          age: { type: Type.STRING },
          description: { type: Type.STRING },
          isNew: { type: Type.BOOLEAN }
        },
        required: ["name", "gender", "age", "description"]
      }
    },
    episodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sceneNo: { type: Type.STRING },
                time: { type: Type.STRING },
                camera: { type: Type.STRING },
                content: { type: Type.STRING },
                dialogues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      character: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ["character", "text"]
                  }
                }
              },
              required: ["id", "sceneNo", "time", "camera", "content"]
            }
          }
        },
        required: ["title", "scenes"]
      }
    }
  },
  required: ["title", "characterBios", "episodes"]
};

// API Endpoints
// 1. Get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(taskStore);
});

// 2. Get a single task
app.get("/api/tasks/:id", (req, res) => {
  const task = taskStore.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json(task);
});

// 3. Create a new screenplay task
app.post("/api/tasks", async (req, res) => {
  const { name, videoNames, analysisPrompt } = req.body;
  if (!name || !videoNames || !Array.isArray(videoNames)) {
    return res.status(400).json({ error: "Invalid task data" });
  }

  const taskId = "task_" + Math.random().toString(36).substr(2, 9);
  const now = new Date();
  const updateTimeString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const newTask: Task = {
    id: taskId,
    name,
    videoCount: videoNames.length,
    videoNames,
    status: "analyzing",
    analysisPhase: "original",
    updateTime: updateTimeString,
    analysisPrompt: analysisPrompt,
  };

  taskStore.unshift(newTask);

  // Trigger analysis in the background
  analyzeScreenplayBackground(taskId, name, analysisPrompt);

  res.status(201).json(newTask);
});

// 4. Perform screenplay re-creation / rewriting using Gemini
app.post("/api/tasks/:id/recreate", async (req, res) => {
  const { id } = req.params;
  const { prompt, model } = req.body;

  const taskIndex = taskStore.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = taskStore[taskIndex];
  if (!task.originalScript) {
    return res.status(400).json({ error: "Original screenplay is not analyzed yet" });
  }

  const selectedModel = model || "gemini-3.5-flash";

  try {
    const ai = getGeminiClient();
    let recreatedScript: Screenplay;

    if (ai) {
      console.log(`Calling Gemini (${selectedModel}) for recreation of: ${task.name}`);
      const promptText = `
        You are an expert film director and screenwriter.
        Rewrite/Re-create the following screenplay based on the user's specific modification request (Prompt).
        
        Original Screenplay:
        ${JSON.stringify(task.originalScript, null, 2)}
        
        User modifications (Prompt):
        ${prompt}
        
        CRITICAL RULES:
        1. Fully adopt the modification style specified in the Prompt.
        2. Keep the JSON structure identical.
        3. Make sure to identify new or heavily modified characters and set 'isNew: true' on their characterBios.
        4. Make the script dialogue-rich, dramatic, and vivid.
      `;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: screenplaySchema,
          systemInstruction: "You are a top-tier screenplay adaptation agent. Output strictly formatted JSON.",
        },
      });

      const responseText = response.text || "{}";
      recreatedScript = JSON.parse(responseText);
    } else {
      // Fallback generator
      console.log("No Gemini API key found, generating mock recreation screenplay");
      recreatedScript = generateMockRecreation(task.originalScript, prompt);
    }

    // Update task
    task.recreatedScript = recreatedScript;
    task.recreatePrompt = prompt;
    task.recreateModel = selectedModel;
    task.analysisPhase = "recreate";
    task.status = "success";
    
    const now = new Date();
    task.updateTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    res.json(task);
  } catch (error: any) {
    console.error("Recreation failed:", error);
    res.status(500).json({ error: error?.message || "Failed to recreate screenplay via Gemini API" });
  }
});

// 5. Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const taskIndex = taskStore.findIndex((t) => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  taskStore.splice(taskIndex, 1);
  res.json({ success: true });
});

// Background analyzer for new task creation
async function analyzeScreenplayBackground(taskId: string, taskName: string, analysisPrompt?: string) {
  // Wait 3 seconds to simulate complex video analysis (ASR, Scene Detection, Plot extraction)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const task = taskStore.find((t) => t.id === taskId);
  if (!task) return;

  try {
    const ai = getGeminiClient();
    let originalScript: Screenplay;

    if (ai) {
      console.log(`Calling Gemini (gemini-3.5-flash) to extract screenplay from video metadata for: ${taskName}`);
      const promptText = `
        Act as a screenplay reverse engineering AI agent.
        We have uploaded video clips from a short drama named: "${taskName}".
        Generate a highly professional, realistic, and detailed reverse-engineered screenplay representing the original plot of "${taskName}".
        
        Specific analysis guidelines/requirements provided by the user:
        ${analysisPrompt || "No specific instructions provided. Extrapolate standard screenplay."}

        The screenplay must contain:
        1. summary: A short 2-3 sentence overview (in Chinese) summarizing the main plot, characters, and major conflicts.
        2. characterBios: 3 characters or more, with descriptions, age, gender.
        3. episodes: At least 1 episode with 2-3 detailed scenes, including dialogue, times, and camera details.
        
        Format the response strictly using the screenplay JSON schema.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: screenplaySchema,
          systemInstruction: "You are an AI video screenplay analyst. Output professional JSON screenplay structures with a comprehensive plot summary.",
        },
      });

      const responseText = response.text || "{}";
      originalScript = JSON.parse(responseText);
    } else {
      // Create an amazing local script fallback
      originalScript = {
        title: taskName,
        summary: `神医弟子林风奉师命下山与楚家美女总裁楚雨晴履行婚约，恰逢楚老太爷病重。在楚家堂兄楚天耀的百般阻挠与嘲讽下，林风展露绝世神针，将生命垂危的楚老太爷从鬼门关拉回，由此拉开了他在都市豪门之中逆袭、粉碎反派阴谋的精彩大幕。`,
        characterBios: [
          {
            name: "林风",
            gender: "男",
            age: "青年",
            description: "隐世神医的弟子，奉师命下山履行婚约。医术通神，为人低调隐忍，却有着保护弱小的赤子之心。"
          },
          {
            name: "楚雨晴",
            gender: "女",
            age: "青年",
            description: "楚氏集团美女总裁。楚老太爷病重期间苦苦支撑家族企业，承受着堂兄和外戚的联手打压。"
          },
          {
            name: "楚天耀",
            gender: "男",
            age: "青年",
            description: "楚雨晴的堂兄，心胸狭隘，为了争夺继承权暗中给楚老爷子下毒，并勾结外部势力打压楚雨晴。"
          }
        ],
        episodes: [
          {
            title: "第1集：神医下山",
            scenes: [
              {
                id: "sc_1",
                sceneNo: "场景一",
                time: "00:00 - 02:40",
                camera: "全景转近景",
                content: "林风身穿洗得发白的布衣，提着一只旧药箱，站在楚家庄园的大门前。门卫满脸嫌弃地推搡林风，不让他进去。此时，楚雨晴心力交瘁地从里面走出来，楚天耀在一旁冷嘲热讽。",
                dialogues: [
                  { character: "门卫", text: "臭要饭的，滚滚滚！这里是楚家庄园，不是你讨饭的地方！" },
                  { character: "林风", text: "（平静）我是林风，拿着楚老太爷当年写下的婚约，前来探望老爷子。" },
                  { character: "楚天耀", text: "（大笑）哈哈，婚约？爷爷当年病重糊涂，怎么可能给你这种乡巴佬定婚约？雨晴，你可别什么垃圾都往家里带！" }
                ]
              },
              {
                id: "sc_2",
                sceneNo: "场景二",
                time: "02:40 - 06:00",
                camera: "特写",
                content: "楚老爷子的病房内，心电监护仪发出刺耳的长鸣。主治医生无奈摇头宣布抢救失败。楚雨晴痛哭，楚天耀则暗中窃喜。林风排开众人，迅速从旧药箱中取出九枚银针，快准狠地刺入老爷子周身大穴。银针轻微颤动，监护仪竟重新恢复了跳动！",
                dialogues: [
                  { character: "楚天耀", text: "混账！你对爷爷的遗体做什么？保安，把他抓起来！" },
                  { character: "林风", text: "（厉声喝道）闭嘴！若想老爷子活命，就老老实实呆在一边！" },
                  { character: "楚雨晴", text: "（含泪抓住林风的衣袖）求求你……只要能救我爷爷，我什么都答应你！" }
                ]
              }
            ]
          }
        ]
      };
    }

    task.originalScript = originalScript;
    task.status = "success";
    task.analysisPhase = "original";
  } catch (error) {
    console.error("Background analysis failed:", error);
    task.status = "failed";
  }
}

// Simple deterministic local generator for recreation fallback
function generateMockRecreation(original: Screenplay, prompt: string): Screenplay {
  const isBigFemaleLead = prompt.includes("大女主") || prompt.includes("复仇") || prompt.includes("觉醒");
  const isModern = prompt.includes("现代") || prompt.includes("都市");

  // Transform characters
  const transformedBios = original.characterBios.map((bio) => {
    if (bio.gender === "女" && isBigFemaleLead) {
      return {
        ...bio,
        isNew: true,
        description: `【二创·大女主觉醒】${bio.name}。在原本基础上改写为行事杀伐果断、算无遗策的复仇女神。不再懦弱流泪，暗中控盘商战，眼神冷若冰霜，智商绝伦，反转制裁反派。`,
      };
    }
    if (bio.gender === "男" && bio.name.includes("萧") && isBigFemaleLead) {
      return {
        ...bio,
        description: `【二创·伪善败露】${bio.name}。自以为掌握苏家经济命脉，却在法庭上被觉醒后的女主以海量证据当场击垮，陷入彻底的惊慌。`,
      };
    }
    return {
      ...bio,
      description: `【二创·调整】${bio.name}。配合剧情主线，在其行为细节和对话中增加了更多张力与宿命感。`,
    };
  });

  // Transform episodes and scenes
  const transformedEpisodes = original.episodes.map((ep) => {
    return {
      title: ep.title + " (二创改写)",
      scenes: ep.scenes.map((scene) => {
        const modifiedDialogues = scene.dialogues?.map((d) => {
          if (d.character === "苏叶" && isBigFemaleLead) {
            return {
              character: d.character,
              text: `（推开试图挽留的人，声音满是凛然之意）我给过你无数次坦白的机会，可惜你只看到了我的软弱，没看到我背后的刀。萧珩，游戏结束了。`,
            };
          }
          if (d.character === "林风") {
            return {
              character: d.character,
              text: `（冷漠环视，锋芒毕露）这世间，还没我林风留不住的命，也没我林风制裁不了的鬼！`,
            };
          }
          return d;
        });

        return {
          ...scene,
          id: scene.id + "_recreate",
          sceneNo: scene.sceneNo + " (二创改写)",
          camera: "手持跟镜 / 强对比顶光 (增加戏剧张力)",
          content: `【二创改写】${scene.content} 画面风格改为电影感暗冷色调，强化双方阵营的冲突与窒息感。` + (isBigFemaleLead ? ` 主角动作神态极其沉稳坚毅，掌控全局。` : ""),
          dialogues: modifiedDialogues,
        };
      }),
    };
  });

  return {
    title: original.title + " (二创)",
    characterBios: transformedBios,
    episodes: transformedEpisodes,
  };
}

// Start Server Setup (Production vs Dev)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
