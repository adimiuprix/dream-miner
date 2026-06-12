/**
 * TON Transaction Hash Poller
 *
 * Setelah sendTransfer() dipanggil, hash transaksi tidak langsung tersedia —
 * @ton/ton tidak mengembalikannya secara sinkron. Hash baru bisa dibaca setelah
 * transaksi dikonfirmasi di chain (seqno wallet naik).
 *
 * Cara kerja:
 *  1. Poll getSeqno() sampai nilainya naik dari expectedSeqno (= seqno lama + 1)
 *  2. Begitu seqno naik, baca transaksi terakhir dari wallet via getTransactions()
 *  3. Transaksi terbaru (index 0) adalah transaksi yang baru dikirim — ambil hashnya
 *
 * Jika polling timeout, kembalikan null — caller tetap menyimpan swap sebagai
 * COMPLETED (TON sudah terkirim), tapi txHash di DB akan null.
 */

import { TonClient, WalletContractV4 } from "@ton/ton";
import { KeyPair } from "@ton/crypto";

/** Interval antar polling attempt (ms) */
const POLL_INTERVAL_MS = 2_000;

/** Jumlah maksimum polling attempt sebelum menyerah */
const MAX_ATTEMPTS = 15; // 15 × 2s = 30 detik

/**
 * Poll blockchain sampai seqno naik, lalu baca hash transaksi terakhir.
 *
 * @param client    TonClient yang sudah dikonfigurasi
 * @param keyPair   Keypair hot wallet
 * @param sentSeqno Seqno yang digunakan saat sendTransfer() — bukan seqno+1
 * @returns Transaction hash (hex string) atau null jika timeout
 */
export async function pollTxHash(
  client: TonClient,
  keyPair: KeyPair,
  sentSeqno: number
): Promise<string | null> {
  const wallet   = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
  const contract = client.open(wallet);
  const expectedSeqno = sentSeqno + 1;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const currentSeqno = await contract.getSeqno();

      if (currentSeqno >= expectedSeqno) {
        // Seqno sudah naik — transaksi dikonfirmasi chain.
        // Baca transaksi terakhir dari wallet untuk ambil hash-nya.
        const txs = await client.getTransactions(wallet.address, { limit: 1 });

        if (txs && txs.length > 0) {
          const latestTx = txs[0];
          // Hash di @ton/ton disimpan sebagai Buffer — encode ke hex
          const hashHex = Buffer.from(latestTx.hash()).toString("hex");
          console.log(
            `[TonTxPoller] Confirmed after ${attempt} attempt(s). Hash: ${hashHex}`
          );
          return hashHex;
        }

        console.warn("[TonTxPoller] Seqno confirmed but no transactions found.");
        return null;
      }

      console.log(
        `[TonTxPoller] Attempt ${attempt}/${MAX_ATTEMPTS} — seqno still ${currentSeqno}, waiting...`
      );
    } catch (err) {
      // Jangan abort — error sementara dari RPC bisa terjadi, coba lagi
      console.warn(`[TonTxPoller] Attempt ${attempt} error:`, err);
    }
  }

  console.warn(
    `[TonTxPoller] Timeout after ${MAX_ATTEMPTS} attempts — hash not resolved.`
  );
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
