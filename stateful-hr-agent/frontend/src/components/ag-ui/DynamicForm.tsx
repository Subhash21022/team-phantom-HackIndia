import React, { useState } from 'react';

interface DynamicFormProps {
  title: string;
  fields: { name: string; type: string }[];
  submit_action: string;
  onAction: (event: string, payload: any) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ title, fields, submit_action, onAction }) => {
  const [formData, setFormData] = useState<any>({});

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
    <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
      {title && <h2 className="text-xl font-bold mb-4 text-slate-800">{title}</h2>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields?.map(field => (
          <div key={field.name} className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-slate-600 capitalize">{field.name}</label>
            <input
              type={field.type}
              name={field.name}
              onChange={handleChange}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 transition shadow-sm"
        >
          Submit
        </button>
      </form>
    </div>
  );
};
