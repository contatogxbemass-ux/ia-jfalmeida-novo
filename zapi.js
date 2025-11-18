// zapi.js
const axios = require("axios");
require("dotenv").config();

const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

async function enviarMensagemWhatsApp(telefone, texto) {
    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
            {
                phone: telefone,
                message: texto
            },
            {
                headers: {
                    "Client-Token": ZAPI_CLIENT_TOKEN,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("📤 Mensagem enviada:", texto);

    } catch (erro) {
        console.log("❌ ERRO AO ENVIAR WHATSAPP:", erro.response?.data || erro.message);
    }
}

module.exports = { enviarMensagemWhatsApp };
