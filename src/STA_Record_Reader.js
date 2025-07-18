
// And some further info about the types....?

// Could be moved much lower in the stack to /tools.




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


const map_place_record_type_name_by_id = new Map();


map_place_record_type_name_by_id.set(POINT, 'POINT');
map_place_record_type_name_by_id.set(LINESTRING, 'LINESTRING');
map_place_record_type_name_by_id.set(POLYGON, 'POLYGON');
map_place_record_type_name_by_id.set(MULTIPOLYGON, 'MULTIPOLYGON');

map_place_record_type_name_by_id.set(TABLE, 'TABLE');
map_place_record_type_name_by_id.set(NAME_VALUE_PAIR_TABLE, 'NAME_VALUE_PAIR_TABLE');

map_place_record_type_name_by_id.set(NAMED_STRINGTABLES, 'NAMED_STRINGTABLES');
map_place_record_type_name_by_id.set(STRINGTABLES, 'STRINGTABLES');

// NAME_VALUE_PAIR_TABLE
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

// Sub typed array record reader????

class STA_Record_Reader {
    constructor(spec = {}) {
        // .ta perhaps....

        this.sta = spec.sta || spec.ta;

        // But could have different bytes per element.

        // Maybe only reading from the data view would be best.


        if (this.sta && this.sta.buffer) {

            
            //console.log('this.sta.byteOffset', this.sta.byteOffset);
            //console.log('this.sta.byteOffset / 4', this.sta.byteOffset / 4);
            //console.log('this.sta.byteLength', this.sta.byteLength);
            //console.log('this.sta.BYTES_PER_ELEMENT', this.sta.BYTES_PER_ELEMENT);

            // or just slice the sta????

            //this.dv = new DataView(this.sta.slice().buffer);

            this.dv = new DataView(this.sta.buffer, this.sta.byteOffset, this.sta.byteLength);

            // and validate the length...

            const read_l = this.dv.getInt32(0);
            //console.log('read_l', read_l);
            //console.log('this.dv', this.dv);
            if (read_l !== this.dv.byteLength) {



                console.trace();

                console.log('this.dv.byteLength', this.dv.byteLength);
                console.log('read_l', read_l);

                throw 'stop';
            }

        }
        

        // read_type_id
        // read_length

        // read_int32_at_byte_pos


    }

    get record_overhead_byte_length() {
        // standard overhead is 4 * 4 for any record, for the moment.
        return 16;

        
    }

    get children() {
        // an array of them???

        // Putting them in an array???

        //   or maybe getters thet will get the various vhildren by their numbers...

        const res = [...this.iterate_child_readers];

        return res;


    }

    // iterate child records....

