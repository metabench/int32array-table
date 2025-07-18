
// Maybe have some kind of data access / iteration class somewhere else?


const {each} = require('lang-mini');

const Stringtable = require('./Stringtable');
const STA_Record_Reader = require('./STA_Record_Reader');

// Need to have simple to use functions that go through the arrays looking for and at a variety of things.
//   Possibly an OO access class too.





// Multiple stringtables grouped together could be OK here.

// Need to have the system create the array of (indexed) stringtables properly in the NVPT.

// 



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




const encoder = new TextEncoder();
function getByteLength(str) {
    
    const byteArray = encoder.encode(str);
    return byteArray.length;
  }




class Name_Value_Pair_Table {
    constructor(spec = {}) {


        // and have a 'name' property

        if (spec.name) {
            this.name = spec.name;
        }


        this.st_names = new Stringtable();
        this.arr_st_values = [];



    }

    // names property

    get names() {
        // the keys in the stringtable....

        return this.st_names.arr_strings;


    }

    ensure(name, value) {
        const name_id = this.st_names.ensure(name);
        if (this.arr_st_values.length === 0) {
            const st_name_values = new Stringtable();
            const value_under_name_id = st_name_values.ensure(value);
            this.arr_st_values.push(st_name_values);

            return [name_id, value_under_name_id];
        } else {

            //console.log('this.arr_st_values', this.arr_st_values);

            //console.log('[name, value]', [name, value]);

            //console.log('name_id', name_id);

            if (name_id === this.arr_st_values.length) {
                const st_name_values = new Stringtable();
                const value_under_name_id = st_name_values.ensure(value);
                this.arr_st_values.push(st_name_values);

                return [name_id, value_under_name_id];                

            } else {
                // should be less than the length....

                if (name_id < this.arr_st_values.length) {
                    const st_name_values = this.arr_st_values[name_id];
                    const value_under_name_id = st_name_values.ensure(value);
                    return [name_id, value_under_name_id];
                } else {
                    console.trace();
                    throw 'stop';
                }

                console.trace();
                throw 'NYI';
            }





            console.trace();
            throw 'stop';
        }
    }

    get_name_id_value_id_pair(name, value) {
        const name_id = this.st_names.get_id(name);

        if (name_id !== undefined) {
            const st_name_values = this.arr_st_values[name_id];

            if (st_name_values) {
                // Consult an array????
                const value_id = st_name_values.get_id(value);

                if (value_id !== undefined) {
                    return [name_id, value_id];
                }

            }


        }

    }


    get_name_value_pair(name_id, value_id) {
        // Should be like 'ensure' but will not create a new record if not found.

        const name = this.st_names.get_string(name_id);
        const st_name_values = this.arr_st_values[name_id];

        if (st_name_values) {
            const value = st_name_values.get_string(value_id);

            return [name, value];

        }


        // But do we even need that here???

    }

    // Need to be able to turn stringtables to uint8arrays too....

    calc_size_as_ui8a() {
        let res = 0;

        // Something to indicate the record type?
        //   Overhead of 4? 16? right at the beginning?
        //     Could use those 32 bit / 4 byte values at the start.
        //       The length of the record....





        res += 16;

        if (this.name) {
            res += 16;

            // But not as a 32 byte per item ta???

            res += getByteLength(this.name);
        }


        // Then will internally have a bunch of text records....?

        // then 

        // Overhead to say that it's a Stringtable?
        res += this.st_names.calc_size_as_ui8a();

        // then calculate the sizes of all the stringtables in the arr_st_values array...

        // a 'stringtables' record overhead here.
        res += 16;
        for (const st_values of this.arr_st_values) {

            // Will it include the extra overhead?
            res += st_values.calc_size_as_ui8a();

        }




        return res;
    }


