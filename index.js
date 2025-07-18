// Entry point for the int32array-table package.

const Stringtable = require('./src/Stringtable');
const Compact_Int32Array_Table = require('./src/Compact_Int32Array_Table');
const Compact_Int32Array_Record = require('./src/Compact_Int32Array_Record');
const STA_Record_Reader = require('./src/STA_Record_Reader');

module.exports = {
    Stringtable,
    Compact_Int32Array_Table,
    Compact_Int32Array_Record,
    STA_Record_Reader,
    // ...other exports as needed...
};