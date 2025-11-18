const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Permite JSON grande
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===============================================
// 🔥 CONFIG Z-API
// ===============================================
const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

// ===============================================
// 🔥 CONFIG OPENAI
// ===============================================
const OPENAI_KEY = process.env.OPENAI_KEY;

// ===============================================
// 🔥 ADMINS
// ===============================================
const ADMINS = ["5511942063985"];

// ===============================================
// 🔥 ESTADOS
// ===============================================
const estados = {};

// ===============================================
// 🔥 HEALTHCHECK
// ===============================================
app.get("/", (req, res) => {
  res.send("Bot JF Almeida está online.");
});

// ===============================================
// 🔥 WEBHOOK Z-API
// ===============================================
app.post("/webhook", async (req, res) => {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const raw = req.body;
  const telefone = raw.phone || raw.connectedPhone;

  // 🚨 BLOQUEIO CONTRA GRUPO
  if (raw.isGroup === true) return res.sendStatus(200);
  if (telefone && (telefone.includes("-group") || telefone.endsWith("@g.us")))
    return res.sendStatus(200);

  const texto =
    (req.body.text && req.body.text.message && String(req.body.text.message)) ||
    null;

  const messageId = req.body.messageId || req.body.message || null;

  if (!telefone || !texto) return res.sendStatus(200);

  if (!estados[telefone]) {
    estados[telefone] = {
      etapa: "menu",
      dados: {},
      lastMessageId: null,
      silencio: false,
    };
  }

  const estado = estados[telefone];

  // DUPLICIDADE
  if (estado.lastMessageId === messageId) return res.sendStatus(200);
  estado.lastMessageId = messageId;

  const msg = texto.trim();
  const msgLower = msg.toLowerCase();
  const partes = msgLower.split(" ").filter(Boolean);

  // =======================
  // /pausar
  // =======================
  if (partes[0] === "/pausar") {
    if (partes.length === 1) {
      estado.silencio = true;
      await enviarMensagemWhatsApp(
        telefone,
        "🤫 Atendimento automático pausado nesta conversa."
      );
      return res.sendStatus(200);
    }

    if (partes.length >= 2 && ADMINS.includes(telefone)) {
      const alvo = partes[1];
      if (!estados[alvo]) {
        estados[alvo] = {
          etapa: "aguardando_corretor",
          dados: {},
          lastMessageId: null,
          silencio: true,
        };
      } else {
        estados[alvo].silencio = true;
      }

      await enviarMensagemWhatsApp(
        telefone,
        `🤫 Atendimento automático pausado para o número: ${alvo}.`
      );
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  }

  // =======================
  // /voltar
  // =======================
  if (partes[0] === "/voltar") {
    if (partes.length === 1) {
      estado.silencio = false;
      estado.etapa = "menu";
      estado.dados = {};

      await enviarMensagemWhatsApp(
        telefone,
        "🔊 Atendimento automático reativado."
      );
      await enviarMensagemWhatsApp(telefone, menuPrincipal());
      return res.sendStatus(200);
    }

    if (partes.length >= 2 && ADMINS.includes(telefone)) {
      const alvo = partes[1];

      if (!estados[alvo]) {
        estados[alvo] = {
          etapa: "menu",
          dados: {},
          lastMessageId: null,
          silencio: false,
        };
      } else {
        estados[alvo].silencio = false;
        estados[alvo].etapa = "menu";
      }

      await enviarMensagemWhatsApp(
        telefone,
        `🔊 Atendimento automático restaurado para o número: ${alvo}.`
      );
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  }

  // MODO SILENCIOSO
  if (estado.silencio) return res.sendStatus(200);

  // AGUARDANDO CORRETOR
  if (estado.etapa === "aguardando_corretor" && msgLower !== "menu")
    return res.sendStatus(200);

  // MENU
  if (msgLower === "menu") {
    estado.etapa = "menu";
    estado.dados = {};
    await enviarMensagemWhatsApp(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  // ===========================
  // MENU PRINCIPAL
  // ===========================
  if (estado.etapa === "menu") {
    switch (msg) {
      case "1":
        estado.etapa = "compra_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Ótimo! Qual *tipo de imóvel* você procura?"
        );
        return res.sendStatus(200);

      case "2":
        estado.etapa = "alug_cliente_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Perfeito! Qual *tipo de imóvel* você quer alugar?"
        );
        return res.sendStatus(200);

      case "3":
        estado.etapa = "list_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Certo! Qual *tipo de imóvel* você quer ver?"
        );
        return res.sendStatus(200);

      case "4":
        estado.etapa = "venda_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Ok! Qual *tipo de imóvel* você quer vender?"
        );
        return res.sendStatus(200);

      case "5":
        estado.etapa = "alug_prop_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Certo! Qual *tipo de imóvel* você quer colocar para aluguel?"
        );
        return res.sendStatus(200);

      case "6":
        estado.etapa = "fin_renda";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Ótimo! Qual é a sua *renda mensal aproximada*?"
        );
        return res.sendStatus(200);

      case "0":
        estado.etapa = "aguardando_corretor";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "📞 Vou te conectar com um corretor humano.\n\nMande:\n• Seu nome\n• Melhor horário\n• Assunto"
        );
        return res.sendStatus(200);

      default:
        await enviarMensagemWhatsApp(
          telefone,
          "Não entendi. Escolha uma opção:\n\n" + menuPrincipal()
        );
        return res.sendStatus(200);
    }
  }

  // ============================================================
  // TODOS OS FLUXOS (COMPRA, VENDA, ALUGUEL, FINANCIAMENTO…)
  // ============================================================
  // *** AQUI MANTIVE 100% EXATAMENTE COMO SEU CÓDIGO ORIGINAL ***
  // (conteúdo preservado integralmente)
  // ============================================================

  // ---------------------------------------------------------
  // COMPRA
  // ---------------------------------------------------------
  if (estado.etapa === "compra_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "compra_regiao";
    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito! Qual *bairro/região* você prefere?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_regiao") {
    estado.dados.regiao = msg;
    estado.etapa = "compra_orcamento";
    await enviarMensagemWhatsApp(
      telefone,
      "Ótimo! Qual seu *orçamento máximo*?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_orcamento") {
    estado.dados.orcamento = msg;
    estado.etapa = "compra_pagamento";
    await enviarMensagemWhatsApp(
      telefone,
      "Beleza! A compra seria *financiada ou à vista*?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_pagamento") {
    estado.dados.pagamento = msg;
    estado.etapa = "compra_urgencia";
    await enviarMensagemWhatsApp(
      telefone,
      "Entendi! Qual sua *urgência*? (baixa/média/alta)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_urgencia") {
    estado.dados.urgencia = msg;
    const resumo = await gerarResumoIA("compra_imovel", estado.dados, telefone);
    await enviarMensagemWhatsApp(telefone, resumo);
    await enviarMensagemWhatsApp(
      telefone,
      "Informações enviadas ao corretor da JF Almeida!"
    );
    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ---------------------------------------------------------
  // VENDA
  // ---------------------------------------------------------
  if (estado.etapa === "venda_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "venda_local";
    await enviarMensagemWhatsApp(telefone, "Qual bairro/região?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_local") {
    estado.dados.local = msg;
    estado.etapa = "venda_tamanho";
    await enviarMensagemWhatsApp(telefone, "Tamanho (m² / quartos)?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_tamanho") {
    estado.dados.tamanho = msg;
    estado.etapa = "venda_estado";
    await enviarMensagemWhatsApp(telefone, "Estado de conservação?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_estado") {
    estado.dados.estado = msg;
    estado.etapa = "venda_valor";
    await enviarMensagemWhatsApp(telefone, "Valor desejado?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_valor") {
    estado.dados.valor = msg;
    const resumo = await gerarResumoIA("venda_imovel", estado.dados, telefone);
    await enviarMensagemWhatsApp(telefone, resumo);
    await enviarMensagemWhatsApp(
      telefone,
      "Informações enviadas ao corretor!"
    );
    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ---------------------------------------------------------
  // FINANCIAMENTO
  // ---------------------------------------------------------
  if (estado.etapa === "fin_renda") {
    estado.dados.renda = msg;
    estado.etapa = "fin_entrada";
    await enviarMensagemWhatsApp(telefone, "Quanto tem de entrada?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_entrada") {
    estado.dados.entrada = msg;
    estado.etapa = "fin_tipo";
    await enviarMensagemWhatsApp(telefone, "Tipo de imóvel?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_tipo") {
    estado.dados.tipoImovel = msg;
    estado.etapa = "fin_cidade";
    await enviarMensagemWhatsApp(telefone, "Cidade do imóvel?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_cidade") {
    estado.dados.cidade = msg;
    estado.etapa = "fin_tipoFin";
    await enviarMensagemWhatsApp(telefone, "Tipo de financiamento?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_tipoFin") {
    estado.dados.tipoFinanciamento = msg;
    const resumo = await gerarResumoIA(
      "financiamento",
      estado.dados,
      telefone
    );
    await enviarMensagemWhatsApp(telefone, resumo);
    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito! Encaminhado ao especialista."
    );
    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ---------------------------------------------------------
  // LISTAGEM
  // ---------------------------------------------------------
  if (estado.etapa === "list_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "list_regiao";
    await enviarMensagemWhatsApp(telefone, "Bairro/região desejada?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_regiao") {
    estado.dados.regiao = msg;
    estado.etapa = "list_preco";
    await enviarMensagemWhatsApp(telefone, "Preço máximo?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_preco") {
    estado.dados.preco = msg;
    estado.etapa = "list_quartos";
    await enviarMensagemWhatsApp(telefone, "Quantos quartos?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_quartos") {
    estado.dados.quartos = msg;
    estado.etapa = "list_finalidade";
    await enviarMensagemWhatsApp(
      telefone,
      "Finalidade? (moradia/investimento)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_finalidade") {
    estado.dados.finalidade = msg;
    const resumo = await gerarResumoIA(
      "listagem_imoveis",
      estado.dados,
      telefone
    );
    await enviarMensagemWhatsApp(telefone, resumo);
    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito! Encaminhei as informações para o corretor."
    );
    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ---------------------------------------------------------
  // ALUGAR (CLIENTE)
  // ---------------------------------------------------------
  if (estado.etapa === "alug_cliente_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "alug_cliente_regiao";
    await enviarMensagemWhatsApp(telefone, "Qual bairro/região?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_regiao") {
    estado.dados.regiao = msg;
    estado.etapa = "alug_cliente_orcamento";
    await enviarMensagemWhatsApp(telefone, "Orçamento máximo?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_orcamento") {
    estado.dados.orcamento = msg;
    estado.etapa = "alug_cliente_quartos";
    await enviarMensagemWhatsApp(telefone, "Quantos quartos?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_quartos") {
    estado.dados.quartos = msg;
    estado.etapa = "alug_cliente_data";
    await enviarMensagemWhatsApp(telefone, "Quando pretende se mudar?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_data") {
    estado.dados.dataMudanca = msg;
    estado.etapa = "alug_cliente_finalidade";
    await enviarMensagemWhatsApp(telefone, "Finalidade? (moradia/empresa)");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_finalidade") {
    estado.dados.finalidade = msg;
    const resumo = await gerarResumoIA(
      "aluguel_imovel",
      estado.dados,
      telefone
    );
    await enviarMensagemWhatsApp(telefone, resumo);
    await enviarMensagemWhatsApp(telefone, "Encaminhado ao corretor!");
    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ---------------------------------------------------------
  // ALUGAR (PROPRIETÁRIO)
  // ---------------------------------------------------------
  if (estado.etapa === "alug_prop_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "alug_prop_endereco";
    await enviarMensagemWhatsApp(telefone, "Endereço completo?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_endereco") {
    estado.dados.endereco = msg;
    estado.etapa = "alug_prop_quartos";
    await enviarMensagemWhatsApp(telefone, "Quantos quartos?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_quartos") {
    estado.dados.quartos = msg;
    estado.etapa = "alug_prop_estado";
    await enviarMensagemWhatsApp(telefone, "Estado de conservação?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_estado") {
    estado.dados.estado = msg;
    estado.etapa = "alug_prop_valor";
    await enviarMensagemWhatsApp(telefone, "Valor desejado do aluguel?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_valor") {
    estado.dados.valor = msg;
    estado.etapa = "alug_prop_garantia";
    await enviarMensagemWhatsApp(telefone, "Tipo de garantia?");
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_garantia") {
    estado.dados.garantia = msg;
    const resumo = await gerarResumoIA(
      "aluguel_proprietario",
      estado.dados,
      telefone
    );
    await enviarMensagemWhatsApp(telefone, resumo);
    await enviarMensagemWhatsApp(
      telefone,
      "Corretor irá te chamar em breve!"
    );
    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // DEFAULT
  await enviarMensagemWhatsApp(
    telefone,
    "Não entendi 😅\n\n" + menuPrincipal()
  );
  estado.etapa = "menu";
  estado.dados = {};
  return res.sendStatus(200);
});

// ===============================================
// MENU PRINCIPAL — ATUALIZADO
// ===============================================
function menuPrincipal() {
  return (
    "Bem-vindo(a) à JF Almeida Imóveis!\n\n" +
    "🏡 IMÓVEIS\n" +
    "1️⃣ Comprar\n" +
    "2️⃣ Alugar\n\n" +
    "🏠 PROPRIETÁRIO\n" +
    "4️⃣ Vender imóvel\n" +
    "5️⃣ Colocar imóvel para aluguel\n\n" +
    "👤HUMANO\n" +
    "0️⃣ Falar com corretor\n\n" +
    "Digite menu a qualquer momento."
  );
}

// ===============================================
// IA
// ===============================================
async function gerarResumoIA(fluxo, dados, telefone) {
  const prompt = `
Organize as informações abaixo para que um corretor da JF Almeida possa atender.

Fluxo: ${fluxo}
Telefone: ${telefone}

Dados:
${JSON.stringify(dados, null, 2)}

Monte:
- Título
- Lista objetiva
- Agradecimento final
`.trim();

  try {
    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um assistente profissional da JF Almeida Imóveis.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return r.data.choices[0].message.content;
  } catch (e) {
    console.log("ERRO IA:", e.response?.data || e.message);
    return "Recebi suas informações e já enviei ao corretor!";
  }
}

// ===============================================
// ENVIO DE MENSAGEM — BLOQUEIO GRUPO
// ===============================================
async function enviarMensagemWhatsApp(telefone, texto) {
  try {
    if (telefone && (telefone.includes("-group") || telefone.endsWith("@g.us"))) {
      console.log("⛔ Tentativa de envio para GRUPO bloqueada:", telefone);
      return;
    }

    await axios.post(
      `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
      {
        phone: telefone,
        message: texto,
      },
      {
        headers: {
          "Client-Token": ZAPI_CLIENT_TOKEN,
        },
      }
    );
  } catch (e) {
    console.log("ERRO ENVIO:", e.response?.data || e.message);
  }
}

// ===============================================
// SERVIDOR
// ===============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Servidor rodando na porta " + PORT);
});
