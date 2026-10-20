import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { JSDOM } from "jsdom";
import https from "https";

const app = express();
app.use(cors());

// Agente HTTPS para ignorar el certificado del BCV
const agente = new https.Agent({
  rejectUnauthorized: false
});

async function obtenerFilasBCV() {
  const pagina = await fetch("https://www.bcv.org.ve/", {
    agent: agente
  });

  const html = await pagina.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const filas = doc.querySelectorAll(".table.table-striped tbody tr");
  return filas;
}

app.get("/tasa-bcv", async (req, res) => {
  try {
    const filas = await obtenerFilasBCV();
    let tasaUSD = null;

    filas.forEach((fila) => {
      const celdas = fila.querySelectorAll("td");
      const moneda = celdas[0]?.textContent?.trim();

      if (moneda === "USD") {
        const valor = celdas[1]?.textContent?.trim();
        tasaUSD = parseFloat(valor.replace(",", "."));
      }
    });

    if (!tasaUSD) {
      return res.json({ error: "No se encontró la tasa USD en el BCV" });
    }

    res.json({ tasa: tasaUSD });

  } catch (error) {
    res.json({ error: "Error leyendo el BCV", detalle: error.toString() });
  }
});

app.listen(3001, () => {
  console.log("Servidor BCV corriendo en http://localhost:3001");
});
