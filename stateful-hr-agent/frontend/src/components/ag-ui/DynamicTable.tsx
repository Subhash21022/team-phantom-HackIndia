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

interface DynamicTableProps {
  title: string;
  data?: any[];
  rows?: any[];
  columns?: { key: string; label: string }[];
  actions?: string[];
  create_form?: FormConfig;
  update_form?: FormConfig;
  delete_action?: string;
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

export const DynamicTable: React.FC<DynamicTableProps> = ({
  title,
  data,
  rows,
  columns,
  actions,
  create_form,
  update_form,
  delete_action,
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
  const [inlineEditActive, setInlineEditActive] = useState(false);
  const [inlineEditData, setInlineEditData] = useState<Record<string, any>>({});

  const selectedRow = selectedIndex !== null ? rowData[selectedIndex] : null;

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
      setInlineEditActive(false);
      setInlineEditData({});
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
      setInlineEditActive(false);
      setInlineEditData({});
      return;
    }

    setFormData({});
    if (activeTab !== 'Read') {
      setInlineEditActive(false);
      setInlineEditData({});
    }
  }, [activeTab, selectedRow, resolvedCreateForm.fields, resolvedUpdateForm.fields]);

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setInlineEditActive(true);
  };

  const cancelInlineEdit = () => {
    setInlineEditActive(false);
    setInlineEditData({});
  };

  const saveInlineEdit = () => {
    if (!selectedRow?.id) return;
    onAction('update_candidate', { id: selectedRow.id, ...inlineEditData });
    setInlineEditActive(false);
  };

  const renderForm = (formConfig: FormConfig) => (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onAction(formConfig.submit_action, formData);
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
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required !== false}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        );
      })}
      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Submit
        </button>
      </div>
    </form>
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
      {title && <h2 className="text-xl font-bold mb-4 text-slate-800">{title}</h2>}

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
            disabled={!selectedRow}
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
              className="ml-auto px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelInlineEdit}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
            >
              Cancel
            </button>
          </>
        )}

        {activeTab !== 'Read' && (
          <button
            type="button"
            onClick={() => onAction('read_candidates', {})}
            className="ml-auto px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Refresh
          </button>
        )}
      </div>

      {(activeTab === 'Read' || activeTab === 'Update' || activeTab === 'Delete') && (
        <div className="overflow-x-auto rounded-md mb-4">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 uppercase tracking-wider">
              <tr>
                {headers.map((header) => (
                  <th key={header.key} className="px-6 py-3 font-medium">
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowData.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-slate-500" colSpan={Math.max(headers.length, 1)}>
                    No candidates found.
                  </td>
                </tr>
              )}
              {rowData.map((row, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <tr
                    key={row.id ?? index}
                    onClick={() => {
                      setSelectedIndex(index);
                      if (activeTab === 'Read' && inlineEditActive && selectedIndex !== index) {
                        setInlineEditActive(false);
                        setInlineEditData({});
                      }
                    }}
                    className={`border-b border-gray-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {headers.map((header) => {
                      const isEditableCell =
                        activeTab === 'Read' && inlineEditActive && isSelected && editableKeys.includes(header.key);

                      return (
                        <td key={header.key} className="px-6 py-4 text-slate-700">
                          {isEditableCell ? (
                            <input
                              type={header.key === 'experience' ? 'number' : 'text'}
                              value={inlineEditData[header.key] ?? ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineEditData((prev) => ({
                                  ...prev,
                                  [header.key]: e.target.value,
                                }))
                              }
                              className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            String(row[header.key] ?? '')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                onClick={() => onAction(delete_action || 'delete_candidate', { id: selectedRow.id })}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                Confirm Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
