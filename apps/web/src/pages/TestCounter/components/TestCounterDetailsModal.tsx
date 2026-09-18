import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { api } from '../../../lib/api';
import LabResultForm from '../../LabTechnician/LabResultForm';
import { toast } from 'react-toastify';

interface TestCounterDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    billingId: string | null;
}

export const TestCounterDetailsModal: React.FC<TestCounterDetailsModalProps> = ({ isOpen, onClose, billingId }) => {
    const [loading, setLoading] = useState(false);
    const [billingData, setBillingData] = useState<any>(null);
    const [tests, setTests] = useState<any[]>([]);
    
    // For Result Form Modal
    const [selectedTest, setSelectedTest] = useState<{ sampleId: string, testId: number, testName: string, initialData: any } | null>(null);

    useEffect(() => {
        if (isOpen && billingId) {
            fetchDetails();
        } else {
            setBillingData(null);
            setTests([]);
        }
    }, [isOpen, billingId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/lab-result/billing/${billingId}`);
            setBillingData(res.data.billing);
            setTests(res.data.tests);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch details');
        } finally {
            setLoading(false);
        }
    };

    const handleEnterResult = (testStatus: any) => {
        setSelectedTest({
            sampleId: testStatus.sample.id,
            testId: testStatus.test.id,
            testName: testStatus.test.name,
            initialData: testStatus.result || {}
        });
    };

    const handleFormSuccess = () => {
        setSelectedTest(null);
        fetchDetails(); // refresh details
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl my-8 relative">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Invoice / Patient Details</h2>
                        {billingData && (
                            <p className="text-sm text-slate-500 mt-1">
                                {billingData.patient?.name} ({billingData.patient?.patientId}) • Invoice: {billingData.billNumber}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600">Test Name</th>
                                        <th className="p-4 font-semibold text-slate-600">Sample Barcode</th>
                                        <th className="p-4 font-semibold text-slate-600">Sample Status</th>
                                        <th className="p-4 font-semibold text-slate-600">Result Status</th>
                                        <th className="p-4 font-semibold text-slate-600 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">No tests found for this invoice.</td>
                                        </tr>
                                    ) : (
                                        tests.map((t, index) => {
                                            const sample = t.sample;
                                            const result = t.result;
                                            const isCollected = sample?.status === 'COLLECTED';

                                            return (
                                                <tr key={index} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-medium text-slate-800">{t.test.name}</td>
                                                    <td className="p-4 text-slate-600 font-mono text-sm">{sample?.barcode || '-'}</td>
                                                    <td className="p-4">
                                                        {!sample ? (
                                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">NOT INITIATED</span>
                                                        ) : (
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                                sample.status === 'COLLECTED' ? 'bg-blue-50 text-blue-700' :
                                                                sample.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                                                                'bg-red-50 text-red-700'
                                                            }`}>
                                                                {sample.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {!result ? (
                                                            <span className="text-slate-400 text-sm">-</span>
                                                        ) : (
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                                result.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                                                                result.status === 'VERIFIED' ? 'bg-green-50 text-green-700' :
                                                                'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {result.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            disabled={!isCollected}
                                                            onClick={() => handleEnterResult(t)}
                                                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                                isCollected
                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <FileText size={14} />
                                                            <span>{result?.status === 'COMPLETED' ? 'View/Edit Result' : 'Enter Result'}</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedTest && (
                <div className="fixed inset-0 z-[60]">
                    <LabResultForm
                        sampleId={selectedTest.sampleId}
                        testId={selectedTest.testId}
                        testName={selectedTest.testName}
                        initialData={selectedTest.initialData}
                        onClose={() => setSelectedTest(null)}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            )}
        </div>
    );
};
