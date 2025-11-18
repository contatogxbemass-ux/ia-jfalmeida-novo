// ===============================
// 📌 FLOW.JS — VERSÃO OFICIAL
// ===============================

const axios = require("axios");
require("dotenv").config();

const OPENAI_KEY = process.env.OPENAI_KEY;


// ======================================================
// 🔥 Função para resposta da IA
// ======================================================

async function gerarRespostaIA(msg) {
    try {
        const r = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Você é assistente virtual da JF Almeida Imóveis. Responda de forma objetiva, profissional e educada."
                    },
                    {
                        role: "user",
                        content: msg
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

    } catch (err) {
        console.log("❌ ERRO IA:", err.response?.data || err.message);
        return "Estamos com instabilidade no atendimento. Tente novamente em instantes.";
    }
}



// ======================================================
// 🔥 MENU PRINCIPAL
// ======================================================

function menuPrincipal() {
    return (
        "👋 *Bem-vindo(a) à JF Almeida Imóveis!*\n\n" +
        "Para te ajudar melhor, escolha uma opção:\n\n" +
        "1️⃣ Quero comprar um imóvel\n" +
        "2️⃣ Quero vender meu imóvel\n" +
        "3️⃣ Quero saber sobre financiamentos\n" +
        "4️⃣ Ver imóveis disponíveis\n" +
        "0️⃣ Falar com um corretor"
    );
}



// ======================================================
// 🔥 TRATAMENTO DE MENSAGENS
// ======================================================

async function tratarMensagem(msg, telefone, estados) {

    const estado = estados[telefone];

    // ============================
    // 🌐 Comando MENU global
    // ============================
    if (msg.toLowerCase() === "menu") {
        estados[telefone] = { etapa: "menu" };
        return menuPrincipal();
    }


    // ============================
    // 🌐 Estado: aguardando corretor
    // ============================
    if (estado.etapa === "corretor_finalizado") {
        return null; // bot fica mudo
    }

    // ============================
    // 🌐 Estado: coletando dados corretor
    // ============================

    if (estado.etapa === "corretor_nome") {
        estado.nome = msg;
        estado.etapa = "corretor_horario";
        return "Perfeito! Qual o melhor horário para o corretor entrar em contato com você?";
    }

    if (estado.etapa === "corretor_horario") {
        estado.horario = msg;
        estado.etapa = "corretor_assunto";
        return "Certo! Para finalizar, qual o assunto que deseja tratar com o corretor?";
    }

    if (estado.etapa === "corretor_assunto") {
        estado.assunto = msg;
        estado.etapa = "corretor_finalizado";

        return (
            "📞 *Pedido enviado para um corretor!*\n\n" +
            `👤 Nome: ${estado.nome}\n` +
            `⏰ Horário: ${estado.horario}\n` +
            `📝 Assunto: ${estado.assunto}\n\n` +
            "Um corretor entrará em contato em breve. Obrigado! 🙏"
        );
    }



    // ============================
    // 🌐 Estado MENU → opções
    // ============================

    if (estado.etapa === "menu") {
        switch (msg) {
            case "1":
                estado.etapa = "fluxo_compra";
                return (
                    "Ótimo! Vamos começar sua busca pelo imóvel ideal.\n\n" +
                    "🏡 1. Qual tipo de imóvel você deseja? (apartamento, casa, terreno…)\n" +
                    "📍 2. Região de interesse?\n" +
                    "💰 3. Qual seu orçamento?\n" +
                    "⏳ 4. Tem urgência na compra?\n\n" +
                    "👉 A qualquer momento, digite *menu* para voltar."
                );

            case "2":
                estado.etapa = "fluxo_venda";
                return "Perfeito, me informe detalhes do imóvel que deseja vender.";

            case "3":
                estado.etapa = "fluxo_financiamento";
                return "Claro! O que deseja saber sobre financiamento?";

            case "4":
                estado.etapa = "fluxo_listagem";
                return "Perfeito, vou te mostrar alguns imóveis disponíveis. Que tipo você procura?";

            case "0":
                estado.etapa = "corretor_nome";
                return (
                    "📞 *Falar com um corretor*\n\n" +
                    "Para começarmos, qual o seu nome?"
                );

            default:
                return "Não entendi. Escolha uma das opções do menu:\n\n" + menuPrincipal();
        }
    }

    // ================================
    // 🌐 Fluxos atendidos pela IA
    // ================================

    if (
        ["fluxo_compra", "fluxo_venda", "fluxo_financiamento", "fluxo_listagem"]
            .includes(estado.etapa)
    ) {
        return await gerarRespostaIA(msg);
    }

    return "Não consegui te entender. Digite *menu* para voltar ao início.";
}



module.exports = {
    tratarMensagem
};
