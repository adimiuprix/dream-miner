"use client";

import { useEffect, useRef } from "react";
import { useTonWallet, useTonAddress } from "@tonconnect/ui-react";
import { useAuth } from "@/components/AuthProvider";
import { useTelegram } from "@/components/TelegramProvider";
import { Address } from "@ton/core";

/**
 * useWalletSync
 *
 * Listen perubahan wallet TonConnect dan sinkronkan ke DB via PATCH /api/user/wallet.
 * Dipanggil sekali di level atas (AppWrapper).
 *
 * - Wallet connect  → normalize address → simpan ke DB → update context
 * - Wallet disconnect → kirim null → update context
 *
 * Address selalu dinormalize ke format user-friendly non-bounceable (EQ...)
 * agar konsisten antara DB, swap, dan tampilan UI.
 *
 * BUG-007: initData dikirim ke server agar server bisa verifikasi bahwa
 *          caller adalah pemilik akun yang sah.
 */

/**
 * Normalize semua format TON address ke user-friendly non-bounceable (EQ...).
 * Menangani: raw (0:abc...), bounceable (kQ..), non-bounceable (EQ..), dsb.
 */
function normalizeAddress(address: string): string | null {
  try {
    return Address.parse(address).toString({ bounceable: false, urlSafe: true });
  } catch {
    return null;
  }
}

export function useWalletSync() {
  const wallet     = useTonWallet();
  const rawAddress = useTonAddress(false); // non-bounceable dari TonConnect
  const { user, updateWalletAddress } = useAuth();
  const { initData } = useTelegram();

  // Simpan address sebelumnya agar tidak kirim request duplikat
  const prevAddressRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!user?.id) return;

    // Normalize ke format standar (EQ...), atau null jika wallet disconnect
    const currentAddress = wallet && rawAddress
      ? (normalizeAddress(rawAddress) ?? null)
      : null;

    // Skip jika tidak ada perubahan
    if (prevAddressRef.current === currentAddress) return;

    // Skip inisialisasi pertama jika nilai sudah sama dengan DB
    if (prevAddressRef.current === undefined) {
      const savedNormalized = user.walletAddress
        ? (normalizeAddress(user.walletAddress) ?? user.walletAddress)
        : null;
      if (currentAddress === savedNormalized) {
        prevAddressRef.current = currentAddress;
        return;
      }
    }

    prevAddressRef.current = currentAddress;

    const sync = async () => {
      try {
        const res = await fetch("/api/user/wallet", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // BUG-007: sertakan initData agar server dapat verifikasi identitas
          body: JSON.stringify({ userId: user.id, walletAddress: currentAddress, initData }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("[WalletSync] Server error:", err);
          return;
        }

        updateWalletAddress(currentAddress);

        console.log(
          `[WalletSync] Wallet ${currentAddress ? `saved: ${currentAddress}` : "disconnected"}`
        );
      } catch (err) {
        console.error("[WalletSync] Fetch error:", err);
      }
    };

    sync();
  }, [wallet, rawAddress, user?.id, user?.walletAddress, initData]);
}
