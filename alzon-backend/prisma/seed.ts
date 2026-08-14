import { PrismaClient, UserRole, BusinessType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ALLZON database seed...');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { phone: '9000000001' },
    update: {},
    create: {
      phone: '9000000001',
      email: 'admin@allzon.in',
      passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });
  console.log('👤 Admin user created:', admin.phone);

  // 2. Verification Staff User
  const staff = await prisma.user.upsert({
    where: { phone: '9000000002' },
    update: {},
    create: {
      phone: '9000000002',
      email: 'staff@allzon.in',
      passwordHash,
      role: UserRole.VERIFICATION_STAFF,
      isVerified: true,
    },
  });
  console.log('👤 Verification staff created:', staff.phone);

  // 3. Buyer User + Profile
  const buyerUser = await prisma.user.upsert({
    where: { phone: '9000000003' },
    update: {},
    create: {
      phone: '9000000003',
      email: 'buyer@mehtaretail.com',
      passwordHash,
      role: UserRole.BUYER,
      isVerified: true,
      buyerProfile: {
        create: {
          fullName: 'Rajan Mehta',
          businessName: 'Mehta Retail Pvt Ltd',
          businessType: BusinessType.WHOLESALER,
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      },
    },
    include: { buyerProfile: true },
  });
  console.log('🛒 Buyer user created:', buyerUser.phone);

  // 4. Supplier 1 User + Profile (Verified)
  const supplier1User = await prisma.user.upsert({
    where: { phone: '9000000004' },
    update: {},
    create: {
      phone: '9000000004',
      email: 'sales@abcgarments.com',
      passwordHash,
      role: UserRole.SUPPLIER,
      isVerified: true,
      supplierProfile: {
        create: {
          slug: 'abc-garments-pvt-ltd',
          businessName: 'ABC Garments Pvt Ltd',
          businessType: BusinessType.MANUFACTURER,
          ownerName: 'Arun Kumar',
          phone: '9000000004',
          email: 'sales@abcgarments.com',
          gstNumber: '33AAAAA0000A1Z5',
          panNumber: 'AAAAA0000A',
          yearEstablished: 2009,
          description:
            'Leading manufacturer of premium cotton t-shirts, polo shirts and corporate apparel in Tiruppur.',
          address: '123 Cotton Mill Road',
          city: 'Tiruppur',
          district: 'Tiruppur',
          state: 'Tamil Nadu',
          pincode: '641601',
          verificationStatus: 'VERIFIED',
          rating: 4.8,
          responseRate: 94.0,
          isFeatured: true,
        },
      },
    },
    include: { supplierProfile: true },
  });
  console.log('🏭 Supplier 1 created:', supplier1User.supplierProfile?.businessName);

  // 5. Supplier 2 User + Profile (Pending)
  const supplier2User = await prisma.user.upsert({
    where: { phone: '9000000005' },
    update: {},
    create: {
      phone: '9000000005',
      email: 'info@kapurelectronics.com',
      passwordHash,
      role: UserRole.SUPPLIER,
      isVerified: true,
      supplierProfile: {
        create: {
          slug: 'kapur-electronics',
          businessName: 'Kapur Electronics',
          businessType: BusinessType.WHOLESALER,
          ownerName: 'Vikram Kapur',
          phone: '9000000005',
          email: 'info@kapurelectronics.com',
          gstNumber: '07BBBBB1111B2Z3',
          yearEstablished: 2015,
          description: 'Wholesale distributor of LED lights, industrial electronics and mobile accessories.',
          city: 'New Delhi',
          state: 'Delhi',
          verificationStatus: 'PENDING',
          rating: 4.2,
          responseRate: 85.0,
        },
      },
    },
    include: { supplierProfile: true },
  });
  console.log('🏭 Supplier 2 created:', supplier2User.supplierProfile?.businessName);

  // 6. Categories & Subcategories
  const catFashion = await prisma.category.upsert({
    where: { slug: 'fashion-apparel' },
    update: {},
    create: {
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Men, women, kids clothing, fabrics and footwear',
      icon: '👕',
      displayOrder: 1,
      subcategories: {
        create: [
          { name: 'T-Shirts & Polos', slug: 't-shirts-polos', displayOrder: 1 },
          { name: 'Shirts & Trousers', slug: 'shirts-trousers', displayOrder: 2 },
          { name: 'Kids Wear', slug: 'kids-wear', displayOrder: 3 },
        ],
      },
    },
    include: { subcategories: true },
  });

  const catElectronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics & Electricals',
      slug: 'electronics',
      description: 'LED lights, industrial electronics, components',
      icon: '⚡',
      displayOrder: 2,
      subcategories: {
        create: [
          { name: 'LED Products', slug: 'led-products', displayOrder: 1 },
          { name: 'Mobile Accessories', slug: 'mobile-accessories', displayOrder: 2 },
        ],
      },
    },
    include: { subcategories: true },
  });

  console.log('🗂 Categories created:', catFashion.name, ',', catElectronics.name);

  const subTshirts = catFashion.subcategories.find((s) => s.slug === 't-shirts-polos')!;

  // 7. Products
  const prod1 = await prisma.product.upsert({
    where: { slug: 'premium-cotton-round-neck-t-shirt' },
    update: {},
    create: {
      supplierId: supplier1User.supplierProfile!.id,
      categoryId: catFashion.id,
      subcategoryId: subTshirts.id,
      name: 'Premium Cotton Round Neck T-Shirt',
      slug: 'premium-cotton-round-neck-t-shirt',
      description: '100% Combed Cotton 180 GSM Bio-washed Round Neck T-Shirt for wholesale and customization.',
      priceMin: 120,
      priceMax: 150,
      priceUnit: 'per Piece',
      moq: 100,
      moqUnit: 'Pieces',
      supplyAbility: '50,000 Pieces/Month',
      deliveryTime: '7-10 Days',
      brand: 'ABC Apparel',
      material: '100% Cotton',
      color: 'Assorted (Black, White, Navy, Red)',
      location: 'Tiruppur, Tamil Nadu',
      status: 'APPROVED',
      isFeatured: true,
      specifications: {
        create: [
          { key: 'GSM', value: '180 GSM' },
          { key: 'Fabric', value: '100% Bio-washed Cotton' },
          { key: 'Sleeve', value: 'Half Sleeve' },
        ],
      },
      images: {
        create: [
          {
            cloudinaryId: 'sample_tshirt_1',
            url: 'https://images.unsplash.com/photo-1630920501459-f3e99320c4a5?w=600&fit=crop',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const prod2 = await prisma.product.upsert({
    where: { slug: 'cotton-polo-shirt-corporate' },
    update: {},
    create: {
      supplierId: supplier1User.supplierProfile!.id,
      categoryId: catFashion.id,
      subcategoryId: subTshirts.id,
      name: 'Cotton Polo Shirt (Corporate)',
      slug: 'cotton-polo-shirt-corporate',
      description: 'Pique Cotton Polo Shirt 220 GSM with custom logo embroidery option for corporate bulk orders.',
      priceMin: 180,
      priceMax: 220,
      priceUnit: 'per Piece',
      moq: 50,
      moqUnit: 'Pieces',
      supplyAbility: '20,000 Pieces/Month',
      deliveryTime: '5-7 Days',
      brand: 'ABC Corporate',
      material: 'Pique Cotton',
      location: 'Tiruppur, Tamil Nadu',
      status: 'APPROVED',
      isFeatured: true,
      specifications: {
        create: [
          { key: 'GSM', value: '220 GSM' },
          { key: 'Collar', value: 'Ribbed Collar' },
        ],
      },
      images: {
        create: [
          {
            cloudinaryId: 'sample_polo_1',
            url: 'https://images.unsplash.com/photo-1534639077088-d702bcf685e7?w=600&fit=crop',
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log('📦 Sample products created:', prod1.name, ',', prod2.name);

  // 8. Sample Enquiry
  let enquiry = await prisma.enquiry.findFirst({
    where: { buyerId: buyerUser.buyerProfile!.id, productId: prod1.id },
  });
  if (!enquiry) {
    enquiry = await prisma.enquiry.create({
      data: {
        buyerId: buyerUser.buyerProfile!.id,
        supplierId: supplier1User.supplierProfile!.id,
        productId: prod1.id,
        quantity: '500 Pieces',
        deliveryLocation: 'Mumbai, Maharashtra',
        additionalRequirement: 'Need custom logo printing on left chest. Please quote best price.',
        status: 'NEW',
      },
    });
    console.log('📋 Sample enquiry created:', enquiry.id);
  } else {
    console.log('📋 Sample enquiry already exists:', enquiry.id);
  }

  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
