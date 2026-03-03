const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('./models/User');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');
const Employee = require('./models/Employee');
const Sale = require('./models/Sale');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Supplier.deleteMany({});
        await Product.deleteMany({});
        await Employee.deleteMany({});
        await Sale.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Create default admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@erp.com',
            password: 'Admin@123',
            role: 'admin',
        });

        // Create HR and Sales users
        await User.create({
            name: 'HR Manager',
            email: 'hr@erp.com',
            password: 'Hr@12345',
            role: 'hr',
        });

        const salesUser = await User.create({
            name: 'Sales Executive',
            email: 'sales@erp.com',
            password: 'Sales@123',
            role: 'sales',
        });

        console.log('👤 Users created');

        // Create categories
        const categories = await Category.insertMany([
            { name: 'Electronics', description: 'Electronic devices and accessories' },
            { name: 'Office Supplies', description: 'Office stationery and supplies' },
            { name: 'Furniture', description: 'Office and home furniture' },
            { name: 'Software', description: 'Software licenses and subscriptions' },
            { name: 'Networking', description: 'Networking equipment and cables' },
        ]);
        console.log('📁 Categories created');

        // Create suppliers
        const suppliers = await Supplier.insertMany([
            { name: 'TechCorp India', email: 'info@techcorp.in', phone: '9876543210', address: 'Mumbai, India', company: 'TechCorp' },
            { name: 'Office World', email: 'sales@officeworld.com', phone: '9123456780', address: 'Delhi, India', company: 'Office World Pvt Ltd' },
            { name: 'FurnishPro', email: 'contact@furnishpro.in', phone: '8765432190', address: 'Bangalore, India', company: 'FurnishPro Industries' },
        ]);
        console.log('🏭 Suppliers created');

        // Create products
        const products = await Product.insertMany([
            { name: 'Laptop HP ProBook', sku: 'LAP-HP-001', description: 'HP ProBook 450 G9', category: categories[0]._id, supplier: suppliers[0]._id, price: 65000, cost: 52000, quantity: 25, lowStockThreshold: 5 },
            { name: 'Dell Monitor 24"', sku: 'MON-DEL-001', description: 'Dell P2422H Monitor', category: categories[0]._id, supplier: suppliers[0]._id, price: 18000, cost: 14000, quantity: 40, lowStockThreshold: 10 },
            { name: 'Wireless Mouse', sku: 'MOU-LOG-001', description: 'Logitech M240', category: categories[0]._id, supplier: suppliers[0]._id, price: 1200, cost: 800, quantity: 100, lowStockThreshold: 20 },
            { name: 'A4 Paper Ream', sku: 'PAP-A4-001', description: '500 sheets A4 paper', category: categories[1]._id, supplier: suppliers[1]._id, price: 350, cost: 250, quantity: 200, lowStockThreshold: 50 },
            { name: 'Pen Pack (10 pcs)', sku: 'PEN-BL-001', description: 'Blue ballpoint pens', category: categories[1]._id, supplier: suppliers[1]._id, price: 150, cost: 90, quantity: 150, lowStockThreshold: 30 },
            { name: 'Office Chair Ergonomic', sku: 'CHR-ERG-001', description: 'Ergonomic office chair', category: categories[2]._id, supplier: suppliers[2]._id, price: 12000, cost: 8500, quantity: 15, lowStockThreshold: 5 },
            { name: 'Standing Desk', sku: 'DSK-STD-001', description: 'Adjustable standing desk', category: categories[2]._id, supplier: suppliers[2]._id, price: 22000, cost: 16000, quantity: 8, lowStockThreshold: 3 },
            { name: 'USB-C Hub', sku: 'HUB-USC-001', description: '7-in-1 USB-C hub', category: categories[0]._id, supplier: suppliers[0]._id, price: 2500, cost: 1600, quantity: 60, lowStockThreshold: 15 },
            { name: 'Cat6 Cable 10m', sku: 'CAB-C6-001', description: 'Cat6 ethernet cable', category: categories[4]._id, supplier: suppliers[0]._id, price: 500, cost: 300, quantity: 3, lowStockThreshold: 10 },
            { name: 'Webcam HD', sku: 'CAM-HD-001', description: 'Full HD 1080p webcam', category: categories[0]._id, supplier: suppliers[0]._id, price: 3500, cost: 2400, quantity: 30, lowStockThreshold: 8 },
        ]);
        console.log('📦 Products created');

        // Create employees
        await Employee.insertMany([
            { name: 'Rajesh Kumar', email: 'rajesh@company.com', phone: '9876543001', department: 'Engineering', position: 'Senior Developer', salary: 85000, joiningDate: new Date('2023-01-15'), status: 'active' },
            { name: 'Priya Sharma', email: 'priya@company.com', phone: '9876543002', department: 'Sales', position: 'Sales Manager', salary: 65000, joiningDate: new Date('2023-03-10'), status: 'active' },
            { name: 'Amit Patel', email: 'amit@company.com', phone: '9876543003', department: 'HR', position: 'HR Executive', salary: 55000, joiningDate: new Date('2023-05-20'), status: 'active' },
            { name: 'Sneha Reddy', email: 'sneha@company.com', phone: '9876543004', department: 'Marketing', position: 'Marketing Lead', salary: 70000, joiningDate: new Date('2023-02-01'), status: 'active' },
            { name: 'Mohammed Ali', email: 'ali@company.com', phone: '9876543005', department: 'Finance', position: 'Accountant', salary: 50000, joiningDate: new Date('2023-06-12'), status: 'active' },
            { name: 'Divya Nair', email: 'divya@company.com', phone: '9876543006', department: 'Engineering', position: 'Junior Developer', salary: 45000, joiningDate: new Date('2024-01-08'), status: 'active' },
            { name: 'Suresh Iyer', email: 'suresh@company.com', phone: '9876543007', department: 'Operations', position: 'Operations Manager', salary: 60000, joiningDate: new Date('2023-04-15'), status: 'active' },
            { name: 'Kavita Singh', email: 'kavita@company.com', phone: '9876543008', department: 'Support', position: 'Support Lead', salary: 48000, joiningDate: new Date('2023-07-22'), status: 'active' },
        ]);
        console.log('👥 Employees created');

        // Create sample sales
        const sampleSales = [
            {
                invoiceNumber: 'INV-202603-0001',
                items: [
                    { product: products[0]._id, productName: products[0].name, quantity: 2, price: products[0].price, total: products[0].price * 2 },
                    { product: products[1]._id, productName: products[1].name, quantity: 2, price: products[1].price, total: products[1].price * 2 },
                ],
                subtotal: 166000,
                taxRate: 18,
                taxAmount: 29880,
                discount: 5000,
                total: 190880,
                paymentStatus: 'paid',
                paymentMethod: 'bank_transfer',
                customerName: 'Infosys Ltd',
                customerPhone: '9988776655',
                createdBy: salesUser._id,
            },
            {
                invoiceNumber: 'INV-202603-0002',
                items: [
                    { product: products[2]._id, productName: products[2].name, quantity: 10, price: products[2].price, total: products[2].price * 10 },
                    { product: products[3]._id, productName: products[3].name, quantity: 20, price: products[3].price, total: products[3].price * 20 },
                ],
                subtotal: 19000,
                taxRate: 18,
                taxAmount: 3420,
                discount: 0,
                total: 22420,
                paymentStatus: 'paid',
                paymentMethod: 'upi',
                customerName: 'TCS Office',
                customerPhone: '9876501234',
                createdBy: salesUser._id,
            },
            {
                invoiceNumber: 'INV-202603-0003',
                items: [
                    { product: products[5]._id, productName: products[5].name, quantity: 5, price: products[5].price, total: products[5].price * 5 },
                ],
                subtotal: 60000,
                taxRate: 18,
                taxAmount: 10800,
                discount: 2000,
                total: 68800,
                paymentStatus: 'pending',
                paymentMethod: 'card',
                customerName: 'StartupHub',
                customerPhone: '9012345678',
                createdBy: admin._id,
            },
        ];

        await Sale.insertMany(sampleSales);
        console.log('💰 Sales created');

        console.log('\n========================================');
        console.log('✅ SEED COMPLETED SUCCESSFULLY!');
        console.log('========================================');
        console.log('\n🔐 Default Login Credentials:');
        console.log('┌─────────────────────────────────────┐');
        console.log('│ Admin:  admin@erp.com / Admin@123    │');
        console.log('│ HR:     hr@erp.com / Hr@12345        │');
        console.log('│ Sales:  sales@erp.com / Sales@123    │');
        console.log('└─────────────────────────────────────┘');
        console.log('\n📊 Data Created:');
        console.log('   • 3 Users (Admin, HR, Sales)');
        console.log('   • 5 Categories');
        console.log('   • 3 Suppliers');
        console.log('   • 10 Products');
        console.log('   • 8 Employees');
        console.log('   • 3 Sample Sales\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed Error:', error);
        process.exit(1);
    }
};

seedDB();
