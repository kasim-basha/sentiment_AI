import { GoogleGenAI, Type } from "@google/genai";
import { config } from "../config";
import {
  AnalysisSessionTable,
  AnalysisResultTable,
  ClarityMessageTable,
  ClarityStructuredResponse,
  ClarityMessageReference
} from "../database/types";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || ""
    });
  }
  return aiClient;
}

const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

async function generateWithTimeout(params: any, timeoutMs: number = 35000): Promise<any> {
  const client = getAiClient();
  const promise = client.models.generateContent(params);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Gemini Clarity API call timed out after ${timeoutMs / 1000}s`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Builds a structured, compact representation of the analysis for the system prompt.
 */
function buildCompactAnalysisContext(
  session: AnalysisSessionTable,
  result?: AnalysisResultTable | null
): string {
  const sentimentScorePct = Math.round((session.overallSentiment?.score ?? session.score ?? 0.5) * 100);
  const dominant = session.emotions?.dominant;
  const secondary = session.emotions?.secondary || [];

  const coaching = result?.coachingData || (result?.fullResultJson?.sentiment_coaching);

  return `
=== VERIFIED SENTIMENTAI ANALYSIS DATA ===
Analysis ID: ${session.analysisId}
Created Date: ${session.createdAt}
Input Summary:
- Text inputs: ${session.inputSummary?.textCount || 0}
- Images analyzed: ${session.inputSummary?.imageCount || 0}
- Video files: ${session.inputSummary?.videoCount || 0}
- Total files: ${session.inputSummary?.totalFiles || 0}
- Direct text submitted: ${session.inputSummary?.hasDirectText ? "Yes" : "No"}

Overall Sentiment:
- Polarity Label: ${session.overallSentiment?.label || "Neutral"}
- Sentiment Score: ${sentimentScorePct}% (0% = Maximum Negative, 100% = Maximum Positive)
- Model Confidence: ${session.overallSentiment?.confidence || session.confidence || "Medium"}
- Intensity: ${session.overallSentiment?.intensity || "Moderate"}

Emotion Discovery:
- Dominant Emotion: ${dominant ? `${dominant.name} (Intensity: ${dominant.intensity}, Reason: "${dominant.reason}")` : "Not specified"}
- Secondary Emotions: ${secondary.map(s => `${s.name} (${s.intensity} - ${s.reason})`).join("; ") || "None"}

Linguistic & Semantic Meaning:
"${session.meaning || "No meaning summary provided."}"

Emotional Context:
"${session.emotionalContext || "No context provided."}"

Multimodal Observations:
- Visual cues: ${session.visualObservations || "None recorded"}
- Acoustic / Voice cues: ${session.audioContext || "None recorded"}
- Multimodal Relationship: ${session.multimodalRelationship || "Consistent across modalities"}

Key Insights:
${(session.keyInsights || []).map(k => `- ${k}`).join("\n") || "- None recorded"}

Positive Signals:
${(session.positiveSignals || []).map(p => `- ${p}`).join("\n") || "- None recorded"}

Concerns / Friction Points:
${(session.concerns || []).map(c => `- ${c}`).join("\n") || "- None recorded"}

Voice Assistant Summary:
"${session.voiceSummary || "No voice summary available."}"

${coaching ? `
Sentiment Coaching & Recommendations:
- Current Tone: ${coaching.current_tone_evaluation || "Standard"}
- Target Goal: ${coaching.target_goal || "Effective communication"}
- Actionable Steps: ${(coaching.actionable_steps || []).join("; ")}
- Suggested Rewrite: "${coaching.suggested_positive_rewrite || "None"}"
` : ""}
=== END OF ANALYSIS DATA ===
`.trim();
}

export const clarityAssistantService = {
  /**
   * Generates a clarification answer in response to a user query
   */
  askClarity: async (params: {
    session: AnalysisSessionTable;
    result?: AnalysisResultTable | null;
    question: string;
    conversationHistory?: ClarityMessageTable[];
    mode?: "simple" | "detailed" | "section" | "general";
    section?: string;
    language?: string;
  }): Promise<{
    answer: string;
    explanationType: "simple" | "detailed" | "section" | "general";
    references: ClarityMessageReference[];
    confidenceNote: string;
    disclaimer: string;
  }> => {
    const {
      session,
      result,
      question,
      conversationHistory = [],
      mode = "general",
      section,
      language = "English"
    } = params;

    const analysisContext = buildCompactAnalysisContext(session, result);

    const systemInstruction = `You are the SentimentAI Clarity Assistant (🧠 SentimentAI Assistant / 💡 AI Clarity Assistant).
Your mission is to help users understand their existing SentimentAI analysis results in simple, crystal-clear, objective, and empathetic terms.

STRICT PRINCIPLES & GUARDRAILS:
1. TRUTHFULNESS & GROUNDING:
   - Rely strictly and solely on the provided "VERIFIED SENTIMENTAI ANALYSIS DATA".
   - Never fabricate scores, emotions, or observations that do not exist in the record.
   - If the user asks about something not present in the analysis (e.g., "What is the person's name?", "Why did they do that in 2019?"), state politely: "I don't have enough information from this analysis session to answer that confidently."

2. AI SAFETY & MEDICAL BOUNDARIES:
   - NEVER diagnose mental health conditions, clinical depression, anxiety disorders, personality traits, or medical ailments.
   - Always use careful, descriptive phrasing such as: "The analysis detected acoustic/lexical signals associated with..." or "The multimodal cues reflect..." rather than definitive statements like "This person is secretly angry."

3. EXPLANATION MODES:
   - "simple": Use plain, everyday language, short sentences, relatable everyday examples, and avoid machine learning jargon.
   - "detailed": Provide deeper analytical granularity, explaining how emotions, facial cues, tone score, and confidence levels interplay.
   - "section": Directly address the requested section (e.g. ${section || "specific aspect"}).

4. LANGUAGE:
   - Respond in "${language}". If the user asked in another language (e.g., Hindi, Spanish, French, Telugu, German, etc.), reply naturally and fluently in that language.

5. OUTPUT FORMAT:
   - Provide a clean structured JSON response with:
     - "answer": the comprehensive clarification text (you may use Markdown formatting like bolding, bullet points, paragraphs for clarity).
     - "explanationType": "${mode}",
     - "references": array of referenced sections, e.g. [{"section": "overallSentiment", "label": "Overall Sentiment (${session.overallSentiment?.label})"}, {"section": "emotions", "label": "Dominant Emotion (${session.emotions?.dominant?.name})"}]
     - "confidenceNote": concise 1-sentence note explaining what the confidence level (${session.overallSentiment?.confidence || "Medium"}) and score (${Math.round((session.overallSentiment?.score ?? 0.5) * 100)}%) mean in this context.
     - "disclaimer": "This clarification is generated by the AI Clarity Assistant to interpret the recorded signals and does not constitute a psychological or clinical evaluation."
`;

    // Construct conversation history for context
    const contents: any[] = [];

    // Initial system context as first message
    contents.push({
      role: "user",
      parts: [{
        text: `Here is the analysis data you need to clarify:\n\n${analysisContext}\n\nPlease stand by to answer user clarification requests.`
      }]
    });

    contents.push({
      role: "model",
      parts: [{
        text: JSON.stringify({
          answer: `I have thoroughly reviewed Analysis #${session.analysisId}. How can I help clarify these results for you?`,
          explanationType: "general",
          references: [{ section: "overview", label: "Analysis Overview" }],
          confidenceNote: `Analysis confidence is ${session.overallSentiment?.confidence || "Medium"}.`,
          disclaimer: "AI Clarity Assistant interpretation."
        })
      }]
    });

    // Add recent conversation history (up to last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user") {
        contents.push({
          role: "user",
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === "assistant") {
        contents.push({
          role: "model",
          parts: [{ text: msg.content }]
        });
      }
    }

    // Append current user question with mode requirement
    let promptText = question;
    if (mode === "simple") {
      promptText += `\n\n[Please explain in simple, beginner-friendly terms with no technical jargon.]`;
    } else if (mode === "detailed") {
      promptText += `\n\n[Please provide a detailed, in-depth analytical explanation.]`;
    }
    if (section) {
      promptText += `\n\n[Focus specifically on section: ${section}]`;
    }

    contents.push({
      role: "user",
      parts: [{ text: promptText }]
    });

    // Attempt GenAI with candidate models
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[clarityAssistantService] Generating explanation with ${modelName}...`);
        const response = await generateWithTimeout({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["answer", "explanationType", "references", "confidenceNote", "disclaimer"],
              properties: {
                answer: { type: Type.STRING },
                explanationType: { type: Type.STRING, enum: ["simple", "detailed", "section", "general"] },
                references: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["section", "label"],
                    properties: {
                      section: { type: Type.STRING },
                      label: { type: Type.STRING }
                    }
                  }
                },
                confidenceNote: { type: Type.STRING },
                disclaimer: { type: Type.STRING }
              }
            }
          }
        }, 35000);

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          console.log(`[clarityAssistantService] Successfully generated explanation with ${modelName}`);
          return {
            answer: parsed.answer,
            explanationType: parsed.explanationType || mode,
            references: parsed.references || [],
            confidenceNote: parsed.confidenceNote || `Analysis confidence is rated as ${session.overallSentiment?.confidence || "Medium"}.`,
            disclaimer: parsed.disclaimer || "This clarification is generated to interpret the recorded signals and does not constitute a clinical diagnosis."
          };
        }
      } catch (err: any) {
        console.warn(`[clarityAssistantService] Model ${modelName} failed:`, err?.message);
      }
    }

    // Resilient Fallback Engine
    console.log("[clarityAssistantService] Using resilient heuristic clarity generator fallback...");
    return generateFallbackClarity(session, result, question, mode, section, language);
  }
};

/**
 * High-quality deterministic explanation generator for offline/fallback resilience.
 */
function generateFallbackClarity(
  session: AnalysisSessionTable,
  result: AnalysisResultTable | null | undefined,
  question: string,
  mode: "simple" | "detailed" | "section" | "general" = "general",
  section?: string,
  language: string = "English"
) {
  const q = question.toLowerCase();
  const sentiment = session.overallSentiment?.label || "Neutral";
  const scorePct = Math.round((session.overallSentiment?.score ?? 0.5) * 100);
  const dominantEmotion = session.emotions?.dominant?.name || "Balanced Sentiment";
  const dominantReason = session.emotions?.dominant?.reason || "Consistent tonal expressions.";
  const confidence = session.overallSentiment?.confidence || "Medium";

  let answer = "";
  const references: ClarityMessageReference[] = [];

  if (q.includes("why") && (q.includes("negative") || q.includes("positive") || q.includes("neutral") || q.includes("score") || q.includes("result"))) {
    references.push({ section: "overallSentiment", label: `Overall Sentiment: ${sentiment} (${scorePct}%)` });
    references.push({ section: "emotions", label: `Dominant Emotion: ${dominantEmotion}` });

    if (mode === "simple") {
      answer = `### 💡 Simple Explanation of Your Sentiment Score

