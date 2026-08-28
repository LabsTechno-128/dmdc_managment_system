
import { useRef, useState } from "react";
// import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import type { Appointment } from "../types/appointment";
// import { useAppointment } from "../../hooks/useAppointments";
// import type { Appointment } from "../../types/appointment";

export function AppointmentOdpForm({
    appointment,
    isLoading
}:
    {
        appointment: Appointment;
        isLoading: boolean;
    }) {
    // const { id } = useParams<{ id: string }>();

    // const { data: appointment, isLoading } = useAppointment(id ?? '');
    // console.log(appointment, "------")
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });
    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
                <div className="p-8 text-center text-slate-500">Loading appointment details...</div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
                <div className="p-8 text-center text-slate-500">Appointment not found.</div>
            </div>
        );
    }


    return (
        <>


            <div
                id="prescription-print"
                ref={printRef}
                className="w-[210mm] min-h-[290mm] bg-white  mx-auto text-black flex flex-col"
            >
                <MedicalForm data={appointment} />
            </div>
            <button onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrint();
            }}
                className="w-[210mm] bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-sans font-medium  text-lg"
            >
                Print OPD
            </button>

        </>
    );
}


function MedicalForm({ data }: { data: Appointment }) {
    const [patient, setPatient] = useState({
        name: "",
        age: "",
        sex: "",
        weight: "",
        bp: "",
        phone: "",
        date: new Date().toISOString().slice(0, 10),
    });



    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setPatient((p) => ({ ...p, [field]: e.target.value }));


    return (
        <div className="w-full font-serif flex flex-col p-6 flex-1">
            {/* Header */}
            <div className="bg-green-600 text-white px-5 py-3 flex items-center gap-3">
                {/* Logo */}
                <div className="shrink-0 w-12 h-12 rounded-full bg-white flex flex-col items-center justify-center border-2 border-white shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600" fill="currentColor">
                        <path
                            d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2zM12 12v9M9 15h6M8 18h8"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                        />
                    </svg>
                    <span className="text-[7px] font-bold tracking-wider text-green-700 leading-none mt-0.5">
                        DMDC
                    </span>
                </div>

                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold leading-tight">
                        Dr. Muazzem Medical Diagnostic Center
                    </h1>
                    <p className="text-xs md:text-sm mt-0.5 opacity-95">
                        82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka.
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-4 text-xs md:text-[13px] mt-0.5 opacity-95">
                        <span>Phone: 01234567890, 01234567899</span>
                        <span>E-mail: dmdc.contact@gmail.com</span>
                    </div>
                </div>
            </div>

            {/* Patient / Doctor */}
            <div className="grid grid-cols-2 divide-x divide-slate-400 border-b border-slate-400 text-sm">
                <div className="px-5 py-3 flex flex-col">
                    <h2 className="text-[15px] font-bold underline decoration-1 underline-offset-2 mb-3">
                        Patient Details
                    </h2>

                    <div className="flex flex-col gap-y-2 text-slate-800">
                        {/* Name Row */}
                        <div className="flex items-center gap-2">
                            <span className="font-bold w-12 shrink-0">Name:</span>
                            <input
                                type="text"
                                value={data?.patient?.name}
                                defaultValue={data?.patient?.name}
                                className="bg-transparent border-b border-slate-300 focus:border-green-600 outline-none px-1 py-0 font-sans w-full text-sm"
                            />
                        </div>

                        {/* Info Row (Age, Sex, Wt, B/P) */}
                        <div className="flex items-center gap-x-4 gap-y-1 text-sm">
                            <span><span className="text-slate-500 text-xs font-bold">Age:</span> {data?.patient?.age || "-"}</span>
                            <span><span className="text-slate-500 text-xs font-bold">Sex:</span> {data?.patient?.gender || "-"}</span>
                            <span><span className="text-slate-500 text-xs font-bold">Wt:</span> {data?.patient?.weight || "-"}</span>
                            <span><span className="text-slate-500 text-xs font-bold">B/P:</span> {data?.patient?.bloodPresure || "-"}</span>
                        </div>

                        {/* Phone & Date Row */}
                        <div className="flex items-center gap-2 w-full">
                            <span className="font-semibold w-12 shrink-0">Phone:</span>
                            <span className="px-1">{data?.patient?.phone || "-"}</span>

                            <div className="flex items-center gap-2 ml-auto">
                                <span className="font-semibold">Date:</span>
                                <input
                                    type="date"
                                    value={data?.appointmentDate ? new Date(data.appointmentDate).toISOString().slice(0, 10) : patient.date}
                                    readOnly
                                    onChange={handleChange("date")}
                                    className="bg-transparent border-b border-slate-300 focus:border-green-600 outline-none px-1 py-0 font-sans w-[120px] text-sm"
                                />
                            </div>
                        </div>

                        {/* Barcode */}
                        {data?.patient?.patientId && (
                            <div className="pt-2 pb-1">
                                <Barcode value={data?.patient?.patientId} />
                            </div>
                        )}
                    </div>


                </div>

                <div className="px-5 py-3 flex flex-col">
                    <h2 className="text-[15px] font-bold underline decoration-1 underline-offset-2 mb-1">
                        Doctor Details
                    </h2>

                    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-slate-800 items-start">
                        <span className="font-semibold mt-0.5">Name:</span>
                        <div className="leading-tight px-1">
                            <div className="font-bold text-[14px]">
                                {(data?.doctor?.firstName || "") + " " + (data?.doctor?.lastName || "")}
                            </div>
                            <div className="text-[12px] text-slate-600 mt-0.5">
                                {data?.doctor?.specialization || "none"}
                            </div>
                            <div className="text-[12px] text-slate-600 mt-0.5">
                                BCS Health
                            </div>
                        </div>

                    </div>

                    <div className="mt-auto pt-1 text-slate-800 text-[13px]">
                        Call for Serial: <span className="font-bold text-sm ml-1">01234567890</span>
                    </div>
                </div>
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
        bars.push(rand() > 0.5 ? 3 : 1.5);
    }

    const totalWidth = bars.reduce((a, b) => a + b, 0) + bars.length * 1.5;

    return (
        <div className="flex flex-col items-start bg-slate-50/50 w-fit">
            <svg width={140} height={36} viewBox={`0 0 ${totalWidth} 40`}>
                {(() => {
                    let x = 0;
                    return bars.map((w, i) => {
                        const rect = (
                            <rect key={i} x={x} y={0} width={w} height={40} fill="#1e293b" />
                        );
                        x += w + 1.5;
                        return rect;
                    });
                })()}
            </svg>
            <span className="font-mono text-[8px] font-medium tracking-widest   text-slate-700 text-center w-full">{value}</span>
        </div>
    );
}