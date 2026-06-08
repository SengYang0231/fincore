export interface DictionaryEntry {
  category: "incomeStatement" | "balanceSheet" | "cashFlow" | "ratios" | "growth" | "advanced";
  keywords: string[];
}

export const FINANCIAL_DICTIONARY: Record<string, DictionaryEntry> = {
  // Income Statement
  revenue: {
    category: "incomeStatement",
    keywords: ["revenue", "turnover", "sales", "total revenue", "revenue from contracts"],
  },
  nonOperatingRevenue: {
    category: "incomeStatement",
    keywords: ["non-operating revenue", "other income", "interest income", "finance income"],
  },
  costOfGoodsSold: {
    category: "incomeStatement",
    keywords: ["cost of sales", "cost of goods sold", "cogs", "cost of revenue"],
  },
  grossProfit: {
    category: "incomeStatement",
    keywords: ["gross profit", "gross margin profit", "gp"],
  },
  operatingExpenses: {
    category: "incomeStatement",
    keywords: ["operating expenses", "total operating expenses", "opex"],
  },
  sgaExpenses: {
    category: "incomeStatement",
    keywords: ["selling, general and administrative", "sg&a", "administrative expenses", "selling and distribution"],
  },
  researchDevelopment: {
    category: "incomeStatement",
    keywords: ["research and development", "r&d", "rnd"],
  },
  depreciation: {
    category: "incomeStatement",
    keywords: ["depreciation of", "depreciation", "depreciation expense"],
  },
  amortization: {
    category: "incomeStatement",
    keywords: ["amortisation", "amortization", "amortisation expense"],
  },
  ebit: {
    category: "incomeStatement",
    keywords: ["ebit", "earnings before interest and tax", "operating profit before tax"],
  },
  ebitda: {
    category: "incomeStatement",
    keywords: ["ebitda", "earnings before interest, tax, depreciation", "operating profit before depreciation"],
  },
  operatingProfit: {
    category: "incomeStatement",
    keywords: ["operating profit", "profit from operations", "operating income"],
  },
  profitBeforeTax: {
    category: "incomeStatement",
    keywords: ["profit before tax", "pbt", "profit before taxation", "income before tax"],
  },
  taxExpense: {
    category: "incomeStatement",
    keywords: ["taxation", "tax expense", "income tax", "taxation expense"],
  },
  effectiveTaxRate: {
    category: "incomeStatement",
    keywords: ["effective tax rate", "tax rate"],
  },
  netProfit: {
    category: "incomeStatement",
    keywords: ["net profit", "profit for the year", "profit after tax", "pat", "profit attributable to owners"],
  },
  retainedEarnings: {
    category: "incomeStatement",
    keywords: ["retained profit", "retained earnings", "accumulated losses"],
  },

  // Balance Sheet
  totalAssets: {
    category: "balanceSheet",
    keywords: ["total assets", "assets total"],
  },
  currentAssets: {
    category: "balanceSheet",
    keywords: ["total current assets", "current assets"],
  },
  nonCurrentAssets: {
    category: "balanceSheet",
    keywords: ["total non-current assets", "non-current assets"],
  },
  cashAndEquivalents: {
    category: "balanceSheet",
    keywords: ["cash and cash equivalents", "cash and bank balances", "bank balances and cash"],
  },
  accountsReceivable: {
    category: "balanceSheet",
    keywords: ["trade receivables", "accounts receivable", "trade and other receivables"],
  },
  inventory: {
    category: "balanceSheet",
    keywords: ["inventories", "inventory", "stocks"],
  },
  shortTermInvestments: {
    category: "balanceSheet",
    keywords: ["short-term investments", "financial assets at fair value", "other investments"],
  },
  ppe: {
    category: "balanceSheet",
    keywords: ["property, plant and equipment", "ppe", "fixed assets"],
  },
  intangibleAssets: {
    category: "balanceSheet",
    keywords: ["intangible assets", "other intangibles"],
  },
  goodwill: {
    category: "balanceSheet",
    keywords: ["goodwill", "goodwill on acquisition"],
  },
  totalLiabilities: {
    category: "balanceSheet",
    keywords: ["total liabilities", "liabilities total"],
  },
  currentLiabilities: {
    category: "balanceSheet",
    keywords: ["total current liabilities", "current liabilities"],
  },
  accountsPayable: {
    category: "balanceSheet",
    keywords: ["trade payables", "accounts payable", "trade and other payables"],
  },
  shortTermDebt: {
    category: "balanceSheet",
    keywords: ["short term borrowings", "short-term debt", "bank overdrafts", "current portion of borrowings"],
  },
  nonCurrentLiabilities: {
    category: "balanceSheet",
    keywords: ["total non-current liabilities", "non-current liabilities"],
  },
  longTermDebt: {
    category: "balanceSheet",
    keywords: ["long term borrowings", "long-term borrowings", "term loans", "long-term debt"],
  },
  bondsPayable: {
    category: "balanceSheet",
    keywords: ["bonds payable", "deferred liabilities", "unsecured bonds"],
  },
  totalEquity: {
    category: "balanceSheet",
    keywords: ["total equity", "equity total", "shareholders' funds", "total shareholders' equity"],
  },
  commonStock: {
    category: "balanceSheet",
    keywords: ["share capital", "ordinary shares", "common stock"],
  },
  preferredStock: {
    category: "balanceSheet",
    keywords: ["preference shares", "preferred stock"],
  },
  paidInCapital: {
    category: "balanceSheet",
    keywords: ["paid-in capital", "share premium", "additional paid-in capital"],
  },

  // Cash Flow
  operatingCashFlow: {
    category: "cashFlow",
    keywords: ["net cash from operating activities", "operating activities", "cash generated from operations"],
  },
  investingCashFlow: {
    category: "cashFlow",
    keywords: ["net cash used in investing activities", "investing activities", "net cash from investing activities"],
  },
  financingCashFlow: {
    category: "cashFlow",
    keywords: ["net cash from financing activities", "financing activities", "net cash used in financing activities"],
  },
  freeCashFlow: {
    category: "cashFlow",
    keywords: ["free cash flow", "fcf"],
  },
  capitalExpenditure: {
    category: "cashFlow",
    keywords: ["purchase of property, plant", "capex", "capital expenditure", "additions to property"],
  },

  // Ratios
  roe: {
    category: "ratios",
    keywords: ["return on equity", "roe"],
  },
  roa: {
    category: "ratios",
    keywords: ["return on assets", "roa"],
  },
  roic: {
    category: "ratios",
    keywords: ["return on invested capital", "roic"],
  },
  grossMargin: {
    category: "ratios",
    keywords: ["gross margin", "gross profit margin"],
  },
  operatingMargin: {
    category: "ratios",
    keywords: ["operating margin", "operating profit margin"],
  },
  netProfitMargin: {
    category: "ratios",
    keywords: ["net profit margin", "net margin", "profit margin"],
  },
  currentRatio: {
    category: "ratios",
    keywords: ["current ratio"],
  },
  quickRatio: {
    category: "ratios",
    keywords: ["quick ratio", "acid-test ratio"],
  },
  cashRatio: {
    category: "ratios",
    keywords: ["cash ratio"],
  },
  debtToEquity: {
    category: "ratios",
    keywords: ["debt to equity ratio", "debt-to-equity", "gearing ratio"],
  },
  debtRatio: {
    category: "ratios",
    keywords: ["debt ratio"],
  },
  interestCoverage: {
    category: "ratios",
    keywords: ["interest coverage", "times interest earned"],
  },
  assetTurnover: {
    category: "ratios",
    keywords: ["asset turnover"],
  },
  inventoryTurnover: {
    category: "ratios",
    keywords: ["inventory turnover"],
  },
  receivablesTurnover: {
    category: "ratios",
    keywords: ["receivables turnover", "debtor turnover"],
  },
  payablesTurnover: {
    category: "ratios",
    keywords: ["payables turnover", "creditor turnover"],
  },
  eps: {
    category: "ratios",
    keywords: ["earnings per share", "basic earnings per share", "eps", "basic eps"],
  },
  dilutedEps: {
    category: "ratios",
    keywords: ["diluted earnings per share", "diluted eps"],
  },
  peRatio: {
    category: "ratios",
    keywords: ["p/e ratio", "price earnings ratio", "pe ratio"],
  },
  dividendYield: {
    category: "ratios",
    keywords: ["dividend yield"],
  },
  dividendPerShare: {
    category: "ratios",
    keywords: ["dividend per share", "dps"],
  },
  dividendPayoutRatio: {
    category: "ratios",
    keywords: ["payout ratio", "dividend payout ratio"],
  },
  retentionRatio: {
    category: "ratios",
    keywords: ["retention ratio"],
  },

  // Growth
  revenueGrowth: {
    category: "growth",
    keywords: ["revenue growth", "sales growth"],
  },
  netIncomeGrowth: {
    category: "growth",
    keywords: ["net income growth", "profit growth"],
  },
  cagr: {
    category: "growth",
    keywords: ["cagr", "compound annual growth rate"],
  },

  // Advanced
  enterpriseValue: {
    category: "advanced",
    keywords: ["enterprise value", "ev"],
  },
  evEbitda: {
    category: "advanced",
    keywords: ["ev/ebitda", "ev to ebitda"],
  },
  fcfYield: {
    category: "advanced",
    keywords: ["fcf yield", "free cash flow yield"],
  },
  eva: {
    category: "advanced",
    keywords: ["economic value added", "eva"],
  },
  workingCapital: {
    category: "advanced",
    keywords: ["working capital"],
  },
  netWorkingCapital: {
    category: "advanced",
    keywords: ["net working capital"],
  },
};
