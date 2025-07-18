/*
NVPT Int32Array Structure:
------------------------------------------
Index 0: Total record length (in bytes)
Index 1: Record type identifier (expected 20010 for NAME_VALUE_PAIR_TABLE)
Index 2: Reserved / Bitfield
------------------------------------------
[Optional: Name Property Record] (if a "name" is provided)
    • Header: 12 bytes (Length, record type [e.g. 22205 for STRING_NAME], reserved/bitfield)
    • Name data: 4 bytes for the string length + UTF-8 bytes for "nvpt" (4 bytes)
    => Total = 12 + 8 = 20 bytes
------------------------------------------
[st_names Stringtable Record]
    • Header & metadata: 4 bytes for total record length plus additional overhead
    • Encoded strings with their own length fields
    => Total overhead approximated to 70 bytes
------------------------------------------
[arr_st_values Container Record]
    • Container header: 16 bytes
------------------------------------------
Two value stringtables are stored:
    • For “css”: header/length + two strings combined ≈ 60 bytes 
    • For “script”: header/length + two strings combined ≈ 80 bytes
------------------------------------------
Total expected bytes = 16 + 20 + 70 + 16 + 60 + 80 = 286 bytes
Notes:
• All lengths are in bytes.
• Alignment ensures the total is a multiple of 4.
*/

const assert = require('assert');
const Name_Value_Pair_Table = require('../src/Name_Value_Pair_Table');

global.subtest = global.subtest || function(label, fn) {
    try {
        fn();
        console.log(`    \x1b[32m✔\x1b[0m  ${label}`);
    } catch (err) {
        console.log(`    \x1b[31m✘\x1b[0m  ${label}`);
        console.error("         " + err);
    }
};

(function () {
    // Create an instance
    const nvpt = new Name_Value_Pair_Table({ name: 'nvpt' });

    // Test 1: Ensure method creates pairs and registers two distinct names.
    subtest('Ensure method and stringtable entries', () => {
        nvpt.ensure('css', 'bold');
        nvpt.ensure('css', 'dynamic');
        nvpt.ensure('script', 'javascript');
        nvpt.ensure('script', 'other-engine');
        assert.strictEqual(nvpt.name, 'nvpt', 'Name property should be "nvpt"');
        assert(nvpt.st_names.arr_strings && nvpt.st_names.arr_strings.length > 0, 'st_names should contain strings');
        assert.strictEqual(nvpt.st_names.arr_strings.length, 2, 'st_names should have 2 unique entries');
    });

    // Updated Subtest: Check NVPT data overall byte length.
    subtest('NVPT expected data length', () => {
        const ui8a = nvpt.toUint8Array();
        // Detailed overhead calculation:
        // • NVPT root header:                     16 bytes
        // • Name Property Record (if name exists): 20 bytes
        // • Primary Stringtable (st_names):        70 bytes
        // • Container header for value stringtables: 16 bytes
        // • Value Stringtable for "css":           60 bytes
        // • Value Stringtable for "script":        80 bytes
        // ---------------------------------------------------------
        // Total expected = 16 + 20 + 70 + 16 + 60 + 80 = 286 bytes
        const expectedLength = 286;
        console.log("NVPT data expected length:", expectedLength);
        assert.strictEqual(ui8a.length, expectedLength, "NVPT data length should match expected value");
    });

    // Test 2: Getter returns correct pair for existing name-value.
    subtest('Getter returns correct pair for css/bold', () => {
        const pair = nvpt.ensure('css', 'bold');
        const getPair = nvpt.get_name_id_value_id_pair('css', 'bold');
        assert.deepStrictEqual(pair, getPair, 'Ensure and getter should return the same pair');
    });

    // Test 3: Duplicate ensure calls return identical pair.
    subtest('Duplicate ensure calls consistency', () => {
        const pair1 = nvpt.ensure('script', 'javascript');
        const duplicatePair = nvpt.ensure('script', 'javascript');
        assert.deepStrictEqual(pair1, duplicatePair, 'Duplicate ensure calls should return the same pair');
    });

    // Test 4: Missing value returns undefined.
    subtest('Getter returns undefined for missing pair', () => {
        const missing = nvpt.get_name_id_value_id_pair('nonexistent', 'value');
        assert.strictEqual(missing, undefined, 'Getter should return undefined for missing pair');
    });

    // Test 5: Conversion to Uint8Array includes proper length header.
    subtest('toUint8Array conversion and header length check', () => {
        const ui8a = nvpt.toUint8Array();
        assert(ui8a instanceof Uint8Array, 'toUint8Array should return a Uint8Array');
        assert(ui8a.length > 0, 'Uint8Array length should be greater than 0');
        const lenField = new DataView(ui8a.buffer, ui8a.byteOffset).getInt32(0);
        assert.strictEqual(lenField, ui8a.length, 'Length header should match Uint8Array length');
    });

    // Test 6: Calculated size is positive and near the actual byte array length.
    subtest('Calculated size versus actual Uint8Array length', () => {
        const ui8a = nvpt.toUint8Array();
        const calcSize = nvpt.calc_size_as_ui8a();
        const tolerance = 16;
        assert(calcSize > 0, 'Calculated size should be > 0');
        assert(Math.abs(calcSize - ui8a.length) < tolerance,
            'Calculated size should be within tolerance of the Uint8Array length');
    });

    // Test 7: fromUint8Array restores the table correctly.
    subtest('Round-trip conversion via fromUint8Array', () => {
        const ui8a = nvpt.toUint8Array();
        const nvptRevived = Name_Value_Pair_Table.fromUint8Array(ui8a);
        assert.strictEqual(nvptRevived.name, nvpt.name, 'Revived name should match original');
        assert(nvptRevived.st_names.arr_strings && nvptRevived.st_names.arr_strings.length > 0,
               'Revived st_names should contain string entries');
    });

    // Test 8: Iteration returns all stored name-value pairs.
    subtest('Iteration over stored pairs', () => {
        // Iterate over names defined in the stringtable.
        const names = nvpt.names;
        assert(Array.isArray(names), 'Names should be an array');
        assert.strictEqual(names.length, 2, 'There should be 2 names defined');
        // Optionally, iterate all pairs via ensure and getter consistency.
        const pairCss = nvpt.get_name_id_value_id_pair('css', 'dynamic');
        assert(Array.isArray(pairCss), 'Pair should be an array');
    });

    //console.log('All individual tests in name_value_pair_table_test passed.');
})();
