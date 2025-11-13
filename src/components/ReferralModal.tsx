import { useEffect, useRef, useState } from "react";
import type React from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { generateReferralCode } from "../lib/api";

type ReferralModalProps = {
  open: boolean;
  onClose: () => void;
};

const ReferralModal: React.FC<ReferralModalProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { user } = usePrivy();
  const { wallets } = useWallets();

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Connected wallet address
  const walletAddress =
    (user as any)?.wallet?.address ||
    (user as any)?.embeddedWallets?.[0]?.address ||
    wallets.find((w) => !!w.address)?.address;

  // -------------------------------
  // PRIVY SIGNING HANDLER
  // -------------------------------
  const signWithPrivy = async (wallet: any, message: string) => {
    // Embedded wallet (Privy-managed key)
    if (wallet.walletClientType === "privy") {
      return await wallet.signMessage(message);
    }

    // External wallet (Zerion, MetaMask, Coinbase, Rainbow)
    if (wallet.provider?.request) {
      return await wallet.provider.request({
        method: "personal_sign",
        params: [message, wallet.address],
      });
    }

    throw new Error("Unable to sign message with this wallet.");
  };

  // -------------------------------
  // OPEN / CLOSE MODAL
  // -------------------------------
  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
    if (!open && dialogRef.current?.open) {
      dialogRef.current.close();
    }
    return () => {
      try {
        if (dialogRef.current?.open) dialogRef.current.close();
      } catch {}
    };
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setReferralCode(null);
      setReferralLink(null);
      setError(null);
      setCopied(false);
    }
  }, [open]);

  // -------------------------------
  // GENERATE REFERRAL (with signature)
  // -------------------------------
  const handleGenerateReferral = async () => {
    if (!walletAddress) {
      setError("No wallet connected");
      return;
    }

    const primaryWallet = wallets[0];
    if (!primaryWallet) {
      setError("Wallet not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nonce = Date.now();

      const message = `ZeroGPool Referral Verification
Wallet: ${walletAddress}
Nonce: ${nonce}`;

      // Sign message via Privy-compatible method
      const signature = await signWithPrivy(primaryWallet, message);

      // Send to backend
      const response = await generateReferralCode(walletAddress, signature, nonce);

      setReferralCode(response.referralCode);
      setReferralLink(response.referralLink);

    } catch (err: any) {
      console.error(err);
      setError("Signature failed or referral generation error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // COPY BUTTON
  // -------------------------------
  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="fixed inset-0 z-50 m-auto w-[92vw] max-w-[500px] max-h-[92dvh] overflow-visible rounded-2xl border border-white/10 bg-[rgba(10,16,34,0.85)] shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6 text-[#EAF6FF]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-2 text-2xl leading-none text-slate-300 hover:text-white"
        >
          ×
        </button>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-400/10 to-transparent pt-6 pb-4 text-center mb-4">
          <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(900px_220px_at_50%_-20%,rgba(34,193,241,0.25),transparent)]" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient">
              REFERRAL PROGRAM
            </h2>
            <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white/30" />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {!referralCode ? (
          <div className="space-y-4">
            <p className="text-white/80 text-sm text-center">
              Generate your unique referral code and share it with friends!
            </p>

            <button
              onClick={handleGenerateReferral}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white"
            >
              {loading ? "Signing..." : "Generate Referral Code"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Referral Code */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="block text-xs text-white/60 mb-2">Your Referral Code</label>
              <div className="text-2xl font-mono font-bold text-cyan-300 text-center tracking-wider">
                {referralCode}
              </div>
            </div>

            {/* Referral Link */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="block text-xs text-white/60 mb-2">Referral Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralLink || ""}
                  readOnly
                  className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/90 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm"
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <p className="text-xs text-white/60 text-center">
              Share this link to invite friends!
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default ReferralModal;
