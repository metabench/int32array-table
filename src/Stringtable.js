// Dynamic array here won't be so bad. At least for now.

// Maybe the length won't be known.
//   This probably will be quite fast / fast enough for now / forever.

// Dynamic_Stringtable perhaps???

const {is_array, is_arr_of_strs} = require('lang-mini');


const STA_Record_Reader = require('./STA_Record_Reader');

const encoder = new TextEncoder();
function getByteLength(str) {
    
    const byteArray = encoder.encode(str);
    return byteArray.length;
  }


  


const TABLE = 20000;
const NAME_VALUE_PAIR_TABLE = 20010;
const STRINGTABLE = 22000;
const NAMED_STRINGTABLES = 32000;
const STRINGTABLES = 32001; // Not named specifically? Just indexed sequentually perhaps.
const STRINGS = 22001;
const STRING = 22005;
const STRING_NAME = 22205;

const INT32ARRAY = 24000;
const UINT8ARRAY = 26000;


const POINT = 8;
const LINESTRING = 9;


const POLYGON = 10;
const EXTERIOR_RING = 20;
const INTERIOR_RINGS = 40;
const INTERIOR_RING = 41;

const MULTIPOLYGON = 100;
const POLYGONS = 180;
const POINTS = 190;
const TAGS = 1000;





const BITFIELD_HAS_osm_id = 0;
const BITFIELD_osm_id_IS_64BIT = 1;
const BITFIELD_HAS_name_en = 2;
const BITFIELD_HAS_nls_name = 3;
const BITFIELD_HAS_no_language_specified_name = BITFIELD_HAS_nls_name;


  const record_bytes_overhead = 4 * 4;

class Stringtable {

    constructor(spec = {}) {

        if (is_array(spec)) {
            // And they are all strings....?

            if (is_arr_of_strs(spec)) {
                this.arr_strings = spec;
                this.map_string_ids = new Map(spec.map((v, i) => [v, i]));
                this.next_id = this.arr_strings.length;
            } else {
                console.trace();
                throw 'stop - when constructing with (arr) that array must be an array of strings.';
            }


        } else {
            this.arr_strings = [];
            this.map_string_ids = new Map();
            
            this.next_id = 0;
        }

        


    }

    ensure(string) {
        const {map_string_ids, arr_strings} = this;
        const found_id = map_string_ids.get(string);

        if (found_id === undefined) {
            arr_strings.push(string);
            const new_item_id = this.next_id++;
            map_string_ids.set(string, new_item_id);
            return new_item_id;

        } else {
            return found_id;
        }

        // does it have it already????
    }
    get_id(string) {
        const {map_string_ids, arr_strings} = this;
        const found_id = map_string_ids.get(string);

        if (found_id === undefined) {
            return -1;

        } else {
            return found_id;
        }

    }
    get_string(id) {
        return this.arr_strings[id];
        //return this.map_string_ids.get(id);
    }
    get size() {
        return this.next_id;
    }

    get bytes_estimate() {
        // once for the array of strings????
        //   or really the strings are only stored once anyway?
        const overhead_per_str = 4;

        let res = 0;

        // Plus more for overhead???
        for (const str of this.arr_strings) {
            res += getByteLength(str);
            res += overhead_per_str;
        }

        return res;







    }

    calc_size_as_ui8a() {
        let res = 0;

        

        // Something to indicate the record type?
        //   Overhead of 4? 16? right at the beginning?
        //     Could use those 32 bit / 4 byte values at the start.
        //       The length of the record....

        res += record_bytes_overhead; // the record itself

        // Plus if it has some extra fields to start with???


        // Saving the name properly as a utf8 string?
        if (this.name) {
            res += record_bytes_overhead;
            res += getByteLength(this.name);
        }



        res += record_bytes_overhead; // the STRINGS record inside it itself
        // And will actually make name value pair records....
        //   Need to go through the entries....
        //     Or maybe just need the array of strings, and then they can be put back into the map....

        for (const str of this.arr_strings) {
            // an overhead of 4 for the string.
            //   not so sure how useful the sequential ids would be here though.
            //   then there will be 64 bits left, could be useful for bitfields

            // 
            res += (record_bytes_overhead + getByteLength(str));
        }

        // Then will internally have a bunch of text records....?
        // then 

        //res += this.st_names.calc_size_as_ui8a();

        return res;
    }


