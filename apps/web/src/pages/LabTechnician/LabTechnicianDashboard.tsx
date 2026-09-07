import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import LabResultForm from './LabResultForm';
import { api } from '../../lib/api';

const LabTechnicianDashboard: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const [billingData, setBillingData] = useState<any>(null);
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // For Barcode Flow
    const [barcodeMode, setBarcodeMode] = useState(true);

    // For Result Form Modal
    const [selectedTest, setSelectedTest] = useState<{ sampleId: string, testId: number, testName: string, initialData: any } | null>(null);

    const onSearch = async (data: any) => {
        setLoading(true);
        setError('');
        try {
            if (barcodeMode) {
                if (!data.barcode) throw new Error('Enter barcode');
                const res = await api.get(`/lab-result/barcode/${data.barcode}`);
                // Automatically open form if collected
                const { sample, result } = res.data;
                if (sample.status !== 'COLLECTED') {
                    setError('Sample is not collected yet!');
                } else {
                    setSelectedTest({
                        sampleId: sample.id,
                        testId: sample.testId,
                        testName: sample.test.name,
                        initialData: result || {}
                    });
                }
            } else {
                if (!data.billingId) throw new Error('Enter billing ID');
                const res = await api.get(`/lab-result/billing/${data.billingId}`);
                setBillingData(res.data.billing);
                setTests(res.data.tests);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to search');
            setBillingData(null);
            setTests([]);
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
        // Refresh billing if in billing mode
        if (!barcodeMode && billingData) {
            onSearch({ billingId: billingData.id });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Lab Technician Workspace</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex gap-4 mb-4 border-b">
                    <button
                        className={`px-4 py-2 border-b-2 font-medium ${barcodeMode ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                        onClick={() => setBarcodeMode(true)}
                    >
                        Scan Barcode
                    </button>
                    <button
                        className={`px-4 py-2 border-b-2 font-medium ${!barcodeMode ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                        onClick={() => setBarcodeMode(false)}
                    >
                        Search by Billing ID
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSearch)} className="flex gap-4 items-end">
                    {barcodeMode ? (
                        <div className="flex-1 max-w-md">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sample Barcode</label>
                            <input
                                {...register('barcode')}
                                type="text"
                                placeholder="Scan or enter barcode..."
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div className="flex-1 max-w-md">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Billing / Invoice ID</label>
                            <input
                                {...register('billingId')}
                                type="text"
                                placeholder="e.g. BILL-..."
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium h-[42px]"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                        {error}
                    </div>
                )}
            </div>

            {/* Billing Mode Results */}
            {!barcodeMode && billingData && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-8">
                        <div>
                            <span className="text-sm text-slate-500 block">Billing ID</span>
                            <span className="font-semibold text-slate-800">{billingData.billNumber}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block">Patient Name</span>
                            <span className="font-semibold text-slate-800">{billingData.patient?.name}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block">Date</span>
                            <span className="font-semibold text-slate-800">{new Date(billingData.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block">Payment Status</span>
                            <span className={`font-semibold ${billingData.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                {billingData.paymentStatus}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b">
                                    <th className="p-4 font-medium text-slate-600">Test Name</th>
                                    <th className="p-4 font-medium text-slate-600">Sample ID</th>
                                    <th className="p-4 font-medium text-slate-600">Sample Status</th>
                                    <th className="p-4 font-medium text-slate-600">Result Status</th>
                                    <th className="p-4 font-medium text-slate-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map((t, index) => {
                                    const sample = t.sample;
                                    const result = t.result;
                                    const isCollected = sample?.status === 'COLLECTED';

                                    return (
                                        <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="p-4 font-medium text-slate-800">{t.test.name}</td>
                                            <td className="p-4 text-slate-600 font-mono text-sm">{sample?.barcode || '-'}</td>
                                            <td className="p-4">
                                                {!sample ? (
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">NOT INITIATED</span>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${sample.status === 'COLLECTED' ? 'bg-green-100 text-green-700' :
                                                            sample.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {sample.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {!result ? (
                                                    <span className="text-slate-400 text-sm">-</span>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${result.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                            result.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {result.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    disabled={!isCollected}
                                                    onClick={() => handleEnterResult(t)}
                                                    className={`px-3 py-1.5 rounded text-sm font-medium ${isCollected
                                                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {result?.status === 'COMPLETED' ? 'View/Edit Result' : 'Enter Result'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedTest && (
                <LabResultForm
                    sampleId={selectedTest.sampleId}
                    testId={selectedTest.testId}
                    testName={selectedTest.testName}
                    initialData={selectedTest.initialData}
                    onClose={() => setSelectedTest(null)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default LabTechnicianDashboard;
