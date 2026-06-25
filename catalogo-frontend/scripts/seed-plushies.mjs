import axios from "axios";

const API = "http://localhost:8000";
let token = null;

async function login() {
  const { data } = await axios.post(`${API}/api/token/`, {
    username: "pc",
    password: "zebragaimer2003",
  });
  token = data.access;
}

function auth() {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function listPlushies() {
  const { data } = await axios.get(`${API}/api/admin/plushies/`, auth());
  return data.results;
}

async function deletePlushie(id) {
  await axios.delete(`${API}/api/admin/plushies/${id}/`, auth());
  console.log(`  Deleted plushie ${id}`);
}

async function createPlushie(payload) {
  const { data } = await axios.post(`${API}/api/admin/plushies/`, payload, {
    headers: { ...auth().headers, "Content-Type": "application/json" },
  });
  console.log(`  Created: ${data.name} (ID: ${data.id})`);
  return data;
}

const plushies = [
  { name: "Peluche de Oso", description: "Tela afelpada premium, color marrón chocolate, 35cm. Lavar a mano con agua fría y jabón suave. Perfecto para abrazar en las noches frías.", price: "42.00", stock: 12 },
  { name: "Peluche de Conejo", description: "Tela polar suave, color blanco nieve, 25cm. Lavar en ciclo delicado y secar al aire libre. Perfecto para regalar a los más pequeños.", price: "28.50", stock: 20 },
  { name: "Peluche de Gato", description: "Tela velvet sedosa, color gris perla, 28cm. Lavar a mano con agua fría, no usar blanqueador. Perfecto para amantes de los felinos.", price: "32.00", stock: 15 },
  { name: "Peluche de Perro", description: "Tela chenille esponjosa, color beige crema, 30cm. Lavable a máquina en ciclo suave. Perfecto como compañero de juegos infantiles.", price: "35.00", stock: 18 },
  { name: "Peluche de Zorro", description: "Tela microfibra hipoalergénica, color naranja quemado, 22cm. Lavar a mano con agua tibia y jabón neutro. Perfecto para decorar habitaciones.", price: "24.99", stock: 22 },
  { name: "Peluche de Búho", description: "Tela satinada brillante, color azul noche, 20cm. Limpiar con paño húmedo, no sumergir. Perfecto para estudiantes y amantes de la noche.", price: "19.99", stock: 25 },
  { name: "Peluche de León", description: "Tela afelpada dorada, color amarillo sol, 35cm. Lavar a mano con agua fría, secar a la sombra. Perfecto para los reyes de la casa.", price: "48.00", stock: 8 },
  { name: "Peluche de Elefante", description: "Tela polar térmica, color azul celeste, 40cm. Lavar en ciclo delicado, no retorcer. Perfecto como almohada de siesta.", price: "55.00", stock: 6 },
  { name: "Peluche de Koala", description: "Tela velvet suave, color gris pizarra, 25cm. Lavar a mano con agua fría y jabón líquido. Perfecto para abrazos eternos.", price: "30.00", stock: 14 },
  { name: "Peluche de Pingüino", description: "Tela microfibra polar, color negro y blanco, 20cm. Lavable a máquina en agua fría. Perfecto para los amantes del frío.", price: "22.50", stock: 28 },
  { name: "Peluche de Unicornio", description: "Tela satinada perlada, color rosa chicle, 30cm. Lavar a mano con agua tibia, no usar secadora. Perfecto para soñadores y soñadoras.", price: "38.00", stock: 12 },
  { name: "Peluche de Delfín", description: "Tela chenille acolchada, color azul océano, 35cm. Lavar en ciclo suave, secar al aire. Perfecto para amantes del mar.", price: "40.00", stock: 10 },
  { name: "Peluche de Ardilla", description: "Tela polar naranja, color canela, 18cm. Lavar a mano con agua fría, no exprimir. Perfecto para llevar a todas partes.", price: "16.50", stock: 30 },
  { name: "Peluche de Oveja", description: "Tela chenille rizada, color blanco marfil, 25cm. Lavar a mano con jabón suave, secar horizontal. Perfecto para contar antes de dormir.", price: "27.00", stock: 16 },
  { name: "Peluche de Mapache", description: "Tela velvet resistente, color gris acero, 22cm. Lavable a máquina en ciclo delicado. Perfecto para niños aventureros.", price: "23.00", stock: 20 },
  { name: "Peluche de Lobo", description: "Tela afelpada premium, color gris lobo, 30cm. Lavar a mano con agua fría, secar a la sombra. Perfecto para espíritus libres.", price: "34.50", stock: 12 },
  { name: "Peluche de Tortuga", description: "Tela polar verde bosque, color verde menta, 20cm. Lavar a mano con agua tibia y jabón neutro. Perfecto para los que van lento pero seguro.", price: "18.99", stock: 24 },
  { name: "Peluche de Cerdito", description: "Tela satinada brillante, color rosa pastel, 18cm. Limpiar con paño húmedo, no sumergir. Perfecto para decorar cuartos infantiles.", price: "15.99", stock: 35 },
  { name: "Peluche de Jirafa", description: "Tela chenille suave, color amarillo mostaza, 35cm. Lavar a mano con agua fría, no retorcer. Perfecto para alcanzar los sueños más altos.", price: "46.00", stock: 7 },
  { name: "Peluche de Dragón", description: "Tela velvet escamosa, color verde esmeralda, 30cm. Lavable a máquina en ciclo suave. Perfecto para valientes y aventureros.", price: "52.00", stock: 9 },
];

async function main() {
  console.log("1. Logging in...");
  await login();
  console.log("   Token obtained");

  console.log("\n2. Checking existing plushies...");
  const existing = await listPlushies();
  console.log(`   Found ${existing.length} plushies`);

  if (existing.length > 0) {
    console.log("\n3. Deleting existing plushies...");
    for (const p of existing) {
      await deletePlushie(p.id);
    }
  }

  console.log("\n4. Creating 20 plushies...");
  for (const p of plushies) {
    await createPlushie(p);
  }

  console.log("\n Done! 20 plushies created successfully.");
}

main().catch((err) => {
  console.error("Error:", err.response?.data || err.message);
  process.exit(1);
});
