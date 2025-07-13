Core Components and Their Roles 🛠️
The project is built around several key JavaScript components and libraries:

HTML Structure (index.html): Provides the user interface with file input, buttons, a file list dropdown, and a text editor area.

main-min.js (Your Custom JavaScript): This is the heart of the application, containing the logic for EPK parsing, file handling, and integration with third-party libraries.

Pako.js: A fast zlib (GZIP) compression/decompression library used for handling compressed files within the EPK.

NBT.js: A library specifically designed for parsing and serializing Minecraft's NBT (Named Binary Tag) format, which is often used in .dat files.

EPK File Format and Our Approach 📂
The EPK format, as inferred from the code and your interactions, has a specific structure:

Header (8 bytes): The magic string "EAGPKG$$" (hex: 0x45 0x41 0x47 0x50 0x4B 0x47 0x24 0x24). This acts as a signature to identify EPK files.

Version (6 bytes): A string indicating the EPK version, like "ver2.0" (hex: 0x76 0x65 0x72 0x32 0x2E 0x30).

Number of Files (4 bytes, unsigned integer, Big-Endian): This value specifies how many files are contained within the archive. Crucially, this is read as Big-Endian.

File Metadata Table: A sequential list of entries, one for each file, directly following the "Number of Files" field. Each entry contains:

File Name Length (2 bytes, unsigned short, Little-Endian): The length of the file's name in bytes.

File Name (Variable length bytes): The actual name of the file, encoded as a UTF-8 string.

File Data Offset (4 bytes, unsigned integer, Little-Endian): The byte offset from the beginning of the EPK file where the actual file's data content starts.

File Data Length (4 bytes, unsigned integer, Little-Endian): The length of the file's data content in bytes.

Compression Type (1 byte, unsigned byte): Indicates if the file data is compressed (1 for GZIP, 0 for uncompressed, others unknown/unsupported).

File CRC32 (4 bytes, unsigned integer, Little-Endian): A Cyclic Redundancy Checksum used to verify the integrity of the file's data.

File Data Blocks: The actual binary content of each file, stored consecutively after the metadata table, at the offsets specified in their respective metadata entries.

Footer (8 bytes): The magic string ":::YEE:>" (hex: 0x3A 0x3A 0x3A 0x59 0x45 0x45 0x3A 0x3E). This acts as an end-of-file marker.

Endianness: A critical aspect identified during debugging is the mixed endianness within the EPK format. While most multi-byte values (file name length, data offset, data length, CRC32) are Little-Endian, the number of files is Big-Endian. Incorrectly interpreting endianness leads to wildly inaccurate numerical values, causing parsing to fail.

Methods and Workflow Explained Flow 📈
1. File Selection and Initial Load
epkFileInput.addEventListener("change", ...): When a user selects an EPK file via the file input, this event listener triggers.

file.arrayBuffer(): The browser's File API is used to read the entire selected EPK file into an ArrayBuffer. This raw binary data is stored in originalEpkBuffer for later repacking.

decryptEpk(arrayBuffer): This is the core function called to begin the parsing process.

2. EPK Decryption/Decompilation (decryptEpk function) 🔓
This function systematically reads the EPK file's binary structure:

Initialization: Clears previous data, resets the UI, and prepares Uint8Array and DataView wrappers for efficient byte access.

Header Validation: It reads the first 8 bytes and the last 8 bytes (footer) to confirm they match the expected "EAGPKG$$" header and ":::YEE:>" footer. This is a quick integrity check.

Version Reading: Extracts the 6-byte version string.

Number of Files: Reads the 4-byte unsigned integer representing the total number of files using dataView.getUint32(offset, false) (Big-Endian). This was a key fix identified from your debug logs.

Metadata Table Parsing (Loop): It iterates numFiles times to read the metadata for each individual file:

nameLength (2 bytes, Little-Endian): Reads the length of the file name.

fileName (Variable length): Reads the actual file name using TextDecoder().decode().

dataOffset (4 bytes, Little-Endian): Reads the byte offset where the file's content begins within the EPK.

dataLength (4 bytes, Little-Endian): Reads the length of the file's content.

compressionType (1 byte): Reads a byte indicating the compression status (0 for none, 1 for GZIP).

fileCrc32 (4 bytes, Little-Endian): Reads the CRC32 checksum for the file's content.

extractedFiles Map: Each file's metadata and its raw binary data (after potential decompression) are stored in the extractedFiles Map, keyed by filename.

File Data Extraction and Decompression: For each file entry:

It uses buffer.slice(meta.offset, meta.offset + meta.length) to extract the raw binary data block for the file.

GZIP Decompression (using Pako.js):

It checks meta.compressionType === 1 or if the file starts with GZIP magic bytes (0x1F 0x8B).

If either is true, pako.ungzip() is called to decompress the data. If decompression fails, a warning is logged, and the raw (still compressed) data is used.

