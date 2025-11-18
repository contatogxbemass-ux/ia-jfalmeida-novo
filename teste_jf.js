const iaJfAlmeida = require("./ia_jf_almeida.js");

async function testarIA() {
  const mensagemCliente = "Oi, quero ver um apartamento para comprar em Suzano até 300 mil.";
  const resposta = await iaJfAlmeida(mensagemCliente);

  console.log("📩 Cliente:", mensagemCliente);
  console.log("\n🏠 Resposta da IA:");
  console.log(resposta);
}

testarIA();
