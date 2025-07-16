if ("undefined" == typeof nbt) throw console.error("Dependency Error: nbt.js not loaded! Please ensure the script path is correct."), alert("Error: nbt.js library not found. Please check console for details."), new Error("nbt.js not loaded.");
if ("undefined" == typeof pako) throw console.error("Dependency Error: pako.min.js not loaded! Please ensure the script path is correct."), alert("Error: pako.min.js library not found. Please check console for details."), new Error("pako.min.js not loaded.");
"undefined" == typeof Long && console.warn("Dependency Warning: long.min.js not loaded! ByteArrayOutputStream.writeLong functionality will be disabled. This might affect EPK timestamp handling.");
let epkFileInput, decompileButton, repackButton, statusMessageDiv, fileListContainer, fileContentEditor, saveChangesButton, messageBox, messageTitle, messageContent, messageCloseBtn, epkNameDisplay, activeFileNameDisplay, addFileButton, removeFileButton, epkFile = null,
    extractedFiles = new Map,
    activeFile = {
        name: null,
        buffer: null,
        nbtParsed: null,
        wasGzipped: !1
    };

let parsedSaveData = {};
let moddingMenuContainer;
let playerHealthInput, playerScoreInput, playerPosXInput, playerPosYInput, playerPosZInput;
let inventorySlotsContainer;
let newItemIdInput, newItemCountInput, addItemButton;
let applyModificationsButton;


function showStatusMessage(e, t) {
    statusMessageDiv ? (statusMessageDiv.textContent = e, statusMessageDiv.className = "status-message " + (t ? "status-" + t : ""), statusMessageDiv.classList.remove("hidden")) : console.warn("UI Warning: Status message div not found (ID 'status'). Cannot display status:", e)
}

function showMessageBox(e, t, n = "info") {
    messageBox && messageTitle && messageContent ? (messageTitle.textContent = e, messageContent.textContent = t, messageBox.style.display = "block") : (alert(`${e}\n\n${t}`), console.warn("UI Warning: Message box elements not fully found. Falling back to alert for message:", e))
}

function clearFileListDisplay() {
    fileListContainer ? fileListContainer.innerHTML = '<p class="text-gray-400 p-4 text-center">Upload an EPK file to see its contents here.</p>' : console.warn("UI Warning: fileListContainer (ID 'fileList') not found. Cannot clear file list display.")
}

function resetFileEditor() {
    fileContentEditor ? (fileContentEditor.value = "", fileContentEditor.placeholder = "Select a file from the left to view/edit its content.", fileContentEditor.disabled = !0) : console.warn("UI Warning: fileContentEditor (ID 'fileContentEditor') not found."), saveChangesButton ? saveChangesButton.disabled = !0 : console.warn("UI Warning: saveChangesButton (ID 'saveChangesButton') not found."), activeFileNameDisplay ? activeFileNameDisplay.textContent = "No file selected" : console.warn("UI Warning: activeFileNameDisplay (ID 'activeFileNameDisplay') not found."), removeFileButton ? removeFileButton.disabled = !0 : console.warn("UI Warning: removeFileButton (ID 'removeFileButton') not found."), activeFile = {
        name: null,
        buffer: null,
        nbtParsed: null,
        wasGzipped: !1
    };
    const e = fileListContainer ? fileListContainer.querySelector(".file-list-item.selected") : null;
    e && e.classList.remove("selected");
    clearModdingMenu(); 
    if (moddingMenuContainer) moddingMenuContainer.style.display = 'none'; 
}

function displayExtractedFiles(e) {
    clearFileListDisplay(), fileListContainer ? 0 !== e.size ? e.forEach(((e, t) => {
        const n = document.createElement("div");
        n.className = "file-list-item", n.dataset.filename = t;
        let s = t.split(".").pop().toLowerCase() || "binary";
        t.includes("/") && s.length > 5 ? s = t.includes("level0/") ? "CHUNK" : "UNKNOWN" : t.endsWith(".dat_old") && (s = "DAT_OLD");
        let o = "bg-gray-600";
        t.endsWith(".dat") && !t.endsWith(".dat_old") ? o = "bg-purple-700" : t.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i) ? o = "bg-blue-600" : t.match(/\.(txt|json|yml|xml|html|css|js|glsl)$/i) ? o = "bg-green-600" : t.match(/\.(ogg|wav|mp3)$/i) ? o = "bg-red-600" : "CHUNK" === s && (o = "bg-orange-600"), n.innerHTML = `<span>${t}</span><span class="file-type-badge ${o}">${s.toUpperCase()}</span>`, n.addEventListener("click", (() => {
            selectFileForEditing(t, e)
        })), fileListContainer.appendChild(n)
    })) : fileListContainer.innerHTML = '<p class="text-gray-400 p-4 text-center">No files extracted.</p>' : console.error("UI Error: Cannot display files, fileListContainer (ID 'fileList') not found.")
}

function arrayBufferToBase64(e) {
    let t = "";
    const n = new Uint8Array(e),
        s = n.byteLength;
    for (let e = 0; e < s; e++) t += String.fromCharCode(n[e]);
    return btoa(t)
}

function base64ToArrayBuffer(e) {
    const t = atob(e),
        n = t.length,
        s = new Uint8Array(n);
    for (let e = 0; e < n; e++) s[e] = t.charCodeAt(e);
    return s.buffer
}

