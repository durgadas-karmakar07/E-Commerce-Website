import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Review } from '../models/Review.js';
import { Coupon } from '../models/Coupon.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { Notification } from '../models/Notification.js';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { IssueReference } from '../models/IssueReference.js';
import { connectDatabase } from '../config/database.js';

export const seedDatabaseIfEmpty = async () => {
  // Purge any fake mock orders from previous runs so metrics are 100% real-time
  await Order.deleteMany({
    orderNumber: { $in: ['ORD-20260901-1001', 'ORD-20260915-2002', 'ORD-20260920-3003', 'ORD-20260905-4004'] },
  });
  await ReturnRequest.deleteMany({});
  await Product.updateMany({}, { $set: { totalSold: 0 } });

  const productCount = await Product.countDocuments();
  if (productCount > 0) {
    console.log(`[Seed] Database contains ${productCount} products. Starting with clean real-time sales metrics (₹0 revenue, 0 orders).`);
    return;
  }

  console.log('[Seed] Database is empty. Seeding initial catalog and demo users...');
  await seedAllData();
};

export const seedAllData = async () => {
  // Clear existing collections if manually re-seeding
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Coupon.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    Notification.deleteMany({}),
    ReturnRequest.deleteMany({}),
    AuditLog.deleteMany({}),
    IssueReference.deleteMany({}),
  ]);

  console.log('[Seed] Cleared collections.');

  // 1. Create Users (Admin & Customers)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123456', salt);
  const customerPassword = await bcrypt.hash('Customer@123456', salt);

  const admin = await User.create({
    name: 'AURA Store Admin',
    email: 'admin@aura.store',
    phone: '+919876543210',
    passwordHash: adminPassword,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    addresses: [
      {
        name: 'Headquarters Admin Office',
        phone: '+919876543210',
        street: '42, Cyber Gateway, Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
        isDefault: true,
      },
    ],
  });

  const customer1 = await User.create({
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+919811223344',
    passwordHash: customerPassword,
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    addresses: [
      {
        name: 'Priya Sharma',
        phone: '+919811223344',
        street: 'B-402, Lotus Greens, Sector 78',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postalCode: '201301',
        country: 'India',
        isDefault: true,
      },
    ],
  });

  const customer2 = await User.create({
    name: 'Rahul Mehta',
    email: 'rahul.mehta@example.com',
    phone: '+919822334455',
    passwordHash: customerPassword,
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    addresses: [
      {
        name: 'Rahul Mehta',
        phone: '+919822334455',
        street: 'Flat 12, Sunrise Residency, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'India',
        isDefault: true,
      },
    ],
  });

  const customer3 = await User.create({
    name: 'Aarav Patel',
    email: 'aarav.patel@example.com',
    phone: '+919833445566',
    passwordHash: customerPassword,
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    addresses: [
      {
        name: 'Aarav Patel',
        phone: '+919833445566',
        street: '15, Satellite Road, Ambawadi',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postalCode: '380015',
        country: 'India',
        isDefault: true,
      },
    ],
  });

  console.log('[Seed] Users created: 1 Admin, 3 Customers.');

  // 2. Create Categories
  const categoriesData = [
    {
      name: 'Electronics & Audio',
      slug: 'electronics-audio',
      description: 'High-fidelity audio, wireless headphones, and premium personal electronics.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      order: 1,
    },
    {
      name: 'Smart Wearables',
      slug: 'smart-wearables',
      description: 'Fitness trackers, premium smartwatches, and everyday connected tech.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      order: 2,
    },
    {
      name: 'Apparel & Fashion',
      slug: 'apparel-fashion',
      description: 'Designer streetwear, minimalist essentials, and sustainable fabrics.',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
      order: 3,
    },
    {
      name: 'Footwear & Sneakers',
      slug: 'footwear-sneakers',
      description: 'Cushioned running shoes, classic leather sneakers, and urban boots.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      order: 4,
    },
    {
      name: 'Home & Workspace',
      slug: 'home-workspace',
      description: 'Ergonomic accessories, ambient lighting, and modern desk setups.',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
      order: 5,
    },
    {
      name: 'Bags & Accessories',
      slug: 'bags-accessories',
      description: 'Water-resistant backpacks, leather wallets, and travel gear.',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      order: 6,
    },
  ];

  const categories = await Category.insertMany(categoriesData);
  const catMap = new Map(categories.map((c) => [c.slug, c._id]));
  console.log(`[Seed] Created ${categories.length} categories.`);

  // 3. Create 22 Products across categories
  const productsData = [
    // Electronics & Audio (5 products)
    {
      title: 'AURA SonicPro Wireless ANC Headphones',
      slug: 'aura-sonicpro-wireless-anc-headphones',
      description: 'Engineered for audio purists. Features hybrid active noise cancellation, custom 45mm beryllium drivers, 40-hour battery life, and ultra-plush memory foam earcups for all-day listening fatigue prevention.',
      shortDescription: 'Hybrid Active Noise Cancelling with 40-hr battery life.',
      category: catMap.get('electronics-audio'),
      subcategory: 'Headphones',
      brand: 'AURA Acoustics',
      sku: 'AUR-HP-001',
      mrp: 18999,
      sellingPrice: 14499,
      stock: 45,
      lowStockThreshold: 10,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
      ],
      videoUrl: '',
      tags: ['audio', 'anc', 'wireless', 'headphones', 'bluetooth', 'premium'],
      variants: [
        { name: 'Matte Midnight Black', sku: 'AUR-HP-001-BLK', price: 14499, stock: 25, attributes: { Color: 'Black' } },
        { name: 'Platinum Silver', sku: 'AUR-HP-001-SLV', price: 14499, stock: 20, attributes: { Color: 'Silver' } },
      ],
      specifications: [
        { key: 'Driver Size', value: '45mm Custom Beryllium' },
        { key: 'Battery Life', value: 'Up to 40 Hours (ANC On)' },
        { key: 'Bluetooth Version', value: '5.3 with Multipoint' },
        { key: 'Charging', value: 'Fast USB-C (10 mins = 5 hrs)' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.8,
      reviewCount: 38,
      totalSold: 120,
    },
    {
      title: 'AURA Studio Pulse Hi-Fi Desktop Speakers',
      slug: 'aura-studio-pulse-hifi-desktop-speakers',
      description: 'Compact acoustic marvels designed for near-field monitoring and rich room-filling audio. Dual passive radiators with dedicated 60W class-D amplification and optical/Bluetooth inputs.',
      shortDescription: '60W RMS Class-D powered studio-grade desktop monitors.',
      category: catMap.get('electronics-audio'),
      subcategory: 'Speakers',
      brand: 'AURA Acoustics',
      sku: 'AUR-SPK-002',
      mrp: 14999,
      sellingPrice: 11999,
      stock: 18,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['speakers', 'desktop', 'audio', 'studio', 'bluetooth'],
      variants: [
        { name: 'Walnut Wood', sku: 'AUR-SPK-002-WLN', price: 11999, stock: 10, attributes: { Finish: 'Walnut' } },
        { name: 'Piano Black', sku: 'AUR-SPK-002-BLK', price: 11999, stock: 8, attributes: { Finish: 'Black' } },
      ],
      specifications: [
        { key: 'Power Output', value: '60W RMS' },
        { key: 'Inputs', value: 'Bluetooth 5.2, Optical, RCA, 3.5mm AUX' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.7,
      reviewCount: 22,
      totalSold: 64,
    },
    {
      title: 'AURA Pods Neo True Wireless Earbuds',
      slug: 'aura-pods-neo-true-wireless-earbuds',
      description: 'Featherweight 3.8g ergonomic in-ear design with 6-mic environmental noise cancellation for crystal clear voice calls, wireless charging case, and IPX5 sweat resistance.',
      shortDescription: 'Ultralight earbuds with 32-hour playback and wireless charging.',
      category: catMap.get('electronics-audio'),
      subcategory: 'Earbuds',
      brand: 'AURA Acoustics',
      sku: 'AUR-POD-003',
      mrp: 5999,
      sellingPrice: 3499,
      stock: 60,
      lowStockThreshold: 15,
      images: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['earbuds', 'wireless', 'tws', 'audio', 'portable'],
      variants: [
        { name: 'Ceramic White', sku: 'AUR-POD-003-WHT', price: 3499, stock: 35, attributes: { Color: 'White' } },
        { name: 'Graphite Grey', sku: 'AUR-POD-003-GRY', price: 3499, stock: 25, attributes: { Color: 'Grey' } },
      ],
      specifications: [
        { key: 'Water Resistance', value: 'IPX5' },
        { key: 'Playtime', value: '8 hours (32 hours with case)' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.6,
      reviewCount: 49,
      totalSold: 210,
    },
    {
      title: 'AURA StreamMic USB Condenser Microphone',
      slug: 'aura-streammic-usb-condenser-microphone',
      description: 'Studio-grade 24-bit/96kHz recording capsule with cardioid pickup pattern, tap-to-mute sensor, built-in shock mount, and customizable RGB status ring.',
      shortDescription: 'Broadcast quality condenser mic for podcasts, streaming, and calls.',
      category: catMap.get('electronics-audio'),
      subcategory: 'Microphones',
      brand: 'AURA Gear',
      sku: 'AUR-MIC-004',
      mrp: 8499,
      sellingPrice: 5999,
      stock: 22,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['mic', 'streaming', 'podcast', 'recording', 'usb'],
      variants: [],
      specifications: [
        { key: 'Sample Rate', value: '24-bit / 96kHz' },
        { key: 'Polar Pattern', value: 'Cardioid' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.9,
      reviewCount: 16,
      totalSold: 50,
    },
    {
      title: 'AURA Soundbar Immersion 120W with Subwoofer',
      slug: 'aura-soundbar-immersion-120w',
      description: 'Transform your living room into a cinematic theater. Dolby Audio tuned, wireless wooden subwoofer, HDMI eARC, and dedicated movie/voice EQ modes.',
      shortDescription: '2.1 Channel 120W Dolby Audio soundbar with wireless sub.',
      category: catMap.get('electronics-audio'),
      subcategory: 'Home Audio',
      brand: 'AURA Acoustics',
      sku: 'AUR-SBAR-005',
      mrp: 16999,
      sellingPrice: 12499,
      stock: 14,
      lowStockThreshold: 4,
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['soundbar', 'home-theater', 'audio', 'tv'],
      variants: [],
      specifications: [
        { key: 'Total Power', value: '120W Peak' },
        { key: 'Audio Support', value: 'Dolby Digital 2.1' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.5,
      reviewCount: 19,
      totalSold: 42,
    },

    // Smart Wearables (4 products)
    {
      title: 'AURA Apex Titanium Smartwatch 47mm',
      slug: 'aura-apex-titanium-smartwatch-47mm',
      description: 'Aerospace-grade grade 5 titanium chassis, sapphire crystal display, dual-frequency multi-GNSS GPS tracking, 14-day battery life, and comprehensive ECG & blood oxygen telemetry.',
      shortDescription: 'Titanium chassis, sapphire glass, 14-day battery & ECG.',
      category: catMap.get('smart-wearables'),
      subcategory: 'Smartwatches',
      brand: 'AURA Tech',
      sku: 'AUR-WTCH-006',
      mrp: 29999,
      sellingPrice: 23999,
      stock: 3, // Low stock demo!
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['smartwatch', 'titanium', 'wearables', 'fitness', 'gps'],
      variants: [
        { name: 'Titanium Grey with Ocean Band', sku: 'AUR-WTCH-006-GRY', price: 23999, stock: 2, attributes: { Strap: 'Ocean' } },
        { name: 'Stealth Black with Leather Strap', sku: 'AUR-WTCH-006-BLK', price: 24999, stock: 1, attributes: { Strap: 'Leather' } },
      ],
      specifications: [
        { key: 'Chassis Material', value: 'Grade 5 Titanium' },
        { key: 'Water Rating', value: '10 ATM (100 meters)' },
        { key: 'Battery', value: 'Up to 14 Days Normal Usage' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.9,
      reviewCount: 42,
      totalSold: 135,
    },
    {
      title: 'AURA Halo Smart Ring Health & Sleep Tracker',
      slug: 'aura-halo-smart-ring-tracker',
      description: 'Discreet titanium ring sensor delivering clinical-grade sleep phase analysis, HRV recovery metrics, core body temperature trends, and step monitoring in a featherlight 4g profile.',
      shortDescription: 'Titanium smart ring for continuous HRV, sleep & temperature.',
      category: catMap.get('smart-wearables'),
      subcategory: 'Smart Rings',
      brand: 'AURA Tech',
      sku: 'AUR-RNG-007',
      mrp: 19999,
      sellingPrice: 15999,
      stock: 25,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['smart-ring', 'sleep', 'recovery', 'health', 'fitness'],
      variants: [
        { name: 'Size 8 - Matte Stealth', sku: 'AUR-RNG-007-S8', price: 15999, stock: 8, attributes: { Size: '8' } },
        { name: 'Size 10 - Matte Stealth', sku: 'AUR-RNG-007-S10', price: 15999, stock: 10, attributes: { Size: '10' } },
        { name: 'Size 12 - Matte Stealth', sku: 'AUR-RNG-007-S12', price: 15999, stock: 7, attributes: { Size: '12' } },
      ],
      specifications: [
        { key: 'Material', value: 'Durable Titanium PVD' },
        { key: 'Battery', value: '6 days per charge' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.7,
      reviewCount: 28,
      totalSold: 88,
    },
    {
      title: 'AURA Pulse Band Active Fitness Tracker',
      slug: 'aura-pulse-band-active-tracker',
      description: 'Vibrant 1.47-inch AMOLED color touch display with 120 sports modes, SpO2 tracking, 24/7 heart rate alerts, and magnetic charging.',
      shortDescription: 'Slim AMOLED fitness band with 14-day battery and 120 sports modes.',
      category: catMap.get('smart-wearables'),
      subcategory: 'Fitness Bands',
      brand: 'AURA Tech',
      sku: 'AUR-BND-008',
      mrp: 3999,
      sellingPrice: 2499,
      stock: 50,
      lowStockThreshold: 10,
      images: [
        'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['fitness-band', 'wearable', 'step-counter', 'heart-rate'],
      variants: [],
      specifications: [
        { key: 'Display', value: '1.47" AMOLED' },
        { key: 'Water Resistance', value: '5 ATM' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.4,
      reviewCount: 31,
      totalSold: 140,
    },
    {
      title: 'AURA Vision Smart Audio Sunglasses',
      slug: 'aura-vision-smart-audio-sunglasses',
      description: 'Open-ear acoustic speakers built seamlessly into polarized acetate frames. Block 99% UVA/B rays while taking calls and listening to music with zero earbud occlusion.',
      shortDescription: 'Polarized UV400 sunglasses with integrated directional speakers.',
      category: catMap.get('smart-wearables'),
      subcategory: 'Smart Glasses',
      brand: 'AURA Tech',
      sku: 'AUR-GLS-009',
      mrp: 12999,
      sellingPrice: 8999,
      stock: 12,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['sunglasses', 'audio', 'wearables', 'tech'],
      variants: [],
      specifications: [
        { key: 'Lens Protection', value: 'Polarized UV400' },
        { key: 'Battery', value: '5.5 hours listening' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.3,
      reviewCount: 11,
      totalSold: 28,
    },

    // Apparel & Fashion (4 products)
    {
      title: 'AURA Heavyweight Supima Cotton Hoodie',
      slug: 'aura-heavyweight-supima-cotton-hoodie',
      description: 'Crafted from 480 GSM American Supima extra-long staple combed cotton. Pre-shrunk with double-needle ribbed cuffs and hem, custom matte eyelets, and a tailored streetwear silhouette.',
      shortDescription: '480 GSM ultra-dense luxury Supima cotton hoodie.',
      category: catMap.get('apparel-fashion'),
      subcategory: 'Hoodies',
      brand: 'AURA Studio',
      sku: 'AUR-APP-010',
      mrp: 4999,
      sellingPrice: 3299,
      stock: 40,
      lowStockThreshold: 8,
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['hoodie', 'apparel', 'streetwear', 'cotton', 'winter'],
      variants: [
        { name: 'Oatmeal Heather / M', sku: 'AUR-APP-010-OT-M', price: 3299, stock: 15, attributes: { Size: 'M', Color: 'Oatmeal' } },
        { name: 'Oatmeal Heather / L', sku: 'AUR-APP-010-OT-L', price: 3299, stock: 15, attributes: { Size: 'L', Color: 'Oatmeal' } },
        { name: 'Obsidian Black / L', sku: 'AUR-APP-010-OB-L', price: 3299, stock: 10, attributes: { Size: 'L', Color: 'Black' } },
      ],
      specifications: [
        { key: 'Fabric', value: '100% Supima Combed Cotton' },
        { key: 'Weight', value: '480 GSM' },
        { key: 'Origin', value: 'Ethically knit and dyed in India' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.8,
      reviewCount: 35,
      totalSold: 112,
    },
    {
      title: 'AURA Minimalist Everyday Oversized Tee',
      slug: 'aura-minimalist-everyday-oversized-tee',
      description: '240 GSM organic cotton t-shirt with a relaxed drop-shoulder cut, reinforced collar that will not bacon, and natural breathable touch.',
      shortDescription: '240 GSM organic combed cotton drop-shoulder essential tee.',
      category: catMap.get('apparel-fashion'),
      subcategory: 'T-Shirts',
      brand: 'AURA Studio',
      sku: 'AUR-APP-011',
      mrp: 1999,
      sellingPrice: 1299,
      stock: 65,
      lowStockThreshold: 10,
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['tshirt', 'casual', 'streetwear', 'cotton'],
      variants: [
        { name: 'Sage Green / M', sku: 'AUR-APP-011-SG-M', price: 1299, stock: 25, attributes: { Size: 'M', Color: 'Sage' } },
        { name: 'Sage Green / L', sku: 'AUR-APP-011-SG-L', price: 1299, stock: 20, attributes: { Size: 'L', Color: 'Sage' } },
        { name: 'Bone White / L', sku: 'AUR-APP-011-BW-L', price: 1299, stock: 20, attributes: { Size: 'L', Color: 'White' } },
      ],
      specifications: [
        { key: 'Material', value: '100% Organic Ring-spun Cotton' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.6,
      reviewCount: 29,
      totalSold: 190,
    },
    {
      title: 'AURA Technical All-Weather Windbreaker',
      slug: 'aura-technical-all-weather-windbreaker',
      description: 'DWR-coated water-repellent ripstop nylon shell with taped seam zippers, stowable hood, and breathable underarm ventilation grommets.',
      shortDescription: 'Lightweight water-resistant technical windbreaker.',
      category: catMap.get('apparel-fashion'),
      subcategory: 'Jackets',
      brand: 'AURA Studio',
      sku: 'AUR-APP-012',
      mrp: 6999,
      sellingPrice: 4799,
      stock: 20,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['jacket', 'windbreaker', 'outerwear', 'waterproof'],
      variants: [],
      specifications: [
        { key: 'Material', value: '3-Layer Ripstop Nylon' },
        { key: 'Waterproof Rating', value: '10,000mm' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.7,
      reviewCount: 14,
      totalSold: 39,
    },
    {
      title: 'AURA Relaxed Fit Japanese Selvedge Denim',
      slug: 'aura-relaxed-fit-selvedge-denim',
      description: '14oz raw selvedge denim woven on vintage shuttle looms in Okayama. Develops unique, high-contrast personalized fading over wear.',
      shortDescription: '14oz authentic raw selvedge denim with button fly.',
      category: catMap.get('apparel-fashion'),
      subcategory: 'Jeans',
      brand: 'AURA Denim',
      sku: 'AUR-APP-013',
      mrp: 8999,
      sellingPrice: 6499,
      stock: 15,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['denim', 'jeans', 'selvedge', 'apparel'],
      variants: [],
      specifications: [
        { key: 'Denim Weight', value: '14oz Right-Hand Twill' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.8,
      reviewCount: 18,
      totalSold: 45,
    },

    // Footwear & Sneakers (3 products)
    {
      title: 'AURA Strata V2 Cloud-Foam Runner Sneakers',
      slug: 'aura-strata-v2-cloudfoam-runners',
      description: 'Supercritical nitrogen-infused EVA midsole delivers up to 78% energy return with every stride. Breathable engineered jacquard knit upper with TPU torsional stability plate.',
      shortDescription: 'Supercritical nitrogen foam cushioned daily runners.',
      category: catMap.get('footwear-sneakers'),
      subcategory: 'Running Shoes',
      brand: 'AURA Motion',
      sku: 'AUR-SHOE-014',
      mrp: 7999,
      sellingPrice: 5499,
      stock: 28,
      lowStockThreshold: 6,
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['shoes', 'sneakers', 'running', 'comfort', 'cushion'],
      variants: [
        { name: 'Crimson Red / UK 8', sku: 'AUR-SHOE-014-RED-8', price: 5499, stock: 12, attributes: { Size: 'UK 8', Color: 'Red' } },
        { name: 'Crimson Red / UK 9', sku: 'AUR-SHOE-014-RED-9', price: 5499, stock: 16, attributes: { Size: 'UK 9', Color: 'Red' } },
      ],
      specifications: [
        { key: 'Heel-to-Toe Drop', value: '8mm' },
        { key: 'Weight', value: '235g (Men UK 8)' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.8,
      reviewCount: 52,
      totalSold: 165,
    },
    {
      title: 'AURA Classic Full-Grain Leather Low-Tops',
      slug: 'aura-classic-leather-low-top-sneakers',
      description: 'Italian nappa calfskin leather handcrafted with Margom rubber cupsole and waxed cotton laces. The timeless court shoe silhouette that pairs with everything.',
      shortDescription: 'Full-grain Italian nappa leather minimal court sneakers.',
      category: catMap.get('footwear-sneakers'),
      subcategory: 'Casual Sneakers',
      brand: 'AURA Craft',
      sku: 'AUR-SHOE-015',
      mrp: 9999,
      sellingPrice: 6999,
      stock: 19,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['sneakers', 'leather', 'luxury', 'minimalist'],
      variants: [],
      specifications: [
        { key: 'Upper', value: 'Full-Grain Italian Calfskin' },
        { key: 'Sole', value: 'Stitched Margom Rubber' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.9,
      reviewCount: 24,
      totalSold: 72,
    },
    {
      title: 'AURA Horizon All-Terrain Trail Boot',
      slug: 'aura-horizon-all-terrain-trail-boot',
      description: 'Vibram Megagrip lugged outsole paired with water-resistant nubuck leather and breathable eVent membrane. Built for alpine trails and unpredictable winter city commutes.',
      shortDescription: 'Vibram outsole waterproof nubuck trail hiking boots.',
      category: catMap.get('footwear-sneakers'),
      subcategory: 'Boots',
      brand: 'AURA Motion',
      sku: 'AUR-SHOE-016',
      mrp: 11999,
      sellingPrice: 8499,
      stock: 11,
      lowStockThreshold: 4,
      images: [
        'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['boots', 'outdoor', 'hiking', 'waterproof'],
      variants: [],
      specifications: [
        { key: 'Outsole', value: 'Vibram Megagrip 5mm Lugs' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.7,
      reviewCount: 15,
      totalSold: 33,
    },

    // Home & Workspace (3 products)
    {
      title: 'AURA Lumina Smart LED ScreenBar Light',
      slug: 'aura-lumina-smart-led-screenbar-light',
      description: 'Asymmetric optical design illuminates only your desk without screen glare. Touch controls, auto-dimming ambient light sensor, and stepless color temperature adjustment from 2700K to 6500K.',
      shortDescription: 'Zero-glare monitor-mounted desk lamp with wireless dial.',
      category: catMap.get('home-workspace'),
      subcategory: 'Lighting',
      brand: 'AURA Space',
      sku: 'AUR-DSK-017',
      mrp: 4999,
      sellingPrice: 3499,
      stock: 35,
      lowStockThreshold: 8,
      images: [
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['desk-setup', 'lighting', 'workspace', 'productivity'],
      variants: [],
      specifications: [
        { key: 'Color Temperature', value: '2700K - 6500K' },
        { key: 'Power Input', value: 'USB 5V/1A' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.9,
      reviewCount: 33,
      totalSold: 98,
    },
    {
      title: 'AURA Ergonomic Aluminum Laptop & Tablet Stand',
      slug: 'aura-ergonomic-aluminum-laptop-stand',
      description: 'Precision CNC-machined aerospace aluminum unibody with 360-degree rotation click mechanism, heat-dissipating cooling cutouts, and anti-slip silicone pads.',
      shortDescription: 'CNC aluminum 360-degree rotatable ergonomic laptop riser.',
      category: catMap.get('home-workspace'),
      subcategory: 'Desk Accessories',
      brand: 'AURA Space',
      sku: 'AUR-DSK-018',
      mrp: 3499,
      sellingPrice: 2299,
      stock: 45,
      lowStockThreshold: 10,
      images: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['stand', 'laptop', 'workspace', 'ergonomics'],
      variants: [],
      specifications: [
        { key: 'Compatibility', value: 'Laptops up to 17 inches' },
        { key: 'Weight Capacity', value: 'Up to 10kg' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.8,
      reviewCount: 27,
      totalSold: 110,
    },
    {
      title: 'AURA Hand-Poured Soy Wax Amber & Moss Candle',
      slug: 'aura-handpoured-soy-wax-candle',
      description: 'Slow-burning natural soy wax infused with essential oils of oakmoss, amber, and cedarwood. Crackling FSC-certified cedar wood wick with 55+ hour burn time in a reusable amber glass jar.',
      shortDescription: '100% natural soy wax aromatherapy candle with wooden wick.',
      category: catMap.get('home-workspace'),
      subcategory: 'Aromatherapy',
      brand: 'AURA Living',
      sku: 'AUR-HME-019',
      mrp: 1499,
      sellingPrice: 999,
      stock: 50,
      lowStockThreshold: 10,
      images: [
        'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['candle', 'aromatherapy', 'home', 'living', 'gift'],
      variants: [],
      specifications: [
        { key: 'Wax Type', value: '100% Natural Soy Wax' },
        { key: 'Burn Time', value: 'Approx. 55-60 Hours' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.6,
      reviewCount: 20,
      totalSold: 85,
    },

    // Bags & Accessories (3 products)
    {
      title: 'AURA Commuter Pro Waterproof 26L Backpack',
      slug: 'aura-commuter-pro-waterproof-backpack',
      description: 'Constructed from recycled Cordura ballistic fabric with YKK AquaGuard water-resistant zippers. Dedicated padded 16-inch laptop compartment, hidden passport security pocket, and luggage pass-through.',
      shortDescription: '26L Cordura water-resistant daily commuter & travel pack.',
      category: catMap.get('bags-accessories'),
      subcategory: 'Backpacks',
      brand: 'AURA Gear',
      sku: 'AUR-BAG-020',
      mrp: 7999,
      sellingPrice: 5299,
      stock: 22,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['backpack', 'travel', 'commute', 'waterproof', 'laptop-bag'],
      variants: [],
      specifications: [
        { key: 'Capacity', value: '26 Liters' },
        { key: 'Fabric', value: '840D Recycled Ballistic Cordura' },
      ],
      isFeatured: true,
      isPublished: true,
      averageRating: 4.9,
      reviewCount: 41,
      totalSold: 125,
    },
    {
      title: 'AURA MagSafe Slim Italian Leather Cardholder',
      slug: 'aura-magsafe-slim-leather-cardholder',
      description: 'Top-grain vegetable-tanned Italian leather with strong built-in N52 neodymium magnets. Holds up to 3 cards securely with thumb slot for quick access and full RFID blocking.',
      shortDescription: 'Magnetic MagSafe RFID-blocking vegetable-tanned cardholder.',
      category: catMap.get('bags-accessories'),
      subcategory: 'Wallets',
      brand: 'AURA Craft',
      sku: 'AUR-ACC-021',
      mrp: 2499,
      sellingPrice: 1599,
      stock: 38,
      lowStockThreshold: 8,
      images: [
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['wallet', 'cardholder', 'leather', 'magsafe'],
      variants: [],
      specifications: [
        { key: 'Card Capacity', value: '3-4 Cards + Folded Bills' },
        { key: 'Protection', value: 'Full RFID Shielding' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.7,
      reviewCount: 26,
      totalSold: 94,
    },
    {
      title: 'AURA Horizon UV Polarized Aviator Sunglasses',
      slug: 'aura-horizon-uv-polarized-aviators',
      description: 'Ultralight Japanese stainless steel wireframe with spring hinges and scratch-resistant polarized glass lenses offering 100% UVA/UVB protection.',
      shortDescription: 'Classic wireframe aviators with scratch-resistant lenses.',
      category: catMap.get('bags-accessories'),
      subcategory: 'Eyewear',
      brand: 'AURA Craft',
      sku: 'AUR-ACC-022',
      mrp: 4499,
      sellingPrice: 2999,
      stock: 30,
      lowStockThreshold: 5,
      images: [
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['sunglasses', 'aviators', 'fashion', 'eyewear'],
      variants: [],
      specifications: [
        { key: 'Lens', value: 'Polarized Scratch-Resistant Glass' },
      ],
      isFeatured: false,
      isPublished: true,
      averageRating: 4.8,
      reviewCount: 19,
      totalSold: 67,
    },
  ];

  // Ensure all products start at 0 sold for 100% real-time sales tracking
  const cleanProductsData = productsData.map((p) => ({ ...p, totalSold: 0 }));
  const products = await Product.insertMany(cleanProductsData);
  console.log(`[Seed] Created ${products.length} products with 0 initial sold count.`);

  // 4. Create Coupons
  const couponsData = [
    {
      code: 'WELCOME10',
      description: '10% instant discount on your first shopping spree',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 999,
      maxDiscountAmount: 500,
      validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 5000,
      usageCount: 142,
      perCustomerLimit: 1,
      isActive: true,
    },
    {
      code: 'FESTIVE25',
      description: 'Special 25% off festive celebration discount',
      discountType: 'percentage',
      discountValue: 25,
      minOrderAmount: 2999,
      maxDiscountAmount: 2000,
      validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      usageCount: 89,
      perCustomerLimit: 1,
      isActive: true,
    },
    {
      code: 'FLAT500',
      description: 'Flat ₹500 discount on orders above ₹2,499',
      discountType: 'fixed',
      discountValue: 500,
      minOrderAmount: 2499,
      validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 2000,
      usageCount: 56,
      perCustomerLimit: 2,
      isActive: true,
    },
  ];

  const cleanCouponsData = couponsData.map((c) => ({ ...c, usageCount: 0 }));
  await Coupon.insertMany(cleanCouponsData);
  console.log(`[Seed] Created ${couponsData.length} promotional coupons with 0 initial usage.`);

  // 5. Clean real-time initialization: Zero fake orders or fake revenue seeded.
  // All orders, revenue, sales, and analytics will be registered in 100% real-time when users make purchases.
  console.log('[Seed] Zero mock orders seeded. Sales and revenues start at ₹0 and populate in 100% real-time.');

  const p1 = products[0];
  const p2 = products[2];
  const p3 = products[5];

  // 7. Create Reviews
  const reviewsData = [
    {
      product: p1._id,
      user: customer1._id,
      rating: 5,
      title: 'Remarkable noise cancellation and soundstage!',
      comment: 'I use these for my daily 1.5-hour metro commute in Bengaluru. The active noise cancellation completely silences engine hum and background chatter. Battery lasts easily a whole work week. Highly recommended!',
      media: [],
      isVerifiedPurchase: true,
      status: 'published',
      adminResponse: 'Thank you Priya! We are thrilled to hear the SonicPro is keeping your commute peaceful.',
    },
    {
      product: p1._id,
      user: customer2._id,
      rating: 4,
      title: 'Great clarity and build quality',
      comment: 'Audio fidelity is superb. The beryllium drivers provide punchy sub-bass without overpowering mids. Earcups are very comfortable.',
      media: [],
      isVerifiedPurchase: true,
      status: 'published',
    },
    {
      product: p2._id,
      user: customer1._id,
      rating: 5,
      title: 'Best TWS under 5k rupees',
      comment: 'Mic quality on Zoom calls is crisp. The wireless charging on the case is a great touch.',
      media: [],
      isVerifiedPurchase: true,
      status: 'published',
    },
    {
      product: p3._id,
      user: customer2._id,
      rating: 5,
      title: 'Stunning titanium build and battery life',
      comment: 'This watch easily matches high-end Swiss and Garmin outdoor wearables. The GPS is pinpoint accurate during my morning runs.',
      media: [],
      isVerifiedPurchase: true,
      status: 'published',
      adminResponse: 'We appreciate the feedback, Rahul! Enjoy your runs with the Apex Titanium.',
    },
  ];

  await Review.insertMany(reviewsData);
  console.log(`[Seed] Created ${reviewsData.length} reviews.`);

  // 8. Create Initial Inventory Records
  const inventoryTxData = [
    {
      product: p1._id,
      sku: p1.sku,
      type: 'restock',
      previousStock: 0,
      quantityChanged: 50,
      newStock: 50,
      reason: 'Initial warehouse shipment intake',
      user: admin._id,
    },
    {
      product: p3._id,
      sku: p3.sku,
      type: 'restock',
      previousStock: 0,
      quantityChanged: 5,
      newStock: 5,
      reason: 'Initial intake for Apex Titanium watch',
      user: admin._id,
    },
  ];

  await InventoryTransaction.insertMany(inventoryTxData);

  // 9. Create Notifications
  const notificationsData = [
    {
      recipient: null, // Broadcast to Admin
      title: 'Store Platform Initialized',
      message: 'Catalog loaded with 22 premium products. Real-time telemetry and order synchronization active.',
      type: 'system',
      link: '/admin/products',
      isRead: false,
    },
  ];

  await Notification.insertMany(notificationsData);

  // 10. Create Audit Logs
  const auditLogsData = [
    {
      user: admin._id,
      userName: admin.name,
      userRole: 'admin',
      action: 'SYSTEM_INITIALIZATION',
      resource: 'System',
      resourceId: 'INIT-2026',
      changes: { note: 'Initial platform setup and catalog provisioning completed.' },
      createdAt: new Date(Date.now() - 30 * 86400000),
    },
    {
      user: admin._id,
      userName: admin.name,
      userRole: 'admin',
      action: 'CREATE_COUPON',
      resource: 'Coupon',
      resourceId: 'FESTIVE25',
      changes: { code: 'FESTIVE25', discountValue: 25 },
      createdAt: new Date(Date.now() - 10 * 86400000),
    },
  ];

  await AuditLog.insertMany(auditLogsData);

  // 11. Create a resolved sample issue so the Bugs/Errors board displays real structure
  await IssueReference.create({
    errorId: 'ERR-INIT-001',
    title: 'PaymentGatewayTimeout (Resolved)',
    message: 'Temporary socket timeout with external payment provider during high-traffic load test.',
    stack: 'Error: Socket timeout at TCPConnectWrap.afterConnect',
    severity: 'medium',
    route: '/api/payments/verify',
    method: 'POST',
    statusCode: 504,
    status: 'resolved',
    occurrences: 2,
    lastOccurredAt: new Date(Date.now() - 5 * 86400000),
    environment: 'development',
  });

  console.log('[Seed] Seeding completed successfully!');
};

// Self execution when run directly via npm run seed
if (process.argv[1]?.includes('seedData')) {
  (async () => {
    try {
      await connectDatabase();
      await seedAllData();
      console.log('[Seed] Standalone seed run completed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Standalone seed run failed:', err);
      process.exit(1);
    }
  })();
}

