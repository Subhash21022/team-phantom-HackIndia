import React, { useState, useEffect } from 'react';

interface DynamicFormProps {
  title: string;
  fields: { name: string; type: string; value?: any }[];
  submit_action: string;
  onAction: (event: string, payload: any) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ title, fields, submit_action, onAction }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (fields) {
      const initialData: any = {};
      fields.forEach(f => {
        if (f.value !== undefined) {
          initialData[f.name] = f.value;
        }
      });
      setFormData(initialData);
    }
  }, [fields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAction(submit_action, formData);
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white border border-[#e5e5e5] p-6 mb-4 shadow-sm">
      {title && <p className="text-[14px] font-semibold text-black mb-5">{title}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields?.map(field => {
          if (field.type === 'hidden') {
            return <input key={field.name} type="hidden" name={field.name} value={formData[field.name] || field.value || ''} />;
          }
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#737373] uppercase tracking-wider">
                {field.name}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className="bg-white border border-[#e5e5e5] rounded-md px-3 py-2 text-[13px] text-black focus:outline-none focus:border-[#404040] focus:ring-1 focus:ring-[#404040] transition-shadow shadow-sm"
                required
              />
            </div>
          );
        })}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-md bg-black text-white text-[13px] font-medium py-2 hover:bg-[#333] transition-colors"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};





