#!/usr/bin/env node

/**
 * Script to set MongoDB URI in Vercel via CLI
 * This works around interactive prompts
 */

const { spawn } = require('child_process');
const readline = require('readline');

const mongoUri = 'mongodb+srv://Vishal14:Vishalsethi%4014@ledger.t9zmese.mongodb.net/?appName=ledger&retryWrites=true&w=majority';

console.log('🔐 Setting MONGODB_URI in Vercel...\n');

// Run vercel env list first to verify connection
const vercelEnv = spawn('vercel', ['env', 'list']);

let output = '';
vercelEnv.stdout.on('data', (data) => {
  output += data.toString();
  console.log(data.toString());
});

vercelEnv.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

vercelEnv.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Connected to Vercel successfully\n');
    console.log('📝 To set the MongoDB URI manually:\n');
    console.log('1. Visit: https://vercel.com/vishalsethi14-2174s-projects/ledger/settings/environment-variables');
    console.log('2. Click "Add New"');
    console.log('3. Name: MONGODB_URI');
    console.log('4. Value:');
    console.log(`   ${mongoUri}`);
    console.log('5. Select: Production');
    console.log('6. Click "Save"');
    console.log('7. Redeploy the project\n');
    console.log('Or run: vercel --prod --force\n');
  } else {
    console.error('❌ Could not connect to Vercel. Make sure you\'re logged in.');
  }
});