    toUint8Array() {
        const l_res = this.calc_size_as_ui8a();
        //  Is the size correct????

        const res = new Uint8Array(l_res);

        let pos_w = 0;

        // But need to write 32 bit numbers to start with....

        const dv_res = new DataView(res.buffer);

        dv_res.setInt32(pos_w, l_res);
        pos_w += 4;
        dv_res.setInt32(pos_w, STRINGTABLE);
        pos_w += 4;
        pos_w += 4;
        pos_w += 4;


        

        let l_name_record = 0;

        // Possibly write the .name property.

        if (this.name) {
            // Have a STRING_NAME record or similar....

            // STRING_NAME
            // Maybe want some better record writing functons too.

            const pos_name_inner_record_and_length = pos_w;
            pos_w += 4;
            dv_res.setInt32(pos_w, STRING_NAME);
            pos_w += 4;
            pos_w += 4;

            // But then at the bitarray part....
            //   give it bit fields at 7 and 8 on the byte 0 of the bitfield.
            //     well byte 3, it's the last byte along.

            pos_w += 3;
            res[pos_w] = (res[pos_w] | 64) | 128;
            pos_w++;

            const byteArray = encoder.encode(this.name);
            res.set(byteArray, pos_w);

            pos_w += byteArray.length;
            //res[pos_name_inner_record_and_length]

            l_name_record = pos_w - pos_name_inner_record_and_length;

            // That was the bug!????
            //   Need to set 

            dv_res.setInt32(pos_name_inner_record_and_length, l_name_record);
        


            // And then the name itself






        }

        // And subtract the length of the name record 


        


        // is that a proper calculation of length of that strings record?
        //   Better to recalculate it....

        // or not....





        const l_strings_record = (l_res - l_name_record) - 16;


        dv_res.setInt32(pos_w, l_strings_record);
        pos_w += 4;
        dv_res.setInt32(pos_w, STRINGS);
        pos_w += 4;
        pos_w += 4;
        pos_w += 4;


        //   Or iteration miscalculates lengths????
        //      It shouldn't! 
        // Then write the strings into it with string records....

        ///const encoder = new TextEncoder();

        //console.log('this.arr_strings', this.arr_strings);

        // But something is definitely getting in the way of writing this data!!!

        for (const str of this.arr_strings) {
            // an overhead of 4 for the string.
            //   not so sure how useful the sequential ids would be here though.
            //   then there will be 64 bits left, could be useful for bitfields

            //const bytel_string = getByteLength(str);

            
            const byteArray = encoder.encode(str);
            const l_string = byteArray.length;
            // copy to position....
            const l_string_record = record_bytes_overhead + l_string;

            dv_res.setInt32(pos_w, l_string_record);
            pos_w += 4;
            dv_res.setInt32(pos_w, STRING);
            pos_w += 4;
            pos_w += 4;

            // But then at the bitarray part....
            //   give it bit fields at 7 and 8 on the byte 0 of the bitfield.
            //     well byte 3, it's the last byte along.


            // The bitfield (tricky!)
            pos_w += 3;
            res[pos_w] = (res[pos_w] | 64) | 128;
            pos_w++;


            //pos_w += 4;

            res.set(byteArray, pos_w);
            pos_w += l_string;



            //res += (record_bytes_overhead + getByteLength(str));

            // See about getting further info when parsing fails...???
            //   See about a validation function?


            
        }



        // Then write the 'strings' record.

        // And then writing the various other things....

        // Writing the records....
        //   A 'strings' record perhaps.
        //     That would have its own overhead.
        //       Maybe be neater, more consistent.




        
        
        //res[pos_w++] = l_res;

        //res[pos_w++] = STRINGTABLE;


        /*
        if (pos_w !== l_res) {
            console.trace();
            throw 'stop';
        }


        console.log('pos_w', pos_w);
        console.log('l_res', l_res);
        */



        return res;


    }

    /*
    get arr_strings() {
        return this.arr_strings;
    }
    */

}

const p = Stringtable.prototype;

p.get_int = p.get_id;

//p.length = p.size;

// The size of the 'NAME' records???



Stringtable.fromUint8Array = (ui8a) => {
    // Make the dataview first...

    // Want to be able to save and restore the .name property.

    const dv = new DataView(ui8a.buffer, ui8a.byteOffset);

    // Check that byte length matches the ui8a byte length...??


    const bl = dv.getInt32(0);

    if (bl !== ui8a.byteLength) {
        console.trace();
        throw 'stop';
    }

    //console.log('bl', bl);

    // Will it just have the 'strings' array inside????

    const rr = new STA_Record_Reader({sta: ui8a});

    //console.log('rr.count_child_records', rr.count_child_records);

    //console.log('rr.type_name', rr.type_name);

    if (rr.type_name === 'STRINGTABLE') {

        // Not sure why the child count of records would be wrong when a name is recorded!

        // go through the internal records...
        //   Though could look for some tags as well too....

        // The stringtable could have a 'name' property. A kind of inner record specifying its name.
        //   Lets get it saving the 'name' property.


        // Does seem better to look through these inner records???

        //     May just have the array of strings....

        // iterate the children....
        const res = new Stringtable();
        for (const rr_child of rr.iterate_child_readers) {

            if (rr_child.type_name === 'STRING_NAME') {
                // string_value
                res.name = rr_child.string_value;

            } else if (rr_child.type_name === 'STRINGS') {

                //console.log('rr_child.type_name', rr_child.type_name);

                //console.log('rr_child.count_child_records', rr_child.count_child_records);

                // And they are the 'STRING' records.
                //   Seems worth iterating through those ones...

                

                let idx = 0;
                for (const rr_str of rr_child.children) {
                    // 
                    //   But output it to console as a string???

                    //     Would have a .name that can be read?

                    //console.log('rr_str', rr_str);
                    //console.log('rr_str.string_value', rr_str.string_value);

                    const ensured_res_id = res.ensure(rr_str.string_value);

                    if (ensured_res_id === idx) {

                    } else {
                        console.trace();
                        throw 'stop';
                    }

                    idx++;
                }

                //return res;

            } else {
                console.trace();
                throw 'stop';
            }

        }


        

        return res;



    } else {
        console.log('rr.type_name', rr.type_name);
        console.trace();
        throw 'stop';
    }

    // So could iterate those rr child records.






    //console.trace();


    //throw 'stop';

}

module.exports = Stringtable;


if (require.main === module) {
    let i;
    const st1 = new Stringtable();

    st1.name = 'The Big Stringtable';

    i = st1.ensure('hi');
    i = st1.ensure('hello');

    const tast = st1.toUint8Array();
    console.log('tast', tast);

    // Then something that can decipher / decode that...

    const recreated_st1 = Stringtable.fromUint8Array(tast);

    console.log('recreated_st1', recreated_st1);

    const rtast = recreated_st1.toUint8Array();
    console.log('rtast', rtast);


    // seems to work fine....




}