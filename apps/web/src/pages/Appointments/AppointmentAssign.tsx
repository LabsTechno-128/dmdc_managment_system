
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useAppointment } from "../../hooks/useAppointments";
import type { Appointment } from "../../types/appointment";

function AppointmentAssign() {
    const { id } = useParams<{ id: string }>();

    const { data: appointment, isLoading } = useAppointment(id ?? '');
    console.log(appointment, "------")
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
            <div className="max-w-4xl mx-auto py-4 flex justify-end print:hidden">
                <button
                    onClick={handlePrint}
                    className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-sans font-medium"
                >
                    Print Prescription
                </button>
            </div>

            <div
                id="prescription-print"
                ref={printRef}
                className="w-[210mm] min-h-[297mm] bg-white p-10 mx-auto text-black flex flex-col"
            >
                <MedicalForm data={appointment} />
            </div>
        </>
    );
}

export default AppointmentAssign;

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
        <div className="w-full bg-white font-serif flex flex-col flex-1">
            {/* Header */}
            <div className="bg-green-600 text-white px-6 py-4 flex items-center gap-4">
                {/* Logo */}
                <div className="shrink-0 w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center border-2 border-white">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-red-600" fill="currentColor">
                        <path
                            d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2zM12 12v9M9 15h6M8 18h8"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                        />
                    </svg>
                    <span className="text-[8px] font-bold tracking-wide text-green-700 leading-none mt-0.5">
                        DMDC
                    </span>
                </div>

                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                        Dr. Muazzem Medical Diagnostic Center
                    </h1>
                    <p className="text-sm md:text-[15px] mt-1">
                        82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka.
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-6 text-sm md:text-[15px]">
                        <span>Phone: 01234567890, 01234567899</span>
                        <span>E-mail: dmdc.contact@gmail.com</span>
                    </div>
                </div>
            </div>

            {/* Patient / Doctor */}
            <div className="grid grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-400 border-b border-slate-400">
                <div className="p-6">
                    <h2 className="text-xl font-semibold underline decoration-1 underline-offset-4 mb-4">
                        Patient Details
                    </h2>

                    <div className="space-y-1 text-slate-800">
                        <FormRow label="Name">
                            <input
                                type="text"
                                value={data?.patient?.name}
                                defaultValue={data?.patient?.name}
                                className="flex-1 bg-transparent   border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                            />
                        </FormRow>


                        <div className="flex gap-x-1 gap-y-2">
                            <FormRow label="Age" >
                                {data?.patient?.age}
                            </FormRow>
                            <FormRow label="Sex"  >

                                {data?.patient?.gender ?? "none"}

                            </FormRow>
                            <FormRow label="Weight"  >
                                {
                                    data?.patient?.weight ?? "none"
                                }

                            </FormRow>
                            <FormRow label="B/P" >

                                {
                                    data?.patient?.bloodPresure ?? "none"
                                }
                            </FormRow>
                        </div>

                        <FormRow label="Phone">

                            {
                                data?.patient?.phone ?? "none"
                            }
                        </FormRow>

                        <FormRow label="Date">
                            <input
                                type="date"
                                value={patient.date}
                                onChange={handleChange("date")}
                                className="flex-1 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                            />
                        </FormRow>
                    </div>


                </div>

                <div className="p-6">
                    <h2 className="text-xl font-semibold underline decoration-1 underline-offset-4 mb-4">
                        Doctor Details
                    </h2>

                    <div className="flex gap-4">
                        <span className="font-semibold text-slate-800 shrink-0">Name</span>
                        <div className="text-slate-800">
                            <p>:  {
                                (data?.doctor?.firstName || "") + " " + (data?.doctor?.lastName || "")
                            }</p>
                            <p>
                                {
                                    data?.doctor?.specialization ?? "none"
                                }
                            </p>
                            <p>BCS Health</p>
                        </div>
                    </div>

                    <p className="mt-10 text-slate-800 font-sans">
                        Call for Serial :{" "}
                        <span className="font-semibold">01234567890</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

function FormRow({ label, children }: { label: string, children?: React.ReactNode }) {
    return (
        <span className="  text-slate-900 flex flex-wrap flex-1 text-sm items-center">{label} : {children}</span>
    );
}

