// import { useRef, useState } from "react";
// import { useReactToPrint } from "react-to-print";

// function Prescription() {
//     const printRef = useRef(null);

//     const handlePrint = useReactToPrint({
//         contentRef: printRef,
//     });
//     console.log("printRef", printRef.current);
//     return (
//         <>
//             <button onClick={handlePrint}>
//                 Print
//             </button>
//             <div id="prescription-print" ref={printRef} className="w-[210mm] min-h-[297mm] bg-white p-10 mx-auto text-black">
//                 {/* <button //                     onClick={() => window.print()}
//                     className="no-print bg-blue-600 text-white px-4 py-2 rounded"
//                 >
//                     Print Prescription
//                 </button> */}
//                 {/* Doctor */}
//                 <MedicalForm />





//                 {/* Advice */}


//             </div>
//         </>

//     );
// }

// export default Prescription;


// function MedicalForm() {
//     const [patient, setPatient] = useState({
//         name: "",
//         age: "",
//         sex: "",
//         weight: "",
//         bp: "",
//         phone: "",
//         date: "",
//     });

//     const handleChange = (field) => (e) =>
//         setPatient((p) => ({ ...p, [field]: e.target.value }));

//     return (
//         <div className="min-h-screen  flex items-center justify-center p-6">
//             <div className="w-full max-w-4xl bg-white shadow-xl border border-slate-300 overflow-hidden font-serif">
//                 {/* Header */}
//                 <div className="bg-green-600 text-white px-6 py-4 flex items-center gap-4">
//                     {/* Logo */}
//                     <div className="shrink-0 w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center border-2 border-white">
//                         <svg
//                             viewBox="0 0 24 24"
//                             className="w-7 h-7 text-red-600"
//                             fill="currentColor"
//                         >
//                             <path d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2zM12 12v9M9 15h6M8 18h8" stroke="currentColor" strokeWidth="1" fill="none" />
//                         </svg>
//                         <span className="text-[8px] font-bold tracking-wide text-green-700 leading-none mt-0.5">
//                             DMDC
//                         </span>
//                     </div>

//                     {/* Title block */}
//                     <div className="flex-1">
//                         <h1 className="text-2xl md:text-3xl font-bold leading-tight">
//                             Dr. Muazzem Medical Diagnostic Center
//                         </h1>
//                         <p className="text-sm md:text-[15px] mt-1">
//                             82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka.
//                         </p>
//                         <div className="flex flex-wrap items-baseline gap-x-6 text-sm md:text-[15px]">
//                             <span>Phone: 01234567890, 01234567899</span>
//                             <span>E-mail: dmdc.contact@gmail.com</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Body */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-400">
//                     {/* Patient Details */}
//                     <div className="p-6">
//                         <h2 className="text-xl font-semibold underline decoration-1 underline-offset-4 mb-4">
//                             Patient Details
//                         </h2>

//                         <div className="space-y-4 text-slate-800">
//                             <FormRow label="Name">
//                                 <input
//                                     type="text"
//                                     value={patient.name}
//                                     onChange={handleChange("name")}
//                                     className="flex-1 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
//                                 />
//                             </FormRow>

//                             <div className="flex flex-wrap gap-x-6 gap-y-4">
//                                 <FormRow label="Age" className="w-24">
//                                     <input
//                                         type="text"
//                                         value={patient.age}
//                                         onChange={handleChange("age")}
//                                         className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
//                                     />
//                                 </FormRow>
//                                 <FormRow label="Sex" className="w-28">
//                                     <input
//                                         type="text"
//                                         value={patient.sex}
//                                         onChange={handleChange("sex")}
//                                         className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
//                                     />
//                                 </FormRow>
//                                 <FormRow label="Weight" className="w-32">
//                                     <input
//                                         type="text"
//                                         value={patient.weight}
//                                         onChange={handleChange("weight")}
//                                         className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
//                                     />
//                                 </FormRow>
//                                 <FormRow label="B/P" className="w-24">
//                                     <input
//                                         type="text"
//                                         value={patient.bp}
//                                         onChange={handleChange("bp")}
//                                         className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
//                                     />
//                                 </FormRow>
//                             </div>

//                             <FormRow label="Phone">
//                                 <input
//                                     type="text"
//                                     value={patient.phone}
//                                     onChange={handleChange("phone")}
//                                     className="flex-1 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
//                                 />
//                             </FormRow>

//                             <FormRow label="Date">
//                                 <input
//                                     type="date"
//                                     value={patient.date}
//                                     onChange={handleChange("date")}
//                                     className="flex-1 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
//                                 />
//                             </FormRow>
//                         </div>

//                         {/* Barcode */}
//                         <div className="mt-6 flex justify-center">
//                             <Barcode value="5679-6214" />
//                         </div>
//                     </div>

//                     {/* Doctor Details */}
//                     <div className="p-6">
//                         <h2 className="text-xl font-semibold underline decoration-1 underline-offset-4 mb-4">
//                             Doctor Details
//                         </h2>