async function viewNBTData(e, t) {
    showStatusMessage(`Attempting to parse NBT for ${e}...`, "info");
    let n = new Uint8Array(t);
    activeFile.wasGzipped = !1;
    try {
        if (n.length > 2 && 31 === n[0] && 139 === n[1]) try {
            n = pako.ungzip(n), activeFile.wasGzipped = !0, showStatusMessage(`Decompressed GZIP for ${e}.`, "info")
        } catch (t) {
            console.warn(`Could not decompress ${e} with GZIP. Assuming it's uncompressed or invalid GZIP.`, t)
        }
        const t = await new Promise(((e, t) => {
            nbt.parse(n.buffer, ((n, s) => {
                n ? t(n) : e(s)
            }))
        }));
        activeFile.nbtParsed = t, fileContentEditor && (fileContentEditor.value = JSON.stringify(t.value, null, 2)), saveChangesButton && (saveChangesButton.disabled = !1), showStatusMessage(`Successfully parsed NBT for ${e}.`, "success"), console.log("NBT Data Structure:", t)
    } catch (n) {
        console.error(`Error parsing NBT for ${e}:`, n), fileContentEditor && (fileContentEditor.value = `Error: Could not parse NBT data for ${e}.\n\nRaw data (Base64):\n${arrayBufferToBase64(t)}`, fileContentEditor.disabled = !0), saveChangesButton && (saveChangesButton.disabled = !0), showStatusMessage(`Error parsing NBT for ${e}. See console for details.`, "error")
    }
}

async function decryptEpk(e) {
    showStatusMessage("Attempting to decrypt EPK file...", "info");
    const t = new Uint8Array(e);
    let n = 0;
    const s = new Map;
    try {
        const e = t.subarray(n, n + 8);
        n += 8;
        const o = new Uint8Array([69, 65, 71, 80, 75, 71, 36, 36]),
            a = new Uint8Array([69, 65, 71, 80, 75, 71, 33, 33]);
        if (!arraysEqual(e, o)) throw arraysEqual(e, a) ? new Error("Legacy EPK format detected. This decompiler currently only supports 'ver2.x' EPK files.") : new Error("Unrecognized EPK file header.");
        const r = t.subarray(t.byteLength - 8, t.byteLength);
        if (!arraysEqual(r, new Uint8Array([58, 58, 58, 89, 69, 69, 58, 62]))) throw new Error("EPK file is missing EOF code (:::YEE:>)");
        const i = t.subarray(8, t.byteLength - 8),
            l = new DataView(i.buffer, i.byteOffset, i.byteLength);
        let c = 0;
        const d = l.getUint8(c++);
        const versionHeaderBytes = i.subarray(c, c + d);
        c += d;
        const u = new TextDecoder("ascii").decode(versionHeaderBytes); 
        if (!u.startsWith("ver2.")) throw new Error(`Unknown or invalid EPK version: ${u}`);
        const f = l.getUint8(c++);
        c += f;
        const g = l.getUint16(c, !1);
        c += 2, c += g, c += 8;
        let p = l.getInt32(c, !1);
        c += 4;
        const m = String.fromCharCode(l.getUint8(c++)),
            h = i.subarray(c);
        let w;
        switch (m) {
            case "G":
                showStatusMessage("Detected GZIP compression. Decompressing...", "info"), w = pako.ungzip(h);
                break;
            case "Z":
                showStatusMessage("Detected ZLIB compression. Decompressing...", "info"), w = pako.inflate(h);
                break;
            case "0":
                showStatusMessage("Detected no compression.", "info"), w = h;
                break;
            default:
                throw new Error(`Invalid or unsupported EPK compression: ${m}`)
        }
        const y = new DataView(w.buffer, w.byteOffset, w.byteLength);
        let E = 0;
        new CRC32;
        for (; p > 0;) {
            if (E + 4 > w.byteLength) {
                console.warn("Ran out of data while reading file entries before expected number of objects processed.");
                break
            }
            const e = w.subarray(E, E + 4);
            E += 4;
            const t = new TextDecoder("ascii").decode(e);
            if ("END$" === t) {
                p = 0;
                break
            }
            const n = y.getUint8(E++),
                o = w.subarray(E, E + n);
            E += n;
            const a = new TextDecoder("ascii").decode(o),
                r = y.getInt32(E, !1);
            let i;
            if (E += 4, "FILE" === t) {
                if (r < 5) throw new Error(`File '${a}' is incomplete (content too small).`);
                y.getInt32(E, !1);
                if (E += 4, i = w.slice(E, E + r - 5), E += r - 5, ":" !== String.fromCharCode(y.getUint8(E++))) throw new Error(`File '${a}' is incomplete (missing colon)`)
            } else i = w.slice(E, E + r), E += r;
            if (">" !== String.fromCharCode(y.getUint8(E++))) throw new Error(`Object '${a}' is incomplete (missing greater than)`);
            s.set(a, i.buffer), p--
        }
        return 0 !== p && console.warn(`Unexpectedly ended decryption with ${p} files remaining.`), showStatusMessage(`EPK file decrypted successfully. Found ${s.size} files.`, "success"), s
    } catch (e) {
        throw showStatusMessage(`EPK decryption failed: ${e.message}`, "error"), console.error("EPK Decryption Error:", e), e
    }
}

