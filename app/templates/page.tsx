'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components';

interface TierConfig {
  prizeName: string;
  prizeAmount: number;
  winnerCount: number;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  tiers: TierConfig[];
  createdAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [tiers, setTiers] = useState<TierConfig[]>([
    { prizeName: 'Grand Prize', prizeAmount: 100000, winnerCount: 1 },
  ]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/templates/${editingId}` : '/api/templates';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          tiers,
        }),
      });

      if (!res.ok) throw new Error('Failed to save template');

      setFormData({ name: '', description: '' });
      setTiers([{ prizeName: 'Grand Prize', prizeAmount: 100000, winnerCount: 1 }]);
      setShowForm(false);
      setEditingId(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: Template) => {
    setFormData({ name: template.name, description: template.description || '' });
    setTiers(template.tiers);
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete template');
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setDeleting(null);
    }
  };

  const handleAddTier = () => {
    setTiers([
      ...tiers,
      { prizeName: 'Prize', prizeAmount: 10000, winnerCount: 1 },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, key: keyof TierConfig, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [key]: key === 'prizeName' ? value : Number(value) };
    setTiers(updated);
  };

  const useTemplate = async (template: Template) => {
    // Store template tiers in session storage for the setup page
    sessionStorage.setItem('templateTiers', JSON.stringify(template.tiers));
    router.push('/create');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
        ← Back to Home
      </Link>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Raffle Templates</h1>
        <Button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setTiers([{ prizeName: 'Grand Prize', prizeAmount: 100000, winnerCount: 1 }]);
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '➕ New Template'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Template Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? 'Edit Template' : 'Create New Template'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Template Name *"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Package"
                required
              />
              <Input
                label="Description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            {/* Tiers */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Prize Tiers</h3>
                <Button
                  type="button"
                  onClick={handleAddTier}
                  variant="success"
                  size="sm"
                >
                  + Add Tier
                </Button>
              </div>

              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    value={tier.prizeName}
                    onChange={(e) => updateTier(index, 'prizeName', e.target.value)}
                    placeholder="Prize name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={tier.prizeAmount}
                    onChange={(e) => updateTier(index, 'prizeAmount', e.target.value)}
                    placeholder="Amount"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={tier.winnerCount}
                    onChange={(e) => updateTier(index, 'winnerCount', e.target.value)}
                    placeholder="Winners"
                    min="1"
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={() => handleRemoveTier(index)}
                    disabled={tiers.length === 1}
                    variant="danger"
                    size="sm"
                  >
                    Remove
                  </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving}
                loading={saving}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No templates yet</p>
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
            >
              Create Your First Template
            </Button>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-200"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              )}

              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 font-semibold mb-2">({template.tiers.length} tier{template.tiers.length !== 1 ? 's' : ''})</p>
                <div className="space-y-1">
                  {template.tiers.map((tier, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      <span className="font-medium">{tier.prizeName}:</span> ₱{Number(tier.prizeAmount).toFixed(2)} × {tier.winnerCount}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Created {new Date(template.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => useTemplate(template)}
                  variant="success"
                  size="sm"
                  width="full"
                >
                  Use Template
                </Button>
                <Button
                  onClick={() => handleEdit(template)}
                  variant="primary"
                  size="sm"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(template.id)}
                  disabled={deleting === template.id}
                  variant="danger"
                  size="sm"
                >
                  {deleting === template.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
