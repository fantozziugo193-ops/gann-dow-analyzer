export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Ticker mancante" });

  const AV_KEY = "RGHF7HXKG58GCB48";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${AV_KEY}`;

  try {
    const response = await fetch(url);
    const json = await response.json();

    if (json["Note"]) return res.status(429).json({ error: "Limite API raggiunto (25/giorno). Riprova domani." });
    if (json["Error Message"]) return res.status(404).json({ error: `Ticker "${ticker}" non trovato.` });

    const series = json["Time Series (Daily)"];
    if (!series) return res.status(500).json({ error: "Nessun dato disponibile." });

    const data = Object.entries(series)
      .slice(0, 60)
      .reverse()
      .map(([date, v]) => ({
        date,
        open:   +parseFloat(v["1. open"]).toFixed(2),
        high:   +parseFloat(v["2. high"]).toFixed(2),
        low:    +parseFloat(v["3. low"]).toFixed(2),
        close:  +parseFloat(v["4. close"]).toFixed(2),
        volume: +v["5. volume"] || 0,
      }));

    res.status(200).json({ data });
  } catch (e) {
    res.status(500).json({ error: "Errore di rete: " + e.message });
  }
}