async function updateLevelDatLevelName(e) {
    const t = "level.dat",
        n = "world-name";
    if (extractedFiles.has(t)) {
        const n = extractedFiles.get(t);
        let s = new Uint8Array(n),
            o = !1;
        try {
            s.length > 2 && 31 === s[0] && 139 === s[1] && (s = pako.ungzip(s), o = !0);
            const n = await new Promise(((e, t) => {
                nbt.parse(s.buffer, ((n, s) => {
                    n ? t(n) : e(s)
                }))
            }));
            let a = n.value;
           
            if (a.Data && a.Data.value && a.Data.value.LevelName && "string" === a.Data.value.LevelName.type) {
                a.Data.value.LevelName.value = e;
                console.log(`Updated level.dat Data.LevelName to: "${e}"`);
            } else {
                if (!a.Data) {
                    a.Data = { type: "compound", value: {} };
                }
                if (!a.Data.value) {
                    a.Data.value = {};
                }
                a.Data.value.LevelName = {
                    type: "string",
                    value: e
                };
                console.log(`Added LevelName to level.dat Data: "${e}"`);
            }

            let i = new Uint8Array(nbt.writeUncompressed(n));
            o && (i = pako.gzip(i)), extractedFiles.set(t, i.buffer), showStatusMessage(`level.dat's LevelName updated to "${e}".`, "info")
        } catch (e) {
            console.error("Error updating level.dat's LevelName:", e), showStatusMessage(`Failed to update level.dat's LevelName: ${e.message}`, "error")
        }
    } else console.warn("level.dat not found in extracted files. Cannot update LevelName.");
    if (extractedFiles.has(n)) try {
        const t = (new TextEncoder).encode(e);
        extractedFiles.set(n, t.buffer), showStatusMessage(`${n} content updated to "${e}".`, "info")
    } catch (e) {
        console.error(`Error updating ${n}:`, e), showStatusMessage(`Failed to update ${n}: ${e.message}`, "error")
    } else console.warn(`${n} not found in extracted files. Not created or updated.`)
}

async function encryptEpk(e, t = null, n = "1.5.2") {
    showStatusMessage("Attempting to re-pack and encrypt EPK file...", "info");
    try {
        const s = new ByteArrayOutputStream;
        s.writeString("EAGPKG$$", "ascii");
        const o = "ver2.0";
        s.writeUint8(o.length), s.writeString(o, "ascii");
        const a = t ? `${t}.epk` : epkFile ? epkFile.name : "unknown.epk";
        s.writeUint8(a.length), s.writeString(a, "ascii");
        const r = new Date,
            i = `\n\n # Eagler EPK v2.0 - Generated by EaglerBinaryTools\n # update: on ${new Intl.DateTimeFormat("en-US",{month:"2-digit",day:"2-digit",year:"numeric"}).format(r)} at ${new Intl.DateTimeFormat("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).format(r)}\n\n`;
        if (s.writeUint16(i.length), s.writeString(i, "ascii"), "undefined" == typeof Long) throw console.error("Long.js library not found. Cannot write 64-bit integer."), new Error("Long.js library is required for writeLong.");
        s.writeLong(r.getTime());
        const l = new Map,
            c = [],
            d = ["_metadata"];
        for (const [n, s] of e.entries()) {
            let e = n.replace(/\\/g, "/");
            if (t && e.startsWith(`${t}/`) && (e = e.substring(t.length + 1)), e.startsWith("/") && (e = e.substring(1)), d.includes(e)) {
                c.push(n);
                continue
            }
            let o = e;
            l.set(o, s)
        }
        c.length > 0 && (console.warn(`Skipped ${c.length} non-world-content metadata files during repack:`, c.join(", ")), showStatusMessage(`Skipped ${c.length} non-essential metadata files.`, "info")), s.writeInt(l.size + 1);
        const u = "0";
        s.writeUint8(u.charCodeAt(0));
        const f = new ByteArrayOutputStream;
        f.writeString("HEAD", "ascii");
        const g = "file-type";
        f.writeUint8(g.length), f.writeString(g, "ascii");
        let p = "eaglercraft/world";
        "1.5.2" === n ? p = "epk/world152" : "1.8.8" === n && (p = "epk/world188"), f.writeInt(p.length), f.writeString(p, "ascii"), f.writeUint8(">".charCodeAt(0));
        const m = new CRC32;
        for (const [e, t] of l.entries()) {
            const n = new Uint8Array(t);
            m.reset(), m.update(n);
            const s = m.getValue();
            f.writeString("FILE", "ascii"), f.writeUint8(e.length), f.writeString(e, "ascii"), f.writeInt(n.length + 5), f.writeInt(s), f.writeBytes(n), f.writeUint8(":".charCodeAt(0)), f.writeUint8(">".charCodeAt(0))
        }
        let h;
        if (f.writeString("END$", "ascii"), "G" === u) h = pako.gzip(f.toByteArray());
        else if ("Z" === u) h = pako.deflate(f.toByteArray());
        else {
            if ("0" !== u) throw new Error(`Unsupported compression type for packing: ${u}`);
            h = f.toByteArray()
        }
        return s.writeBytes(h), s.writeString(":::YEE:>", "ascii"), showStatusMessage("EPK file re-packed and encrypted successfully.", "success"), s.toByteArray().buffer
    } catch (e) {
        throw showStatusMessage(`EPK re-packing failed: ${e.message}`, "error"), console.error("EPK Encryption Error:", e), e
    }
}

