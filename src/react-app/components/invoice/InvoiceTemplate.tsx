import { CompanyDetails, InvoiceData } from './InvoiceTemplate';

// Re-export type definitions so they can be imported from here
export type { CompanyDetails, InvoiceData };

interface InvoiceTemplateProps {
    company: CompanyDetails;
    data: InvoiceData;
}

export default function InvoiceTemplate({ company, data }: InvoiceTemplateProps) {
    return (
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-4 text-black font-sans text-sm relative print:w-full print:h-full print:m-0 print:p-2 box-border leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>

            {/* Header: Logo and Company Name */}
            <div className="flex justify-between items-center mb-1 border-b-2 border-green-600 pb-2">
                <div className="flex items-center gap-4">
                    {/* Logo Placeholder */}
                    <div className="w-16 h-16 flex items-center justify-center border-2 border-yellow-500 rounded-full text-yellow-600 font-bold text-xl">
                        VK
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-green-600 uppercase tracking-wide">VK Info TECH</h1>
                        <p className="text-sm text-gray-700 font-semibold tracking-wider">Complete Technology Solution Provider</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-blue-500 uppercase">INVOICE</h2>
                </div>
            </div>

            {/* Main Layout Table - Using HTML Tables for Strict Borders & Alignment */}
            <div className="border-2 border-black">
                {/* Section 1: Bill From, Bill To, Invoice Info */}
                <div className="flex border-b border-black">
                    {/* Bill From */}
                    <div className="w-[30%] border-r border-black p-2">
                        <h3 className="font-bold border-b border-gray-400 mb-1">Bill From</h3>
                        <div className="text-sm font-bold">{company.name}</div>
                        <div className="text-xs whitespace-pre-line">{company.address}</div>
                        <div className="text-xs mt-1 font-semibold">Phone: {company.mobile}</div>
                    </div>

                    {/* Bill To */}
                    <div className="w-[35%] border-r border-black p-2 flex flex-col">
                        <h3 className="font-bold border-b border-gray-400 mb-1">Bill To</h3>
                        <div className="text-sm flex-1">
                            {data.customerName ? (
                                <>
                                    <div className="font-bold uppercase">{data.customerName}</div>
                                    <div className="whitespace-pre-line text-xs">{data.customerAddress}</div>
                                    <div className="text-xs mt-1">Phone: {data.customerPhone}</div>
                                </>
                            ) : (
                                <div className="text-gray-400 italic mt-4 text-center">Customer Details</div>
                            )}
                        </div>
                    </div>

                    {/* Invoice Meta Data - Strict Grid */}
                    <div className="w-[35%] p-2 bg-gray-50 print:bg-transparent">
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td className="font-bold py-1">INVOICE NO :</td>
                                    <td className="font-bold py-1 text-right">{data.invoiceNumber}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-1">INVOICE DATE :</td>
                                    <td className="py-1 text-right">{data.date}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-1">INVOICE TIME :</td>
                                    <td className="py-1 text-right">{data.time}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                    <td className="font-bold py-1">DUE DATE :</td>
                                    <td className="py-1 text-right">{data.dueDate || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-1">DUE TIME :</td>
                                    <td className="py-1 text-right">{data.dueTime || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-1">PAY MODE :</td>
                                    <td className="py-1 text-right uppercase">{data.paymentMode}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 2: Product Table */}
                <div className="w-full">
                    {/* Header */}
                    <div className="flex bg-blue-900 text-white font-bold text-center text-xs print:bg-blue-900 border-b border-black">
                        <div className="w-[8%] border-r border-white py-2">S.No.</div>
                        <div className="w-[42%] border-r border-white py-2">Description</div>
                        <div className="w-[10%] border-r border-white py-2">Qty</div>
                        <div className="w-[12%] border-r border-white py-2">Price</div>
                        <div className="w-[8%] border-r border-white py-2">Dis %</div>
                        <div className="w-[20%] py-2">Amount</div>
                    </div>

                    {/* Rows */}
                    {data.products.map((item, index) => (
                        <div key={index} className="flex border-b border-black text-xs h-8 items-center">
                            <div className="w-[8%] border-r border-black h-full flex items-center justify-center">{item.sNo}</div>
                            <div className="w-[42%] border-r border-black h-full flex items-center px-2 text-left bg-white relative z-10">{item.description}</div>
                            <div className="w-[10%] border-r border-black h-full flex items-center justify-center">{item.qty}</div>
                            <div className="w-[12%] border-r border-black h-full flex items-center justify-center">{item.rate.toFixed(2)}</div>
                            <div className="w-[8%] border-r border-black h-full flex items-center justify-center">{item.discountPercent}</div>
                            <div className="w-[20%] h-full flex items-center justify-end px-2 font-semibold bg-white z-10">{item.amount.toFixed(2)}</div>
                        </div>
                    ))}

                    {/* Filler Rows - Essential to keep vertical lines going down */}
                    <div className="flex border-b border-black flex-1 min-h-[150px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjwvc3ZnPg==')]">
                        <div className="w-[8%] border-r border-black"></div>
                        <div className="w-[42%] border-r border-black"></div>
                        <div className="w-[10%] border-r border-black"></div>
                        <div className="w-[12%] border-r border-black"></div>
                        <div className="w-[8%] border-r border-black"></div>
                        <div className="w-[20%]"></div>
                    </div>
                </div>

                {/* Section 3: Footer & Totals */}
                <div className="flex text-xs h-auto min-h-[200px]">

                    {/* Left Panel: Words, Bank, Terms */}
                    <div className="w-[60%] border-r border-black flex flex-col">

                        {/* Words */}
                        <div className="border-b border-black p-2 min-h-[40px]">
                            <span className="font-bold">Total In Words:</span>
                            <span className="italic font-semibold ml-2">{data.amountInWords}</span>
                        </div>

                        {/* Bank */}
                        <div className="border-b border-black p-2 flex-1">
                            <h4 className="font-bold underline mb-2">Bank Details</h4>
                            <div className="grid grid-cols-[80px_1fr] gap-y-1">
                                <span className="font-semibold">Name</span>
                                <span>: Vasanthakumar Palanivel</span>
                                <span className="font-semibold">Bank</span>
                                <span>: {company.bankName}</span>
                                <span className="font-semibold">A/c No</span>
                                <span>: {company.accountNumber}</span>
                                <span className="font-semibold">IFSC</span>
                                <span>: {company.ifsc}</span>
                                <span className="font-semibold">UPI ID</span>
                                <span>: {company.upiId}</span>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="p-2 h-[80px]">
                            <h4 className="font-bold underline mb-1">Terms & Conditions:</h4>
                            <ul className="list-disc pl-4 space-y-0.5 text-[10px] leading-tight">
                                <li>Goods once sold cannot be taken back or exchange.</li>
                                <li>Invoice cannot be modified or cancelled.</li>
                                <li>Warranty as per manufacturer policy.</li>
                                <li>Credit period: 2 days only.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel: Calcs & Sign */}
                    <div className="w-[40%] flex flex-col">

                        {/* Subtotal */}
                        <div className="flex border-b border-black">
                            <div className="w-1/2 p-2 border-r border-black text-right">Subtotal</div>
                            <div className="w-1/2 p-2 text-right font-bold">{data.subTotal.toFixed(2)}</div>
                        </div>

                        {/* GST Breakdown */}
                        <div className="flex border-b border-black">
                            <div className="w-1/2 p-1 border-r border-black text-right border-gray-300">GST (18%)</div>
                            {/* Visual tweak: Just show blank or total tax */}
                            <div className="w-1/2 p-1 text-right"></div>
                        </div>
                        <div className="flex border-b border-black">
                            <div className="w-1/2 p-1 border-r border-black text-right">SGST (9%)</div>
                            <div className="w-1/2 p-1 text-right">{data.sgst.toFixed(2)}</div>
                        </div>
                        <div className="flex border-b border-black">
                            <div className="w-1/2 p-1 border-r border-black text-right">CGST (9%)</div>
                            <div className="w-1/2 p-1 text-right">{data.cgst.toFixed(2)}</div>
                        </div>

                        {/* Round Off */}
                        <div className="flex border-b border-black">
                            <div className="w-1/2 p-2 border-r border-black text-right">Round Off</div>
                            <div className="w-1/2 p-2 text-right">{data.roundOff.toFixed(2)}</div>
                        </div>

                        {/* Grand Total */}
                        <div className="flex border-b border-black bg-blue-200 print:bg-blue-200">
                            <div className="w-1/2 p-2 border-r border-black text-right font-bold text-blue-900 border-b border-blue-300">Grand Total</div>
                            <div className="w-1/2 p-2 text-right font-bold text-blue-900 text-base">{data.grandTotal.toFixed(2)}</div>
                        </div>

                        {/* Paid */}
                        <div className="flex border-b border-black bg-green-100 print:bg-green-100">
                            <div className="w-1/2 p-2 border-r border-black text-right font-bold text-green-900 border-b border-green-200">Paid Amount</div>
                            <div className="w-1/2 p-2 text-right font-bold text-green-900">{data.paidAmount?.toFixed(2) || '0.00'}</div>
                        </div>

                        {/* Balance */}
                        <div className="flex border-b border-black bg-red-50 print:bg-red-50">
                            <div className="w-1/2 p-2 border-r border-black text-right font-bold text-red-900 border-b border-red-200">Balance Amount</div>
                            <div className="w-1/2 p-2 text-right font-bold text-red-900">{data.balance?.toFixed(2) || '0.00'}</div>
                        </div>

                        {/* Signature */}
                        <div className="flex-1 p-2 flex flex-col items-center justify-end relative h-[80px]">
                            {/* QR Code */}
                            {company.qrCode && (
                                <div className="absolute top-2 right-2">
                                    <img src={company.qrCode} className="w-12 h-12 border border-gray-400" />
                                </div>
                            )}

                            <div className="w-full text-center">
                                <div className="text-[10px] font-bold mb-6 text-right w-full pr-4">For {company.name}</div>
                                <div className="border-t border-black w-3/4 mx-auto"></div>
                                <div className="text-[10px] mt-1 font-bold">Authorized Signature</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-[10px] mt-2 italic text-gray-500">
                This is a computer generated invoice.
            </div>
        </div>
    );
}
