import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  title: string;
  description: string;
  reasons: string[];
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  consequences?: React.ReactNode;
  error?: string | null;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  title,
  description,
  reasons,
  confirmLabel,
  onCancel,
  onConfirm,
  consequences,
  error,
}) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const reasonFinal = reason === 'Outro (informar)' ? otherReason.trim() : reason;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reasonFinal) return;
    onConfirm(reasonFinal);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-exclusao-titulo"
        aria-describedby="confirmar-exclusao-descricao"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirmar-exclusao-titulo" className="text-lg font-bold text-stone-900">
              {title}
            </h2>
            <p id="confirmar-exclusao-descricao" className="mt-1 text-sm leading-5 text-stone-600">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar confirmação"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {consequences && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
            {consequences}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label htmlFor="motivo-exclusao" className="block text-sm font-medium text-stone-700">
            Qual o motivo?
            <select
              id="motivo-exclusao"
              required
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setOtherReason('');
              }}
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="" disabled>Selecione um motivo</option>
              {reasons.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          {reason === 'Outro (informar)' && (
            <label htmlFor="detalhe-motivo-exclusao" className="block text-sm font-medium text-stone-700">
              Descreva o motivo
              <textarea
                id="detalhe-motivo-exclusao"
                required
                maxLength={200}
                value={otherReason}
                onChange={(event) => setOtherReason(event.target.value)}
                rows={2}
                className="mt-1.5 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          )}

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={!reasonFinal}
              className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