    get iterate_child_records() {
        const that = this;

        return (function *() {




            const my_bl = that.byte_length;

            //console.log('**** that.type_name', that.type_name);

            // But if there are 0 of them anyway...

            //  The number of child records....



            //console.log('my_bl', my_bl);

            // check for a max number???
            //   16 MB for the moment.
            // 


            const bl_extra_pre_inner = that.extra_byte_length_before_first_inner_item;

            //console.log('bl_extra_pre_inner', bl_extra_pre_inner);

            // so the amount of remaining inner space....

            const remaining_inner = (my_bl - that.record_overhead_byte_length) - bl_extra_pre_inner;

            // so those would be the child records????

            //console.log('remaining_inner', remaining_inner);

            if (remaining_inner > 0) {
                let pos = that.record_overhead_byte_length + bl_extra_pre_inner;
                //  OK, so past the very start here at least.

                // then read the length of that inner item
                //console.log('pos', pos);

                // Will need to be able to recreate itself preoperly / perfectly.

                let bl_inner_item = that.dv.getInt32(pos);
                //  is that really the length of the 1st inner item????

                //console.log('bl_inner_item', bl_inner_item);


                let next_pos = pos + bl_inner_item;

                //console.log('next_pos', next_pos);

                //  needs to be different in cases of 32 bit typed arrays...

                if (that.sta.BYTES_PER_ELEMENT === 1) {
                    let ssta = that.sta.subarray(pos, next_pos);


                    yield ssta;
                } else {
                    // is it divisible properly???

                    if (pos % that.sta.BYTES_PER_ELEMENT === 0 && 
                        next_pos % that.sta.BYTES_PER_ELEMENT === 0) {
                            let ssta = that.sta.subarray(pos / 4, next_pos / 4);
                            yield ssta;
                    } else {
                        console.trace();
                        throw 'NYI';
                    }


                }


                

                // Did it write or read the array as too long before????

                // Seems like the saved table (record) is missing its NAMED_STRINGTABLES inner record.
                //   Maybe we want a NAMED_STRINGTABLES class too?
                //     Probably not right now.


                // Or was a length even encoded wrong somewhere else?

                let i = 1;

                //console.log('my_bl', my_bl);

                while (next_pos < my_bl) {

                    pos = next_pos;

                    bl_inner_item = that.dv.getInt32(pos);

                    if (bl_inner_item === 0) {

                        console.log('i', i);
                        console.log('bl_inner_item', bl_inner_item);
                        console.log('pos', pos);
                        console.log('next_pos', next_pos);
                        console.log('my_bl', my_bl);
                        console.log('**** that.type_name', that.type_name);
                        console.trace();
                        throw 'stop';
                    }

                    // Did it overestimate the size of the table ui8a by 4?


                    // But is the bytelength of this ta too long???
                    //   Or better to use .length * 4????

                    

                    // if its length is 0?

                    next_pos = pos + bl_inner_item;
                    //console.log('next_pos', next_pos);

                    // But don't yield an empty one....

                    /*
                    if (pos === next_pos) {
                        console.trace();
                        throw 'stop';
                    }
                        */


                    // Subarray of subarray, how does that work?

                    if (that.sta.BYTES_PER_ELEMENT === 1) {
                        let ssta = that.sta.subarray(pos, next_pos);
    
    
                        yield ssta;
                    } else {
                        // is it divisible properly???
    
                        if (pos % that.sta.BYTES_PER_ELEMENT === 0 && 
                            next_pos % that.sta.BYTES_PER_ELEMENT === 0) {
                                let ssta = that.sta.subarray(pos / 4, next_pos / 4);
                                yield ssta;
                        } else {
                            console.trace();
                            throw 'NYI';
                        }
    
    
                    }

                    /*
                    console.log('[pos, next_pos]', [pos, next_pos]);
                    console.log('my_bl', my_bl);

                    ssta = that.sta.subarray(pos, next_pos);
                    yield ssta;
                    */
                    
                    i++;

                }
            } else {
                console.trace();
                throw 'NYI';
            }

            



            //console.trace();
            //throw 'stop';



        })();

    }

    get iterate_child_readers() {
        const that = this;
        return (function * () {
            for (const sta_child of that.iterate_child_records) {
                yield new STA_Record_Reader({sta: sta_child});
            }
        })();

    }

    read_int32_at_byte_pos(byte_pos) {
        const {sta, dv} = this;
        //console.log('read_int32_at_byte_pos byte_pos', byte_pos);
        //console.log('dv.length', dv.length);
        //console.log('dv.byteLength', dv.byteLength);

        return dv.getInt32(byte_pos);
    }

    // count of inner items....?

    // So some byte lengths could have been calcalated and recorded wrong.

    get extra_byte_length_before_first_inner_item() {
        // depends on the bitfield....
        let res = 0;
        if ((this.sta[15] & 1) === 1) res += 4;
        if ((this.sta[15] & 2) === 2) res += 4;

        //console.log('res', res);
        //console.trace();
        //throw 'stop';

        return res;
    }
    get expected_byte_pos_first_child_record() {
        // standard byte pos
        return 16 + this.extra_byte_length_before_first_inner_item;
    }