//                         <div className="flex gap-4">
//                             <span className="font-semibold text-slate-800 shrink-0">Name</span>
//                             <div className="text-slate-800">
//                                 <p>: Doctor A</p>
//                                 <p>MBBS, FCPS, MD</p>
//                                 <p>BCS Health</p>
//                             </div>
//                         </div>

//                         <p className="mt-10 text-slate-800 font-sans">
//                             Call for Serial :{" "}
//                             <span className="font-semibold">01234567890</span>
//                         </p>
//                     </div>
//                 </div>
//                 {/* Rx */}
//                 <div className="mt-8">

//                     <h2 className="text-3xl font-bold mb-4">
//                         ℞
//                     </h2>

//                     <div className="border border-gray-300 rounded h-[520px]">

//                     </div>

//                 </div>
//                 <div className="mt-6">

//                     <h3 className="font-bold">
//                         Advice
//                     </h3>

//                     <div className="border h-28"></div>

//                 </div>
//             </div>

//         </div>
//     );
// }

// function FormRow({ label, children, className = "" }) {
//     return (
//         <div className={`flex items-center gap-2 font-sans ${className}`}>
//             <span className="font-serif text-slate-900">{label} :</span>
//             {children}
//         </div>
//     );
// }

// function Barcode({ value }) {
//     // Deterministic pseudo-random bar widths seeded from the value string
//     const bars = [];
//     let seed = 0;
//     for (let i = 0; i < value.length; i++) seed += value.charCodeAt(i);

//     let s = seed;
//     const rand = () => {
//         s = (s * 9301 + 49297) % 233280;
//         return s / 233280;
//     };

//     for (let i = 0; i < 45; i++) {
//         bars.push(rand() > 0.5 ? 3 : 1.5);
//     }

//     const totalWidth = bars.reduce((a, b) => a + b, 0) + bars.length * 1.5;

//     return (
//         <div className="flex flex-col items-center">
//             <svg width={220} height={64} viewBox={`0 0 ${totalWidth} 40`}>
//                 {(() => {
//                     let x = 0;
//                     return bars.map((w, i) => {
//                         const rect = (
//                             <rect key={i} x={x} y={0} width={w} height={40} fill="black" />
//                         );
//                         x += w + 1.5;
//                         return rect;
//                     });
//                 })()}
//             </svg>
//             <span className="font-mono text-sm tracking-widest mt-1">{value}</span>
//         </div>
//     );
// }


import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

function Prescription() {
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

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
                <MedicalForm />
            </div>
        </>
    );
}

export default Prescription;

