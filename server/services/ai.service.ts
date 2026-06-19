import { IAiService } from "../controllers/report.controller";

export class AiService implements IAiService {
  private getModel(): string {
    return process.env.ZHIPU_MODEL || "glm-4";
  }

  private getBaseUrl(): string {
    return (process.env.ZHIPU_BASE_URL || "").replace(/\/$/, "");
  }

  /**
   * Packages database properties into contextually bounded market insight overviews
   */
  public async generateInsights(reports: any[], sector: string, year: string): Promise<string> {
    const apiKey = process.env.ZHIPU_AI_API_KEY;
    if (!apiKey) {
      throw new Error("ZHIPU_AI_API_KEY environment configuration missing.");
    }

    const prompt = `You are a financial analyst specializing in Bursa Malaysia.
Analyze the following financial data for companies in the ${sector} sector for FY${year}.
Provide a concise, structured comparison covering:
1. Revenue & Profitability
2. Balance Sheet Strength
3. Cash Flow Health
4. Ranking: which company appears strongest overall and why.

Keep it under 300 words. Be direct and professional.

DATA:
${JSON.stringify(
  reports.map((r: any) => ({
    company: r.Metadata?.CompanyName,
    financials: r.Financials,
  })),
  null,
  2
)}`;

    const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.getModel(),
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 600,
      }),
    });

    const data: any = await response.json();

    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    } else {
      throw new Error(data.error?.message || "Invalid payload format received from AI.");
    }
  }
}