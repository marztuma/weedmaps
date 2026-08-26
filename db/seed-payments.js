import { config } from "dotenv";
config({ path: ".env.local" });

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as raw } from "drizzle-orm";
import * as schema from "./schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Client-supplied wallets. Validated on the way in, because a single wrong
   character sends a customer's money somewhere nobody can retrieve it. */
const METHODS = [
  {
    code: "btc", kind: "crypto", label: "Bitcoin", network: "Bitcoin", asset: "BTC",
    destination: "38gqXGxYdThRBofESL8ooRganamxTXzYN3",
    confirmations: 2, sortOrder: 30,
    instructions: "Send the exact BTC amount to the address below. Bitcoin only — coins sent on any other network are unrecoverable.",
  },
  {
    code: "usdt_trc20", kind: "crypto", label: "USDT — TRC20", network: "Tron (TRC20)", asset: "USDT",
    destination: "TYYJUNNyPEBCapeSnrfAMtEJXGB8EBhcTm",
    confirmations: 19, sortOrder: 31,
    instructions: "Send USDT on the Tron (TRC20) network only. Sending ERC20 tokens to this address will lose them.",
  },
  {
    code: "usdt_erc20", kind: "crypto", label: "ETH / USDT — ERC20", network: "Ethereum (ERC20)", asset: "ETH / USDT",
    destination: "0x9a7109f4fdcaf3b5bca830b8601d0dea3d99d659",
    confirmations: 12, sortOrder: 32,
    instructions: "Send ETH or ERC20 USDT on the Ethereum network only. Do not send TRC20 tokens to this address.",
  },
  {
    code: "cashapp", kind: "app", label: "Cash App", network: null, asset: null,
    destination: null, confirmations: null, sortOrder: 10,
    instructions: "Place the order, then our team emails you the Cash App tag and the exact amount. Payment is arranged directly with a person — never send to a tag you were not sent by us.",
  },
  {
    code: "zelle", kind: "app", label: "Zelle", network: null, asset: null,
    destination: null, confirmations: null, sortOrder: 11,
    instructions: "Place the order, then our team emails you the Zelle details and the exact amount. Payment is arranged directly with a person — never send to details you were not sent by us.",
  },
];

/* Format checks. These are structural, not proof of ownership — they catch a
   mistyped or truncated address, which is the realistic failure. */
function validate(m) {
  const d = m.destination;
  if (m.kind !== "crypto") return null;
  if (!d) return `${m.code}: crypto method has no address`;

  if (m.code === "btc") {
    const legacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(d);
    const bech32 = /^bc1[02-9ac-hj-np-z]{11,71}$/.test(d);
    if (!legacy && !bech32) return `${m.code}: not a valid Bitcoin address (${d})`;
  }
  if (m.code === "usdt_trc20" && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(d)) {
    return `${m.code}: not a valid Tron address — must start with T and be 34 characters (${d}, ${d.length} chars)`;
  }
  if (m.code === "usdt_erc20" && !/^0x[0-9a-fA-F]{40}$/.test(d)) {
    return `${m.code}: not a valid Ethereum address — must be 0x + 40 hex characters (${d}, ${d.length} chars)`;
  }
  return null;
}

async function main() {
  const problems = METHODS.map(validate).filter(Boolean);
  if (problems.length) {
    console.error("REFUSING TO SEED — address validation failed:");
    problems.forEach((p) => console.error("  " + p));
    process.exit(1);
  }

  await db.execute(raw`TRUNCATE TABLE payment_methods RESTART IDENTITY CASCADE`);
  await db.insert(schema.paymentMethods).values(
    METHODS.map((m) => ({ ...m, active: true, updatedAt: new Date() }))
  );

  console.log("payment methods seeded and format-checked:\n");
  for (const m of METHODS) {
    console.log(`  ${m.label}`);
    console.log(`    code        ${m.code}`);
    if (m.network) console.log(`    network     ${m.network}`);
    if (m.destination) {
      console.log(`    address     ${m.destination}`);
      console.log(`    length      ${m.destination.length} characters`);
    } else {
      console.log(`    address     — arranged by email after the order is placed`);
    }
    console.log("");
  }
  console.log("Verify every address above against your own records before taking real money.");
}

main().catch((e) => { console.error(e); process.exit(1); });
