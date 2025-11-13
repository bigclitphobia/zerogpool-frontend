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

  // -------------------------------------
  // GET CONNECTED WALLET ADDRESS
  // -------------------------------------
  const walletAddress =
    (user as any)?.wallet?.address ||
    (user as any)?.embeddedWallets?.[0]?.address ||
    wallets.find((w) => !!w.address)?.address;

  // -------------------------------------
  // UNIVERSAL PRIVY SIGN METHOD
  // -------------------------------------
  const signWithPrivy = async (wallet: any, message: string) => {
    if (!wallet?.sign) {
      console.error("Wallet object:", wallet);
      throw new Error("Wallet cannot sign messages.");
    }

    // Privy's unified signing method
    return await wallet.sign(message);
  };

  // -------------------------------------
  // OPEN / CLOSE MODAL
  // -------------------------------------
  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
    if (!open && dialogRef.current?.open) {
      dialogRef.current.close();
    }
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

  // -------------------------------------
  // GENERATE REFERRAL CODE
  // -------------------------------------
  const handleGenerateReferral = async () => {
    if (!walletAddress) {
      setError("No wallet connected.");
      return;
    }

    const primaryWallet = wallets[0];
    if (!primaryWallet) {
      setError("Wallet not found.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nonce = Date.now();

      const message = `ZeroGPool Referral Verification
Wallet: ${walletAddress}
Nonce: ${nonce}`;

      // Sign message
      const signature = await signWithPrivy(primaryWallet, message);

      // Call backend
      const response = await generateReferralCode(walletAddress, signature, nonce);

      setReferralCode(response.referralCode);
      setReferralLink(response.referralLink);
    } catch (err: any) {
      console.error("Referral error:", err);
      setError("Signature failed or wallet not supported.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // COPY LINK
  // -------------------------------------
  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      className="fixed inset-0 z-50 m-auto w-[92vw] max-w-[500px] max-h-[92dvh] overflow-visible rounded-2xl border border-white/10 bg-[rgba(10,16,34,0.85)] shadow-lg backdrop:bg-black/60 backdrop-blur-md"
    >
      <div className="relative p-6 text-[#EAF6FF]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-2 text-2xl text-slate-300 hover:text-white"
        >
          ×
        </button>

        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            REFERRAL PROGRAM
          </h2>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white/30" />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Before generating */}
        {!referralCode ? (
          <div className="space-y-4">
            <p className="text-white/70 text-sm text-center">
              Generate a referral code and earn rewards!
            </p>

            <button
              onClick={handleGenerateReferral}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white shadow-md disabled:opacity-60"
            >
              {loading ? "Signing..." : "Generate Referral Code"}
            </button>
          </div>
        ) : (
          // After generating
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="text-xs text-white/60">Your Referral Code</label>
              <div className="text-2xl font-mono font-bold text-cyan-300 text-center tracking-wider">
                {referralCode}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <label className="text-xs text-white/60">Referral Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralLink || ""}
                  readOnly
                  className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/90 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm"
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