async function saveChanges() {
    if (activeFile.name) {
        showStatusMessage(`Saving changes to ${activeFile.name}...`, "info");
        try {
            let e; 
            if (activeFile.name.endsWith(".dat") && !activeFile.name.endsWith(".dat_old") && activeFile.nbtParsed) {
             
                let s = new Uint8Array(nbt.writeUncompressed(activeFile.nbtParsed));
                activeFile.wasGzipped && (s = pako.gzip(s));
                e = s.buffer;
                fileContentEditor.value = JSON.stringify(activeFile.nbtParsed.value, null, 2);
            } else if (activeFile.name.match(/\.(txt|json|yml|xml|html|css|js|glsl)$/i)) {
                e = new TextEncoder("utf-8").encode(fileContentEditor.value).buffer;
            } else {
                e = base64ToArrayBuffer(fileContentEditor.value.split("\n").slice(1).join("\n"));
            }
            extractedFiles.set(activeFile.name, e);
            activeFile.buffer = e;
            showStatusMessage(`Changes to ${activeFile.name} saved successfully in memory.`, "success");
            repackButton && (repackButton.disabled = !1);
        } catch (e) {
            console.error("Error saving changes:", e);
            showStatusMessage(`Error saving changes to ${activeFile.name}: ${e.message}`, "error");
            showMessageBox("Save Error", `Failed to save changes to ${activeFile.name}: ${e.message}`, "error");
            throw e; 
        }
    } else {
        showMessageBox("Error", "No file selected for saving.", "error");
    }
}

async function selectFileForEditing(e, t) {
    if (activeFile.name) {
        try {
            await saveChanges();
            showStatusMessage(`Changes to ${activeFile.name} saved before switching.`, "success");
        } catch (e) {
            showStatusMessage(`Error saving changes to ${activeFile.name} before switching: ${e.message}`, "error");
        }
    }
    const n = fileListContainer ? fileListContainer.querySelector(".file-list-item.selected") : null;
    n && n.classList.remove("selected");
    const s = fileListContainer ? fileListContainer.querySelector(`[data-filename="${e}"]`) : null;
    s && s.classList.add("selected");
    showStatusMessage(`Loading ${e} into editor...`, "info");
    fileContentEditor && (fileContentEditor.disabled = !1);
    saveChangesButton && (saveChangesButton.disabled = !0);
    removeFileButton && (removeFileButton.disabled = !1);
    activeFileNameDisplay && (activeFileNameDisplay.textContent = e);
    activeFile = {
        name: e,
        buffer: t,
        nbtParsed: null,
        wasGzipped: !1
    };

   
    if (moddingMenuContainer) {
        if (e.endsWith(".dat") && !e.endsWith(".dat_old") && e !== 'session.lock') {
            try {
                await viewNBTData(e, t); 
                if (activeFile.nbtParsed && activeFile.nbtParsed.value &&
                    activeFile.nbtParsed.value.Data && activeFile.nbtParsed.value.Data.value &&
                    activeFile.nbtParsed.value.Data.value.Player) {
                    parsedSaveData = activeFile.nbtParsed.value;
                    moddingMenuContainer.style.display = 'block';
                    fileContentEditor.value = JSON.stringify(parsedSaveData, null, 2);
                    saveChangesButton.disabled = false;
                    showStatusMessage(`Loaded NBT file: ${e}. Modding menu active.`, 'success');
                } else {
                    console.warn(`Selected .dat file '${e}' does not contain expected Player data for modding.`);
                    fileContentEditor.value = `// .dat file without recognized player data structure. Displaying as JSON.\n` + JSON.stringify(activeFile.nbtParsed ? activeFile.nbtParsed.value : {}, null, 2);
                    moddingMenuContainer.style.display = 'none';
                    clearModdingMenu();
                    saveChangesButton.disabled = false;
                }
            } catch (err) {
                console.error(`Error parsing NBT for modding menu for ${e}:`, err);
                fileContentEditor.value = `Error: Could not parse NBT data for ${e} for modding. Raw content shown.\n\nRaw data (Base64):\n${arrayBufferToBase64(t)}`;
                moddingMenuContainer.style.display = 'none';
                clearModdingMenu();
                showStatusMessage(`Error parsing NBT for ${e}. Modding menu unavailable.`, "error");
                saveChangesButton.disabled = true; 
            }
        } else {
            try {
                if (e.match(/\.(txt|json|yml|xml|html|css|js|glsl)$/i)) {
                    const n = new TextDecoder("utf-8", {
                        fatal: !0
                    });
                    try {
                        fileContentEditor && (fileContentEditor.value = n.decode(t));
                        showStatusMessage(`Loaded ${e} as text.`, "success");
                    } catch (n) {
                        console.warn(`Failed to decode ${e} as UTF-8, attempting Base64:`, n);
                        fileContentEditor && (fileContentEditor.value = `// Failed to decode as UTF-8, showing as Base64. Edit carefully!\n${arrayBufferToBase64(t)}`);
                        showStatusMessage(`Loaded ${e} as Base64 (UTF-8 decode failed).`, "warning");
                    }
                } else {
                    fileContentEditor && (fileContentEditor.value = `// Binary file, showing as Base64. Edit carefully!\n${arrayBufferToBase64(t)}`);
                    showStatusMessage(`Loaded ${e} as Base64.`, "info");
                }
                saveChangesButton.disabled = false; 
            } catch (err) {
                console.error(`Error loading ${e}:`, err);
                fileContentEditor && (fileContentEditor.value = `Error loading file: ${err.message}`, fileContentEditor.disabled = !0);
                saveChangesButton.disabled = !0;
                showStatusMessage(`Error loading ${e}.`, "error");
            }
            moddingMenuContainer.style.display = 'none';
            clearModdingMenu();
        }
    }
}

