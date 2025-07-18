# int32array-table

## Overview

This package provides tools to efficiently store and manipulate structured data using JavaScript's Typed Arrays (Int32Array and Uint8Array). The design emphasizes explicit control over binary layouts, making it ideal for high-performance data processing where every byte counts.

## Data Structures

### Stringtable

**Purpose:**  
Stores unique strings in a compact binary form.

**Low-Level Storage:**  
- Maintains an internal array of strings (`arr_strings`).
- Each string is encoded with UTF-8.
- **Serialization (`toUint8Array()`):**
  - A 4-byte header indicates the total byte length.
  - Every string is stored with its own 4-byte length field plus the UTF‑8 encoded bytes.
  - Additional metadata and alignment (padding to 4-byte boundaries) may be applied.

**Diagram:**
```
+--------------------------------------------------+
|                    Stringtable                   |
+--------------------------------------------------+
| Header: [ Total Length (bytes) ]                 |
| Data:   [ Length, UTF-8 bytes for each string ]  |
+--------------------------------------------------+
```

**Example Code:**
```javascript
// Serialize a stringtable:
const st = new Stringtable();
st.ensure('hello');  // adds the string if missing
const ta = st.toUint8Array();
console.log(ta);
// => Uint8Array [ header bytes, encoded "hello", ... ]
```

### Name_Value_Pair_Table

**Purpose:**  
Manages key/value pairs by utilizing a primary Stringtable for names and a container for value stringtables.

**Low-Level Storage & Overhead:**  
- **NVPT Root Header (16 bytes):**
  - Four 4-byte values (e.g., total length, record type, reserved, extra info).
- **Optional Name Property Record (20 bytes if present):**
  - A 12-byte header (length, type, bitfield) plus a string field (4 bytes for its length followed by the UTF‑8 bytes).
- **Primary Stringtable (`st_names`):**
  - Includes its own header and overhead from storing each string with a length field.
  - Overhead can be significant (e.g., around 70 bytes) due to metadata and alignment.
- **Container for Value Stringtables:**
  - A fixed 16-byte container header plus headers and data for each grouped value table.
  - Each individual value stringtable also includes its own header and per-string overhead.
  
**How Overhead Comes About:**

When a record is serialized:
- A **fixed header** provides a constant overhead (e.g., 16 bytes for the root record).
- Each subrecord (like the name property) adds its **own header** (e.g., 12 bytes) and the cost of storing the string (a 4-byte length field plus the string’s UTF‑8 bytes).
- **Stringtables** contribute extra overhead because each string is preceded by a 4-byte length, and a record header is added for the entire table.
- **Alignment padding** is applied automatically to ensure the total byte length is a multiple of 4, so if the raw total isn’t divisible by 4 additional bytes will be added.

**Illustrative Example (Different from Test Case):**

Suppose you serialize a table with:
- A 16-byte root header.
- A name record for "example" that costs 20 bytes.
- A primary stringtable that, due to several strings and its internal header, uses 90 bytes.
- A container record for value stringtables (16 bytes), with two value stringtables consuming 50 and 70 bytes respectively.

The overall byte cost would be:
```
16 (root header) + 20 (name record) + 90 (primary stringtable) + 16 (container) + 50 + 70 = 262 bytes
```
Padding might then increase this total to meet alignment requirements.

**Diagram:**
```
+--------------------------------------------------+
|         Name_Value_Pair_Table Structure          |
+--------------------------------------------------+
| NVPT Root Header       (16 bytes)                |
| ├─ Name Property Record (optional, 20 bytes)     |
| ├─ Primary Stringtable  (≈70 bytes overhead)     |
| └─ Value Stringtables:                           |
|      ├─ Container Header (16 bytes)              |
|      ├─ Value Table 1      (e.g., ~60 bytes)      |
|      └─ Value Table 2      (e.g., ~80 bytes)      |
+--------------------------------------------------+
```

**Example Code:**
```javascript
// Create and serialize a name/value pair table:
const nvpt = new Name_Value_Pair_Table({name: 'nvpt'});
nvpt.ensure('css', 'bold');
const ui8a = nvpt.toUint8Array();
console.log(ui8a);
// => Uint8Array with header, name record, st_names block, and value stringtables.
```

### Compact_Int32Array_Table

**Purpose:**  
Provides a dynamically growing table of records stored in a contiguous Int32Array.

