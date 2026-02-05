import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import { handlePrintInvoice } from '../components/invoice/InvoicePrintHandler';
import { CompanyDetails, InvoiceData } from '../components/invoice/InvoiceTemplate';
import { generateInvoicePDF, InvoiceData as PDFInvoiceData } from '../services/PDFService';
import { productService, Product as InventoryProduct } from '../services/ProductService';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  discount: number;
  amount: number;
}

export default function Billing() {
  // Focus Refs
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);
  const customerAddressRef = useRef<HTMLTextAreaElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const dueTimeRef = useRef<HTMLInputElement>(null);
  const productDescRef = useRef<HTMLInputElement>(null); // For manual description
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState(0);

  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPrice, setManualPrice] = useState<number | string>(''); // Allow empty string for input

  // Placeholder company details (will be loaded from database)
  // Placeholder company details (will be loaded from database)
  const companyDetails = {
    name: 'VK Info TECH',
    tagline: 'Complete Technology Solution Provider',
    address: 'No.1, Kumaravel Complex, Koneripatti, Rasipuram, Namakkal - 637408',
    phone: '+91 99445 51256',
    gst: '33ABCDE1234F1Z5', // Updated placeholder GST to TN state code (33) based on address, or keep generic
    bankName: 'KVB, Rasipuram',
    accountNumber: '1622155000097090',
    ifsc: 'KVBL0001622',
    upiId: 'vasanthakumar44551@oksbi',
    terms: 'Goods once sold cannot be taken back or exchange.',
  };

  const [availableProducts, setAvailableProducts] = useState<InventoryProduct[]>([]);

  // Load products on mount
  useEffect(() => {
    setAvailableProducts(productService.getAllProducts());
  }, []);

  // Helper to handle product selection from dropdown
  const handleProductSelect = (productName: string) => {
    setSelectedProduct(productName);
    const product = availableProducts.find(p => p.name === productName);
    if (product) {
      setManualDescription(product.name);
      setSelectedBrand(product.brand);
      setManualPrice(product.price);
    } else {
      setManualDescription('');
      setSelectedBrand('');
      setManualPrice('');
    }
  };



  const getProductStock = (productName: string) => {
    const product = availableProducts.find(p => p.name === productName);
    return product?.stock || 0;
  };

  const addProduct = () => {
    // Allow manual entry if description is provided, even if not in dropdown
    if (!manualDescription || quantity <= 0 || !manualPrice) {
      alert('Please enter valid product description, price, and quantity');
      return;
    }

    const price = Number(manualPrice);
    const baseAmount = price * quantity;
    const discountAmount = baseAmount * (discount / 100);
    const finalAmount = baseAmount - discountAmount;

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
    // Reset fields for user convenience or keep focused? Resetting is safer.
    setSelectedProduct('');
    setManualDescription('');
    setSelectedBrand('');
    setManualPrice('');
    setQuantity(1);
    setDiscount(0);
    // TODO: Set focus back to Description field? handled via ref later
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Calculations
  const subtotal = products.reduce((sum, p) => sum + p.amount, 0);
  const gstRate = 18;
  const gstAmount = subtotal * (gstRate / 100);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const roundOff = Math.round(subtotal + gstAmount) - (subtotal + gstAmount);
  const grandTotal = Math.round(subtotal + gstAmount);
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

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const invoiceDate = new Date().toLocaleDateString('en-IN');
  const invoiceTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const handleSaveBill = async () => {
    if (!customerName || !customerPhone || products.length === 0) {
      alert('Please fill customer details and add at least one product');
      return;
    }

    // Store in localStorage (will be replaced with database later)
    const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');

    // Check if customer exists by phone
    let customer = existingCustomers.find((c: any) => c.phone === customerPhone);

    if (customer) {
      // Update existing customer
      customer.totalPurchases = (customer.totalPurchases || 0) + grandTotal;
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.lastPurchaseDate = invoiceDate;
      customer.updatedAt = new Date().toISOString().split('T')[0];

      const updatedCustomers = existingCustomers.map((c: any) =>
        c.phone === customerPhone ? customer : c
      );
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    } else {
      // Create new customer
      const newCustomer = {
        id: `C${(existingCustomers.length + 1).toString().padStart(3, '0')}`,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        email: '',
        customerType: 'Retail',
        status: 'Active',
        totalPurchases: grandTotal,
        totalOrders: 1,
        lastPurchaseDate: invoiceDate,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      customer = newCustomer;
      existingCustomers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(existingCustomers));
    }

    // Save invoice
    const invoice = {
      id: `I${(existingInvoices.length + 1).toString().padStart(3, '0')}`,
      invoiceNumber,
      customerId: customer.id,
      date: invoiceDate,
      time: invoiceTime,
      amount: grandTotal,
      paidAmount,
      balance: balanceAmount,
      paymentMode,
      products: products,
      customerName,
      customerPhone,
      customerAddress
    };
    existingInvoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));

    // Update Stock
    products.forEach(p => {
      // Find original product ID by name if possible, or use p.id if it matched (but p.id is unique item id). 
      // We need the inventory product ID.
      // In addProduct, we didn't store inventory ID.
      // We need to look it up or store it. 
      // Simplest: look up by name in availableProducts.
      const inventoryProduct = availableProducts.find(ap => ap.name === p.name);
      if (inventoryProduct) {
        productService.updateStock(inventoryProduct.id, p.quantity);
      }
    });

    // Refresh available products
    setAvailableProducts(productService.getAllProducts());

    // Generate PDF automatically
    try {
      await handleGeneratePDF();
    } catch (error) {
      console.error("Auto PDF Generation failed:", error);
    }

    alert(`Bill saved successfully and PDF generated!\n\nCustomer: ${customerName}\nInvoice: ${invoiceNumber}\nAmount: ₹${grandTotal.toLocaleString()}\n\nCustomer data has been ${existingCustomers.find((c: any) => c.phone === customerPhone) ? 'updated' : 'created'} in the customer database.`);

    // Reset form
    setProducts([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setPaidAmount(0);
  };

  const handlePrintBill = () => {
    if (products.length === 0) {
      alert('Please add products to print');
      return;
    }

    const invoiceData: InvoiceData = {
      invoiceNumber,
      date: invoiceDate,
      time: invoiceTime, // New field
      dueDate,         // New field
      dueTime,         // New field
      customerName,
      customerAddress,
      customerPhone,

      // customerGst: '', // Removed as not in type
      paymentMode,
      products: products.map((p, i) => ({
        sNo: i + 1,
        description: p.name, // Use name as description since it's now manual
        qty: p.quantity,
        rate: p.price,
        discountPercent: p.discount,
        amount: p.amount
      })),
      subTotal: subtotal,
      gstRate,
      cgst,
      sgst,
      roundOff,
      grandTotal,
      amountInWords: numberToWords(grandTotal),
      termsAndConditions: [
        'Goods once sold will not be taken back.',
        'Interest @ 24% p.a. will be charged if bill is not paid within due date.',
        'All disputes subject to Bangalore Jurisdiction.'
      ],
      paidAmount,
      balance: balanceAmount
    };

    const companyData: CompanyDetails = {
      name: companyDetails.name,
      tagline: companyDetails.tagline,
      address: companyDetails.address,
      mobile: companyDetails.phone,
      email: 'info@vkinfotech.com', // Placeholder
      gstin: companyDetails.gst,
      bankName: companyDetails.bankName,
      accountNumber: companyDetails.accountNumber,
      ifsc: companyDetails.ifsc,
      upiId: companyDetails.upiId
    };

    handlePrintInvoice(companyData, invoiceData);
  };

  const handleGeneratePDF = async () => {
    if (products.length === 0) {
      alert('Please add products to generate PDF');
      return;
    }

    const invoiceData: PDFInvoiceData = {
      invoiceNumber,
      date: invoiceDate,
      time: invoiceTime,
      dueDate,
      dueTime,
      payMode: paymentMode,
      customerName,
      customerAddress,
      customerPhone,
      products: products.map((p, i) => ({
        sNo: i + 1,
        description: p.name,
        qty: p.quantity,
        rate: p.price,
        discountPercent: p.discount,
        amount: p.amount
      })),
      subTotal: subtotal,
      gstRate,
      cgst,
      sgst,
      roundOff,
      grandTotal,
      amountInWords: numberToWords(grandTotal),
      paidAmount,
      balanceAmount
    };

    try {
      await generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Check console.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Invoice Container */}
      {/* Invoice Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">

        {/* Company Header */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 p-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-green-600 mb-2">{companyDetails.name}</h1>
            <p className="text-gray-600 text-sm mb-3">{companyDetails.tagline}</p>
            <p className="text-gray-500 text-sm">{companyDetails.address}</p>
            <div className="flex items-center justify-center gap-8 mt-3 text-sm text-gray-500">
              <span>Phone: {companyDetails.phone}</span>
              <span className="border-l border-gray-300 pl-8">GST: {companyDetails.gst}</span>
            </div>
          </div>
        </div>

        {/* Customer & Invoice Details - Left & Right */}
        <div className="grid grid-cols-2 gap-px bg-gray-200">
          {/* LEFT SIDE - Customer Details */}
          <div className="bg-gray-50 p-6">
            <h2 className="text-lg font-bold text-green-600 mb-4 border-b border-gray-200 pb-2">Customer Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 text-xs mb-1">Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  ref={customerNameRef}
                  onKeyDown={(e) => handleKeyDown(e, customerPhoneRef)}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 text-xs mb-1">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  ref={customerPhoneRef}
                  onKeyDown={(e) => handleKeyDown(e, customerAddressRef)}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 text-xs mb-1">Address</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  ref={customerAddressRef}
                  onKeyDown={(e) => handleKeyDown(e, dueDateRef)}
                  placeholder="Customer address"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Invoice Details */}
          <div className="bg-gray-50 p-6">
            <h2 className="text-lg font-bold text-green-600 mb-4 border-b border-gray-200 pb-2">Invoice Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 text-xs mb-1">Invoice No (Auto)</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Date</label>
                  <input
                    type="text"
                    value={invoiceDate}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Time</label>
                  <input
                    type="text"
                    value={invoiceTime}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    ref={dueDateRef}
                    onKeyDown={(e) => handleKeyDown(e, dueTimeRef)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs mb-1">Due Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    ref={dueTimeRef}
                    onKeyDown={(e) => handleKeyDown(e, productDescRef)} // Jump to product description
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 text-xs mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Entry Section */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h3 className="text-sm font-bold text-green-600 mb-3">Product Entry</h3>
          <div className="grid grid-cols-7 gap-3 items-end">
            {/* Hidden Dropdown logic integrated into Description logic effectively, keeping dropdown for helper */}
            <div className="col-span-2">
              <label className="block text-gray-600 text-xs mb-1">Description / Product</label>
              {/* Helper Dropdown - small above or integrated? keeping separate for now or replacing? 
                   User wants Text Input. I'll make the main input text, and a small select for "Quick Pick" */}
              <div className="flex gap-1">
                <input
                  type="text"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  ref={productDescRef}
                  onKeyDown={(e) => handleKeyDown(e, qtyRef)}
                  placeholder="Enter Item Description"
                  className="w-full px-2 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={selectedProduct}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-8 px-0 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm"
                  title="Quick Select Product"
                >
                  <option value="">...</option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* hidden brand select, or keep it optional/manual? logic sets it but manual entry might skip it. Keeping it hidden/auto-set */}
            <div className="hidden">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-2 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm"
              >
                <option value="">Select</option>
                {selectedProduct && availableProducts
                  .filter(p => p.name === selectedProduct)
                  .map(p => (
                    <option key={p.brand} value={p.brand}>{p.brand}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-600 text-xs mb-1">Qty</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                ref={qtyRef}
                onKeyDown={(e) => handleKeyDown(e, priceRef)}
                className="w-full px-2 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-gray-600 text-xs mb-1">Price</label>
              <input
                type="number"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                ref={priceRef}
                onKeyDown={(e) => handleKeyDown(e, discountRef)}
                className="w-full px-2 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-xs mb-1">Dis %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                ref={discountRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBtnRef.current?.click();
                    productDescRef.current?.focus();
                  }
                }}
                className="w-full px-2 py-2 bg-white border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-gray-600 text-xs mb-1">Amount</label>
              <div className="px-2 py-2 bg-gray-100 border border-gray-300 rounded text-gray-800 text-sm font-bold">
                {((Number(manualPrice || 0) * quantity) * (1 - discount / 100)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </div>
            </div>
            <button
              onClick={addProduct}
              ref={addBtnRef}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow-lg transition-all hover:scale-105"
            >
              <Plus size={18} />
              Add
            </button>
          </div>
          {/* Stock display helper if selected */}
          {selectedProduct && (
            <div className="mt-2 text-sm text-green-600 font-semibold">
              Stock Available: {getProductStock(selectedProduct)} units
            </div>
          )}
        </div>

        {/* Product Table */}
        <div className="border-t border-gray-200 p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-green-200">
                  <th className="text-left py-2 px-3 text-green-700 text-sm font-bold">S.No</th>
                  <th className="text-left py-2 px-3 text-green-700 text-sm font-bold">Description</th>
                  <th className="text-left py-2 px-3 text-green-700 text-sm font-bold">Quantity</th>
                  <th className="text-left py-2 px-3 text-green-700 text-sm font-bold">Price</th>
                  <th className="text-left py-2 px-3 text-green-700 text-sm font-bold">Discount %</th>
                  <th className="text-left py-2 px-3 text-green-700 text-sm font-bold">Amount</th>
                  <th className="text-left py-2 px-3 text-green-700 text-sm font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No products added yet
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 text-gray-800 text-sm">{index + 1}</td>
                      <td className="py-2 px-3">
                        <p className="text-gray-800 font-medium text-sm">{product.name}</p>
                        <p className="text-gray-500 text-xs">{product.brand}</p>
                      </td>
                      <td className="py-2 px-3 text-gray-800 text-sm">{product.quantity}</td>
                      <td className="py-2 px-3 text-gray-800 text-sm">₹{product.price.toLocaleString()}</td>
                      <td className="py-2 px-3 text-gray-800 text-sm">{product.discount}%</td>
                      <td className="py-2 px-3 text-gray-800 font-semibold text-sm">₹{product.amount.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations Section */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm mb-2">Amount in Words:</p>
              <p className="text-green-700 font-bold text-lg">{numberToWords(grandTotal)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CGST ({gstRate / 2}%):</span>
                <span className="text-gray-900 font-semibold">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SGST ({gstRate / 2}%):</span>
                <span className="text-gray-900 font-semibold">₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Round Off:</span>
                <span className="text-gray-900 font-semibold">₹{roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span className="text-green-700">Grand Total:</span>
                <span className="text-green-700">₹{grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <label className="block text-gray-600 text-xs mb-1">Paid Amount</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-600 text-xs mb-1">Balance</label>
                  <div className={`px-3 py-2 rounded font-bold text-sm ${balanceAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    ₹{balanceAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Bank Details, Terms, Signature */}
        <div className="border-t border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-4">
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="text-green-700 font-bold mb-2">Bank Details</h4>
              <p className="text-gray-600">{companyDetails.bankName}</p>
              <p className="text-gray-600">A/c: {companyDetails.accountNumber}</p>
              <p className="text-gray-600">IFSC: {companyDetails.ifsc}</p>
              <p className="text-gray-600">UPI: {companyDetails.upiId}</p>
            </div>
            <div>
              <h4 className="text-green-700 font-bold mb-2">Terms & Conditions</h4>
              <p className="text-gray-500 text-xs">{companyDetails.terms}</p>
            </div>
            <div>
              <h4 className="text-green-700 font-bold mb-2">Authorized Signature</h4>
              <div className="mt-8 border-t border-gray-300 pt-2">
                <p className="text-gray-500 text-xs">For {companyDetails.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleSaveBill}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all hover:scale-105"
            >
              <Save size={20} />
              SAVE BILL
            </button>
            <button
              onClick={handlePrintBill}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all hover:scale-105"
            >
              <Printer size={20} />
              PRINT BILL
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