function renderModdingMenu(data) {
    if (!moddingMenuContainer) {
        console.error("Modding menu container not found!");
        return;
    }

    moddingMenuContainer.innerHTML = `
        <h2 class="section-header">4. Modding Menu</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="mod-section">
                <h3 class="text-xl font-semibold text-purple-300 mb-3">Player Stats</h3>
                <label for="playerHealth" class="block text-sm font-medium text-gray-300">Health (0-20):</label>
                <input type="number" id="playerHealth" value="${data.Player.value.Health ? data.Player.value.Health.value : 20}" min="0" max="20" class="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:ring-purple-500 text-white">

                <label for="playerScore" class="block text-sm font-medium text-gray-300 mt-3">Score:</label>
                <input type="number" id="playerScore" value="${data.Player.value.Score ? data.Player.value.Score.value : 0}" min="0" class="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:ring-purple-500 text-white">

                <label for="playerPosX" class="block text-sm font-medium text-gray-300 mt-3">Position X:</label>
                <input type="number" id="playerPosX" value="${data.Player.value.Pos ? data.Player.value.Pos.value.value[0] : 0}" step="0.01" class="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:ring-purple-500 text-white">
                <label for="playerPosY" class="block text-sm font-medium text-gray-300 mt-3">Position Y:</label>
                <input type="number" id="playerPosY" value="${data.Player.value.Pos ? data.Player.value.Pos.value.value[1] : 0}" step="0.01" class="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:ring-purple-500 text-white">
                <label for="playerPosZ" class="block text-sm font-medium text-gray-300 mt-3">Position Z:</label>
                <input type="number" id="playerPosZ" value="${data.Player.value.Pos ? data.Player.value.Pos.value.value[2] : 0}" step="0.01" class="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:ring-purple-500 text-white">

            </div>

            <div class="mod-section">
                <h3 class="text-xl font-semibold text-purple-300 mb-3">Inventory Editor</h3>
                <div id="inventorySlots" class="grid grid-cols-5 gap-2 bg-gray-800 p-3 rounded-md max-h-60 overflow-y-auto">
                    </div>
                <div class="mt-4 flex gap-2">
                    <input type="text" id="newItemId" placeholder="minecraft:diamond" class="flex-grow rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:ring-purple-500 text-white">
                    <input type="number" id="newItemCount" placeholder="Count" value="1" min="1" max="64" class="w-20 rounded-md bg-gray-700 border-transparent focus:border-purple-500 focus:ring-purple-500 text-white">
                    <button id="addItemButton" class="button button-sm bg-green-600 hover:bg-green-700">Add Item</button>
                </div>
            </div>
        </div>
        <button id="applyModificationsButton" class="button primary-button w-full mt-6">Apply Modifications</button>
    `;
    playerHealthInput = document.getElementById("playerHealth");
    playerScoreInput = document.getElementById("playerScore");
    playerPosXInput = document.getElementById("playerPosX");
    playerPosYInput = document.getElementById("playerPosY");
    playerPosZInput = document.getElementById("playerPosZ");

    inventorySlotsContainer = document.getElementById("inventorySlots");
    newItemIdInput = document.getElementById("newItemId");
    newItemCountInput = document.getElementById("newItemCount");
    addItemButton = document.getElementById("addItemButton");
    applyModificationsButton = document.getElementById("applyModificationsButton");


    renderInventory(data.Player.value.Inventory);
    addModdingMenuListeners(data); 
}

function renderInventory(inventory) {
    if (!inventorySlotsContainer) {
        console.error("Inventory slots container not found!");
        return;
    }
    inventorySlotsContainer.innerHTML = '';
    if (!inventory || !inventory.value || !inventory.value.value || inventory.value.value.length === 0) {
        inventorySlotsContainer.innerHTML = '<p class="text-gray-400">Inventory is empty.</p>';
        return;
    }

    inventory.value.value.forEach((item, index) => {
        if (!item.id || item.id.type !== 'string' || !item.Count || item.Count.type !== 'byte' || !item.Slot || item.Slot.type !== 'byte') {
            console.warn("Skipping malformed inventory item:", item);
            return;
        }

        const slotDiv = document.createElement('div');
        slotDiv.className = 'relative group cursor-pointer border border-gray-600 rounded-md p-1 flex flex-col items-center justify-center text-center text-sm bg-gray-900 hover:bg-gray-700 transition duration-150 ease-in-out';
        slotDiv.title = `${item.Count.value}x ${item.id.value} (Slot: ${item.Slot.value})`; 

        slotDiv.innerHTML = `
            <span class="text-xs text-purple-300">${item.id.value.split(':')[1] || item.id.value}</span>
            <span class="text-white text-lg font-bold">${item.Count.value}</span>
            <button class="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-index="${index}">✖</button>
        `;

        inventorySlotsContainer.appendChild(slotDiv);
    });

    inventorySlotsContainer.querySelectorAll('button').forEach(button => {
        button.onclick = (event) => {
            const index = parseInt(event.target.dataset.index);
            if (parsedSaveData && parsedSaveData.Data && parsedSaveData.Data.value &&
                parsedSaveData.Data.value.Player && parsedSaveData.Data.value.Player.value &&
                parsedSaveData.Data.value.Player.value.Inventory && parsedSaveData.Data.value.Player.value.Inventory.value &&
                parsedSaveData.Data.value.Player.value.Inventory.value.value) {

                parsedSaveData.Data.value.Player.value.Inventory.value.value.splice(index, 1);
                renderInventory(parsedSaveData.Data.value.Player.value.Inventory);
                showStatusMessage('Item removed from inventory.', 'success');
            }
        };
    });
}

