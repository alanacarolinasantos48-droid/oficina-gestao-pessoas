import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, LogIn, QrCode, Search, XCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "./lib/supabaseClient";

const NAVY = "#0F2A4A";
const BLUE = "#1B4B7A";
const LIGHT = "#EEF3F9";
const GOLD = "#C9A227";

function normalizeCode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/(?:checkin[:=/\-])?(\d+)$/i);
  return match ? match[1] : raw;
}

export default function QrCheckin() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const scanLockRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
      stopCamera();
    };
  }, []);

  async function login(e) {
    e.preventDefault();
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError("E-mail ou senha incorretos.");
  }

  async function stopCamera() {
    scanLockRef.current = false;
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        if (state === 2 || state === 3) await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (error) {
        console.warn("Erro ao fechar câmera:", error);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }

  async function startCamera() {
    setResult(null);
    setCameraError("");
    scanLockRef.current = false;

    try {
      await stopCamera();
      const scanner = new Html5Qrcode("qr-reader", { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
            return { width: edge, height: edge };
          },
          aspectRatio: 1.333334,
        },
        async (decodedText) => {
          if (scanLockRef.current) return;
          scanLockRef.current = true;
          await confirmPresence(decodedText);
          await stopCamera();
        },
        () => {}
      );

      setCameraActive(true);
    } catch (error) {
      console.error("Erro ao abrir câmera:", error);
      const message = String(error?.message || error || "");
      if (/permission|notallowed|denied/i.test(message)) {
        setCameraError("Permita o uso da câmera nas configurações do navegador e tente novamente.");
      } else if (/notfound|camera|device/i.test(message)) {
        setCameraError("Não encontrei uma câmera disponível neste aparelho.");
      } else {
        setCameraError("Não foi possível abrir a câmera. Tente novamente ou use o número da inscrição abaixo.");
      }
      setCameraActive(false);
    }
  }

  async function confirmPresence(value) {
    const id = normalizeCode(value);
    if (!id) return;

    setBusy(true);
    setResult(null);

    try {
      const { data: participant, error: findError } = await supabase
        .from("inscricoes")
        .select("id,nome,email,presenca")
        .eq("id", id)
        .maybeSingle();

      if (findError) throw findError;
      if (!participant) {
        setResult({ ok: false, title: "Inscrição não encontrada", message: `Código lido: ${id}` });
        return;
      }

      if (participant.presenca) {
        setResult({
          ok: true,
          already: true,
          title: "Presença já confirmada",
          name: participant.nome,
          message: "Este participante já estava marcado como presente.",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from("inscricoes")
        .update({ presenca: true })
        .eq("id", participant.id);

      if (updateError) throw updateError;

      setResult({
        ok: true,
        title: "Presença confirmada!",
        name: participant.nome,
        message: "Check-in registrado com sucesso.",
      });
      setManualCode("");
    } catch (error) {
      console.error("Erro no check-in:", error);
      setResult({
        ok: false,
        title: "Não foi possível confirmar",
        message: "Verifique sua conexão ou as permissões do Supabase e tente novamente.",
      });
    } finally {
      setBusy(false);
      scanLockRef.current = false;
    }
  }

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: LIGHT, color: NAVY }}>Carregando…</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: NAVY }}>
        <div className="w-full max-w-sm bg-white rounded-2xl p-7 shadow-lg">
          <a href="/" className="flex items-center gap-1.5 text-xs mb-5" style={{ color: BLUE }}>
            <ArrowLeft size={14} /> Voltar ao site
          </a>
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ background: LIGHT }}>
              <QrCode size={22} color={NAVY} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: NAVY }}>Check-in por QR Code</h1>
            <p className="text-xs mt-1" style={{ color: "#5A6B7D" }}>Entre com o acesso administrativo.</p>
          </div>
          <form onSubmit={login} className="space-y-3">
            <input type="email" required placeholder="E-mail do administrador" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm" />
            <input type="password" required placeholder="Senha do administrador" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm" />
            {authError && <p className="text-xs" style={{ color: "#B3261E" }}>{authError}</p>}
            <button className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2" style={{ background: GOLD, color: NAVY }}>
              <LogIn size={16} /> Entrar e abrir leitor
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: LIGHT }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <a href="/" className="flex items-center gap-1.5 text-sm" style={{ color: BLUE }}><ArrowLeft size={16} /> Painel/site</a>
          <button onClick={() => supabase.auth.signOut()} className="text-xs" style={{ color: "#5A6B7D" }}>Sair</button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: "#E3E9F0" }}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#FFF7D6" }}>
              <QrCode size={28} color={NAVY} />
            </div>
            <h1 className="text-xl font-bold mt-3" style={{ color: NAVY }}>Confirmar presença</h1>
            <p className="text-sm mt-1" style={{ color: "#5A6B7D" }}>Leia o QR Code do comprovante de inscrição.</p>
          </div>

          <div className="mt-5 rounded-2xl overflow-hidden border relative min-h-[280px] flex items-center justify-center" style={{ borderColor: "#D6DFE9", background: NAVY }}>
            <div id="qr-reader" className="w-full" />
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-6 pointer-events-none">
                <div>
                  <Camera size={34} color="white" className="mx-auto" />
                  <p className="text-white text-sm mt-2">A câmera aparecerá aqui.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {!cameraActive ? (
              <button disabled={busy} onClick={startCamera} className="flex-1 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2" style={{ background: NAVY, color: "white" }}>
                <Camera size={16} /> Abrir câmera
              </button>
            ) : (
              <button onClick={stopCamera} className="flex-1 py-3 rounded-full font-semibold text-sm border" style={{ borderColor: "#D6DFE9", color: NAVY }}>
                Fechar câmera
              </button>
            )}
          </div>

          {cameraError && <p className="text-xs mt-3 text-center" style={{ color: "#B3261E" }}>{cameraError}</p>}

          <div className="my-5 flex items-center gap-3"><div className="h-px flex-1" style={{ background: "#E3E9F0" }} /><span className="text-[11px]" style={{ color: "#9AA9B8" }}>OU DIGITE O Nº DA INSCRIÇÃO</span><div className="h-px flex-1" style={{ background: "#E3E9F0" }} /></div>

          <form onSubmit={(e) => { e.preventDefault(); confirmPresence(manualCode); }} className="flex gap-2">
            <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Ex.: 12" className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#D6DFE9" }} />
            <button disabled={busy || !manualCode.trim()} className="px-4 rounded-xl" style={{ background: GOLD, color: NAVY }}><Search size={18} /></button>
          </form>
        </div>

        {result && (
          <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: result.ok ? "#B7DFC1" : "#F2B8B5" }}>
            <div className="flex gap-3 items-start">
              {result.ok ? <CheckCircle2 size={24} color="#1E8E3E" /> : <XCircle size={24} color="#B3261E" />}
              <div>
                <p className="font-semibold" style={{ color: result.ok ? "#1E6E32" : "#9B1C16" }}>{result.title}</p>
                {result.name && <p className="font-bold mt-1" style={{ color: NAVY }}>{result.name}</p>}
                <p className="text-sm mt-1" style={{ color: "#5A6B7D" }}>{result.message}</p>
              </div>
            </div>
            <button onClick={() => { setResult(null); startCamera(); }} className="w-full mt-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: LIGHT, color: NAVY }}>
              Ler próximo QR Code
            </button>
          </div>
        )}

        <p className="text-center text-[11px] mt-5" style={{ color: "#9AA9B8" }}>O QR Code contém apenas o número da inscrição.</p>
      </div>
    </div>
  );
}
