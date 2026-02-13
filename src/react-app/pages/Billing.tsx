import { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Printer, Edit } from 'lucide-react';

import { authService } from '../services/AuthService';
import { handlePrintInvoice, generateInvoicePDF } from '../components/invoice/InvoicePrintHandler';
import { CompanyDetails, InvoiceData } from '../types';
import { productService, Product as InventoryProduct } from '../services/ProductService';
import { customerService } from '../services/CustomerService';
import { BillingAPI } from '../services/BillingAPI';
import { CustomerBillsAPI } from '../services/CustomerBillsAPI';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  discount: number;
  amount: number;
}

/**
 * Billing Component
 * 
 * This component is ONLY for creating and editing the CURRENT bill.
 * It manages the active billing session state.
 * 
 * DO NOT use this component for viewing customer bill history.
 * Use the Customers page with InvoicePreview component instead.
 * 
 * State Isolation: All state in this component is local and never shared
 * with the Customers page to prevent conflicts.
 */
export default function Billing() {
  const descriptionRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState(0);

  const [dueDate, setDueDate] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPrice, setManualPrice] = useState<number | string>(''); // Allow empty string for input
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  // Company Details State (Load from localStorage or use defaults)
  const [companyDetails] = useState<CompanyDetails>(() => {
    const user = authService.getCurrentUser();
    const savedDetails = localStorage.getItem('companySettings');
    const defaults = {
      name: user?.branch || 'VK INFOTECH',
      tagline: 'Complete Technology Solution Provider',
      address: 'No.1, Kumaravel Complex, Koneripatti, Rasipuram, Namakkal - 637408',
      mobile: '+91 99445 51256',
      gstin: '33ABCDE1234F1Z5',
      bankName: 'KVB, Rasipuram',
      bankHolder: 'Vasanthakumar Palanivel',
      accountNumber: '1622155000097090',
      ifsc: 'KVBL0001622',
      upiId: 'vasanthakumar44551@oksbi',
      terms: 'Goods once sold cannot be taken back or exchange.',
      email: 'vkinfotech.vk@gmail.com',
      logo: '/invoice-logo.png'
    };
    return savedDetails ? JSON.parse(savedDetails) : defaults;
  });

  // Bill From Editable State
  const [billFromName, setBillFromName] = useState(companyDetails.name);
  const [billFromAddress, setBillFromAddress] = useState(companyDetails.address);
  const [billFromMobile, setBillFromMobile] = useState(companyDetails.mobile);
  const [billFromGst, setBillFromGst] = useState(''); // Manual GST for this bill
  const [billFromExtra1, setBillFromExtra1] = useState(''); // Extra address line 1
  const [billFromExtra2, setBillFromExtra2] = useState(''); // Extra address line 2

  // Update effect to sync if companyDetails changes (though mostly static after mount)
  useEffect(() => {
    setBillFromName(companyDetails.name);
    setBillFromAddress(companyDetails.address);
    setBillFromMobile(companyDetails.mobile);
  }, [companyDetails]);

  const [availableProducts, setAvailableProducts] = useState<InventoryProduct[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Tax State
  const [gstRate, setGstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);
  const [cgstRate, setCgstRate] = useState(0);

  // Load products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      const products = await productService.getAllProducts();
      setAvailableProducts(products);
    };
    fetchProducts();
  }, []);

  // Helper to handle product selection from dropdown
  const handleProductSelect = (productName: string) => {
    // setSelectedProduct(productName);
    const product = availableProducts.find(p => p.name === productName);
    if (product) {
      let description = product.name;

      // Append Product Description (e.g. "256GB Titanium")
      if (product.description) {
        description += ` (${product.description})`;
      }

      const details = [];
      if (product.model) details.push(`Model: ${product.model}`);
      if (product.serialNumber) details.push(`SN: ${product.serialNumber}`);
      if (product.warranty) details.push(`Warranty: ${product.warranty}`);

      if (details.length > 0) {
        description += ` (${details.join(', ')})`;
      }

      setManualDescription(description);
      setSelectedBrand(product.brand);
      setManualPrice(product.price);
    } else {
      // Don't clear if we are just searching, but maybe we should if strictly selecting.
      // For now, let's keep manual entry flexible.
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setManualDescription(product.name);
    setQuantity(product.quantity);
    setManualPrice(product.price);
    setDiscount(product.discount);
    setSelectedBrand(product.brand);
    // Scroll to top or input area could be nice
    descriptionRef.current?.focus();
    triggerError('Editing Item: ' + product.name); // Using error toast as info for now
  };

  const addProduct = () => {
    // Allow manual entry if description is provided, even if not in dropdown
    if (!manualDescription || quantity <= 0 || !manualPrice) {
      triggerError('Invalid Product! Please Check Details.');
      return;
    }

    const price = Number(manualPrice);
    const baseAmount = price * quantity;
    const discountAmount = baseAmount * (discount / 100);
    const finalAmount = baseAmount - discountAmount;

    if (editingProductId) {
      // Update Existing Product
      setProducts(products.map(p =>
        p.id === editingProductId
          ? { ...p, name: manualDescription, brand: selectedBrand || 'General', price, quantity, discount, amount: finalAmount }
          : p
      ));
      setEditingProductId(null);
      triggerError('Item Updated Successfully!');
    } else {
      // Add New Product
      const newProduct: Product = {
        id: Date.now().toString(),
        name: manualDescription,
        brand: selectedBrand || 'General', // Default brand if manual
        price,
        quantity,
        discount,
        amount: finalAmount,
      };
      setProducts([...products, newProduct]);
    }

    // Reset fields
    setManualDescription('');
    setSelectedBrand('');
    setManualPrice('');
    setQuantity(1);
    setDiscount(0);
    setEditingProductId(null);

    // Auto-focus back to description for continuous entry
    setTimeout(() => {
      descriptionRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProduct();
    }
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Calculations
  // Calculations
  const subtotal = products.reduce((sum, p) => sum + p.amount, 0);
  const totalGstAmount = (subtotal * gstRate) / 100;
  const sgst = totalGstAmount / 2;
  const cgst = totalGstAmount / 2;
  // Grand Total = Subtotal + Total GST (SGST+CGST are just components of Total GST, not additive)
  const grandTotal = Math.round(subtotal + totalGstAmount);
  // Round Off = Difference between rounded Grand Total and precise sum
  const roundOff = parseFloat((grandTotal - (subtotal + totalGstAmount)).toFixed(2));
  const balanceAmount = grandTotal - paidAmount;

  // Convert number to words
  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    };

    return convert(num) + ' Rupees Only';
  };

  const productsPerPage = 10;
  const chunks = [];
  for (let i = 0; i < products.length; i += productsPerPage) {
    chunks.push(products.slice(i, i + productsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  // Invoice Number Logic
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const fetchNextInvoiceNumber = async () => {
    try {
      const today = new Date();
      const yy = today.getFullYear().toString().slice(-2);
      const mm = (today.getMonth() + 1).toString().padStart(2, '0');
      const dd = today.getDate().toString().padStart(2, '0');
      const prefix = `${yy}${mm}${dd}`;

      const savedInvoices = await CustomerBillsAPI.getAllInvoices();

      // Find invoices matching today's prefix
      const todaysInvoices = savedInvoices.filter((inv: any) =>
        inv.invoiceNumber && inv.invoiceNumber.toString().startsWith(prefix)
      );

      let nextSequence = 1;
      if (todaysInvoices.length > 0) {
        // Extract numeric suffix
        const suffixes = todaysInvoices.map((inv: any) => {
          const numStr = inv.invoiceNumber.toString();
          if (numStr.length >= 10) {
            return parseInt(numStr.slice(6));
          }
          return 0;
        });
        const maxSuffix = Math.max(...suffixes, 0);
        nextSequence = maxSuffix + 1;
      }

      setInvoiceNumber(`${prefix}${nextSequence.toString().padStart(4, '0')}`);
    } catch (error) {
      console.error("Failed to generate invoice number", error);
      // Fallback to timestamp if API fails
      setInvoiceNumber(`INV${Date.now()}`);
    }
  };

  useEffect(() => {
    fetchNextInvoiceNumber();
  }, []);


  // Customer Auto-Suggestion Logic
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const savedCustomers = await customerService.getAllCustomers().catch(() => []);
        setCustomers(Array.isArray(savedCustomers) ? savedCustomers : []);
      } catch (error) {
        console.error("Failed to load customers", error);
        setCustomers([]);
      }
    };
    loadCustomers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.trim()) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase()) ||
        c.phone.includes(value)
      );
      setFilteredCustomers(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const formatPhoneNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) {
      return digits.slice(0, 5) + ' ' + digits.slice(5);
    }
    return digits;
  };

  const handleSelectCustomer = (customer: any) => {
    setCustomerName(customer.name);
    setCustomerPhone(formatPhoneNumber(customer.phone));
    setCustomerAddress(customer.address);
    setCustomerGst(customer.gstin || ''); // Auto-fill GSTIN if available
    setShowSuggestions(false);
  };

  // Re-generate invoice number on mount to ensure freshness (in case other tabs added invoices)
  useEffect(() => {
    fetchNextInvoiceNumber();
  }, []);
  const invoiceDate = new Date().toLocaleDateString('en-IN');
  const invoiceTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const saveInvoiceToStorage = async () => {
    try {
      // 1. Handle Customer
      let customerId = '';

      // Check if customer exists
      const existingCustomers = await customerService.getAllCustomers();
      let customer = existingCustomers.find(c => c.phone === customerPhone);

      if (customer) {
        customerId = customer.id;
        // Update customer details if changed
        await customerService.updateCustomer(customer.id, {
          name: customerName,
          address: customerAddress,
          gstin: customerGst,
          updatedAt: new Date().toISOString().split('T')[0]
        });
      } else {
        // Create new customer
        const newCustomer = await customerService.addCustomer({
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          gstin: customerGst,
          email: '',
          customerType: 'Retail',
          status: 'Active'
        });
        if (newCustomer) {
          customerId = newCustomer.id;
        } else {
          throw new Error("Failed to create customer");
        }
      }

      // 2. Save Invoice
      const invoiceData = {
        id: `I${Date.now()}`, // Temporary ID, backend might generate one or use this
        invoiceNumber,
        customerId,
        date: invoiceDate,
        time: invoiceTime,
        amount: grandTotal,
        paidAmount,
        balance: balanceAmount,
        paymentMode,
        products: products,
        customerName,
        customerPhone,
        customerAddress,
        dueDate: dueDate || '-',
        createdAt: new Date().toISOString()
      };

      await BillingAPI.createInvoice(invoiceData);

      // 3. Stock Update: Handled automatically by Backend (Automatic Deduction)
      // Frontend refresh is enough


      // Refresh available products
      const refreshedProducts = await productService.getAllProducts();
      setAvailableProducts(refreshedProducts);

      return true; // Success
    } catch (error: any) {
      console.error("Error saving bill:", error);
      triggerError(`SAVE FAILED! ${error.message || "SERVER ERROR"}`);
      return false; // Failure
    }
  };

  const getInvoiceDataForPrint = (): InvoiceData => {
    return {
      invoiceNumber,
      date: invoiceDate,
      time: invoiceTime,
      dueDate: dueDate || '-',
      paymentMode,
      customerName,
      customerPhone,
      customerAddress,
      products: products.map((p, index) => ({
        sNo: index + 1,
        description: p.name,
        qty: p.quantity,
        rate: p.price,
        discountPercent: p.discount,
        amount: p.amount
      })),
      subTotal: subtotal,
      gstRate: gstRate,
      totalGst: totalGstAmount,
      sgst: sgst,
      cgst: cgst,
      roundOff: roundOff,
      grandTotal: grandTotal,
      paidAmount: paidAmount,
      balance: balanceAmount,
      amountInWords: numberToWords(grandTotal)
    };
  };

  const resetFormAfterSave = () => {
    setProducts([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerGst('');
    setPaidAmount(0);
    setIsSaving(false);
    setDueDate('');
    fetchNextInvoiceNumber();
  };

  const handleSaveBill = async () => {
    if (!customerName || !customerPhone || products.length === 0) {
      triggerError('MISSING FIELDS! CHECK CUSTOMER & PRODUCTS.');
      return;
    }

    setIsSaving(true);

    // 1. Save Data
    const saved = await saveInvoiceToStorage();
    if (!saved) {
      setIsSaving(false);
      return;
    }

    // 2. Generate PDF
    try {
      const company: CompanyDetails = {
        ...companyDetails,
        name: billFromName,
        address: `${billFromAddress}${billFromExtra1 ? '\n' + billFromExtra1 : ''}${billFromExtra2 ? '\n' + billFromExtra2 : ''}`,
        mobile: billFromMobile,
        email: companyDetails.email || 'vkinfotech.vk@gmail.com',
        gstin: billFromGst || companyDetails.gstin, // Use manual GST if provided, else default
        logo: companyDetails.logo || '/invoice-logo.png',
        tagline: companyDetails.tagline || 'Complete Technology Solution Provider'
      };

      await generateInvoicePDF(company, getInvoiceDataForPrint());

      // 3. Reset
      resetFormAfterSave();
    } catch (err: any) {
      console.error("PDF Generation failed:", err);
      triggerError("PDF FAILED! SYSTEM GLITCH DETECTED.");
      setIsSaving(false);
    }
  };

  const handlePrintBill = async () => {
    if (products.length === 0) {
      triggerError('NO PRODUCTS! ADD ITEMS TO PRINT.');
      return;
    }

    if (!customerName || !customerPhone) {
      triggerError('CUSTOMER INFO MISSING!');
      return;
    }

    // 1. Save Data (Auto-save on Print)
    const saved = await saveInvoiceToStorage();
    if (!saved) return;

    // 2. Print
    // 2. Print
    const company: CompanyDetails = {
      ...companyDetails,
      name: billFromName,
      address: `${billFromAddress}${billFromExtra1 ? '\n' + billFromExtra1 : ''}${billFromExtra2 ? '\n' + billFromExtra2 : ''}`,
      mobile: billFromMobile,
      email: companyDetails.email || 'vkinfotech.vk@gmail.com',
      gstin: billFromGst || companyDetails.gstin,
      logo: companyDetails.logo || '/invoice-logo.png',
      tagline: companyDetails.tagline || 'Complete Technology Solution Provider'
    };

    handlePrintInvoice(company, getInvoiceDataForPrint());

    // 3. Reset
    resetFormAfterSave();
  };




  return (
    <div className="max-w-[210mm] mx-auto p-4 min-h-screen bg-gray-100 font-sans relative overflow-x-hidden">

      {/* SIMPLE ERROR MODAL */}
      {showError && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full text-center border border-red-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-red-600 mb-2">Notice</h3>
            <p className="font-bold text-gray-800 mb-6">{errorMsg}</p>
            <button
              onClick={() => setShowError(false)}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-bold transition-colors w-full"
            >
              OK, CLOSE
            </button>
          </div>
        </div>
      )}


      {/* A4 SHEET (210mm wide) - White Background for Print */}
      <div className="flex flex-col gap-8 pb-32">
        {chunks.map((chunk, pageIndex) => {
          const isLastPage = pageIndex === chunks.length - 1;
          // const pageSubtotal = chunk.reduce((sum, p) => sum + p.amount, 0); // Removed as per request

          return (
            <div
              key={pageIndex}
              id={pageIndex === 0 ? "invoice" : `invoice-${pageIndex}`}
              className="invoice-page w-[210mm] min-h-[297mm] bg-white shadow-2xl mx-auto border-2 border-black flex flex-col relative print:shadow-none text-black box-border overflow-visible"
              style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', overflow: 'visible', display: 'flex' }}
            >
              <div className="flex flex-col flex-1">
                {/* HEADER SECTION - BORDER BOTTOM */}
                <div className="flex h-[120px] border-b border-black">
                  {/* LOGO BOX */}
                  <div className="w-[150px] flex items-center justify-center border-r-0">
                    <div className="w-32 h-32 relative flex items-center justify-center">
                      <img src="/invoice-logo.png" alt="Company Logo" className="w-28 h-28 object-contain" />
                    </div>
                  </div>

                  {/* TITLE BOX */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-4xl font-bold text-[#22c55e] tracking-wider company-name-font uppercase">{billFromName}</h1>
                    <p className="text-xs font-bold mt-1" style={{ fontFamily: 'ZyanaRegular, serif' }}>Complete Technology Solution Provider</p>
                  </div>

                  {/* INVOICE LABEL BOX */}
                  <div className="w-[150px] flex flex-col items-end justify-start p-4">
                    <h2 className="text-xl font-bold text-[#3b82f6] tracking-widest">INVOICE</h2>
                  </div>
                </div>

                {/* INFO GRID - 3 COLUMNS */}
                <div className="flex border-b-2 border-black h-[170px]">
                  {/* BILL FROM - Editable */}
                  <div className="w-[30%] border-r border-black p-2 flex flex-col text-[11px] leading-snug">
                    <h3 className="font-bold text-sm mb-1 uppercase text-blue-800">Bill From</h3>
                    <input
                      type="text"
                      className="font-bold text-xs outline-none bg-transparent w-full placeholder-gray-400"
                      value={billFromName}
                      onChange={(e) => setBillFromName(e.target.value)}
                      placeholder="Company Name"
                    />
                    <textarea
                      className="outline-none bg-transparent resize-none h-[40px] w-full overflow-hidden leading-snug placeholder-gray-400"
                      value={billFromAddress}
                      onChange={(e) => setBillFromAddress(e.target.value)}
                      placeholder="Address..."
                    />
                    {/* Extra Lines & Manual GST */}
                    <input
                      type="text"
                      className="outline-none bg-transparent w-full placeholder-gray-400"
                      value={billFromExtra1}
                      onChange={(e) => setBillFromExtra1(e.target.value)}
                      placeholder="Extra Line 1 (Optional)"
                    />
                    <input
                      type="text"
                      className="outline-none bg-transparent w-full placeholder-gray-400"
                      value={billFromExtra2}
                      onChange={(e) => setBillFromExtra2(e.target.value)}
                      placeholder="Extra Line 2 (Optional)"
                    />
                    <div className="mt-1 flex items-center gap-1">
                      <span>Phone:</span>
                      <input
                        type="text"
                        className="outline-none bg-transparent w-full"
                        value={billFromMobile}
                        onChange={(e) => setBillFromMobile(e.target.value)}
                      />
                    </div>
                    {/* Conditional GST Display - Hidden in print if empty */}
                    <div className={`flex items-center gap-1 ${billFromGst ? '' : 'print:hidden'}`}>
                      <span>GST:</span>
                      <input
                        type="text"
                        className="outline-none bg-transparent w-full uppercase placeholder-gray-400"
                        value={billFromGst}
                        onChange={(e) => setBillFromGst(e.target.value.toUpperCase())}
                        placeholder="GSTIN (Manual)"
                      />
                    </div>
                  </div>

                  {/* BILL TO - Editable (Only on first page or all? Standard is usually all or first. Let's keep it editable on all for user convenience if they scroll) */}
                  <div className="w-[35%] border-r border-black p-2 flex flex-col gap-1 text-[11px] leading-snug relative" ref={pageIndex === 0 ? dropdownRef : null}>
                    <h3 className="font-bold text-sm mb-1 uppercase text-blue-800">Bill To</h3>
                    <div className="flex flex-col gap-2 relative">
                      <input
                        id={`customer-name-${pageIndex}`}
                        type="text"
                        autoComplete="off"
                        value={customerName}
                        onChange={handleCustomerNameChange}
                        onFocus={() => {
                          if (customerName) setShowSuggestions(true);
                        }}
                        className="font-bold outline-none border-b border-gray-400 bg-transparent w-full placeholder-gray-500"
                        placeholder="Customer Name"
                      />

                      {/* Auto-Suggestion Dropdown (Only on first page to prevent duplicates/layout issues) */}
                      {pageIndex === 0 && showSuggestions && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-lg z-50 max-h-32 overflow-y-auto mt-1">
                          {filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-1 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <div className="font-bold text-gray-800 text-xs">{customer.name}</div>
                              <div className="text-[10px] text-gray-500 flex justify-between">
                                <span>{customer.phone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea
                        id={`customer-address-${pageIndex}`}
                        autoComplete="off"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="outline-none border-b border-gray-400 bg-transparent resize-none h-[60px] w-full placeholder-gray-500"
                        placeholder="Address Details..."
                      />

                      {/* Mobile Number with Fixed Prefix */}
                      <div className="flex items-center border-b border-gray-400 pb-1">
                        <span className="text-black whitespace-pre font-bold mr-1 select-none text-[11px]">ph no ; +91</span>
                        <input
                          id={`customer-phone-${pageIndex}`}
                          type="text"
                          autoComplete="off"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(formatPhoneNumber(e.target.value))}
                          className="outline-none bg-transparent w-full placeholder-gray-500 font-bold text-[11px]"
                          placeholder="XXXXX XXXXX"
                        />
                      </div>
                      <input
                        id={`customer-gst-${pageIndex}`}
                        type="text"
                        autoComplete="off"
                        value={customerGst}
                        onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                        className="uppercase outline-none border-b border-gray-400 bg-transparent w-full placeholder-gray-500"
                        placeholder="GSTIN"
                      />
                    </div>
                  </div>

                  {/* INVOICE DETAILS */}
                  <div className="flex-1 flex flex-col text-[11px]">
                    <div className="flex-1 border-b border-black p-1 px-2 flex flex-col justify-center gap-0.5">
                      <div className="flex justify-between font-bold"><span>INVOICE NO</span><span>: {invoiceNumber}</span></div>
                      <div className="flex justify-between font-bold"><span>DATE</span><span>: {invoiceDate}</span></div>
                      <div className="flex justify-between font-bold"><span>TIME</span><span>: {invoiceTime}</span></div>
                    </div>
                    <div className="flex-1 p-1 px-2 flex flex-col justify-center gap-0.5">
                      <div className="flex justify-between font-bold">
                        <span>DUE DATE</span>
                        <input id={`invoice-due-date-${pageIndex}`} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-right bg-transparent outline-none w-[100px]" />
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>PAY MODE</span>
                        <select id={`invoice-payment-mode-${pageIndex}`} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="text-right bg-transparent outline-none uppercase w-[80px]">
                          <option value="UPI">UPI</option>
                          <option value="CASH">CASH</option>
                          <option value="CARD">CARD</option>
                          <option value="NET BANKING">NET BANKING</option>
                        </select>
                      </div>
                      <div className="flex justify-between font-bold"><span>BALANCE</span><span>: {(Number(balanceAmount) || 0).toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>

                {/* ITEMS TABLE HEADER */}
                <div className="flex border-b-2 border-black bg-[#1e3a8a] text-white font-bold text-center h-[35px] items-center text-[11px]">
                  <div className="w-[8%] py-1 border-r border-white h-full flex items-center justify-center">S.No.</div>
                  <div className="flex-1 py-1 border-r border-white text-left px-2 h-full flex items-center justify-center">Description</div>
                  <div className="w-[10%] py-1 border-r border-white h-full flex items-center justify-center">Qty</div>
                  <div className="w-[12%] py-1 border-r border-white h-full flex items-center justify-center">Price</div>
                  <div className="w-[8%] py-1 border-r border-white h-full flex items-center justify-center">Dis %</div>
                  <div className="w-[15%] py-1 border-white h-full flex items-center justify-center">Amount</div>
                </div>

                {/* ITEMS BODY */}
                <div className="flex-1 relative flex flex-col min-h-[300px]">
                  <div className="flex-1 invoice-items-container">
                    {chunk.map((p, i) => {
                      const globalIndex = pageIndex * productsPerPage + i;
                      return (
                        <div key={i} className="flex border-b border-gray-300 text-[11px] min-h-[25px] group invoice-item-row">
                          <div className="w-[8%] p-1 text-center border-r border-black flex items-center justify-center relative">
                            {globalIndex + 1}
                            <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-white gap-2" data-html2canvas-ignore="true">
                              <button
                                onClick={() => handleEditProduct(p)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit Item"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => removeProduct(p.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove Item"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 p-1 px-2 border-r border-black font-medium flex items-center">{p.name}</div>
                          <div className="w-[10%] p-1 text-center border-r border-black flex items-center justify-center">{p.quantity}</div>
                          <div className="w-[12%] p-1 text-right border-r border-black px-2 flex items-center justify-end">{p.price}</div>
                          <div className="w-[8%] p-1 text-center border-r border-black flex items-center justify-center">{p.discount || '0'}%</div>
                          <div className="w-[15%] p-1 text-right border-black font-bold px-2 flex items-center justify-end">{p.amount.toFixed(2)}</div>
                        </div>
                      );
                    })}

                    {/* ADD ITEM ROW - Only on Last Page */}
                    {isLastPage && (
                      <div className="flex border-b border-gray-300 text-[11px] min-h-[30px] bg-blue-50 print:hidden group" data-html2canvas-ignore="true">
                        <button
                          onClick={addProduct}
                          className="w-[8%] p-1 text-center border-r border-black flex items-center justify-center font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-100 cursor-pointer"
                          title="Add Item"
                        >
                          +
                        </button>
                        <div className="flex-1 p-1 border-r border-black">
                          <input
                            ref={descriptionRef}
                            list="products-list-options"
                            className="w-full bg-transparent outline-none"
                            placeholder="Select or Type Item..."
                            value={manualDescription}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => {
                              setManualDescription(e.target.value);
                              const match = availableProducts.find(p => p.name === e.target.value);
                              if (match) handleProductSelect(match.name);
                            }}
                          />
                          <datalist id="products-list-options">
                            {availableProducts.map(p => <option key={p.id} value={p.name} />)}
                          </datalist>
                        </div>
                        <div className="w-[10%] border-r border-black">
                          <input
                            type="number"
                            value={quantity}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full text-center bg-transparent outline-none"
                          />
                        </div>
                        <div className="w-[12%] border-r border-black px-1">
                          <input
                            type="number"
                            value={manualPrice}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setManualPrice(e.target.value)}
                            className="w-full text-right bg-transparent outline-none"
                          />
                        </div>
                        <div className="w-[8%] border-r border-black px-1">
                          <input
                            type="number"
                            value={discount}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="w-full text-center bg-transparent outline-none"
                            placeholder="Dis"
                          />
                        </div>
                        <div className="w-[15%] px-2 text-right font-bold flex items-center justify-end">
                          {((Number(manualPrice) * quantity) * (1 - discount / 100)).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vertical Lines Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex opacity-30">
                    <div className="w-[8%] border-r border-black h-full"></div>
                    <div className="flex-1 border-r border-black h-full"></div>
                    <div className="w-[10%] border-r border-black h-full"></div>
                    <div className="w-[12%] border-r border-black h-full"></div>
                    <div className="w-[8%] border-r border-black h-full"></div>
                    <div className="w-[15%] h-full"></div>
                  </div>
                </div>

                {/* FOOTER - UI Preservation (existing area) */}
                <div className="mt-auto border-t-2 border-black flex flex-row">
                  {/* LEFT COLUMN: Bank -> QR/UPI -> Terms */}
                  <div className="w-1/2 border-r border-black flex flex-col">
                    {/* Bank Details */}
                    <div className="border-b border-black p-2 bg-gray-50">
                      <div className="bank-details-block">
                        <h3 className="font-bold text-[11px] mb-1">Bank Details</h3>
                        <div className="grid grid-cols-[80px_1fr] text-[10px] font-medium leading-relaxed pl-1">
                          <span>Name</span><span>: {companyDetails.bankHolder || 'Vasanthakumar Palanivel'}</span>
                          <span>IFSC Code</span><span>: {companyDetails.ifsc}</span>
                          <span>Account No</span><span>: {companyDetails.accountNumber}</span>
                          <span>Bank</span><span>: {companyDetails.bankName}</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code & UPI */}
                    <div className="border-b border-black p-2 flex items-center gap-4">
                      <div className="w-16 h-16 border border-black p-1 flex-shrink-0 bg-white">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${companyDetails.upiId}&pn=${encodeURIComponent(companyDetails.name)}&am=${grandTotal}&cu=INR`)}`}
                          alt="Scan to Pay"
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-bold text-[10px] uppercase text-blue-800 mb-0.5">Scan to Pay</h4>
                        <div className="text-[9px] font-bold text-gray-600">UPI ID:</div>
                        <div className="text-xs font-bold text-black border-b border-dashed border-gray-400 pb-0.5 invoice-upi-id">{companyDetails.upiId}</div>
                      </div>
                    </div>

                    {/* Terms & Conditions - Fills remaining space in left col */}
                    <div className="p-2 flex-1 terms-block">
                      <div className="font-bold text-[11px] mb-1">Terms and Conditions:</div>
                      <ul className="text-[9px] list-disc pl-4 text-black space-y-0.5 leading-tight font-medium">
                        <li>Goods once sold cannot be taken back or exchange.</li>
                        <li>Invoice Once made cannot be Modified or Cancelled.</li>
                        <li>Repairs/ Replacement subject to manufacture Policy.</li>
                        <li>Warranty void on product if Mishandled/ Burnt/ Physically.</li>
                        <li>Credit period 2 Days only</li>
                        <li>Subject to local jurisdiction.</li>
                      </ul>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Totals -> Words -> Signature */}
                  <div className="w-1/2 flex flex-col">
                    {/* Totals Table */}
                    <div className="border-b border-black">
                      <table className="w-full text-xs font-bold">
                        <tbody>
                          <tr className={`h-6 border-b border-gray-100 summary-overall-subtotal-row ${isLastPage ? '' : 'hidden'}`}>
                            <td className="px-2 font-bold">Overall Subtotal</td>
                            <td className="px-2 text-right font-bold invoice-subtotal">₹{subtotal.toFixed(2)}</td>
                          </tr>
                          <tr className={`h-6 border-b border-gray-100 summary-gst-row ${isLastPage ? '' : 'hidden'}`}>
                            <td className="px-2 flex items-center gap-1">
                              GST
                              <select
                                value={gstRate}
                                onChange={(e) => {
                                  const newRate = Number(e.target.value);
                                  setGstRate(newRate);
                                  setSgstRate(newRate / 2);
                                  setCgstRate(newRate / 2);
                                }}
                                className="w-12 border-b border-gray-400 text-center outline-none bg-transparent font-bold cursor-pointer"
                              >
                                <option value="0">0%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                              </select>
                            </td>
                            <td className="px-2 text-right invoice-gst">₹{totalGstAmount.toFixed(2)}</td>
                          </tr>
                          <tr className={`h-6 border-b border-gray-100 summary-sgst-row ${(isLastPage && gstRate > 0) ? '' : 'hidden'}`}>
                            <td className="px-2 flex items-center gap-1 text-gray-500">
                              SGST ({sgstRate}%)
                            </td>
                            <td className="px-2 text-right invoice-sgst text-gray-500">₹{sgst.toFixed(2)}</td>
                          </tr>
                          <tr className={`h-6 border-b border-gray-100 summary-cgst-row ${(isLastPage && gstRate > 0) ? '' : 'hidden'}`}>
                            <td className="px-2 flex items-center gap-1 text-gray-500">
                              CGST ({cgstRate}%)
                            </td>
                            <td className="px-2 text-right invoice-cgst text-gray-500">₹{cgst.toFixed(2)}</td>
                          </tr>
                          <tr className={`h-6 border-b border-gray-100 summary-roundoff-row ${isLastPage ? '' : 'hidden'}`}>
                            <td className="px-2">Round Off</td>
                            <td className="px-2 text-right invoice-roundoff">₹{roundOff.toFixed(2)}</td>
                          </tr>
                          <tr className={`h-8 bg-[#93c5fd] border-b border-black summary-grandtotal-row ${isLastPage ? '' : 'hidden'}`}>
                            <td className="px-2 text-sm">Grand Total</td>
                            <td className="px-2 text-right text-sm invoice-grandtotal">₹{grandTotal.toFixed(2)}</td>
                          </tr>
                          <tr className={`h-8 bg-[#86efac] summary-paid-row ${isLastPage ? '' : 'hidden'}`}>
                            <td className="px-2">Paid Amount</td>
                            <td className="px-2 text-right">
                              <input
                                id="invoice-paid-amount"
                                type="text"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(Number(e.target.value))}
                                className="w-[80px] bg-transparent text-right outline-none h-full font-bold invoice-paid-input"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Total In Words */}
                    {isLastPage && (
                      <div className="border-b border-black p-2 text-center bg-gray-50 flex flex-col justify-center min-h-[40px]">
                        <span className="font-bold text-[10px] text-gray-500 mb-0.5">Amount in Words</span>
                        <span className="font-bold text-xs uppercase underline invoice-amount-words leading-tight">{numberToWords(grandTotal)}</span>
                      </div>
                    )}

                    {/* Authorized Signature */}
                    <div className="flex-1 relative flex flex-col items-center justify-end p-2 px-4 signature-block min-h-[80px]">
                      <div className="absolute top-2 right-2 text-[9px] font-bold text-gray-400">For <span className="invoice-company-name text-black">{companyDetails.name}</span></div>
                      <div className="flex items-center justify-center mb-1 flex-1">
                        <img
                          src="/authorized-signature.png"
                          alt="Authorized Signature"
                          className="max-h-20 w-auto object-contain invoice-signature-img"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="text-[10px] font-bold border-t border-black w-full text-center pt-1 mt-1">Authorized Signature</div>
                    </div>
                  </div>
                </div>

                {/* Page Number - Bottom Left */}
                <div className="absolute bottom-1 left-2 text-[9px] font-bold text-gray-400">
                  Page {pageIndex + 1} of {chunks.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 print:hidden" data-html2canvas-ignore="true">
        <button
          onClick={handleSaveBill}
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group relative ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Save Bill & Download PDF"
        >
          <Save size={24} />
          <span className="absolute right-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
            {isSaving ? 'Saving...' : 'Save Bill'}
          </span>
        </button>
        <button
          onClick={handlePrintBill}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group relative"
          title="Print Bill"
        >
          <Printer size={24} />
          <span className="absolute right-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
            Print Bill
          </span>
        </button>
      </div>
    </div>
  );
}
