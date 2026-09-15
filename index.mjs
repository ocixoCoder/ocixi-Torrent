#!/usr/bin/env node

import WebTorrent from 'webtorrent';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create torrent client
const client = new WebTorrent();

// Download directory
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// VPN warning and guidance
function showVPNInfo() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║           OCIXI TORRENT - VPN RECOMMENDED            ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║ For your privacy and security, we recommend using    ║');
  console.log('║ a VPN while downloading torrents.                    ║');
  console.log('║                                                      ║');
  console.log('║ Supported VPNs: Any VPN service that supports        ║');
  console.log('║ torrenting (NordVPN, ExpressVPN, ProtonVPN, etc.)   ║');
  console.log('║                                                      ║');
  console.log('║ Make sure your VPN is connected before starting!     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Display help
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║              OCIXI TORRENT v1.0.0                      ║
║         Free Console Torrent Downloader                ║
╠════════════════════════════════════════════════════════╣
║  COMMANDS:                                             ║
║                                                        ║
║  download <hash>     - Download a torrent by hash      ║
║  batch <file>        - Batch download from file        ║
║  list                - List active downloads           ║
║  remove <hash>       - Remove a torrent                ║
║  help                - Show this help message          ║
║  exit/quit           - Exit the application            ║
║                                                        ║
║  BATCH FILE FORMAT:                                    ║
║  One torrent hash or magnet link per line              ║
║  Lines starting with # are comments                    ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
}

