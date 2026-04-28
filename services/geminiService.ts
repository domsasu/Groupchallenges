import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getCoachResponse = async (
  userQuery: string,
  currentLessonContext: string
): Promise<string> => {
  if (!ai) {
    return "AI Coach is currently offline (API Key missing).";
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a friendly and helpful teaching assistant named 'Coach' for an online course.
      The student is currently looking at a lesson titled: "${currentLessonContext}".
      
      Answer the student's question concisely and encouragingly.
      If the question is about the lesson, use the context of the title to infer what they might be asking about, 
      but admit if you don't have the specific transcript.
      
      Student Question: ${userQuery}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I couldn't generate a response right now.";
  } catch (error) {
    console.error("Error querying Gemini:", error);
    return "Sorry, I encountered an error while thinking.";
  }
};

export const getAssignmentSummary = async (lessonTitle: string): Promise<string[]> => {
    if (!ai) return ["Data Analysis", "Critical Thinking", "Problem Solving"]; 

    const model = "gemini-2.5-flash";
    const prompt = `
      You are an expert curriculum designer. 
      Identify the top 3-5 specific sub-skills a student will demonstrate by completing the data analytics assignment titled: "${lessonTitle}".
      Return ONLY a JSON array of strings, e.g. ["Skill 1", "Skill 2"]. Do not add markdown formatting like \`\`\`json.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        const text = response.text || "";
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("AI Summary failed", e);
        return ["Data Analysis", "Critical Thinking", "Problem Solving"];
    }
};