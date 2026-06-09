"use client";

import { useEffect, useRef } from "react";
import { useTonWallet, useTonAddress } from "@tonconnect/ui-react";
import { useAuth } from "@/components/AuthProvider";

/**
 * useWalletSync
 *
 * Listen perubahan wallet TonConnect dan sinkronkan ke DB via PATCH /api/user/wallet.
 * Dipanggil sekali di level atas (AuthProvider atau AppWrapper).
 *
 * - Wallet connect  → kirim address ke server → update user di context
 * - Wallet disconnect → kirim null ke server → update user di context
 */
export function useWalletSync() {
  const wallet      = useTonWallet();
  const rawAddress  = useTonAddress(false); // non-bounceable address
  const { user, updateWalletAddress } = useAuth();

  // Simpan address sebelumnya agar tidak kirim request duplikat
  const prevAddressRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Belum ada user di context, skip
    if (!user?.id) return;

    // Tentukan address saat ini
    const currentAddress = wallet ? (rawAddress || null) : null;

    // Tidak ada perubahan, skip
    if (prevAddressRef.current === currentAddress) return;

    // Juga skip saat inisialisasi pertama jika nilai sudah sama dengan DB
    if (prevAddressRef.current === undefined && currentAddress === user.walletAddress) {
      prevAddressRef.current = currentAddress;
      return;
    }

    prevAddressRef.current = currentAddress;

    // Kirim ke server
    const sync = async () => {
      try {
        const res = await fetch("/api/user/wallet", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, walletAddress: currentAddress }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("[WalletSync] Server error:", err);
          return;
        }

        // Update context lokal agar komponen lain langsung dapat nilai terbaru
        updateWalletAddress(currentAddress);

        console.log(
          `[WalletSync] Wallet ${currentAddress ? `saved: ${currentAddress}` : "disconnected"}`
        );
      } catch (err) {
        console.error("[WalletSync] Fetch error:", err);
      }
    };

    sync();
  }, [wallet, rawAddress, user?.id, user?.walletAddress]);
}