**Low-Level Storage:**  
- Each record includes:
  1. **Header (Minimum 12 bytes):**
     - 4 bytes: Total record length in bytes
     - 4 bytes: Record type identifier
     - 4 bytes: Bitfield (additional flags/metadata)
  2. **Body:**
     - The actual record content (e.g., numeric values or nested records)
- Records are stored sequentially and may include custom headers for nested data.

**Diagram:**
```
+--------------------------------------------------+
|             Compact_Int32Array_Table             |
+--------------------------------------------------+
| [ Record 1 ]     [ Record 2 ]    ...             |
+--------------------------------------------------+
           │                     │
           ▼                     ▼
+---------------------------+  +---------------------------+
| Header:                   |  | Header:                   |
| [ Len, Type, BF ]         |  | [ Len, Type, BF ]         |
| Data                      |  | Data                      |
+---------------------------+  +---------------------------+
```

**Sample Header Layout:**
```javascript
// Example header for one record:
// [ 24 (record length in bytes), 20010 (record type: NAME_VALUE_PAIR_TABLE),
//   3 (bitfield), ...data... ]
```

### Compact_Int32Array_Record

**Purpose:**  
Represents a single record with a header and data section.

**Low-Level Storage:**  
- **Header:**  
  - 4 bytes: Total record length in bytes  
  - 4 bytes: Record type identifier  
  - 4 bytes: Bitfield (flags, stored as 32-bit integer using bit masks)
- **Data:**  
  - Actual content, stored after the header

**Diagram:**
```
+--------------------------------------------------+
|           Compact_Int32Array_Record              |
+--------------------------------------------------+
| Header: [ Length (bytes) | Type | Bitfield ]      |
| Data:   [ Content … ]                            |
+--------------------------------------------------+
```

**Example Code for Bitfield Operations:**
```javascript
const rec = new Compact_Int32Array_Record({ /* ... */ });
rec.set_bitfield_value(2, 1);  // Set flag at bit index 2
console.log(rec.get_bitfield_value(2)); // => 1
```

### STA_Record_Reader

**Purpose:**  
Facilitates reading nested records from a Uint8Array via a DataView.

**Low-Level Storage:**  
- Uses a DataView to interpret 4-byte segments:
  - Bytes 0–3: Record length (in bytes).
  - Bytes 4–7: Record type.
  - Following bytes: Bitfields and contained data.
- Iterates recursively based on the header lengths.

**Diagram:**
```
+--------------------------------------------------+
|                STA_Record_Reader                 |
+--------------------------------------------------+
| DataView → Reads Header                          |
|    ( Length, Type, Flags )                       |
| Iterates Inner Records                           |
+--------------------------------------------------+
```

**Example Usage:**
```javascript
const reader = new STA_Record_Reader({ sta: someUint8Array });
for (const child of reader.iterate_child_readers()) {
  console.log('Child record type:', child.getInt32(4));
}
```

## Data Flow and Serialization

1. **Determine Total Byte Length:**  
   Each component calculates its complete size (headers + body data), taking into account per-string length fields and necessary padding.
2. **Allocate Uint8Array:**  
   The exact size is allocated to avoid reallocation.
3. **Write Record Headers:**  
   DataView is used to write each record’s fixed-size header (e.g., total length, record type, bitfield).
4. **Append Data:**  
   Data such as strings are appended, ensuring each string is preceded by its own length field.
5. **Automatic Padding:**  
   The final output is padded to a 4-byte boundary if needed.

## Efficiency Considerations

- **Pre-allocation:**  
  Dynamically growing the underlying Typed Array minimizes costly reallocations.
- **Fixed Overhead:**  
  Each record has a predictable overhead (e.g., 12–16 bytes), which helps in rapid serialization and deserialization.
- **Low-Level Operations:**  
  Direct use of DataView for 32-bit field operations and deliberate control over alignment improves performance.

## Conclusion

The int32array-table package offers an efficient way to work with binary data by breaking every component into deliberate header and data portions. Clear control over overhead ensures both consistency and performance in data processing pipelines.

Use the exported modules:
```javascript
const {
  Stringtable,
  Name_Value_Pair_Table,
  Compact_Int32Array_Table,
  Compact_Int32Array_Record,
  STA_Record_Reader
} = require('int32array-table');
```
to build robust, high-performance applications.