
export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    description: string;
    price: number;
    gst: number;
    stock: number;
    minStock: number;
    unit: string;
    status: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
}

class ProductService {
    private STORAGE_KEY = 'products';
    private defaultProducts: Product[] = [
        {
            id: 'P001',
            name: 'Samsung LED TV 43"',
            brand: 'Samsung',
            category: 'Electronics',
            description: '43 inch Full HD LED TV',
            price: 32000,
            gst: 18,
            stock: 12,
            minStock: 5,
            unit: 'pcs',
            status: 'Active',
            createdAt: '2024-01-15',
            updatedAt: '2024-01-20'
        },
        {
            id: 'P002',
            name: 'iPhone 15 Pro',
            brand: 'Apple',
            category: 'Mobile',
            description: '256GB, Titanium',
            price: 129000,
            gst: 18,
            stock: 3,
            minStock: 5,
            unit: 'pcs',
            status: 'Active',
            createdAt: '2024-01-10',
            updatedAt: '2024-01-22'
        },
        {
            id: 'P003',
            name: 'HP Laptop i5',
            brand: 'HP',
            category: 'Computers',
            description: 'Intel Core i5, 8GB RAM, 512GB SSD',
            price: 45000,
            gst: 18,
            stock: 8,
            minStock: 3,
            unit: 'pcs',
            status: 'Active',
            createdAt: '2024-01-12',
            updatedAt: '2024-01-18'
        },
        {
            id: 'P004',
            name: 'Sony Headphones',
            brand: 'Sony',
            category: 'Audio',
            description: 'Wireless Noise Cancelling',
            price: 3500,
            gst: 18,
            stock: 0,
            minStock: 10,
            unit: 'pcs',
            status: 'Active',
            createdAt: '2024-01-08',
            updatedAt: '2024-01-25'
        },
        {
            id: 'P005',
            name: 'Dell Monitor 27"',
            brand: 'Dell',
            category: 'Computers',
            description: '27 inch QHD Monitor',
            price: 18000,
            gst: 18,
            stock: 15,
            minStock: 5,
            unit: 'pcs',
            status: 'Active',
            createdAt: '2024-01-05',
            updatedAt: '2024-01-20'
        }
    ];

    constructor() {
        this.initialize();
    }

    private initialize() {
        const existing = localStorage.getItem(this.STORAGE_KEY);
        if (!existing) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultProducts));
        }
    }

    getAllProducts(): Product[] {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    getProductById(id: string): Product | undefined {
        return this.getAllProducts().find(p => p.id === id);
    }

    addProduct(product: Omit<Product, 'id'>): Product {
        const products = this.getAllProducts();
        const newProduct = { ...product, id: `P${(products.length + 1).toString().padStart(3, '0')}` };
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    }

    updateProduct(id: string, updates: Partial<Product>): void {
        const products = this.getAllProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            this.saveProducts(products);
        }
    }

    deleteProduct(id: string): void {
        const products = this.getAllProducts().filter(p => p.id !== id);
        this.saveProducts(products);
    }

    updateStock(id: string, quantitySold: number): boolean {
        const products = this.getAllProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            if (products[index].stock >= quantitySold) {
                products[index].stock -= quantitySold;
                this.saveProducts(products);
                return true;
            }
        }
        return false;
    }

    private saveProducts(products: Product[]) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    }
}

export const productService = new ProductService();
