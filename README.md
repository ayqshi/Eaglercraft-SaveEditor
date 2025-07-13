# RePack

### Eaglercraft .epk file save editor

> [!WARNING]
> This project is currently in beta and using it will only get you as far as ONLY VIEWING a readable version of your saved data. If you would like to contribute to coding this app
**Contact me via snapchat ayqshi**

## Key Features

- **EPK Extraction: Decompile .epk archives to access their individual files.**
- **NBT Support: Automatically parses and displays .dat files (common in Minecraft-related contexts) as human-readable JSON.**
- **File Modification: Edit the content of NBT files (via JSON) and text-based files.**
- **EPK Repacking: Reconstruct a new .epk archive with your modified files. Includes intelligent re-compression for GZIPped files.**
- **Integrity Checks: Validates EPK headers/footers and performs CRC32 checks on extracted/repacked file data.** 
- **Binary Placeholder: Shows a placeholder for other binary file types that can't be directly displayed.**

## Directions
1. Select your world on eaglercraft > backup > save as .epk
2. Open RePack - beta > Upload your recently saved .epk file
3. Select any file from the decompiled list and the content will appear on the right

## How It Works ⚙️

The tool runs client-side in your browser, using JavaScript. It understands the .epk format, which includes a header, version, file count (important: this is Big-Endian, while most other numerical data is Little-Endian), a table of file metadata (name, size, offset, compression type, CRC32), the actual file data blocks, and a footer.

It uses Pako.js for GZIP compression/decompression and NBT.js to handle .dat files. When you load an EPK, it reads this structure, decompresses files as needed, and makes them available. When you save changes and repack, it reconstructs the EPK, re-compressing files if they were originally compressed

## Key Features & Benefits ✨

- **Browser-Based: No installation needed; works directly in your web browser**
- **User-Friendly: Simple interface for common archive operations.**
- **NBT Editing: Specifically designed to make editing complex NBT data in .dat files straightforward by converting them to JSON.**
- **Robust: Includes checks for file integrity and handles various compression states.** 
