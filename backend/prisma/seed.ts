import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const userPassword = await bcrypt.hash('User@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      username: 'admin',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      username: 'user',
      password: userPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
    create: {
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const general = await prisma.category.upsert({
    where: { slug: 'general' },
    update: {
      name: 'General',
      description: 'Thong bao va thao luan chung',
      order: 1,
      isActive: true,
    },
    create: {
      name: 'General',
      description: 'Thong bao va thao luan chung',
      slug: 'general',
      order: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'mobile-it' },
    update: {
      name: 'Mobile & IT',
      description: 'Dien thoai, phan mem va cong nghe',
      order: 2,
      isActive: true,
    },
    create: {
      name: 'Mobile & IT',
      description: 'Dien thoai, phan mem va cong nghe',
      slug: 'mobile-it',
      order: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'game-entertainment' },
    update: {
      name: 'Game & Entertainment',
      description: 'Game, phim anh va giai tri',
      order: 3,
      isActive: true,
    },
    create: {
      name: 'Game & Entertainment',
      description: 'Game, phim anh va giai tri',
      slug: 'game-entertainment',
      order: 3,
      isActive: true,
    },
  });

  const welcomeThread = await prisma.thread.upsert({
    where: { slug: 'welcome-to-forum-microservices' },
    update: {
      title: 'Welcome to Forum Microservices',
      content: 'Thread mau cho database dev local.',
      authorId: admin.id,
      categoryId: general.id,
      isPinned: true,
      isLocked: false,
    },
    create: {
      title: 'Welcome to Forum Microservices',
      slug: 'welcome-to-forum-microservices',
      content: 'Thread mau cho database dev local.',
      authorId: admin.id,
      categoryId: general.id,
      isPinned: true,
      isLocked: false,
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed_post_welcome_admin' },
    update: {
      content: 'Bai viet mau dau tien cua admin.',
      authorId: admin.id,
      threadId: welcomeThread.id,
      parentId: null,
    },
    create: {
      id: 'seed_post_welcome_admin',
      content: 'Bai viet mau dau tien cua admin.',
      authorId: admin.id,
      threadId: welcomeThread.id,
    },
  });

  await prisma.post.upsert({
    where: { id: 'seed_post_welcome_user' },
    update: {
      content: 'Reply mau tu normal user.',
      authorId: normalUser.id,
      threadId: welcomeThread.id,
      parentId: 'seed_post_welcome_admin',
    },
    create: {
      id: 'seed_post_welcome_user',
      content: 'Reply mau tu normal user.',
      authorId: normalUser.id,
      threadId: welcomeThread.id,
      parentId: 'seed_post_welcome_admin',
    },
  });

  console.log('Dev seed completed.');
}

main()
  .catch((error) => {
    console.error('Dev seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
