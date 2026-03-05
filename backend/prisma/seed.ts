import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.kyeSubmission.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      staffId: 'DGX-ADM-0001',
      name: 'Gideon Igwe',
      email: 'admin@degxifi.com',
      password: adminPassword,
      role: 'Super Admin',
      department: 'Administration',
      region: 'Nigeria',
      isAdmin: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email} / admin123`);

  // Create staff members
  const staffPassword = await bcrypt.hash('staff123', 10);

  const staffData = [
    {
      staffId: 'DGX-STF-0102',
      name: 'Ngozi Eze',
      email: 'n.eze@degxifi.com',
      role: 'Compliance Manager',
      department: 'Compliance',
      kyeStatus: 'verified',
      kyeStep: 4,
      kyeStepLabel: 'Verified',
      kyeSubmittedDate: new Date('2025-09-15T10:30:00'),
      kyeRefId: 'DGX-10202-KYE',
    },
    {
      staffId: 'DGX-STF-0203',
      name: 'Chinedu Okafor',
      email: 'c.okafor@degxifi.com',
      role: 'Support Lead',
      department: 'Support',
      kyeStatus: 'rejected',
      kyeStep: 2,
      kyeStepLabel: 'Rejected',
      kyeSubmittedDate: new Date('2025-09-20T14:00:00'),
      kyeRefId: 'DGX-10305-KYE',
      rejectReason: 'Blurred / Unreadable Image',
    },
    {
      staffId: 'DGX-STF-0304',
      name: 'Amaka Nnadi',
      email: 'a.nnadi@degxifi.com',
      role: 'UI Designer',
      department: 'Design',
      kyeStatus: 'pending_review',
      kyeStep: 2,
      kyeStepLabel: 'Document Review',
      kyeSubmittedDate: new Date('2025-10-01T09:00:00'),
      kyeRefId: 'DGX-10410-KYE',
    },
    {
      staffId: 'DGX-STF-0405',
      name: 'Ibrahim Musa',
      email: 'i.musa@degxifi.com',
      role: 'Backend Developer',
      department: 'Engineering',
      kyeStatus: 'pending_submission',
      kyeStep: 0,
      kyeStepLabel: 'Awaiting Submission',
      kyeSubmittedDate: null,
      kyeRefId: null,
    },
  ];

  for (const s of staffData) {
    const user = await prisma.user.create({
      data: {
        staffId: s.staffId,
        name: s.name,
        email: s.email,
        password: staffPassword,
        role: s.role,
        department: s.department,
        region: 'Nigeria',
        isAdmin: false,
      },
    });

    // Create KYE submission
    await prisma.kyeSubmission.create({
      data: {
        userId: user.id,
        status: s.kyeStatus,
        step: s.kyeStep,
        stepLabel: s.kyeStepLabel,
        refId: s.kyeRefId,
        submittedDate: s.kyeSubmittedDate,
        riskScore: s.kyeStatus === 'verified' ? 0.05 : s.kyeStatus === 'pending_review' ? 0.08 : 0,
        fullName: s.kyeStatus !== 'pending_submission' ? s.name : null,
        phone: s.kyeStatus !== 'pending_submission' ? '+234 800 000 0000' : null,
        dob: s.kyeStatus !== 'pending_submission' ? '1990-01-15' : null,
        address: s.kyeStatus !== 'pending_submission' ? '15 Adeola Odeku Street, Victoria Island, Lagos' : null,
        documentsUploaded: s.kyeStatus !== 'pending_submission' ? 3 : 0,
        rejectReason: s.kyeStatus === 'rejected' ? (s as any).rejectReason : null,
      },
    });

    // Add welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to Degxifi',
        message: 'Your staff account is active. Please complete your KYE verification.',
        icon: 'waving_hand',
      },
    });

    // Add account created activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'success',
        title: 'Account Created',
        description: 'Staff account registered. Please complete KYE verification.',
        icon: 'person_add',
      },
    });

    console.log(`✅ Staff created: ${s.email} / staff123 (KYE: ${s.kyeStatus})`);
  }

  // Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      { admin: admin.email, action: 'Approved KYE for Ngozi Eze (DGX-STF-0102)', createdAt: new Date('2025-09-16T11:00:00') },
      { admin: admin.email, action: 'Rejected KYE for Chinedu Okafor (DGX-STF-0203). Reason: Blurred / Unreadable Image', createdAt: new Date('2025-09-21T15:00:00') },
      { admin: admin.email, action: 'Invited new staff: Ibrahim Musa (i.musa@degxifi.com)', createdAt: new Date('2025-10-05T09:00:00') },
    ],
  });

  console.log('✅ Audit logs seeded');
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('=== Login Credentials ===');
  console.log('Admin:  admin@degxifi.com / admin123');
  console.log('Staff:  n.eze@degxifi.com / staff123  (verified)');
  console.log('Staff:  c.okafor@degxifi.com / staff123  (rejected)');
  console.log('Staff:  a.nnadi@degxifi.com / staff123  (pending_review)');
  console.log('Staff:  i.musa@degxifi.com / staff123  (pending_submission)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
