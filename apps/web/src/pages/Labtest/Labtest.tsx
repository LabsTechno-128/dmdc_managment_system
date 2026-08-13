
import { useMemo, useState } from 'react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Edit3,
    FlaskConical,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
} from 'lucide-react';

import { useLabTests, useCreateLabTest, useUpdateLabTest, useDeleteLabTest, useLabTestSummary, type LabTest } from '../../hooks/useLabTest';

const PAGE_SIZE = 10;

function money(value: number) {
    return new Intl.NumberFormat('en-BD', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function LabTest() {

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [name, setName] = useState('');
    const [billRate, setBillRate] = useState('');
    const [editing, setEditing] = useState<LabTest | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { data: response, isLoading: loading, refetch: load } = useLabTests({
        page,
        limit: PAGE_SIZE,
        search,
    });
    const { data: summary } = useLabTestSummary();

    const tests = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = response?.meta?.totalPages || 1;

    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);

    const createLabTest = useCreateLabTest();
    const updateLabTest = useUpdateLabTest();
    const deleteLabTest = useDeleteLabTest();


    async function submit(e: any) {
        e.preventDefault();
        if (!name.trim() || !billRate) {
            setError('Test name and bill/rate are required.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            if (editing) {
                await updateLabTest.mutateAsync({
                    id: editing.id,
                    data: {
                        name: name.trim(),
                        billRate: Number(billRate),
                    },
                });
                setMessage('Lab test updated successfully.');
            } else {
                await createLabTest.mutateAsync({
                    name: name.trim(),
                    billRate: Number(billRate),
                });
                setMessage('Lab test saved successfully.');
            }
            resetForm();
            setPage(1);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Unable to save this test.');
        } finally {
            setSaving(false);
        }
    }

    function resetForm() {
        setName('');
        setBillRate('');
        setEditing(null);
    }

    function startEdit(test: LabTest) {
        setEditing(test);
        setName(test.name);
        setBillRate(String(test.billRate));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function remove(id: number) {
        if (!window.confirm('Delete this lab test?')) return;

        try {
            setError('');
            await deleteLabTest.mutateAsync(id);
            setMessage('Lab test deleted successfully.');
            if (tests.length === 1 && page > 1) setPage((p) => p - 1);
        } catch {
            setError('Unable to delete this test.');
        }
    }

    function runSearch(e: any) {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    const statusLabel = useMemo(() => (loading ? 'Loading…' : 'Ready'), [loading]);

    return (
        <div className="min-h-screen bg-[#f4f6fb] text-slate-800">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                            <FlaskConical size={21} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Lab Test Manager</h1>
                            <p className="text-xs text-slate-500">
                                Manage laboratory tests, bill rates and saved test configurations.
                            </p>
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                        <button className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95">
                            Lab Report
                        </button>
                        <button className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-slate-900/20 active:scale-95">
                            Investigation Bill
                        </button>
                        <button
                            onClick={() => void load()}
                            className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-600/20 transition-all hover:bg-violet-700 hover:shadow-violet-600/40 active:scale-95"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Saved Bill Tests"
                        value={String(summary?.total || 0)}
                        icon={<ClipboardList size={18} />}
                        accent="emerald"
                    />
                    <StatCard
                        title="Current View"
                        value={String(tests.length)}
                        icon={<Search size={18} />}
                        accent="blue"
                    />
                    <StatCard
                        title="Manager Status"
                        value={statusLabel}
                        icon={<CheckCircle2 size={18} />}
                        accent="orange"
                    />
                </section>

                {(message || error) && (
                    <div
                        className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${error
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                    >
                        <span>{error || message}</span>
                        <button
                            onClick={() => {
                                setMessage('');
                                setError('');
                            }}
                            aria-label="Close message"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <section className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    {editing ? 'Edit Saved Test' : 'New Test Save'}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {editing
                                        ? 'Update the selected test and bill/rate.'
                                        : 'Create a new investigation test and billing rate.'}
                                </p>
                            </div>
                            {editing && (
                                <button
                                    onClick={resetForm}
                                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                                >
                                    Cancel edit
                                </button>
                            )}
                        </div>

                        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_170px_auto]">
                            <Field label="Test Name">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="CBC / Urine R/E / S. Creatinine / SGPT"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                />
                            </Field>
                            <Field label="Bill / Rate">
                                <input
                                    value={billRate}
                                    onChange={(e) => setBillRate(e.target.value)}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="700"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                />
                            </Field>
                            <div className="flex items-end">
                                <button
                                    disabled={saving}
                                    className="cursor-pointer flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                                >
                                    <Plus size={15} />
                                    {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                        <div className="mb-4">
                            <h2 className="text-sm font-bold text-slate-900">Search Saved Test</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Search by test name across all saved investigations.
                            </p>
                        </div>

                        <form onSubmit={runSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search CBC / Urine / Creatinine / ECG..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                            <button className="cursor-pointer rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-95">
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput('');
                                    setSearch('');
                                    setPage(1);
                                }}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                            >
                                Clear
                            </button>
                        </form>
                    </div>
                </section>

                <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Saved Lab Bill Test List</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {search ? `Filtered by “${search}”` : 'All saved laboratory bill tests'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <span>{total} item(s)</span>
                            <button
                                onClick={() => void load()}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                                title="Refresh list"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full text-left text-xs">
                            <thead className="bg-blue-50 text-[11px] uppercase tracking-wide text-slate-600">
                                <tr>
                                    <th className="w-16 px-5 py-3 font-bold">SL</th>
                                    <th className="px-5 py-3 font-bold">Test Name</th>
                                    <th className="w-40 px-5 py-3 text-right font-bold">Bill / Rate</th>
                                    <th className="w-44 px-5 py-3 text-right font-bold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={4} className="px-5 py-4">
                                                <div className="h-4 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : tests?.length ? (
                                    tests?.map((test, index) => (
                                        <tr key={test.id} className="group cursor-pointer transition-colors hover:bg-blue-50/50">
                                            <td className="px-5 py-3 font-medium text-slate-400 group-hover:text-blue-500">
                                                {(page - 1) * PAGE_SIZE + index + 1}
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-slate-700">
                                                {test.name}
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold text-slate-700">
                                                {money(test.billRate)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(test)}
                                                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 transition-all hover:bg-violet-600 hover:text-white hover:shadow-sm hover:shadow-violet-600/20 active:scale-95"
                                                    >
                                                        <Edit3 size={14} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => void remove(test.id)}
                                                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-red-500 hover:text-white hover:shadow-sm hover:shadow-red-500/20 active:scale-95"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-14 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                <FlaskConical size={20} />
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-slate-700">No tests found</p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Try another search or add a new lab test.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Showing <span className="font-bold text-slate-700">{from}</span>–{' '}
                            <span className="font-bold text-slate-700">{to}</span> of{' '}
                            <span className="font-bold text-slate-700">{total}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = i + 1;
                                return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`cursor-pointer min-w-[36px] rounded-xl px-3 py-2 text-sm font-bold shadow-sm transition-all active:scale-95 ${p === page
                                                ? 'bg-blue-600 text-white shadow-blue-600/20'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
export default LabTest
function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            {children}
        </label>
    );
}

function StatCard({
    title,
    value,
    icon,
    accent,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    accent: 'emerald' | 'blue' | 'orange';
}) {
    const styles = {
        emerald: 'border-emerald-500 text-emerald-600 bg-emerald-50',
        blue: 'border-blue-500 text-blue-600 bg-blue-50',
        orange: 'border-orange-500 text-orange-600 bg-orange-50',
    }[accent];

    return (
        <div className={`rounded-2xl border-l-4 border border-slate-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${styles.split(' ')[0]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-slate-500">{title}</p>
                    <p className={`mt-2 text-2xl font-black ${styles.split(' ')[1]}`}>{value}</p>
                </div>
                <div className={`rounded-xl p-2 ${styles.split(' ')[2]} ${styles.split(' ')[1]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}