Your analysis resulted in **${sentiment}** (${scorePct}% score).

Here is why:
- **Main Feeling Detected**: **${dominantEmotion}**. ${dominantReason}
- **Tone Balance**: The signals analyzed had more ${sentiment.toLowerCase()} indicators than opposing ones.
- **Summary**: ${session.meaning || "The communicative tone showed consistent alignment."}

In simple terms: The system evaluated the words, audio, and visual details you provided, and found that the overall tone leans **${sentiment.toLowerCase()}**.`;
    } else {
      answer = `### 📊 Analytical Breakdown: ${sentiment} Rating (${scorePct}%)

The SentimentAI engine classified this session with **${confidence} Confidence** due to the following factors:

1. **Dominant Emotion Matrix**: The primary emotional driver detected was **${dominantEmotion}** with ${session.emotions?.dominant?.intensity || "moderate"} intensity. Reason: *"${dominantReason}"*.
2. **Multimodal Congruence**: ${session.multimodalRelationship || "Audio, visual, and textual markers aligned coherently without conflicting polarization."}
3. **Key Findings**:
${(session.keyInsights || []).map(k => `   - ${k}`).join("\n")}
4. **Positive Indicators**: ${(session.positiveSignals || []).join("; ") || "Standard baseline signals."}
5. **Areas of Note**: ${(session.concerns || []).join("; ") || "No critical communicative friction detected."}`;
    }
  } else if (q.includes("emotion") || q.includes("feeling")) {
    references.push({ section: "emotions", label: `Dominant: ${dominantEmotion}` });
    answer = `### 🎭 Emotion Analysis Explained

