Features ✨
EPK Extraction: Decompile .epk archives to access their individual files.

File Viewing: Inspect the contents of extracted files.

NBT Support: Automatically parses and displays .dat files (common in Minecraft-related contexts) as human-readable JSON.

Text/JSON Support: Displays .txt, .json, .properties, and .log files directly as text.

Binary Placeholder: Shows a placeholder for other binary file types that can't be directly displayed.

File Modification: Edit the content of NBT files (via JSON) and text-based files.

EPK Repacking: Reconstruct a new .epk archive with your modified files. Includes intelligent re-compression for GZIPped files.

Integrity Checks: Validates EPK headers/footers and performs CRC32 checks on extracted/repacked file data.

How It Works ⚙️
The application operates entirely client-side in your web browser, utilizing JavaScript and several third-party libraries.

EPK File Structure
The .epk file format, as reverse-engineered and implemented in this project, follows this general structure:

Header (8 bytes): EAGPKG$$ magic bytes.

Version (6 bytes): A string indicating the EPK format version (e.g., ver2.0).

Number of Files (4 bytes, Big-Endian): An unsigned integer specifying the total count of files in the archive. Note: This field uses Big-Endian byte order.

File Metadata Table: A sequential list of entries, one for each contained file. Each entry includes:

File Name Length (2 bytes, Little-Endian): Length of the file's name.

File Name (Variable bytes): The UTF-8 encoded name of the file.

File Data Offset (4 bytes, Little-Endian): The absolute byte offset within the .epk file where the file's data begins.

File Data Length (4 bytes, Little-Endian): The size of the file's data in bytes.

Compression Type (1 byte): 0 for uncompressed, 1 for GZIP compressed.

File CRC32 (4 bytes, Little-Endian): A checksum for data integrity verification.

File Data Blocks: The actual binary content of each file, stored sequentially at the offsets specified in the metadata table.

Footer (8 bytes): :::YEE:> magic bytes as an end-of-file marker.

Core Logic Breakdown
1. EPK Decryption (decryptEpk function)
This function orchestrates the reading and parsing of the EPK file:

Input: Takes an ArrayBuffer representing the raw EPK file.

Validation: Confirms the EPK header and footer bytes match the expected signatures.

Metadata Parsing:

Reads the number of files (Big-Endian) from the EPK.

Iterates through each file entry in the metadata table. For each file, it reads its name, data offset, data length, compression type, and CRC32 checksum. Endianness is critical here; most multi-byte fields are Little-Endian, except for the "Number of Files."

Data Extraction & Decompression:

For each file, it slices its raw data from the main EPK ArrayBuffer based on its offset and length.

GZIP Decompression (using Pako.js): If the compressionType is 1 or if the file data starts with GZIP magic bytes (0x1F 0x8B), pako.ungzip() is used to decompress the data. If decompression fails, the raw data is kept, and a warning is issued.

CRC32 Verification: The CRC32 utility calculates the checksum of the decompressed data, comparing it against the stored CRC32 from the EPK metadata to ensure data integrity.

Storage: Stores the extracted (and decompressed) file data, along with its metadata, in an in-memory Map keyed by filename (extractedFiles).

UI Population: Populates the file list dropdown for user interaction.

2. File Viewing & Editing
File Selection: When a file is selected from the dropdown:

For .dat files, the decompressed ArrayBuffer is passed to NBT.js's nbt.parseUncompressed() function. This converts the binary NBT structure into a JavaScript object. This object is then displayed as pretty-printed JSON in the text editor. BigInt values are specifically handled by appending an 'n' (e.g., 123n) for proper display and re-serialization.

For text-based files (.txt, .json, etc.), TextDecoder converts the ArrayBuffer directly into a string for display.

Binary files are simply noted as such, and the editor is disabled.

Saving Changes: When the "Save Changes" button is clicked:

For .dat files, the JSON content from the editor is parsed back into a JavaScript object. A custom objectToNbtTag utility recursively transforms this generic object back into NBT.js's internal tag structure. Finally, nbt.writeUncompressed() serializes the NBT tag object back into a raw ArrayBuffer.

For text files, TextEncoder re-encodes the string content back into an ArrayBuffer.

The updated ArrayBuffer replaces the old one in the extractedFiles map, ready for repacking.

3. EPK Repacking (repackEpk function)
This function reconstructs the .epk file from the modified extractedFiles map:

Output Stream: A ByteArrayOutputStream utility is used to build the new binary file byte by byte.

Header & Version: Writes the standard EPK header and version.

Number of Files: Writes the current count of files from extractedFiles as a Big-Endian 4-byte integer.

Metadata Table Generation:

Iterates through each file in the extractedFiles map.

Re-compression: Checks the originalCompressionType of each file. If it was originally GZIPped, pako.gzip() is used to re-compress the (potentially modified) file data. The compressionType for the new EPK entry is set to 1 if re-compression is successful and results in a smaller size, otherwise 0.

CRC32 Recalculation: Calculates a fresh CRC32 checksum for the processed (potentially re-compressed) file data.

Writes the file's name length, name, calculated data offset, data length, compression type, and CRC32 to the output stream.

Data Block Writing: After all metadata entries are written, the actual (potentially re-compressed) binary data blocks for all files are appended sequentially to the output stream.

Footer: Appends the :::YEE:> footer.

Download: The final ArrayBuffer is converted into a downloadable Blob, allowing the user to save the new .epk file.

Debugging and Robustness 🔍
The project incorporates robust debugging and error handling:

Status Messages: Provides real-time feedback to the user on the UI.

ensureBytes: Prevents out-of-bounds reads by checking if enough bytes are available before attempting to read data fields.

Extensive Console Logging: Detailed [DEBUG], [STATUS], [EPK_DECRYPT], [EPK_REPACK], and [NBT_DEBUG] messages are printed to the browser's developer console, showing parsing progress, byte values, and potential issues. These logs were crucial in identifying the mixed endianness of the EPK format.

Try-Catch Blocks: Gracefully handle errors during decompression, JSON parsing, and NBT processing, preventing crashes and providing informative error messages.

This project offers a comprehensive and interactive solution for working with .epk archive files, making complex binary parsing accessible through a user-friendly web interface.
