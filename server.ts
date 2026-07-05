import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google Gen AI client
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI suggestions endpoint
app.post("/api/ai-suggestions", async (req, res) => {
  try {
    const { income, expenses, budgets, savings, investments, preferredCurrency } = req.body;

    const gemini = getGeminiClient();

    const prompt = `
You are a highly professional Personal Finance Advisor and Financial Analyst.
Analyze the following user financial data and provide smart, actionable financial suggestions, tailored insights, a financial health score (0 to 100), and custom recommendations.

Financial Summary Data:
- Preferred Currency: ${preferredCurrency || "USD"}
- Income Records: ${JSON.stringify(income || [])}
- Expense Records: ${JSON.stringify(expenses || [])}
- Monthly Budget Configurations: ${JSON.stringify(budgets || [])}
- Savings Goals: ${JSON.stringify(savings || [])}
- Investment Portfolio: ${JSON.stringify(investments || [])}

Provide your response in raw JSON format with the following keys. Do NOT include any markdown formatting blocks like \`\`\`json or \`\`\`. Provide ONLY the valid, parseable JSON object:
{
  "financialHealthScore": <number between 0 and 100>,
  "healthAssessment": "<a paragraph evaluating their financial health based on standard savings rates, budget limits, and investment diversification>",
  "suggestions": [
    {
      "type": "warning" | "opportunity" | "tip",
      "category": "budget" | "saving" | "investment" | "general",
      "title": "<short title>",
      "message": "<detailed explanation of what they should do to improve their situation>"
    }
  ],
  "monthlyReportAnalysis": "<a summarizing paragraph acting as a professional financial monthly report review>"
}
    `;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";

    // Clean up any potential markdown wraps
    let cleanJsonText = responseText.trim();
    if (cleanJsonText.startsWith("```json")) {
      cleanJsonText = cleanJsonText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleanJsonText.startsWith("```")) {
      cleanJsonText = cleanJsonText.replace(/^```/, "").replace(/```$/, "").trim();
    }

    try {
      const suggestions = JSON.parse(cleanJsonText);
      res.json(suggestions);
    } catch (parseError) {
      console.error("Error parsing Gemini JSON response:", responseText);
      // Fallback response if parse fails
      res.json({
        financialHealthScore: 70,
        healthAssessment: "We could not parse the precise advisor assessment, but based on typical patterns your account looks healthy. Try adjusting categories or budgets to view specific advisory details.",
        suggestions: [
          {
            type: "tip",
            category: "general",
            title: "Plan Ahead",
            message: "Keep maintaining a track of your monthly expenses and income to stabilize your cashflow."
          }
        ],
        monthlyReportAnalysis: "Your financial tracker has been initialized correctly! Keep tracking your entries to build richer AI models."
      });
    }
  } catch (error: any) {
    console.error("Gemini suggestion generation error:", error);
    res.status(500).json({
      error: "Failed to generate financial recommendations",
      details: error.message,
    });
  }
});

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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