- **Primary Emotion**: **${dominantEmotion}** (${session.emotions?.dominant?.intensity || "Moderate"} intensity).
  - *Why it was detected*: ${dominantReason}
- **Secondary Emotions**:
${(session.emotions?.secondary || []).map(s => `  - **${s.name}** (${s.intensity}): ${s.reason}`).join("\n") || "  - No secondary emotions registered significantly."}

${mode === "simple"
  ? "This means the system found these emotional tones present in your speech or text."
  : "The emotional vector is computed by mapping lexical polarity, vocal pitch variability, and facial micro-expressions into affective clusters."}`;
  } else if (q.includes("confidence") || q.includes("accuracy") || q.includes("trust")) {
    references.push({ section: "confidence", label: `Confidence: ${confidence}` });
    answer = `### 🎯 Understanding Model Confidence (${confidence})

- **Confidence Level**: **${confidence}**
- **What it means**: Model confidence indicates how clearly and consistently the sentiment markers matched known patterns in our multi-modal dataset.
- **Score (${scorePct}%)**: Represents the position along the positive-to-negative spectrum (0% is extremely negative, 50% is balanced neutral, and 100% is strongly positive).

${confidence === "High"
  ? "The input contained clear, unambiguous signals with strong multimodal agreement."
  : "The input contained nuanced or mixed cues, meaning tone was complex and multi-layered."}`;
  } else if (q.includes("coaching") || q.includes("improve") || q.includes("advice") || q.includes("tip")) {
    references.push({ section: "sentiment_coaching", label: "Sentiment Coaching & Advice" });
    const coaching = result?.coachingData || result?.fullResultJson?.sentiment_coaching;
    if (coaching) {
      answer = `### 🚀 Actionable Recommendations to Improve Sentiment

