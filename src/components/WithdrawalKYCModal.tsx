import React, { useState, useEffect } from 'react';
import { X, Shield, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useFictionalPix } from '../hooks/useFictionalPix';
import { QRCodeGenerator } from './QRCodeGenerator';

interface WithdrawalKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
}

export const WithdrawalKYCModal: React.FC<WithdrawalKYCModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete
}) => {
  const { loading, pixData, createPix, checkPixStatus, reset } = useFictionalPix();
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentCheckInterval, setPaymentCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const VERIFICATION_AMOUNT = 4.90;

  useEffect(() => {
    if (isOpen) {
      generateVerificationPix();
    }

    return () => {
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!pixData || !isOpen) return;

    setIsCheckingPayment(true);

    const checkPayment = async () => {
      try {
        const status = await checkPixStatus(pixData.transactionId);

        if (status.status === 'paid') {
          if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
            setPaymentCheckInterval(null);
          }

          setShowSuccess(true);

          setTimeout(() => {
            onVerificationComplete();
            reset();
            setIsCheckingPayment(false);
            onClose();
          }, 3000);
        }
      } catch (err) {
        console.error('Erro ao verificar pagamento:', err);
      }
    };

    checkPayment();

    const interval = setInterval(checkPayment, 3000);
    setPaymentCheckInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pixData, isOpen]);

  const generateVerificationPix = async () => {
    try {
      await createPix(VERIFICATION_AMOUNT);
    } catch (err) {
      console.error('Erro ao gerar PIX de verificação:', err);
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.qrcode) return;

    try {
      await navigator.clipboard.writeText(pixData.qrcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="bg-green-500 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verificação Confirmada!</h2>
            <p className="text-white/90">Saque liberado</p>
          </div>

          <div className="p-6 text-center">
            <div className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Pagamento Verificado
              </h3>
              <p className="text-green-700 text-sm">
                O valor de R$ 4,90 será reembolsado automaticamente ao seu saldo após a conclusão do saque.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-700 text-xs">
                Agora você pode prosseguir com seu saque. A verificação garante a segurança da sua transação.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Verificação de Saque</h2>
                <p className="text-white/80 text-sm">Segurança Obrigatória</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-bold text-sm">Por que essa verificação?</span>
            </div>
            <p className="text-yellow-700 text-sm mb-3">
              Para garantir a segurança da sua transação e confirmar que você é o titular da conta, solicitamos um depósito de verificação de <strong>R$ 4,90</strong>.
            </p>
            <div className="bg-yellow-100 rounded-lg p-3 border border-yellow-200">
              <p className="text-yellow-800 text-xs font-semibold mb-2">
                ✓ O valor será reembolsado automaticamente
              </p>
              <p className="text-yellow-700 text-xs">
                Após a confirmação do pagamento, o valor de R$ 4,90 será devolvido ao seu saldo junto com o saque processado. Esta é apenas uma medida de segurança.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Gerando código de verificação...</p>
            </div>
          ) : pixData ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Depósito de Verificação</h3>
                <div className="bg-orange-500 text-white rounded-full px-4 py-1 inline-block font-bold text-sm">
                  R$ {VERIFICATION_AMOUNT.toFixed(2).replace('.', ',')}
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 text-center border border-gray-200 shadow-inner">
                <div className="bg-white rounded-lg p-4 shadow-lg inline-block border border-gray-100">
                  <QRCodeGenerator
                    value={pixData.qrcode}
                    size={160}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3 font-medium">
                  📱 Escaneie com o app do seu banco
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  💳 Código PIX (Copia e Cola):
                </label>
                <div className="bg-gray-100 rounded-xl p-3 border border-gray-200">
                  <input
                    type="text"
                    value={pixData.qrcode}
                    readOnly
                    className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg text-xs font-mono mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyPixCode}
                    className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-300 active:scale-95 ${
                      copied
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {copied ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Código Copiado!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Copiar Código PIX</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-blue-800 mb-2 text-sm">Como funciona:</h4>
                    <ol className="text-blue-700 text-xs space-y-1 list-decimal list-inside">
                      <li>Pague o depósito de R$ 4,90 via PIX</li>
                      <li>Aguarde a confirmação automática</li>
                      <li>Seu saque será processado imediatamente</li>
                      <li>O valor será reembolsado junto com seu saque</li>
                    </ol>
                  </div>
                </div>
              </div>

              {isCheckingPayment && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-green-700 text-sm text-center font-medium">
                      🔄 Aguardando confirmação do pagamento...
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
