const assert = require('assert');
const Compact_Int32Array_Table = require('../src/Compact_Int32Array_Table');
const Compact_Int32Array_Record = require('../src/Compact_Int32Array_Record');

// Define a simple record subclass with a single value.
class SimpleRecord extends Compact_Int32Array_Record {
    constructor(spec = {}) {
        // Create a simple record with 4 elements:
        // [record length, record type, field value, bitfield]
        const value = spec.value || 0;
        const ta = new Int32Array([4, 64, value, 0]);
        super(ta);
        this.field = value;
    }
}

// Define a simple table subclass that uses SimpleRecord.
class SimpleTable extends Compact_Int32Array_Table {
    constructor(spec = {}) {
        super(Object.assign({}, spec, {Record: SimpleRecord}));
        this.next_record_id = 0;
    }
    // Override parse_record to support object input.
    parse_record(record) {
        return new SimpleRecord({value: record.value});
    }
    // Simplified add: appends the record's ta into the table's underlying array.
    add(item) {
        let rec;
        if (item instanceof SimpleRecord) {
            rec = item;
        } else if (typeof item === 'object' && item !== null && item.value !== undefined) {
            rec = this.parse_record(item);
        } else {
            throw new Error('Unsupported record type');
        }
        this.ta.set(rec.ta, this.pos_w);
        this.pos_w += rec.ta.length;
        return this.next_record_id++;
    }
    // Override records() to iterate over added records.
    *records() {
        let pos = 0;
        while (pos < this.pos_w) {
            const rta = this.ta.subarray(pos, pos + 4);
            // Recreate a record from the stored value.
            yield new SimpleRecord({value: rta[2]});
            pos += 4;
        }
    }
}

// Test the simple table.
(function () {
    // Initialize table with capacity for 10 records.

    

    const table = new SimpleTable();
    table.ta = new Int32Array(4 * 10); // 10 records
    table.pos_w = 0;
    
    // Add records.
    const id1 = table.add({value: 10});
    const id2 = table.add({value: 20});
    const id3 = table.add(new SimpleRecord({value: 30}));
    
    // Assert table length.
    assert.strictEqual(table.length, 3, 'Table should have 3 records');
    
    // Verify field values.
    const values = [];
    for (const rec of table.records()) {
        values.push(rec.field);
    }
    assert.deepStrictEqual(values, [10, 20, 30], 'Record values should match');
    
    console.log('All tests passed.');
})();
