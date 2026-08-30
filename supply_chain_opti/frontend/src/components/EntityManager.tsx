import { useState, useMemo } from "react";
import { Pencil, Trash2, Plus, X, Check, Search, Filter } from "lucide-react";
import { GlowCard } from "./ui/GlowCard";
import { ShimmerButton } from "./ui/ShimmerButton";
import { Badge } from "./ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox";
  step?: string;
}

interface Props<T extends { id: number }> {
  title: string;
  description: string;
  fields: FieldDef[];
  items: T[];
  emptyItem: Omit<T, "id">;
  onCreate: (item: Omit<T, "id">) => Promise<void>;
  onUpdate: (id: number, item: Omit<T, "id">) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function EntityManager<T extends { id: number; name: string }>({
  title,
  description,
  fields,
  items,
  emptyItem,
  onCreate,
  onUpdate,
  onDelete,
}: Props<T>) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<any>(emptyItem);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item: any) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const startNew = () => {
    setForm(emptyItem);
    setEditingId("new");
  };

  const startEdit = (item: T) => {
    setForm({ ...item });
    setEditingId(item.id);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyItem);
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload: any = { ...form };
      fields.forEach((f) => {
        if (f.type === "number") payload[f.key] = Number(payload[f.key]);
        if (f.type === "checkbox") payload[f.key] = Boolean(payload[f.key]);
      });
      if (editingId === "new") {
        await onCreate(payload);
      } else if (typeof editingId === "number") {
        await onUpdate(editingId, payload);
      }
      cancel();
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlowCard glowColor="cyan" className="p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display font-bold text-lg text-white">{title}</h2>
            <Badge variant="cyan" pulse={false}>
              {items.length} Records
            </Badge>
          </div>
          <p className="text-xs text-cyber-muted">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-faint" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-cyber-faint focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 w-44 md:w-56"
            />
          </div>

          {editingId === null && (
            <ShimmerButton variant="cyan" size="sm" icon={<Plus size={14} />} onClick={startNew}>
              Add Record
            </ShimmerButton>
          )}
        </div>
      </div>

      {/* Edit Form Modal/Drawer Container */}
      <AnimatePresence>
        {editingId !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="glass-panel p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-purple-950/20">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <span className="section-label text-cyan-400">
                  {editingId === "new" ? "New Facility Entry" : `Edit Facility #${editingId}`}
                </span>
                <button onClick={cancel} className="text-cyber-faint hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {fields.map((f) => (
                  <label key={f.key} className="flex flex-col gap-1.5 text-xs text-cyber-muted">
                    <span className="font-mono">{f.label}</span>
                    {f.type === "checkbox" ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(form[f.key])}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-400"
                        />
                        <span className="text-white text-xs">Facility Operational</span>
                      </div>
                    ) : (
                      <input
                        type={f.type}
                        step={f.step}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={cancel}
                  className="px-4 py-2 rounded-lg border border-white/10 text-xs font-medium text-cyber-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <ShimmerButton
                  variant="cyan"
                  size="sm"
                  loading={busy}
                  icon={<Check size={14} />}
                  onClick={save}
                >
                  Save Telemetry
                </ShimmerButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-white/10 bg-black/40 section-label text-[10px]">
              {fields.map((f) => (
                <th key={f.key} className="py-3 px-4 text-cyber-faint font-semibold">
                  {f.label}
                </th>
              ))}
              <th className="py-3 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredItems.map((item: any) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-cyan-500/05 transition-colors group"
              >
                {fields.map((f) => (
                  <td key={f.key} className="py-3 px-4 font-mono text-cyber-text">
                    {f.type === "checkbox" ? (
                      item[f.key] ? (
                        <Badge variant="emerald">Operational</Badge>
                      ) : (
                        <Badge variant="rose">Offline</Badge>
                      )
                    ) : (
                      item[f.key]
                    )}
                  </td>
                ))}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded-lg text-cyber-faint hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-lg text-cyber-faint hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={fields.length + 1} className="py-8 text-center text-cyber-faint font-mono">
                  No records match query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlowCard>
  );
}
