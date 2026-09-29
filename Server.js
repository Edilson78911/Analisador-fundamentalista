const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

async function brapi(endpoint) {
  const headers = {};

  if (BRAPI_TOKEN) {
    headers.Authorization = `Bearer ${BRAPI_TOKEN}`;
  }

  const response = await fetch(`https://brapi.dev${endpoint}`, {
    headers
  });

  if (!response.ok) {
    const texto = await response.text();
    throw new Error(`Brapi ${response.status}: ${texto}`);
  }

  return response.json();
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/analise/:ticker", async (req, res) => {
  try {
    const ticker = req.params.ticker
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (!ticker) {
      return res.status(400).json({
        error: "Ticker inválido"
      });
    }

    const [quote, statistics, financial, balance, income, dividends] =
      await Promise.all([
        brapi(`/api/v2/stocks/quote?symbols=${ticker}`),
        brapi(`/api/v2/stocks/statistics?symbols=${ticker}`),
        brapi(`/api/v2/stocks/financial-data?symbols=${ticker}`),
        brapi(`/api/v2/stocks/balance-sheet?symbols=${ticker}&period=annual`),
        brapi(`/api/v2/stocks/income-statement?symbols=${ticker}&period=annual`),
        brapi(`/api/v2/stocks/dividends?symbols=${ticker}`)
      ]);

    res.json({
      ticker,
      quote,
      statistics,
      financial,
      balance,
      income,
      dividends,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Não foi possível buscar os dados da Brapi.",
      details: error.message
    });
  }
});

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    brapiTokenConfigurado: Boolean(BRAPI_TOKEN)
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
