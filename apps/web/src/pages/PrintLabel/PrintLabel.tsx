import { useState, useRef, useEffect } from 'react';
import {
    Search,
    Printer,
    Tag,
    X,
    User,
    FileText,
    Activity,
    AlertCircle,
    RotateCcw,
    CheckCircle2,
    Copy,
    ListFilter
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { api } from '../../lib/api';

interface TestItem {
    id: string;
    name: string;
    code?: string;
    category?: string;
    price?: number;
}

interface BillData {
    id: string;
    billNumber: string;
    createdAt: string;
    billingType: string;
    totalAmount?: number;
    paidAmount?: number;
    dueAmount?: number;
    paymentStatus?: string;
    referredBy?: string | null;
    tests: TestItem[];
}

interface PatientData {
    id: string;
    patientId: string;
    name: string;
    gender: string;
    age: number | string;
    phone: string;
    address?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    emergencyContactPhone?: string;
}

interface SearchCandidate {
    patientId: string;
    name: string;
    phone: string;
    gender: string;
    age: number | string;
    latestBillNumber: string;
    billId: string | null;
    internalPatientId: string;
}

export function PrintLabel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [patient, setPatient] = useState<PatientData | null>(null);
    const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
    const [allBills, setAllBills] = useState<BillData[]>([]);
    const [multipleMatches, setMultipleMatches] = useState<SearchCandidate[]>([]);
    const [copies, setCopies] = useState<number>(1);
    const [includeTestsOnSticker, setIncludeTestsOnSticker] = useState<boolean>(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const printAreaRef = useRef<HTMLDivElement>(null);

    // Auto-focus search input on page load
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const executeSearch = async (queryToSearch: string) => {
        const query = queryToSearch.trim();
        if (!query) {
            setErrorMessage('Please enter a Patient ID or Bill ID to search.');
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setMultipleMatches([]);

        try {
            const response = await api.get('/billing/label-search', {
                params: { query },
            });

            const data = response.data;

            if (data.found && data.exact) {
                setPatient(data.patient);
                setSelectedBill(data.bill);
                setAllBills(data.allBills || []);
            } else if (data.found && !data.exact && data.matches) {
                setMultipleMatches(data.matches);
                setPatient(null);
                setSelectedBill(null);
                setAllBills([]);
            } else {
                setErrorMessage(data.message || `No record found for "${query}".`);
                setPatient(null);
                setSelectedBill(null);
                setAllBills([]);
            }
        } catch (err: any) {
            console.error('Label search error:', err);
            const msg = err.response?.data?.message || 'Error occurred while searching. Please try again.';
            setErrorMessage(msg);
            setPatient(null);
            setSelectedBill(null);
            setAllBills([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(searchQuery);
    };

    const handleSelectCandidate = (candidate: SearchCandidate) => {
        setSearchQuery(candidate.patientId || candidate.latestBillNumber);
        executeSearch(candidate.patientId || candidate.latestBillNumber);
    };

    const handleBillChange = (billId: string) => {
        const found = allBills.find((b) => b.id === billId);
        if (found) {
            setSelectedBill(found);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setPatient(null);
        setSelectedBill(null);
        setAllBills([]);
        setMultipleMatches([]);
        setErrorMessage(null);
        searchInputRef.current?.focus();
    };

    const handlePrint = useReactToPrint({
        contentRef: printAreaRef,
        pageStyle: `
            @page {
                size: 75mm 50mm;
                margin: 0;
            }
            @media print {
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                body * {
                    visibility: hidden;
                }
                #label-print-container, #label-print-container * {
                    visibility: visible;
                }
                #label-print-container {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 75mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .label-sticker-page {
                    width: 75mm !important;
                    height: 50mm !important;
                    max-width: 75mm !important;
                    max-height: 50mm !important;
                    box-sizing: border-box !important;
                    padding: 4mm 5mm !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    font-family: Arial, Helvetica, sans-serif !important;
                    overflow: hidden !important;
                }
                .label-sticker-page:last-child {
                    page-break-after: avoid !important;
                    break-after: avoid !important;
                }
            }
        `,
    });

    const formatAge = (age: any) => {
        if (age === null || age === undefined || age === '') return 'N/A';
        const num = Number(age);
        return isNaN(num) ? String(age) : `${num} Y`;
    };

    const formatGender = (gender: string | undefined) => {
        if (!gender) return 'N/A';
        const g = gender.toUpperCase();
        if (g === 'MALE' || g === 'M') return 'Male';
        if (g === 'FEMALE' || g === 'F') return 'Female';
        return gender;
    };

    const copiesList = Array.from({ length: Math.max(1, copies) }, (_, i) => i);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Page Title & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2.5">
                        <Tag className="w-6 h-6 text-indigo-600" />
                        Print Label
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Search by Patient ID or Bill ID to preview and print 75mm × 50mm barcode/sticker labels.
                    </p>
                </div>

                {patient && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm w-fit"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        New Search
                    </button>
                )}
            </div>

            {/* Search Box Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
                    <label htmlFor="search-input" className="block text-sm font-semibold text-slate-700 mb-2">
                        Enter PTNID / BILL ID
                    </label>

                    <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Search className="w-5 h-5" />
                        </div>

                        <input
                            id="search-input"
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter PTNID / BILL ID"
                            autoComplete="off"
                            className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-base placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner font-mono"
                        />

                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-28 text-slate-400 hover:text-slate-600 p-1"
                                title="Clear input"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="absolute right-1.5 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition shadow-sm flex items-center gap-1.5"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    <span>Search</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 text-center">
                        Ekhane PTNID BILL ID likhe dile / Scan korle – nicher format a Patient er basic information show korbe
                    </p>
                </form>
            </div>

            {/* Error / Not Found Message */}
            {errorMessage && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-sm">Record Not Found</h4>
                        <p className="text-sm mt-0.5 text-amber-700">{errorMessage}</p>
                        <p className="text-xs text-amber-600 mt-1">
                            Tip: Make sure the ID is formatted correctly (e.g. <code className="font-mono bg-amber-100 px-1 rounded">DMDCPTN-0000001</code> or <code className="font-mono bg-amber-100 px-1 rounded">BILL-20261105-0001</code>), or enter just the numbers.
                        </p>
                    </div>
                </div>
            )}

            {/* Multiple Matches List */}
            {multipleMatches.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <ListFilter className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-slate-800">
                            Multiple Records Found ({multipleMatches.length})
                        </h3>
                    </div>
                    <p className="text-sm text-slate-600">
                        Please select the patient record you want to print the label for:
                    </p>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                        {multipleMatches.map((candidate, idx) => (
                            <div
                                key={idx}
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-semibold text-slate-800 text-base">
                                            {candidate.name}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            {candidate.patientId}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                        <span>Gender: {formatGender(candidate.gender)}</span>
                                        <span>Age: {formatAge(candidate.age)}</span>
                                        <span>Phone: {candidate.phone || 'N/A'}</span>
                                        <span>Latest Bill: <code className="font-mono">{candidate.latestBillNumber}</code></span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleSelectCandidate(candidate)}
                                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition shrink-0"
                                >
                                    Select & Preview
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Label Preview and Print Controls */}
            {patient && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left / Top: Visual Label Preview (Matches sketch) */}
                        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center">
                            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-semibold text-slate-800 text-base">
                                        Label Preview (75 mm × 50 mm)
                                    </h3>
                                </div>
                                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Print
                                </span>
                            </div>

                            {/* Outer Mockup container with 50mm / 75mm dimension annotations matching sketch */}
                            <div className="relative py-4 px-6 flex flex-col items-center">
                                {/* Left height annotation */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 -rotate-90 select-none text-[11px] font-semibold text-slate-400">
                                    <span>50 mm</span>
                                    <span>|</span>
                                    <span>2 inch</span>
                                </div>

                                {/* Actual Label Card - Styled to closely replicate physical thermal label sticker */}
                                <div
                                    id="screen-label-card"
                                    className="w-[340px] h-[226px] bg-slate-100/90 rounded-[22px] border-2 border-slate-300 p-5 shadow-sm flex flex-col justify-between text-slate-900 font-sans select-none relative overflow-hidden transition-all hover:border-indigo-400 hover:shadow-md"
                                >
                                    {/* Line 1: Name */}
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-base tracking-tight text-slate-900">Name:</span>
                                        <span className="font-bold text-base text-slate-900 uppercase truncate">
                                            {patient.name || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Line 2: Sex, Age, Phone */}
                                    <div className="flex items-baseline justify-between text-sm font-semibold text-slate-800">
                                        <div className="flex items-baseline gap-1">
                                            <span>Sex:</span>
                                            <span className="font-bold">{formatGender(patient.gender)}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span>Age:</span>
                                            <span className="font-bold">{formatAge(patient.age)}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span>Phone:</span>
                                            <span className="font-bold">{patient.phone || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Line 3: PTN ID */}
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-sm text-slate-900">PTN ID:</span>
                                        <span className="font-mono font-bold text-sm tracking-wide text-slate-900">
                                            {patient.patientId || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Line 4: BILL ID */}
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-sm text-slate-900">BILL ID:</span>
                                        <span className="font-mono font-bold text-sm tracking-wide text-slate-900">
                                            {selectedBill?.billNumber || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Optional compact tests footer if enabled */}
                                    {includeTestsOnSticker && selectedBill?.tests && selectedBill.tests.length > 0 && (
                                        <div className="pt-1 border-t border-slate-300 text-[10px] text-slate-700 truncate font-medium">
                                            <span className="font-bold">Tests: </span>
                                            {selectedBill.tests.map((t) => t.name).join(', ')}
                                        </div>
                                    )}
                                </div>

                                {/* Bottom width annotation */}
                                <div className="mt-3 flex items-center justify-center gap-3 select-none text-[11px] font-semibold text-slate-400">
                                    <span>3 inch</span>
                                    <span>|</span>
                                    <span>75 mm</span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 text-center mt-3 font-medium">
                                Ey info fill up hoye gele PRINT button a click korle print hobe
                            </p>

                            {/* Print Options & Primary Print Button */}
                            <div className="w-full mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <label htmlFor="copies-input" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                        <Copy className="w-4 h-4 text-slate-500" />
                                        Copies:
                                    </label>
                                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setCopies((c) => Math.max(1, c - 1))}
                                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="px-3 py-1 font-mono font-semibold text-sm min-w-8 text-center text-slate-800">
                                            {copies}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setCopies((c) => Math.min(10, c + 1))}
                                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => handlePrint()}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-base font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Printer className="w-5 h-5" />
                                        <span>Print Label ({copies})</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Patient & Billing Details Card */}
                        <div className="lg:col-span-5 space-y-5">
                            {/* Patient Info Card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                    <User className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-semibold text-slate-800">Patient Details</h3>
                                </div>

                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Patient Name</span>
                                        <span className="font-semibold text-slate-800 text-right">{patient.name}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Patient ID</span>
                                        <span className="font-mono font-semibold text-indigo-700 text-right">{patient.patientId}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Gender / Age</span>
                                        <span className="font-medium text-slate-800 text-right">
                                            {formatGender(patient.gender)} / {formatAge(patient.age)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Phone</span>
                                        <span className="font-medium text-slate-800 text-right">{patient.phone || 'N/A'}</span>
                                    </div>
                                    {patient.bloodGroup && (
                                        <div className="flex justify-between py-1 border-b border-slate-50">
                                            <span className="text-slate-500">Blood Group</span>
                                            <span className="font-semibold text-rose-600 text-right">{patient.bloodGroup}</span>
                                        </div>
                                    )}
                                    {patient.address && (
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-500">Address</span>
                                            <span className="font-medium text-slate-700 text-right max-w-[200px] truncate">{patient.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Billing & Tests Card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        <h3 className="font-semibold text-slate-800">Billing Information</h3>
                                    </div>

                                    {/* Multiple bills selector */}
                                    {allBills.length > 1 && (
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                                            {allBills.length} Bills Available
                                        </span>
                                    )}
                                </div>

                                {allBills.length > 1 && (
                                    <div>
                                        <label htmlFor="bill-select" className="block text-xs font-semibold text-slate-600 mb-1">
                                            Select Active Bill for Label:
                                        </label>
                                        <select
                                            id="bill-select"
                                            value={selectedBill?.id || ''}
                                            onChange={(e) => handleBillChange(e.target.value)}
                                            className="w-full py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {allBills.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.billNumber} ({b.billingType} - {new Date(b.createdAt).toLocaleDateString()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedBill ? (
                                    <div className="space-y-3">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b border-slate-50">
                                                <span className="text-slate-500">Bill Number</span>
                                                <span className="font-mono font-semibold text-slate-800 text-right">{selectedBill.billNumber}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-slate-50">
                                                <span className="text-slate-500">Bill Date</span>
                                                <span className="font-medium text-slate-700 text-right">
                                                    {new Date(selectedBill.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {selectedBill.referredBy && (
                                                <div className="flex justify-between py-1 border-b border-slate-50">
                                                    <span className="text-slate-500">Referred By</span>
                                                    <span className="font-medium text-slate-700 text-right max-w-[200px] truncate">{selectedBill.referredBy}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Test Items List */}
                                        {selectedBill.tests && selectedBill.tests.length > 0 && (
                                            <div className="pt-2 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                                        Included Tests ({selectedBill.tests.length})
                                                    </span>
                                                    <label className="text-xs text-indigo-600 font-medium cursor-pointer flex items-center gap-1.5 select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={includeTestsOnSticker}
                                                            onChange={(e) => setIncludeTestsOnSticker(e.target.checked)}
                                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        Include on label
                                                    </label>
                                                </div>

                                                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                                                    {selectedBill.tests.map((test, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-xs font-medium shadow-2xs"
                                                        >
                                                            <Activity className="w-3 h-3 text-indigo-500" />
                                                            {test.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        No billing record attached to this patient.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Printable Area (Visible strictly on @media print) */}
            <div className="hidden">
                <div id="label-print-container" ref={printAreaRef}>
                    {patient &&
                        copiesList.map((copyIdx) => (
                            <div
                                key={copyIdx}
                                className="label-sticker-page"
                                style={{
                                    width: '75mm',
                                    height: '50mm',
                                    boxSizing: 'border-box',
                                    padding: '4mm 5mm',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    fontFamily: 'Arial, sans-serif',
                                    color: '#000000',
                                    backgroundColor: '#ffffff',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Row 1: Name */}
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '12pt', color: '#000000' }}>Name:</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {patient.name}
                                    </span>
                                </div>

                                {/* Row 2: Sex, Age, Phone */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '9pt', fontWeight: 'bold', color: '#000000' }}>
                                    <div>
                                        <span>Sex: </span>
                                        <span>{formatGender(patient.gender)}</span>
                                    </div>
                                    <div>
                                        <span>Age: </span>
                                        <span>{formatAge(patient.age)}</span>
                                    </div>
                                    <div>
                                        <span>Phone: </span>
                                        <span>{patient.phone || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Row 3: PTN ID */}
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>PTN ID:</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '10pt', letterSpacing: '0.5px', color: '#000000' }}>
                                        {patient.patientId}
                                    </span>
                                </div>

                                {/* Row 4: BILL ID */}
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>BILL ID:</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '10pt', letterSpacing: '0.5px', color: '#000000' }}>
                                        {selectedBill?.billNumber || 'N/A'}
                                    </span>
                                </div>

                                {/* Optional Tests Line if enabled */}
                                {includeTestsOnSticker && selectedBill?.tests && selectedBill.tests.length > 0 && (
                                    <div
                                        style={{
                                            fontSize: '7pt',
                                            fontWeight: '600',
                                            color: '#111111',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            borderTop: '0.5px solid #666666',
                                            paddingTop: '1mm',
                                        }}
                                    >
                                        Tests: {selectedBill.tests.map((t) => t.name).join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default PrintLabel;

