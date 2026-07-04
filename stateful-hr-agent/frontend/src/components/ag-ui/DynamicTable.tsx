import React, { useEffect, useMemo, useState } from 'react';
import { Search, RotateCw, Pencil, Save, X, Trash2, Plus } from 'lucide-react';

type FieldConfig = { name: string; type: string; required?: boolean; value?: any; };
type FormConfig = { title?: string; fields: FieldConfig[]; submit_action: string; };
type ActionState = { isBusy: boolean; event: string | null; };

interface DynamicTableProps {
  title: string;
  data?: any[];
  rows?: any[];
  columns?: { key: string; label: string }[];
  actions?: string[];
  create_form?: FormConfig;
  update_form?: FormConfig;
  delete_action?: string;
  actionState?: ActionState;
  onAction: (event: string, payload: any) => void;
}

type CrudTab = 'Read' | 'Create' | 'Update' | 'Delete';

const DEFAULT_CREATE_FIELDS: FieldConfig[] = [
  { name: 'name', type: 'text', required: true },
  { name: 'email', type: 'email', required: true },
  { name: 'phone', type: 'text', required: false },
  { name: 'role', type: 'text', required: true },
  { name: 'experience', type: 'number', required: false },
  { name: 'status', type: 'text', required: false },
];

const validateField = (name: string, value: any, required = false) => {
  const s = value === undefined || value === null ? '' : String(value).trim();
  if (required && !s) return `${name} is required`;
  if (name === 'email' && s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'Enter a valid email';
  if (name === 'experience' && s && Number.isNaN(Number(s))) return 'Must be a number';
  return '';
};

export const DynamicTable: React.FC<DynamicTableProps> = ({
  title, data, rows, columns, actions, create_form, update_form, delete_action, actionState, onAction,
}) => {
  const rowData = useMemo(() => data ?? rows ?? [], [data, rows]);
  const headers = useMemo(() => {
    if (columns && columns.length > 0) return columns;
    if (rowData.length === 0) return [];
    return Object.keys(rowData[0]).map((key) => ({ key, label: key }));
  }, [columns, rowData]);

  const availableTabs: CrudTab[] = useMemo(() => {
    const n = new Set((actions || []).map((a) => {
      const s = typeof a === 'object' && a !== null ? (a as any).label || (a as any).event || '' : String(a);
      return s.trim().toLowerCase();
    }));
    const t: CrudTab[] = [];
    if (n.size === 0 || n.has('read')) t.push('Read');
    if (n.size === 0 || n.has('create')) t.push('Create');
    if (n.size === 0 || n.has('update')) t.push('Update');
    if (n.size === 0 || n.has('delete')) t.push('Delete');
    return t;
  }, [actions]);

  const [activeTab, setActiveTab] = useState<CrudTab>(availableTabs[0] || 'Read');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [inlineEditActive, setInlineEditActive] = useState(false);
  const [inlineEditData, setInlineEditData] = useState<Record<string, any>>({});
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const isBusy = actionState?.isBusy ?? false;
  const busyEvent = actionState?.event ?? '';
  const selectedRow = selectedIndex !== null ? rowData[selectedIndex] : null;

  const roleOptions = useMemo(() => Array.from(new Set(rowData.map(r => r?.role).filter(Boolean).map(String))).sort(), [rowData]);
  const statusOptions = useMemo(() => Array.from(new Set(rowData.map(r => r?.status).filter(Boolean).map(String))).sort(), [rowData]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rowData.filter((row) => {
      const mt = !term || Object.values(row || {}).some((v) => String(v ?? '').toLowerCase().includes(term));
      const mr = roleFilter === 'all' || String(row?.role ?? '') === roleFilter;
      const ms = statusFilter === 'all' || String(row?.status ?? '') === statusFilter;
      return mt && mr && ms;
    });
  }, [rowData, searchTerm, roleFilter, statusFilter]);

  useEffect(() => { if (!availableTabs.includes(activeTab)) setActiveTab(availableTabs[0] || 'Read'); }, [availableTabs, activeTab]);
  useEffect(() => { if (selectedIndex !== null && selectedIndex >= rowData.length) { setSelectedIndex(null); setInlineEditActive(false); setInlineEditData({}); setInlineErrors({}); } }, [rowData, selectedIndex]);

  const resolvedCreateForm: FormConfig = useMemo(() => create_form?.fields?.length ? create_form : { title: 'Create Candidate', fields: DEFAULT_CREATE_FIELDS, submit_action: 'create_candidate' }, [create_form]);
  const resolvedUpdateForm: FormConfig = useMemo(() => update_form?.fields?.length ? update_form : { title: 'Update Candidate', fields: [{ name: 'id', type: 'hidden', required: true }, ...DEFAULT_CREATE_FIELDS], submit_action: 'update_candidate' }, [update_form]);

  useEffect(() => {
    if (activeTab === 'Create') {
      const init: Record<string, any> = {};
      resolvedCreateForm.fields.forEach((f) => { if (f.value !== undefined) init[f.name] = f.value; });
      setFormData(init); setFormErrors({}); setInlineEditActive(false); setInlineEditData({}); setInlineErrors({}); return;
    }
    if (activeTab === 'Update') {
      const init: Record<string, any> = {};
      resolvedUpdateForm.fields.forEach((f) => {
        if (f.name === 'id') { init.id = selectedRow?.id ?? f.value ?? ''; return; }
        if (selectedRow && selectedRow[f.name] !== undefined) { init[f.name] = selectedRow[f.name]; return; }
        if (f.value !== undefined) init[f.name] = f.value;
      });
      setFormData(init); setFormErrors({}); setInlineEditActive(false); setInlineEditData({}); setInlineErrors({}); return;
    }
    setFormData({}); setFormErrors({});
    if (activeTab !== 'Read') { setInlineEditActive(false); setInlineEditData({}); setInlineErrors({}); }
  }, [activeTab, selectedRow, resolvedCreateForm.fields, resolvedUpdateForm.fields]);

  const handleFieldChange = (name: string, value: string, required = false) => {
    setFormData((p) => ({ ...p, [name]: value }));
    setFormErrors((p) => ({ ...p, [name]: validateField(name, value, required) }));
  };

  const editableKeys = useMemo(() => headers.map((h) => h.key).filter((k) => k !== 'id' && k !== 'created_at'), [headers]);

  const startInlineEdit = () => { if (!selectedRow) return; const n: Record<string, any> = {}; editableKeys.forEach((k) => { n[k] = selectedRow[k] ?? ''; }); setInlineEditData(n); setInlineErrors({}); setInlineEditActive(true); };
  const cancelInlineEdit = () => { setInlineEditActive(false); setInlineEditData({}); setInlineErrors({}); };
  const saveInlineEdit = () => {
    if (!selectedRow?.id) return;
    const ne: Record<string, string> = {};
    editableKeys.forEach((k) => { const r = k === 'name' || k === 'email' || k === 'role'; const e = validateField(k, inlineEditData[k], r); if (e) ne[k] = e; });
    setInlineErrors(ne); if (Object.keys(ne).length > 0) return;
    onAction('update_candidate', { id: selectedRow.id, ...inlineEditData }); setInlineEditActive(false);
  };

  const submitForm = (fc: FormConfig) => {
    const ne: Record<string, string> = {};
    fc.fields.forEach((f) => { if (f.type === 'hidden') return; const e = validateField(f.name, formData[f.name], f.required !== false); if (e) ne[f.name] = e; });
    setFormErrors(ne); if (Object.keys(ne).length > 0) return;
    onAction(fc.submit_action, formData);
  };

  // ── Btn helper ──
  const btn = (active = false) => `px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${active ? 'bg-black text-white border-black' : 'bg-white text-[#737373] border-[#e5e5e5] hover:bg-[#f5f5f5] hover:text-black hover:border-[#d4d4d4]'}`;
  const btnPrimary = `px-4 py-2 rounded-md text-[12px] font-medium bg-black text-white hover:bg-[#333] transition-colors`;
  const btnDanger = `px-4 py-2 rounded-md text-[12px] font-medium bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors`;

  const renderForm = (fc: FormConfig) => {
    const busy = isBusy && busyEvent === fc.submit_action;
    return (
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); submitForm(fc); }}>
        {fc.fields.map((f) => {
          if (f.type === 'hidden') return <input key={f.name} type="hidden" name={f.name} value={formData[f.name] ?? ''} readOnly />;
          return (
            <label key={f.name} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-[#737373] uppercase tracking-wider">{f.name}{f.required !== false && ' *'}</span>
              <input type={f.type} name={f.name} value={formData[f.name] ?? ''} onChange={(e) => handleFieldChange(f.name, e.target.value, f.required !== false)} required={f.required !== false}
                className={`bg-white border rounded-md px-3 py-2 text-[13px] text-black placeholder-[#a3a3a3] focus:outline-none focus:border-[#404040] focus:ring-1 focus:ring-[#404040] transition-shadow ${formErrors[f.name] ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]' : 'border-[#e5e5e5]'}`}
              />
              {formErrors[f.name] && <span className="text-[10px] text-[#dc2626]">{formErrors[f.name]}</span>}
            </label>
          );
        })}
        <div className="md:col-span-2 flex justify-end pt-1">
          <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-40`}>{busy ? 'Saving...' : 'Submit'}</button>
        </div>
      </form>
    );
  };

  const renderRowCell = (row: any, rowIndex: number, hk: string) => {
    const sel = selectedIndex === rowIndex;
    const edit = activeTab === 'Read' && inlineEditActive && sel && editableKeys.includes(hk);
    if (!edit) return <span className={`text-[12px] ${sel ? 'text-black' : 'text-[#404040]'}`}>{String(row[hk] ?? '—')}</span>;
    return (
      <div className="space-y-0.5">
        <input type={hk === 'experience' ? 'number' : 'text'} value={inlineEditData[hk] ?? ''} onClick={(e) => e.stopPropagation()}
          onChange={(e) => { setInlineEditData((p) => ({ ...p, [hk]: e.target.value })); const r = hk === 'name' || hk === 'email' || hk === 'role'; setInlineErrors((p) => ({ ...p, [hk]: validateField(hk, e.target.value, r) })); }}
          className={`w-full bg-white border rounded px-2 py-1 text-[12px] text-black focus:outline-none focus:border-[#404040] focus:ring-1 focus:ring-[#404040] ${inlineErrors[hk] ? 'border-[#dc2626]' : 'border-[#e5e5e5]'}`}
        />
        {inlineErrors[hk] && <p className="text-[9px] text-[#dc2626]">{inlineErrors[hk]}</p>}
      </div>
    );
  };

  return (
    <div className="w-full">
      {title && <h2 className="text-[15px] font-semibold text-black mb-4">{title}</h2>}

      {/* Tabs + Actions */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {availableTabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={btn(activeTab === tab)}>
            {tab === 'Create' && <Plus className="w-3 h-3 inline mr-1" />}
            {tab === 'Delete' && <Trash2 className="w-3 h-3 inline mr-1" />}
            {tab}
          </button>
        ))}
        <div className="flex gap-1.5 ml-auto">
          {activeTab === 'Read' && !inlineEditActive && (
            <button type="button" onClick={startInlineEdit} disabled={!selectedRow || isBusy} className={`${btn()} disabled:opacity-30`}>
              <Pencil className="w-3 h-3 inline mr-1" />Edit
            </button>
          )}
          {activeTab === 'Read' && inlineEditActive && (
            <>
              <button type="button" onClick={saveInlineEdit} disabled={isBusy && busyEvent === 'update_candidate'} className={`${btnPrimary} text-[11px] px-3 py-1.5 disabled:opacity-40`}>
                <Save className="w-3 h-3 inline mr-1" />{isBusy && busyEvent === 'update_candidate' ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={cancelInlineEdit} className={btn()}><X className="w-3 h-3 inline mr-1" />Cancel</button>
            </>
          )}
          <button type="button" onClick={() => onAction('read_candidates', {})} disabled={isBusy && busyEvent === 'read_candidates'} className={`${btn()} disabled:opacity-40`}>
            <RotateCw className={`w-3 h-3 inline mr-1 ${isBusy && busyEvent === 'read_candidates' ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {activeTab === 'Read' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a3a3a3]" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#e5e5e5] rounded-md pl-9 pr-3 py-2 text-[12px] text-black placeholder-[#a3a3a3] focus:outline-none focus:border-[#404040] focus:ring-1 focus:ring-[#404040] transition-shadow"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#e5e5e5] rounded-md px-3 py-2 text-[12px] text-[#404040] focus:outline-none focus:border-[#404040] focus:ring-1 focus:ring-[#404040] appearance-none cursor-pointer transition-shadow">
            <option value="all">All Roles</option>
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#e5e5e5] rounded-md px-3 py-2 text-[12px] text-[#404040] focus:outline-none focus:border-[#404040] focus:ring-1 focus:ring-[#404040] appearance-none cursor-pointer transition-shadow">
            <option value="all">All Status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Table */}
      {(activeTab === 'Read' || activeTab === 'Update' || activeTab === 'Delete') && (
        <>
          <div className="hidden md:block overflow-auto rounded-lg border border-[#e5e5e5] mb-4 bg-white shadow-sm">
            <table className="min-w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e5e5e5]">
                  {headers.map((h) => (
                    <th key={h.key} className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[#737373]">{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-[12px] text-[#737373]" colSpan={Math.max(headers.length, 1)}>No candidates found</td></tr>
                )}
                {filteredRows.map((row) => {
                  const ri = rowData.findIndex((r) => r.id === row.id);
                  const sel = selectedIndex === ri;
                  return (
                    <tr key={row.id ?? ri} onClick={() => { setSelectedIndex(ri); if (activeTab === 'Read' && inlineEditActive && selectedIndex !== ri) { setInlineEditActive(false); setInlineEditData({}); setInlineErrors({}); } }}
                      className={`border-b border-[#f0f0f0] cursor-pointer transition-colors ${sel ? 'bg-black text-white' : 'bg-white hover:bg-[#fafafa]'}`}>
                      {headers.map((h) => (
                        <td key={h.key} className="px-4 py-2.5 align-top">{renderRowCell(row, ri, h.key)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2 mb-4">
            {filteredRows.length === 0 && <p className="text-[12px] text-[#737373] text-center py-4">No candidates found</p>}
            {filteredRows.map((row) => {
              const ri = rowData.findIndex((r) => r.id === row.id);
              const sel = selectedIndex === ri;
              return (
                <button key={row.id ?? ri} type="button" onClick={() => setSelectedIndex(ri)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${sel ? 'border-black bg-black' : 'border-[#e5e5e5] bg-white hover:bg-[#fafafa] shadow-sm'}`}>
                  <p className={`text-[13px] font-medium ${sel ? 'text-black' : 'text-black'}`}>{row.name || `Candidate ${row.id}`}</p>
                  <p className={`text-[11px] mt-0.5 ${sel ? 'text-[#404040]' : 'text-[#737373]'}`}>{row.email || 'No email'}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-[10px] border rounded px-1.5 py-0.5 ${sel ? 'text-black border-[#d4d4d4] bg-[#fafafa]' : 'text-[#404040] border-[#e5e5e5] bg-[#fafafa]'}`}>{row.role || '—'}</span>
                    <span className={`text-[10px] border rounded px-1.5 py-0.5 ${sel ? 'text-black border-[#d4d4d4] bg-[#fafafa]' : 'text-[#404040] border-[#e5e5e5] bg-[#fafafa]'}`}>{row.status || '—'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Create */}
      {activeTab === 'Create' && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-5 shadow-sm">
          <p className="text-[12px] font-medium text-[#737373] uppercase tracking-wider mb-4">{resolvedCreateForm.title || 'Create'}</p>
          {renderForm(resolvedCreateForm)}
        </div>
      )}

      {/* Update */}
      {activeTab === 'Update' && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-5 shadow-sm">
          <p className="text-[12px] font-medium text-[#737373] uppercase tracking-wider mb-4">{resolvedUpdateForm.title || 'Update'}</p>
          {!selectedRow ? <p className="text-[12px] text-[#737373]">Select a row, then edit fields below.</p> : renderForm(resolvedUpdateForm)}
        </div>
      )}

      {/* Delete */}
      {activeTab === 'Delete' && (
        <div className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] p-5 shadow-sm">
          {!selectedRow ? <p className="text-[12px] text-[#737373]">Select a row to delete.</p> : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-[13px] text-[#991b1b]">Delete <span className="font-semibold text-black">{selectedRow.name}</span> (ID: {selectedRow.id})?</p>
              <button type="button" disabled={isBusy && busyEvent === (delete_action || 'delete_candidate')}
                onClick={() => onAction(delete_action || 'delete_candidate', { id: selectedRow.id })}
                className={`${btnDanger} disabled:opacity-40 whitespace-nowrap`}>
                <Trash2 className="w-3.5 h-3.5 inline mr-1" />{isBusy && busyEvent === (delete_action || 'delete_candidate') ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};