function MedicalForm() {
    const [patient, setPatient] = useState({
        name: "",
        age: "",
        sex: "",
        weight: "",
        bp: "",
        phone: "",
        date: new Date().toISOString().slice(0, 10),
    });

    const [medicines, setMedicines] = useState([
        { name: "", dose: "", duration: "", instructions: "" },
    ]);

    const [advice, setAdvice] = useState("");
    const [followUp, setFollowUp] = useState("");

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setPatient((p) => ({ ...p, [field]: e.target.value }));

    const updateMedicine = (index: number, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMedicines((prev) =>
            prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
        );
    };

    const addMedicine = () =>
        setMedicines((prev) => [
            ...prev,
            { name: "", dose: "", duration: "", instructions: "" },
        ]);

    const removeMedicine = (index: number) =>
        setMedicines((prev) => prev.filter((_, i) => i !== index));

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
                                value={patient.name}
                                onChange={handleChange("name")}
                                className="flex-1 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                            />
                        </FormRow>

                        <div className="flex gap-x-6 gap-y-2">
                            <FormRow label="Age" className="w-24">
                                <input
                                    type="text"
                                    value={patient.age}
                                    onChange={handleChange("age")}
                                    className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                                />
                            </FormRow>
                            <FormRow label="Sex" className="w-28">
                                <input
                                    type="text"
                                    value={patient.sex}
                                    onChange={handleChange("sex")}
                                    className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                                />
                            </FormRow>
                            <FormRow label="Weight" className="w-32">
                                <input
                                    type="text"
                                    value={patient.weight}
                                    onChange={handleChange("weight")}
                                    className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                                />
                            </FormRow>
                            <FormRow label="B/P" className="w-24">
                                <input
                                    type="text"
                                    value={patient.bp}
                                    onChange={handleChange("bp")}
                                    className="w-16 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                                />
                            </FormRow>
                        </div>

                        <FormRow label="Phone">
                            <input
                                type="text"
                                value={patient.phone}
                                onChange={handleChange("phone")}
                                className="flex-1 bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 font-sans text-base"
                            />
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

                    <div className="mt-6 flex justify-center">
                        <Barcode value="5679-6214" />
                    </div>
                </div>

                <div className="p-6">
                    <h2 className="text-xl font-semibold underline decoration-1 underline-offset-4 mb-4">
                        Doctor Details
                    </h2>

                    <div className="flex gap-4">
                        <span className="font-semibold text-slate-800 shrink-0">Name</span>
                        <div className="text-slate-800">
                            <p>: Doctor A</p>
                            <p>MBBS, FCPS, MD</p>
                            <p>BCS Health</p>
                        </div>
                    </div>

                    <p className="mt-10 text-slate-800 font-sans">
                        Call for Serial :{" "}
                        <span className="font-semibold">01234567890</span>
                    </p>
                </div>
            </div>

            {/* Rx body */}
            <div className="flex-1 grid grid-cols-[56px_1fr] gap-4 px-6 py-6">
                {/* Rx symbol column */}
                <div className="text-5xl font-bold text-slate-800 select-none">℞</div>

                {/* Medicines */}
                <div className="font-sans text-slate-800">
                    <div className="grid grid-cols-[1fr_140px_120px_1fr_32px] gap-3 text-xs uppercase tracking-wide text-slate-500 font-medium border-b border-slate-300 pb-2 mb-2 print:hidden">
                        <span>Medicine</span>
                        <span>Dose</span>
                        <span>Duration</span>
                        <span>Instructions</span>
                        <span />
                    </div>

                    <div className="space-y-3">
                        {medicines.map((m, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-[1fr_140px_120px_1fr_32px] gap-3 items-start"
                            >
                                <div className="flex gap-2">
                                    <span className="text-slate-500 font-serif shrink-0">
                                        {i + 1}.
                                    </span>
                                    <input
                                        value={m.name}
                                        onChange={updateMedicine(i, "name")}
                                        placeholder="Medicine name"
                                        className="flex-1 bg-transparent border-b border-slate-300 focus:border-green-600 outline-none py-1 text-sm"
                                    />
                                </div>
                                <input
                                    value={m.dose}
                                    onChange={updateMedicine(i, "dose")}
                                    placeholder="1+0+1"
                                    className="bg-transparent border-b border-slate-300 focus:border-green-600 outline-none py-1 text-sm"
                                />
                                <input
                                    value={m.duration}
                                    onChange={updateMedicine(i, "duration")}
                                    placeholder="7 days"
                                    className="bg-transparent border-b border-slate-300 focus:border-green-600 outline-none py-1 text-sm"
                                />
                                <input
                                    value={m.instructions}
                                    onChange={updateMedicine(i, "instructions")}
                                    placeholder="After meal"
                                    className="bg-transparent border-b border-slate-300 focus:border-green-600 outline-none py-1 text-sm"
                                />
                                <button onClick={() => removeMedicine(i)}
                                    className="text-slate-400 hover:text-red-600 print:hidden text-sm"
                                    aria-label="Remove medicine"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addMedicine}
                        className="cursor-pointer mt-4 text-sm text-green-700 hover:text-green-800 font-medium print:hidden"
                    >
                        + Add medicine
                    </button>
                </div>
            </div>

            {/* Advice */}
            <div className="px-6 pb-6 font-sans">
                <h3 className="font-serif font-semibold text-lg text-slate-900 border-b border-slate-300 pb-1 mb-2">
                    Advice
                </h3>
                <textarea
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    placeholder="General advice, diet, follow-up instructions..."
                    className="w-full min-h-[90px] resize-none bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                />
            </div>

            {/* Footer */}
            <div className="mt-auto px-6 pt-4 border-t border-slate-300 font-sans">
                <div className="flex items-end justify-between">
                    <div className="text-sm text-slate-700">
                        <span className="font-medium">Next visit :</span>{" "}
                        <input
                            type="date"
                            value={followUp}
                            onChange={(e) => setFollowUp(e.target.value)}
                            className="bg-transparent border-b border-slate-400 focus:border-green-600 outline-none px-1 py-0.5 text-sm"
                        />
                    </div>

                    <div className="text-center">
                        <div className="w-48 border-b border-slate-500 h-10" />
                        <p className="text-sm text-slate-700 mt-1">Signature</p>
                    </div>
                </div>

                <p className="text-center text-[11px] text-slate-400 mt-6 pt-2 border-t border-slate-200">
                    This is a computer-generated prescription from Dr. Muazzem Medical Diagnostic Center.
                </p>
            </div>
        </div>
    );
}

function FormRow({ label, children, className = "" }: { label: string, children?: React.ReactNode, className?: string }) {
    return (
        <div className={`flex items-center gap-2 font-sans ${className}`}>
            <span className="font-serif text-slate-900">{label} :</span>
            {children}
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
        <div className="flex flex-col items-center">
            <svg width={220} height={64} viewBox={`0 0 ${totalWidth} 40`}>
                {(() => {
                    let x = 0;
                    return bars.map((w, i) => {
                        const rect = (
                            <rect key={i} x={x} y={0} width={w} height={40} fill="black" />
                        );
                        x += w + 1.5;
                        return rect;
                    });
                })()}
            </svg>
            <span className="font-mono text-sm tracking-widest mt-1">{value}</span>
        </div>
    );
}