The wasGzipped flag tracks if a file was successfully decompressed.

CRC32 Validation: A CRC32 utility class is used to calculate the checksum of the (now decompressed) file data. This calculated CRC32 is then compared against the meta.crc32 read from the EPK header to ensure data integrity.

UI Update: Populates the fileListSelect dropdown with the names of the extracted files, making them selectable in the UI.

3. File Viewing and Editing (fileListSelect.addEventListener("change", ...) and saveChangesButton.addEventListener("click", ...)) ✍️
When a user selects a file from the dropdown:

Content Retrieval: The activeFile object is retrieved from the extractedFiles map, which holds the decompressed ArrayBuffer of the selected file.

Type-Specific Handling:

.dat files: These are specifically targeted for NBT (Named Binary Tag) parsing.

NBT Parsing (using NBT.js): nbt.parseUncompressed(fileBuffer) is called. This function takes the raw, decompressed NBT binary data and converts it into a structured JavaScript object.

JSON Conversion: The NBT object is then stringified into human-readable JSON using JSON.stringify(), with a custom replacer to handle BigInt values (which are common in NBT) by appending an 'n' to their string representation (e.g., "123n").

Text files (.txt, .json, etc.): These are decoded directly into a string using TextDecoder().decode().

Binary files: A message indicating binary content is displayed, and the editor is disabled.

Editor Display: The processed content (JSON or text) is loaded into the fileContentEditor textarea.

When a user clicks "Save Changes":

Content Retrieval: The current content from fileContentEditor is read.

Type-Specific Re-serialization:

.dat files:

The JSON content is JSON.parse()d back into a JavaScript object.

NBT Re-serialization: The objectToNbtTag helper function (custom-built) recursively converts this generic JavaScript object structure back into the nbt.js library's internal NBT tag representation. This is crucial for nbt.writeUncompressed().

nbt.writeUncompressed(nbtTag) is then called to serialize the NBT tag object back into a raw, uncompressed ArrayBuffer.

Text files: The modified text is re-encoded into an ArrayBuffer using TextEncoder().encode().

Update extractedFiles: The activeFile.buffer in the extractedFiles map is updated with the newly generated binary data.

4. EPK Repacking (repackEpk function) 📦
This function reverses the decryption process to build a new EPK file:

ByteArrayOutputStream: A custom utility class is used to incrementally build the new binary file by appending bytes, shorts, and integers, ensuring correct endianness during writing.

Header and Version: Writes the "EAGPKG$$" header and "ver2.0" version.

Number of Files: Writes the total count of files in extractedFiles.size using outputStream.writeInt(filesMap.size, false) (Big-Endian).

Calculate Offsets: Before writing the metadata table, it first calculates the size of the entire metadata table. This is essential to determine the starting currentDataOffset for the actual file data blocks.

Write File Metadata Table: Iterates through each file in extractedFiles:

Compression Decision: Decides whether to re-compress the file data using GZIP based on its originalCompressionType flag (stored during decryption). If the original was GZIPped, it attempts to re-GZIP it using pako.gzip(). If successful, the compression type for the new EPK entry is 1; otherwise, it's 0.

CRC32 Calculation: Calculates the CRC32 of the newly processed (potentially re-compressed) file data.

Write Metadata: Writes nameLength (Little-Endian), fileName bytes, dataOffset (Little-Endian), dataLength (Little-Endian), compressionType (byte), and fileCrc32 (Little-Endian) to the output stream.

currentDataOffset is updated for the next file's data.

Write File Data Blocks: After all metadata is written, it then writes the actual binary dataBuffer for each file (which is the potentially re-compressed data) sequentially to the output stream.

Footer: Appends the ":::YEE:>" footer.

Download: Converts the ByteArrayOutputStream to a final ArrayBuffer and creates a downloadable Blob for the user.

Error Handling and Debugging 🐛
The project incorporates several error handling and debugging mechanisms:

showStatusMessage: Provides user-friendly feedback in the UI and detailed logs in the console.

ensureBytes: A critical helper function that checks if there are enough bytes remaining in the ArrayBuffer before attempting to read a multi-byte value. This prevents "Not enough bytes" errors by catching them early.

Extensive console.log statements: These are strategically placed throughout the code ([EPK_DECRYPT], [EPK_REPACK], [NBT_DEBUG], [DEBUGGING]) to trace the execution flow, show values being read (including raw hex bytes), and help pinpoint where parsing might be going wrong. These logs were instrumental in identifying the mixed endianness issue for numFiles.

Try-Catch Blocks: Used around sensitive operations like pako.ungzip and JSON.parse to gracefully handle errors and prevent the entire application from crashing, providing fallback behavior where possible.

In essence, this project provides a full lifecycle management tool for EPK files, from initial extraction and viewing to detailed content modification and re-archiving, with a strong emphasis on robust binary data parsing and manipulation.
