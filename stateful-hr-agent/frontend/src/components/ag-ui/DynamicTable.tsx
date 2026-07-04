import React, { useEffect, useMemo, useState } from 'react';

type FieldConfig = {
  name: string;
  type: string;
  required?: boolean;
  value?: any;
};

type FormConfig = {
  title?: string;
  fields: FieldConfig[];
  submit_action: string;
};

type ActionState = {
  isBusy: boolean;
  event: string | null;
};

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
  const strValue = value === undefined || value === null ? '' : String(value).trim();

  if (required && !strValue) {
    return `${name} is required`;
  }

  if (name === 'email' && strValue) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strValue)) {
      return 'Enter a valid email address';
    }
  }

  if (name === 'experience' && strValue && Number.isNaN(Number(strValue))) {
    return 'Experience must be a number';
  }

  return '';
};

export const DynamicTable: React.FC<DynamicTableProps> = ({
  title,
  data,
  rows,
  columns,
  actions,
  create_form,
  update_form,
  delete_action,
  actionState,
  onAction,
}) => {
  const rowData = useMemo(() => data ?? rows ?? [], [data, rows]);

  const headers = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns;
    }
    if (rowData.length === 0) {
      return [];
    }
    return Object.keys(rowData[0]).map((key) => ({ key, label: key }));
  }, [columns, rowData]);

  const availableTabs: CrudTab[] = useMemo(() => {
    const normalized = new Set((actions || []).map((a) => a.trim().toLowerCase()));
    const tabs: CrudTab[] = [];
    if (normalized.size === 0 || normalized.has('read')) tabs.push('Read');
    if (normalized.size === 0 || normalized.has('create')) tabs.push('Create');
    if (normalized.size === 0 || normalized.has('update')) tabs.push('Update');
    if (normalized.size === 0 || normalized.has('delete')) tabs.push('Delete');
    return tabs;
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

  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    rowData.forEach((r) => {
      if (r?.role) set.add(String(r.role));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rowData]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    rowData.forEach((r) => {
      if (r?.status) set.add(String(r.status));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rowData]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rowData.filter((row) => {
      const matchesTerm =
        !term ||
        Object.values(row || {}).some((v) => String(v ?? '').toLowerCase().includes(term));
      const matchesRole = roleFilter === 'all' || String(row?.role ?? '') === roleFilter;
      const matchesStatus = statusFilter === 'all' || String(row?.status ?? '') === statusFilter;
      return matchesTerm && matchesRole && matchesStatus;
    });
  }, [rowData, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || 'Read');
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= rowData.length) {
      setSelectedIndex(null);
      setInlineEditActive(false);
      setInlineEditData({});
      setInlineErrors({});
    }
  }, [rowData, selectedIndex]);

  const resolvedCreateForm: FormConfig = useMemo(() => {
    if (create_form?.fields?.length) {
      return create_form;
    }
    return {
      title: 'Create Candidate',
      fields: DEFAULT_CREATE_FIELDS,
      submit_action: 'create_candidate',
    };
  }, [create_form]);

  const resolvedUpdateForm: FormConfig = useMemo(() => {
    if (update_form?.fields?.length) {
      return update_form;
    }
    return {
      title: 'Update Candidate',
      fields: [{ name: 'id', type: 'hidden', required: true }, ...DEFAULT_CREATE_FIELDS],
      submit_action: 'update_candidate',
    };
  }, [update_form]);

  useEffect(() => {
    if (activeTab === 'Create') {
      const initial: Record<string, any> = {};
      resolvedCreateForm.fields.forEach((field) => {
        if (field.value !== undefined) initial[field.name] = field.value;
      });
      setFormData(initial);
      setFormErrors({});
      setInlineEditActive(false);
      setInlineEditData({});
      setInlineErrors({});
      return;
    }

    if (activeTab === 'Update') {
      const initial: Record<string, any> = {};
      resolvedUpdateForm.fields.forEach((field) => {
        if (field.name === 'id') {
          initial.id = selectedRow?.id ?? field.value ?? '';
          return;
        }
        if (selectedRow && selectedRow[field.name] !== undefined) {
          initial[field.name] = selectedRow[field.name];
          return;
        }
        if (field.value !== undefined) {
          initial[field.name] = field.value;
        }
      });
      setFormData(initial);
      setFormErrors({});
      setInlineEditActive(false);
      setInlineEditData({});
      setInlineErrors({});
      return;
    }

    setFormData({});
    setFormErrors({});
    if (activeTab !== 'Read') {
      setInlineEditActive(false);
      setInlineEditData({});
      setInlineErrors({});
    }
  }, [activeTab, selectedRow, resolvedCreateForm.fields, resolvedUpdateForm.fields]);

  const handleFieldChange = (name: string, value: string, required = false) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: validateField(name, value, required) }));
  };

  const editableKeys = useMemo(
    () => headers.map((h) => h.key).filter((key) => key !== 'id' && key !== 'created_at'),
    [headers]
  );

  const startInlineEdit = () => {
    if (!selectedRow) return;
    const next: Record<string, any> = {};
    editableKeys.forEach((key) => {
      next[key] = selectedRow[key] ?? '';
    });
    setInlineEditData(next);
    setInlineErrors({});
    setInlineEditActive(true);
  };

  const cancelInlineEdit = () => {
    setInlineEditActive(false);
    setInlineEditData({});
    setInlineErrors({});
  };

  const saveInlineEdit = () => {
    if (!selectedRow?.id) return;

    const nextErrors: Record<string, string> = {};
    editableKeys.forEach((key) => {
      const required = key === 'name' || key === 'email' || key === 'role';
      const err = validateField(key, inlineEditData[key], required);
      if (err) nextErrors[key] = err;
    });

    setInlineErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onAction('update_candidate', { id: selectedRow.id, ...inlineEditData });
    setInlineEditActive(false);
  };

  const submitForm = (formConfig: FormConfig) => {
    const nextErrors: Record<string, string> = {};

    formConfig.fields.forEach((field) => {
      if (field.type === 'hidden') return;
      const err = validateField(field.name, formData[field.name], field.required !== false);
      if (err) nextErrors[field.name] = err;
    });

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onAction(formConfig.submit_action, formData);
  };

  const renderForm = (formConfig: FormConfig) => {
    const submitBusy = isBusy && busyEvent === formConfig.submit_action;

    return (
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submitForm(formConfig);
        }}
      >
        {formConfig.fields.map((field) => {
          if (field.type === 'hidden') {
            return (
              <input
                key={field.name}
                type="hidden"
                name={field.name}
                value={formData[field.name] ?? ''}
                readOnly
              />
            );
          }

          return (
            <label key={field.name} className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-medium capitalize">{field.name}</span>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] ?? ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value, field.required !== false)}
                required={field.required !== false}
                className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formErrors[field.name] ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {formErrors[field.name] && (
                <span className="text-xs text-rose-600">{formErrors[field.name]}</span>
              )}
            </label>
          );
        })}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={submitBusy}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {submitBusy ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </form>
    );
  };

  const renderRowCell = (row: any, rowIndex: number, headerKey: string) => {
    const isSelected = selectedIndex === rowIndex;
    const isEditableCell =
      activeTab === 'Read' && inlineEditActive && isSelected && editableKeys.includes(headerKey);

    if (!isEditableCell) return String(row[headerKey] ?? '');

    return (
      <div className="space-y-1">
        <input
          type={headerKey === 'experience' ? 'number' : 'text'}
          value={inlineEditData[headerKey] ?? ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            setInlineEditData((prev) => ({ ...prev, [headerKey]: val }));
            const required = headerKey === 'name' || headerKey === 'email' || headerKey === 'role';
            setInlineErrors((prev) => ({ ...prev, [headerKey]: validateField(headerKey, val, required) }));
          }}
          className={`w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            inlineErrors[headerKey] ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
          }`}
        />
        {inlineErrors[headerKey] && <p className="text-xs text-rose-600">{inlineErrors[headerKey]}</p>}
      </div>
    );
  };

  return (
    <div className="w-full workspace-panel rounded-xl border workspace-border p-4 mb-4">
      {title && <h2 className="text-xl font-bold mb-4 workspace-text">{title}</h2>}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            {tab}
          </button>
        ))}

        {activeTab === 'Read' && !inlineEditActive && (
          <button
            type="button"
            onClick={startInlineEdit}
            disabled={!selectedRow || isBusy}
            className="ml-auto px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Edit Row
          </button>
        )}

        {activeTab === 'Read' && inlineEditActive && (
          <>
            <button
              type="button"
              onClick={saveInlineEdit}
              disabled={isBusy && busyEvent === 'update_candidate'}
              className="ml-auto px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isBusy && busyEvent === 'update_candidate' ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelInlineEdit}
              disabled={isBusy && busyEvent === 'update_candidate'}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onAction('read_candidates', {})}
          disabled={isBusy && busyEvent === 'read_candidates'}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-50"
        >
          {isBusy && busyEvent === 'read_candidates' ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {activeTab === 'Read' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-1 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      )}

      {(activeTab === 'Read' || activeTab === 'Update' || activeTab === 'Delete') && (
        <>
          <div className="hidden md:block overflow-auto rounded-md mb-4 max-h-[26rem] border border-slate-100">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-gray-200 text-slate-600 uppercase tracking-wider">
                <tr>
                  {headers.map((header) => (
                    <th key={header.key} className="px-6 py-3 font-medium">
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td className="px-6 py-4 text-slate-500" colSpan={Math.max(headers.length, 1)}>
                      No candidates found.
                    </td>
                  </tr>
                )}
                {filteredRows.map((row) => {
                  const rowIndex = rowData.findIndex((r) => r.id === row.id);
                  const isSelected = selectedIndex === rowIndex;
                  return (
                    <tr
                      key={row.id ?? rowIndex}
                      onClick={() => {
                        setSelectedIndex(rowIndex);
                        if (activeTab === 'Read' && inlineEditActive && selectedIndex !== rowIndex) {
                          setInlineEditActive(false);
                          setInlineEditData({});
                          setInlineErrors({});
                        }
                      }}
                      className={`border-b border-gray-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {headers.map((header) => (
                        <td key={header.key} className="px-6 py-4 text-slate-700 align-top">
                          {renderRowCell(row, rowIndex, header.key)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 mb-4 max-h-[26rem] overflow-auto">
            {filteredRows.length === 0 && (
              <p className="text-sm text-slate-500">No candidates found.</p>
            )}
            {filteredRows.map((row) => {
              const rowIndex = rowData.findIndex((r) => r.id === row.id);
              const isSelected = selectedIndex === rowIndex;
              return (
                <button
                  key={row.id ?? rowIndex}
                  type="button"
                  onClick={() => setSelectedIndex(rowIndex)}
                  className={`w-full text-left rounded-lg border p-3 ${
                    isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">{row.name || `Candidate ${row.id}`}</p>
                  <p className="text-xs text-slate-600 mt-1">{row.email || 'No email'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Role: {row.role || '-'}</span>
                    <span className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Status: {row.status || '-'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'Create' && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{resolvedCreateForm.title || 'Create'}</h3>
          {renderForm(resolvedCreateForm)}
        </div>
      )}

      {activeTab === 'Update' && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{resolvedUpdateForm.title || 'Update'}</h3>
          {!selectedRow ? (
            <p className="text-sm text-slate-500">Select a row, then edit fields below.</p>
          ) : (
            renderForm(resolvedUpdateForm)
          )}
        </div>
      )}

      {activeTab === 'Delete' && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
          {!selectedRow ? (
            <p className="text-sm text-rose-700">Select a row to delete.</p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-rose-800">
                Delete candidate <span className="font-semibold">{selectedRow.name}</span> (ID: {selectedRow.id})?
              </p>
              <button
                type="button"
                disabled={isBusy && busyEvent === (delete_action || 'delete_candidate')}
                onClick={() => onAction(delete_action || 'delete_candidate', { id: selectedRow.id })}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isBusy && busyEvent === (delete_action || 'delete_candidate') ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
