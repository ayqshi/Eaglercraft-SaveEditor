# RePack — Eaglercraft Save Editor

> **Status: Beta**
>
> This project is still under active development. Expect bugs, rough edges, and incomplete features. If you are not comfortable troubleshooting issues on your own, you may want to wait for a more stable version.
>
> If you are interested in helping improve the project—especially usability and simplicity—contributions are welcome.
> Reach out (snap): **@ayqshi**

---

## What This Project Is

**RePack** is a browser-based tool for inspecting, editing, and rebuilding `.epk` save files used in Eaglercraft.

It is designed for users who want more control over their world data—whether that means exploring file contents, modifying NBT data, or understanding how `.epk` archives are structured internally.

---

## Features

### EPK Extraction

Decompile `.epk` archives and access their internal files.

* View the full contents of a save
* Understand file structure and layout
* No external tools required

---

### NBT Parsing (Readable JSON)

Automatically converts `.dat` (NBT) files into structured JSON.

* Makes complex binary data readable
* Easier inspection of player and world data
* Simplifies editing workflows

---

### File Editing

Edit supported file types directly in the browser:

* JSON (NBT data)
* Plain text files

Changes are applied in real time and reflected in the repacked archive.

---

### EPK Repacking

Rebuild a valid `.epk` archive after making edits.

* Preserves original structure
* Automatically re-compresses files when required (GZIP)
* Designed to minimize manual intervention

---

### Integrity Checks

Basic validation is included to reduce the chance of corruption:

* Header and footer verification
* CRC32 checks for file data consistency

---

### Binary File Handling

Files that cannot be displayed are still preserved:

* Shown as placeholders in the UI
* Included unchanged during repacking

---

## Usage

1. In Eaglercraft:

   * Select your world
   * Click **Backup** and export as `.epk`

2. In RePack:

   * Open the tool (beta)
   * Upload your `.epk` file

3. Browse and edit:

   * Select a file from the extracted list
   * Its contents will appear in the editor panel

4. Repack:

   * Save your changes
   * Download the rebuilt `.epk` file

---

## How It Works

RePack runs entirely in your browser using JavaScript. Files are processed locally and are not uploaded to any server.

### EPK Format Overview

An `.epk` archive contains:

* A header
* Version information
* File count (stored as Big-Endian)
* A metadata table for each file:

  * Name
  * Size
  * Offset
  * Compression type
  * CRC32 checksum
* File data blocks
* A footer

Most numeric values are stored as Little-Endian, except for the file count, which uses Big-Endian encoding.

---

### Internal Processing

When loading a file:

* The archive structure is parsed
* Metadata and offsets are read
* Files are decompressed if necessary
* NBT data is converted into JSON

When repacking:

* Metadata is rebuilt
* Files are recompressed where required
* CRC32 values are recalculated
* A valid `.epk` archive is generated

---

## Dependencies

* **Pako.js** — GZIP compression and decompression
* **NBT.js** — Parsing and handling NBT data

---

## Limitations

* Some edge cases may fail during extraction or repacking
* User interface is minimal and still evolving
* Binary files cannot be edited
* Error handling is not yet comprehensive

---

## Contributing

Feedback and contributions are encouraged, especially in areas like:

* Simplifying the user experience
* Improving error handling
* Expanding file support

---

## Notes

This tool is intended for users who want direct access to and control over their save data. It prioritizes transparency and functionality over polish at this stage of development.