function addModdingMenuListeners(data) { 
    if (playerHealthInput) playerHealthInput.onchange = (e) => {
        data.Player.value.Health.value = parseInt(e.target.value); 
    };
    if (playerScoreInput) playerScoreInput.onchange = (e) => {
        data.Player.value.Score.value = parseInt(e.target.value);
    }
    if (playerPosXInput) playerPosXInput.onchange = (e) => {
        data.Player.value.Pos.value.value[0] = parseFloat(e.target.value); 
    };
    if (playerPosYInput) playerPosYInput.onchange = (e) => {
        data.Player.value.Pos.value.value[1] = parseFloat(e.target.value); 
    };
    if (playerPosZInput) playerPosZInput.onchange = (e) => {
        data.Player.value.Pos.value.value[2] = parseFloat(e.target.value);
    };

    if (addItemButton) addItemButton.onclick = () => {
        const newItemId = newItemIdInput.value.trim();
        const newItemCount = parseInt(newItemCountInput.value);

        if (!newItemId) {
            showStatusMessage('Please enter an Item ID.', 'error');
            return;
        }
        if (isNaN(newItemCount) || newItemCount < 1 || newItemCount > 64) {
            showStatusMessage('Item count must be between 1 and 64.', 'error');
            return;
        
        let nextSlot = 0;
        const existingSlots = new Set(data.Player.value.Inventory.value.value.map(item => item.Slot.value));
        while (existingSlots.has(nextSlot) && nextSlot < 36) { 
            nextSlot++;
        }

        if (nextSlot >= 36) {
            showStatusMessage('Inventory is full! Cannot add more items.', 'error');
            return;
        }

        const newItem = {
            id: {
                type: 'string',
                value: newItemId
            },
            Count: {
                type: 'byte',
                value: newItemCount
            },
            Slot: {
                type: 'byte',
                value: nextSlot
            },
        };

        
        if (!data.Player.value.Inventory) {
            data.Player.value.Inventory = {
                type: 'list',
                value: {
                    type: 'compound',
                    value: []
                }
            };
        }
        data.Player.value.Inventory.value.value.push(newItem);
        renderInventory(data.Player.value.Inventory); 
        showStatusMessage(`Added ${newItemCount}x ${newItemId} to inventory.`, 'success');
        newItemIdInput.value = '';
        newItemCountInput.value = '1'; 
    };

    if (applyModificationsButton) applyModificationsButton.onclick = () => {
        saveChanges();
        showStatusMessage('Modifications applied to in-memory save data. Click "Re-pack EPK" to save to file.', 'success');
    };
}

function clearModdingMenu() {
    if (moddingMenuContainer) {
        moddingMenuContainer.innerHTML = '<p class="text-gray-400 p-4 text-center">Select a save file (.dat) to access modding options.</p>';
    }
    parsedSaveData = {};
}


class ByteArrayOutputStream {
    constructor() {
        this.buffer = [], this.offset = 0
    }
    writeUint8(e) {
        const t = new Uint8Array(1);
        new DataView(t.buffer).setUint8(0, e), this.buffer.push(t.buffer), this.offset += 1
    }
    writeUint16(e, t = !1) {
        const n = new Uint8Array(2);
        new DataView(n.buffer).setUint16(0, e, t), this.buffer.push(n.buffer), this.offset += 2
    }
    writeInt(e, t = !1) {
        const n = new Uint8Array(4);
        new DataView(n.buffer).setInt32(0, e, t), this.buffer.push(n.buffer), this.offset += 4
    }
    writeLong(e) {
        if ("undefined" == typeof Long) throw console.error("Long.js library not found. Cannot write 64-bit integer."), new Error("Long.js library is required for writeLong.");
        const t = Long.fromValue(e),
            n = new Uint8Array(8),
            s = new DataView(n.buffer);
        s.setInt32(0, t.high, !1), s.setInt32(4, t.low, !1), this.buffer.push(n.buffer), this.offset += 8
    }
    writeString(e, t = "ascii") {
        const n = new TextEncoder(t).encode(e);
        this.buffer.push(n.buffer), this.offset += n.length
    }
    writeBytes(e) {
        const t = new Uint8Array(e);
        this.buffer.push(t.buffer.slice(t.byteOffset, t.byteLength + t.byteOffset)), this.offset += t.byteLength
    }
    toByteArray() {
        if (0 === this.buffer.length) return new Uint8Array(0);
        const e = this.buffer.reduce(((e, t) => e + t.byteLength), 0),
            t = new Uint8Array(e);
        let n = 0;
        return this.buffer.forEach((e => {
            t.set(new Uint8Array(e), n), n += e.byteLength
        })), t
    }
}

function arraysEqual(e, t) {
    if (e.length !== t.length) return !1;
    for (let n = 0; n < e.length; n++)
        if (e[n] !== t[n]) return !1;
    return !0
}
class CRC32 {
    constructor() {
        this.crc = -1, this.table = new Uint32Array(256);
        for (let e = 0; e < 256; e++) {
            let t = e;
            for (let e = 0; e < 8; e++) t = 1 & t ? 3988292384 ^ t >>> 1 : t >>> 1;
            this.table[e] = t
        }
    }
    update(e) {
        let t = this.crc;
        for (let n = 0; n < e.length; n++) t = t >>> 8 ^ this.table[255 & (t ^ e[n])];
        this.crc = t
    }
    getValue() {
        return ~this.crc
    }
    reset() {
        this.crc = -1
    }
}
document.addEventListener("DOMContentLoaded", (() => {
    epkFileInput = document.getElementById("epkFileInput"), epkFileInput || console.error("DOM Error: Element with ID 'epkFileInput' not found!"), decompileButton = document.getElementById("decompileButton"), decompileButton || console.error("DOM Error: Element with ID 'decompileButton' not found!"), repackButton = document.getElementById("repackButton"), repackButton || console.error("DOM Error: Element with ID 'repackButton' not found!"), statusMessageDiv = document.getElementById("statusMessage"), statusMessageDiv || console.error("DOM Error: Element with ID 'statusMessage' not found!"), fileListContainer = document.getElementById("fileList"), fileListContainer || console.error("DOM Error: Element with ID 'fileList') not found!"), fileContentEditor = document.getElementById("fileContentEditor"), fileContentEditor || console.error("DOM Error: Element with ID 'fileContentEditor') not found!"), saveChangesButton = document.getElementById("saveChangesButton"), saveChangesButton || console.error("DOM Error: Element with ID 'saveChangesButton') not found!"), messageBox = document.getElementById("messageBox"), messageBox || console.error("DOM Error: Element with ID 'messageBox') not found!"), messageTitle = document.getElementById("messageTitle"), messageTitle || console.error("DOM Error: Element with ID 'messageTitle') not found!"), messageContent = document.getElementById("messageContent"), messageContent || console.error("DOM Error: Element with ID 'messageContent') not found!"), messageCloseBtn = document.getElementById("messageCloseBtn"), messageCloseBtn || console.error("DOM Error: Element with ID 'messageCloseBtn') not found!"), epkNameDisplay = document.getElementById("epkName"), epkNameDisplay || console.error("DOM Error: Element with ID 'epkName') not found!"), activeFileNameDisplay = document.getElementById("activeFileNameDisplay"), activeFileNameDisplay || console.error("DOM Error: Element with ID 'activeFileNameDisplay') not found!"), addFileButton = document.getElementById("addFileButton"), addFileButton || console.error("DOM Error: Element with ID 'addFileButton') not found!"), removeFileButton = document.getElementById("removeFileButton"), removeFileButton || console.error("DOM Error: Element with ID 'removeFileButton') not found!");

    moddingMenuContainer = document.getElementById("moddingMenuContainer");
    if (!moddingMenuContainer) console.error("DOM Error: Element with ID 'moddingMenuContainer' not found!");

    playerHealthInput = document.getElementById("playerHealth");
    playerScoreInput = document.getElementById("playerScore");
    playerPosXInput = document.getElementById("playerPosX");
    playerPosYInput = document.getElementById("playerPosY");
    playerPosZInput = document.getElementById("playerPosZ");

    inventorySlotsContainer = document.getElementById("inventorySlots");
    newItemIdInput = document.getElementById("newItemId");
    newItemCountInput = document.getElementById("newItemCount");
    addItemButton = document.getElementById("addItemButton");
    applyModificationsButton = document.getElementById("applyModificationsButton");


    decompileButton && (decompileButton.disabled = !0), repackButton && (repackButton.disabled = !0), saveChangesButton && (saveChangesButton.disabled = !0), fileContentEditor && (fileContentEditor.disabled = !0), addFileButton && (addFileButton.disabled = !1), removeFileButton && (removeFileButton.disabled = !0), epkNameDisplay && (epkNameDisplay.textContent = "No EPK Loaded"), activeFileNameDisplay && (activeFileNameDisplay.textContent = "No file selected"), showStatusMessage("Select an EPK file to get started.", "info");

    if (moddingMenuContainer) moddingMenuContainer.style.display = 'none';

    epkFileInput && epkFileInput.addEventListener("change", (e => {
        epkFile = e.target.files[0], epkFile ? (showStatusMessage(`File selected: ${epkFile.name}`, "info"), decompileButton && (decompileButton.disabled = !1), repackButton && (repackButton.disabled = !0), epkNameDisplay && (epkNameDisplay.textContent = epkFile.name), clearFileListDisplay(), resetFileEditor()) : (showStatusMessage("No file selected.", "warning"), decompileButton && (decompileButton.disabled = !0), repackButton && (repackButton.disabled = !0), epkNameDisplay && (epkNameDisplay.textContent = "No EPK Loaded"))
    })), decompileButton && decompileButton.addEventListener("click", (async () => {
        if (!epkFile) return showMessageBox("Error", "Please select an EPK file first.", "error");
        showStatusMessage("Reading file...", "info"), decompileButton.disabled = !0, repackButton && (repackButton.disabled = !0), resetFileEditor();
        const e = new FileReader;
        e.onload = async e => {
            try {
                const t = e.target.result;
                extractedFiles = await decryptEpk(t), displayExtractedFiles(extractedFiles), repackButton && (repackButton.disabled = !1), decompileButton.disabled = !1, showMessageBox("Decompiled", `EPK file '${epkFile.name}' decompiled successfully. Found ${extractedFiles.size} files.`, "success")
            } catch (e) {
                console.error("Decryption failed:", e), showStatusMessage(`Decryption failed: ${e.message}`, "error"), showMessageBox("Decryption Failed", `Failed to decompile EPK: ${e.message}`, "error")
            }
        }, e.onerror = e => {
            showStatusMessage(`Error reading file: ${e.target.error.message}`, "error"), decompileButton.disabled = !1, showMessageBox("File Read Error", `Error reading selected EPK file: ${e.target.error.message}`, "error")
        }, e.readAsArrayBuffer(epkFile)
    })), saveChangesButton && saveChangesButton.addEventListener("click", (async () => {
        try {
            await saveChanges(), showMessageBox("Saved", `Changes to "${activeFile.name}" saved!`, "success")
        } catch (e) {}
    })), repackButton && repackButton.addEventListener("click", (async () => {
        if (0 === extractedFiles.size) return void showMessageBox("Error", "No files to repack. Decompile an EPK first.", "error");
        if (activeFile.name) try {
            await saveChanges()
        } catch (e) {
            return void showMessageBox("Repack Error", `Failed to save current file's changes before repacking: ${e.message}`, "error")
        }
        let e = "EaglerWorld";
        epkFile && epkFile.name && (e = epkFile.name.replace(/\.epk$/i, "").trim(), e = e.replace(/[^\w\s-.]/g, ""), "" === e && (e = "EaglerWorld")), showMessageBox("Repacking World", `The world will be named and placed in a folder called:\n\n"${e}"\n\nThis name is derived from your input EPK file name.`, "info");
        let t = prompt("Enter the Eaglercraft world version (e.g., '1.5.2' or '1.8.8'). This affects EPK format:", "1.5.2");
        if (null !== t)
            if (t = t.trim(), "1.5.2" === t || "1.8.8" === t) {
                showStatusMessage("Repacking EPK file...", "info"), decompileButton && (decompileButton.disabled = !0), repackButton.disabled = !0;
                try {
                    await updateLevelDatLevelName(e);
                    const n = await encryptEpk(extractedFiles, e, t),
                        s = new Blob([n], {
                            type: "application/octet-stream"
                        }),
                        o = URL.createObjectURL(s),
                        a = document.createElement("a");
                    a.href = o, a.download = `${e}.epk`, document.body.appendChild(a), a.click(), document.body.removeChild(a), URL.revokeObjectURL(o), showStatusMessage("EPK file repacked and downloaded successfully!", "success"), showMessageBox("Repacked", `EPK file '${a.download}' repacked and downloaded successfully! You can now try importing this into Eaglercraft.`, "success")
                } catch (e) {
                    console.error("Repacking failed:", e), showStatusMessage(`Repacking failed: ${e.message}`, "error"), showMessageBox("Repack Error", `Failed to repack EPK file: ${e.message}`, "error")
                } finally {
                    decompileButton && (decompileButton.disabled = !1), repackButton.disabled = !1
                }
            } else showMessageBox("Input Error", "Invalid world version. Please enter '1.5.2' or '1.8.8'. Repack cancelled.", "error");
        else showStatusMessage("Repack cancelled by user.", "info")
    })), messageCloseBtn && messageCloseBtn.addEventListener("click", (() => {
        messageBox && (messageBox.style.display = "none")
    })), addFileButton && addFileButton.addEventListener("click", (() => {
        const e = document.createElement("input");
        e.type = "file", e.onchange = async e => {
            const t = e.target.files[0];
            if (!t) return;
            const n = new FileReader;
            n.onload = async e => {
                extractedFiles.set(t.name, e.target.result), displayExtractedFiles(extractedFiles), showMessageBox("File Added", `File "${t.name}" added to the EPK in memory.`, "success"), repackButton && (repackButton.disabled = !1)
            }, n.readAsArrayBuffer(t)
        }, e.click()
    })), removeFileButton && removeFileButton.addEventListener("click", (() => {
        activeFile.name ? confirm(`Are you sure you want to remove "${activeFile.name}" from the EPK?`) && (extractedFiles.delete(activeFile.name), resetFileEditor(), displayExtractedFiles(extractedFiles), showMessageBox("File Removed", `File "${activeFile.name}" removed from the EPK in memory.`, "info"), repackButton && (repackButton.disabled = !1)) : showMessageBox("Warning", "No file selected to remove.", "warning")
    }))
}));