    get byte_pos_first_child_record() {
        const expected_pos = this.expected_byte_pos_first_child_record;
        //console.log('expected_pos', expected_pos);



        if (expected_pos <= (this.byte_length - 8)) {
            return expected_pos;
        } else {
            return -1;
        }
    }

    get first_child_record_byte_length() {
        const pos = this.byte_pos_first_child_record;
        if (pos !== -1) {
            const bl = this.read_int32_at_byte_pos(pos);
            return bl;
        }
    }

    get first_child_record_type_id() {
        const pos = this.byte_pos_first_child_record;
        if (pos !== -1) {
            const type_id = this.read_int32_at_byte_pos(pos + 4);
            return type_id;
        }
    }

    get first_child_record_type_name() {
        const id = this.first_child_record_type_id;
        return map_place_record_type_name_by_id.get(id);
    }

    // length of the first child item....?
    //   does it have a first child item?
    //     can it fit one inside???




    get byte_length() {

        // And check the byte length of the sta as well?

        return this.dv.byteLength;
        //return this.read_int32_at_byte_pos(0);
    }
    get type_id() {
        return this.read_int32_at_byte_pos(4);
    }
    get type_name() {

        //console.log('this.type_id', this.type_id);


        const type_id = this.type_id;

        if (type_id === 0) {
            console.trace();
            throw 'stop';
        }

        // Seems to be a problem with writing and reading some stringtables.


        // And why is the type id ever 0?

        return map_place_record_type_name_by_id.get(type_id);
    }

    get encoded_as_single_value_following_initial_part_of_record() {
        // its in the bitfield....

        return ((this.sta[15] & 64) === 64);

    }

    get encoded_as_single_utf8() {

        //console.log('this.sta[15]', this.sta[15]);

        // Will need to set these bits properly elsewhere.
        //   In the 'STRING_NAME' part.
        return ((this.sta[15] & 64) === 64) && ((this.sta[15] & 128) === 128);
    }


    get string_value() {
        // only if encoded as string???

        // Not encoded like that?
        //    Or will / should be by default, so there must be an existing bug?
        //      Need to indicate encoded_as_single_utf8

        if (this.encoded_as_single_utf8) {
            //const pos_start = this.expected_byte_pos_first_child_record;

            // At which byte???

            const pos_start = 16 + this.extra_byte_length_before_first_inner_item;
            //const pos_end = this.byte_length;
            //console.log('get string_value() pos_start', pos_start);

            const sta_string = this.sta.subarray(pos_start);
            //console.log('sta_string.length', sta_string.length);

            const res = new TextDecoder().decode(sta_string);
            return res;

        } else {
            console.log('this.type_name', this.type_name);

            // So, string should be utf-8 encoded.

            console.trace();
            throw 'NYI';
        }



    }

    get i32a_value() {
        // if it's encoded as a single i32array...?
        //   another bitfield for this type of encoding could be effective.

        // A bitfield for this specific type of encoding could help.
        //   and it would mean that it would also not have inner item records.
        //   a specific type of encoding that is indicated in one of the bifields.

        console.trace();
        throw 'NYI';




    }
    // count of the number of child records

    get count_child_records() {
        let res = 0;
        if (this.encoded_as_single_value_following_initial_part_of_record) {

        } else {
            // the length....
            let pos = this.byte_pos_first_child_record;

            // but is there such a first child record?

            //const l = this.byte_length;

            const better_l = this.dv.byteLength;

            //console.log('pos', pos);
            //console.log('count_child_records l', l);
            //console.log('this.dv.byteLength', this.dv.byteLength);
            //console.log('this.dv.buffer', this.dv.buffer);

            if (pos === -1) {
                return 0;
            } else {
                while (pos < (better_l - 16)) {
                    const bl_child = this.read_int32_at_byte_pos(pos);
                    //console.log('bl_child', bl_child);
                    res++;
                    const next_pos = pos + bl_child;
                    pos = next_pos;
    
    
                }
            }

        }
        return res;
    }



}

module.exports = STA_Record_Reader;