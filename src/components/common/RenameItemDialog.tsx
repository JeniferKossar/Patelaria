import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';

interface RenameItemDialogProps {
  itemType: string;
  currentName: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
  error?: string | null;
}

export const RenameItemDialog: React.FC<RenameItemDialogProps> = ({
  itemType,
  currentName,
  onCancel,
  onConfirm,
  error,
}) => {
  const [name, setName] = useState(currentName);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updatedName = name.trim();
    if (updatedName) onConfirm(updatedName);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="renomear-item-titulo"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <Pencil aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="renomear-item-titulo" className="text-lg font-bold text-stone-900">
              Editar nome do {itemType}
            </h2>
            <p className="mt-1 text-sm leading-5 text-stone-600">
              Altere apenas o nome. Os demais dados serão mantidos.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar edição"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label htmlFor="nome-item-editado" className="block text-sm font-medium text-stone-700">
            Nome
            <input
              id="nome-item-editado"
              type="text"
              autoFocus
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName}
              className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar nome
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
