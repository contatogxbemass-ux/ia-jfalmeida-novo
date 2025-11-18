// openai.js
const axios = require("axios");
require("dotenv").config();

const OPENAI_KEY = process.env.OPENAI_KEY;

async function gerarRespostaIA(prompt) {
    try {
        const r = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Você é a recepção da imobiliária JF Almeida. Responda sempre de forma objetiva e profissional."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return r.data.choices[0].message.content;

    } catch (e) {
        console.log("❌ ERRO OPENAI:", e.response?.data || e.message);
        return "Desculpe, estamos enfrentando instabilidade no atendimento.";
    }
}

module.exports = { gerarRespostaIA };