    toUint8Array() {

        // A verified version too?


        // calculate the total length it would take....
        //   may be better to make the array holding the records first....

        /*

        const calc_size_as_ui8a = () => {
            let res = 0;

            // Something to indicate the record type?
            //   Overhead of 4? 16? right at the beginning?
            //     Could use those 32 bit / 4 byte values at the start.
            //       The length of the record....

            res += 4;
            // Then will internally have a bunch of text records....?

            // then 




            return res;
        }
            */

        const l_res = this.calc_size_as_ui8a();

        const res = new Uint8Array(l_res);
        let pos = 0;
        const dv_res = new DataView(res.buffer, res.byteOffset);
        dv_res.setInt32(pos, l_res);
        pos += 4;

        dv_res.setInt32(pos, NAME_VALUE_PAIR_TABLE);
        pos += 4;
        pos += 4;
        pos += 4;

        if (this.name) {
            //include a name string property

            const byteArray = encoder.encode(this.name);
            const l_name_string_property = 16 + byteArray.length;
            dv_res.setInt32(pos, l_name_string_property);
            pos += 4;
            dv_res.setInt32(pos, STRING_NAME);
            pos += 4;
            pos += 4;


            // But this last one is the bitfield.
            //   but could access these byte by byte....


            // have it in the position representing 32? 64? 128

            // encoded_as_single_value_following_initial_part_of_record



            /*
            res[pos+3] = res[pos+3] | 64;   // Meaning the rest of it after the initial part of the record is a single value, no child records
            res[pos+3] = res[pos+3] | 128;  // Meaning what follows is a UFT-8 string.

            pos += 4;
            */
            pos += 3;

            //dv_res.setInt32(pos, dv_res.getInt32(pos - pos_named_stringtables_start_and_length));

            res[pos] = (res[pos] | 64) | 128;
            pos++;

            // Then the name itself...
            
            res.set(byteArray, pos);
            pos += byteArray.length;
            // STRING_NAME


        }

        //console.log('pos', pos);

        // this.st_names
        //   need to write the array of that to the typed array....
        // The fact it is a stringtable is indicated.
        if (this.st_names) {
            this.st_names.names = 'st_names';
            const ta_st_names = this.st_names.toUint8Array();
            res.set(ta_st_names, pos);
            pos += ta_st_names.length;
            //console.log('ta_st_names.length', ta_st_names.length);
        }

        // Then an array of different stringtables....
        //   They each need to have a name property.


        // Maybe have some 'STRINGTABLES' type of record?
        //   And give that record the name 'arr_st_values'?

        // STRINGTABLES

        const pos_start_stringtables = pos;
        pos+=4;
        dv_res.setInt32(pos, STRINGTABLES);
        pos+=12;

        // Should set the names of the stringtables as needed???
        //   Some problem with a length mismatch being the case....


        each(this.arr_st_values, (st_value, idx) => {
            // Basically have them in there as a list of them.

            // But do these have names?
            //   No, they are sequential, for each of the values.
            const ta_st_value = st_value.toUint8Array();
            res.set(ta_st_value, pos);
            pos += ta_st_value.length;



        });
        dv_res.setInt32(pos_start_stringtables, pos - pos_start_stringtables);

        //console.log('pos', pos);
        // Then then inner records....

        // The stringtables....
        //   But including stringtables with names....

        // A 'name' property item inside a stringtable, or anything else...
        //   String value items / fields internal to records.

        // Write the various parts of this efficiently as strings....

        //console.log('Name_Value_Pair_Table toUint8Array res', res);
        if (pos !== l_res) {
            console.trace();
            throw 'stop';
        }


        //console.log('pos', pos);
        //console.log('l_res', l_res);

        //console.trace();
        //throw 'stop';
        return res;


    }



    // persist....

    // write it to a stream....

    // Getting the stringtable parts as ta / buffer data.
    //   Could make stringtable records in that same ta format with 16 bytes overhead per record (4 * int32)








    // saving the ta is relatively easy.

    // Need to also save the stringtables and maybe a few other things.
    //   pos_w for example?
    //   or that's the length of the ta that gets saved anyway.










}

// Maybe these size numbers at the beginning should always be in bytes, rather than 4 byte units.
//   It would help to avoid ambiguity when it comes to differing units, and allow for strings to be encoded well / properly.

// So will need to change some existing records structures so that the length values, while themselves in 32 bit units, are always giving the
//   measurement in 8 bit units.


// Basically need to fully fix this and everything used as a platform for the place records (the ones with the geom).



