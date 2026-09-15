# OCIXI Torrent

A free, console-based torrent downloader built with WebTorrent. Features VPN support awareness and batch downloading capabilities.

## Features

- 🆓 **Free & Open Source** - Completely free to use
- 💻 **Console-Based** - Lightweight CLI interface
- 🔒 **VPN Aware** - Prompts you to use a VPN for privacy
- 📥 **Batch Downloading** - Download multiple torrents at once
- ⚡ **Real-time Progress** - Live progress bars and speed indicators
- 🎯 **Hash Input** - Simply input torrent hash or magnet link

## Installation

```bash
npm install
```

## Usage

### Interactive Mode
```bash
npm start
# or
node index.mjs
```

### Direct Download
```bash
node index.mjs <torrent-hash-or-magnet-link>
```

### Batch Download
```bash
node index.mjs --batch torrents.txt
```

## Commands

| Command | Description |
|---------|-------------|
| `download <hash>` | Download a torrent by hash or magnet link |
| `batch <file>` | Batch download from a file |
| `list` | List active downloads |
| `remove <hash>` | Remove a torrent |
| `help` | Show help message |
| `exit` / `quit` | Exit the application |

## Batch File Format

Create a text file with one torrent hash or magnet link per line:

```
# This is a comment
8239a17e6d2f0c3f9f4f5f6f7f8f9fafbfcfdfeff0f1f2f3f4f5f6f7f8f9fafb
magnet:?xt=urn:btih:...
# Another comment
another-hash-here
```

## VPN Support

OCIXI Torrent recommends using a VPN for your privacy and security. The application will remind you to connect your VPN before starting downloads.

**Compatible VPN Services:**
- NordVPN
- ExpressVPN
- ProtonVPN
- Private Internet Access (PIA)
- Any VPN that supports P2P/torrenting

**Important:** Make sure your VPN is connected before starting any downloads!

## Downloads Folder

All downloaded files are saved to the `./downloads` directory in your current working directory.

## License

MIT License
