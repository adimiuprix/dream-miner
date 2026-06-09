/**
 * Get User Data from Database
 * Usage: npx tsx scripts/get-user-data.ts [userId]
 */

import { prisma } from '../lib/prisma.js';

async function getUserData(userId) {
  try {
    console.log('\n🔍 Fetching user data...\n');

    let user;
    
    if (userId) {
      // Get specific user
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          contracts: {
            orderBy: { createdAt: 'desc' },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          referrals: {
            select: {
              id: true,
              firstName: true,
              createdAt: true,
            },
          },
        },
      });
      
      if (!user) {
        console.log(`❌ User not found: ${userId}\n`);
        return;
      }
      
      printUserDetail(user);
    } else {
      // Get all users
      const users = await prisma.user.findMany({
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
          },
          _count: {
            select: {
              contracts: true,
              transactions: true,
              referrals: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (users.length === 0) {
        console.log('❌ No users found in database.');
        console.log('\n💡 Please login to the app first:\n');
        console.log('   1. Run: npm run dev');
        console.log('   2. Open: http://localhost:3000');
        console.log('   3. Login with Telegram\n');
        return;
      }

      console.log(`📊 Found ${users.length} user(s):\n`);
      console.log('═'.repeat(100));
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName || ''} (@${user.username || 'no username'})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Telegram: ${user.telegramId}`);
        // Power calculated from active contracts
        const activePower = user.contracts.reduce(
          (sum: number, c: { power: number; bonus: number }) => sum + c.power + c.bonus,
          0
        );
        console.log(`   Power: ${activePower.toLocaleString()} | TON: ${user.tonBalance.toFixed(4)}`);
        console.log(`   Contracts: ${user._count.contracts} | Transactions: ${user._count.transactions} | Referrals: ${user._count.referrals}`);
        
        if (activePower > 0) {
          const rate = (activePower / 100000 * 86400).toFixed(0);
          console.log(`   Mining: ${rate} H/day`);
        }
        
        if (user.contracts.length > 0) {
          console.log(`   Active: ${user.contracts.map(c => c.planId).join(', ')}`);
        }
      });
      
      console.log('\n' + '═'.repeat(100));
      console.log(`\n💡 To see details, run: node scripts/get-user-data.mjs <userId>\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function printUserDetail(user) {
  console.log('═'.repeat(100));
  console.log(`👤 USER: ${user.firstName} ${user.lastName || ''}`);
  console.log('═'.repeat(100));
  
  console.log('\n📋 Basic Info:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Telegram ID: ${user.telegramId}`);
  console.log(`   Username: @${user.username || 'no username'}`);
  console.log(`   Language: ${user.languageCode || 'N/A'}`);
  console.log(`   Referral Code: ${user.referralCode}`);
  console.log(`   Referred By: ${user.referredById || 'None'}`);
  
  console.log('\n⚡ Mining Stats:');
  // Power calculated from active contracts
  const activePower = (user.contracts || [])
    .filter((c: { status: string }) => c.status === 'ACTIVE')
    .reduce((sum: number, c: { power: number; bonus: number }) => sum + c.power + c.bonus, 0);
  console.log(`   Power: ${activePower.toLocaleString()} (from active contracts)`);
  console.log(`   TON Balance: ${user.tonBalance.toFixed(4)}`);
  
  if (activePower > 0) {
    const ratePerSec = activePower / 100000;
    const ratePerDay = ratePerSec * 86400;
    const ratePerMonth = ratePerDay * 30;
    console.log(`   Mining Rate: ${ratePerSec.toFixed(2)} H/s`);
    console.log(`   Per Day: ${ratePerDay.toLocaleString()} H`);
    console.log(`   Per Month: ${ratePerMonth.toLocaleString()} H`);
  }
  
  console.log('\n📅 Activity:');
  console.log(`   Joined: ${user.createdAt.toLocaleString()}`);
  console.log(`   Last Ping: ${user.lastPingAt.toLocaleString()}`);
  
  if (user.contracts && user.contracts.length > 0) {
    console.log(`\n📦 Contracts (${user.contracts.length}):`);
    user.contracts.forEach((contract, idx) => {
      const daysLeft = Math.ceil((contract.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      console.log(`\n   ${idx + 1}. ${contract.planId} [${contract.status}]`);
      console.log(`      Power: ${contract.power.toLocaleString()} (+${contract.bonus.toLocaleString()} bonus)`);
      console.log(`      Price: ${contract.price} TON`);
      console.log(`      Expires: ${contract.expiresAt.toLocaleDateString()} (${daysLeft} days left)`);
      console.log(`      Created: ${contract.createdAt.toLocaleDateString()}`);
    });
  } else {
    console.log('\n📦 Contracts: None');
  }
  
  if (user.transactions && user.transactions.length > 0) {
    console.log(`\n💳 Recent Transactions (last 10):`);
    user.transactions.forEach((tx, idx) => {
      console.log(`\n   ${idx + 1}. ${tx.type} [${tx.status}]`);
      console.log(`      Amount: ${tx.amount} TON`);
      console.log(`      Date: ${tx.createdAt.toLocaleString()}`);
      if (tx.txHash) console.log(`      Hash: ${tx.txHash}`);
    });
  } else {
    console.log('\n💳 Transactions: None');
  }
  
  if (user.referrals && user.referrals.length > 0) {
    console.log(`\n👥 Referrals (${user.referrals.length}):`);
    user.referrals.forEach((ref, idx) => {
      console.log(`   ${idx + 1}. ${ref.firstName} (Joined: ${ref.createdAt.toLocaleDateString()})`);
    });
  } else {
    console.log('\n👥 Referrals: None');
  }
  
  console.log('\n' + '═'.repeat(100) + '\n');
}

// Main
const userId = process.argv[2];
getUserData(userId);