Name_Value_Pair_Table.fromUint8Array = (ui8a) => {

    // But its length in bytes or in number of 4 byte values?

    const dv = new DataView(ui8a.buffer, ui8a.byteOffset);

    // check it's the correct type....?

    const item_type_id = dv.getInt32(4);


    let res;

    //console.log('START Name_Value_Pair_Table.fromUint8Array item_type_id', item_type_id);

    if (item_type_id === NAME_VALUE_PAIR_TABLE) {

        // Need to create a res object.


        res = new Name_Value_Pair_Table();


        // Then will need to iterate through the inner items or something like that....

        // const rr = new STA_Record_Reader({sta: sta_inner});

        const rr = new STA_Record_Reader({sta: ui8a});
        //  then the number of child nodes...

        // count_child_records

        //console.log('rr.count_child_records', rr.count_child_records);




        for (const rr_child of rr.iterate_child_readers) {
            //console.log('rr_child.type_name', rr_child.type_name);

            if (rr_child.type_id === STRING_NAME) {
                //console.log('rr_child.string_value', rr_child.string_value);

                // need to set the 'name' property

                res.name = rr_child.string_value;

            } else if (rr_child.type_id === STRINGTABLES) {
                // then what to do here....
                //   Read them in order....



                for (const rr_inner_st of rr_child.iterate_child_readers) {
                    //console.log('rr_inner_st.type_name', rr_inner_st.type_name);

                    if (rr_inner_st.type_name === 'STRINGTABLE') {
                        const st_inner = Stringtable.fromUint8Array(rr_inner_st.sta);
                        res.arr_st_values.push(st_inner);


                    } else {
                        console.trace();
                        throw 'stop nyi';
                    }


                }

                //console.trace();
                //throw 'stop';



            } else if (rr_child.type_id === STRINGTABLE) {

                // // How many child nodes?
                //    What are those child nodes?

                //console.log('rr_child.count_child_records', rr_child.count_child_records);

                // Actually see about recreating that stringtable....
                //console.log('rr_child.sta', rr_child.sta);

                const revived_stringtable = Stringtable.fromUint8Array(rr_child.sta);
                //console.log('revived_stringtable', revived_stringtable);
                res.st_names = revived_stringtable;

                // but need to save that revived stringtable to the proper object.

                // At least this part works now with to/from binary.

                

                // Otherwise 'STRINGTABLES'
                //   They could be good as a list.
                //   Not sure they would all need names, they could be indexed.





                //console.log('rr_child.string_value', rr_child.string_value);
            } else {

                console.trace()

                throw 'NYI';
            }

            


        }


        // could get an array of these child record lengths....



        // for (const rr_child of rr.children) {}
        //   refer to these child nodes by type name??? by index????



        //return res;



        // But iterate through these child records as their own readers????



        // Then maybe have indexes of the end positions of all these child nodes...?




    } else {
        console.trace();
        throw 'stop';
    }

    // Will be needed by some classes that make use of the Name_Value_Pair_Table
    

    // Any length checking here???
    //console.log('END Name_Value_Pair_Table.fromUint8Array item_type_id', item_type_id);

    return res;

    // And set its 'name' property???
    //const res = new Name_Value_Pair_Table();

    //console.trace();

    //throw 'NYI';




}


module.exports = Name_Value_Pair_Table;