- **Current Evaluation**: ${coaching.current_tone_evaluation || "Balanced"}
- **Target Goal**: ${coaching.target_goal || "Elevate positive engagement"}
- **Recommended Steps**:
${(coaching.actionable_steps || ["Clarify key objectives early.", "Highlight positive achievements."]).map((s: string) => `  - ${s}`).join("\n")}
- **Suggested Positive Rewrite**:
  > "${coaching.suggested_positive_rewrite || "Thank you for the update. We are making great progress and looking forward to next steps."}"`;
    } else {
      answer = `### 🚀 Recommended Tips

1. **Acknowledge Key Points**: Start communications by confirming shared goals.
2. **Reframe Challenges**: Address issues constructively by offering solutions alongside observations.
3. **Encourage Open Feedback**: Invite questions to maintain high transparency.`;
    }
  } else {
    // General overview explanation
    references.push({ section: "overview", label: `Overview: ${sentiment}` });
    answer = `### 💡 Clarity Summary for Analysis #${session.analysisId}

- **Overall Sentiment**: **${sentiment}** with **${scorePct}%** index.
- **Dominant Emotion**: **${dominantEmotion}** (${dominantReason}).
- **Core Meaning**: ${session.meaning || "Balanced communication observed across all inputs."}
- **Context**: ${session.emotionalContext || "Stable communicative trajectory."}

Feel free to ask specific questions like:
- *"Why is my sentiment score ${scorePct}%?"*
- *"Can you explain this in simpler words?"*
- *"What positive signals were detected?"*
- *"How can I improve my communication tone?"*`;
  }

  return {
    answer,
    explanationType: mode,
    references,
    confidenceNote: `Analysis confidence is rated as ${confidence} with a score of ${scorePct}%.`,
    disclaimer: "This clarification is generated by the AI Clarity Assistant to interpret recorded signals and does not constitute a psychological or clinical evaluation."
  };
}
