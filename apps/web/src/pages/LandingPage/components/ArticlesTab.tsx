import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Calendar, Clock, X } from 'lucide-react';
import type { ArticlesSection, ArticleItem } from '../../../services/landing.service';
import { ImageUpload } from '../../../components/ImageUpload';

interface ArticlesTabProps {
  articles: ArticlesSection;
  onChange: (updatedArticles: Partial<ArticlesSection>) => void;
}

export const ArticlesTab: React.FC<ArticlesTabProps> = ({ articles, onChange }) => {
  const items = articles.items || [];
  const [editingArticle, setEditingArticle] = useState<{ index: number; item: ArticleItem } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [newArticle, setNewArticle] = useState<ArticleItem>({
    id: `art-${Date.now()}`,
    title: '',
    tag: 'Preventive Health',
    readTime: '5 min read',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
    excerpt: '',
  });

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArticle !== null) {
      const updated = [...items];
      updated[editingArticle.index] = editingArticle.item;
      onChange({ items: updated });
      setEditingArticle(null);
    } else if (isAddingNew) {
      if (!newArticle.title) return;
      onChange({ items: [...items, { ...newArticle, id: `art-${Date.now()}` }] });
      setIsAddingNew(false);
      setNewArticle({
        id: `art-${Date.now()}`,
        title: '',
        tag: 'Preventive Health',
        readTime: '5 min read',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
        excerpt: '',
      });
    }
  };

  const handleRemoveArticle = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange({ items: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Health Articles & Insights</h3>
        <p className="text-sm text-slate-500 mt-1">
          Manage clinical articles, medical advice pieces, and patient education stories.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
          Section Header Copy
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Section Badge</label>
            <input
              type="text"
              value={articles.badge || ''}
              onChange={(e) => onChange({ badge: e.target.value })}
              placeholder="e.g. Health News & Tips"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Main Heading</label>
            <input
              type="text"
              value={articles.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Latest Health Articles & Wellness Insights"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Section Description</label>
          <textarea
            rows={2}
            value={articles.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Evidence-based insights written by our specialist physicians..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900">Articles ({items.length})</h4>
            <p className="text-xs text-slate-500">Displayed in the Health Articles section</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Plus size={15} />
            <span>Add Article</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {items.map((art, index) => (
            <div
              key={art.id || index}
              className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between"
            >
              <div>
                <div className="h-44 bg-slate-100 overflow-hidden relative">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-bold text-blue-700 shadow-sm">
                    {art.tag}
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{art.date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{art.readTime}</span>
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {art.title}
                  </h5>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingArticle({ index, item: { ...art } })}
                  className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition"
                  title="Edit Article"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveArticle(index)}
                  className="cursor-pointer p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Remove Article"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              No articles configured. Click "Add Article" above to create one.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Article Modal */}
      {(isAddingNew || editingArticle !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h4 className="text-lg font-bold text-slate-900">
                {isAddingNew ? 'Add Health Article' : `Edit: ${editingArticle?.item.title}`}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingArticle(null);
                }}
                className="cursor-pointer p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Article Title</label>
                <input
                  type="text"
                  value={editingArticle ? editingArticle.item.title : newArticle.title}
                  onChange={(e) =>
                    editingArticle
                      ? setEditingArticle({
                          ...editingArticle,
                          item: { ...editingArticle.item, title: e.target.value },
                        })
                      : setNewArticle({ ...newArticle, title: e.target.value })
                  }
                  placeholder="e.g. 10 Essential Health Screenings Everyone Needs After 40"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Category Tag</label>
                  <input
                    type="text"
                    value={editingArticle ? editingArticle.item.tag : newArticle.tag}
                    onChange={(e) =>
                      editingArticle
                        ? setEditingArticle({
                            ...editingArticle,
                            item: { ...editingArticle.item, tag: e.target.value },
                          })
                        : setNewArticle({ ...newArticle, tag: e.target.value })
                    }
                    placeholder="e.g. Cardiology"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Read Duration</label>
                  <input
                    type="text"
                    value={editingArticle ? editingArticle.item.readTime : newArticle.readTime}
                    onChange={(e) =>
                      editingArticle
                        ? setEditingArticle({
                            ...editingArticle,
                            item: { ...editingArticle.item, readTime: e.target.value },
                          })
                        : setNewArticle({ ...newArticle, readTime: e.target.value })
                    }
                    placeholder="e.g. 5 min read"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Publication Date</label>
                  <input
                    type="text"
                    value={editingArticle ? editingArticle.item.date : newArticle.date}
                    onChange={(e) =>
                      editingArticle
                        ? setEditingArticle({
                            ...editingArticle,
                            item: { ...editingArticle.item, date: e.target.value },
                          })
                        : setNewArticle({ ...newArticle, date: e.target.value })
                    }
                    placeholder="e.g. Oct 24, 2026"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Article Excerpt</label>
                <textarea
                  rows={3}
                  value={editingArticle ? editingArticle.item.excerpt : newArticle.excerpt}
                  onChange={(e) =>
                    editingArticle
                      ? setEditingArticle({
                          ...editingArticle,
                          item: { ...editingArticle.item, excerpt: e.target.value },
                        })
                      : setNewArticle({ ...newArticle, excerpt: e.target.value })
                  }
                  placeholder="Short introductory summary for visitors..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  required
                />
              </div>

              <ImageUpload
                value={editingArticle ? editingArticle.item.image : newArticle.image}
                onChange={(url) =>
                  editingArticle
                    ? setEditingArticle({
                        ...editingArticle,
                        item: { ...editingArticle.item, image: url },
                      })
                    : setNewArticle({ ...newArticle, image: url })
                }
                label="Article Header Image"
              />

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingArticle(null);
                  }}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
                >
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