if (require.main === module) {


    const map_place_record_type_name_by_id = new Map();


    map_place_record_type_name_by_id.set(POINT, 'POINT');
    map_place_record_type_name_by_id.set(LINESTRING, 'LINESTRING');
    map_place_record_type_name_by_id.set(POLYGON, 'POLYGON');
    map_place_record_type_name_by_id.set(MULTIPOLYGON, 'MULTIPOLYGON');

    map_place_record_type_name_by_id.set(TABLE, 'TABLE');
    map_place_record_type_name_by_id.set(STRINGTABLE, 'STRINGTABLE');
    map_place_record_type_name_by_id.set(STRINGS, 'STRINGS');
    map_place_record_type_name_by_id.set(STRING, 'STRING');
    map_place_record_type_name_by_id.set(STRING_NAME, 'STRING_NAME');
    map_place_record_type_name_by_id.set(INT32ARRAY, 'INT32ARRAY');
    map_place_record_type_name_by_id.set(UINT8ARRAY, 'UINT8ARRAY');

    map_place_record_type_name_by_id.set(EXTERIOR_RING, 'EXTERIOR_RING');
    map_place_record_type_name_by_id.set(INTERIOR_RINGS, 'INTERIOR_RINGS');
    map_place_record_type_name_by_id.set(INTERIOR_RING, 'INTERIOR_RING');
    map_place_record_type_name_by_id.set(POLYGONS, 'POLYGONS');

    map_place_record_type_name_by_id.set(POINTS, 'POINTS');
    map_place_record_type_name_by_id.set(TAGS, 'TAGS');


    const map_place_record_type_id_by_name = new Map();
    map_place_record_type_name_by_id.forEach((v, k) => {
        map_place_record_type_id_by_name.set(v, k);
    })


    // Storing it's 'name' property as part of it.
    //   Seems like it would need an internal record of some sort.
    //     Keeping the string directly internally as utf-8 byte array.

    // OK, so here it's not recreating the names and values properly....

    const nvpt = new Name_Value_Pair_Table({name: 'nvpt'});

    nvpt.ensure('css', 'bold');
    nvpt.ensure('css', 'dynamic');
    nvpt.ensure('script', 'javascript');
    nvpt.ensure('script', 'other-engine');

    // Should reconstruct the 'name' property from the records / subrecords in the ta.

    const taui8 = nvpt.toUint8Array();
    console.log('taui8.length', taui8.length);

    // But if it doesn't have any values???

    // Some kind of RecordsReader???
    //   It could keep iterating through it???

    // See about getting a list of all the positions of the various things within it?
    //   Including the bitfields....

    // Such as, does it include a 'name' field inside?
    //   Does it include 'tags'? 
    //   Iterate inner record stas?


    function * iterate_inner_stas (taui8, pos_start = 0, pos_end = taui8.length) {
        const dv = new DataView(taui8.buffer, taui8.byteOffset);

        // get the position of the first internal item.
        //   but the 'point' type does not have one?

        // would depend on which of the bitmasks are on.
        //   32 or 32 bit bitmask would be broken down into 4 different 8 bit values.

        let pos = pos_start;

        let bl_item = dv.getInt32(pos);
        let item_type_id = dv.getInt32(pos + 4);

        //  a single byte of bit fields that would each signify an extra 4 bytes of data before its internal items begin.

        let byte_bitfield = taui8[pos + 15];

        console.log('byte_bitfield', byte_bitfield);

        let num_extra_bytes_before_first_inner_item = 0;

        if ((byte_bitfield & 1) === 1) num_extra_bytes_before_first_inner_item += 4;
        if ((byte_bitfield & 2) === 2) num_extra_bytes_before_first_inner_item += 4;

        // Then skip through...

        pos += 16;
        pos += num_extra_bytes_before_first_inner_item;

        // But then have a look at that inner item....

        console.log('pos', pos);
        while (pos < pos_end) {
            console.log('pos', pos);
            let bl_inner_item = dv.getInt32(pos);
            let inner_item_type_id = dv.getInt32(pos + 4);

            console.log('bl_inner_item', bl_inner_item);
            console.log('inner_item_type_id', inner_item_type_id);

            const inner_type_name = map_place_record_type_name_by_id.get(inner_item_type_id);
            console.log('inner_type_name', inner_type_name);

            const next_pos = pos + bl_inner_item;

            const sta_inner_item = taui8.subarray(pos, next_pos);

            yield sta_inner_item;

            // Reading inside each of these inner items though....

            // Then recursively iterate inside them?

            //   A kind of finite state machine function? 

            // But then will there be iterating within some or all of tose inner items?

            pos = next_pos;

        }
        // Then we can read the length and type id of the next (inner) record in the sequence.
        // 


    }

    // STA_Record_Reader perhaps....
    //   Could even load a class / subclass for the specific type of record.

    // 

    // And then can iterate whatever is inside those stas, in some cases.


    const iterate_taui8 = taui8 => {
        for (const sta_inner of iterate_inner_stas(taui8)) {
            console.log('');
            console.log('sta_inner.length', sta_inner.length);

            const rr = new STA_Record_Reader({sta: sta_inner});
            //console.log('rr', rr);

            console.log('rr.type_id', rr.type_id);
            console.log('rr.type_name', rr.type_name);
            console.log('rr.byte_length', rr.byte_length);

            console.log('rr.encoded_as_single_utf8', rr.encoded_as_single_utf8);
            

            if (rr.encoded_as_single_utf8) {
                console.log('rr.string_value', rr.string_value);

            } else {

                // record reader iterate child stas

                // iterate_inner_stas




                // can it iterate the child records????

                // iterate their stas....
                //iterate_taui8(sta_inner);



                // iterate_child_records

                
                // 
                console.log('rr.byte_pos_first_child_record', rr.byte_pos_first_child_record);

                console.log('rr.first_child_record_type_name', rr.first_child_record_type_name);

                console.log('rr.first_child_record_byte_length', rr.first_child_record_byte_length);
                console.log('rr.count_child_records', rr.count_child_records);

                if (rr.count_child_records > 0) {
                    let i_child = 0;
                    for (const child_record of rr.iterate_child_records) {
                        console.log('');
                        console.log('i_child', i_child);
                        console.log('child_record', child_record);

                        // but then read those child records too....

                        const inner_rr = new STA_Record_Reader({sta: child_record});

                        console.log('inner_rr.type_name', inner_rr.type_name);
                        //  But then would it actually have any values???
                        //    Could be empty when it starts....



                        // But do need to get the code working properly for the fromUint8Array

                        // There is a lot of specific code that needs to work to load and save to and from that format,
                        //   and to access it while it's in that format too.







                        i_child++;
                    }
                }



            }
            

        }
    }

    iterate_taui8(taui8);

    


    // then need to recreate it...

    const recreated_nvpt = Name_Value_Pair_Table.fromUint8Array(taui8);


    console.log('recreated_nvpt', recreated_nvpt);

    const recreated_taui8 = recreated_nvpt.toUint8Array();


    console.log('recreated_taui8.length', recreated_taui8.length);
    console.log('taui8.length', taui8.length);

    // And the size of the initial created array?





    //nvpt.name = 'nvpt';

}