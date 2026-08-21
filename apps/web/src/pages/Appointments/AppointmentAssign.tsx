import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useAppointment } from "../../hooks/useAppointments";
import type { Appointment } from "../../types/appointment";
import { Printer, HeartPulse } from "lucide-react";

function AppointmentAssign() {
    const { id } = useParams<{ id: string }>();
    const { data: appointment, isLoading } = useAppointment(id ?? '');
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-slate-500 font-medium animate-pulse">
                Loading appointment details...
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center text-slate-500 font-medium">
                Appointment record not found.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 print:p-0 print:bg-white">
            <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">OPD Visit Ticket</h2>
                    <p className="text-xs text-slate-500">Edit patient info below and print the compact slip</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center space-x-2"
                >
                    <Printer size={18} />
                    <span>Print OPD Slip</span>
                </button>
            </div>

            <div
                id="prescription-print"
                ref={printRef}
                className="w-[210mm] min-h-[140mm] max-h-[145mm] bg-white p-6 mx-auto text-black flex flex-col shadow-lg print:shadow-none border border-slate-200 print:border-none rounded-3xl print:rounded-none overflow-hidden"
            >
                <MedicalForm data={appointment} />
            </div>
        </div>
    );
}

export default AppointmentAssign;

function MedicalForm({ data }: { data: Appointment }) {
    const [patient, setPatient] = useState({
        name: "",
        age: "",
        gender: "",
        weight: "",
        bp: "",
        phone: "",
        date: new Date().toISOString().slice(0, 10),
    });

    useEffect(() => {
        if (data) {
            setPatient({
                name: data.patient?.name || `${data.patient?.firstName || ''} ${data.patient?.lastName || ''}`.trim(),
                age: data.patient?.age?.toString() || "",
                gender: data.patient?.gender || "",
                weight: data.patient?.weight?.toString() || "",
                bp: data.patient?.bloodPresure || "",
                phone: data.patient?.phone || "",
                date: new Date(data.appointmentDate || Date.now()).toISOString().slice(0, 10),
            });
        }
    }, [data]);

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setPatient((p) => ({ ...p, [field]: e.target.value }));

    return (
        <div className="w-full bg-white font-sans flex flex-col flex-1 text-slate-800 justify-between">
            {/* Header section (Very Compact) */}
            <div className="flex justify-between items-center border-b border-slate-300 ">
                <div className="flex items-center  ">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center border border-emerald-100 shadow-sm">
                        <HeartPulse size={20} className="text-red-500" />
                        <span className="text-[7px] font-black tracking-widest text-emerald-800 leading-none mt-0.5">
                            DMDC
                        </span>
                    </div>
                    <div>
                        <h1 className="text-sm font-black font-serif text-emerald-800 tracking-tight leading-none">
                            Dr. Muazzem Medical Diagnostic Center
                        </h1>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            82/83, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka. Phone: 01234567890, 01234567899
                        </p>
                    </div>
                </div>

                <div className="text-right text-[10px] bg-slate-50 print:bg-transparent px-3 py-1.5 rounded-lg border border-slate-100 print:border-none print:p-0">
                    <span className="font-extrabold text-emerald-800 block text-xs leading-none">OPD VISIT SLIP</span>
                    <span className="text-[8px] text-slate-400 font-mono mt-0.5 block uppercase">ID: {data.id.substring(0, 8).toUpperCase()}</span>
                </div>
            </div>

            {/* Split Content (Patient Left, Doctor Right) */}
            <div className="grid grid-cols-2 divide-x divide-slate-200 flex-1">

                {/* Left Side: Patient Details */}
                <div className="pr-5 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Patient Details
                        </h2>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-slate-500 w-12 shrink-0">Name:</span>
                                <input
                                    type="text"
                                    value={patient.name}
                                    onChange={handleChange("name")}
                                    className="flex-1 bg-transparent font-bold text-slate-800 border-b border-transparent focus:border-slate-300 outline-none pb-0.5 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 print:bg-transparent print:border-none print:p-0">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-semibold text-slate-400">Age:</span>
                                    <input
                                        type="text"
                                        value={patient.age}
                                        onChange={handleChange("age")}
                                        className="w-10 bg-transparent font-bold text-slate-700 outline-none"
                                    />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-semibold text-slate-400">Sex:</span>
                                    <input
                                        type="text"
                                        value={patient.gender}
                                        onChange={handleChange("gender")}
                                        className="w-12 bg-transparent font-bold text-slate-700 outline-none"
                                    />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-semibold text-slate-400">Weight:</span>
                                    <input
                                        type="text"
                                        value={patient.weight}
                                        onChange={handleChange("weight")}
                                        className="w-10 bg-transparent font-bold text-slate-700 outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400">kg</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-semibold text-slate-400">B/P:</span>
                                    <input
                                        type="text"
                                        value={patient.bp}
                                        onChange={handleChange("bp")}
                                        className="w-16 bg-transparent font-bold text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-slate-500 w-12 shrink-0">Phone:</span>
                                <input
                                    type="text"
                                    value={patient.phone}
                                    onChange={handleChange("phone")}
                                    className="flex-1 bg-transparent font-semibold text-slate-700 outline-none"
                                />
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-slate-500 w-12 shrink-0">Date:</span>
                                <input
                                    type="date"
                                    value={patient.date}
                                    onChange={handleChange("date")}
                                    className="w-32 bg-transparent font-semibold text-slate-700 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <span className="font-bold text-slate-500 w-12 shrink-0">Type:</span>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-bold text-[10px] uppercase">
                                    {data.bookingType === 'FUTURE' ? 'Future Appointment' : 'Live / Walk-in'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SVG Barcode */}
                    <div className="mt-4 pt-2 border-t border-slate-100">
                        {data.patient?.patientId && <Barcode value={data.patient.patientId} />}
                    </div>
                </div>

                {/* Right Side: Doctor Details */}
                <div className="pl-5 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Doctor Details
                        </h2>

                        <div className="space-y-1.5 text-xs text-slate-700">
                            <p className="text-slate-400 font-medium">Assigned Consultant:</p>
                            <p className="font-black text-slate-900 text-sm">
                                Dr. {(data.doctor?.firstName || "") + " " + (data.doctor?.lastName || "")}
                            </p>
                            <p className="text-emerald-700 font-extrabold capitalize text-[11px]">
                                {data.doctor?.specialization ?? "General Practitioner"}
                            </p>
                            <p className="text-slate-400 text-[10px]">{data.doctor?.degree ?? "MBBS, BCS Health"}</p>
                        </div>
                    </div>

                    {/* Call for Serial (Gorgeous highlight card) */}
                    <div className="bg-emerald-50/35 border border-emerald-100 rounded-2xl p-3 text-center my-3">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">Call for Serial</span>
                        <span className="text-sm font-black text-slate-800 tracking-wider">01234567890</span>
                    </div>

                    {/* Slip Signature Footer */}
                    <div className="pt-4 flex justify-between items-end border-t border-slate-100 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span>DMDC OPD System</span>
                        <div className="text-center w-28">
                            <div className="border-b border-slate-200 w-full h-5 mb-0.5"></div>
                            <span>Signature</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Micro footer bar */}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[9px] text-slate-400 font-medium">
                <span>Please present this slip at the reception desk.</span>
                <span>Thank you.</span>
            </div>
        </div>
    );
}

function Barcode({ value }: { value: string }) {
    const bars = [];
    let seed = 0;
    for (let i = 0; i < value.length; i++) seed += value.charCodeAt(i);

    let s = seed;
    const rand = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };

    for (let i = 0; i < 45; i++) {
        bars.push(rand() > 0.5 ? 2.5 : 1.2);
    }

    const totalWidth = bars.reduce((a, b) => a + b, 0) + bars.length * 1.2;

    return (
        <div className="flex flex-col items-center select-none">
            <svg width={180} height={32} viewBox={`0 0 ${totalWidth} 28`} className="print:h-6">
                {(() => {
                    let x = 0;
                    return bars.map((w, i) => {
                        const rect = (
                            <rect key={i} x={x} y={0} width={w} height={28} fill="black" />
                        );
                        x += w + 1.2;
                        return rect;
                    });
                })()}
            </svg>
            <span className="font-mono text-[9px] tracking-widest text-slate-500 mt-0.5">{value}</span>
        </div>
    );
}