// Format bytes to human readable
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format time
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return 'Unknown';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Progress bar
function renderProgressBar(progress, width = 30) {
  const filled = Math.round(width * progress / 100);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}]`;
}

// Download a single torrent
function downloadTorrent(torrentId, options = {}) {
  return new Promise((resolve, reject) => {
    const shortId = typeof torrentId === 'string' ? torrentId.substring(0, 20) : 'magnet-link';
    console.log(`\n📥 Adding torrent: ${shortId}...`);
    
    const torrent = client.add(torrentId, {
      path: DOWNLOAD_DIR
    });

    torrent.on('metadata', () => {
      console.log(`\n✅ Metadata received: ${torrent.name}`);
      console.log(`   Total size: ${formatBytes(torrent.length)}`);
      console.log(`   Files: ${torrent.files.length}`);
    });

    torrent.on('download', () => {
      if (options.verbose !== false) {
        const progress = torrent.progress.toFixed(1);
        const speed = formatBytes(torrent.downloadSpeed);
        const peers = torrent.numPeers;
        const eta = formatTime(torrent.timeRemaining / 1000);
        
        process.stdout.write(`\r⬇️  ${renderProgressBar(progress)} ${progress}% | Speed: ${speed}/s | Peers: ${peers} | ETA: ${eta}   `);
      }
    });

    torrent.on('done', () => {
      console.log(`\n\n✅ Download complete: ${torrent.name}`);
      console.log(`   Saved to: ${DOWNLOAD_DIR}`);
      console.log(`   Total size: ${formatBytes(torrent.downloaded)}`);
      console.log(`   Average speed: ${formatBytes(torrent.downloadSpeed)}/s`);
      resolve(torrent);
    });

    torrent.on('error', (err) => {
      console.error(`\n❌ Error: ${err.message}`);
      reject(err);
    });

    torrent.on('warning', (warn) => {
      console.warn(`\n⚠️  Warning: ${warn}`);
    });
  });
}

// Batch download from file
async function batchDownload(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const torrents = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (trimmed && !trimmed.startsWith('#')) {
      torrents.push({ hash: trimmed, line: index + 1 });
    }
  });

  if (torrents.length === 0) {
    console.log('ℹ️  No valid torrent hashes found in file.');
    return;
  }

  console.log(`\n📋 Found ${torrents.length} torrent(s) to download.\n`);

  // Download all torrents (concurrently)
  const promises = torrents.map(async (t) => {
    try {
      await downloadTorrent(t.hash, { verbose: true });
      const shortHash = typeof t.hash === 'string' ? t.hash.substring(0, 20) : 'magnet';
      console.log(`✅ Completed: ${shortHash}...`);
    } catch (err) {
      const shortHash = typeof t.hash === 'string' ? t.hash.substring(0, 20) : 'magnet';
      console.error(`❌ Failed: ${shortHash}... - ${err.message}`);
    }
  });

  await Promise.all(promises);
  console.log('\n🎉 Batch download completed!');
}

// List active torrents
function listTorrents() {
  if (client.torrents.length === 0) {
    console.log('ℹ️  No active downloads.');
    return;
  }

  console.log('\n📊 Active Downloads:\n');
  client.torrents.forEach((torrent, index) => {
    const progress = torrent.progress.toFixed(1);
    const downloaded = formatBytes(torrent.downloaded);
    const total = formatBytes(torrent.length);
    const speed = formatBytes(torrent.downloadSpeed);
    const peers = torrent.numPeers;
    
    console.log(`${index + 1}. ${torrent.name || torrent.infoHash.substring(0, 20)}...`);
    console.log(`   Progress: ${renderProgressBar(parseFloat(progress))} ${progress}%`);
    console.log(`   Downloaded: ${downloaded} / ${total}`);
    console.log(`   Speed: ${speed}/s | Peers: ${peers}`);
    console.log('');
  });
}

// Remove a torrent
function removeTorrent(hashOrIndex) {
  const torrent = client.torrents.find(t => 
    t.infoHash === hashOrIndex || 
    t.infoHash.startsWith(hashOrIndex)
  );

  if (torrent) {
    torrent.destroy(() => {
      console.log(`✅ Removed: ${torrent.name || torrent.infoHash}`);
    });
  } else {
    console.error(`❌ Torrent not found: ${hashOrIndex}`);
  }
}

// Main REPL loop
function startREPL() {
  showVPNInfo();
  showHelp();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = () => {
    rl.question('\n\x1b[36mocixi-torrent>\x1b[0m ', (input) => {
      const parts = input.trim().split(/\s+/);
      const command = parts[0]?.toLowerCase();
      const args = parts.slice(1);

      switch (command) {
        case 'download':
        case 'd':
          if (args.length === 0) {
            console.log('❌ Usage: download <torrent-hash-or-magnet>');
          } else {
            downloadTorrent(args.join(' '));
          }
          break;

        case 'batch':
        case 'b':
          if (args.length === 0) {
            console.log('❌ Usage: batch <file-path>');
          } else {
            batchDownload(args.join(' '));
          }
          break;

        case 'list':
        case 'l':
          listTorrents();
          break;

        case 'remove':
        case 'rm':
          if (args.length === 0) {
            console.log('❌ Usage: remove <hash-or-index>');
          } else {
            removeTorrent(args[0]);
          }
          break;

        case 'help':
        case 'h':
        case '?':
          showHelp();
          break;

        case 'exit':
        case 'quit':
        case 'q':
          console.log('\n👋 Shutting down OCIXI Torrent...');
          client.destroy(() => {
            console.log('✅ All connections closed.');
            rl.close();
            process.exit(0);
          });
          break;

        case '':
          break;

        default:
          console.log(`❌ Unknown command: ${command}. Type 'help' for available commands.`);
      }

      prompt();
    });
  };

  prompt();
}

// Handle direct command line arguments
if (process.argv.length > 2) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  if (args[0] === '--batch' || args[0] === '-b') {
    showVPNInfo();
    if (args[1]) {
      batchDownload(args[1]).then(() => {
        client.destroy(() => process.exit(0));
      });
    } else {
      console.error('❌ Usage: node index.mjs --batch <file>');
      process.exit(1);
    }
  } else {
    // Assume it's a torrent hash/magnet
    showVPNInfo();
    downloadTorrent(args.join(' ')).then(() => {
      client.destroy(() => process.exit(0));
    }).catch(() => {
      client.destroy(() => process.exit(1));
    });
  }
} else {
  // Interactive mode
  startREPL();
}
